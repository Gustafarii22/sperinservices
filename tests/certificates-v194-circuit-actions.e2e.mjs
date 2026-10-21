import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
page.on("dialog",async d=>{if(d.type()==="prompt")await d.accept("QA circuit template");else await d.accept();});
await page.goto(process.env.CERT_BASE_URL||"http://127.0.0.1:4173/certificates/",{waitUntil:"domcontentloaded"});
await page.locator('#speed-nav [data-speed="new"]').click();
await page.locator('.cert-launch[data-type="eic"]').click();
await page.evaluate(()=>{
 const k="sperin-certificates-data-v1",raw=localStorage.getItem(k);
 if(!raw)throw Error("No saved certificate state");
 const state=JSON.parse(raw),c=state.certificates.find(x=>x.type==="eic");
 if(!c)throw Error("No EIC saved");
 c.tables.boards[0].ref="DB1";
 c.tables.circuits=Array.from({length:4},(_,i)=>({id:crypto.randomUUID(),boardRef:"DB1",circuitNo:String(i+1),description:"QA Circuit "+(i+1),deviceKind:"MCB",ocpdBs:"BS EN 60898-1",ocpdType:"B",ocpdRating:"16"}));
 c.tables.tests=Array.from({length:4},(_,i)=>({boardRef:"DB1",circuitNo:String(i+1),zs:String(i+1)+".01",r1r2:String(i+1)+".02"}));
 localStorage.setItem(k,JSON.stringify(state));
});
await page.reload();
if(!(await page.locator(".distribution-section").count())){
 await page.locator('#speed-nav [data-speed="certificates"]').click();
 await page.locator('.saved-cert-row').first().click();
}
const section=page.locator("details.distribution-section");
if(!(await section.evaluate(e=>e.open)))await section.locator("summary").first().click();
let body=page.locator("details.cu-circuits-accordion").first();
if(!(await body.evaluate(e=>e.open)))await body.locator("summary").first().click();
async function row(description){
 const x=page.locator(".inline-circuit").filter({hasText:description}).first();
 if(!await x.count()){
   const diagnostic=await page.evaluate(()=>{
     const c=JSON.parse(localStorage.getItem("sperin-certificates-data-v1"))?.certificates?.find(v=>v.type==="eic");
     return {url:location.href,view:localStorage.getItem("sperin-certificates-view-v1"),stored:c?.tables?.circuits?.map(v=>({no:v.circuitNo,desc:v.description,ref:v.boardRef})),htmlCircuits:[...document.querySelectorAll(".inline-circuit")].map(v=>v.textContent?.slice(0,160)),boards:[...document.querySelectorAll(".cu-circuits-accordion")].map(v=>({open:v.open,txt:v.textContent?.slice(0,130)}))};
   });
   throw Error("Missing circuit "+description+" after reload: "+JSON.stringify(diagnostic));
 }
 await x.waitFor();
 if(!(await x.evaluate(e=>e.open)))await x.locator("summary").first().click();
 return x;
}
const fourth=await row("QA Circuit 4");
for(const name of ["circuit-open","circuit-move-up","circuit-move-down","circuit-duplicate","template-save-circuit","template-open","circuit-delete"]){
 assert.equal(await fourth.locator('[data-action="'+name+'"]').count(),1,"Missing circuit toolbar action "+name);
}
const bar=fourth.locator(".inline-circuit-actions");
assert.equal(await bar.locator("button").count(),7,"One aligned seven-action row required");
const layout=await bar.evaluate(e=>({display:getComputedStyle(e).display,whiteSpace:getComputedStyle(e).whiteSpace,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,firstHeight:e.querySelector("button").getBoundingClientRect().height}));
assert.equal(layout.display,"flex");
assert(layout.firstHeight>=43,"Mobile edit action must be finger-sized");
await fourth.locator('[data-action="template-save-circuit"]').click();
assert((await page.locator(".toast,.toast-message").count())>=0);
for(let i=0;i<3;i++){
 const moving=await row("QA Circuit 4");
 await moving.locator('[data-action="circuit-move-up"]').click();
}
const read=()=>page.evaluate(()=>{
 const s=JSON.parse(localStorage.getItem("sperin-certificates-data-v1"));
 const c=s.certificates.find(x=>x.type==="eic");
 return c.tables.circuits.map((row,i)=>({no:row.circuitNo,description:row.description,zs:c.tables.tests[i]?.zs,testNo:c.tables.tests[i]?.circuitNo}));
});
let state=await read();
assert.deepEqual(state.map(x=>x.no),["1","2","3","4"],"Circuit positions must renumber after moving");
assert.deepEqual(state.map(x=>x.description),["QA Circuit 4","QA Circuit 1","QA Circuit 2","QA Circuit 3"],"Moved circuit must become circuit 1");
assert.deepEqual(state.map(x=>x.zs),["4.01","1.01","2.01","3.01"],"Measurements must travel with circuit");
let second=await row("QA Circuit 1");
await second.locator('[data-action="circuit-delete"]').click();
state=await read();
assert.deepEqual(state.map(x=>x.no),["1","2","3"]);
assert.deepEqual(state.map(x=>x.description),["QA Circuit 4","QA Circuit 2","QA Circuit 3"]);
assert.deepEqual(state.map(x=>x.zs),["4.01","2.01","3.01"]);
const toEdit=await row("QA Circuit 2");
await toEdit.locator('[data-action="circuit-open"]').click();
assert.equal(await page.locator(".form-head.circuit-head").count(),1,"Edit must open full circuit editor");
await page.reload();
const persisted=await read();
assert.deepEqual(persisted.map(x=>x.description),["QA Circuit 4","QA Circuit 2","QA Circuit 3"],"Order and deletes survive app reload");
await browser.close();
console.log("CIRCUIT_EDIT_TOOLBAR_TEMPLATE_MOVE_DELETE_RENUMBER_TEST_PAIR_PERSISTENCE_PASS");
