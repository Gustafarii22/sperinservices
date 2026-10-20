/* Shared, dependency-free safety boundary for photo proposals. No measured fields allowed. */
(function(root){
'use strict';
const boardKeys={manufacturer:'Manufacturer',model:'Model',ways:'Number of ways',populated:'Populated circuits',spareWays:'Spare ways',mainSwitch:'Main switch rating / type',rcd:'RCD details',spd:'SPD presence / type / markings',markings:'Other visible markings'};
const circuitKeys={circuitNo:'Circuit number',description:'Circuit description',deviceManufacturer:'Device manufacturer',deviceModel:'Device model',deviceKind:'Device kind (MCB / RCBO / RCD / fuse)',ocpdBs:'OCPD BS / EN',ocpdType:'Curve / type',ocpdRating:'Rating (A)',breakingCapacity:'Breaking capacity (kA)',rcdBs:'RCD BS / EN',rcdType:'RCD type',rcdIdn:'RCD sensitivity (mA)',rcdRating:'RCD rating (A)'};
const text=(v,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
function fields(rows,keys,count){
 const seen=new Set();return (Array.isArray(rows)?rows:[]).slice(0,40).flatMap(r=>{
  if(!r||!Object.hasOwn(keys,r.key)||seen.has(r.key))return [];seen.add(r.key);
  const evidence=(Array.isArray(r.evidence)?r.evidence:[]).filter(e=>Number.isInteger(e.image)&&e.image>=1&&e.image<=count&&text(e.text)).slice(0,6).map(e=>({image:e.image,text:text(e.text)}));
  const value=text(r.value);const confidence=!value?'missing':r.confidence==='high'&&evidence.length?'high':'check';
  return [{key:r.key,value,confidence,evidence,reason:text(r.reason),accepted:false}];
 });
}
function normalise(raw,count){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.board)||!Array.isArray(raw.circuits))throw Error('Analysis returned an invalid result. No certificate information was changed.');
 return {board:fields(raw.board,boardKeys,count),circuits:raw.circuits.slice(0,80).map((c,i)=>({id:'device-'+i,position:text(c.position),association:c.association==='high'?'high':'check',reason:text(c.reason),fields:fields(c.fields,circuitKeys,count),target:'',number:''})),warnings:(Array.isArray(raw.warnings)?raw.warnings:[]).map(w=>text(w)).filter(Boolean).slice(0,20)};
}
function blank(){return {board:Object.keys(boardKeys).map(key=>({key,value:'',confidence:'missing',evidence:[],reason:'Not identified — enter only information you can verify.',accepted:false})),circuits:[],warnings:[]};}
function draftDevice(){return {id:'manual-'+Date.now(),position:'Manual device',association:'check',reason:'Choose its circuit explicitly.',target:'',number:'',fields:Object.keys(circuitKeys).map(key=>({key,value:'',confidence:'missing',evidence:[],reason:'Manual entry',accepted:false}))};}

// An enclosure can have multiple photo banks. The installer chooses the bank/photo order,
// and this routine numbers physical schedule positions from its sole main switch.
// Main switch and SPD are *schedule position* annotations, not outgoing circuits.
// Their electrical test fields must remain blank.
function numberFromMain(result,cert,boardRef){
 if(cert.type==='minor')throw Error('Minor Works has one circuit; numbering from a CU main switch is unavailable.');
 const board=(cert.tables?.boards||[]).find(b=>b.ref===boardRef);
 if(!board)throw Error('Select an existing consumer unit first.');
 const boardValue=key=>text(result.board.find(f=>f.key===key)?.value||board[key]);
 const deviceValue=(d,key)=>text(d.fields.find(f=>f.key===key)?.value);
 const entry=(kind,description,source)=>{
   const d=draftDevice();
   d.id='schedule-'+kind.toLowerCase().replace(/\s+/g,'-');
   d.position=kind==='Main switch'?'Main switch · schedule position 0':'SPD · schedule position 1';
   d.reason='Board component, not an outgoing circuit. Confirm description; do not enter measured circuit results.';
   const descriptionField=d.fields.find(f=>f.key==='description');
   descriptionField.value=description+(source?' · '+source:'');
   descriptionField.confidence='check';
   const kindField=d.fields.find(f=>f.key==='deviceKind');
   kindField.value=kind;
   kindField.confidence='check';
   return d;
 };
 const original=result.circuits.filter(d=>!['Main switch','SPD'].includes(deviceValue(d,'deviceKind')));
 const main=result.circuits.find(d=>deviceValue(d,'deviceKind')==='Main switch')||entry('Main switch','MAIN SWITCH',boardValue('mainSwitch'));
 const spdValue=boardValue('spd');
 const spdExisting=result.circuits.find(d=>deviceValue(d,'deviceKind')==='SPD');
 const spdPresent=!!spdExisting || (!!spdValue && !/^(?:no|none|n\/a|not fitted|not present|absent)$/i.test(spdValue));
 const arranged=[main,...(spdPresent?[spdExisting||entry('SPD','SPD',spdValue)]:[]),...original];
 const existing=(cert.tables?.circuits||[]).filter(c=>c.boardRef===boardRef&&!c._incomingFeed);
 const occupied=new Set();
 arranged.forEach((d,i)=>{
   const number=String(i), matches=existing.filter(c=>String(c.circuitNo)===number);
   d.number=number;
   const prior=matches.length===1?matches[0]:null;
   const proposedKind=deviceValue(d,'deviceKind');
   const priorKind=text(prior?.deviceKind);
   const priorUsed=!!(text(prior?.description)||text(prior?.ocpdRating)||text(prior?.ocpdBs));
   // Never silently replace a populated circuit with a main switch, SPD, spare
   // or a different protective device. The installer must select it explicitly.
   const compatible=!!prior&&(!priorUsed||!!priorKind&&priorKind===proposedKind);
   d.target=!matches.length?'new':compatible&&!occupied.has(prior.id)?prior.id:'';
   if(d.target&&d.target!=='new')occupied.add(d.target);
   d.fields.forEach(f=>{f.accepted=false;});
 });
 result.circuits=arranged;
 return result;
}
function selected(rows){return rows.filter(r=>r.accepted&&text(r.value));}
function propose(cert,boardRef,result){
 const copy=JSON.parse(JSON.stringify(cert)),changes=[];
 const minor=cert.type==='minor';
 if(!minor&&!['eic','eicr'].includes(cert.type))throw Error('This certificate type does not support board scanning.');
 const board=minor?(copy.photoBoard ||= {}):(copy.tables?.boards||[]).find(b=>b.ref===boardRef);
 if(!board)throw Error('The selected consumer unit no longer exists.');
 const put=(dest,r,label)=>{if(!Object.hasOwn(boardKeys,r.key)&&!Object.hasOwn(circuitKeys,r.key))throw Error('Unsupported scan field');const before=String(dest[r.key]??'');if(before===r.value)return;dest[r.key]=r.value;changes.push({label,before,after:r.value,evidence:r.evidence});};
 selected(result.board).forEach(r=>{if(!Object.hasOwn(boardKeys,r.key))throw Error('Unsupported board field');put(board,r,boardKeys[r.key]);});
 const used=new Set();
 for(const device of result.circuits){
  const approved=selected(device.fields).filter(r=>minor||r.key!=='circuitNo');if(!approved.length)continue;
  if(!device.target)throw Error('Choose a destination for every device with confirmed values.');
  if(used.has(device.target)&&device.target!=='new')throw Error('Two devices target the same circuit. Review the device associations.');used.add(device.target);
  let row;
  if(minor){if(device.target!=='minor')throw Error('Select this Minor Works circuit.');row=copy.fields;}
  else if(device.target==='new'){
   const no=text(device.number,20);if(!/^\d+[A-Za-z]?$/.test(no))throw Error('Enter a valid number for each new circuit.');
   if(copy.tables.circuits.some(r=>r.boardRef===boardRef&&String(r.circuitNo)===no))throw Error('Circuit '+no+' already exists on this board. Select it instead.');
   row={id:'scan-'+Date.now()+'-'+copy.tables.circuits.length,boardRef,circuitNo:no};copy.tables.circuits.push(row);copy.tables.tests.push({boardRef,circuitNo:no});changes.push({label:'New circuit '+no,before:'',after:'Create on '+boardRef});
  }else{
   row=copy.tables.circuits.find(r=>r.id===device.target&&r.boardRef===boardRef);
   if(!row||row._incomingFeed)throw Error('The target circuit is missing or linked to an upstream supply.');
  }
  for(const r of approved){
   if(!Object.hasOwn(circuitKeys,r.key))throw Error('Unsupported circuit field');
   const label=(minor?'Minor Works':'Circuit '+row.circuitNo)+' · '+circuitKeys[r.key];
   if(minor&&r.key==='description'){const before=String(row.circuitDescription??'');if(before!==r.value){row.circuitDescription=r.value;changes.push({label,before,after:r.value,evidence:r.evidence});}}else put(row,r,label);
  }
 }
 // Audit contains approved values and source text, never photos or customer metadata.
 if(changes.length)copy.photoScanAudit=[...(copy.photoScanAudit||[]).slice(-19),{at:new Date().toISOString(),boardRef,changes}];
 return {certificate:copy,changes};
}
root.SperinBoardScan={boardKeys,circuitKeys,normalise,blank,draftDevice,numberFromMain,propose};
})(globalThis);
