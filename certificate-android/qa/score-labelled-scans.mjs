// Explicitly labelled REAL-photo assessment only. Never infer accuracy from CI mocks.
// The independent reviewer assigns matchedTruthId AFTER predictions are frozen;
// predicted wayId must come from the model/operator, not the reviewer association.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const known=['deviceKind','deviceManufacturer','deviceModel','ocpdBs','ocpdType',
 'ocpdRating','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating',
 'poleCount','phaseAssociation','testButtonVisual','description'];
const value=v=>String(v??'').trim().replace(/\s+/g,' ').toUpperCase();
const entry=()=>({correct:0,wrong:0,falsePositive:0,missed:0,omitted:0});
const metric=(r)=>({
 correct:r.correct,
 incorrect:r.wrong,
 falsePositive:r.falsePositive,
 missing:r.missed,
 omissions:r.omitted,
 precision:r.correct+r.wrong+r.falsePositive?r.correct/(r.correct+r.wrong+r.falsePositive):null,
 recall:r.correct+r.wrong+r.missed?r.correct/(r.correct+r.wrong+r.missed):null,
 omissionRate:r.correct+r.wrong+r.missed?r.omitted/(r.correct+r.wrong+r.missed):null
});
export function scoreLabelledCases(cases){
 if(!Array.isArray(cases)||!cases.length)throw Error('A non-empty, independently labelled dataset is required. Mock results cannot establish accuracy.');
 const totals=Object.fromEntries(known.map(k=>[k,entry()]));
 let trueDevices=0,predictedDevices=0,linked=0,unmatched=0,missingDevices=0,wayErrors=0,wayMissing=0,duplicateLinks=0;
 const ids=new Set();
 for(const sample of cases){
  if(!sample||!sample.id||ids.has(sample.id)||!Array.isArray(sample.truth)||!Array.isArray(sample.predicted))
   throw Error('Every case needs a unique ID and truth/predicted device arrays.');
  ids.add(sample.id);
  const lookup=new Map(),matched=new Set();
  for(const truth of sample.truth){
   if(!truth.id||lookup.has(truth.id)||!truth.wayId||!truth.fields)throw Error(sample.id+': truth needs unique physical id, wayId and labelled fields.');
   lookup.set(truth.id,truth);
  }
  trueDevices+=sample.truth.length;predictedDevices+=sample.predicted.length;
  for(const pred of sample.predicted){
   const target=lookup.get(pred.matchedTruthId);
   const unique=target&&!matched.has(target.id);
   if(!unique){unmatched++;if(target)duplicateLinks++;}
   else {matched.add(target.id);linked++;if(!pred.wayId)wayMissing++;else if(value(pred.wayId)!==value(target.wayId))wayErrors++;}
   for(const k of known){
    const actual=unique?value(target.fields[k]):'',got=value(pred.fields?.[k]);
    if(!actual&&!got)continue;
    const stat=totals[k];
    if(!actual&&got)stat.falsePositive++;
    else if(actual===got)stat.correct++;
    else if(actual&&got)stat.wrong++;
    else if(actual&&!got)stat.omitted++;
   }
  }
  for(const truth of sample.truth)if(!matched.has(truth.id)){
   missingDevices++;
   for(const k of known)if(value(truth.fields[k]))totals[k].missed++;
  }
 }
 const perField=Object.fromEntries(known.map(k=>[k,metric(totals[k])]));
 const aggregate=metric(known.reduce((total,k)=>{
  for(const v of Object.keys(total))total[v]+=totals[k][v];
  return total;
 },entry()));
 const report={datasetCases:cases.length,trueDevices,predictedDevices,linked,
  unmatchedPredictions:unmatched,missingDevices,duplicateLinks,wrongWay:wayErrors,
  unknownWay:wayMissing,deviceMappingErrors:unmatched+missingDevices+wayErrors+wayMissing,
  aggregate,perField};
 return report;
}
function main(){
 const file=process.argv[2];
 if(!file)throw Error('Usage: node certificate-android/qa/score-labelled-scans.mjs PRIVATE-labelled-evaluation.json [output-report.json]');
 const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 if(manifest.datasetVersion!==1||manifest.isMock===true)throw Error('A version 1 real, independently labelled dataset is required; mocks are not accuracy evidence.');
 const report=scoreLabelledCases(manifest.cases);
 const out=process.argv[3];
 if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report,null,2));
 // This tool reports performance, not a fixed field-accuracy claim or release approval.
 if(report.deviceMappingErrors||report.aggregate.precision===null)process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
