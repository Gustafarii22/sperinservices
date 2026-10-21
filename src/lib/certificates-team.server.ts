import { neon } from "@neondatabase/serverless";
import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual, randomUUID } from "node:crypto";
import { sendSperinEmail } from "./sperin-review-email.server";
import { certificateScan } from "./certificate-scan.server";
import { certificateAssistance } from "./certificate-ai.server";
import { certificateJobsApi, publicCertificateHandover, runCertificateReminders } from "./certificates-jobs.server";
import { certificateStripeWebhook, certificateBillingApi } from "./certificates-billing.server";

// Dedicated certificates database and tenant-aware access. Fail closed without configuration.
const cookieName="sperin_cert_session";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validEmail=(v:string)=>v.length<=254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const text=(v:unknown)=>String(v??"").trim();
const sha=(v:string)=>createHash("sha256").update(v).digest("hex");
const mac=(secret:string,value:string)=>createHmac("sha256",secret).update(value).digest("hex");
const result=(data:unknown,status=200,extra:Record<string,string>={})=>
  Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra}});
const expiry=(minutes:number)=>new Date(Date.now()+minutes*60_000).toISOString();
function settings(){
  const database=process.env.SPERIN_CERTIFICATES_DATABASE_URL||"";
  const secret=process.env.SPERIN_CERTIFICATES_AUTH_SECRET||"";
  if(!/^postgres(?:ql)?:\/\/.+/.test(database)||secret.length<40)return null;
  if(database===process.env.SPERIN_DATABASE_URL)throw Error("Never mix certificate and reviews databases");
  return {database,secret};
}
async function readBody(req:Request,maxBytes=455000){
  if(!req.headers.get("content-type")?.startsWith("application/json"))throw Error("JSON only");
  const reader=req.body?.getReader();if(!reader)throw Error("Missing request");
  const chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>maxBytes){await reader.cancel();throw Error("Oversized");}chunks.push(value);
  }}finally{reader.releaseLock();}
  const buffer=new Uint8Array(size);let i=0;
  for(const c of chunks){buffer.set(c,i);i+=c.length;}
  const value=JSON.parse(new TextDecoder().decode(buffer));
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid input");
  return value as Record<string,unknown>;
}
function sameOrigin(req:Request){
  const origin=req.headers.get("origin"),site=req.headers.get("sec-fetch-site");
  return (!origin||origin===new URL(req.url).origin)&&site!=="cross-site";
}
function sessionToken(req:Request){
  const cookies=(req.headers.get("cookie")||"").split(";").map(x=>x.trim());
  const entry=cookies.find(x=>x.startsWith(cookieName+"="));
  return entry?.slice(cookieName.length+1)||"";
}
const sessionCookie=(value:string,seconds:number)=>
  cookieName+"="+value+"; HttpOnly; Secure; SameSite=Strict; Path=/api/certificates; Max-Age="+seconds;
