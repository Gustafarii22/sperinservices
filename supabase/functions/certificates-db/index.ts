import postgres from "npm:postgres@3.4.7";
const database=Deno.env.get("SUPABASE_DB_URL");
if(!database)throw new Error("Supabase database unavailable");
const sql=postgres(database,{prepare:false,max:2,idle_timeout:15,connect_timeout:8});
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
function encodeBytes(v:Uint8Array){
 let text="";for(let i=0;i<v.length;i+=16384)text+=String.fromCharCode(...v.subarray(i,i+16384));
 return btoa(text);
}
function clean(x:unknown):unknown {
 if(x instanceof Uint8Array)return {$sperin_binary:encodeBytes(x)};
 if(x instanceof Date)return x.toISOString();
 if(Array.isArray(x))return x.map(clean);
 if(x&&typeof x==="object")return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,clean(v)]));
 return x;
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply({error:"Unsupported method"},405);
 if(req.headers.get("origin"))return reply({error:"Direct browser access is not allowed"},403);
 const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!/^[0-9a-f]{64}$/.test(bearer))return reply({error:"Unauthorized"},401);
 try{
  const match=await sql.unsafe("select key_id from cert_private.bridge_credentials where key_id=1 and hashed_token=encode(digest($1,'sha256'),'hex') limit 1",[bearer]);
  if(!match.length)return reply({error:"Unauthorized"},401);
  const body=await req.text();if(body.length>10200000)return reply({error:"Request exceeds permitted size"},413);
  const input=JSON.parse(body),statement=input.query,params=input.params??[];
  if(typeof statement!=="string"||statement.length>16000||
     !/^\s*(select|with|update|insert|delete)\b/i.test(statement)||
     statement.includes(";")||statement.includes("/*")||statement.includes("--")||
     !Array.isArray(params)||params.length>40||JSON.stringify(params).length>9900000)
    return reply({error:"Invalid SQL query"},400);
  const result=await sql.begin(async tx=>{
    await tx.unsafe("set local role cert_bridge_worker");
    await tx.unsafe("set local statement_timeout='9000ms'");
    const rows=await tx.unsafe(statement,params);
    return rows.map(x=>clean(x));
  });
  return reply({rows:result});
 }catch(e){
  console.error("Sperin database transport error",e instanceof Error?e.name:"unknown");
  return reply({error:"Database temporarily unavailable"},503);
 }
});