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
   breakingCapacity:'Breaking kA',rcdBs:'BS (EN)',rcdType:'Type',rcdIdn:'RCD mA',rcdRating:'Rating A'};
 const options={
   ocpdBs:['BS EN 61009-1','BS EN 60898-1','BS 88-3','BS EN 60947-2','BS 3036','BS EN 60269-1'],
   ocpdType:['B','C','D','gG','gL'],ocpdRating:['2','3','4','6','10','16','20','25','32','40','50','63','80','100'],
   breakingCapacity:['3','4.5','6','10','16','25','33','50'],rcdBs:['BS EN 61009-1','BS EN 61008-1','BS EN 62423'],
   rcdType:['AC','A','F','B','N/A'],rcdIdn:['10','30','100','300','500'],rcdRating:['6','10','16','20','25','32','40','50','63','80','100']
 };
 const attr='data-value="'+group+':'+i+'"';
 const opt=options[key];
 const select=opt?'<select '+attr+'><option value="">Select</option>'+[...new Set([...opt,r.value].filter(Boolean))].map(v=>'<option value="'+esc(v)+'" '+(v===r.value?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'
   :'<input '+attr+' value="'+esc(r.value)+'" autocomplete="off" placeholder="'+(key==='description'?'e.g. Sockets':'')+'">';
 return '<label class="scan-input"><span>'+esc(labels[key]||core.circuitKeys[key]||key)+'</span>'+select+'</label>';
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
   const editable=[...d.fields].filter(f=>['description','ocpdBs','ocpdRating','ocpdType','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating'].includes(f.key));
   const missing=['description','ocpdBs','ocpdRating','ocpdType','breakingCapacity','rcdBs','rcdType','rcdIdn','rcdRating'].filter(key=>!editable.some(f=>f.key===key)).map(key=>({key,value:'',accepted:false,evidence:[]}));
   const fields=[...editable,...missing],fkey=k=>fields.findIndex(f=>f.key===k),group=(ks,title)=>'<div class="scan-field-group"><h4>'+title+'</h4><div class="scan-field-grid">'+ks.map(k=>F(fields[fkey(k)],fkey(k),''+i)).join('')+'</div></div>';
   // Add missing fields to the underlying review data, not just a temporary render.
   for(const f of missing)d.fields.push(f);
   const realIndices=d.fields;
   const fi=k=>realIndices.findIndex(f=>f.key===k);
   const renderKeys=ks=>ks.map(k=>F(realIndices[fi(k)],fi(k),String(i))).join('');
   return '<section class="scan-circuit '+(selected?'expanded':'')+'"><button class="scan-circuit-title" data-open="c'+i+'" aria-expanded="'+selected+'"><span class="scan-number">'+esc(n)+'</span><span class="scan-circuit-name"><strong>'+esc(label)+'</strong><small>'+esc(title&&label!==title?title:(curve&&rating?curve+rating+' A':''))+'</small></span><span class="scan-chevron">'+(selected?'−':'+')+'</span></button>'+(selected?'<div class="scan-circuit-body"><div class="scan-field-grid"><label class="scan-input"><span>Circuit number</span><input data-number="'+i+'" value="'+esc(n)+'" inputmode="numeric"></label>'+renderKeys(['description'])+'</div>'+(fixed?'': '<div class="scan-field-group"><h4>Overcurrent protective device</h4><div class="scan-field-grid">'+renderKeys(['ocpdBs','ocpdRating','ocpdType','breakingCapacity'])+'</div></div><div class="scan-field-group"><h4>RCD</h4><div class="scan-field-grid">'+renderKeys(['rcdBs','rcdType','rcdIdn','rcdRating'])+'</div></div>')+'<div class="scan-circuit-actions"><button class="btn small" data-device-up="'+i+'" '+(i===0?'disabled':'')+'>↑ Move</button><button class="btn small" data-device-down="'+i+'" '+(i===s.result.circuits.length-1?'disabled':'')+'>↓ Move</button><button class="btn small danger" data-device-delete="'+i+'">Delete</button></div></div>':'')+'</section>';
 }).join('');
 const expanded=s.active==='board';
 const custom=window.Android?.scanSheetImageBase64;
 const showCloud=s.cloudOpen;
 s.modal.innerHTML='<div class="card modal board-scan-modal scan-modern" role="dialog" aria-modal="true" aria-labelledby="board-scan-title" tabindex="-1"><header class="scan-top"><div><span class="scan-eyebrow">SPERIN CERTIFICATES</span><h2 id="board-scan-title">Consumer unit '+esc(boards.findIndex(b=>b.ref===s.boardRef)+1||1)+'</h2></div><button class="btn ghost" data-scan-command="close">✕ Close</button></header>'+
 '<div class="scan-action-bar"><button class="btn primary" data-scan-command="camera">📷 Take photo</button><label class="btn photo-pick">＋ Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" data-board-photos hidden></label><input type="file" accept="image/*" capture="environment" data-board-camera hidden></div>'+
 '<div class="scan-photo-strip">'+photoCards+'</div>'+
 '<div class="scan-side-switch"><span>Main switch</span><button data-side="right" class="btn small '+(s.mainSide==='right'?'selected':'')+'">Right</button><button data-side="left" class="btn small '+(s.mainSide==='left'?'selected':'')+'">Left</button></div>'+
 '<div class="scan-action-bar"><button class="btn primary scan-read" data-scan-command="ocr" '+(!custom||s.images.length===0||s.busy?'disabled':'')+'>'+(s.busy?'Reading…':'Read photos')+'</button><button class="btn" data-scan-command="add">＋ Add circuit</button><button class="btn" data-scan-command="spare">＋ Add blank</button><button class="btn" data-scan-command="add-spd">＋ Add SPD</button></div>'+
 '<p class="scan-status" role="status" aria-live="polite">'+esc(s.message||'Check the details, then save.')+'</p>'+
 '<section class="scan-board '+(expanded?'expanded':'')+'"><button class="scan-circuit-title" data-open="board" aria-expanded="'+expanded+'"><span class="scan-number">1</span><span class="scan-circuit-name"><strong>Consumer unit</strong><small>'+esc(brand?.value||actual.manufacturer||s.boardRef)+'</small></span><span class="scan-chevron">'+(expanded?'−':'+')+'</span></button>'+(expanded?'<div class="scan-circuit-body"><label class="scan-input"><span>Manufacturer</span><input data-brand value="'+esc(brand?.value||actual.manufacturer||'')+'"></label></div>':'')+'</section>'+
 '<div class="scan-section-heading"><h3>Circuits</h3><span>'+s.result.circuits.length+' listed</span></div><div class="scan-circuits">'+(items||'<div class="scan-empty">Add photos to read your consumer unit, or add a circuit.</div>')+'</div>'+
 '<div class="scan-cloud"><button class="btn small ghost" data-scan-command="cloud-toggle">'+(showCloud?'−':'＋')+' Cloud scan (optional)</button>'+(showCloud?'<div class="scan-cloud-content"><p>Cloud scanning needs a separate AI service with available credit.</p><label class="scan-consent"><input type="checkbox" data-board-consent '+(s.consent?'checked':'')+'> Allow cloud use of these photos</label><button class="btn" data-scan-command="analyse" '+(!s.consent||!s.images.length?'disabled':'')+'>Use cloud scan</button>'+(s.needsLogin?'<div class="scan-login"><p>Sign in to use your business cloud scanner.</p><button class="btn small" data-scan-command="request-code">Email me a sign-in code</button><input data-login-code inputmode="numeric" placeholder="Code from email"><button class="btn" data-scan-command="verify-code">Sign in</button></div>':'')+'</div>':'')+'</div>'+
 '<div class="scan-savebar"><button class="btn primary" data-scan-command="apply" '+(s.busy?'disabled':'')+'>✓ Save to certificate</button></div></div>';
}
async function preparePhoto(source,rotate=0){const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Unreadable image. Choose a JPEG, PNG or WebP photo.'));img.src=source;});const scale=Math.min(1,2400/Math.max(img.width,img.height));const w=Math.round(img.width*scale),h=Math.round(img.height*scale),canvas=document.createElement('canvas');canvas.width=rotate?h:w;canvas.height=rotate?w:h;const ctx=canvas.getContext('2d');if(rotate){ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);}ctx.drawImage(img,0,0,w,h);const data=canvas.toDataURL('image/jpeg',.88);if(data.length>2400000)throw Error('Photo is too detailed to upload safely. Try a closer crop.');return data;}
async function addPhoto(source){const s=session;if(!s||s.images.length>=6)return error('Up to six photos per scan.');try{const data=await preparePhoto(source);if(session!==s)return;s.images.push(data);s.consent=false;render();}catch(e){error(e.message);}}
async function files(list){for(const f of list){if(f.size>20*1024*1024){error('Photo exceeds 20 MB. Choose a smaller image.');continue;}const url=URL.createObjectURL(f);try{await addPhoto(url);}finally{URL.revokeObjectURL(url);}}}
async function analyse(){const s=session;if(!s||s.busy||!s.consent||!s.images.length)return;s.busy=true;s.abort=new AbortController();s.message='Analysing device markings and circuit labels together…';render();const timer=setTimeout(()=>s.abort.abort(),90000);try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({images:s.images,consent:true}),signal:s.abort.signal});const data=await response.json();if(session!==s)return;if(!response.ok){s.needsLogin=response.status===401;if(window.Android?.scanSheetImageBase64&&[401,429,502,503].includes(response.status)){s.busy=false;s.message='Cloud scan is unavailable ('+response.status+'). Switching to no-credit, on-device photo reading.';render();return ocr();}throw Error(data.error||'Cloud analysis unavailable. Use on-device text reading or manual entry.');}const next=core.normalise(data,s.images.length);
 // Confirmed edits survive a rescan. New circuit proposals never silently replace old mappings.
 for(const old of s.result.board.filter(r=>r.accepted)){const index=next.board.findIndex(r=>r.key===old.key);if(index>=0){if(next.board[index].value!==old.value)next.warnings.push('New photo differs from confirmed '+core.boardKeys[old.key]+'. Your confirmed value was retained.');next.board[index]=old;}else next.board.push(old);}
 const kept=s.result.circuits.filter(d=>d.fields.some(r=>r.accepted));next.circuits=[...kept,...next.circuits];if(kept.length)next.warnings.push('Previously confirmed devices retained. Review new proposals for duplicates before applying.');
 const mapped=(s.adapter.getCert().type!=='minor'&&!kept.length)?(core.numberFromMain(next,s.adapter.getCert(),s.boardRef),next.circuits.length):suggestDeviceTargets(next,s.adapter.getCert(),s.boardRef);s.result=next;s.message='Analysis ready for '+s.boardRef+'. '+(mapped?'Ordered '+mapped+' schedule position(s) from the main switch. ':'')+'Review photo-bank sequence, device order and EVERY blank way. Confirm the main switch/SPD as board components, then tick one checkbox per physical device. Nothing is saved until you confirm.';s.busy=false;render();}catch(e){if(session===s)error(e.name==='AbortError'?'Analysis timed out. Photos and previous proposals are still available.':e.message);}finally{clearTimeout(timer);}}
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
function apply(){const s=session;if(!s||s.busy)return;try{const before=JSON.stringify(s.adapter.getCert());const proposed=core.propose(s.adapter.getCert(),s.boardRef,s.result);if(!proposed.changes.length)return error('Confirm at least one changed value first.');const panel=document.createElement('div');panel.className='modal-backdrop board-scan-diff';panel.innerHTML=`<div class="card modal" role="dialog" aria-modal="true" aria-label="Confirm certificate changes"><h2>Review ${proposed.changes.length} changes</h2><div class="scan-diff-list">${proposed.changes.map(c=>`<p><strong>${esc(c.label)}</strong><br><del>${esc(c.before||'(empty)')}</del> → <ins>${esc(c.after)}</ins></p>`).join('')}</div><div class="toolbar"><button class="btn" data-cancel>Back to review</button><button class="btn primary" data-save>Confirm & save</button></div></div>`;document.body.appendChild(panel);panel.querySelector('[data-cancel]').onclick=()=>panel.remove();panel.querySelector('[data-save]').onclick=()=>{if(session!==s||JSON.stringify(s.adapter.getCert())!==before){panel.remove();return error('Certificate changed during review. Please review the changes again.');}try{s.adapter.commit(proposed.certificate);panel.remove();s.modal.remove();session=null;}catch(e){panel.remove();error('Could not save: '+e.message);}};panel.querySelector('[data-cancel]').focus();}catch(e){error(e.message);}}
async function login(verify){const s=session;try{const code=s.modal.querySelector('[data-login-code]')?.value||'';const r=await fetch('/api/owner/'+(verify?'verify-code':'request-code'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'info@sperinservices.co.uk',...(verify?{code}:{})})});const data=await r.json();if(!r.ok)throw Error(data.error||'Sign-in unavailable');if(session!==s)return;s.needsLogin=!verify;s.message=verify?'Signed in. Press Analyse to send your photos.':'Sign-in code sent to your owner email.';render();}catch(e){error(e.message);}}
// OCR can propose visible device markings, but cannot establish physical way order.
// Keep proposals unconfirmed and unmapped; the installer must verify each device.
function ocr(){const s=session;if(!window.Android?.scanSheetImageBase64)return error('On-device OCR is available in the Android app. You can still enter visible markings manually.');s.ocr='';s.ocrPhotos=[];s.ocrIndex=0;s.busy=true;nextOcr();}
function nextOcr(){
 const s=session;if(!s)return;
 if(s.ocrIndex>=s.images.length){
   s.busy=false;
   const candidates=core.localOcrCandidates(s.ocrPhotos||[]);
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
   s.message=candidates.physicalOrderKnown
     ?'On-device OCR complete. Physical positions were ordered using the main-switch side. Verify every device, bank continuation and blank before confirming.'
     :'On-device OCR complete. Readable ratings are proposals only. Verify physical order, main switch, SPD and blank ways before numbering and saving.';
   render();return;
 }
 s.token='board-ocr-'+(++seq);window.Android.scanSheetImageBase64(s.token,s.images[s.ocrIndex]);
 s.ocrTimer=setTimeout(()=>{if(session===s&&s.busy){s.busy=false;s.token='';error('On-device text reading timed out. You can retry or enter markings manually.');}},30000);
}
window.SperinConsumerScan={open(adapter,boardRef){if(session)return;const modal=document.createElement('div');modal.className='modal-backdrop board-scan-backdrop';session={adapter,boardRef,modal,opener:document.activeElement,images:[],result:core.blank(),message:'',consent:false,busy:false};document.body.appendChild(modal);render();modal.querySelector('[data-scan-command="close"]').focus();},close,ocrResult(token,json,err){if(!session||token!==session.token)return false;clearTimeout(session.ocrTimer);session.token='';try{const result=err?{fullText:'',lines:[]}:(JSON.parse(json)||{});const value=err||result.fullText||'';session.ocrPhotos.push(err?{fullText:'',lines:[]}:result);session.ocr+='Photo '+(session.ocrIndex+1)+'\n'+(value||'No readable text')+'\n\n';}catch{session.ocrPhotos.push({fullText:'',lines:[]});session.ocr+='Unreadable OCR response\n';}session.ocrIndex++;nextOcr();return true;},isOpen:()=>!!session};
window.sperinBoardPhotoResult=(token,data,errorMessage)=>{if(!session||session.cameraToken!==token)return;session.cameraToken='';if(errorMessage)return error(errorMessage);addPhoto(data);};
document.addEventListener('change',e=>{if(!session||!session.modal.contains(e.target))return;const el=e.target,s=session;if(el.matches('[data-board-photos],[data-board-camera]'))files(el.files);if(el.matches('[data-board-consent]')){s.consent=el.checked;render();}if(el.dataset.deviceConfirm!==undefined){const d=s.result.circuits[Number(el.dataset.deviceConfirm)];d.fields.forEach(r=>r.accepted=el.checked&&!!r.value.trim());}if(el.dataset.confirm){const [group,index]=el.dataset.confirm.split(':');const r=group==='board'?s.result.board[index]:s.result.circuits[group].fields[index];r.accepted=el.checked;}if(el.dataset.target!==undefined){const d=s.result.circuits[el.dataset.target];d.target=el.value;if(el.value==='new')d.number=d.fields.find(r=>r.key==='circuitNo')?.value||d.number||'';render();}});
document.addEventListener('input',e=>{if(!session||!session.modal.contains(e.target))return;const el=e.target;if(el.dataset.value){const [group,index]=el.dataset.value.split(':');const r=group==='board'?session.result.board[index]:session.result.circuits[group].fields[index];r.value=el.value;r.accepted=false;r.confidence='check';const container=el.closest('.board-scan-field');container.classList.remove('high','missing');container.classList.add('check');container.querySelector('.scan-confidence').textContent='Needs checking';const box=el.closest('.board-scan-field').querySelector('[data-confirm]');if(box){box.checked=false;box.disabled=!r.value.trim();}else{const d=session.result.circuits[Number(group)];d.fields.forEach(f=>f.accepted=false);el.closest('.scan-device').querySelector('[data-device-confirm]').checked=false;}}if(el.dataset.number!==undefined)session.result.circuits[el.dataset.number].number=el.value;});
document.addEventListener('click',async e=>{if(!session||!session.modal.contains(e.target))return;const el=e.target.closest('button');if(!el)return;const s=session;const cmd=el.dataset.scanCommand;if(cmd==='close')return close();if(s.busy)return;if(cmd==='camera'){if(window.Android?.captureBoardPhoto){s.cameraToken='board-photo-'+(++seq);window.Android.captureBoardPhoto(s.cameraToken);}else s.modal.querySelector('[data-board-camera]').click();}if(cmd==='analyse')analyse();if(cmd==='ocr')ocr();if(cmd==='apply')apply();if(cmd==='number-order'){try{core.numberFromMain(s.result,s.adapter.getCert(),s.boardRef);s.message='Numbered from MAIN SWITCH 0, then SPD if present, then RCBOs/MCBs and blanks in reviewed physical order. Tick each proposed entry only after checking the photographs.';render();}catch(e){error(e.message);}}if(cmd==='spare'){const d=core.draftDevice();d.position='Blank / spare way';d.fields.find(r=>r.key==='description').value='SPARE';d.fields.find(r=>r.key==='deviceKind').value='Spare';s.result.circuits.push(d);render();}if(el.dataset.deviceDelete!==undefined){s.result.circuits.splice(Number(el.dataset.deviceDelete),1);render();}if(el.dataset.deviceUp!==undefined||el.dataset.deviceDown!==undefined){const i=Number(el.dataset.deviceUp??el.dataset.deviceDown),j=i+(el.dataset.deviceUp!==undefined?-1:1);if(j>=0&&j<s.result.circuits.length){[s.result.circuits[i],s.result.circuits[j]]=[s.result.circuits[j],s.result.circuits[i]];s.result.circuits.forEach(d=>{d.target='';d.number='';d.fields.forEach(f=>f.accepted=false);});render();}}if(cmd==='add'){s.result.circuits.push(core.draftDevice());render();}if(cmd==='request-code')login(false);if(cmd==='verify-code')login(true);if(el.dataset.remove!==undefined){s.images.splice(Number(el.dataset.remove),1);s.result=core.blank();s.consent=false;s.message='Photo removed. Reanalyse to rebuild evidence references.';render();}if(el.dataset.rotate!==undefined){try{const i=Number(el.dataset.rotate);s.images[i]=await preparePhoto(s.images[i],90);s.consent=false;render();}catch(e){error(e.message);}}});
document.addEventListener('keydown',e=>{if(!session)return;const diff=document.querySelector('.board-scan-diff');if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(diff)diff.remove();else close();}if(e.key==='Tab'){const box=diff||session.modal;const els=[...box.querySelectorAll('button:not(:disabled),input:not([hidden]):not(:disabled),select')].filter(x=>x.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}},true);
})();
