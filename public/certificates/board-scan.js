/* Consumer-unit photos are session-only. Certificate mutation is delegated after review. */
(()=>{'use strict';
const core=window.SperinBoardScan,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,seq=0;
const endpoint='/api/owner/certificate-scan';
function close(){
 if(!session)return;
 if(session.images.length||session.result.circuits.length){
   if(!confirm('Close without saving? Your photos and unsaved changes will be deleted. Your certificate stays as it is.'))return;
 }
 session.abort?.abort();session.modal.remove();session.opener?.focus();session=null;
}
function error(message){if(session){session.message=message;session.busy=false;render();}}
function scanField(r,i,group){
 const key=r.key;
 const labels={manufacturer:'Manufacturer',description:'Circuit description',ocpdBs:'BS (EN)',ocpdRating:'Rating A',ocpdType:'Type',
   breakingCapacity:'Breaking kA',rcdBs:'BS (EN)',rcdType:'Type',rcdIdn:'RCD mA',rcdRating:'Rating A',poleCount:'Number of poles',phaseAssociation:'Verified phase / line(s)',testButtonVisual:'Visible test button (NOT tested)'};
 const options={
   deviceKind:['MCB','RCBO','RCD','RCCB','MCCB','ACB','Fuse','SPD','Main switch','AFDD','Spare','Other'],
   ocpdBs:['BS EN 60898-1','BS EN 60898-2','BS EN 61009-1','BS EN 61009-2-1','BS EN 61009-2-2',
     'BS EN 60947-2','BS 3871','BS 88-2','BS 88-3','BS 3036','BS 1361','BS 1362','BS EN 60269-1',
     'BS EN 60269-2','BS EN 60269-3','Other (enter exact marking)'],
   ocpdType:['B','C','D','K','Z','1','2','3','4','gG','gL','aM','gM','gR','aR'],
   ocpdRating:['1','2','3','4','5','6','10','13','16','20','25','32','40','45','50','63','80','100','125','160','200','250'],
   breakingCapacity:['3','4.5','6','10','16','25','33','36','50'],rcdBs:['BS EN 61008-1','BS EN 61008-2-1',
     'BS EN 61008-2-2','BS EN 61009-1','BS EN 61009-2-1','BS EN 61009-2-2',
     'BS EN 62423','BS EN 60947-2','BS 4293','Other (enter exact marking)'],
   rcdType:['AC','A','F','B','N/A'],rcdIdn:['10','30','100','300','500'],rcdRating:['6','10','16','20','25','32','40','50','63','80','100'],poleCount:['1','2','3','4'],phaseAssociation:['L1','L2','L3','L1/L2/L3','L1/L2/L3/N'],testButtonVisual:['Visible','Not visible','Unclear']
 };
 const attr='data-value="'+group+':'+i+'"';
 const opt=options[key];
 // Standards and ratings are SEARCHABLE + MANUALLY EDITABLE; no valid product
 // marking is excluded by a finite preset list.
 const editable=opt && key!=='deviceKind';
 const listId='scan-options-'+group+'-'+i;
 const select=editable?'<input '+attr+' list="'+listId+'" value="'+esc(r.value)+'" autocomplete="off" placeholder="Type or select exact marking">'+
   '<datalist id="'+listId+'">'+[...new Set(opt)].map(v=>'<option value="'+esc(v)+'"></option>').join('')+'</datalist>':
   opt?'<select '+attr+'><option value="">Select</option>'+[...new Set([...opt,r.value].filter(Boolean))].map(v=>'<option value="'+esc(v)+'" '+(v===r.value?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>':
   '<input '+attr+' value="'+esc(r.value)+'" autocomplete="off" placeholder="'+(key==='description'?'e.g. Sockets':'')+'">';
 return '<label class="scan-input"><span>'+esc(labels[key]||core.circuitKeys[key]||key)+'</span>'+select+'</label>'+((r.value&&(r.reason||r.evidence?.length))?'<small class="meta scan-field-evidence">'+esc((r.confidence==='high'?'Clearly read — ':'Check — ')+(r.reason||'')+(r.evidence?.length?' · Photo '+r.evidence.map(e=>e.image).join(', '):''))+'</small>':'');
}
function render(){
 const s=session;if(!s)return;
 const cert=s.adapter.getCert(),boards=cert.tables?.boards||[];
 const actual=boards.find(b=>b.ref===s.boardRef)||{},brand=s.result.board.find(r=>r.key==='manufacturer');
 const photoCards=s.images.map((im,i)=>'<div class="scan-photo"><img src="'+im+'" alt="Board photo '+(i+1)+'"><span>Photo '+(i+1)+'</span><button class="btn small" data-rotate="'+i+'">Rotate</button><button class="btn small danger" data-remove="'+i+'">✕</button></div>').join('');
 const items=s.result.circuits.map((d,i)=>{
   const kind=d.fields.find(f=>f.key==='deviceKind')?.value||'';
   const title=d.fields.find(f=>f.key==='description')?.value||'';
   const rating=d.fields.find(f=>f.key==='ocpdRating')?.value||'';
   const curve=d.fields.find(f=>f.key==='ocpdType')?.value||'';
   const n=d.number||String(i);
   const fixed=kind==='Main switch'||kind==='SPD'||kind==='Spare';
   const label=kind==='Main switch'?'MAIN SWITCH':kind==='SPD'?'SPD':kind==='Spare'?'SPARE':title||((curve||'')+(rating||'')+(rating?' A':''))||'New circuit';
   const selected=s.active==='c'+i;
   const editable=[...d.fields].filter(f=>['description','deviceManufacturer','deviceModel','deviceKind','ocpdBs','ocpdRating','ocpdType','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating','poleCount','phaseAssociation','testButtonVisual'].includes(f.key));
   const missing=['description','deviceManufacturer','deviceModel','deviceKind','ocpdBs','ocpdRating','ocpdType','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating','poleCount','phaseAssociation','testButtonVisual'].filter(key=>!editable.some(f=>f.key===key)).map(key=>({key,value:'',accepted:false,evidence:[]}));
   const fields=[...editable,...missing],fkey=k=>fields.findIndex(f=>f.key===k),group=(ks,title)=>'<div class="scan-field-group"><h4>'+title+'</h4><div class="scan-field-grid">'+ks.map(k=>scanField(fields[fkey(k)],fkey(k),''+i)).join('')+'</div></div>';
   // Add missing fields to the underlying review data, not just a temporary render.
   for(const f of missing)d.fields.push(f);
   const realIndices=d.fields;
   const fi=k=>realIndices.findIndex(f=>f.key===k);
   const renderKeys=ks=>ks.map(k=>scanField(realIndices[fi(k)],fi(k),String(i))).join('');
   return '<section class="scan-circuit '+(selected?'expanded':'')+'"><button class="scan-circuit-title" data-open="c'+i+'" aria-expanded="'+selected+'"><span class="scan-number">'+esc(n)+'</span><span class="scan-circuit-name"><strong>'+esc(label)+'</strong><small>'+esc(title&&label!==title?title:(curve&&rating?curve+rating+' A':''))+'</small></span><span class="scan-chevron">'+(selected?'−':'+')+'</span></button>'+(selected?'<div class="scan-circuit-body"><div class="scan-field-grid"><label class="scan-input"><span>Circuit number</span><input data-number="'+i+'" value="'+esc(n)+'" inputmode="numeric"></label>'+renderKeys(['description'])+'</div>'+(fixed?'': '<div class="scan-field-group"><h4>Overcurrent protective device</h4><div class="scan-field-grid">'+renderKeys(['deviceManufacturer','deviceModel','deviceKind','poleCount','testButtonVisual','phaseAssociation','ocpdBs','ocpdRating','ocpdType','breakingCapacity'])+'</div></div><div class="scan-field-group"><h4>RCD</h4><div class="scan-field-grid">'+renderKeys(['rcdBs','rcdType','rcdIdn','rcdRating'])+'</div></div>')+'<div class="scan-circuit-actions"><button class="btn small" data-device-up="'+i+'" '+(i===0?'disabled':'')+'>↑ Move</button><button class="btn small" data-device-down="'+i+'" '+(i===s.result.circuits.length-1?'disabled':'')+'>↓ Move</button><button class="btn small danger" data-device-delete="'+i+'">Delete</button></div></div>':'')+'</section>';
 }).join('');
 const expanded=s.active==='board'||String(s.active||'').startsWith('c');
 const custom=window.Android?.scanSheetImageBase64;
 const showCloud=s.cloudOpen;
 s.modal.innerHTML='<div class="card modal board-scan-modal scan-modern" role="dialog" aria-modal="true" aria-labelledby="board-scan-title" tabindex="-1"><header class="scan-top"><div><span class="scan-eyebrow">SPERIN CERTIFICATES</span><h2 id="board-scan-title">Consumer unit '+esc(boards.findIndex(b=>b.ref===s.boardRef)+1||1)+'</h2></div><button class="btn ghost" data-scan-command="close">✕ Close</button></header>'+
 '<div class="scan-action-bar"><button class="btn primary" data-scan-command="camera">📷 Take photo</button><label class="btn photo-pick">＋ Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" data-board-photos hidden></label><input type="file" accept="image/*" capture="environment" data-board-camera hidden></div>'+
 '<div class="scan-photo-strip">'+photoCards+'</div>'+
 '<div class="scan-side-switch"><span>Main switch</span><button data-side="right" class="btn small '+(s.mainSide==='right'?'selected':'')+'">Right</button><button data-side="left" class="btn small '+(s.mainSide==='left'?'selected':'')+'">Left</button></div>'+
 '<div class="scan-action-bar"><button class="btn small ghost scan-read" data-scan-command="ocr" '+(!custom||s.images.length===0||s.busy?'disabled':'')+'>'+(s.busy?'Reading…':'Read text offline (limited)')+'</button><button class="btn" data-scan-command="add">＋ Add circuit</button><button class="btn" data-scan-command="spare">＋ Add blank</button><button class="btn" data-scan-command="add-spd">＋ Add SPD</button></div>'+
 '<p class="scan-status" role="status" aria-live="polite">'+esc(s.message||'For best results: photograph the full board, close-ups of test buttons and device markings, plus the handwritten circuit chart.')+'</p><p class="scan-review-hint">AI can examine device shapes and test buttons; offline reading is text-only. Confirm every BS number, blank space, phase and position. Photo appearance never proves a functional test.</p>'+(s.result.warnings.length?'<div class="scan-warnings" role="alert"><strong>Items to check</strong><ul>'+s.result.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></div>':'')+
 '<section class="scan-board '+(expanded?'expanded':'')+'"><button class="scan-circuit-title" data-open="board" aria-expanded="'+expanded+'"><span class="scan-number">1</span><span class="scan-circuit-name"><strong>Consumer unit</strong><small>'+esc(brand?.value||actual.manufacturer||s.boardRef)+'</small></span><span class="scan-chevron">'+(expanded?'−':'+')+'</span></button>'+(expanded?'<div class="scan-circuit-body"><div class="scan-field-grid">'+
  ['manufacturer','model','mainSwitch','spd','spdBs'].map(key=>{
    const field=s.result.board.find(x=>x.key===key);
    const names={manufacturer:'Manufacturer',model:'Consumer unit model',mainSwitch:'Main switch',spd:'SPD type and markings',spdBs:'SPD standard (e.g. BS EN 61643-11)'};
    return '<label class="scan-input"><span>'+names[key]+'</span><input data-board-key="'+key+'" value="'+esc(field?.value||actual[key]||'')+'" placeholder="Confirm from label"></label>';
  }).join('')+'</div></div>':'')+(expanded?'<div class="scan-section-heading"><h3>Circuits</h3><span>'+s.result.circuits.length+' listed</span></div><div class="scan-circuits">'+(items||'<div class="scan-empty">Add photos to read your consumer unit, or add a circuit.</div>')+'</div>':'')+'</section>'+
 '<div class="scan-cloud"><button class="btn primary" data-scan-command="cloud-toggle">'+(showCloud?'−':'＋')+' Read photos with visual AI</button>'+(showCloud?'<div class="scan-cloud-content"><p>Recommended: cloud AI examines device types, test buttons, markings, physical rows and handwritten legends. Requires the server API, sign-in and available credit; the electrician must verify the results.</p><label class="scan-consent"><input type="checkbox" data-board-consent '+(s.consent?'checked':'')+'> I consent to sending these photos for visual AI analysis</label><button class="btn primary" data-scan-command="analyse" '+(!s.consent||!s.images.length?'disabled':'')+'>Analyse device photos with AI</button>'+(s.needsLogin?'<div class="scan-login"><p>Sign in to use your business cloud scanner.</p><button class="btn small" data-scan-command="request-code">Email me a sign-in code</button><input data-login-code inputmode="numeric" placeholder="Code from email"><button class="btn" data-scan-command="verify-code">Sign in</button></div>':'')+'</div>':'')+'</div>'+
 '<div class="scan-savebar"><button class="btn primary" data-scan-command="apply" '+(s.busy?'disabled':'')+'>✓ Add to Certificate</button></div></div>';
}
async function preparePhoto(source,rotate=0){const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Unreadable image. Choose a JPEG, PNG or WebP photo.'));img.src=source;});const scale=Math.min(1,2400/Math.max(img.width,img.height));const w=Math.round(img.width*scale),h=Math.round(img.height*scale),canvas=document.createElement('canvas');canvas.width=rotate?h:w;canvas.height=rotate?w:h;const ctx=canvas.getContext('2d');if(rotate){ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);}ctx.drawImage(img,0,0,w,h);const data=canvas.toDataURL('image/jpeg',.88);if(data.length>2400000)throw Error('Photo is too detailed to upload safely. Try a closer crop.');return data;}
async function addPhoto(source){const s=session;if(!s||s.images.length>=6)return error('Up to six photos per scan.');try{const data=await preparePhoto(source);if(session!==s)return;s.images.push(data);s.consent=false;render();}catch(e){error(e.message);}}
async function files(list){for(const f of list){if(f.size>20*1024*1024){error('Photo exceeds 20 MB. Choose a smaller image.');continue;}const url=URL.createObjectURL(f);try{await addPhoto(url);}finally{URL.revokeObjectURL(url);}}}
async function analyse(){const s=session;if(!s||s.busy||!s.consent||!s.images.length)return;s.busy=true;s.abort=new AbortController();s.message='Analysing device markings and circuit labels together…';render();const timer=setTimeout(()=>s.abort.abort(),90000);try{const teamSession=await fetch('/api/certificates/session',{credentials:'same-origin'}).then(r=>r.ok).catch(()=>false);const target=teamSession?'/api/certificates/scan':endpoint;const response=await fetch(target,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({images:s.images,consent:true}),signal:s.abort.signal});const data=await response.json();if(session!==s)return;if(!response.ok){s.needsLogin=response.status===401;if(window.Android?.scanSheetImageBase64&&[401,429,502,503].includes(response.status)){s.busy=false;s.message='Visual AI unavailable ('+response.status+'). Switching to LIMITED TEXT-ONLY reading — device appearance, test buttons and hidden markings are NOT verified.';render();return ocr();}throw Error(data.error||'Cloud analysis unavailable. Use on-device text reading or manual entry.');}const next=core.normalise(data,s.images.length);
 // Confirmed edits survive a rescan. New circuit proposals never silently replace old mappings.
 for(const old of s.result.board.filter(r=>r.accepted)){const index=next.board.findIndex(r=>r.key===old.key);if(index>=0){if(next.board[index].value!==old.value)next.warnings.push('New photo differs from confirmed '+core.boardKeys[old.key]+'. Your confirmed value was retained.');next.board[index]=old;}else next.board.push(old);}
 const kept=s.result.circuits.filter(d=>d.fields.some(r=>r.accepted));next.circuits=[...kept,...next.circuits];if(kept.length)next.warnings.push('Previously confirmed devices retained. Review new proposals for duplicates before applying.');
 const mapped=(s.adapter.getCert().type!=='minor'&&!kept.length)?(core.numberFromMain(next,s.adapter.getCert(),s.boardRef),next.circuits.length):suggestDeviceTargets(next,s.adapter.getCert(),s.boardRef);s.result=next;s.message='Visual AI analysis complete. Check each device, its evidence and the original photos before saving.';s.active='board';s.busy=false;render();}catch(e){if(session===s)error(e.name==='AbortError'?'Analysis timed out. Photos and previous proposals are still available.':e.message);}finally{clearTimeout(timer);}}
function suggestDeviceTargets(result,cert,boardRef){
 // Only trustworthy, uniquely numbered device/circuit associations may preselect a destination.
 // Manual review, the one-device confirmation and final diff remain mandatory.
 if(cert.type==='minor')return 0;
 const existing=(cert.tables?.circuits||[]).filter(c=>c.boardRef===boardRef&&!c._incomingFeed);
 const numbers=result.circuits.map(d=>{
   const field=d.fields.find(r=>r.key==='circuitNo');
   const value=String(field?.value||'').trim();
   return d.association==='high'&&field?.confidence==='high'&&/^\d+[A-Za-z]?$/.test(value)?value:'';
 });
 let mapped=0;
 result.circuits.forEach((device,i)=>{
   const number=numbers[i];
   if(!number||numbers.filter(n=>n===number).length!==1||device.target)return;
   const matches=existing.filter(c=>String(c.circuitNo)===number);
   if(matches.length>1)return;
   device.target=matches.length?matches[0].id:'new';
   device.number=number;
   mapped++;
 });
 return mapped;
}
function apply(){
 const s=session;if(!s||s.busy)return;
 try{
   const cert=s.adapter.getCert(),boardRef=s.boardRef;
   const board=cert.tables?.boards?.find(b=>b.ref===boardRef);
   if(!board&&cert.type!=='minor')throw Error('Please select a consumer unit.');
   const proposal={board:s.result.board.map(f=>({...f,accepted:['manufacturer','model','mainSwitch','spd','spdBs'].includes(f.key)&&!!String(f.value||'').trim()})),circuits:[],warnings:[]};
   const usedNumbers=new Set();
   for(let i=0;i<s.result.circuits.length;i++){
     const d=s.result.circuits[i],n=String(d.number??i).trim();
     if(!/^\d+$/.test(n))throw Error('Check the number for circuit '+(i+1)+'.');
     if(usedNumbers.has(n))throw Error('Circuit '+n+' has been entered twice.');
     usedNumbers.add(n);
     const same=(cert.tables?.circuits||[]).filter(row=>row.boardRef===boardRef&&String(row.circuitNo)===n&&!row._incomingFeed);
     if(same.length>1)throw Error('Circuit '+n+' needs checking in the certificate.');
     const kind=d.fields.find(f=>f.key==='deviceKind')?.value||'';
     const acceptedKeys=new Set(['description','deviceManufacturer','deviceModel','deviceKind','ocpdBs','ocpdType','ocpdRating','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating','poleCount','phaseAssociation','testButtonVisual']);
     const fields=d.fields.map(f=>({...f,accepted:acceptedKeys.has(f.key)&&!!String(f.value||'').trim()}));
     // Spare, main switch and SPD are schedule positions, not tested outgoing circuits.
     if(['Spare','Main switch','SPD'].includes(kind)){
       for(const f of fields)if(!['description','deviceKind'].includes(f.key))f.accepted=false;
     }
     const filled=fields.some(f=>f.accepted);
     if(!filled)continue;
     
     proposal.circuits.push({...d,fields,number:n,target:same.length?same[0].id:cert.type==='minor'?'minor':'new'});
   }
   if(!proposal.circuits.length&&!proposal.board.some(f=>f.accepted))throw Error('Add or read a circuit before saving.');
   if(!confirm('Have you checked ALL device markings, protective-device ratings and standards, spare ways, and their actual positions against the consumer unit?\n\nPress OK for YES, or Cancel for NO and return to the review.')) {
     s.message='Review the devices and positions before adding them.';
     render();return;
   }
   const before=JSON.stringify(cert),result=core.propose(cert,boardRef,proposal);
   if(!result.changes.length){s.modal.remove();session=null;s.adapter.commit(result.certificate);return;}
   const replaced=result.changes.filter(c=>c.before&&c.before!==c.after&&
     (/^Circuit \d+/.test(c.label))).length;
   if(replaced&&!confirm('Some existing circuit details will change. Save these changes?'))return;
   if(JSON.stringify(s.adapter.getCert())!==before)throw Error('The certificate changed. Please try saving again.');
   s.adapter.commit(result.certificate);
   s.modal.remove();session=null;
   // The host updates its certificate view and shows the saved confirmation.
 }catch(ex){error('Could not save. '+ex.message);}
}
async function login(verify){const s=session;try{const code=s.modal.querySelector('[data-login-code]')?.value||'';const r=await fetch('/api/owner/'+(verify?'verify-code':'request-code'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'info@sperinservices.co.uk',...(verify?{code}:{})})});const data=await r.json();if(!r.ok)throw Error(data.error||'Sign-in unavailable');if(session!==s)return;s.needsLogin=!verify;s.message=verify?'Signed in. Press Analyse to send your photos.':'Sign-in code sent to your owner email.';render();}catch(e){error(e.message);}}
// OCR can propose visible device markings, but cannot establish physical way order.
// Keep proposals unconfirmed and unmapped; the installer must verify each device.
function ocr(){const s=session;if(!window.Android?.scanSheetImageBase64)return error('On-device OCR is available in the Android app. You can still enter visible markings manually.');s.ocr='';s.ocrPhotos=[];s.ocrIndex=0;s.busy=true;nextOcr();}
// Count visible dark spare-module covers by comparing their width to the
// measured spacing of adjacent B/C/D-labelled devices. This is an estimate,
// not a certification of positions; the installer can edit the rows.
async function estimateBlankWayHint(dataUri,ocr){
 const raw=Array.isArray(ocr?.lines)?ocr.lines.filter(l=>Number.isFinite(l.left)&&Number.isFinite(l.right)&&Number.isFinite(l.top)&&
 /(?:^|[^A-Z0-9])[BCD]\s?(?:6|10|16|20|25|32|40|50|63)(?:\s?A)?(?:$|[^0-9])/i.test(l.text||'')):[];
 if(raw.length<3)return 0;
 const centers=raw.map(l=>(l.left+l.right)/2).sort((a,b)=>a-b);
 const width=Number(ocr.width)||0;
 if(width<250)return 0;
 const distances=centers.slice(1).map((v,i)=>v-centers[i]).filter(v=>v>width*.024&&v<width*.13).sort((a,b)=>a-b);
 if(distances.length<2)return 0;
 const pitch=distances[Math.floor(distances.length/2)];
 const xmin=centers[0],y=Math.round(raw.reduce((sum,l)=>sum+(l.top+l.bottom)/2,0)/raw.length);
 const photo=new Image();
 await new Promise((resolve,reject)=>{photo.onload=resolve;photo.onerror=reject;photo.src=dataUri;});
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Number(ocr.height)||photo.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return 0;
 ctx.drawImage(photo,0,0,canvas.width,canvas.height);
 const from=Math.max(Math.round(width*.055),Math.round(xmin-pitch*12)),to=Math.min(canvas.width-1,Math.round(xmin-pitch*.55));
 const y0=Math.max(0,Math.round(y+10)),y1=Math.min(canvas.height,Math.round(y+Math.min(pitch*.85,60)));
 if(to-from<pitch*2||y1-y0<12)return 0;
 const pixels=ctx.getImageData(from,y0,to-from,y1-y0).data,rows=y1-y0,cols=to-from,ratio=[];
 for(let x=0;x<cols;x++){
   let dark=0;
   for(let yy=0;yy<rows;yy+=2){
     const i=(yy*cols+x)*4,grey=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];
     if(grey<145)dark++;
   }
   ratio.push(dark/Math.ceil(rows/2));
 }
 let start=-1;
 for(let x=0;x<cols-12;x++){
   let average=0;
   for(let k=0;k<12;k++)average+=ratio[x+k];
   if(average/12>.43){start=x;break;}
 }
 if(start<0)return 0;
 const occupied=ratio.slice(start),mostlyDark=occupied.filter(v=>v>.35).length/occupied.length;
 if(mostlyDark<.48)return 0;
 const estimated=Math.round((xmin-(from+start))/pitch);
 return estimated>=1&&estimated<=12?estimated:0;
}
async function nextOcr(){
 const s=session;if(!s)return;
 if(s.ocrIndex>=s.images.length){
   s.busy=false;
   for(let i=0;i<(s.ocrPhotos||[]).length;i++){
     try{s.ocrPhotos[i].blankWayHint=await estimateBlankWayHint(s.images[i],s.ocrPhotos[i]);}
     catch{ /* Keep photo OCR results when the visual gap estimate is uncertain. */ }
   }
   if(session!==s)return;
   const candidates=core.localOcrCandidates(s.ocrPhotos||[],{mainSide:s.mainSide});
   const cert=s.adapter.getCert();
   for(const r of candidates.board){
     const old=s.result.board.find(f=>f.key===r.key);
     if(old&&!old.accepted){old.value=r.value;old.reason=r.reason;old.confidence='check';old.evidence=r.evidence;}
     else if(!old)s.result.board.push(r);
   }
   for(const d of candidates.devices)
     for(const key of Object.keys(core.circuitKeys))
       if(!d.fields.some(f=>f.key===key))d.fields.push({key,value:'',confidence:'missing',evidence:[],reason:'Not identified by OCR. Enter only verified markings.',accepted:false});
   const approved=s.result.circuits.filter(d=>d.fields.some(f=>f.accepted));
   s.result.circuits=[...approved,...candidates.devices];
   s.result.warnings.push(...candidates.warnings);
   if(candidates.physicalOrderKnown&&!approved.length&&cert.type!=='minor'){
     try{core.numberFromMain(s.result,cert,s.boardRef);}catch(e){s.result.warnings.push(e.message);}
   }else if(approved.length){
     s.result.warnings.push('Previous confirmed devices retained. Check for duplicates; previously approved rows were not automatically renumbered.');
   }
   s.message='Photos read with limited TEXT-ONLY OCR. Test buttons, unmarked MCBs and actual BS standards cannot be confirmed this way. Check the original photos.';
   s.active='board';
   render();return;
 }
 s.token='board-ocr-'+(++seq);window.Android.scanSheetImageBase64(s.token,s.images[s.ocrIndex]);
 s.ocrTimer=setTimeout(()=>{if(session===s&&s.busy){s.busy=false;s.token='';error('On-device text reading timed out. You can retry or enter markings manually.');}},30000);
}
window.SperinConsumerScan={open(adapter,boardRef){if(session)return;const modal=document.createElement('div');modal.className='modal-backdrop board-scan-backdrop';session={adapter,boardRef,modal,opener:document.activeElement,images:[],result:core.blank(),message:'',consent:false,busy:false,mainSide:'right',cloudOpen:false,active:'board'};document.body.appendChild(modal);render();modal.querySelector('[data-scan-command="close"]').focus();},close,ocrResult(token,json,err){if(!session||token!==session.token)return false;clearTimeout(session.ocrTimer);session.token='';try{const result=err?{fullText:'',lines:[]}:(JSON.parse(json)||{});const value=err||result.fullText||'';session.ocrPhotos.push(err?{fullText:'',lines:[]}:result);session.ocr+='Photo '+(session.ocrIndex+1)+'\n'+(value||'No readable text')+'\n\n';}catch{session.ocrPhotos.push({fullText:'',lines:[]});session.ocr+='Unreadable OCR response\n';}session.ocrIndex++;nextOcr();return true;},isOpen:()=>!!session};
window.sperinBoardPhotoResult=(token,data,errorMessage)=>{if(!session||session.cameraToken!==token)return;session.cameraToken='';if(errorMessage)return error(errorMessage);addPhoto(data);};
document.addEventListener('change',function(e){
 if(!session||!session.modal.contains(e.target))return;
 const el=e.target,s=session;
 if(el.matches('[data-board-photos],[data-board-camera]'))files(el.files);
 if(el.matches('[data-board-consent]')){s.consent=el.checked;render();}

 if(el.dataset.value){const [group,idx]=el.dataset.value.split(':'),f=s.result.circuits[Number(group)]?.fields[Number(idx)];if(f){
   f.value=el.value;
   if(f.key==='deviceKind'){
     const d=s.result.circuits[Number(group)];
     const defaults={MCB:{ocpdBs:'BS EN 60898-1'},RCBO:{ocpdBs:'BS EN 61009-1',rcdBs:'BS EN 61009-1'},
       RCD:{rcdBs:'BS EN 61008-1'},RCCB:{rcdBs:'BS EN 61008-1'}};
     for(const [key,value] of Object.entries(defaults[el.value]||{})){
       let dfield=d.fields.find(z=>z.key===key);
       if(!dfield){dfield={key,value:'',confidence:'missing',reason:'',evidence:[],accepted:false};d.fields.push(dfield);}
       if(!dfield.value){
         dfield.value=value;dfield.confidence='check';
         dfield.reason='Suggested from selected device type, NOT verified by printed product standard.';
       }
     }
     render();
   }
 }}
});
document.addEventListener('input',function(e){
 if(!session||!session.modal.contains(e.target))return;
 const el=e.target,s=session;
 if(el.dataset.value){const [group,idx]=el.dataset.value.split(':'),f=s.result.circuits[Number(group)]?.fields[Number(idx)];if(f){f.value=el.value;const d=s.result.circuits[Number(group)];if(d)d.verified=false;}}
 if(el.dataset.number!==undefined){const d=s.result.circuits[Number(el.dataset.number)];if(d){d.number=el.value;d.verified=false;}}
 if(el.hasAttribute('data-board-key')){
   const key=el.dataset.boardKey;
   if(!Object.hasOwn(core.boardKeys,key))return;
   let f=s.result.board.find(x=>x.key===key);
   if(!f){f={key,value:'',accepted:false,evidence:[]};s.result.board.push(f);}
   f.value=el.value;
 }
 if(el.hasAttribute('data-brand')){
   let f=s.result.board.find(f=>f.key==='manufacturer');
   if(!f){f={key:'manufacturer',value:'',accepted:false,evidence:[]};s.result.board.push(f);}
   f.value=el.value;
 }
});
document.addEventListener('click',function(e){
 if(!session||!session.modal.contains(e.target))return;
 const el=e.target.closest('button');if(!el)return;
 const s=session,cmd=el.dataset.scanCommand;
 if(cmd==='close')return close();
 if(s.busy)return;
 if(el.dataset.open!==undefined){s.active=s.active===el.dataset.open?'':el.dataset.open;render();return;}
 if(el.dataset.side){
   if(s.mainSide===el.dataset.side)return;
   if(s.result.circuits.some(d=>d.verified)&&!confirm('Changing the main-switch side will clear the reviewed device list. Continue?'))return;
   s.mainSide=el.dataset.side;
   if(s.ocrPhotos?.length){
     const next=core.localOcrCandidates(s.ocrPhotos,{mainSide:s.mainSide});
     s.result.circuits=next.devices;
     if(s.adapter.getCert().type!=='minor')core.numberFromMain(s.result,s.adapter.getCert(),s.boardRef);
     s.message='Order updated. Check the details, then save.';
   }
   s.active='board';render();return;
 }
 if(cmd==='cloud-toggle'){s.cloudOpen=!s.cloudOpen;render();return;}
 if(cmd==='camera'){if(window.Android?.captureBoardPhoto){s.cameraToken='board-photo-'+(++seq);window.Android.captureBoardPhoto(s.cameraToken);}else s.modal.querySelector('[data-board-camera]').click();return;}
 if(cmd==='analyse')return analyse();
 if(cmd==='ocr')return ocr();
 if(cmd==='apply')return apply();
 if(cmd==='request-code')return login(false);
 if(cmd==='verify-code')return login(true);
 if(cmd==='add'||cmd==='spare'||cmd==='add-spd'){
   const d=core.draftDevice();
   if(cmd==='spare'){d.fields.find(f=>f.key==='description').value='SPARE';d.fields.find(f=>f.key==='deviceKind').value='Spare';}
   if(cmd==='add-spd'){d.fields.find(f=>f.key==='description').value='SPD';d.fields.find(f=>f.key==='deviceKind').value='SPD';}
   const hadDevices=s.result.circuits.length;
   s.result.circuits.push(d);
   try{
     if(s.adapter.getCert().type!=='minor'){
       const stored=(s.adapter.getCert().tables?.circuits||[]).filter(v=>v.boardRef===s.boardRef&&!v._incomingFeed);
       if(!hadDevices&&!stored.length)core.numberFromMain(s.result,s.adapter.getCert(),s.boardRef);
       else d.number=String(Math.max(-1,...stored.map(v=>Number(v.circuitNo)).filter(Number.isFinite),...s.result.circuits.slice(0,-1).map(v=>Number(v.number)).filter(Number.isFinite))+1);
     }else d.target='minor';
   }catch(ex){s.message=ex.message;}
   s.active='c'+s.result.circuits.indexOf(d);render();return;
 }
 if(el.dataset.deviceDelete!==undefined){
   const i=Number(el.dataset.deviceDelete),d=s.result.circuits[i];
   s.result.circuits.splice(i,1);
   if(['Main switch','SPD','Spare'].includes(d?.fields.find(f=>f.key==='deviceKind')?.value)){
     // Respect manual removal of an SPD, even if the original board still has a value.
     if(d?.fields.find(f=>f.key==='deviceKind')?.value==='SPD')s.result.board.push({key:'spd',value:'Not fitted',accepted:false,evidence:[]});
   }
   s.result.circuits.forEach((d,i)=>{d.number=String(i);d.verified=false;});
   s.active='board';render();return;
 }
 if(el.dataset.deviceUp!==undefined||el.dataset.deviceDown!==undefined){
   const i=Number(el.dataset.deviceUp??el.dataset.deviceDown),j=i+(el.dataset.deviceUp!==undefined?-1:1);
   if(j>=0&&j<s.result.circuits.length){
     [s.result.circuits[i],s.result.circuits[j]]=[s.result.circuits[j],s.result.circuits[i]];
     s.result.circuits.forEach((d,k)=>{d.number=String(k);d.target='';d.verified=false;});
     s.active='c'+j;render();
   }return;
 }
 if(el.dataset.remove!==undefined){
   s.images.splice(Number(el.dataset.remove),1);s.message='Photo removed.';render();return;
 }
 if(el.dataset.rotate!==undefined){
   (async()=>{try{const i=Number(el.dataset.rotate);s.images[i]=await preparePhoto(s.images[i],90);render();}catch(ex){error(ex.message);}})();return;
 }
});
document.addEventListener('keydown',e=>{if(!session)return;const diff=document.querySelector('.board-scan-diff');if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(diff)diff.remove();else close();}if(e.key==='Tab'){const box=diff||session.modal;const els=[...box.querySelectorAll('button:not(:disabled),input:not([hidden]):not(:disabled),select')].filter(x=>x.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}},true);
})();
