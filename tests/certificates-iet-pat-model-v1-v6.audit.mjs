import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync("public/certificates/app.js","utf8");
const forms=fs.readFileSync("public/certificates/iet-forms.js","utf8");
const pat=app.slice(app.indexOf("    pat:{"),app.indexOf("    ev:{"));
const supplements=app.slice(app.indexOf("  SCHEMAS.pat.sections[0].fields.push"),app.indexOf("  let settings = loadSettings();"));
if(!pat||!supplements)throw Error("PAT schema/audit extensions not found");
// Source: publicly accessible IET fifth-edition CoP blank model forms V1-V6.
// This audits data capture, not legal certification, layout or private standard text.
const model={
  V1:["clientName","installationAddress","organisationName","organisationAddress","responsiblePerson","asset","location","description","serial","visualFrequency","combinedFrequency"],
  V2:["testedBy","clientName","company","issueDate","asset","description","class","equipmentType","location","visualFrequency","combinedFrequency","make","model","serial","voltage","rating","fuseRating","socketCondition","plugCondition","flexCondition","bodyCondition","otherCondition","earth","earthIncludingCable","insulation","insulationVoltage","polarity","functional","otherTests","suitableEnvironment","remarks","suitableForUse","inspectorInitials","dutyHolderInitials"],
  V3:["asset","labelCheckDate","labelInitials","outcome"],
  V4:["asset","customer","description","serial","repairer","suitable","signature","date"],
  V5:["date","asset","defect","location","action"],
  V6:["type","make","serial","calibrationDate","testDate","point05","deviation05","point1","deviation1","point10","deviation10"]
};
const combined=pat+"\n"+supplements;
for(const [form,keys] of Object.entries(model)){
 for(const key of keys){
  if(!new RegExp("(?:key|f)\\s*[:(]\\s*['\"]"+key+"['\"]").test(combined) && !combined.includes("'"+key+"'"))
    throw Error(form+" required data key missing: "+key);
 }
 console.log("IET_PAT_"+form+"_MODEL_DATA_COVERAGE_PASS",keys.length);
}
for(const [type,fields] of Object.entries({
 ev:["openPen","rcd","dnoReference","loadManagement","linkedEic","rcdDcDetails","simultaneousContact"],
 solar:["strings","voc","isc","ir","designReference","inverterMake","testConditions","arrayLayout","dno"],
 commercialFire:["certificateType","designOrganisation","commissionDeclaration","acceptanceBy","batteryStandby","causeEffect","logbookDelivery"]
})){
 const section=app.slice(app.indexOf("    "+type+":{"),type==="commercialFire"?app.indexOf("  // PAT is reconciled"):app.indexOf(type==="ev"?"    solar:{":"    commercialFire:{"));
 for(const key of fields)assert(combined.includes("'"+key+"'")||section.includes("'"+key+"'"),type+" field missing: "+key);
 console.log("SPECIALIST_"+type+"_REFERENCE_FIELDS_PRESENT");
}
assert(forms.includes("TECHNICAL REVIEW REQUIRED"),"Unreviewed specialist PDFs must be clearly draft-marked");
assert(app.includes("['pat','ev','solar','commercialFire'].includes(cert.type)"),"Specialist issue must be blocked pending technical approval");
console.log("SPECIALIST_DOCUMENTS_REMAIN_DRAFT_ONLY");
