import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Full report rendering: uses the same jsPDF libraries and EICR renderer as Android.
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});
ctx.window=ctx;ctx.self=ctx;
for(const f of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])
  vm.runInContext(readFileSync('public/certificates/'+f,'utf8'),ctx);

function sample(){
  return {
    type:'eicr',number:'MODEL-A4-TEST',
    fields:{
      clientName:'MODEL CLIENT',clientAddress:'HOUSE ADDRESS',
      installationAddress:'HOUSE ADDRESS',reason:'Periodic inspection',inspectionDates:'2026-11-06',
      premisesType:'Residential',overallAssessment:'Unsatisfactory',
      generalCondition:'Deterioration identified',inspectedBy:'INSPECTOR',inspectorSignature:'Signed by inspector',
      authorisedBy:'AUTHORISER',authoriserSignature:'Signed by authoriser',standardAmendedTo:'2026-11-06',
      clientPostcode:'SHOULD_NOT_PRINT_CLIENT_POSTCODE',issueDate:'SHOULD_NOT_PRINT_ISSUE_DATE',
      installationPostcode:'SHOULD_NOT_PRINT_INSTALLATION_POSTCODE',maximumDemand:'38',maximumDemandUnit:'A'
    },
    tables:{
      observations:[{item:'1',observation:'DANGEROUS_TEST_FINDING',code:'C1',scheduleRef:'3.1'},
                    {item:'2',observation:'ADVISORY_TEST_FINDING',code:'FI',scheduleRef:'4.1'}],
      eicrInspection:[{item:'1.1',description:'Distributor intake',outcome:'✓'},
                      {item:'3.1',description:'Earth condition',outcome:'C1'},
                      {item:'4.1',description:'Consumer unit',outcome:'FI'}],
      boards:[{ref:'DB1'}],
      circuits:[{boardRef:'DB1',circuitNo:'1',description:'Lighting circuit',ocpdRating:'6'}],
      tests:[{boardRef:'DB1',circuitNo:'1',zs:'0.82'}]
    }
  };
}
const cert=sample(),snap=JSON.stringify(cert);
const schema={standard:'BS 7671:2018+A4:2026',sections:[]};
const plain=ctx.SperinIetForms.build({cert,schema});
const editable=ctx.SperinIetForms.build({cert,schema,editable:true});
const drawing=plain.internal.pages.filter(Array.isArray).map(p=>p.join('\n')).join('\n');
test('EICR PDF builds, is readable and does not mutate existing data',()=>{
  assert.equal(JSON.stringify(cert),snap);
  assert(plain.output().startsWith('%PDF-'));
  assert(plain.getNumberOfPages()>=7);
  assert.equal(editable.getNumberOfPages(),plain.getNumberOfPages());
  assert.deepEqual(editable.internal.pages,plain.internal.pages);
});
test('EICR contains every report section A to K and both IET observation categories',()=>{
  for(const c of 'ABCDEFGHIJK')assert(drawing.includes('SECTION '+c+':'),c+' missing');
  assert(drawing.includes('C1 AND C2 OBSERVATIONS'));
  assert(drawing.includes('C3 AND FI OBSERVATIONS'));
  assert(drawing.includes('DANGEROUS_TEST_FINDING'));
  assert(drawing.includes('ADVISORY_TEST_FINDING'));
  assert(drawing.includes('GUIDANCE FOR RECIPIENTS'));
  assert(drawing.includes('CONDITION REPORT SCHEDULE OF INSPECTION'));
  assert(drawing.includes('GENERIC SCHEDULE OF CIRCUIT DETAILS'));
  assert(drawing.includes('GENERIC SCHEDULE OF TEST RESULTS'));
});
test('private app metadata is not printed on the EICR and output keeps signatories',()=>{
  for(const banned of ['SHOULD_NOT_PRINT_CLIENT_POSTCODE','SHOULD_NOT_PRINT_ISSUE_DATE','SHOULD_NOT_PRINT_INSTALLATION_POSTCODE'])
    assert(!drawing.includes(banned),banned+' leaked into IET report');
  for(const needed of ['Signed by inspector','Signed by authoriser','MODEL CLIENT','Periodic inspection'])
    assert(drawing.includes(needed),needed+' not printed');
});
test('PDF editing remains bound to original saved observations and checks',()=>{
  const regions=editable.__editRegions||[];
  for(const i of [0,1])assert(regions.some(r=>r.kind==='observations'&&r.index===i&&r.key==='code'),'observation '+i);
  for(const key of ['overallAssessment','supplyDeviceType','maximumDemand'])
    assert(regions.some(r=>r.key===key),key+' edit region lost');
  assert(regions.some(r=>r.kind==='eicrInspection'&&r.index===0&&r.key==='outcome'));
});
