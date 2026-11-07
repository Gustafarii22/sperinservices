import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Render the real Android-bundled JS PDF engine, not a mocked renderer.
const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});
ctx.window=ctx;ctx.self=ctx;
for(const file of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])
  vm.runInContext(readFileSync('public/certificates/'+file,'utf8'),ctx);
const app=readFileSync('public/certificates/app.js','utf8');
const prefix=app.slice(0,app.indexOf('  let settings = loadSettings();'));
const c=vm.createContext({window:{},document:{},navigator:{},console,localStorage:{getItem:()=>null,setItem:()=>{}}});
vm.runInContext(prefix+'\nwindow.__schema=SCHEMAS.eicr;\n})();',c);
const schema=c.window.__schema;
const inspections=schema.sections.find(part=>part.key==='eicrInspection').defaultRows;
assert.equal(inspections.length,66);
const output='certificate-android/qa-output/a4-readable';mkdirSync(output,{recursive:true});

for(const [count,repeat] of [[1,0],[10,0],[14,0],[30,0],[14,10]]){
  const circuits=[],tests=[];
  for(let n=1;n<=count;n++){
    const circuitNo=String(n);
    circuits.push({boardRef:'DB1',circuitNo,description:'Lighting and socket circuit '+n,wiringType:'A',refMethod:'C',points:'6',liveCsa:'2.5',cpcCsa:'1.5',ocpdBs:'BS EN 61009-1',ocpdType:'B',ocpdRating:'32',breakingCapacity:'6',maxZs:'1.37',rcdBs:'BS EN 61009-1',rcdType:'A',rcdIdn:'30',rcdRating:'32'});
    tests.push({boardRef:'DB1',circuitNo,r1:'0.15',rn:'0.17',r2:'0.18',irVoltage:'500',irLL:'200',irLE:'200',polarity:'✓',zs:'0.58',rcdTime:'30.4',rcdButton:'✓',afddButton:'N/A'});
  }
  const cert={
    type:'eicr',number:'A4-READABILITY-QA',
    fields:{clientName:'Test customer',clientAddress:'Birmingham',reason:'Periodic inspection',inspectionDates:'2026-11-07',installationAddress:'Birmingham',premisesType:'Residential',inspectedBy:'Inspection Engineer',inspectorSignature:'Inspection Engineer',authorisedBy:'Inspection Engineer',authoriserSignature:'Inspection Engineer',overallAssessment:'Unsatisfactory',mainSwitchBs:'BS EN 60947-3',standardAmendedTo:'BS 7671:2018+A4:2026',remedialActionStatus:'The following observations are made',testedBy:'augustine sperin',instrumentContinuity:'CONT-2026-123',testerSerial:'MFT-12345',testedDate:'2026-11-07'},
    tables:{
      observations:[{item:'1',observation:'C2 finding '+('Long defect description and circuit reference. ').repeat(repeat+1),code:'C2',location:'Kitchen',scheduleRef:'4.7'},{item:'2',observation:'C3 finding '+('Improvement recommended. ').repeat(repeat+1),code:'C3',location:'Consumer unit',scheduleRef:'5.4'}],
      eicrInspection:inspections.map(x=>({...x,outcome:'✓'})),
      boards:[{ref:'DB1',location:'Under stairs cupboard',distributionOcpdBs:'BS EN 60947-3',distributionOcpdRating:'80'}],
      circuits,tests
    }
  };
  const original=JSON.stringify(cert);
  const pdf=ctx.SperinIetForms.build({cert,schema,settings:{
    // 100x24 PNG proves the logo is placed at its native 25:6 ratio, not stretched.
    reportLogo:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAYCAIAAACDYM+5AAAAe0lEQVR4nO3ZMQ5AMABGYZVuXIXD1TlczlkcwCARqQ59U4n3TWzNy29AGKbUqU7f+gBfYizAWEDM7vdtbXKO1xrn5bp2WUC+rNM95289HzKXBRgLMBZgLMBYgLEAYwHGAowFGAswFmAsoPwi7YeaIpcFBH9Y1HNZgLGAAy4QCdyhQ+PPAAAAAElFTkSuQmCC'
  }});
  assert.equal(JSON.stringify(cert),original,'PDF generation mutated certificate data');
  assert(pdf.output().startsWith('%PDF-'));
  writeFileSync(output+'/eicr-'+count+'-circuits-obs-'+repeat+'.pdf',Buffer.from(pdf.output('arraybuffer')));
  console.log('PDF_SAMPLE_OK',count,repeat,pdf.getNumberOfPages());
}
