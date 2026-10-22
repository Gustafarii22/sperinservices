/* Speed suite: never invent electrical measurements or declare compliance. */
(()=>{"use strict";
let api=null,modal=null,theme=localStorage.getItem("sperin-ux-theme")||"light",sync="local",activity=[],poll=null;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setTheme(x){theme=x==="dark"?"dark":"light";localStorage.setItem("sperin-ux-theme",theme);document.documentElement.dataset.theme=theme;update();}
setTheme(theme);
const current=()=>api?.current?.();
function status(x){sync=x;update();}
function update(){
 const n=document.getElementById("speed-nav");if(!n)return;
 const text=sync==="synced"?"☑ Last upload confirmed":sync==="reachable"?"☁ Cloud reachable · verify sync":sync==="uploading"?"↻ Uploading…":sync==="pending"?"◷ Local edits awaiting sync":sync==="conflict"?"⚠ Conflict — local saved":sync==="error"?"⚠ Cloud unavailable":!navigator.onLine?"◌ Offline":"◌ Local only";
 n.querySelector("[data-sync]").textContent=text;n.querySelector("[data-theme]").textContent=theme==="dark"?"☀":"☾";
 n.querySelector("[data-activity]").textContent="👷 "+(activity.length?new Set(activity.map(x=>x.by)).size+" editors":"Activity");
}
const navIcon=(key)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+({home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',new:'<path d="M12 4v16M4 12h16"/>',certificates:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',jobs:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'}[key]||'')+'</svg>';
function nav(){
 let n=document.getElementById("speed-nav");
 if(!n){n=document.createElement("nav");n.id="speed-nav";n.setAttribute("aria-label","Primary app navigation");document.body.appendChild(n);}
 n.innerHTML='<div class="speed-status-row"><button data-speed="workspace" data-sync>◌ Local only</button><button data-speed="activity" data-activity>👷 Activity</button><button data-speed="theme" data-theme>☾</button></div>'+
 '<div class="speed-links">'+[['home','Home'],['new','New'],['certificates','My Certificates'],['more','More']].map(([key,label])=>'<button data-speed="'+key+'">'+navIcon(key)+'<span>'+label+'</span></button>').join('')+'</div>' ;
 n.onclick=e=>{const b=e.target.closest("[data-speed]");if(b)action(b.dataset.speed);};update();
}
function show(title,html){
 modal?.remove();modal=document.createElement("div");modal.className="speed-overlay";
 modal.innerHTML='<section class="speed-dialog" role="dialog" aria-modal="true"><header><h2>'+esc(title)+'</h2><button data-speed-close>✕</button></header><div class="speed-content">'+html+'</div></section>';
 modal.onclick=e=>{if(e.target===modal||e.target.closest("[data-speed-close]"))close();};
 document.body.appendChild(modal);return modal;
}
function close(){modal?.remove();modal=null;}
function requireCert(){if(!current()){show("Choose a certificate","<p>Open an EIC, EICR or Minor Works first.</p>");return false;}return true;}
const safeCols=new Set(["description","remarks","location","purpose","testNotes"]);
function bulk(){
 if(!requireCert())return;const c=current();
 const keys=Object.keys(c.tables||{}).filter(k=>Array.isArray(c.tables[k]));
 const m=show("Find & replace · safe text",'<p>Text descriptions only. Measurements, codes, circuit numbers, ratings and declarations cannot be bulk replaced.</p>'+
 '<label>Schedule <select data-schedule>'+keys.map(k=>'<option>'+esc(k)+'</option>').join("")+'</select></label>'+
 '<label>Field <select data-column></select></label><label>Find exact text<input data-find></label><label>Replace<input data-replace></label>'+
 '<div class="speed-actions"><button data-preview>Preview</button><button data-apply disabled>Apply checked rows</button></div><div data-results></div>');
 let changes=[];
 function fields(){
   const table=m.querySelector("[data-schedule]").value;
   const cols=[...new Set((c.tables[table]||[]).flatMap(r=>Object.keys(r||{})))].filter(k=>safeCols.has(k));
   m.querySelector("[data-column]").innerHTML=cols.map(x=>'<option>'+esc(x)+'</option>').join("");
   m.querySelector("[data-results]").textContent="";m.querySelector("[data-apply]").disabled=true;
 }
 fields();m.querySelector("[data-schedule]").onchange=fields;
 m.querySelector("[data-preview]").onclick=()=>{
  const table=m.querySelector("[data-schedule]").value,column=m.querySelector("[data-column]").value;
  const find=m.querySelector("[data-find]").value,replace=m.querySelector("[data-replace]").value;
  if(!safeCols.has(column)||!find||find.length>90||replace.length>160)return alert("Enter a safe field and short exact search text.");
  changes=(c.tables[table]||[]).flatMap((row,i)=>{
    const old=String(row[column]||"");if(!old.toLowerCase().includes(find.toLowerCase()))return [];
    const result=old.split(find).join(replace);if(result===old)return [];
    return [{table,column,i,old,next:result}];
  }).slice(0,300);
  m.querySelector("[data-results]").innerHTML=changes.length?changes.map((x,i)=>'<label class="speed-diff"><input type="checkbox" data-pick="'+i+'" checked> Row '+(x.i+1)+' <small>'+esc(x.old)+' → '+esc(x.next)+'</small></label>').join(""):"No exact matches. Search is case sensitive.";
  m.querySelector("[data-apply]").disabled=!changes.length;
 };
 m.querySelector("[data-apply]").onclick=()=>{
   const picks=[...m.querySelectorAll("[data-pick]:checked")].map(x=>changes[Number(x.dataset.pick)]).filter(Boolean);
   if(!picks.length||!confirm("Change "+picks.length+" descriptive fields? No tests or declarations will be changed."))return;
   try{api.mutate("Bulk text update",c=>{for(const x of picks){if(c.tables[x.table]?.[x.i]?.[x.column]!==x.old)throw Error("Data changed — run preview again");c.tables[x.table][x.i][x.column]=x.next;}});close();}
   catch(e){alert(e.message);}
 };
}
const presets=[["Sockets","Socket outlets","B","32"],["Lighting","Lighting","B","6"],["Cooker","Cooker","B","32"],["Shower","Electric shower","B","40"],["Immersion","Immersion heater","B","16"],["EV","EV charge point","B","32"],["Spare","Spare (not connected)","",""]];
function quick(){
 const c=current();if(!c||!["eic","eicr"].includes(c.type))return show("Quick add","<p>Open an EIC or EICR first.</p>");
 const boards=c.tables?.boards||[];const m=show("Fast circuit entry",'<p>Suggested descriptions only; confirm protective devices, circuit arrangements, values and test results.</p>'+
 '<label>Board<select data-board>'+boards.map(b=>'<option value="'+esc(b.ref)+'">'+esc(b.ref)+'</option>').join("")+'</select></label>'+
 '<div class="speed-presets">'+presets.map((p,i)=>'<button data-preset="'+i+'"><strong>'+p[0]+'</strong><small>'+p[2]+p[3]+' A suggestion</small></button>').join("")+'</div><p data-count>Nothing added.</p>');
 let count=0;m.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{const p=presets[Number(b.dataset.preset)];try{api.quick(m.querySelector("[data-board]").value,p[1],p[2],p[3]);m.querySelector("[data-count]").textContent=++count+" circuits added. Verify before issue.";}catch(e){alert(e.message);}});
}
function convert(){
 const c=current();if(!c)return requireCert();
 const types=c.type==="eicr"?["eic","minor"]:c.type==="eic"?["eicr","minor"]:c.type==="minor"?["eic","eicr"]:[];
 if(!types.length)return show("Conversion","<p>Only EIC, EICR and Minor Works can share source information; their declarations are not interchangeable.</p>");
 const m=show("Copy to new certificate",'<p>Original unchanged. Copies matching customer/site details, optionally circuit descriptions. Never transfers test results, inspection findings, declarations or signatures as verified new work.</p>'+
 '<label>New certificate type<select data-type>'+types.map(t=>'<option value="'+t+'">'+t.toUpperCase()+'</option>').join("")+'</select></label>'+
 '<label><input type="checkbox" data-circuits checked> Copy circuit descriptions only</label><div class="speed-actions"><button data-create>Create DRAFT</button></div>');
 m.querySelector("[data-create]").onclick=()=>{if(confirm("Create a separate DRAFT? All applicable inspections, measurements and declarations must be completed independently.")){try{api.convert(m.querySelector("[data-type]").value,m.querySelector("[data-circuits]").checked);close();}catch(e){alert(e.message);}}};
}
function bluetooth(){
 const m=show("Bluetooth test instruments",'<p>Pair the instrument in Android settings, then choose it below. <strong>Classic serial (SPP) reading is experimental and requires the tester to transmit a readable CSV.</strong> Megger MFT-X1 proprietary measurement transfer is not verified. No test reading is imported without your approval.</p>'+
 '<div class="speed-actions"><button data-paired>Show paired devices</button><button data-settings>Bluetooth settings</button><button data-csv>Import tester CSV</button></div><div data-device-list role="status">No device connected.</div>');
 const el=m.querySelector("[data-device-list]");
 m.querySelector("[data-paired]").onclick=()=>{
   if(window.Android?.listPairedInstruments){
     window.sperinBluetoothDevices=data=>{
       try{
         const devices=JSON.parse(data);
         el.innerHTML=devices.length?devices.map(x=>'<div class="speed-diff"><button data-spp="'+esc(x.address||"")+'">Read '+esc(x.name||"Paired tester")+' (SPP)</button></div>').join(""):"No paired Bluetooth instruments found.";
         el.querySelectorAll("[data-spp]").forEach(button=>button.onclick=()=>{
           const addr=button.dataset.spp;
           if(!window.Android?.readInstrumentSerial)return el.textContent="Direct serial read requires the installed Android app.";
           el.textContent="Connecting to paired tester. Start the tester’s documented data export. Waiting up to 14 seconds…";
           window.sperinBluetoothSerialResult=(device,data,error)=>{
             if(device!==addr)return;
             if(error||!data){el.textContent=error||"No data received.";return;}
             el.textContent="Text data received from paired instrument. Readings are NOT accepted yet.";
             const review=document.createElement("button");review.textContent="Review received CSV measurements";
             review.onclick=()=>{close();api.tester();window.SperinInstrumentImport?.reviewText?.(data);};
             el.appendChild(review);
           };
           window.Android.readInstrumentSerial(addr);
         });
       }catch{el.textContent="Cannot read paired instruments.";}
     };
     window.Android.listPairedInstruments();
   }else el.textContent="Paired-device access requires the installed Android app.";
 };
 m.querySelector("[data-settings]").onclick=()=>window.Android?.openInstrumentBluetoothSettings?.()||alert("Open Android Settings → Connections → Bluetooth.");
 m.querySelector("[data-csv]").onclick=()=>{close();api.tester();};
}
async function refresh(){
 if(!navigator.onLine){status("offline");return;}
 if(localStorage.getItem("sperin-cloud-workspace-enabled")!=="yes"){status("local");return;}
 try{const r=await fetch("/api/certificates/docs?offset=0",{credentials:"same-origin",cache:"no-store"});
 if(!r.ok){status(r.status===401?"local":"error");return;}
 const d=await r.json();activity=(d.documents||[]).slice(0,8).map(x=>({by:x.updated_by||x.created_by||"Unknown",at:x.updated_at||"",state:x.status}));
 if(!["synced","conflict","pending","uploading"].includes(sync))status("reachable");}catch{status("error");}
}
function team(){
 const m=show("Team activity",'<p>Shows recently saved cloud document updates on refresh (not live simultaneous editing). Local records are never overwritten when revisions conflict.</p>'+
 '<button data-refresh>Refresh</button><div data-team-rows></div>');
 async function paint(){await refresh();m.querySelector("[data-team-rows]").innerHTML=activity.length?activity.map(x=>'<div class="speed-diff">'+esc(x.by)+' · '+esc(x.state)+' <small>'+esc(x.at)+'</small></div>').join(""):"No verified cloud updates.";}
 m.querySelector("[data-refresh]").onclick=paint;paint();
}
function more(){
 const m=show("More tools",'<div class="speed-presets">'+[
 ["backup","Backup"],["restore","Restore"],["jobs","Jobs & photos"],["quick","⚡ Add common circuits"],["site-builder","Blank site sheets"],["site-read","Read completed site sheet"],["site-scan","Scan completed sheets"],["bulk","⇄ Find & replace"],["convert","▤ Copy / convert"],["bluetooth","ᛒ Bluetooth instruments"],["branding","◈ PDF branding"],["team","👷 Team activity"],["workspace","☁ Cloud"],["theme","☀/☾ Theme"]].map(x=>'<button data-tool="'+x[0]+'">'+x[1]+'</button>').join("")+'</div>');
 m.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{const key=b.dataset.tool;close();if(key==="backup"||key==="restore")document.querySelector('[data-action="'+key+'"]')?.click();if(key==="jobs")api.jobs();if(key==="quick")quick();if(key==="site-builder")api.siteBuilder();if(key==="site-read")api.siteRead();if(key==="site-scan")api.siteScan();if(key==="bulk")bulk();if(key==="convert")convert();if(key==="bluetooth")bluetooth();if(key==="branding")api.settings();if(key==="workspace")api.workspace();if(key==="team")team();if(key==="theme")setTheme(theme==="dark"?"light":"dark");});
}
function action(x){if(x==="home")api.home();if(x==="new")api.newCertificate();if(x==="certificates")api.library();if(x==="jobs")api.jobs();if(x==="more")more();if(x==="theme")setTheme(theme==="dark"?"light":"dark");if(x==="workspace")api.workspace();if(x==="activity")team();}
window.SperinSpeedSuite={install:a=>{api=a;nav();refresh();if(poll)clearInterval(poll);poll=setInterval(refresh,30000);window.addEventListener("offline",()=>status("offline"));window.addEventListener("online",refresh);},nav,status,refresh,quick,bulk,convert,bluetooth,more,setTheme};
})();
