import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const appText=readFileSync('public/certificates/app.js','utf8');
const rendererText=readFileSync('public/certificates/iet-forms.js','utf8');
const appPrefix=appText.slice(0,appText.indexOf('  let settings = loadSettings();'));
assert(appPrefix.includes('const SCHEMAS = {'),'No complete application certificate schemas');
const appContext=vm.createContext({window:{},document:{},navigator:{},console,localStorage:{getItem:()=>null,setItem:()=>{}}});
vm.runInContext(appPrefix+'\nwindow.__modelFormSchemas=SCHEMAS;\n})();',appContext);
const schemas=appContext.window.__modelFormSchemas;

const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,
 navigator:{userAgent:'node'},document:{createElement:()=>({getContext:()=>({})})}});
ctx.window=ctx;ctx.self=ctx;
for(const file of ['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js','pdf-edit-map.js','iet-forms.js'])
  vm.runInContext(readFileSync('public/certificates/'+file,'utf8'),ctx);

function schemaFields(type){
  return new Set(schemas[type].sections.filter(x=>x.type==='section').flatMap(x=>x.fields.map(y=>y.key)));
}
function makeCert(type,overrides={}){
  const sample={
    type,number:'MODEL-COMPLETENESS-QA',
    fields:{standardAmendedTo:'2026-04-15',grade:'Grade D1',certificateType:'Completion certificate',
      clientName:'Fictional model-form client',premisesAddress:'Fictional test premises',installationAddress:'Fictional test premises',
      signatoryMode:'One person — design, construction & inspection',singleSignatoryName:'QA SIGNATORY',
      responsibleSignature:'QA TEST SIGNATURE',designerSignature:'QA DESIGNER',installerSignature:'QA INSTALLER',
      verifierSignature:'QA VERIFIER',commissionerSignature:'QA COMMISSIONER',overallAssessment:'Satisfactory'},
    tables:{boards:[{ref:'DB1'}],circuits:[{boardRef:'DB1',circuitNo:'1',description:'QA circuit'}],
      tests:[{boardRef:'DB1',circuitNo:'1',zs:'0.5'}],eicInspection:[{item:'1.0',description:'QA inspection',outcome:'✓'}],
      eicrInspection:[{item:'1.1',description:'QA intake',outcome:'✓'}],
      observations:[],luminaires:[{ref:'EL1',location:'QA location',result:'Pass'}],
      alarms:[{ref:'A1',location:'QA hall',type:'Optical smoke',test:'Pass'}]}
  };
  return {...sample,...overrides,fields:{...sample.fields,...overrides.fields},tables:{...sample.tables,...overrides.tables}};
}
function render(cert,worksheet=false){
 const before=JSON.stringify(cert);
 const doc=ctx.SperinIetForms.build({cert,schema:schemas[cert.type],worksheet});
 assert.equal(JSON.stringify(cert),before,'Rendering must never alter saved certificate');
 assert(doc.output().startsWith('%PDF-'),'Not a valid PDF');
 assert(doc.getNumberOfPages()>=1,'No PDF pages');
 return {doc,text:doc.internal.pages.filter(Array.isArray).map(x=>x.join('\n')).join('\n')};
}
test('Electrical blank models have required amendment and attachment fields',()=>{
 for(const type of ['eic','minor']){
   const keys=schemaFields(type);
   assert(keys.has('standardAmendedTo'),type+' must record amendment date');
   assert(keys.has('riskAssessmentAttached'),type+' must reference relevant risk assessments');
   assert(keys.has('permittedExceptions'),type+' must record any permitted exceptions');
 }
 for(const key of ['continuationSheets','continuationSheetSections','otherSourcesRef','protectiveDeviceSettingsRef'])
   assert(schemaFields('eic').has(key),'EIC missing '+key);
 for(const key of ['bondingWater','bondingGas','bondingOil','bondingSteel','bondingOther','bondingOtherDetail'])
   assert(schemaFields('minor').has(key),'Minor Works missing '+key);
});
test('EIC and Minor Works blank and issued PDFs both append recipient guidance',()=>{
 for(const type of ['eic','minor']){
   for(const worksheet of [false,true]){
     const {doc,text}=render(makeCert(type),worksheet);
     assert(text.includes('GUIDANCE FOR RECIPIENTS'),type+' guidance not appended');
     assert(text.includes('amended to'),type+' amendment declaration not rendered');
     assert(doc.getNumberOfPages()>=2,type+' must include recipient guidance');
   }
 }
});
test('EICR blank and issued records include declarations, schedule reference and recipient guidance',()=>{
 const fields=schemaFields('eicr');
 for(const key of ['inspectedBy','inspectorSignature','inspectorCompany','inspectorPosition','inspectorAddress','inspectorDate',
 'authorisedBy','authoriserSignature','authoriserCompany','authoriserPosition','authoriserAddress','authoriserDate',
 'remedialActionStatus','continuationSheetCount','inspectionSchedules','circuitSchedules'])
   assert(fields.has(key),'EICR missing '+key);
 for(const worksheet of [false,true]){
   const {text}=render(makeCert('eicr',{tables:{observations:[{item:'1',observation:'QA observation',code:'C3',scheduleRef:'4.1'}]}}),worksheet);
   assert(text.includes('SECTION K: OBSERVATIONS'),'EICR no observations section');
   assert(text.includes('GUIDANCE FOR RECIPIENTS'),'EICR recipient guidance missing');
 }
});
test('Emergency lighting model has supporting-document references and independent signatures',()=>{
 const keys=schemaFields('emergency');
 for(const key of ['responsibleSignature','responsibleDate','designerSignature','installerSignature','verifierSignature',
 'drawingRef','photometricEvidenceRef','logbookRef','riskAssessmentRef','deviations','deviationsAgreedWith',
 'logbookProvided','drawingsProvided','instructionsProvided','periodicTestType','faultActionRecordRef'])
   assert(keys.has(key),'Emergency lighting missing '+key);
 for(const kind of ['Completion certificate','Small installation certificate','Verification of existing installation','Periodic inspection & test']){
   const {text}=render(makeCert('emergency',{fields:{certificateType:kind}}));
   assert(text.includes('DECLARATION'),'Emergency '+kind+' has no documented declaration');
 }
});
test('Small emergency-lighting form rejects installations beyond 25 luminaires',()=>{
 const luminaires=Array.from({length:26},(_,i)=>({ref:'EL'+(i+1)}));
 assert.throws(()=>render(makeCert('emergency',{fields:{certificateType:'Small installation certificate'},tables:{luminaires}})),/25 self-contained luminaires/);
});
test('Domestic Grade C/D/F model includes Annex E roles and handover but rejects Grade A',()=>{
 const fields=schemaFields('smoke');
 for(const key of ['grade','category','areasProtected','electricalCertificateRef','designerSignature',
 'installerSignature','commissionerSignature','instructionsGiven','instructionsRecipient',
 'acceptanceName','acceptanceSignature','acceptanceDate'])
   assert(fields.has(key),'Domestic fire alarm missing '+key);
 const {text}=render(makeCert('smoke',{fields:{grade:'Grade D1'}}));
 assert(text.includes('DECLARATION'),'Missing smoke alarm certificates declarations');
 assert(text.includes('GUIDANCE FOR OCCUPIERS AND LANDLORDS'),'Missing BS 5839-6 Annex F-style recipient guidance');
 assert.throws(()=>render(makeCert('smoke',{fields:{grade:'Grade A'}})),/Grade A requires separate/);
});

