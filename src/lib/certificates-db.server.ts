import { neon } from "@neondatabase/serverless";
/**
 * Sperin Certificates uses an isolated Supabase database. Its Deno database
 * transport is protected by a separate 256-bit server-to-server secret and
 * only accepts restricted SQL as a reduced-privilege Postgres role.
 * No database password or transport key enters the Android APK or browser.
 */
export type CertificateSql = {query:(statement:string,params?:unknown[])=>Promise<any[]>};
function revive(value:any):any{
  if(!value||typeof value!=="object")return value;
  if(typeof value.$sperin_binary==="string"&&/^[A-Za-z0-9+/]*={0,2}$/.test(value.$sperin_binary))
    return Buffer.from(value.$sperin_binary,"base64");
  if(Array.isArray(value))return value.map(revive);
  for(const k of Object.keys(value))value[k]=revive(value[k]);
  return value;
}
export function certSql(database:string):CertificateSql{
  if(!database.startsWith("https://")){
    const direct=neon(database);
    return {query:async(statement,params=[])=>await direct.query(statement,params as any[]) as any[]};
  }
  const allowedHost=new URL(database);
  if(allowedHost.protocol!=="https:"||allowedHost.hostname!=="awbpdnyiqmtxlnoeudgf.supabase.co"||
    allowedHost.pathname!=="/functions/v1/certificates-db")
    throw Error("Certificate database bridge URL is not approved");
  return {
    async query(statement:string,params:unknown[]=[]){
      const token=process.env.SPERIN_CERT_DB_BRIDGE_SECRET||"";
      if(!/^[a-f0-9]{64}$/.test(token))throw Error("Certificate cloud service is not configured");
      const result=await fetch(database,{
        method:"POST",
        signal:AbortSignal.timeout(12000),
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({query:statement,params})
      });
      if(!result.ok)throw Error("Private certificate data unavailable");
      const data=await result.json() as {rows?:unknown[]};
      if(!Array.isArray(data.rows))throw Error("Invalid private database response");
      return data.rows.map(revive);
    }
  };
}