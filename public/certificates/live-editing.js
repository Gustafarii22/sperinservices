/* Safe multi-engineer collaboration. Exact previous-value matching means editing
different fields in parallel is possible; collisions are reviewable, never lost. */
(()=>{"use strict";
let adapter=null,activeId="",visible=false,modal=null,session=null,lastEvent=0,timer=null,heartbeatAt=0;
const queue=new Map(),editors=new Map();let online=false,conflicts=0,polling=false,changes=0;
const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;':"&quot;","'":"&#39;"}[ch]));
const pathKey=p=>JSON.stringify(p);
const getAt=(obj,path)=>{let v=obj;for(const key of path){if(v==null)return null;v=v[key];}return v===undefined?null:v;};
const setAt=(obj,path,v)=>{let a=obj;for(let i=0;i<path.length-1;i++){if(!a?.[path[i]])return false;a=a[path[i]];}if(!a)return false;a[path.at(-1)]=v;return true;};
function inputPath(t,cert){
 if(!cert||!t?.dataset)return null;
 if(t.matches("[data-field]"))return ["fields",t.dataset.field];
 if(t.matches("[data-table-input]"))return ["tables",t.dataset.tableInput,t.dataset.row,t.dataset.col];
 if(t.matches("[data-board-input]"))return ["tables","boards",t.dataset.boardIndex,t.dataset.boardInput];
 if(t.matches("[data-circuit-input]"))return ["tables",t.dataset.circuitInput==="details"?"circuits":"tests",t.dataset.index,t.dataset.col];
 return null;
}
const valid=p=>p&&p.every(v=>v!=null)&&(!p.some(x=>/signature|declaration|approved|status|number/i.test(x)))&&
 (p[0]==="fields"&&p.length===2||p[0]==="tables"&&p.length===4)&&
 !["circuitNo","boardRef","ocpdBs","ocpdType","ocpdRating","maxZs"].includes(p.at(-1));
async function api(path,method="GET",body){
 const res=await fetch("/api/certificates/live/"+activeId+(path||""),{method,credentials:"include",
   headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined,cache:"no-store"});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||"Cloud temporarily unavailable");
 return data;
}
function message(t){const x=modal?.querySelector("[data-live-status]");if(x)x.textContent=t;}
function draw(){
 if(!modal)return;
 const people=[...editors.entries()].map(([email,at])=>"<div>👷 "+esc(email)+" · active "+esc(at)+"</div>").join("");
 modal.innerHTML='<div class="speed-dialog" role="dialog" aria-modal="true" aria-label="Live engineer collaboration"><header><h2>Live team editing</h2><button data-live="close">✕</button></header>'+
 '<p>Multiple engineers may edit different text and measured-result cells simultaneously. Fields are compared atomically before saving; conflicts never overwrite either engineer silently.</p>'+
 '<p data-live-status role="status">'+esc(online?"Connected to the private team document.":"Waiting for your cloud team session.")+'</p>'+
 '<div class="speed-actions"><button data-live="refresh">Refresh now</button><button data-live="end">Leave shared editing</button></div>'+
 '<strong>Currently active engineers</strong><div data-live-editors>'+people+'</div>'+
 '<p>'+changes+' incoming updates · '+conflicts+' conflicts requiring review · '+queue.size+' fields awaiting upload.</p>'+
 '<p>Local autosaving remains enabled. Unsynced work stays on the phone. Circuit identity, signatures and device calculations require individual offline review.</p></div>';
 modal.querySelectorAll("[data-live]").forEach(b=>b.onclick=()=>{if(b.dataset.live==="close"){modal.remove();modal=null;}
   else if(b.dataset.live==="end")end();else if(b.dataset.live==="refresh")poll();});
}
function renderToolbar(){
 let b=document.getElementById("sperin-live-indicator");
 if(!b){b=document.createElement("button");b.id="sperin-live-indicator";b.className="btn small";
   b.style.cssText="position:fixed;right:10px;bottom:125px;z-index:205;padding:9px 11px;background:#eaf3ff;color:#13549b;border:1px solid #b4cced;border-radius:20px";
   b.onclick=()=>open();document.body.appendChild(b);}
 if(!activeId){b.hidden=true;return;}
 b.hidden=false;
 b.textContent=conflicts?"⚠ Team conflict":online?"👷 "+editors.size+" live":queue.size?"↻ Live pending":"◌ Team offline";
}
function getCertificate(){return adapter?.get?.(activeId);}
async function flush(){
 if(!activeId||!navigator.onLine||!queue.size)return;
 const keys=[...queue.keys()];
 for(const key of keys){
  const p=queue.get(key);if(!p)continue;
  queue.delete(key);
  try{
   const data=await api("","POST",{kind:"patch",path:p.path,previous:p.previous,value:p.value});
   if(data.eventId)lastEvent=Math.max(lastEvent,Number(data.eventId));
   online=true;
   window.SperinSpeedSuite?.status?.("synced");
  }catch(e){
   conflicts++;
   queue.set(key,p);
   online=false;window.SperinSpeedSuite?.status?.("conflict");
   message("Unmerged change: "+e.message+" Local work has NOT been overwritten.");
   break;
  }
 }
 draw();renderToolbar();
}
async function poll(){
 if(polling||!activeId||!navigator.onLine)return;
 polling=true;
 try{
  const now=Date.now();
  if(now-heartbeatAt>18000){await api("","POST",{kind:"heartbeat"});heartbeatAt=now;}
  let data=await api("?after="+lastEvent);
  for(const e of data.events||[]){
   const id=Number(e.id);lastEvent=Math.max(lastEvent,id);
   const p=e.field_path;
   if(e.actor===session?.email)continue;
   if(!valid(p))continue;
   const doc=getCertificate();if(!doc)continue;
   const current=getAt(doc,p),prior=e.previous_value;
   if(queue.has(pathKey(p))||JSON.stringify(current)!==JSON.stringify(prior)){
     conflicts++;message("Remote update conflicts with your local value for "+p.join(" / ")+". No overwrite performed.");
     continue;
   }
   adapter.applyRemote(activeId,p,e.new_value);
   changes++;
  }
  editors.clear();
  for(const u of data.presence||[])editors.set(u.email,new Date(u.last_seen).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
  online=true;
  if(!conflicts&&!queue.size)window.SperinSpeedSuite?.status?.("synced");
  draw();renderToolbar();
 }catch(e){online=false;message(e.message);renderToolbar();}
 finally{polling=false;}
}
function startTimer(){
 if(timer)clearInterval(timer);
 timer=setInterval(()=>{flush().then(()=>poll());},2500);
}
async function start(){
 const cert=adapter?.current?.();
 if(!cert)return message("Open a certificate first.");
 activeId=cert.id;lastEvent=0;conflicts=0;changes=0;queue.clear();
 try{
  const res=await fetch("/api/certificates/session",{credentials:"include",cache:"no-store"});
  if(!res.ok)throw Error("Sign in using Cloud Team first.");
  session=await res.json();
  await api("","POST",{kind:"heartbeat"});
  online=true;visible=true;startTimer();await poll();draw();renderToolbar();
 }catch(e){activeId="";online=false;message(e.message+" Upload the certificate using Cloud Team → Back up / sync now before opening live editing.");renderToolbar();}
}
function open(a){
 if(a)adapter=a;
 if(!modal){modal=document.createElement("div");modal.className="speed-overlay";modal.addEventListener("click",e=>{if(e.target===modal){modal.remove();modal=null;}});document.body.appendChild(modal);}
 draw();
 if(!activeId)start();else if(activeId!==adapter?.current?.()?.id)start();else poll();
}
function end(){
 if(timer)clearInterval(timer);timer=null;
 if(queue.size)flush();
 activeId="";visible=false;online=false;editors.clear();modal?.remove();modal=null;renderToolbar();
}
document.addEventListener("input",e=>{
 if(!activeId||!online)return;
 const doc=getCertificate(),p=inputPath(e.target,doc);
 if(!valid(p)||doc?.id!==activeId)return;
 const v=e.target.type==="checkbox"?e.target.checked:e.target.value;
 const previous=getAt(doc,p);
 if(JSON.stringify(v)===JSON.stringify(previous))return;
 const key=pathKey(p);
 const existing=queue.get(key);
 queue.set(key,{path:p,previous:existing?existing.previous:previous,value:v});
 window.SperinSpeedSuite?.status?.("pending");
 renderToolbar();
},true);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&activeId)poll();});
window.addEventListener("online",()=>{if(activeId){online=true;flush().then(poll);}});
window.addEventListener("offline",()=>{online=false;renderToolbar();});
window.SperinLiveEditing={open,end,isActive:id=>!!activeId&&activeId===id,install:a=>{adapter=a;renderToolbar();}};
})();