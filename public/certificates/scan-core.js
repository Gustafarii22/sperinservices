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

// ML Kit returns text AND bounding rectangles. Cluster protective-device markings
// geometrically instead of flattening them into a text stream. This never auto-accepts
// a field or claims that an optical reading proves circuit identity or safety.
function localOcrCandidates(photos){
 const devices=[],warnings=[],boardValues={};
 let mainSide=null,withPositions=true;
 const rating=/(?:^|[^A-Z0-9])([BCD])\s?(6|10|16|20|25|32|40|50|63)(?:\s?A)?(?=$|[^0-9])/i;
 const read=p=>typeof p==='string'?{fullText:p,lines:[]}:(p&&typeof p==='object'?p:{fullText:'',lines:[]});
 const clean=s=>text(s,150).replace(/\s+/g,' ');
 const valid=l=>l&&Number.isFinite(l.left)&&Number.isFinite(l.right)&&Number.isFinite(l.top)&&Number.isFinite(l.bottom)&&l.right>l.left&&l.bottom>l.top;
 const middle=l=>(l.left+l.right)/2;
 const evidence=(p,s)=>[{image:p+1,text:clean(s)}];
 for(let p=0;p<photos.length;p++){
   const photo=read(photos[p]);
   const rows=(Array.isArray(photo.lines)?photo.lines:[]).filter(l=>l&&typeof l.text==='string').map(l=>({...l,text:clean(l.text)}));
   const full=clean(photo.fullText||rows.map(l=>l.text).join(' '));
   const width=Number(photo.width)||Math.max(1,...rows.filter(valid).map(l=>l.right));
   if(/\bFuseBox\b/i.test(full))boardValues.manufacturer||='FuseBox';
   const main=rows.find(l=>valid(l)&&/\bMAIN\s*SWITCH\b/i.test(l.text));
   const spd=rows.find(l=>valid(l)&&/\bSPD\b|SURGE\s*PROTECTION/i.test(l.text));
   if(main&&mainSide===null){mainSide=middle(main)>width/2?'right':'left';}
   if(main&&p===0){
     const amps=rows.filter(valid).filter(l=>/\b100\s?A\b/.test(l.text)).sort((a,b)=>Math.abs(middle(a)-middle(main))-Math.abs(middle(b)-middle(main)))[0];
     boardValues.mainSwitch=amps?'100 A main switch':'Main switch (rating to confirm)';
   }
   if(spd)boardValues.spd='SPD (type and markings to confirm)';
   const raw=rows.filter(l=>rating.test(l.text));
   // The image can supply multiple markings for the same device, but proximity
   // only merges matching ratings within one narrow DIN-rail device column.
   const grouped=[];
   for(const l of raw){
     const m=l.text.match(rating);
     const x=valid(l)?middle(l):null, y=valid(l)?(l.top+l.bottom)/2:null;
     const tol=Math.max(10,width*.015);
     const existing=grouped.find(g=>g.curve===m[1].toUpperCase()&&g.amps===m[2]&&x!==null&&g.x!==null&&Math.abs(g.x-x)<=tol&&Math.abs(g.y-y)<=Math.max(30,(Number(photo.height)||800)*.18));
     if(existing){existing.examples.push(l.text);continue;}
     grouped.push({curve:m[1].toUpperCase(),amps:m[2],x,y,examples:[l.text]});
   }
   // Some OCR engines return text only. Preserve those as unpositioned suggestions
   // instead of inventing physical layout from flat string order.
   if(!rows.length){
     for(const line of String(photo.fullText||'').split(/\r?\n/)){
       const m=clean(line).match(rating);
       if(m)grouped.push({curve:m[1].toUpperCase(),amps:m[2],x:null,y:null,examples:[clean(line)]});
     }
   }
   if(grouped.some(g=>g.x===null))withPositions=false;
   if(mainSide!==null)grouped.sort((a,b)=>a.y!==null&&b.y!==null&&Math.abs(a.y-b.y)>(Number(photo.height)||800)*.12?a.y-b.y:(mainSide==='right'?b.x-a.x:a.x-b.x));
   else grouped.sort((a,b)=>a.x===null||b.x===null?0:a.x-b.x);
   for(let i=0;i<grouped.length;i++){
     const g=grouped[i],ev=evidence(p,g.examples[0]);
     const make=(key,value,reason)=>({key,value,confidence:'check',evidence:ev,reason:reason||'Text detected by on-device OCR. Confirm against the device.',accepted:false});
     const near=rows.filter(l=>valid(l)&&g.x!==null&&Math.abs(middle(l)-g.x)<=Math.max(18,width*.031)&&Math.abs((l.top+l.bottom)/2-g.y)<Math.max(100,(Number(photo.height)||800)*.38));
     const joined=near.map(l=>l.text).join(' ');
     const rcd=/\b30\s?mA\b|\b0[.,]03\s?A\b|\b61009\b/i.test(joined);
     const mcb=/\b60898\b|\bMCB\b/i.test(joined);
     const standards=/61009/.test(joined)?'BS EN 61009-1':/60898/.test(joined)?'BS EN 60898-1':'';
     const dev=coreDraftForOcr(p,i,g.x===null?'position unknown':(mainSide==='right'?'right-to-left':'left-to-right')+' · x '+Math.round(g.x));
     dev.fields=[
       make('ocpdType',g.curve),make('ocpdRating',g.amps),
       ...(rcd||mcb?[make('deviceKind',rcd?'RCBO':'MCB','Classification based on nearby optical text; check actual device type.')]:[]),
       ...(standards?[make('ocpdBs',standards)]:[]),
       ...(rcd?[make('rcdIdn','30','Detected residual sensitivity; verify the device marking.'),make('rcdBs','BS EN 61009-1')]:[]),
       ...(boardValues.manufacturer?[make('deviceManufacturer',boardValues.manufacturer,'Board marking; verify manufacturer on this individual protective device.')]:[])
     ];
     devices.push(dev);
   }
 }
 if(mainSide===null){withPositions=false;warnings.push('Main switch position/direction not identified by OCR. Check bank order and number devices manually from the main switch.');}
 if(!withPositions)warnings.push('Some devices lack optical coordinates. Physical circuit order cannot be verified from text alone.');
 warnings.push('On-device OCR cannot reliably count blank covers. Add and position the spare-way entries visible in the photographs before saving.');
 if(!devices.length)warnings.push('No standalone B/C/D ratings were read. Try a close-up of the device markings or enter them manually.');
 return {board:Object.entries(boardValues).map(([key,value])=>({key,value,confidence:'check',accepted:false,evidence:[],reason:'On-device photo reading; confirm this board detail.'})),devices,warnings,physicalOrderKnown:withPositions&&devices.length>0,direction:mainSide};
}
function coreDraftForOcr(photo,index,position){
 return {id:'ocr-'+photo+'-'+index,position:'Photo '+(photo+1)+' · '+position,
  association:'check',reason:'Optical candidate only; confirm device, bank and label association.',
  target:'',number:'',fields:[]};
}
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
root.SperinBoardScan={boardKeys,circuitKeys,normalise,blank,draftDevice,localOcrCandidates,numberFromMain,propose};
})(globalThis);
