/* Sperin Certificates Job Centre. Offline-first; photos stored in IndexedDB. */
(()=>{"use strict";
const KEY="sperin-certificate-jobs-v1";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const guid=()=>crypto.randomUUID(),now=()=>new Date().toISOString();
const e=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const filename=x=>String(x||"job").replace(/[^a-z0-9_.-]/gi,"_").slice(0,70);
const date=x=>{if(!x)return"";const d=new Date(x+"T12:00:00");return Number.isNaN(d.getTime())?String(x):d.toLocaleDateString("en-GB");};
const delta=x=>Math.round((new Date(x+"T12:00:00")-new Date(new Date().toISOString().slice(0,10)+"T12:00:00"))/86400000);
let adapter=null,root=null,currentId="",editing=false,draft=null,msg="",camera=null,cloudEnabled=false;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x.filter(v=>v&&UUID.test(v.id)&&UUID.test(v.assetId)):[];}catch{return [];}}
let jobs=load();
function store(){localStorage.setItem(KEY,JSON.stringify(jobs));}
function job(){return jobs.find(x=>x.id===currentId);}
function notice(s){msg=s;const n=root?.querySelector("[data-jc-status]");if(n)n.textContent=s;}
function styling(){if(document.getElementById("job-centre-style"))return;
const s=document.createElement("style");s.id="job-centre-style";
s.textContent=".jc-mask{position:fixed;inset:0;z-index:12000;background:#092039bb;display:grid;place-items:center;padding:12px}.jc-dialog{width:min(870px,100%);max-height:94dvh;overflow:auto;background:white;color:#1b324a;border-radius:18px;padding:20px;font:14px system-ui}.jc-dialog h2{margin:0;font-size:23px}.jc-dialog h3{font-size:16px;margin:10px 0}.jc-row{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:11px 0}.jc-dialog button{border:1px solid #bfd1e5;border-radius:9px;padding:10px 12px;background:#eef4fb;color:#132b46;font-weight:600;cursor:pointer}.jc-dialog button.primary{background:#176fd2;color:white;border-color:#176fd2}.jc-dialog input,.jc-dialog select,.jc-dialog textarea{padding:10px;border:1px solid #c4d1df;border-radius:8px;max-width:100%;font:inherit}.jc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:10px;margin:12px 0}.jc-grid label{display:grid;gap:5px}.jc-card{padding:13px;border:1px solid #dee6ef;border-radius:12px;margin:9px 0}.jc-card small{color:#5c6c7a}.jc-muted{color:#586c7e}.jc-banner{background:#edf5fc;border-radius:10px;padding:10px}.jc-dialog section{border-top:1px solid #e0e9f3;padding-top:10px}.jc-qr{padding:12px;display:inline-block;background:white;border:1px solid #d8e3ef}.jc-qr img,.jc-qr canvas{width:180px!important;height:180px!important}.jc-print{display:none}@media print{body>*:not(.jc-mask){display:none!important}.jc-mask{position:static;background:#fff;padding:0}.jc-dialog{box-shadow:none;max-height:none}.jc-dialog>*:not(.jc-print){display:none!important}.jc-print{display:block!important}.jc-qr img{width:250px!important;height:250px!important}}";
document.head.appendChild(s);}
const api=async(path,method="GET",data)=>{const r=await fetch("/api/certificates/"+path,{method,credentials:"include",headers:data?{"Content-Type":"application/json"}:{},body:data?JSON.stringify(data):undefined});const v=await r.json().catch(()=>({}));if(!r.ok)throw Error(v.error||"Cloud unavailable");return v;};
function certificates(){return adapter?.certificates?.()||[];}
function fields(j){return [['siteName','Site / installation'],['customer','Customer / duty holder'],['email','Customer email'],['address','Address'],['postcode','Postcode'],['notes','Job notes']].map(([k,l])=>'<label>'+l+'<input data-jc-field="'+k+'" value="'+e(j[k]||"")+'"></label>').join("");}
function list(){
const upcoming=jobs.flatMap(j=>(j.reminders||[]).filter(r=>r.dueDate&&delta(r.dueDate)<=30).map(r=>({site:j.siteName,jobId:j.id,...r}))).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
return '<div class="jc-row"><button class="primary" data-jc="new">＋ New job</button><button data-jc="scan">Scan equipment QR</button><button data-jc="pull">Download team jobs</button></div>'+
'<section><h3>Compliance reminders</h3>'+(upcoming.length?upcoming.slice(0,16).map(r=>'<div class="jc-card"><button data-jc="open" data-id="'+e(r.jobId)+'">'+e(r.site)+'</button> '+e(r.kind)+' due '+e(date(r.dueDate))+' ('+(delta(r.dueDate)<0?"overdue":delta(r.dueDate)+" days")+')</div>').join(""):'<p class="jc-muted">No upcoming dates saved. The app does not invent inspection intervals.</p>')+'</section>'+
'<section><h3>Jobs</h3>'+jobs.map(j=>'<div class="jc-card"><button class="primary" data-jc="open" data-id="'+e(j.id)+'">'+e(j.siteName||j.address||"Untitled site")+'</button><p>'+e(j.address||"")+' · '+e(j.customer||"")+'</p><small>'+(j.certIds||[]).length+' certificates · '+(j.evidence||[]).length+' evidence photographs</small></div>').join("")+'</section>';
}
function details(j){
const linked=certificates().filter(c=>(j.certIds||[]).includes(c.id));
const available=certificates().filter(c=>!(j.certIds||[]).includes(c.id));
return '<div class="jc-row"><h3>'+e(j.siteName||"Untitled job")+'</h3><button data-jc="edit">Edit details</button><button data-jc="sync">Cloud sync job</button><button data-jc="qr">QR asset label</button></div>'+
'<p>'+e(j.address||"")+' '+e(j.postcode||"")+' · '+e(j.customer||"")+' · '+e(j.email||"")+'</p><small class="jc-muted">QR asset ID: '+e(j.assetId)+'</small>'+
'<section><h3>Linked certificates</h3>'+linked.map(c=>'<div class="jc-card"><strong>'+e(c.number||c.type)+'</strong> · '+e(c.type.toUpperCase())+' · '+e(c.status||"Draft")+
'<div class="jc-row"><button data-jc="certificate" data-cert="'+e(c.id)+'">Open</button><button data-jc="share" data-cert="'+e(c.id)+'">Secure customer handover</button><button data-jc="unlink" data-cert="'+e(c.id)+'">Unlink</button></div></div>').join("")+
'<div class="jc-row"><select data-jc-cert><option value="">Select certificate…</option>'+available.map(c=>'<option value="'+e(c.id)+'">'+e(c.number||c.type)+'</option>').join("")+'</select><button data-jc="link">Link certificate</button></div></section>'+
'<section><h3>Evidence-linked photographs</h3><p class="jc-muted">Tag photographs by exact circuit, EICR observation or equipment reference and record the electrician. No photo substitutes for an actual measurement.</p>'+
'<div class="jc-grid"><label>Camera / gallery<input type="file" accept="image/*" capture="environment" data-jc-file></label><label>Circuit or equipment reference<input data-jc-circuit></label><label>Observation reference<input data-jc-observation></label><label>Description<input data-jc-label></label></div>'+
'<div class="jc-row"><button class="primary" data-jc="photo-add">Save evidence</button><button data-jc="photos-upload">Upload evidence to team</button><button data-jc="photos-fetch">Fetch team evidence</button></div>'+
(j.evidence||[]).map(x=>'<div class="jc-card"><button data-jc="photo-view" data-evidence="'+e(x.id)+'">View photo</button> '+e(x.label)+' · Circuit '+e(x.circuitRef||"-")+' · Observation '+e(x.observationRef||"-")+'<small> · '+e(x.author||"")+' '+e((x.createdAt||"").slice(0,10))+'</small></div>').join("")+'</section>'+
'<section><h3>Compliance diary</h3><p class="jc-muted">Only a recorded due date is used, never an assumed statutory cycle.</p>'+
(j.reminders||[]).map(x=>'<div class="jc-card">'+e(x.kind)+' · '+e(date(x.dueDate))+' · '+e(x.description)+'</div>').join("")+
'<div class="jc-grid"><label>Category<select data-jc-kind>'+["eicr","emergency","fire","pat","ev","solar","custom"].map(t=>'<option>'+t+'</option>').join("")+'</select></label><label>Due date<input type="date" data-jc-date></label><label>Engineer email<input type="email" data-jc-email value="'+e(j.engineerEmail||"")+'"></label><label>Work required<input data-jc-describe></label></div>'+
'<div class="jc-row"><button data-jc="reminder-add">Add due date</button><button data-jc="reminder-extract">Import dates explicitly written in linked certificates</button><button data-jc="reminder-cloud">Schedule email alerts</button></div></section>'+
'<section><h3>EV / solar / general handover</h3><p>Download one ZIP containing all linked certificate PDFs, commissioning sheets, photographs, equipment references and maintenance dates. Customers can also receive an expiring PDF link.</p>'+
'<div class="jc-row"><button class="primary" data-jc="pack">Download job handover pack</button><button data-jc="links">Shared links / revoke</button></div><div data-jc-links></div></section>';
}
function render(){
if(!root)return;const j=job();
root.innerHTML='<div class="jc-dialog" role="dialog" aria-modal="true" aria-label="Job centre"><div class="jc-row"><h2>Jobs & evidence</h2><button data-jc="all">All jobs</button><button data-jc="close">Close ✕</button></div>'+
'<p role="status" data-jc-status class="jc-banner">'+e(msg||"Local-first: photos remain on this device unless you authorise cloud upload.")+'</p>'+
(editing?'<div class="jc-grid">'+fields(draft)+'</div><div class="jc-row"><button class="primary" data-jc="save">Save job</button><button data-jc="cancel">Cancel</button></div>':j?details(j):list())+
'<div class="jc-print"></div></div>';
}
function update(j){const i=jobs.findIndex(x=>x.id===j.id);if(i<0)jobs.unshift(j);else jobs[i]=j;store();render();}
function close(){camera?.getTracks().forEach(t=>t.stop());camera=null;root?.remove();root=null;currentId="";editing=false;}
function open(a,id){adapter=a;styling();if(root)close();root=document.createElement("div");root.className="jc-mask";root.addEventListener("click",async ev=>{
if(ev.target===root){close();return;}const b=ev.target.closest("[data-jc]");if(b){try{await act(b.dataset.jc,b);}catch(err){notice(err.message);}}});
document.body.appendChild(root);currentId=jobs.some(j=>j.id===id)?id:"";render();}
function photoDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("sperin-job-evidence-v1",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("photos"))r.result.createObjectStore("photos");};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function photoSet(id,s){const db=await photoDB();return new Promise((resolve,reject)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").put(s,id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
async function photoGet(id){const db=await photoDB();return new Promise((resolve,reject)=>{const tx=db.transaction("photos"),r=tx.objectStore("photos").get(id);r.onsuccess=()=>{db.close();resolve(r.result||null);};r.onerror=()=>{db.close();reject(r.error);};});}
async function imageData(file){
if(file.size>12000000)throw Error("Image exceeds 12 MB");
const bmp=await createImageBitmap(file),canvas=document.createElement("canvas");const scale=Math.min(1,1300/Math.max(bmp.width,bmp.height));
canvas.width=Math.ceil(bmp.width*scale);canvas.height=Math.ceil(bmp.height*scale);
canvas.getContext("2d").drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close();
return canvas.toDataURL("image/jpeg",.75);
}
function assetLink(j){return "https://sperinservices.co.uk/certificates/#asset="+encodeURIComponent(j.assetId);}
function showQr(j){
const node=root.querySelector(".jc-print");
node.innerHTML='<h2>SPERIN CERTIFICATES · EQUIPMENT REFERENCE</h2><div data-jc-qr class="jc-qr"></div><p>'+e(j.siteName||"Electrical installation")+'</p><p>Asset ID: '+e(j.assetId)+'</p><p>Requires an authorised electrician account. This QR is not a certificate access key.</p>';
const target=node.querySelector("[data-jc-qr]");new QRCode(target,{text:assetLink(j),width:190,height:190});
const visible=document.createElement("div");visible.className="jc-card";visible.innerHTML='<h3>Equipment QR label</h3><p>'+e(j.siteName)+'</p><div class="jc-qr" data-jc-visible></div><p>'+e(j.assetId)+'</p><button data-jc="print">Print label</button><button data-jc="hideqr">Close</button>';
root.querySelector(".jc-dialog").appendChild(visible);new QRCode(visible.querySelector("[data-jc-visible]"),{text:assetLink(j),width:190,height:190});
}
async function scanAsset(value){
const id=String(value||"").match(/asset=([0-9a-f-]{36})/i)?.[1]||String(value||"").match(/[0-9a-f-]{36}/i)?.[0];
const match=jobs.find(j=>j.assetId===id||j.id===id);
if(match){currentId=match.id;render();notice("Equipment record found locally.");return;}
if(id&&UUID.test(id)){try{const r=await api("assets/"+id);const x=r.job;if(x){
 if(!jobs.some(j=>j.id===x.id)){jobs.unshift({...x.details,id:x.id,assetId:x.asset_id,cloudRevision:x.revision,evidence:[]});store();}
 currentId=x.id;render();notice("Equipment found in your authenticated cloud team.");return;
}}catch{}}
notice("No equipment record found. Sign in and synchronise the job if it is on another device.");
}
async function cameraScan(){
if(!window.BarcodeDetector||!navigator.mediaDevices?.getUserMedia){
const code=prompt("QR camera scan is unavailable here. Enter the equipment ID or QR URL:");if(code)await scanAsset(code);return;
}
camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
const detector=new BarcodeDetector({formats:["qr_code"]});
const video=document.createElement("video");video.playsInline=true;video.autoplay=true;video.srcObject=camera;video.style.width="min(360px,100%)";
const panel=document.createElement("div");panel.className="jc-card";panel.append(video);root.querySelector(".jc-dialog").prepend(panel);await video.play();
try{for(let i=0;i<70&&camera;i++){const r=await detector.detect(video).catch(()=>[]);if(r.length){await scanAsset(r[0].rawValue);return;}await new Promise(done=>setTimeout(done,350));}}
finally{camera?.getTracks().forEach(t=>t.stop());camera=null;panel.remove();}
}
async function cloudJob(j){
if(localStorage.getItem("sperin-cloud-workspace-enabled")!=="yes")throw Error("Enable cloud consent in Cloud team first");
await api("session");
const details={siteName:j.siteName,customer:j.customer,email:j.email,address:j.address,postcode:j.postcode,notes:j.notes,certIds:j.certIds,reminders:j.reminders,assetId:j.assetId};
const v=await api("jobs","POST",{id:j.id,assetId:j.assetId,details,expectedRevision:j.cloudRevision||0});
j.cloudRevision=v.revision;j.assetId=v.asset_id;store();return v;
}
async function pull(){
if(localStorage.getItem("sperin-cloud-workspace-enabled")!=="yes")throw Error("Enable cloud consent in Cloud team first");
const r=await api("jobs");let added=0,conflicts=0;
for(const x of r.jobs||[]){if(jobs.some(j=>j.id===x.id)){conflicts++;continue;}
jobs.push({...x.details,id:x.id,assetId:x.asset_id,cloudRevision:x.revision,evidence:[],certIds:x.details.certIds||[],reminders:x.details.reminders||[]});added++;}
store();render();notice(added+" jobs downloaded, "+conflicts+" existing local records kept unchanged.");
}
async function cloudPhotos(j){
await cloudJob(j);let n=0;
for(const x of j.evidence||[]){if(x.cloudId)continue;const file=await photoGet(x.id);if(!file)continue;
const v=await api("jobs/"+j.id+"/evidence","POST",{file,label:x.label,circuitRef:x.circuitRef,observationRef:x.observationRef,documentId:UUID.test(x.certId||"")?x.certId:null});
x.cloudId=v.id;n++;}
store();render();notice(n+" photographs uploaded to the private team.");
}
async function retrievePhotos(j){
const result=await api("jobs/"+j.id+"/evidence");let added=0;
for(const x of result.evidence||[]){if(j.evidence?.some(v=>v.cloudId===x.id))continue;
const r=await fetch("/api/certificates/jobs/"+j.id+"/evidence/"+x.id,{credentials:"include"});if(!r.ok)continue;
const blob=await r.blob();const data=await new Promise(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.readAsDataURL(blob);});
const id=guid();await photoSet(id,data);j.evidence.push({id,cloudId:x.id,label:x.label,circuitRef:x.circuit_ref,observationRef:x.observation_ref,author:x.uploaded_by,createdAt:x.created_at});added++;}
update(j);notice(added+" team photographs stored locally.");
}
const dueFor=c=>c.type==="eicr"?c.fields?.nextInspectionDate:c.type==="emergency"?c.fields?.nextTestDate:c.type==="commercialFire"?c.fields?.nextService:c.type==="smoke"?c.fields?.nextServiceDate:"";
function extractDates(j){
let n=0;for(const c of certificates().filter(x=>j.certIds.includes(x.id))){
const due=dueFor(c);
if(due&&/^\d{4}-\d{2}-\d{2}$/.test(due)&&!j.reminders.some(x=>x.certId===c.id&&x.dueDate===due)){
 j.reminders.push({id:guid(),certId:c.id,kind:c.type==="commercialFire"||c.type==="smoke"?"fire":c.type,dueDate:due,description:c.number+" reinspection or service",engineerEmail:j.engineerEmail||"",cloudSent:false});n++;}
if(c.type==="pat")for(const row of c.tables?.appliances||[]){
if(row.nextDate&&/^\d{4}-\d{2}-\d{2}$/.test(row.nextDate)&&!j.reminders.some(x=>x.certId===c.id&&x.asset===row.asset&&x.dueDate===row.nextDate)){
j.reminders.push({id:guid(),certId:c.id,asset:row.asset,kind:"pat",dueDate:row.nextDate,description:"PAT "+(row.asset||"equipment"),engineerEmail:j.engineerEmail||"",cloudSent:false});n++;}}
}
update(j);notice(n+" explicitly recorded dates imported. No deadlines invented.");
}
async function scheduleEmail(j){
await cloudJob(j);let added=0;
for(const x of j.reminders){if(x.cloudSent||!x.engineerEmail)continue;
await api("jobs/"+j.id+"/reminders","POST",{kind:x.kind,dueDate:x.dueDate,description:x.description,engineerEmail:x.engineerEmail});x.cloudSent=true;added++;}
store();render();notice(added+" reminders registered. Email delivery requires the daily cloud scheduler to be configured.");
}
const encode=x=>new TextEncoder().encode(x);
const w16=x=>[x&255,(x>>>8)&255],w32=x=>[...w16(x),...w16(x>>>16)];
function crc(x){let c=-1;for(const b of x){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^-1)>>>0;}
function zip(files){
const items=[],central=[];let offset=0,bytes=0;
for(const [name,data] of files){const n=encode(name);if(data.length>12e6)throw Error("Single attachment too large");
const c=crc(data),z=data.length;let header=Uint8Array.from([...w32(0x04034b50),...w16(20),...w16(0),...w16(0),0,0,0,0,...w32(c),...w32(z),...w32(z),...w16(n.length),0,0,...n]);items.push(header,data);
central.push(Uint8Array.from([...w32(0x02014b50),...w16(20),...w16(20),0,0,0,0,0,0,0,0,...w32(c),...w32(z),...w32(z),...w16(n.length),0,0,0,0,0,0,0,0,0,0,...w32(offset),...n]));offset+=header.length+z;bytes+=z;
if(bytes>45e6)throw Error("Pack exceeds 45 MB; reduce photographs.");
}
const count=central.length,len=central.reduce((s,v)=>s+v.length,0);
const tail=Uint8Array.from([...w32(0x06054b50),0,0,0,0,...w16(count),...w16(count),...w32(len),...w32(offset),0,0]);
return new Blob([...items,...central,tail],{type:"application/zip"});
}
async function downloadPack(j){
const items=[],linked=certificates().filter(c=>j.certIds.includes(c.id));
for(const cert of linked){const d=window.SperinIetForms.build({cert,schema:adapter.schema(cert.type),settings:adapter.settings(),worksheet:false});items.push(["certificates/"+filename(cert.number||cert.type)+".pdf",new Uint8Array(d.output("arraybuffer"))]);}
for(const x of (j.evidence||[]).slice(0,40)){const image=await photoGet(x.id);if(!image)continue;const bytes=Uint8Array.from(atob(image.split(",")[1]),c=>c.charCodeAt(0));items.push(["evidence/"+filename(x.circuitRef||"photo")+"-"+filename(x.id)+".jpg",bytes]);}
const overview=["SPERIN CERTIFICATES | JOB HANDOVER",j.siteName,j.address,j.postcode,"Customer: "+j.customer,"Asset: "+j.assetId,"Notes: "+j.notes,"CERTIFICATES",...linked.map(c=>c.number+" "+c.type+" "+c.status),"COMPLIANCE DATES",...(j.reminders||[]).map(x=>x.kind+" "+x.dueDate+" "+x.description),"EVIDENCE INDEX",...(j.evidence||[]).map(x=>[x.circuitRef,x.observationRef,x.label,x.author,x.createdAt].join(" | "))];
items.unshift(["INDEX.txt",encode(overview.join("\r\n"))]);
const blob=zip(items),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename(j.siteName)+"-handover.zip";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
notice("Handover ZIP created with "+linked.length+" certificate PDFs and "+(items.length-linked.length-1)+" photographs.");
}
async function customerShare(j,certId){
const cert=certificates().find(x=>x.id===certId);if(!cert)return;
const email=(prompt("Customer email for seven-day secure PDF link:",j.email||"")||"").trim();
if(!email||!confirm("Confirm customer is authorised and certificate is reviewed before sharing with "+email+"?"))return;
await cloudJob(j);
const pdf=window.SperinIetForms.build({cert,schema:adapter.schema(cert.type),settings:adapter.settings(),worksheet:false});
const r=await api("jobs/"+j.id+"/handover","POST",{consent:true,customerEmail:email,label:cert.number+" "+cert.type,filename:filename(cert.number)+".pdf",pdf:pdf.output("datauristring")});
notice(r.sent?"Secure customer email sent; link expires in seven days.":"Handover not sent.");
}
async function handovers(j){const data=await api("jobs/"+j.id+"/handover/list");const div=root.querySelector("[data-jc-links]");
div.innerHTML=(data.links||[]).map(x=>'<div class="jc-card">'+e(x.customer_email)+' · '+(x.revoked_at?"Revoked":"Expires "+e(date(x.expires_at.slice(0,10))))+
(!x.revoked_at?'<button data-jc="revoke" data-id="'+e(x.id)+'">Revoke</button>':'')+'</div>').join("")||"No shared links.";}
async function act(cmd,b){
const j=job();
if(cmd==="close"){close();return;}
if(cmd==="all"){currentId="";editing=false;render();return;}
if(cmd==="new"){editing=true;draft={id:guid(),assetId:guid(),certIds:[],evidence:[],reminders:[],siteName:"",customer:"",email:"",address:"",postcode:"",notes:""};render();return;}
if(cmd==="open"){currentId=b.dataset.id;render();return;}
if(cmd==="edit"&&j){editing=true;draft={...j};render();return;}
if(cmd==="cancel"){editing=false;draft=null;render();return;}
if(cmd==="save"&&draft){root.querySelectorAll("[data-jc-field]").forEach(el=>{draft[el.dataset.jcField]=el.value.trim().slice(0,3000);});
if(!draft.siteName&&!draft.address)return notice("Enter a site name or address.");
currentId=draft.id;update(draft);editing=false;draft=null;render();notice("Job saved offline.");return;}
if(cmd==="link"&&j){const id=root.querySelector("[data-jc-cert]")?.value;if(id&&certificates().some(c=>c.id===id)){j.certIds.push(id);adapter.attach(id,j.id);update(j);}return;}
if(cmd==="unlink"&&j){const id=b.dataset.cert;if(!confirm("Unlink? The certificate remains saved."))return;j.certIds=j.certIds.filter(x=>x!==id);adapter.attach(id,"");update(j);return;}
if(cmd==="certificate"){adapter.navigate(b.dataset.cert);close();return;}
if(cmd==="photo-add"&&j){
const f=root.querySelector("[data-jc-file]")?.files?.[0];if(!f)return notice("Choose an image.");
const id=guid(),data=await imageData(f);await photoSet(id,data);
j.evidence.push({id,label:root.querySelector("[data-jc-label]")?.value?.slice(0,100)||f.name,circuitRef:root.querySelector("[data-jc-circuit]")?.value?.slice(0,80)||"",observationRef:root.querySelector("[data-jc-observation]")?.value?.slice(0,80)||"",author:adapter.engineer(),createdAt:now(),certId:adapter.current()?.id||""});
update(j);notice("Site photograph linked and stored offline.");return;}
if(cmd==="photo-view"){const img=await photoGet(b.dataset.evidence);if(!img)return notice("Photo not available on this device.");
const a=document.createElement("a");a.href=img;a.download="sperin-evidence.jpg";a.click();return;}
if(cmd==="qr"&&j){showQr(j);return;}
if(cmd==="print"){window.print();return;}
if(cmd==="hideqr"){root.querySelector(".jc-card:last-child")?.remove();return;}
if(cmd==="scan"){await cameraScan();return;}
if(cmd==="sync"&&j){await cloudJob(j);notice("Private cloud job synced.");return;}
if(cmd==="pull"){await pull();return;}
if(cmd==="photos-upload"&&j){await cloudPhotos(j);return;}
if(cmd==="photos-fetch"&&j){await retrievePhotos(j);return;}
if(cmd==="reminder-add"&&j){
const due=root.querySelector("[data-jc-date]").value;if(!due)return notice("Enter an actual due date.");
const kind=root.querySelector("[data-jc-kind]").value,email=root.querySelector("[data-jc-email]").value.trim();
j.reminders.push({id:guid(),kind,dueDate:due,engineerEmail:email,description:root.querySelector("[data-jc-describe]").value.slice(0,160)||kind,cloudSent:false});
j.engineerEmail=email;update(j);notice("Due date saved. Configure cloud scheduler for email delivery.");return;}
if(cmd==="reminder-extract"&&j){extractDates(j);return;}
if(cmd==="reminder-cloud"&&j){await scheduleEmail(j);return;}
if(cmd==="pack"&&j){await downloadPack(j);return;}
if(cmd==="share"&&j){await customerShare(j,b.dataset.cert);return;}
if(cmd==="links"&&j){await handovers(j);return;}
if(cmd==="revoke"&&j){if(!confirm("Revoke this link?"))return;await api("jobs/"+j.id+"/handover/"+b.dataset.id+"/revoke","POST",{});await handovers(j);notice("Customer link revoked.");}
}
function reminders(){return jobs.reduce((n,j)=>n+(j.reminders||[]).filter(x=>x.dueDate&&delta(x.dueDate)<=30).length,0);}
function incomingAsset(){const id=location.hash.match(/asset=([0-9a-f-]{36})/i)?.[1];if(id&&adapter){open(adapter);scanAsset(id);}}
function importMetadata(records){if(!Array.isArray(records)||records.length>600)throw Error('Invalid job metadata');let added=0;for(const x of records){if(!x||!UUID.test(x.id)||!UUID.test(x.assetId)||JSON.stringify(x).length>180000)continue;if(jobs.some(j=>j.id===x.id))continue;jobs.push({...x,evidence:Array.isArray(x.evidence)?x.evidence:[],reminders:Array.isArray(x.reminders)?x.reminders:[]});added++;}store();return added;}
window.SperinJobCentre={open,install:a=>{adapter=a;},reminderCount:reminders,backup:()=>jobs.map(x=>({...x})),importMetadata,incomingAsset};
})();
