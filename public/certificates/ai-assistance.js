/* Consent-based proposals only; never silently completes an electrical certificate. */
(()=>{"use strict";
let dialog=null,apiName="",adapter=null,proposal=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function close(){dialog?.remove();dialog=null;proposal=null;}
function styles(){if(document.getElementById("sp-ai-css"))return;const el=document.createElement("style");el.id="sp-ai-css";el.textContent=".sp-ai-backdrop{position:fixed;inset:0;z-index:11000;background:#041426c9;display:grid;place-items:center;padding:14px}.sp-ai-dialog{background:#fff;color:#172b3e;max-width:700px;width:100%;max-height:92vh;overflow-y:auto;border-radius:15px;padding:20px;font:14px system-ui}.sp-ai-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.sp-ai-dialog button{background:#e7effb;padding:10px 14px;border:0;border-radius:8px;cursor:pointer}.sp-ai-dialog button.primary{background:#1672d5;color:#fff}.sp-ai-dialog button:disabled{opacity:.5}.sp-ai-field{padding:12px;border-bottom:1px solid #e0e8f0;display:flex;align-items:flex-start;gap:10px}.sp-ai-field input[type=checkbox]{min-width:18px;min-height:18px}.sp-ai-field small{display:block;color:#5c6c79;margin-top:5px;line-height:1.4}.sp-ai-alert{padding:12px;background:#f1f5fa;border-radius:10px}.sp-ai-dialog h2{margin:0}.sp-ai-dialog input[type=file]{max-width:100%}";document.head.appendChild(el);}
function notify(text){const el=dialog?.querySelector("[data-ai-status]");if(el)el.textContent=text;}
async function send(path,payload){
const r=await fetch("/api/certificates/"+path,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
const data=await r.json().catch(()=>({}));
if(!r.ok)throw Error(data.error||"AI analysis unavailable");
return data;
}
function begin(mode,a){
if(dialog)close();apiName=mode;adapter=a;proposal=null;styles();
dialog=document.createElement("div");dialog.className="sp-ai-backdrop";
dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
document.body.appendChild(dialog);
render();
}
function render(){
if(!dialog)return;
const isPdf=apiName==="pdf",ready=!!proposal;
let body="";
if(ready&&isPdf){
  const groups=[...proposal.fields.map((item,i)=>({...item,group:"fields",position:i})),
    ...(proposal.tables||[]).flatMap((g,j)=>g.rows.flatMap((r,k)=>r.values.map((item,l)=>({...item,group:"tables",table:j,row:k,cell:l,position:j+":"+k+":"+l}))))];
  body='<h3>Extracted from historical PDF</h3><p class="sp-ai-alert">This is a transcription draft, not evidence of compliance. Confirm only legible data. Signatures and measured tests must be checked against the original.</p>'+
  '<div><strong>Suggested type:</strong> '+esc(proposal.recordType||"unknown")+'</div>'+
  groups.map((item,i)=>'<label class="sp-ai-field"><input type="checkbox" data-ai-select="'+i+'" data-ai-group="'+esc(item.group)+'" data-ai-table="'+(item.table??"")+'" data-ai-row="'+(item.row??"")+'" data-ai-cell="'+(item.cell??"")+'" data-ai-position="'+item.position+'"><span><strong>'+esc(item.key)+'</strong>: '+esc(item.value)+'<small>Confidence: '+esc(item.confidence)+' · Evidence: '+esc(item.evidence||"not provided")+'</small></span></label>').join("")+
  '<div class="sp-ai-actions"><button class="primary" data-ai-action="import">Create new draft from selected values</button></div>';
}else if(ready){
  body='<p class="sp-ai-alert">Coding is advisory only. Independently verify the physical defect, BS 7671 requirements and final EICR classification before using any suggested wording.</p>'+
  (proposal.suggestions||[]).map((x,i)=>'<label class="sp-ai-field"><input type="checkbox" data-ai-suggestion="'+i+'"><span><strong>'+esc(x.code)+'</strong> · '+esc(x.observation)+'<small>Schedule item '+esc(x.item)+' · Recorded evidence: '+esc(x.evidence)+' · Reason: '+esc(x.reason)+' · Regulation reference (verify): '+esc(x.regulationRef||'Not confidently identified')+'</small></span></label>').join("")+
  '<div class="sp-ai-actions"><button class="primary" data-ai-action="apply-eicr">Add selected as UNVERIFIED drafts</button></div>';
}
const warn=(proposal?.warnings||[]).slice(0,20).map(x=>'<p>⚠ '+esc(x)+'</p>').join("");
dialog.innerHTML='<div class="sp-ai-dialog" role="dialog" aria-modal="true">'+
 '<div class="sp-ai-actions" style="justify-content:space-between"><h2>'+(isPdf?'Import an older certificate':'AI EICR observations review')+'</h2><button data-ai-action="close">✕ Close</button></div>'+
 (!ready?'<p>'+(isPdf?'Select an existing EIC, EICR or Minor Works PDF. The AI will propose fields, but will not issue a certificate.':'Send entered EICR observations and inspection findings for a second-pass wording review. AI cannot inspect a real installation.')+'</p>'+
 (isPdf?'<input type="file" data-ai-file accept=".pdf,application/pdf">':'')+
 '<label class="sp-ai-field"><input type="checkbox" data-ai-consent> I authorise sending this '+(isPdf?'PDF':'selected EICR data')+' to the cloud AI service for review.</label>'+
 '<div class="sp-ai-actions"><button class="primary" data-ai-action="analyse">Analyse</button></div>':'')+
 body+warn+'<p data-ai-status role="status">Your original certificates are unchanged.</p></div>';
}
async function analyse(){
const consent=dialog?.querySelector("[data-ai-consent]")?.checked;
if(!consent){notify("Tick explicit cloud consent before analysis.");return;}
const button=dialog.querySelector('[data-ai-action="analyse"]');button.disabled=true;
try{
 if(apiName==="pdf"){
   const file=dialog.querySelector("[data-ai-file]")?.files?.[0];
   if(!file||file.type!=="application/pdf"&& !/\.pdf$/i.test(file.name))throw Error("Choose a PDF file.");
   if(file.size>3_000_000)throw Error("PDF exceeds 3 MB. Split or reduce the document first.");
   const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error("Cannot read PDF"));r.readAsDataURL(file);});
   notify("Reading PDF with AI. No information will be imported automatically…");
   proposal=await send("ai-import",{consent:true,file:data});
 }else{
   const c=adapter.get();if(!c||c.type!=="eicr")throw Error("Open an EICR first.");
   // Exclude identifying client address and signatory data from the AI request.
   const report={
      inspection:(c.tables?.eicrInspection||[]).map(x=>({item:x.item,outcome:x.outcome,description:x.description})).filter(x=>x.outcome&&x.outcome!=="✓"),
      observations:(c.tables?.observations||[]).map(x=>({item:x.item,observation:x.observation,code:x.code,scheduleRef:x.scheduleRef})),
      tests:(c.tables?.tests||[]).map(x=>({circuitNo:x.circuitNo,zs:x.zs,rcdTime:x.rcdTime,irLL:x.irLL,irLE:x.irLE})),
      overallAssessment:c.fields?.overallAssessment||""
   };
   notify("Reviewing recorded EICR evidence…");
   proposal=await send("ai-eicr",{consent:true,report});
 }
 render();
}catch(e){notify("Not completed: "+e.message);button.disabled=false;}
}
function importDraft(){
if(!proposal||!["eic","eicr","minor"].includes(proposal.recordType)){notify("AI could not confirm the original certificate type. Nothing imported.");return;}
const selected=Array.from(dialog.querySelectorAll("[data-ai-select]:checked"));
if(!selected.length){notify("Tick at least one field you have verified.");return;}
const fields={};const tables={};let skipped=0;
const schema=adapter.schema(proposal.recordType);
if(!schema){notify("Unknown certificate type.");return;}
const fieldKeys=new Set(schema.sections.filter(s=>s.type==="section").flatMap(s=>s.fields.map(f=>f.key)));
const tableMap=new Map(schema.sections.filter(s=>s.type==="table").map(t=>[t.key,new Set(t.columns.map(c=>c.key))]));
for(const el of selected){
 const group=el.dataset.aiGroup;
 let entry,tableName="",rowIndex=-1;
 if(group==="fields"){entry=proposal.fields[Number(el.dataset.aiPosition)];}
 else{
   const table=proposal.tables[Number(el.dataset.aiTable)];const row=table?.rows[Number(el.dataset.aiRow)];
   entry=row?.values[Number(el.dataset.aiCell)];tableName=table?.name||"";rowIndex=Number(el.dataset.aiRow);
 }
 if(!entry||entry.value===undefined)continue;
 if(group==="fields"){
   if(!fieldKeys.has(entry.key)){skipped++;continue;}
   // Never promote an historical sign-off to a new certificate's declaration.
   if(/signature|declarationdate|authoriserdate/i.test(entry.key)){skipped++;continue;}
   fields[entry.key]=entry.value;
 }else{
   if(!tableMap.get(tableName)?.has(entry.key)||rowIndex<0||rowIndex>250){skipped++;continue;}
   if(!tables[tableName])tables[tableName]=[];
   if(!tables[tableName][rowIndex])tables[tableName][rowIndex]={};
   tables[tableName][rowIndex][entry.key]=entry.value;
 }
}
if(!Object.keys(fields).length&&!Object.values(tables).some(v=>v.length)){notify("Selected fields are not supported by the new template. No data imported.");return;}
if(!confirm("Create a NEW DRAFT with these manually accepted historical values? All inspection and test evidence must be checked before issue."))return;
adapter.create(proposal.recordType,fields,tables);
close();
}
function applyEicr(){
const c=adapter.get();if(!c||c.type!=="eicr")return;
const picks=Array.from(dialog.querySelectorAll("[data-ai-suggestion]:checked"));
if(!picks.length){notify("Choose an observation to review.");return;}
const rows=picks.map(el=>{
 const x=proposal.suggestions[Number(el.dataset.aiSuggestion)];
 // Never assign a definitive code from AI. Inspector explicitly codes after reviewing.
 return {item:String(x.item||""),observation:String(x.observation||"")+" [AI PROPOSAL — VERIFY]",code:"",scheduleRef:String(x.item||"")};
});
if(!confirm("Append "+rows.length+" proposed observations to this EICR with NO codes? Review and edit them personally before issuing."))return;
adapter.addEicrRows(rows);
close();
}
document.addEventListener("click",e=>{
  const b=e.target.closest?.("[data-ai-action]");
  if(!b||!dialog||!dialog.contains(b))return;
  const cmd=b.dataset.aiAction;
  if(cmd==="close")close();
  if(cmd==="analyse")analyse();
  if(cmd==="import")importDraft();
  if(cmd==="apply-eicr")applyEicr();
});
window.SperinAiAssistance={open:begin};
})();