test('Archive blank and filled specialist PDF exemplars for independent visual review',()=>{
 mkdirSync('certificate-android/qa-output',{recursive:true});
 for(const type of ['emergency','smoke']){
   for(const worksheet of [false,true]){
     const {doc}=render(makeCert(type),worksheet);
     const suffix=worksheet?'BLANK-TEMPLATE':'FICTIONAL-EXAMPLE';
     writeFileSync('certificate-android/qa-output/'+type+'-'+suffix+'.pdf',Buffer.from(doc.output('arraybuffer')));
   }
 }
});


// Normative field inventory independently transcribed from the free IET
// BS 7671:2018+A4:2026 model forms (15 April 2026):
// https://electrical.theiet.org/media/vasih5wg/bs7671_all_forms_a4.pdf
test('IET A4 electrical certificate required input fields are present',()=>{
 const eic=schemaFields('eic');
 for(const key of ['supplyDeviceType','supplyDeviceBs','supplyDeviceRating','supplyBreakingCapacity',
   'earthElectrodeMeasurementType','earthElectrodeResistance','designer2','designer2Signature',
   'mainSwitchDeviceType','mainSwitchDeviceSetting','mainRcdType','mainRcdIdn','mainRcdTime','mainRcdBreaking'])
   assert(eic.has(key),'IET EIC requires '+key);
 for(const type of ['eic','eicr']){
   for(const key of ['testedBy','testedSignature','testedDate'])
     assert(schemaFields(type).has(key),type+' requires a separately recordable schedule tester '+key);
 }
 const minor=schemaFields('minor');
 for(const key of ['standardAmendedTo','ocpdBs','ocpdType','ocpdRating','breakingCapacity',
  'rcdBs','rcdType','rcdRating','rcdIdn','rcdDelay','afddBs','afddRating','spdBs','spdType',
  'r1r2','r2','ringR1','ringRn','ringR2','irVoltage','irLL','irLE','zs','rcdTime','rcdButton','afddButton','spdFunction',
  'engineerName','forOnBehalfOf','address','position','signature','declarationDate'])
  assert(minor.has(key),'IET Minor Works missing '+key);
});
test('IET A4 inspection and circuit/test schedules have the exact numbered model items',()=>{
 const eicInspect=schemas.eic.sections.find(x=>x.key==='eicInspection')?.defaultRows||[];
 assert.equal(eicInspect.length,14,'EIC inspection requires 14 model items');
 assert.deepEqual(Array.from(eicInspect,x=>String(x.item)),
   Array.from({length:14},(_,i)=>String(i+1)+'.0'));
 const eicrInspect=schemas.eicr.sections.find(x=>x.key==='eicrInspection')?.defaultRows||[];
 const expected=['1.1','1.2','1.3','2.0',
   ...Array.from({length:8},(_,i)=>'3.'+(i+1)),
   ...Array.from({length:23},(_,i)=>'4.'+(i+1)),
   ...Array.from({length:21},(_,i)=>'5.'+(i+1)),
   ...Array.from({length:8},(_,i)=>'6.'+(i+1)),'7.1','8.1'];
 assert.equal(eicrInspect.length,66,'EICR IET schedule has 66 numbered individual checks');
 assert.deepEqual(Array.from(eicrInspect,x=>String(x.item)),expected);
 const models=schemas.eic.sections;
 const circuit=models.find(x=>x.key==='circuits')?.columns||[];
 const tests=models.find(x=>x.key==='tests')?.columns||[];
 for(const key of ['circuitNo','description','wiringType','refMethod','points','liveCsa','cpcCsa',
   'ocpdBs','ocpdType','ocpdRating','breakingCapacity','maxZs','rcdBs','rcdType','rcdIdn','rcdRating'])
   assert(circuit.some(x=>x.key===key),'Circuit schedule missing '+key);
 for(const key of ['circuitNo','r1','rn','r2','r1r2','r2only','irVoltage','irLL','irLE',
   'polarity','zs','rcdTime','rcdButton','afddButton','remarks'])
   assert(tests.some(x=>x.key===key),'Test schedule missing '+key);
 const source=rendererText.slice(rendererText.indexOf('function renderCircuitSchedules('));
 for(let number=1;number<=31;number++)
   assert(source.includes("['"+number+"',"),'IET printed schedule lacks numbered column '+number);
});
test('IET EIC worksheet keeps optional second designer and does not fabricate fields',()=>{
 const {text}=render(makeCert('eic'),true);
 assert(text.includes('Designer (No 2)'),'Blank model must show the optional second designer');
 assert(text.includes('Supply protective device type'),'EIC supply-device type absent from printed PDF');
 assert(text.includes('RA/Ze'),'EIC electrode measurement type absent from printed PDF');
});
test('IET EICR print leaves unanswered fields and classifications unselected',()=>{
 const f={...makeCert('eicr').fields,overallAssessment:'',remedialActionStatus:'',
   standardAmendedTo:'',inspectedBy:'',inspectorSignature:'',testedBy:'',testedDate:''};
 const {doc,text}=render(makeCert('eicr',{fields:f,tables:{observations:[]}}),false);
 assert(text.includes('No remedial action is required'),'Both model choice labels must be present');
 // Regression source guard: never mark missing test outcomes/installation
 // measurements as 'N/A' or 'No remedial action is required' automatically.
 const eicrSource=rendererText.slice(rendererText.indexOf('function renderEicrLandscape('),
     rendererText.indexOf('function renderEicrInspectionLandscape('));
 assert(!eicrSource.includes("observations.length?'The following observations are made':'No remedial action is required'"));
 assert(!eicrSource.includes("String(format(a,da)??'').trim()||'N/A'"));
 const inspectionSource=rendererText.slice(rendererText.indexOf('function renderEicrInspectionLandscape('),
     rendererText.indexOf('function renderEicrRecipientGuidance('));
 assert(!inspectionSource.includes("String(r.outcome||'').trim()||'N/A'"));
 assert(doc.getNumberOfPages()>=4);
});
