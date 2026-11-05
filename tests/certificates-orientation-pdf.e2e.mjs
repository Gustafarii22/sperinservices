import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:851,height:393}});
page.on('console',m=>{if(m.type()==='error')console.log('BROWSER_ERROR',m.text());});
page.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url(),r.failure()));
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__orientation=[];window.Android={setCertificateOrientation:value=>window.__orientation.push(value)};});
const menu=async action=>{await page.locator('.cv-menu>summary').click();await page.locator('.cv-menu-panel [data-action="'+action+'"]').click();};
const orientation=()=>page.evaluate(()=>window.__orientation.at(-1));
const start=async()=>{
 await page.locator('[data-action="open-new"]').click();
 await page.locator('[data-action="new"][data-type="eic"]').click();
 await page.locator('[data-action="choose-entry"][data-mode="certificate"]').click();
 await page.locator('.cv-pdf-canvas[data-ready="true"]').waitFor();
};
try{
 await page.goto(process.env.CERT_URL||'http://127.0.0.1:4173/certificates/');
 await start();assert.equal(await orientation(),'landscape');
 for(const size of [{width:851,height:393},{width:393,height:851}]){
  await page.setViewportSize(size);
  await menu('cv-fit');
  const box=await page.locator('.cv-paper').boundingBox();
  assert(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,'Full page must fit usable viewport');
 }
 const input=page.locator('[data-cv-key="clientName"]');await input.fill('Portrait landscape preserved');await input.dispatchEvent('change');
 await page.locator('.cv-pdf-canvas[data-ready="true"]').waitFor();
 await menu('open-library');assert.equal(await orientation(),'unspecified');
 await page.locator('.saved-cert-row[data-action="edit"]').first().click();
 await page.locator('[data-action="choose-entry"][data-mode="certificate"]').click();
 assert.equal(await input.inputValue(),'Portrait landscape preserved');
 await menu('switch-entry');assert.equal(await orientation(),'unspecified');
 await page.locator('.editor-dock [data-action="switch-entry"]').click();
 await menu('open-new');assert.equal(await orientation(),'unspecified');
 await page.locator('[data-action="home"]').first().click();
 await start();await menu('home');assert.equal(await orientation(),'unspecified');
 assert.deepEqual(errors,[]);
 console.log('ORIENTATION_EXACT_PDF_EDIT_REOPEN_PASS');
}finally{await browser.close();}
