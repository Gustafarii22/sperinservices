import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});ctx.window=ctx;ctx.self=ctx;
for(const f of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])vm.runInContext(readFileSync('public/certificates/'+f,'utf8'),ctx);
const app=readFileSync('public/certificates/app.js','utf8');
const schemaCtx=vm.createContext({window:{},document:{},navigator:{},console,localStorage:{getItem:()=>null,setItem:()=>{}}});
vm.runInContext(app.slice(0,app.indexOf('  let settings = loadSettings();'))+'\nwindow.schemas=SCHEMAS;\n})();',schemaCtx);
// Check the actual section/table, so a similarly named field elsewhere cannot mask a gap.
const schemas=schemaCtx.window.schemas;
assert(schemas.pat.sections.find(p=>p.key==='repairs').columns.some(c=>c.key==='description'));
assert(schemas.minor.sections[0].fields.some(f=>f.key==='standardAmendedTo'));
assert(schemas.minor.sections[1].fields.some(f=>f.key==='bondingOther'));
assert(!schemas.eic.sections.flatMap(p=>p.fields||[]).some(f=>f.key==='singleSignatoryQualification'));
assert(schemas.smoke.sections.find(p=>p.title==='Commissioning & handover').fields.some(f=>f.key==='instructionsRecipient'));
const output='certificate-android/qa-output/all-forms';mkdirSync(output,{recursive:true});
for(const [type,schema] of Object.entries(schemaCtx.window.schemas)){
 const cert={type,number:'LAYOUT-QA-'+type,fields:{},tables:{}};
 for(const p of schema.sections){
  if(p.type==='section')for(const f of p.fields)cert.fields[f.key]=f.defaultValue??(f.type==='date'?'2026-11-12':f.type==='checkbox'?false:f.type==='select'?(f.options?.[0]??''):'QA '+f.key);
  else cert.tables[p.key]=JSON.parse(JSON.stringify(p.defaultRows||[]));
 }
 if(type==='minor')cert.fields.description='LONG_MINOR_START '+('Extended work description with important installation details. ').repeat(160)+' LONG_MINOR_END';
 if(type==='eicr'){cert.fields.earthingDistributor='No';cert.fields.bondingToGas='N/A';}
 if(type==='eicr')cert.tables.observations=Array.from({length:65},(_,i)=>({item:String(i+1),observation:'UNIQUE_FINDING_'+i+' '+('Detailed defect description to check wrapped rows and continuation pages. ').repeat(i===3?110:5),location:'Location '+i,code:i<40?'C1':i<50?'C2':i<60?'C3':'FI'}));
 const before=JSON.stringify(cert);const doc=ctx.SperinIetForms.build({cert,schema,settings:{},editable:true});
 assert.equal(JSON.stringify(cert),before,'PDF changed saved data '+type);
 const pages=doc.internal.pages.slice(1).map(p=>p.join('\n'));const raw=pages.join('\n');
 if(type==='minor'){assert(raw.includes('LONG_MINOR_END'));assert(doc.getNumberOfPages()>1);}
 if(type==='eicr'){
  assert(raw.includes('(No) Tj'));
  const danger=pages.findIndex(p=>p.includes('UNIQUE_FINDING_0 '));const advice=pages.findIndex(p=>p.includes('UNIQUE_FINDING_50 '));
  assert(danger>=3 && advice>danger);assert(!pages[advice].includes('C1 AND C2 OBSERVATIONS'));
  for(let i=0;i<65;i++)assert(raw.includes('UNIQUE_FINDING_'+i+' '),'Lost observation '+i);
 }
 writeFileSync(output+'/'+type+'.pdf',Buffer.from(doc.output('arraybuffer')));
 console.log('ALL_FORMS_RENDER_PRESERVATION_PASS',type,doc.getNumberOfPages());
}
