// Optional paid evaluation. Requires explicit local OPENAI_API_KEY, never prints it.
// This bypasses HTTP authentication only to test the provider adapter locally.
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/lib/certificate-scan.server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {certificateScan}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const paths=process.argv.slice(2);if(!paths.length)throw Error('Pass JPEG fixture paths');
const images=paths.map(p=>'data:image/jpeg;base64,'+fs.readFileSync(p).toString('base64'));
const r=await certificateScan(new Request('https://sperinservices.co.uk/api/owner/certificate-scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({images,consent:true})}));
const result=await r.json();fs.mkdirSync('certificate-android/qa-output',{recursive:true});fs.writeFileSync('certificate-android/qa-output/live-scan.json',JSON.stringify({status:r.status,result},null,2));console.log('LIVE_SCAN_HTTP_STATUS',r.status);if(!r.ok){console.log(result.error);process.exitCode=1;}
