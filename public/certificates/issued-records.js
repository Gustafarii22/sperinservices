/* Immutable local issue history. Existing certificates and storage keys are untouched. */
(()=>{'use strict';
 const DB='sperin-issued-records-v1',STORE='reports';
 const clone=x=>JSON.parse(JSON.stringify(x));
 function content(cert){return JSON.stringify({type:cert.type,number:cert.number,fields:cert.fields,tables:cert.tables,signatureApprovedAt:cert.signatureApprovedAt||'',signatureApprovedBy:cert.signatureApprovedBy||''});}
 async function digest(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
 function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore(STORE,{keyPath:'id'});s.createIndex('revision',['certificateId','revision'],{unique:true});};r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);});}
 async function all(){const db=await open();try{return await new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
 async function validate(records){
  if(!Array.isArray(records))throw Error('Invalid issued-report archive');
  const ids=new Set(),revisions=new Set();
  for(const r of records){
   if(!r||typeof r.id!=='string'||!r.id||typeof r.certificateId!=='string'||!Number.isInteger(r.revision)||r.revision<1||!r.snapshot||!/^data:application\/pdf[^,]*;base64,JVBER/.test(r.pdf)||typeof r.issuedAt!=='string')throw Error('Invalid issued report');
   const rev=JSON.stringify([r.certificateId,r.revision]);if(ids.has(r.id)||revisions.has(rev))throw Error('Duplicate issued report');ids.add(r.id);revisions.add(rev);
   if(await digest(r.pdf)!==r.pdfSha256||await digest(content(r.snapshot))!==r.contentSha256)throw Error('Issued report integrity check failed');
  }
 }
 async function restore(records=[]){
  await validate(records);const existing=await all();
  for(const r of records){const old=existing.find(x=>x.id===r.id||(x.certificateId===r.certificateId&&x.revision===r.revision));if(old&&JSON.stringify(old)!==JSON.stringify(r))throw Error('Conflicting issued revision; existing history has been retained');}
  const add=records.filter(r=>!existing.some(x=>x.id===r.id));if(!add.length)return;
  const db=await open();try{await new Promise((resolve,reject)=>{const t=db.transaction(STORE,'readwrite');t.oncomplete=resolve;t.onabort=()=>reject(t.error||Error('Issue archive transaction failed'));t.onerror=()=>{};for(const r of add)t.objectStore(STORE).add(clone(r));});}finally{db.close();}
 }
 async function issue(cert,render){
  const snapshot=clone(cert),records=await all();
  if(records.some(r=>r.number===snapshot.number&&r.certificateId!==snapshot.id))throw Error('Report number already belongs to another issued certificate');
  const previous=records.filter(r=>r.certificateId===snapshot.id);
  const revision=Math.max(0,...previous.map(r=>r.revision))+1,issuedAt=new Date().toISOString();
  snapshot.status='Complete';snapshot.issueMetadata={revision,issuedAt};
  const doc=render(snapshot),pdf=doc.output('datauristring');
  const record={id:crypto.randomUUID(),certificateId:cert.id,number:cert.number,revision,issuedAt,snapshot,pdf,pageCount:doc.getNumberOfPages(),landscape:['eic','eicr'].includes(snapshot.type),pdfSha256:await digest(pdf),contentSha256:await digest(content(snapshot))};
  await restore([record]);return record;
 }
 window.SperinIssuedRecords={all,validate,restore,issue,content,digest};
})();
