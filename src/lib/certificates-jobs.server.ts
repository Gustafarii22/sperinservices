import { certSql } from "./certificates-db.server";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { sendSperinEmail } from "./sperin-review-email.server";

type SQL=ReturnType<typeof certSql>;
type Member={email:string,orgId:string,role:string,name:string};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN=/^[0-9a-f]{64}$/i;
const sha=(v:string)=>createHash("sha256").update(v).digest("hex");
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const canWrite=(r:string)=>["owner","supervisor","electrician"].includes(r);
const canShare=(r:string)=>["owner","supervisor"].includes(r);
function safeDetails(x:unknown):x is Record<string,unknown>{
  if(!x||typeof x!=="object"||Array.isArray(x))return false;
  const s=JSON.stringify(x);
  return s.length<=18000 && !["__proto__","prototype","constructor"].some(k=>Object.hasOwn(x,k));
}
function parseDataUrl(encoded:unknown,kind:"pdf"|"image"){
  const s=String(encoded??"");
  const limit=kind==="pdf"?8_000_000:3_000_000;
  if(s.length>limit||s.length<25)throw Error("File too large or empty");
  const m=/^data:(application\/pdf|image\/jpeg|image\/png|image\/webp)(?:;filename=[^;,]{1,90})?;base64,([A-Za-z0-9+/=]+)$/.exec(s);
  if(!m)throw Error("Unsupported file encoding");
  if(kind==="pdf"&&m[1]!=="application/pdf"||kind==="image"&&!m[1].startsWith("image/"))
    throw Error("Unsupported file type");
  const bytes=Buffer.from(m[2],"base64");
  if(bytes.length>(kind==="pdf"?6_000_000:2_200_000))throw Error("File exceeds limit");
  const pdf=bytes.subarray(0,5).toString()==="%PDF-";
  const jpg=bytes[0]===0xff&&bytes[1]===0xd8;
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP";
  if(kind==="pdf"&&!pdf||kind==="image"&&!(jpg||png||webp))throw Error("File signature invalid");
  if(kind==="image"&&!(m[1]==="image/jpeg"&&jpg||m[1]==="image/png"&&png||m[1]==="image/webp"&&webp))
    throw Error("Image MIME does not match bytes");
  return {mime:m[1],bytes};
}
async function read(req:Request){
  if(!req.headers.get("content-type")?.startsWith("application/json"))throw Error("JSON required");
  const reader=req.body?.getReader();if(!reader)throw Error("Missing body");
  let len=0;const chunks:Uint8Array[]=[];
  try{for(;;){const {value,done}=await reader.read();if(done)break;len+=value.byteLength;
      if(len>8_200_000){await reader.cancel();throw Error("Too large");}chunks.push(value);
  }}finally{reader.releaseLock();}
  const bytes=new Uint8Array(len);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.length;}
  const x=JSON.parse(new TextDecoder().decode(bytes));
  if(!x||typeof x!=="object"||Array.isArray(x))throw Error("JSON object required");
  return x as Record<string,unknown>;
}
const str=(x:unknown,max=180)=>typeof x==="string"?x.trim().slice(0,max):"";
function deliveryLabel(x:unknown){return str(x,90).replace(/[\r\n<>]/g," ").trim();}
const safeFilename=(x:unknown)=>str(x,90).replace(/[^a-z0-9._-]/gi,"_").replace(/^\.+/,"")||"certificate.pdf";
function noStore(headers:Record<string,string>){return {...headers,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};}
export async function publicCertificateHandover(req:Request,sql:SQL):Promise<Response|null>{
  const path=new URL(req.url).pathname;
  const match=path.match(/^\/api\/certificates\/handover\/([0-9a-f]{64})(?:\/file\/([0-9a-f-]{36}))?$/i);
  if(!match)return null;
  if(req.method!=="GET")return json({error:"Method not allowed"},405);
  const token=match[1],fileId=match[2];
  const link=await sql.query(
    "select id,expires_at from cert_handover_links where token_hash=$1 and expires_at>now() and revoked_at is null limit 1",
    [sha(token)]);
  if(!link.length)return new Response("This handover link is expired, revoked or unavailable.",{status:404,headers:noStore({"Content-Type":"text/plain; charset=utf-8"})});
  if(fileId){
    if(!UUID.test(fileId))return json({error:"Not found"},404);
    const rows=await sql.query("select filename,mime_type,body from cert_handover_files where link_id=$1 and id=$2 limit 1",
      [link[0].id,fileId]);
    if(!rows.length)return json({error:"File not found"},404);
    const bytes=Buffer.isBuffer(rows[0].body)?rows[0].body:Buffer.from(rows[0].body);
    return new Response(new Uint8Array(bytes),{headers:noStore({
      "Content-Type":"application/pdf","Content-Disposition":'attachment; filename="'+safeFilename(rows[0].filename)+'"',
      "Content-Security-Policy":"default-src 'none'; sandbox"
    })});
  }
  const files=await sql.query("select id,label,filename from cert_handover_files where link_id=$1 order by label",[link[0].id]);
  const html='<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sperin Certificates — Secure Handover</title>'+
    '<main><h1>Electrical certificate handover</h1><p>These documents were shared by your electrician. The link expires on '+esc(new Date(link[0].expires_at).toLocaleDateString("en-GB",{timeZone:"Europe/London"}))+'.</p>'+
    '<ul>'+files.map(f=>'<li><a href="/api/certificates/handover/'+token+'/file/'+encodeURIComponent(f.id)+'">'+esc(f.label)+' — '+esc(f.filename)+'</a></li>').join("")+'</ul>'+
    '<p>Read these documents carefully. Contact the issuing electrician about missing information or defects. Access is limited to the holder of this link.</p></main></html>';
  return new Response(html,{headers:noStore({"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"})});
}
export async function runCertificateReminders(req:Request,sql:SQL):Promise<Response|null>{
  if(new URL(req.url).pathname!=="/api/certificates/reminders/run")return null;
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const expected=process.env.SPERIN_CERT_REMINDER_CRON_SECRET||"";
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(expected.length<40||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))
    return json({error:"Unauthorized"},401);
  const rows=await sql.query("select r.id,r.kind,r.description,r.due_date,r.engineer_email,j.details from cert_reminders r join cert_jobs j on j.id=r.job_id and j.org_id=r.org_id where r.active=true and r.due_date between current_date and current_date+30 order by r.due_date limit 100");
  let sent=0,failed=0;
  for(const r of rows){
    const due=new Date(r.due_date),today=new Date(new Date().toISOString().slice(0,10));
    const days=Math.round((due.getTime()-today.getTime())/86400000);
    if(![30,7,0].includes(days))continue;
    const reserve=await sql.query("insert into cert_reminder_sent(reminder_id,notice_days,due_date) values($1,$2,$3) on conflict do nothing returning reminder_id",[r.id,days,r.due_date]);
    if(!reserve.length)continue;
    const kind=str(r.kind,24).toUpperCase(),place=str(r.details?.siteName||"site",75);
    const subject="Sperin Certificates: "+kind+" due "+(days?"in "+days+" days":"today");
    try{
      await sendSperinEmail(r.engineer_email,{
        subject,text:kind+" inspection/service for "+place+" is due on "+new Date(r.due_date).toLocaleDateString("en-GB")+".\n"+r.description+"\nSign in to Sperin Certificates to review the actual records.",
        html:"<h2>"+esc(subject)+"</h2><p>"+esc(r.description)+"</p><p>Review the certificate and evidence in your secure workspace.</p>"
      },"cert-due-"+sha(r.id+"|"+r.due_date+"|"+days).slice(0,50));
      sent++;
    }catch{
      await sql.query("delete from cert_reminder_sent where reminder_id=$1 and notice_days=$2 and due_date=$3",[r.id,days,r.due_date]);
      failed++;
    }
  }
  return json({processed:rows.length,sent,failed});
}
export async function certificateJobsApi(req:Request,sql:SQL,user:Member):Promise<Response|null>{
  const path=new URL(req.url).pathname;
  if(!path.startsWith("/api/certificates/jobs")&&!path.startsWith("/api/certificates/assets"))return null;
  if(!["GET","POST"].includes(req.method))return json({error:"Unsupported method"},405);
  const parts=path.split("/").filter(Boolean);
  let input:Record<string,unknown>={};
  if(req.method==="POST"){try{input=await read(req);}catch{return json({error:"Invalid request or oversized file"},400);}}
  try{
    if(path==="/api/certificates/jobs"&&req.method==="GET"){
      const rows=await sql.query("select id,asset_id,details,revision,updated_at,updated_by from cert_jobs where org_id=$1 order by updated_at desc limit 300",[user.orgId]);
      return json({jobs:rows});
    }
    if(path==="/api/certificates/jobs"&&req.method==="POST"){
      if(!canWrite(user.role))return json({error:"Read-only member"},403);
      const id=str(input.id,50)||randomUUID();
      if(!UUID.test(id)||!safeDetails(input.details))return json({error:"Invalid job details"},400);
      const revision=Number(input.expectedRevision??0),body=JSON.stringify(input.details),assetId=str(input.assetId,50);
      if(!Number.isInteger(revision)||revision<0||!UUID.test(assetId))return json({error:"Revision and asset ID required"},400);
      if(revision===0){
        const rows=await sql.query("insert into cert_jobs(id,org_id,asset_id,details,updated_by) values($1,$2,$3,$4::jsonb,$5) on conflict(id) do nothing returning id,asset_id,revision",
          [id,user.orgId,assetId,body,user.email]);
        if(!rows.length)return json({error:"Job already exists. Reload before editing."},409);
        return json(rows[0]);
      }
      const rows=await sql.query("update cert_jobs set details=$3::jsonb,revision=revision+1,updated_at=now(),updated_by=$4 where id=$1 and org_id=$2 and revision=$5 returning id,asset_id,revision",
        [id,user.orgId,body,user.email,revision]);
      if(!rows.length)return json({error:"Job was changed on another device. Nothing overwritten."},409);
      return json(rows[0]);
    }
    const id=parts[3];
    if(parts[2]==="assets"&&req.method==="GET"&&UUID.test(id||"")){
      const rows=await sql.query("select id,asset_id,details,revision from cert_jobs where org_id=$1 and asset_id=$2",[user.orgId,id]);
      if(!rows.length)return json({error:"Asset not found"},404);
      return json({job:rows[0]});
    }
    if(parts[2]!=="jobs"||!UUID.test(id||""))return json({error:"Unknown job route"},404);
    if(parts[4]==="evidence"&&req.method==="GET"&&!parts[5]){
      const rows=await sql.query("select id,label,circuit_ref,observation_ref,document_id,file_type,uploaded_by,created_at from cert_evidence where org_id=$1 and job_id=$2 order by created_at desc",[user.orgId,id]);
      return json({evidence:rows});
    }
    if(parts[4]==="evidence"&&parts[5]&&req.method==="GET"&&UUID.test(parts[5])){
      const rows=await sql.query("select file_type,body from cert_evidence where org_id=$1 and job_id=$2 and id=$3 limit 1",[user.orgId,id,parts[5]]);
      if(!rows.length)return json({error:"Evidence not found"},404);
      const bytes=Buffer.isBuffer(rows[0].body)?rows[0].body:Buffer.from(rows[0].body);
      return new Response(new Uint8Array(bytes),{headers:noStore({"Content-Type":rows[0].file_type})});
    }
    if(parts[4]==="evidence"&&req.method==="POST"){
      if(!canWrite(user.role))return json({error:"Read-only member"},403);
      const file=parseDataUrl(input.file,"image"),eid=randomUUID();
      const ref=str(input.circuitRef,80),obs=str(input.observationRef,80),docId=str(input.documentId,60);
      if(docId&&!UUID.test(docId))return json({error:"Invalid certificate reference"},400);
      const rows=await sql.query("insert into cert_evidence(id,org_id,job_id,document_id,file_type,label,circuit_ref,observation_ref,uploaded_by,body) select $1,j.org_id,j.id,$3::uuid,$4,$5,$6,$7,$8,decode($9,'base64') from cert_jobs j where j.id=$2 and j.org_id=$10 returning id,created_at",
        [eid,id,docId||null,file.mime,deliveryLabel(input.label),ref,obs,user.email,file.bytes.toString("base64"),user.orgId]);
      if(!rows.length)return json({error:"Job not found"},404);
      return json({id:eid,...rows[0]},201);
    }
    if(parts[4]==="reminders"&&req.method==="GET"){
      const rows=await sql.query("select id,kind,description,due_date,engineer_email,active from cert_reminders where org_id=$1 and job_id=$2 order by due_date",[user.orgId,id]);
      return json({reminders:rows});
    }
    if(parts[4]==="reminders"&&req.method==="POST"){
      if(!canWrite(user.role))return json({error:"Read-only member"},403);
      const kind=str(input.kind,20),due=str(input.dueDate,12),email=str(input.engineerEmail,254).toLowerCase();
      if(!["eicr","emergency","fire","pat","ev","solar","custom"].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))||
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return json({error:"Check reminder type, date and engineer email"},400);
      const rows=await sql.query("insert into cert_reminders(org_id,job_id,kind,description,due_date,engineer_email) select org_id,id,$3,$4,$5::date,$6 from cert_jobs where id=$1 and org_id=$2 returning id",
        [id,user.orgId,kind,deliveryLabel(input.description),due,email]);
      if(!rows.length)return json({error:"Job not found"},404);
      return json(rows[0],201);
    }
    if(parts[4]==="handover"&&parts[5]==="list"&&req.method==="GET"){
      if(!canShare(user.role))return json({error:"Supervisor access required"},403);
      const rows=await sql.query("select id,customer_email,expires_at,revoked_at,created_at from cert_handover_links where org_id=$1 and job_id=$2 order by created_at desc limit 60",[user.orgId,id]);
      return json({links:rows});
    }
    if(parts[4]==="handover"&&parts[5]&&parts[6]==="revoke"&&req.method==="POST"&&UUID.test(parts[5])){
      if(!canShare(user.role))return json({error:"Supervisor access required"},403);
      const rows=await sql.query("update cert_handover_links set revoked_at=now() where id=$1 and org_id=$2 and job_id=$3 and revoked_at is null returning id",[parts[5],user.orgId,id]);
      return rows.length?json({revoked:true}):json({error:"Link not found"},404);
    }
    if(parts[4]==="handover"&&req.method==="POST"&&!parts[5]){
      if(!canShare(user.role)||input.consent!==true)return json({error:"Supervisor and explicit customer-sharing consent required"},403);
      const email=str(input.customerEmail,254).toLowerCase();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return json({error:"Customer email required"},400);
      const file=parseDataUrl(input.pdf,"pdf");
      const token=randomBytes(32).toString("hex"),expires=new Date(Date.now()+7*86400000);
      const link=await sql.query("insert into cert_handover_links(org_id,job_id,token_hash,customer_email,expires_at,created_by) select org_id,id,$3,$4,$5,$6 from cert_jobs where id=$1 and org_id=$2 returning id",
        [id,user.orgId,sha(token),email,expires.toISOString(),user.email]);
      if(!link.length)return json({error:"Job not found"},404);
      const name=safeFilename(input.filename);
      await sql.query("insert into cert_handover_files(link_id,org_id,label,filename,mime_type,body) values($1,$2,$3,$4,'application/pdf',decode($5,'base64'))",
        [link[0].id,user.orgId,deliveryLabel(input.label)||"Certificate / handover pack",name,file.bytes.toString("base64")]);
      const url=new URL("/api/certificates/handover/"+token,req.url).href;
      try{
        await sendSperinEmail(email,{
          subject:"Your electrical documents — Sperin Certificates",
          text:"Your electrician shared an electrical handover document. Use this private link (expires in 7 days):\n"+url+"\nDo not forward it to anyone who should not see the certificate.",
          html:"<h2>Your electrical documents</h2><p>Secure handover link (expires in seven days): <a href=\""+esc(url)+"\">Open documents</a></p><p>Keep this link private.</p>"
        },"cert-handover-"+link[0].id);
      }catch{
        await sql.query("update cert_handover_links set revoked_at=now() where id=$1 and org_id=$2",[link[0].id,user.orgId]);
        return json({error:"Email delivery failed, so the link has been revoked. No document was shared."},502);
      }
      return json({sent:true,id:link[0].id,expiresAt:expires.toISOString()});
    }
    return json({error:"Unknown job operation"},404);
  }catch(e){
    console.error("Certificate job operation failed",e instanceof Error?e.name:"unknown");
    return json({error:"Could not complete job operation. Local records are unchanged."},503);
  }
}
