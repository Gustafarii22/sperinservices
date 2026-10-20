// Isolated PREVIEW-ONLY proof. Do not ship this script in the production branch.
// Uses the same certificateScan function and the deployment's managed OPENAI_API_KEY.
// Never logs credentials, customer data, base64 images, or raw model output.
import fs from "node:fs";
import ts from "typescript";
const src = fs.readFileSync("src/lib/certificate-scan.server.ts", "utf8");
const js = ts.transpileModule(src, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {certificateScan} = await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const img=fs.readFileSync("src/assets/svc-consumer-unit.jpg").toString("base64");
let providerStatus=null,providerCode=null;
const originalFetch=globalThis.fetch;
globalThis.fetch=async (...args)=>{
 const r=await originalFetch(...args);
 if(String(args[0]).startsWith("https://api.openai.com/")){
   providerStatus=r.status;
   if(!r.ok){
     try{
       const errorBody=await r.clone().json();
       providerCode=String(errorBody?.error?.code||errorBody?.error?.type||"unknown").slice(0,80);
     }catch{providerCode="unavailable";}
   }
 }
 return r;
};
const req=new Request("https://sperinservices.co.uk/api/owner/certificate-scan",{
 method:"POST",headers:{"content-type":"application/json"},
 body:JSON.stringify({consent:true,images:["data:image/jpeg;base64,"+img]})
});
const started=Date.now();
const response=await certificateScan(req);
const body=await response.json();
const fields=Array.isArray(body.board)?body.board:[];
const circuits=Array.isArray(body.circuits)?body.circuits:[];
const confidence={
 high:circuits.flatMap(c=>c.fields||[]).filter(f=>f.confidence==="high").length,
 check:circuits.flatMap(c=>c.fields||[]).filter(f=>f.confidence==="check").length
};
const summary={
 test:"LIVE_CU_SCAN_UNMOCKED",
 endpointStatus:response.status,
 providerStatus,
 providerCode,
 elapsedSeconds:Math.round((Date.now()-started)/1000),
 boardFields:fields.length,
 proposedDevices:circuits.length,
 confidence,
 warningCount:Array.isArray(body.warnings)?body.warnings.length:0,
 message:!response.ok?String(body.error||"Request failed").slice(0,180):"Provider returned structured scan proposals"
};
console.log("SCAN_LIVE_QA_RESULT="+JSON.stringify(summary));
if(!response.ok||!Array.isArray(body.board)||!Array.isArray(body.circuits))process.exitCode=1;
