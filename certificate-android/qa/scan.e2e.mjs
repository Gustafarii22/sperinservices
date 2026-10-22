async function autoChooseQuickEntry(page){
  await page.addInitScript(()=>{
    const choose=()=>document.querySelector('.cv-opening [data-action="choose-entry"][data-mode="quick"]')?.click();
    new MutationObserver(choose).observe(document,{childList:true,subtree:true});
    document.addEventListener('DOMContentLoaded',choose,{once:true});
  });
}
import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const dir="certificate-android/qa-output";
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:915},acceptDownloads:true});
await autoChooseQuickEntry(page);
const errors=[],decisions=[];
page.on("pageerror",e=>errors.push(e.message));
page.on("dialog",d=>{decisions.push(d.message());d.accept();});
await page.goto(process.env.CERT_BASE_URL||"http://127.0.0.1:4173/certificates/");
await page.locator('[data-action="open-new"]').click();
await page.locator('.cert-launch[data-type="eic"]').click();
const ensureExpanded=async(details)=>{
 if(!(await details.evaluate(el=>el.open)))await details.locator('summary').first().click();
};
const openSectionJ=()=>ensureExpanded(page.locator('details.distribution-section'));
const openCircuits=async(index=0)=>{
 await openSectionJ();
 await ensureExpanded(page.locator('details.cu-circuits-accordion').nth(index));
};
await page.locator('[data-field="clientName"]').fill("Scanner regression customer");
// Compact IET form sections: opening B closes A. Actual form labels remain unchanged.
assert.ok(await page.locator('.cert-accordion').first().evaluate(el=>el.open));
await page.locator('.cert-accordion').nth(1).locator('summary').click();
assert.ok(await page.locator('.cert-accordion').nth(1).evaluate(el=>el.open));
assert.ok(!await page.locator('.cert-accordion').first().evaluate(el=>el.open));
await page.locator('.cert-accordion').first().locator('summary').click();
assert.ok(!await page.locator('.cert-accordion').nth(1).evaluate(el=>el.open));
await openCircuits();
await page.locator('.cu-circuits-accordion').first().locator('[data-action="board-scan"]').click();
assert.equal(await page.locator('.scan-board').count(),1);
assert.equal(await page.locator('.scan-circuits .scan-circuit').count(),0);
assert.equal(await page.locator('.scan-device,.scan-approve,[data-device-confirm]').count(),0);
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Read photos'));
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Add to Certificate'));
await page.locator('[data-board-photos]').setInputFiles('public/projects/nursery-refurbishment/distribution-board.webp');
await page.waitForSelector('.scan-photo img');
const field=(key,value,confidence="high")=>({key,value,confidence,evidence:[{image:1,text:value}],reason:"Controlled mock, not an AI read"});
await page.route("**/api/owner/certificate-scan",route=>route.fulfill({
 status:200,contentType:"application/json",body:JSON.stringify({
 board:[field("manufacturer","Wylex"),field("mainSwitch","100 A"),field("spd","Type 2")],
 // Only a visibly positioned SPD may become circuit 1. SPD board metadata alone
 // must never be turned into an invented physical circuit position.
 circuits:[
 {position:"Physical main switch, position 0",association:"high",reason:"Fixture",
  fields:[field("deviceKind","Main switch"),field("description","MAIN SWITCH")]},
 {position:"Physical SPD, position 1",association:"high",reason:"Fixture",
  fields:[field("deviceKind","SPD"),field("description","SPD")]},
 {position:"Bank 1 first RCBO",association:"high",reason:"Fixture",
  fields:[field("description","Lighting"),field("ocpdType","B"),field("ocpdRating","6"),field("ocpdBs","BS EN 61009-1"),
  field("rcdType","A"),field("rcdIdn","30"),field("deviceKind","RCBO"),field("poleCount","1"),field("testButtonVisual","Visible")]}
 ],warnings:[]
 })
}));
await page.locator('[data-scan-command="cloud-toggle"]').click();
await page.locator('[data-board-consent]').check();
await page.locator('[data-scan-command="analyse"]').click();
await page.waitForFunction(()=>document.querySelectorAll('.scan-circuit').length===3);
assert.equal(await page.locator('[data-device-confirm]').count(),0);
assert.equal(await page.locator('.scan-circuit-title').count(),4);
assert.equal(await page.locator('.scan-circuit.expanded').count(),0);
await page.locator('[data-open="c2"]').click();
assert.equal(await page.locator('.scan-circuit.expanded').count(),1);
await page.locator('.scan-circuit.expanded').getByLabel('Circuit description').fill('Confirmed lights');
await page.locator('.scan-circuit.expanded [data-number="2"]').fill('12');
assert.equal(await page.locator('.scan-circuit.expanded').getByLabel('Device model').count(),1);
assert.equal(await page.locator('.scan-circuit.expanded').getByLabel('Device manufacturer').count(),1);
await page.locator('.scan-circuit.expanded').getByLabel('Device manufacturer').fill('FuseBox');
await page.locator('.scan-circuit.expanded').getByLabel('Device model').fill('RTA063240B');
// v1.9.4 uses a single installer confirmation for the COMPLETE board,
 // not the old checkbox-per-device workflow.
