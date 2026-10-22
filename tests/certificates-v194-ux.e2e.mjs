import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const page=await browser.newPage({viewport:{width:412,height:850},acceptDownloads:true});
const errors=[],dialogs=[];page.on("pageerror",e=>errors.push(e.message));
page.on("dialog",async d=>{dialogs.push(d.message());await d.accept();});
const home=()=>page.locator(".minimal-home");
const base=process.env.CERT_BASE_URL||"http://127.0.0.1:4173/certificates/";
await page.goto(base,{waitUntil:"domcontentloaded"});
await home().waitFor();
assert.equal(await page.locator(".home-big-action").count(),2,"Only New and My Certificates should dominate home");
assert.equal(await page.locator(".home-hero,.home-kpis,.home-metrics").count(),0,"No old hero or statistics");
assert.equal(await page.locator("#speed-nav .speed-links button").count(),4);
assert.equal(await page.locator('#speed-nav [data-speed="scan"]').count(),0,"No global Scan tab");
await page.locator('[data-action="open-library"]').click();
assert.equal(await page.locator('[data-library-search]').count(),1);
assert.equal(await page.locator('[data-library-status]').count(),1);
assert.equal(await page.locator('[data-library-sort]').count(),1);
for(const sort of ["recent","old","name","type"])await page.locator("[data-library-sort]").selectOption(sort);
for(const st of ["draft","completed","all"])await page.locator("[data-library-status]").selectOption(st);
await page.locator('[data-library-search]').fill("not-a-real-customer");
assert((await page.locator(".saved-cert-list").textContent()).includes("No matching"));
await page.locator('[data-library-search]').fill("");
await page.locator('#speed-nav [data-speed="home"]').click();
await home().waitFor();
await page.locator('#speed-nav [data-speed="new"]').click();
assert.equal(await page.locator('.cert-launch').count(),9);
await page.locator('.cert-launch[data-type="eic"]').click();
await page.locator('.form-head').waitFor();
let j=page.locator('details.distribution-section');
assert.equal(await j.count(),1,"Section J must exist");
assert((await j.locator("summary").first().textContent()).includes("J · Distribution"));
await j.locator("summary").first().click();
const board=page.locator(".consumer-unit-card").first(),circuits=page.locator(".cu-circuits-accordion").first();
assert.equal(await circuits.count(),1);
if(await board.evaluate(el=>el.open))await board.locator('summary').first().click();
await circuits.locator("summary").first().click();
let tab=circuits.locator(".inline-circuit").first();
if(!await tab.count()) {await circuits.locator('[data-action="circuit-add"]').click();tab=circuits.locator(".inline-circuit").first();}
assert(await tab.count()>0,"Individual circuit accordion required");
await tab.locator("summary").first().click();
await tab.locator('[data-circuit-input][data-col="deviceKind"]').waitFor();
const labels=await tab.locator('.combo-option[data-value]').allTextContents();
for(const val of ["MCB","RCBO","RCD","RCCB","Fuse","MCCB","AFDD"])assert(labels.includes(val),"Missing device type "+val);
const bs=tab.locator('[data-circuit-input][data-col="ocpdBs"]');
await tab.locator('[data-col="ocpdBs"]').first().locator("..").locator('[data-action="combo-toggle"]').click().catch(()=>{});
const standards=await tab.locator('.combo-option[data-value]').allTextContents();
for(const std of ["BS EN 60898-1","BS EN 61009-1","BS EN 61009-2-1","BS 3871","BS 88-2","BS 4293","BS 3036","BS EN 60947-2"])
 assert(standards.includes(std),"Standard picker incomplete: "+std);
await bs.fill("BS EN 61009-2-1");
await bs.dispatchEvent("input");
assert.equal(await bs.inputValue(),"BS EN 61009-2-1");
const method=tab.locator('[data-circuit-input="details"][data-col="refMethod"]');
await method.fill("101");
await method.dispatchEvent("input");
assert((await tab.locator('[data-ref-method-hint]').textContent()).includes("over 100 mm"),
  "Reference method 101 should explain ceiling insulation beside the selector");
const methodOptions=await tab.locator('.combo-option[data-value="103"]').allTextContents();
assert(methodOptions.some(x=>x.includes("not touching")),"Reference method options need clear descriptions");

