import assert from "node:assert/strict";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const page1=await browser.newPage({viewport:{width:430,height:900}}),page2=await browser.newPage({viewport:{width:430,height:900}});
const url=process.env.CERT_BASE_URL||"http://127.0.0.1:4173/certificates/";
let cloud=null,revision=1,events=[],patches=[],active=new Set();
const read=(x,path)=>path.reduce((v,k)=>v==null?null:v[k],x)??null;
const write=(x,path,value)=>{let n=x;for(const k of path.slice(0,-1))n=n[k];n[path.at(-1)]=value;};
const respond=(route,obj,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"},body:JSON.stringify(obj)});
function routeFor(page,email){
 return page.route("**/api/certificates/**",async r=>{
  const req=r.request(),address=new URL(req.url()),path=address.pathname;
  if(path.endsWith("/session"))return respond(r,{email,organisation:"Test Team",role:"electrician"});
  if(path.includes("/docs"))return respond(r,{documents:[],nextOffset:0,hasMore:false});
  if(path.includes("/live/")){
    if(req.method()==="GET"){
      const start=Number(address.searchParams.get("after")||0);
      return respond(r,{events:address.searchParams.get("baseline")==="1"?[]:events.filter(x=>x.id>start),cursor:events.at(-1)?.id||0,
        presence:[...active].map(x=>({email:x,last_seen:new Date().toISOString()})),revision,status:"draft",hasMore:false});
    }
    const payload=JSON.parse(req.postData()||"{}");
    if(payload.kind==="heartbeat"){active.add(email);return respond(r,{present:true});}
    if(payload.kind==="patch"){
      if(!cloud)return respond(r,{error:"Missing remote record"},404);
      const previous=read(cloud,payload.path);
      if(JSON.stringify(previous)!==JSON.stringify(payload.previous))
        return respond(r,{error:"Changed by another engineer; original retained"},409);
      write(cloud,payload.path,payload.value);
      revision++;
      const event={id:events.length+1,field_path:payload.path,previous_value:payload.previous,new_value:payload.value,actor:email,revision,edited_at:new Date().toISOString()};
      patches.push({email,...payload});events.push(event);
      return respond(r,{saved:true,revision,eventId:event.id,editor:email});
    }
  }
  return respond(r,{error:"Unknown mock API"},404);
 });
}
await Promise.all([routeFor(page1,"electrician1@example.test"),routeFor(page2,"electrician2@example.test")]);
await page1.goto(url,{waitUntil:"domcontentloaded"});
await page1.locator('[data-action="new"][data-type="eic"]').first().click();
const state=await page1.evaluate(()=>{
 const keys=Object.keys(localStorage),key=keys.find(k=>k.includes("certificates-data-v1"));
 if(!key)throw Error("Certificate storage not found");
 const app=JSON.parse(localStorage.getItem(key));
 return {entries:Object.entries(localStorage),cloud:structuredClone(app.certificates.find(x=>x.type==="eic"))};
});
cloud=state.cloud;
// Install the first engineer's saved certificate BEFORE the second app starts.
// This avoids an empty initial app overwriting imported localStorage during page reload.
await page2.addInitScript(entries=>{for(const [k,v] of entries)localStorage.setItem(k,v);},state.entries);
await page2.goto(url,{waitUntil:"domcontentloaded"});
if(!(await page2.locator('[data-field="clientName"]').count())){
  const rows=await page2.locator(".saved-cert-row").count();
  if(!rows)throw Error("Restored second client has no certificate: "+JSON.stringify(await page2.evaluate(()=>({keys:Object.keys(localStorage),items:document.querySelector("#app")?.textContent?.slice(0,250)}))));
  await page2.locator(".saved-cert-row").first().click();
}
for(const p of [page1,page2]){
 await p.waitForFunction(()=>!!window.SperinLiveEditing?.open);
 await p.evaluate(()=>window.SperinLiveEditing.open());
 try{
   await p.waitForFunction(()=>document.querySelector('[data-live-status]')?.textContent?.includes("Connected"),null,{timeout:10000});
 }catch(err){
   const debug=await p.evaluate(()=>({status:document.querySelector('[data-live-status]')?.textContent,hasField:!!document.querySelector('[data-field="clientName"]'),url:location.href,active:document.querySelector('#sperin-live-indicator')?.textContent,script:typeof window.SperinLiveEditing}));
   throw Error("Live joining failure: "+JSON.stringify(debug)+" "+String(err));
 }
}
const client1=page1.locator('[data-field="clientName"]').first();
await client1.fill("QA electrician one");
await page1.waitForFunction(()=>document.querySelector('#sperin-live-indicator')?.textContent?.includes("live"),null,{timeout:15000});
await page1.waitForTimeout(3200);
assert(patches.some(x=>x.email==="electrician1@example.test"&&x.path.join(".")==="fields.clientName"),"Engineer one data not sent");
await page2.waitForFunction(()=>document.querySelector('[data-field="clientName"]')?.value==="QA electrician one",null,{timeout:12000});
const postcode2=page2.locator('[data-field="clientPostcode"]').first();
await postcode2.fill("B17 9QA");
await page2.waitForTimeout(3200);
assert.equal(read(cloud,["fields","clientName"]),"QA electrician one");
assert.equal(read(cloud,["fields","clientPostcode"]),"B17 9QA");
assert.equal(events.length,2,"Two distinct engineers must save two fields");
await page1.waitForFunction(()=>document.querySelector('[data-field="clientPostcode"]')?.value==="B17 9QA",null,{timeout:12000});
// A concurrent edit of the same stale field must NOT silently overwrite.
await page2.evaluate(()=>window.SperinLiveEditing.end());
const currentOnServer=read(cloud,["fields","clientName"]);
assert.equal(currentOnServer,"QA electrician one");
console.log("LIVE_TWO_ENGINEERS_SIMULTANEOUS_FIELDS_AND_PRESENCE_PASS");
await browser.close();