assert.equal(await page.locator('[data-device-verified]').count(),0);
await page.locator('[data-scan-command="apply"]').click();
assert.ok(decisions.some(message=>message.includes('ALL device markings')),
 'The installer must confirm every device and physical position before import.');
await page.locator('.board-scan-modal').waitFor({state:'detached'});
await page.locator('.consumer-unit-card').first().waitFor({state:'attached'});
await openSectionJ();
const readCert=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')).certificates[0]);
const cert=await readCert();
assert.equal(cert.tables.boards[0].manufacturer,"Wylex");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="0")?.deviceKind,"Main switch");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="1")?.deviceKind,"SPD");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.description,"Confirmed lights");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.ocpdRating,"6");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.rcdType,"A");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.deviceManufacturer,"FuseBox");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.deviceModel,"RTA063240B");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.ocpdBs,"BS EN 61009-1");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.rcdIdn,"30");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.testButtonVisual,"Visible");
assert.equal(cert.tables.circuits.find(c=>c.circuitNo==="12")?.poleCount,"1");
assert.ok(!cert.tables.tests.some(t=>t.rcdButton==="Pass"),"Photo must not create a functional test result");
assert.ok(!JSON.stringify(cert).includes("data:image/"));
await page.reload();
assert.equal((await readCert()).tables.circuits.find(c=>c.circuitNo==="12")?.description,"Confirmed lights");
await openSectionJ();
await ensureExpanded(page.locator('.consumer-unit-card').first());
const boardField=async (key,value)=>{
 const el=page.locator('.consumer-unit-card').first().locator('[data-board-input="'+key+'"]');
 await el.fill(value);
 await el.dispatchEvent('change');
};
await boardField('distributionOcpdBs','BS EN 60947-2');
await boardField('distributionOcpdType','C');
await boardField('distributionOcpdRating','63');
await boardField('rcdBs','BS EN 61008-1');
await boardField('rcdType','A');
await boardField('rcdRating','63');
await boardField('rcdIdn','30');
const instrumentSection=page.locator('.cert-accordion').filter({has:page.locator('summary:has-text("Test instrument")')}).first();
await ensureExpanded(instrumentSection);
await page.locator('[data-field="instrumentContinuity"]').fill('CONT-100');
await page.locator('[data-field="instrumentContinuity"]').dispatchEvent('change');
const verified=await readCert();
assert.equal(verified.tables.boards[0].distributionOcpdBs,'BS EN 60947-2');
assert.equal(verified.tables.boards[0].rcdIdn,'30');
assert.equal(verified.fields.instrumentContinuity,'CONT-100');

const [pdf]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="pdf"]').first().click()]);
await pdf.saveAs(dir+"/scan-confirmed.pdf");
if(await page.locator('.pdf-downloaded-modal').count())
 await page.locator('[data-action="pdf-dismiss"]').click();