const canWrite=(r:string)=>["owner","supervisor","electrician"].includes(r);
const canApprove=(r:string)=>["owner","supervisor"].includes(r);
type TeamSession={email:string,orgId:string,role:string,name:string,subscriptionStatus?:string,trialEnd?:string};
async function authenticate(sql:ReturnType<typeof neon>,req:Request):Promise<TeamSession|null>{
  const token=sessionToken(req);
  if(!/^[0-9a-f]{64}$/.test(token))return null;
  const rows=await sql.query(
    "select s.email,s.org_id,m.role,o.name,o.subscription_status,o.trial_ends_at from cert_sessions s join cert_members m on m.email=s.email and m.org_id=s.org_id join cert_orgs o on o.id=s.org_id where s.session_hash=$1 and s.expires_at>now() limit 1",[sha(token)]);
  if(!rows.length)return null;
  return {email:rows[0].email,orgId:rows[0].org_id,role:rows[0].role,name:rows[0].name,subscriptionStatus:rows[0].subscription_status,trialEnd:rows[0].trial_ends_at};
}
function certificateValid(input:unknown):input is Record<string,unknown>{
  if(!input||typeof input!=="object"||Array.isArray(input))return false;
  const d=input as Record<string,unknown>;
  return typeof d.id==="string"&&uuid.test(d.id)&&typeof d.type==="string"&&d.type.length<48&&
    !!d.fields&&typeof d.fields==="object"&&!Array.isArray(d.fields)&&
    !!d.tables&&typeof d.tables==="object"&&!Array.isArray(d.tables)&&
    JSON.stringify(d).length<=450000;
}
export async function certificatesTeamApi(req:Request):Promise<Response|null>{
  const path=new URL(req.url).pathname;
  if(!path.startsWith("/api/certificates/"))return null;
  if(!["GET","POST"].includes(req.method))return result({error:"Unsupported method"},405);
  if(req.method==="POST"&&!sameOrigin(req))return result({error:"Cross-site request blocked"},403);
  let c;
  try{c=settings();}catch{return result({error:"Unsafe workspace configuration"},503);}
  if(!c)return result({error:"Cloud team workspace has not been configured. Local certificates remain available."},503);
  let payload:Record<string,unknown>={};
  if(req.method==="POST" && !path.startsWith("/api/certificates/jobs") && path!=="/api/certificates/reminders/run" && path!=="/api/certificates/billing/webhook"){try{payload=await readBody(req,path.endsWith("/scan")?15000000:path.endsWith("/ai-import")?4500000:455000);}catch{return result({error:"Invalid or oversized request"},400);}}
  const sql=neon(c.database);
  try{
    const billingWebhook=await certificateStripeWebhook(req,sql);
    if(billingWebhook)return billingWebhook;
    const publicResponse=await publicCertificateHandover(req,sql);
    if(publicResponse)return publicResponse;
    const reminderResponse=await runCertificateReminders(req,sql);
    if(reminderResponse)return reminderResponse;
    if(path==="/api/certificates/request-code"&&req.method==="POST"){
      const email=text(payload.email).toLowerCase();
      if(!validEmail(email))return result({error:"Valid email required"},400);
      const rows=await sql.query("select requested_at,last_sent_at,sends from cert_login_codes where email=$1",[email]);
      if(rows.length){
        const recent=Date.now()-new Date(rows[0].requested_at).getTime()<3600000;
        const sent=Date.now()-new Date(rows[0].last_sent_at).getTime()<60000;
        if(sent||(recent&&Number(rows[0].sends)>=5))return result({message:"If allowed, an email has been sent."});
      }
      const code=String(randomInt(100000,1000000));
      const signature=mac(c.secret,email+"|"+code);
      await sql.query(
        "insert into cert_login_codes(email,code_hash,expires_at,attempts,sends) values($1,$2,$3,0,1) on conflict(email) do update set code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,last_sent_at=now(),sends=case when cert_login_codes.requested_at<now()-interval '1 hour' then 1 else cert_login_codes.sends+1 end,requested_at=case when cert_login_codes.requested_at<now()-interval '1 hour' then now() else cert_login_codes.requested_at end",
        [email,signature,expiry(10)]);
      await sendSperinEmail(email,{
        subject:"Sperin Certificates: your sign-in code",
        text:"Your six-digit sign-in code is "+code+". It expires in 10 minutes. Never share it.",
        html:"<p>Your Sperin Certificates sign-in code: <strong>"+code+"</strong>. Expires in 10 minutes.</p>"
      },"cert-login-"+sha(email+signature).slice(0,50));
      return result({message:"If allowed, an email has been sent."});
    }
    if(path==="/api/certificates/verify-code"&&req.method==="POST"){
      const email=text(payload.email).toLowerCase(),code=text(payload.code);
      if(!validEmail(email)||!/^\d{6}$/.test(code))return result({error:"Email and six-digit code required"},400);
      const rows=await sql.query(
        "update cert_login_codes set attempts=attempts+1 where email=$1 and attempts<5 and expires_at>now() returning code_hash",
        [email]);
      if(!rows.length)return result({error:"Incorrect or expired code"},401);
      const a=Buffer.from(rows[0].code_hash,"hex"),b=Buffer.from(mac(c.secret,email+"|"+code),"hex");
      if(a.length!==b.length||!timingSafeEqual(a,b))return result({error:"Incorrect or expired code"},401);
      // Consume the one-time code and find an invitation, otherwise start a new private organisation.
      const consumed=await sql.query("delete from cert_login_codes where email=$1 and code_hash=$2 returning email",[email,rows[0].code_hash]);
      if(!consumed.length)return result({error:"Code already used"},401);
      let members=await sql.query("select org_id,role from cert_members where email=$1 order by created_at limit 1",[email]);
      if(!members.length){
        const org=await sql.query("insert into cert_orgs(name) values($1) returning id",[email]);
        await sql.query("insert into cert_members(org_id,email,role) values($1,$2,'owner')",[org[0].id,email]);
        members=[{org_id:org[0].id,role:"owner"}];
      }
      const token=randomBytes(32).toString("hex");
      await sql.query("insert into cert_sessions(session_hash,email,org_id,expires_at) values($1,$2,$3,$4)",[
        sha(token),email,members[0].org_id,expiry(60*24*14)]);
      return result({signedIn:true,email,role:members[0].role},200,{"Set-Cookie":sessionCookie(token,14*86400)});
    }
    const s=await authenticate(sql,req);
    if(!s)return result({error:"Please sign in to your certificate team."},401);
    const paid=["active","trialing"].includes(s.subscriptionStatus||"");
    const freeTrial=!!s.trialEnd&&new Date(s.trialEnd).getTime()>Date.now();
    if(req.method==="POST"&&!paid&&!freeTrial&&
       !path.startsWith("/api/certificates/billing/")&&path!=="/api/certificates/logout")
      return result({error:"Your trial has ended. Saved cloud records remain readable/exportable; subscribe to continue cloud changes and AI."},402);
    const billingResponse=await certificateBillingApi(req,sql,s);
    if(billingResponse)return billingResponse;
    if(["/api/certificates/scan","/api/certificates/ai-import","/api/certificates/ai-eicr"].includes(path)&&req.method==="POST"){
      if(payload.consent!==true)return result({error:"Explicit upload consent required"},400);
      const mode=path.endsWith("/scan")?"scan":path.endsWith("/ai-import")?"pdf":"eicr";
      if(mode==="scan"&&(!Array.isArray(payload.images)||payload.images.length<1||payload.images.length>6))
        return result({error:"Choose 1–6 consumer unit photos"},400);
      if(mode==="pdf"&&(typeof payload.file!=="string"||payload.file.length>4200000))
        return result({error:"Valid PDF input required"},400);
      if(mode==="eicr"&&(!payload.report||typeof payload.report!=="object"))
        return result({error:"EICR report required"},400);
      // First ten AI analyses per organisation/month are reserved by the server
      // atomically, preventing multiple devices bypassing the allowance.
      const period=new Date().toISOString().slice(0,7);
      const quota=await sql.query(
        "insert into cert_ai_usage(org_id,period,used) values($1,$2,1) on conflict(org_id,period) do update set used=cert_ai_usage.used+1 where cert_ai_usage.used<10 returning used",
        [s.orgId,period]);
      if(!quota.length)return result({error:"This workspace has used its ten included monthly AI analyses."},429);
      let response:Response;
      if(mode==="scan")response=await certificateScan(new Request(req.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}));
      else response=await certificateAssistance(mode,payload);
      // Failed requests must not consume a customer's ten included analyses.
      if(!response.ok)await sql.query("update cert_ai_usage set used=greatest(0,used-1) where org_id=$1 and period=$2",[s.orgId,period]);
      return response;
    }
    const jobsResponse=await certificateJobsApi(req,sql,s);
    if(jobsResponse)return jobsResponse;
    if(path==="/api/certificates/session"&&req.method==="GET")
      return result({email:s.email,organisation:s.name,role:s.role});
    if(path==="/api/certificates/logout"&&req.method==="POST"){
      await sql.query("delete from cert_sessions where session_hash=$1",[sha(sessionToken(req))]);
      return result({signedOut:true},200,{"Set-Cookie":sessionCookie("",0)});
    }
    if(path==="/api/certificates/members"&&req.method==="GET"){
      const rows=await sql.query("select email,role,created_at from cert_members where org_id=$1 order by created_at",[s.orgId]);
      return result({members:rows});
    }
    if(path==="/api/certificates/invite"&&req.method==="POST"){
      if(!canApprove(s.role))return result({error:"Supervisor required"},403);
      const email=text(payload.email).toLowerCase(),role=text(payload.role||"electrician");
      if(!validEmail(email)||!["electrician","supervisor","viewer"].includes(role))
        return result({error:"Invalid team member"},400);
      await sql.query("insert into cert_members(org_id,email,role,invited_by) values($1,$2,$3,$4) on conflict(org_id,email) do nothing",
        [s.orgId,email,role,s.email]);
      return result({invited:true,message:"Invited member can sign in using their verified email address."});
    }
    if(path==="/api/certificates/docs"&&req.method==="GET"){
      const query=new URL(req.url),offset=Math.max(0,Math.min(50000,Math.floor(Number(query.searchParams.get("offset")||0)||0)));
      const documents=await sql.query(
        "select id,record,revision,status,updated_at,created_by,approved_by from cert_documents where org_id=$1 order by updated_at desc,id limit 100 offset $2",
        [s.orgId,offset]);
      return result({documents,hasMore:documents.length===100,nextOffset:offset+documents.length});
    }
    if(path==="/api/certificates/docs"&&req.method==="POST"){
      if(!canWrite(s.role))return result({error:"No edit permission"},403);
      const doc=payload.record,rev=Number(payload.expectedRevision);
      if(!certificateValid(doc)||!Number.isInteger(rev)||rev<0)return result({error:"Invalid certificate / revision"},400);
      const json=JSON.stringify(doc),id=String(doc.id),digest=sha(json);
      if(rev===0){
        const created=await sql.query(
          "with saved as (insert into cert_documents(id,org_id,record,created_by,updated_by) values($1,$2,$3::jsonb,$4,$4) on conflict(id) do nothing returning id,revision), audit as (insert into cert_audit(org_id,document_id,revision,action,actor,data_hash) select $2,id,revision,'create',$4,$5 from saved returning id) select saved.revision from saved join audit on true",
          [id,s.orgId,json,s.email,digest]);
        if(!created.length)return result({error:"Existing cloud copy. Download changes first; nothing overwritten."},409);
        return result({id,revision:created[0].revision,status:"draft"});
      }
      const updated=await sql.query(
        "with saved as (update cert_documents set record=$3::jsonb,revision=revision+1,updated_by=$4,updated_at=now() where id=$1 and org_id=$2 and revision=$5 and status='draft' returning id,revision), audit as (insert into cert_audit(org_id,document_id,revision,action,actor,data_hash) select $2,id,revision,'update',$4,$6 from saved returning id) select saved.revision from saved join audit on true",
        [id,s.orgId,json,s.email,rev,digest]);
      if(!updated.length)return result({error:"Revision conflict or submitted document. Changes NOT overwritten."},409);
      return result({id,revision:updated[0].revision,status:"draft"});
    }
    const match=path.match(/^\/api\/certificates\/docs\/([0-9a-f-]{36})\/(submit|approve)$/i);
    if(match&&req.method==="POST"&&uuid.test(match[1])){
      const id=match[1],action=match[2],rev=Number(payload.expectedRevision);
      if(!Number.isInteger(rev)||rev<1)return result({error:"Expected revision required"},400);
      if(action==="submit"){
        if(!canWrite(s.role))return result({error:"Cannot submit"},403);
        const rows=await sql.query(
          "with saved as (update cert_documents set status='submitted',submitted_by=$3,revision=revision+1,updated_at=now(),updated_by=$3 where id=$1 and org_id=$2 and revision=$4 and status='draft' returning id,revision,record), audit as (insert into cert_audit(org_id,document_id,revision,action,actor,data_hash) select $2,id,revision,'submit',$3,md5(record::text) from saved returning id) select saved.revision from saved join audit on true",
          [id,s.orgId,s.email,rev]);
        if(!rows.length)return result({error:"Certificate changed or already submitted"},409);
        return result({id,revision:rows[0].revision,status:"submitted"});
      }
      if(!canApprove(s.role)||payload.confirmed!==true)
        return result({error:"A supervisor's explicit review is required"},403);
      const rows=await sql.query(
        "with saved as (update cert_documents set status='approved',approved_by=$3,approved_at=now(),revision=revision+1,updated_at=now(),updated_by=$3 where id=$1 and org_id=$2 and revision=$4 and status='submitted' and submitted_by<>$3 returning id,revision,record), audit as (insert into cert_audit(org_id,document_id,revision,action,actor,data_hash) select $2,id,revision,'approve',$3,md5(record::text) from saved returning id) select saved.revision from saved join audit on true",
        [id,s.orgId,s.email,rev]);
      if(!rows.length)return result({error:"Requires unchanged submitted document and a DIFFERENT supervisor"},409);
      return result({id,revision:rows[0].revision,status:"approved"});
    }
    return result({error:"Unknown team route"},404);
  }catch(e){
    console.error("Certificate cloud request failed",e instanceof Error?e.name:"unknown");
    return result({error:"Team service temporarily unavailable. Offline records have not been modified."},503);
  }
}
