import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

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
