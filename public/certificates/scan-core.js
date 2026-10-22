/* Shared, dependency-free safety boundary for photo proposals. No measured fields allowed. */
(function(root){
'use strict';
const boardKeys={manufacturer:'Manufacturer',model:'Model',ways:'Number of ways',populated:'Populated circuits',spareWays:'Spare ways',mainSwitch:'Main switch rating / type',rcd:'RCD details',spd:'SPD presence / type / markings',spdBs:'SPD product standard (read from label)',markings:'Other visible markings'};
const circuitKeys={circuitNo:'Circuit number',description:'Circuit description',deviceManufacturer:'Device manufacturer',deviceModel:'Device model',deviceKind:'Device kind (MCB / RCBO / RCD / fuse)',ocpdBs:'OCPD BS / EN',ocpdType:'Curve / type',ocpdRating:'Rating (A)',breakingCapacity:'Breaking capacity (kA)',rcdBs:'RCD BS / EN',rcdType:'RCD type',rcdIdn:'RCD sensitivity (mA)',rcdRating:'RCD rating (A)',poleCount:'Visually confirmed number of poles',phaseAssociation:'Confirmed line / phase designation',testButtonVisual:'Test button visible in photo (NOT test result)'};
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
 return {board:fields(raw.board,boardKeys,count),circuits:raw.circuits.slice(0,80).map((c,i)=>{
   const proposed=fields(c.fields,circuitKeys,count);
   const kind=proposed.find(x=>x.key==='deviceKind')?.value||'';
   const assumed={MCB:{ocpdBs:'BS EN 60898-1'},RCBO:{ocpdBs:'BS EN 61009-1',rcdBs:'BS EN 61009-1'},
     RCD:{rcdBs:'BS EN 61008-1'},RCCB:{rcdBs:'BS EN 61008-1'}}[kind]||{};
   for(const [key,value] of Object.entries(assumed))if(!proposed.some(x=>x.key===key&&x.value)){
     proposed.push({key,value,confidence:'check',reason:'Suggested by apparent device class. Not read from the product label; electrician must verify.',evidence:[],accepted:false});
   }
   return {id:'device-'+i,position:text(c.position),association:c.association==='high'?'high':'check',
      reason:text(c.reason),fields:proposed,target:'',number:''};
 }),warnings:(Array.isArray(raw.warnings)?raw.warnings:[]).map(w=>text(w)).filter(Boolean).slice(0,20)};
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
function localOcrCandidates(photos,options={}){
 const devices=[],warnings=[],boardValues={};
 let mainSide=null,withPositions=true;
 const override=['left','right'].includes(options.mainSide)?options.mainSide:null;
 const rating=/(?:^|[^A-Z0-9])([BCD])\s?(6|10|16|20|25|32|40|50|63)(?:\s?A)?(?=$|[^0-9])/i;
 const read=p=>typeof p==='string'?{fullText:p,lines:[]}:(p&&typeof p==='object'?p:{fullText:'',lines:[]});
 const clean=s=>text(s,150).replace(/\s+/g,' ');
 const valid=l=>l&&Number.isFinite(l.left)&&Number.isFinite(l.right)&&Number.isFinite(l.top)&&Number.isFinite(l.bottom)&&l.right>l.left&&l.bottom>l.top;
 const middle=l=>(l.left+l.right)/2;
 const evidence=(p,s)=>[{image:p+1,text:clean(s)}];
 for(let p=0;p<photos.length;p++){
   const photo=read(photos[p]);
   const rows=(Array.isArray(photo.lines)?photo.lines:[]).filter(l=>l&&typeof l.text==='string').map(l=>({...l,text:clean(l.text)}));
   const full=String(photo.fullText||rows.map(l=>l.text).join(' '));
   const width=Number(photo.width)||Math.max(1,...rows.filter(valid).map(l=>l.right));
   if(/\bFuseBox\b/i.test(full))boardValues.manufacturer||='FuseBox';
   const main=rows.find(l=>valid(l)&&/\bMAIN\s*SWITCH\b/i.test(l.text))||
     rows.find(l=>valid(l)&&/\bMAIN\b/i.test(l.text)&&rows.some(k=>valid(k)&&/\bSWITCH\b/i.test(k.text)&&Math.abs(middle(k)-middle(l))<=Math.max(30,width*.055)));
   const spd=rows.find(l=>valid(l)&&/\bSPD[A-Z0-9_-]*\b|SURGE\s*PROTECTION/i.test(l.text));
   if(main&&mainSide===null){mainSide=middle(main)>width/2?'right':'left';}
   const travel=override||mainSide;
   if(main&&p===0){
     const amps=rows.filter(valid).filter(l=>/\b100\s?A\b/.test(l.text)).sort((a,b)=>Math.abs(middle(a)-middle(main))-Math.abs(middle(b)-middle(main)))[0];
     boardValues.mainSwitch=amps?'100 A main switch':'Main switch (rating to confirm)';
   }
   if(spd){const nearby=rows.filter(l=>valid(l)&&Math.abs(middle(l)-middle(spd))<=Math.max(50,width*.07)).map(l=>l.text).join(' ');const type=nearby.match(/(?:\bT\s*([123])\b|\bTYPE\s*([123])\b)/i);boardValues.spd=type?'T'+(type[1]||type[2]):'SPD present — confirm type';const standard=nearby.match(/(?:BS\s*(?:EN\s*)?)?61643\s*[-–]\s*(11|31)/i);if(standard)boardValues.spdBs='BS EN 61643-'+standard[1];}
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
   if(travel!==null)grouped.sort((a,b)=>a.y!==null&&b.y!==null&&Math.abs(a.y-b.y)>(Number(photo.height)||800)*.12?a.y-b.y:(travel==='right'?b.x-a.x:a.x-b.x));
   else grouped.sort((a,b)=>a.x===null||b.x===null?0:a.x-b.x);
   // Estimate only gaps BETWEEN clearly separated device centres. Blanks
   // at either end need the enclosure edge and must be added by the electrician.
   const spaced=grouped.filter(g=>g.x!==null).map(g=>g.x).sort((a,b)=>a-b);
   const intervals=spaced.slice(1).map((x,i)=>x-spaced[i]).filter(x=>x>Math.max(12,width*.018));
   const pitch=intervals.length?intervals.slice().sort((a,b)=>a-b)[Math.floor((intervals.length-1)/2)]:0;
   const blanks=[];
   if(pitch&&grouped.length>=3){
     for(let i=0;i<grouped.length-1;i++){
       const left=grouped[i],right=grouped[i+1];
       if(left.x===null||right.x===null||Math.abs(left.y-right.y)>(Number(photo.height)||800)*.12)continue;
       const gap=Math.abs(left.x-right.x);
       const count=Math.max(0,Math.min(6,Math.round(gap/pitch)-1));
       if(gap>pitch*1.65&&count)blanks.push({index:i+1,count});
     }
   }
   for(let i=0;i<grouped.length;i++){
     const g=grouped[i],ev=evidence(p,g.examples[0]);
     const make=(key,value,reason)=>({key,value,confidence:'check',evidence:ev,reason:reason||'Text detected by on-device OCR. Confirm against the device.',accepted:false});
     const near=rows.filter(l=>valid(l)&&g.x!==null&&Math.abs(middle(l)-g.x)<=Math.max(18,width*.031)&&Math.abs((l.top+l.bottom)/2-g.y)<Math.max(100,(Number(photo.height)||800)*.16));
     const joined=near.map(l=>l.text).join(' ');
     // Read markings from the same device column AND rail. A second DIN rail can
      // have a different manufacturer's device at the identical X coordinate;
      // never borrow its BS, model or RCD characteristics across the row gap.
     const model=joined.match(/\b(RTA[0-9A-Z-]{5,20}|MT[0-9A-Z-]{4,18})\b/i)?.[1]||'';
     const marked=joined.match(/(?:BS\s*(?:EN\s*)?)?\b(61009(?:\s*[-–]\s*(?:1|2[-–][12]))?|60898(?:\s*[-–]\s*[12])?|61008(?:\s*[-–]\s*1)?|3871|4293|60947\s*[-–]\s*2)\b/i);
     const exact=marked?.[1]?.replace(/\s+/g,'').replace(/[–]/g,'-')||'';
     const standards=exact?(/^(?:3871|4293)$/.test(exact)?'BS '+exact:'BS EN '+exact.replace(/^60898$/,'60898-1').replace(/^61009$/,'61009-1').replace(/^61008$/,'61008-1')):'';
     const rcd=/\b(?:10|30|100|300)\s?mA\b|\b0[.,]03\s?A\b|61009|61008|4293|\bRTA[0-9]/i.test(joined);
     const mcb=/60898|\bMCB\b/i.test(joined);
     const idn=joined.match(/\b(10|30|100|300)\s?mA\b/i)?.[1]||(/\b0[.,]03\s?A\b/i.test(joined)?'30':'');
     const rcdType=joined.match(/\bTYPE\s*(AC|A|F|B)\b/i)?.[1]?.toUpperCase()||'';
     const capacity=/\b6000\b|\b6\s?kA\b/i.test(joined)?'6':/\b10000\b|\b10\s?kA\b/i.test(joined)?'10':'';
     const shared=/61008|4293|\bRCCB\b|\bRCD\b/i.test(joined)&&!/(?:\b[BCD]\s?(?:6|10|16|20|25|32|40|50|63)\b|61009)/i.test(joined);
     const deviceKind=shared?'RCD':rcd?'RCBO':mcb||g.curve?'MCB':'';
     const dev=coreDraftForOcr(p,i,g.x===null?'position unknown':(travel==='right'?'right-to-left':'left-to-right')+' · x '+Math.round(g.x));
     dev.fields=[
       make('ocpdType',g.curve),make('ocpdRating',g.amps),
       ...(deviceKind?[make('deviceKind',deviceKind,'Check the device type.')]:[]),
       ...(standards?[make('ocpdBs',standards,'Read from visible marking; confirm on this exact device.')]:[]),
       ...(model?[make('deviceModel',model)]:[]),
       ...(capacity?[make('breakingCapacity',capacity)]:[]),
       ...(rcd&&idn?[make('rcdIdn',idn)]:[]),
       ...(rcd&&rcdType?[make('rcdType',rcdType)]:[]),
       ...(rcd&&/^(BS EN 6100[89]|BS 4293)/.test(standards)?[make('rcdBs',standards,'Read from device label. Confirm mark and position.')]:[]),
       ...(rcd?[make('rcdRating',g.amps,'Check the RCBO rating against its label.')]:[]),
       ...(boardValues.manufacturer?[make('deviceManufacturer',boardValues.manufacturer,'Check the device brand.')]:[])
     ];
     devices.push(dev);
     for(const blank of blanks.filter(b=>b.index===i+1))for(let n=0;n<blank.count;n++){
       const spare=coreDraftForOcr(p,grouped.length+devices.length+n,'possible blank space');
       spare.fields=[make('description','SPARE','Suggested from the gap between devices; confirm or delete.'),make('deviceKind','Spare','Check the blank space.')];
       devices.push(spare);
     }
   }
   // Image-derived estimate for blank modules AFTER the last marked device.
   // Only suggest when image measurements were available; the installer can delete.
   const possible=Math.min(12,Math.max(0,Math.round(Number(photo.blankWayHint)||0)));
   if(possible&&grouped.length>=3&&grouped.every(g=>g.x!==null)){
     for(let n=0;n<possible;n++){
       const spare=coreDraftForOcr(p,100+n,'end of photo bank · check blank');
       spare.fields=[
         {key:'description',value:'SPARE',confidence:'check',evidence:[],reason:'Suggested from visible empty module spaces',accepted:false},
         {key:'deviceKind',value:'Spare',confidence:'check',evidence:[],reason:'Check the number of spaces',accepted:false}
       ];
       devices.push(spare);
     }
   }
 }
 if((override||mainSide)===null){withPositions=false;warnings.push('Check which side the main switch is on.');}
 if(!withPositions)warnings.push('Check the fuse order against the photos.');
 warnings.push('Check blank spaces and add or delete any suggested spaces.');
 if(!devices.length)warnings.push('No standalone B/C/D ratings were read. Try a close-up of the device markings or enter them manually.');
 return {board:Object.entries(boardValues).map(([key,value])=>({key,value,confidence:'check',accepted:false,evidence:[],reason:'On-device photo reading; confirm this board detail.'})),devices,warnings,physicalOrderKnown:withPositions&&devices.length>0&&!!(override||mainSide),direction:override||mainSide};
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
 const original=result.circuits.filter(d=>deviceValue(d,'deviceKind')!=='Main switch');
 const main=result.circuits.find(d=>deviceValue(d,'deviceKind')==='Main switch')||entry('Main switch','MAIN SWITCH',boardValue('mainSwitch'));
 const spdValue=boardValue('spd');
 const spdExisting=result.circuits.find(d=>deviceValue(d,'deviceKind')==='SPD');
 const spdPresent=!!spdExisting || (!!spdValue && !/^(?:no|none|n\/a|not fitted|not present|absent)$/i.test(spdValue));
 // Keep photograph order for all identified RCDs, MCBs, RCBOs, blanks and SPDs.
 // If an SPD is known only from CU details, show it separately on the board rather
 // than inventing a physical way number.
 const arranged=[main,...original];
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
