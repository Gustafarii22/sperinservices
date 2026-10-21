/* Sperin Certificates optional cloud team workspace.
   Local-first, opt-in and conflict aware: never discard/overwrite local records. */
(() => {
  "use strict";
  let adapter=null,root=null,busy=false,session=null,enabled=false,pendingTimer=null;
  const PREFIX="sperin-cloud-workspace-";
  const h=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const status=(msg)=>{const el=root?.querySelector("[data-cloud-status]");if(el)el.textContent=msg;};
  const safeObject=(s)=>{try{const d=JSON.parse(s||"{}");return d&&typeof d==="object"?d:{};}catch{return {};}};
  const map=()=>safeObject(localStorage.getItem(PREFIX+(session?.email||"local")));
  const store=(m)=>{if(session)localStorage.setItem(PREFIX+session.email,JSON.stringify(m));};
  const cloudConsent=()=>localStorage.getItem(PREFIX+"enabled")==="yes";
  const setConsent=(v)=>{enabled=!!v;localStorage.setItem(PREFIX+"enabled",v?"yes":"no");};
  const fingerprint=(c)=>{const copy={...c};delete copy.updatedAt;return JSON.stringify(copy);};
  async function api(path,method="GET",payload){
    const r=await fetch("/api/certificates/"+path,{method,credentials:"include",headers:payload?{"Content-Type":"application/json"}:{},body:payload?JSON.stringify(payload):undefined});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d.error||"Cloud request failed ("+r.status+")");
    return d;
  }
  const editable=()=>session&&["owner","supervisor","electrician"].includes(session.role);
  async function getSession(){
    try{session=await api("session");return true;}catch{session=null;return false;}
  }
  function close(){root?.remove();root=null;}
  function styles(){
    if(document.getElementById("sperin-workspace-css"))return;
    const el=document.createElement("style");el.id="sperin-workspace-css";
    el.textContent=".sw-backdrop{position:fixed;inset:0;z-index:10000;background:#0d1b32bb;display:grid;place-items:center;padding:14px}.sw-dialog{background:#fff;color:#192838;border-radius:16px;width:min(690px,100%);max-height:92vh;overflow:auto;padding:20px;box-shadow:0 20px 70px #0004;font:14px system-ui}.sw-dialog h2{margin:0 0 5px}.sw-dialog p{line-height:1.55}.sw-actions{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0}.sw-dialog input,.sw-dialog select{padding:10px;border:1px solid #bbc9dc;border-radius:8px;min-width:150px;max-width:100%}.sw-dialog button{background:#eaf1fb;color:#123047;padding:10px 14px;border:0;border-radius:9px;font-weight:600;cursor:pointer}.sw-dialog button.primary{background:#1870d5;color:#fff}.sw-dialog button:disabled{opacity:.55}.sw-section{border-top:1px solid #dce4ef;padding:14px 0}.sw-record{padding:8px 0;border-bottom:1px solid #e7ebf1}.sw-record small{color:#576779;display:block;margin:4px 0}.sw-note{background:#f1f5fb;border-radius:9px;padding:11px}.sw-error{color:#9b2532}.sw-consent{display:block;margin:12px 0}.sw-consent input{min-width:0}.sw-top{display:flex;justify-content:space-between;gap:12px}.sw-top button{height:40px}";
    document.head.appendChild(el);
  }
  function render(){
    if(!root)return;const signed=!!session,records=adapter?.list?.()||[];
    root.innerHTML='<div class="sw-dialog" role="dialog" aria-modal="true" aria-labelledby="sw-title">'+
      '<div class="sw-top"><div><h2 id="sw-title">Cloud workspace</h2><p>Private teams, syncing and supervisor review</p></div><button data-sw="close" aria-label="Close workspace">✕</button></div>'+
      (signed?'<p class="sw-note">Signed in as <strong>'+h(session.email)+'</strong> · '+h(session.organisation)+' · '+h(session.role)+'</p>'+
        '<div class="sw-actions"><button data-sw="logout">Sign out</button></div>':
        '<p class="sw-note">Your offline certificates are never uploaded unless you sign in and agree. The cloud service needs a separate account and database.</p>'+
        '<div class="sw-actions"><input data-sw-email type="email" placeholder="Your work email" autocomplete="email"><button data-sw="send-code">Email sign-in code</button></div>'+
        '<div class="sw-actions"><input data-sw-code inputmode="numeric" placeholder="Six-digit code" maxlength="6"><button data-sw="verify">Sign in</button></div>')+
      (signed?'<div class="sw-section"><h3>Backup and synchronisation</h3>'+
        '<label class="sw-consent"><input type="checkbox" data-sw-consent '+(enabled?'checked':'')+'> I authorise uploading my customer and certificate records to my private team workspace.</label>'+
        '<p>Once enabled, new edits upload automatically while online. If two people change the same certificate, the server rejects overwrites and you resolve the difference manually.</p>'+
        '<div class="sw-actions"><button class="primary" data-sw="push" '+(!enabled||!editable()?'disabled':'')+'>Back up / sync now</button><button data-sw="pull">Download cloud changes</button></div></div>'+
        '<div class="sw-section"><h3>Team members</h3>'+
        '<div class="sw-actions"><button data-sw="members">Show team</button>'+
        (["owner","supervisor"].includes(session.role)?'<input data-sw-invite-email type="email" placeholder="Engineer email"><select data-sw-role><option>electrician</option><option>supervisor</option><option>viewer</option></select><button data-sw="invite">Add team member</button>':'')+'</div><div data-sw-members></div></div>'+
        '<div class="sw-section"><h3>Subscription and billing</h3><p>Subscription access is provided through Stripe; no payment details are entered or stored in this app.</p><div class="sw-actions"><button data-sw="billing-status">Check status</button>'+
        (session.role==='owner'?'<button data-sw="billing-checkout">Start / renew subscription</button><button data-sw="billing-portal">Manage billing</button>':'')+'</div><p data-sw-billing></p></div>'+
        '<div class="sw-section"><h3>Review and approval</h3>'+
        '<p>Electricians submit a cloud-synced draft. A different authorised supervisor reviews and approves it. Approval does not validate unverified measurements.</p>'+
        '<div class="sw-actions"><button data-sw="refresh">Refresh status</button></div><div data-sw-docs></div></div>':'')+
      '<div class="sw-section"><p data-cloud-status role="status">Local certificates on this device: '+records.length+'.</p></div></div>';
    root.querySelector("[data-sw-consent]")?.addEventListener("change",e=>{
      setConsent(e.target.checked);render();status(enabled?"Cloud upload authorised. Choose sync now to start.":"Automatic cloud uploads disabled.");});
  }
  async function pushAll(){
    if(busy||!enabled||!session||!editable())return;
    busy=true;let uploaded=0,conflicts=0;
    const m=map();
    try{
      const docs=adapter.list().slice();
      for(const cert of docs){
        const local=fingerprint(cert),meta=m[cert.id];
        if(meta?.last===local)continue;
        if(meta?.status&&meta.status!=="draft"){conflicts++;continue;}
        try{
          const saved=await api("docs","POST",{record:cert,expectedRevision:meta?.revision||0});
          m[cert.id]={revision:saved.revision,last:local,status:saved.status};store(m);uploaded++;
        }catch(err){conflicts++;console.warn("Cloud revision or upload rejected:",cert.id,err);}
      }
      status(uploaded+" uploaded; "+conflicts+" require manual review. No local record was deleted.");
    }catch(err){status("Cloud sync could not finish: "+err.message);}
    finally{busy=false;}
  }
  async function allCloudDocs(){
    let offset=0,items=[];
    for(let page=0;page<100;page++){
      const r=await api("docs?offset="+offset);
      items=items.concat(r.documents);
      if(!r.hasMore)break;offset=r.nextOffset;
    }
    return items;
  }
  async function pullAll(){
    if(busy||!session)return;busy=true;
    try{
      const remote=await allCloudDocs(),m=map(),local=adapter.list();
      let added=0,updated=0,conflicts=0;
      for(const entry of remote){
        const candidate=entry.record;
        if(!candidate||typeof candidate!=="object"||!candidate.id)continue;
        const existing=local.find(x=>x.id===candidate.id);
        if(!existing){
          adapter.add(candidate);added++;
          m[candidate.id]={revision:entry.revision,last:fingerprint(candidate),status:entry.status};
        }else if(m[candidate.id]?.revision===entry.revision){
          continue;
        }else if(m[candidate.id]?.last===fingerprint(existing)){
          // Local record is exactly the last synced version; safe to update.
          adapter.replace(candidate);updated++;
          m[candidate.id]={revision:entry.revision,last:fingerprint(candidate),status:entry.status};
        }else {
          // Never replace someone else's unsynced inspection and test readings.
          conflicts++;
        }
      }
      store(m);
      status(added+" new, "+updated+" safely updated; "+conflicts+" conflicts kept locally. Nothing deleted.");
      await showDocuments(remote);
    }catch(e){status("Could not download team certificates: "+e.message);}
    finally{busy=false;}
  }
  async function showDocuments(remote){
    const el=root?.querySelector("[data-sw-docs]");if(!el)return;
    const m=map();
    el.innerHTML=remote.map(d=>'<div class="sw-record"><strong>'+h(d.record?.number||d.id)+' · '+h(d.record?.type||'')+'</strong>'+
      '<small>'+h(d.status)+' · Revision '+Number(d.revision)+' · '+h(d.created_by)+'</small>'+
      '<div class="sw-actions">'+
      (d.status==="draft"&&editable()&&m[d.id]?.revision===d.revision?'<button data-sw-doc="submit" data-id="'+h(d.id)+'" data-revision="'+Number(d.revision)+'">Submit for approval</button>':'')+
      (d.status==="submitted"&&["supervisor","owner"].includes(session.role)?'<button data-sw-doc="approve" data-id="'+h(d.id)+'" data-revision="'+Number(d.revision)+'">Supervisor approve</button>':'')+'</div></div>').join("")||'<p>No cloud certificates yet.</p>';
    el.querySelectorAll("[data-sw-doc]").forEach(button=>button.addEventListener("click",async()=>{
      const id=button.dataset.id,action=button.dataset.swDoc,rev=Number(button.dataset.revision);
      const explanation=action==="approve"?"Confirm you are a DIFFERENT supervisor who has personally reviewed the tests and report?":"Submit this unchanged draft for independent review?";
      if(!confirm(explanation))return;
      try{
        const v=await api("docs/"+id+"/"+action,"POST",{expectedRevision:rev,confirmed:action==="approve"});
        if(m[id]){m[id].revision=v.revision;m[id].status=v.status;store(m);}
        status("Cloud status: "+v.status+".");await showDocuments(await allCloudDocs());
      }catch(e){status("Approval action not completed: "+e.message);}
    }));
  }
  async function invoke(btn){
    if(busy)return;
    const cmd=btn.dataset.sw;
    if(cmd==="close"){close();return;}
    if(cmd==="verify"||cmd==="send-code"){
      const email=root.querySelector("[data-sw-email]")?.value?.trim().toLowerCase();
      if(!email){status("Enter your email first.");return;}
      busy=true;
      try{
        if(cmd==="send-code"){await api("request-code","POST",{email});status("If accepted, a six-digit email code has been sent.");}
        else {
          const code=root.querySelector("[data-sw-code]")?.value?.trim();
          await api("verify-code","POST",{email,code});
          await getSession();enabled=cloudConsent();render();status("Signed in. Existing local data remains on this device.");
        }
      }catch(e){status(e.message);}finally{busy=false;}return;
    }
    if(cmd==="logout"){
      try{await api("logout","POST",{});}catch{}
      session=null;setConsent(false);render();return;
    }
    if(["billing-status","billing-checkout","billing-portal"].includes(cmd)){
      try{
        if(cmd==="billing-status"){
          const data=await api("billing/status");
          root.querySelector("[data-sw-billing]").textContent="Status: "+data.status+" · Trial ends: "+new Date(data.trialEnd).toLocaleDateString("en-GB")+(data.paymentsConfigured?"":" · Checkout is not configured yet.");
        }else{
          if(!confirm(cmd==="billing-checkout"?"Open Stripe to review the subscription price and terms before paying?":"Open your secure Stripe billing management page?"))return;
          const data=await api(cmd==="billing-checkout"?"billing/checkout":"billing/portal","POST",{});
          if(typeof data.url!=="string"||!data.url.startsWith("https://"))throw Error("Secure billing link unavailable");
          window.location.assign(data.url);
        }
      }catch(e){status("Billing unavailable: "+e.message);}
      return;
    }
    if(cmd==="push"){await pushAll();return;}
    if(cmd==="pull"||cmd==="refresh"){await pullAll();return;}
    if(cmd==="members"){
      try{const data=await api("members");const el=root.querySelector("[data-sw-members]");
        el.textContent=data.members.map(m=>m.email+" · "+m.role).join(" | ")||"No members";}catch(e){status(e.message);}return;
    }
    if(cmd==="invite"){
      const email=root.querySelector("[data-sw-invite-email]")?.value?.trim(),role=root.querySelector("[data-sw-role]")?.value;
      try{await api("invite","POST",{email,role});status("Member invited. They can sign in with their own verified email.");}
      catch(e){status(e.message);}
    }
  }
  function open(a){
    adapter=a;styles();
    if(root)close();
    root=document.createElement("div");root.className="sw-backdrop";
    root.addEventListener("click",e=>{if(e.target===root)close();});
    root.addEventListener("click",e=>{const b=e.target.closest("[data-sw]");if(b)invoke(b);});
    document.body.appendChild(root);
    enabled=cloudConsent();render();
    getSession().then(()=>{if(root){render();status(session?"Cloud account connected.":"Sign in or continue working offline.");}});
  }
  function schedule(){
    if(!session||!enabled||!editable()||busy)return;
    clearTimeout(pendingTimer);
    pendingTimer=setTimeout(()=>{pushAll();},3000);
  }
  function connect(a){adapter=a;enabled=cloudConsent();if(enabled)getSession().then(ok=>{if(ok)schedule();});}
  window.addEventListener('online',()=>{if(enabled&&adapter)getSession().then(ok=>{if(ok)schedule();});});
  window.SperinCloudWorkspace={open,schedule,connect};
})();
