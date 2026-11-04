import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('public/certificates/app.js','utf8');
const names=['circuitDesign','boardDesign','cleanTemplate','calculateMaxZs','recalculateCircuitZs','supplyDeviceDisplay','setSupplyDevice','syncCircuitRows'];
const snippets=names.map(name=>{
 const start=source.indexOf('  function '+name+'(');
 assert(start>=0,'Missing production function '+name);
 const firstEnd=source.indexOf('\n',start);
 const end=source.slice(start,firstEnd).endsWith('}')?firstEnd:source.indexOf('\n  }',start)+4;
 return source.slice(start,end);
});
const ctx=vm.createContext({uid:()=> 'new-id',isRecord:v=>v!==null&&typeof v==='object'&&!Array.isArray(v)});
vm.runInContext(snippets.join('\n'),ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
test('full templates preserve all circuit data and tests through clean/save/reload; design-only stays blank',()=>{
 const t={id:'t',name:'All',includeResults:true,design:{description:'Main',installMethod:'legacy',maxZs:'1.21',maxZsManual:true,custom:{note:'retain'}},tests:{r1:'0.2',r2:'0.4',r2only:'0.9',remarks:'Existing',irLE:'299'}};
 assert.deepEqual(plain(ctx.cleanTemplate('circuit',ctx.cleanTemplate('circuit',t))),t);
 const basic=plain(ctx.cleanTemplate('circuit',{...t,includeResults:false}));assert.equal(basic.tests,undefined);assert.equal(basic.design.maxZs,undefined);assert.equal(basic.design.description,'Main');
});
test('combined supply selection retains separate PDF fields and does not alter reading values',()=>{
 const fields={supplyDeviceBs:'BS EN 60898-1',supplyDeviceType:'C',ze:'0.19'};
 assert.equal(ctx.supplyDeviceDisplay(fields),'BS EN 60898-1 Type C');
 ctx.setSupplyDevice(fields,'BS EN 60898-1 Type D');assert.deepEqual(fields,{supplyDeviceBs:'BS EN 60898-1',supplyDeviceType:'D',ze:'0.19'});
 ctx.setSupplyDevice(fields,'BS88-3');assert.equal(fields.supplyDeviceType,'');
});
test('Zs fills blank supported devices, preserves legacy/manual limits, changes on explicit device edit',()=>{
 const c={fields:{nominalVoltage:'230'},tables:{circuits:[{ocpdBs:'BS EN 60898-1',ocpdType:'B',ocpdRating:'32'}]}};
 ctx.recalculateCircuitZs(c,0);assert.equal(c.tables.circuits[0].maxZs,'1.37');
 c.tables.circuits[0].maxZs='1.10';ctx.recalculateCircuitZs(c,0);assert.equal(c.tables.circuits[0].maxZs,'1.10');
 c.tables.circuits[0].ocpdType='C';ctx.recalculateCircuitZs(c,0,true);assert.equal(c.tables.circuits[0].maxZs,'0.68');
 c.tables.circuits[0].ocpdBs='BS88-3';ctx.recalculateCircuitZs(c,0,true);assert.equal(c.tables.circuits[0].maxZs,'');
});
test('paired legacy circuit and result fields survive normalisation without dropping hidden readings',()=>{
 const c={tables:{circuits:[{id:'keep',boardRef:'DB1',circuitNo:'0',installMethod:'surface',testButtonVisual:'Visible'}],tests:[{boardRef:'DB1',circuitNo:'0',r2:'0.1',r2only:'0.5',irLE:'299',remarks:'Keep'}]}};
 const before=plain(c);ctx.syncCircuitRows(c);assert.deepEqual(c,before);
});
test('Android update retains installed identity and storage namespace',()=>{
 const gradle=readFileSync('certificate-android/app/build.gradle','utf8');
 assert(gradle.includes("applicationId 'uk.co.sperinservices.certificates.stable'"));assert(gradle.includes("applicationIdSuffix '.preview.team.v197'"));assert(gradle.includes("versionCode = (project.findProperty('releaseVersionCode') ?: '200').toInteger()"));
 assert(source.includes("const STORAGE_KEY = 'sperin-certificates-data-v1'"));assert(source.includes("const EDIT_MODE_KEY = 'sperin-certificates-edit-mode-v196'"));
});