await circuits.locator("summary").first().click();
assert(!(await circuits.evaluate(el=>el.open)),"Circuits tab must close");
await j.locator("summary").first().click();
assert(!(await j.evaluate(el=>el.open)),"J must close");
await j.locator("summary").first().click();
if(!(await circuits.evaluate(el=>el.open)))await circuits.locator("summary").first().click();
await circuits.locator('[data-action="board-scan"]').first().click();
assert((await page.locator(".board-scan-modal").textContent()).includes("Add to Certificate"));
assert.equal(await page.locator("[data-device-verified]").count(),0,"No individual device tick boxes");
await page.locator('[data-board-photos]').setInputFiles('public/projects/nursery-refurbishment/distribution-board.webp');
await page.waitForSelector('.scan-photo img');
const field=(key,value)=>({key,value,confidence:"check",reason:"Photo model proposal - verify",evidence:[{image:1,text:value}]});
const cloudResult={board:[field("manufacturer","Wylex"),field("spd","Type 2"),field("spdBs","BS EN 61643-11"),field("mainSwitch","100 A")],
  circuits:[
  {position:"0 main",association:"check",reason:"mock",fields:[field("deviceKind","Main switch"),field("description","MAIN SWITCH")]},
  {position:"1 shared RCCB",association:"check",reason:"mock",fields:[field("deviceKind","RCD"),field("description","63 A 30 mA"),field("rcdBs","BS EN 61008-1"),field("rcdRating","63"),field("rcdIdn","30")]},
  {position:"2 MCB",association:"check",reason:"mock",fields:[field("deviceKind","MCB"),field("description","Lighting"),field("ocpdType","B"),field("ocpdRating","6")]},
  {position:"3 spare",association:"check",reason:"mock",fields:[field("deviceKind","Spare"),field("description","SPARE")]},
  {position:"4 second RCCB",association:"check",reason:"mock",fields:[field("deviceKind","RCD"),field("description","63 A 30 mA"),field("rcdBs","BS EN 61008-1")]},
  {position:"5 second-bank RCBO",association:"check",reason:"mock",fields:[field("deviceKind","RCBO"),field("description","Sockets"),field("ocpdType","B"),field("ocpdRating","32"),field("poleCount","1"),field("testButtonVisual","Visible"),field("phaseAssociation","L1")]}
 ],warnings:[]};
await page.route("**/api/owner/certificate-scan",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(cloudResult)}));
await page.locator('[data-scan-command="cloud-toggle"]').click();
await page.locator('[data-board-consent]').check();
await page.locator('[data-scan-command="analyse"]').click();
await page.waitForFunction(()=>document.querySelectorAll(".scan-circuit").length>=6);
const rcboIndex=await page.evaluate(()=>Array.from(document.querySelectorAll(".scan-circuit")).findIndex(x=>x.textContent?.includes("Sockets")));
assert(rcboIndex>=0,"RCBO device not in scan review");
await page.locator('[data-open="c'+rcboIndex+'"]').click();
const rcbo=page.locator(".scan-circuit.expanded");
const k=rcbo.getByLabel("Device kind (MCB / RCBO / RCD / fuse)");
assert(await k.count()>0,"Editable protective device class missing");
assert((await rcbo.getByLabel("BS (EN)").first().inputValue()).includes("61009"),"Reviewable RCBO BS EN suggestion missing");
await page.locator('[data-scan-command="apply"]').click();
await page.locator('.board-scan-modal').waitFor({state:"detached",timeout:10000});
assert(dialogs.some(x=>x.includes("ALL device markings")),"Whole board confirmation missing");
const record=await page.evaluate(()=>JSON.parse(localStorage.getItem("sperin-certificates-data-v1")).certificates[0]);
const boardRows=record.tables.circuits.filter(x=>x.boardRef===record.tables.boards[0].ref);
const kinds=boardRows.slice(0,6).map(x=>x.deviceKind);
assert.equal(kinds[0],"Main switch");
assert.equal(kinds[1],"RCD");
assert(kinds.includes("Spare"),"Blank/spare device not preserved");
assert(kinds.includes("RCBO"),"RCBO not preserved");
const scannedRcbo=boardRows.find(x=>x.deviceKind==="RCBO");
assert.equal(scannedRcbo?.poleCount,"1");
assert.equal(scannedRcbo?.testButtonVisual,"Visible");
assert.equal(scannedRcbo?.phaseAssociation,"L1");
assert.equal(record.tables.boards[0].spdBs,"BS EN 61643-11");
await page.reload();
assert.equal(await home().count(),0,"Continue editing should survive reload");
await page.locator('[data-action="pdf"]').first().click();
await page.locator('.pdf-downloaded-modal').waitFor();
assert((await page.locator(".pdf-downloaded-modal").textContent()).includes("Open file"));
await page.locator('[data-action="pdf-dismiss"]').click();
await page.locator('[data-action="home"]').first().click();
await home().waitFor();
await page.locator('[data-action="open-library"]').click();
assert(await page.locator('.saved-cert-row').count()>0,"New certificate must appear in library");
await page.locator('[data-library-status]').selectOption('draft');
assert(await page.locator('.saved-cert-row').count()>0,"In-progress filter should retain draft");
assert.deepEqual(errors,[],"No runtime errors");
console.log("V194_FORWARD_HOME_J_CIRCUITS_SPLIT_LOAD_SCAN_PDF_PASS");
await browser.close();