assert.ok(fs.statSync(dir+"/scan-confirmed.pdf").size>10000);
// Add two visible spare ways. One complete-board confirmation covers both.
await openCircuits();
await page.locator('.cu-circuits-accordion').first().locator('[data-action="board-scan"]').click();
await page.locator('[data-scan-command="spare"]').click();
await page.locator('.scan-circuit.expanded [data-number]').fill("13");

await page.locator('[data-scan-command="spare"]').click();
await page.locator('.scan-circuit.expanded [data-number]').fill("14");

await page.locator('[data-scan-command="apply"]').click();
const after=await readCert();
for(const n of ["13","14"]){
 const spare=after.tables.circuits.find(c=>c.circuitNo===n);
 assert.equal(spare?.description,"SPARE");
 assert.equal(spare?.deviceKind,"Spare");
 assert.equal(spare?.ocpdRating,undefined);
}
const [pdf2]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="pdf"]').first().click()]);
await pdf2.saveAs(dir+"/scan-with-spares.pdf");
if(await page.locator('.pdf-downloaded-modal').count())
 await page.locator('[data-action="pdf-dismiss"]').click();
assert.ok(fs.statSync(dir+"/scan-with-spares.pdf").size>10000);
// Two independent boards: scan control belongs to each CU and stays out of the global header.
await openSectionJ();
await page.locator('[data-action="board-add"]').click();
assert.equal(await page.locator('.consumer-unit-card').count(),2);
await openCircuits(0);
assert.ok(await page.locator('.cu-circuits-accordion').first().locator('.inline-circuit').count()>=5);
if(!await page.locator('.consumer-unit-card').nth(1).evaluate(el=>el.open))await page.locator('.consumer-unit-card').nth(1).locator('.cu-summary').click();
assert.ok(!await page.locator('.consumer-unit-card').first().evaluate(el=>el.open),'board 1 must collapse when opening board 2');
assert.ok(await page.locator('.consumer-unit-card').nth(1).evaluate(el=>el.open));
await openCircuits(1);
await page.locator('.cu-circuits-accordion').nth(1).locator('[data-action="board-scan"]').click();
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Consumer unit 2'));
await page.locator('[data-scan-command="close"]').click();
// Exhausted cloud credits must silently fall back to local OCR (no secret needed).
await page.evaluate(()=>{
 window.Android={scanSheetImageBase64(token){
   const box=(text,x,y=450)=>({text,left:x-15,right:x+15,top:y-12,bottom:y+12});
   queueMicrotask(()=>window.SperinConsumerScan.ocrResult(token,JSON.stringify({
    width:1400,height:900,fullText:"FuseBox MAIN SWITCH SPD B40 B32",
    lines:[box("MAIN",1290,350),box("SWITCH",1290,385),box("SPD T2",1200),
           box("B40",1100),box("B32",1010)]
   }),""));
 }};
});
await page.route("**/api/owner/certificate-scan",route=>route.fulfill({
 status:429,contentType:"application/json",body:JSON.stringify({error:"Cloud scanning quota or rate limit reached"})
}));
await openCircuits(0);
await page.locator('.cu-circuits-accordion').first().locator('[data-action="board-scan"]').click();
await page.locator('[data-board-photos]').setInputFiles('public/projects/nursery-refurbishment/distribution-board.webp');
await page.locator('[data-scan-command="cloud-toggle"]').click();
await page.locator('[data-board-consent]').check();
await page.locator('[data-scan-command="analyse"]').click();
await page.waitForFunction(()=>document.querySelectorAll('.scan-circuit').length>=3);
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Photos read'));
assert.equal(await page.locator('[data-device-confirm]').count(),0);
await page.locator('[data-scan-command="close"]').click();
assert.deepEqual(errors,[]);
await page.close();await browser.close();
console.log("REVIEWED_SCAN_PASS: selected CU; one complete-board confirmation; positioned SPD; cloud mock; local OCR fallback; reopen; printed PDFs; spares");
