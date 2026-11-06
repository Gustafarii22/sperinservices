import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});ctx.window=ctx;ctx.self=ctx;
for(const f of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])vm.runInContext(readFileSync('public/certificates/'+f,'utf8'),ctx);
const app=readFileSync('public/certificates/app.js','utf8');
const sc=vm.createContext({window:{},document:{},navigator:{},console,localStorage:{getItem:()=>null,setItem:()=>{}}});
vm.runInContext(app.slice(0,app.indexOf('  let settings = loadSettings();'))+'\nwindow.schema=SCHEMAS.eicr;})();',sc);
const schema=sc.window.schema;
const make=n=>({type:'eicr',number:'LAYOUT-QA-'+n,fields:{clientName:'Synthetic layout verification',clientAddress:'27 Example Road\nDistrict\nBirmingham\nB00 0AA',installationAddress:'42 Example Road\nDistrict\nBirmingham\nB00 0AA',earthingDistributor:'Yes',earthingElectrode:'No',bondingToOil:'N/A',bondingToGas:false,maximumDemand:0,maximumDemandUnit:'A',inspectedBy:'QA inspector',inspectorSignature:'QA signature',inspectorAddress:'18 Example Street\nDistrict\nBirmingham\nB00 0AA',authoriserAddress:'18 Example Street\nDistrict\nBirmingham\nB00 0AA'},tables:{boards:[{ref:'DB1'}],eicrInspection:schema.sections.find(p=>p.key==='eicrInspection').defaultRows.map((r,i)=>({...r,outcome:['✓','N/A','N/V','LIM','C1','C2','C3','FI'][i%8]})),observations:[],circuits:Array.from({length:n},(_,i)=>({boardRef:'DB1',circuitNo:String(i+1),description:'Circuit '+(i+1),ocpdBs:'BS EN 60898-1',ocpdRating:'32',maxZs:'1.370'})),tests:Array.from({length:n},(_,i)=>({boardRef:'DB1',circuitNo:String(i+1),zs:i===10?'0.':i===6?'0.0000':String(i)+'.00100',rcdTime:i===6?'39. 9':'39.9'}))}});
mkdirSync('certificate-android/qa-output/layout',{recursive:true});
for(const n of [6,12,13,18,24,36])test(n+' circuits retain exact readings and paired dynamically measured pages',()=>{
 const c=make(n),before=JSON.stringify(c),d=ctx.SperinIetForms.build({cert:c,schema,editable:true});
 assert.equal(JSON.stringify(c),before);
 const details=d.__editRegions.filter(r=>r.scope==='circuit'&&r.key==='description');
 const results=d.__editRegions.filter(r=>r.scope==='test'&&r.key==='zs');
 assert.equal(details.length,n);assert.equal(results.length,n);
 const groups=rs=>Array.from(Map.groupBy(rs,r=>r.page).values(),v=>v.map(r=>r.index));
 assert.deepEqual(groups(details),groups(results));
 if(n<=13)assert.equal(groups(details).length,1,'13 ordinary circuits must share one sheet');
 for(const r of d.__editRegions){d.setPage(r.page);assert(r.y+r.height<=197.01,JSON.stringify(r));assert(r.x+r.width<=287.01,JSON.stringify(r));}
 const drawing=d.internal.pages.filter(Array.isArray).map(p=>p.join('\n')).join('\n');
 for(const reading of c.tables.tests.map(t=>t.zs))assert(drawing.includes('('+reading+')'),reading);
 writeFileSync('certificate-android/qa-output/layout/'+n+'-circuits.pdf',Buffer.from(d.output('arraybuffer')));
 console.log(JSON.stringify({circuits:n,pages:d.getNumberOfPages(),schedulePairs:groups(details).length}));
});
test('long fields, observations and multiple boards retain all original bindings',()=>{
 const c=make(24);c.fields.clientName='Long name '.repeat(20);c.fields.clientAddress='Long address line\n'.repeat(12);
 c.tables.circuits.forEach((r,i)=>{r.description='A long circuit description '.repeat(i%4+1);if(i>11)r.boardRef='DB2';});
 c.tables.boards.push({ref:'DB2',location:'A long board location '.repeat(10)});
 c.tables.tests.forEach((r,i)=>{if(i>11)r.boardRef='DB2';r.remarks='Long remark '.repeat(i%3+1);});
 c.tables.observations=['C1','C2','C3','FI'].map((code,i)=>({item:String(i+1),observation:'Observation detail '.repeat(20),code,scheduleRef:'3.1'}));
 const before=JSON.stringify(c),d=ctx.SperinIetForms.build({cert:c,schema,editable:true});assert.equal(JSON.stringify(c),before);
 for(let i=0;i<24;i++)for(const [scope,key] of [['circuit','description'],['test','zs']])assert.equal(d.__editRegions.filter(r=>r.scope===scope&&r.index===i&&r.key===key).length,1);
 writeFileSync('certificate-android/qa-output/layout/long-multiboard.pdf',Buffer.from(d.output('arraybuffer')));
});
test('explicit No and N/A are printed; legacy unticked remains unanswered; zero survives',()=>{
 const c=make(1),d=ctx.SperinIetForms.build({cert:c,schema,editable:true});
 const text=d.internal.pages.filter(Array.isArray).map(p=>p.join('\n')).join('\n');assert(text.includes('(No)'));assert(text.includes('(N/A)'));assert(text.includes('(0 A)'));
 for(const key of ['earthingDistributor','earthingElectrode','maximumDemandUnit','bondingToOil'])assert(d.__editRegions.some(r=>r.key===key),key);
});
