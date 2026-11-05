import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});
ctx.window=ctx;ctx.self=ctx;
for(const file of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])vm.runInContext(readFileSync('public/certificates/'+file,'utf8'),ctx);
const cert={type:'eic',number:'QA',fields:{clientName:'Preserve client',signatoryMode:'One person',singleSignatoryName:'Inspector',maximumDemand:'60',maximumDemandUnit:'A'},tables:{boards:[{ref:'DB1'},{ref:'DB2'}],eicInspection:Array.from({length:15},(_,i)=>({item:String(i+1),description:'Inspection '+i,outcome:'✓'})),circuits:Array.from({length:27},(_,i)=>({boardRef:i<25?'DB1':'DB2',circuitNo:String(27-i),description:'Circuit '+i,ocpdRating:'32'})),tests:Array.from({length:27},(_,i)=>({circuitNo:String(27-i),zs:'0.'+i}))}};
const schema={standard:'QA',sections:[]};
const before=JSON.stringify(cert);
const plain=ctx.SperinIetForms.build({cert,schema});
const editable=ctx.SperinIetForms.build({cert,schema,editable:true});
test('editing regions do not change a single PDF drawing command or saved value',()=>{
 assert.deepEqual(editable.internal.pages,plain.internal.pages);
 assert.equal(JSON.stringify(cert),before);
 assert.equal(editable.getNumberOfPages(),plain.getNumberOfPages());
});
test('every measured editing region lies inside its actual PDF page',()=>{
 assert(editable.__editRegions.length>500);
 for(const r of editable.__editRegions){
  editable.setPage(r.page);assert(r.x>=0&&r.y>=0&&r.width>0&&r.height>0);
  assert(r.x+r.width<=editable.internal.pageSize.getWidth()+.01,JSON.stringify(r));
  assert(r.y+r.height<=editable.internal.pageSize.getHeight()+.01,JSON.stringify(r));
 }
});
test('multi-board sorted and continued circuit cells retain their original data indices',()=>{
 const rs=editable.__editRegions;
 for(let i=0;i<27;i++){
  assert.equal(rs.filter(r=>r.scope==='circuit'&&r.index===i&&r.key==='description').length,1);
  assert.equal(rs.filter(r=>r.scope==='test'&&r.index===i&&r.key==='zs').length,1);
 }
 assert(rs.find(r=>r.scope==='circuit'&&r.key==='description').index===24);
 assert(rs.some(r=>r.scope==='board'&&r.index===1&&r.key==='zdb'));
});
test('shared signatory and combined fields remain separately editable',()=>{
 for(const key of ['singleSignatoryName','singleSignatorySignature','maximumDemand','maximumDemandUnit','mainRcdType','mainRcdIdn','mainRcdDelay'])assert(editable.__editRegions.some(r=>r.key===key),key);
 assert.equal(editable.__editRegions.filter(r=>r.kind==='eicInspection'&&r.key==='outcome').length,15);
});
