import assert from "node:assert/strict";
import {chromium} from "playwright";
import fs from "node:fs/promises";

const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const page=await browser.newPage({acceptDownloads:true,viewport:{width:420,height:950}});
const base=process.env.CERT_BASE_URL||"http://127.0.0.1:4173/certificates/";
await page.goto(base,{waitUntil:"domcontentloaded"});
await page.locator('[data-action="open-new"]').click();
await page.waitForSelector(".cert-launch");
assert.equal(await page.locator(".cert-launch").count(),9,"Nine certificate types available");
const types=["pat","ev","solar","commercialFire"];
for(const type of types){
  if(!(await page.locator(".cert-launch").count())) await page.locator('[data-action="open-new"]').click();
  await page.locator('.cert-launch[data-type="'+type+'"]').click();
  await page.locator("details").evaluateAll(items=>items.forEach(el=>el.open=true));
  const input=page.locator('[data-field="clientName"]').first();
  assert(await input.count()>0,type+" client field missing");
  await input.fill("Specialist QA "+type);
  await input.dispatchEvent("input");
  const proofFields={
    pat:"organisationName",ev:"rcdDcDetails",
    solar:"arrayLayout",commercialFire:"causeEffect"
  };
  const proof=page.locator('[data-field="'+proofFields[type]+'"]').first();
  assert(await proof.count()>0,type+" specialist audit field absent from form");
  await proof.fill("SPECIALIST QA FIELD "+type.toUpperCase());
  await proof.dispatchEvent("input");

  const [download]=await Promise.all([
    page.waitForEvent("download",{timeout:16000}),
    page.locator('[data-action="pdf"]').first().click()
  ]);
  assert(download.suggestedFilename().endsWith(".pdf"),type+" PDF missing");
  const target="/tmp/sperin-specialist-"+type+".pdf";
  await download.saveAs(target);
  const buf=await fs.readFile(target);
  assert(buf.subarray(0,5).toString()==="%PDF-",type+" invalid PDF header");
  assert(buf.length>2000,type+" empty PDF");
  console.log("SPECIALIST_CERT_PDF_PASS",type,buf.length);
  await page.locator('[data-action="home"]').first().click();
}
await page.locator('[data-action="open-new"]').click();
await page.locator('.cert-launch[data-type="eicr"]').click();
assert(await page.locator('[data-action="ai-eicr"]').count()>0,"AI EICR review missing");
assert(await page.locator('[data-action="instrument-import"]').count()>0,"EICR tester file import missing");
await page.locator('[data-action="home"]').first().click();
await page.locator('[data-action="open-new"]').click();
await page.locator('[data-action="import-ai"]').first().click();
assert(await page.locator('[data-ai-consent]').count()>0,"PDF import consent missing");
assert.equal(await page.locator('[data-ai-select]').count(),0,"Never create preapproved legacy imported values");
await page.locator('[data-ai-action="close"]').click();
await page.locator('#speed-nav [data-speed="more"]').click();
await page.locator('[data-tool="workspace"]').click();
assert(await page.locator('[data-sw-email]').count()>0,"Team sign-in missing");
assert(await page.locator('[data-sw-consent]').count()===0,"Cloud uploads must be impossible before sign-in");
await page.locator('[data-sw="close"]').click();
const parsed=await page.evaluate(()=>window.SperinInstrumentImport.csvRows('Circuit,Board,Zs\r\n1,DB1,0.23\r\n"2","DB1","0.45"'));
assert.deepEqual(parsed,[["Circuit","Board","Zs"],["1","DB1","0.23"],["2","DB1","0.45"]]);
console.log("SPECIALIST_WORKFLOWS_AND_CONSENT_PASS");
await browser.close();
