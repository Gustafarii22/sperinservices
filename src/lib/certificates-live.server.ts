import { neon } from "@neondatabase/serverless";
type SQL=ReturnType<typeof neon>;
type Member={email:string,orgId:string,role:string,name:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error=(x:string,status=400)=>Response.json({error:x},{status,headers:{"Cache-Control":"no-store"}});
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
function pathAllowed(p:unknown):p is string[] {
  if(!Array.isArray(p)||p.length<2||p.length>4||p.some(x=>typeof x!=="string"||x.length>80||!x||x==="__proto__"||x==="constructor"||x==="prototype"))return false;
  if(p[0]==="fields")return p.length===2&&/^[a-zA-Z][a-zA-Z0-9]{0,65}$/.test(p[1])&&!/signature|declaration|approved|status|number/i.test(p[1]);
  if(p[0]==="tables")return p.length===4&&/^[a-zA-Z][a-zA-Z0-9]{0,60}$/.test(p[1])&&/^(0|[1-9]\d{0,2})$/.test(p[2])&&Number(p[2])<300&&/^[a-zA-Z][a-zA-Z0-9]{0,65}$/.test(p[3])&&!/approved|signature/i.test(p[3]);
  return false;
}
function scalar(v:unknown){return v===null||typeof v==="string"&&v.length<=2500||typeof v==="boolean"||typeof v==="number"&&Number.isFinite(v);}
export async function certificateLiveApi(req:Request,sql:SQL,user:Member):Promise<Response|null>{
  const url=new URL(req.url),parts=url.pathname.match(/^\/api\/certificates\/live\/([0-9a-f-]{36})$/i);
  if(!parts)return null;
  const docId=parts[1];if(!uuid.test(docId))return error("Invalid certificate reference");
  if(!["GET","POST"].includes(req.method))return error("Unsupported method",405);
  if(req.method==="GET"){
    const after=Number(url.searchParams.get("after")||0);
    if(!Number.isSafeInteger(after)||after<0)return error("Invalid event cursor");
    const doc=await sql.query("select id,revision,status from cert_documents where org_id=$1 and id=$2",[user.orgId,docId]);
    if(!doc.length)return error("Upload this certificate to your private team workspace before collaboration",404);
    const [events,presence]=await Promise.all([
      sql.query("select id,field_path,previous_value,new_value,actor,edited_at,revision from cert_live_edits where org_id=$1 and document_id=$2 and id>$3 order by id limit 200",[user.orgId,docId,after]),
      sql.query("select email,last_seen from cert_live_presence where org_id=$1 and document_id=$2 and last_seen>now()-interval '35 seconds' order by last_seen desc",[user.orgId,docId])
    ]);
    return response({events,presence,revision:doc[0].revision,status:doc[0].status,hasMore:events.length===200});
  }
  if(!["owner","supervisor","electrician"].includes(user.role))return error("Editing permission required",403);
  let input:Record<string,unknown>;
  try {
    if(!req.headers.get("content-type")?.startsWith("application/json"))return error("JSON required");
    const txt=await req.text();
    if(txt.length>11000)return error("Request too large",413);
    input=JSON.parse(txt);
    if(!input||typeof input!=="object"||Array.isArray(input))return error("Invalid request");
  }catch{return error("Invalid request");}
  if(input.kind==="heartbeat"){
    const rows=await sql.query("with doc as (select id from cert_documents where org_id=$1 and id=$2 and status='draft') insert into cert_live_presence(org_id,document_id,email) select $1,id,$3 from doc on conflict(org_id,document_id,email) do update set last_seen=now() returning email",[user.orgId,docId,user.email]);
    return rows.length?response({present:true}):error("Only draft cloud certificates allow collaborative editing",409);
  }
  if(input.kind!=="patch"||!pathAllowed(input.path)||!scalar(input.value)||!scalar(input.previous))
    return error("Invalid field path or value: only individual verified text/number/boolean cells may be edited.");
  if(input.value===input.previous)return response({unchanged:true});
  const path=input.path as string[],value=JSON.stringify(input.value),previous=JSON.stringify(input.previous);
  // Verify the exact prior value, not whole-document revision. Two engineers may
  // safely edit DIFFERENT fields concurrently without racing or losing data.
  const rows=await sql.query(
    "with changed as (update cert_documents set record=jsonb_set(record,$3::text[],$4::jsonb,false),revision=revision+1,updated_at=now(),updated_by=$6 where id=$1 and org_id=$2 and status='draft' and record#>$3::text[] is not distinct from $5::jsonb returning id,revision), recorded as (insert into cert_live_edits(org_id,document_id,revision,field_path,previous_value,new_value,actor) select $2,id,revision,$3::text[],$5::jsonb,$4::jsonb,$6 from changed returning id) select changed.revision,recorded.id as event_id from changed join recorded on true",
    [docId,user.orgId,path,value,previous,user.email]);
  if(!rows.length)return error("This field has changed in the cloud, is missing, or the certificate is awaiting approval. Your local value was preserved for review.",409);
  await sql.query("insert into cert_live_presence(org_id,document_id,email) values($1,$2,$3) on conflict(org_id,document_id,email) do update set last_seen=now()",[user.orgId,docId,user.email]);
  return response({saved:true,revision:rows[0].revision,eventId:rows[0].event_id,editor:user.email});
}