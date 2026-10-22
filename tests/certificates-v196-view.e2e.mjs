import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';

const base=process.env.CERT_URL||'http://127.0.0.1:4173/certificates/';
const store='sperin-certificates-data-v1';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1000,height:870},acceptDownloads:true});
const errs=[];
page.on('pageerror',e=>errs.push(e.message));
const saved=async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').certificates||[],store);
const home=async()=>page.locator('[data-action="home"]').first().click();
const choose=async(mode)=>{await page.locator('.cv-opening').waitFor();await page.locator('[data-action="choose-entry"][data-mode="'+mode+'"]').click();};
const start=async(type,mode='certificate')=>{
 await page.locator('[data-action="open-new"]').click();
 await page.locator('[data-action="new"][data-type="'+type+'"]').click();
 await choose(mode);
};
async function pdfAndCheck(expected,filename){
 const event=page.waitForEvent('download',{timeout:25000});
 await page.locator('[data-action="pdf"]').first().click();
 const download=await event;
 await download.saveAs(filename);
 assert(existsSync(filename),'Missing generated PDF');
 try{
   const info=execFileSync('pdfinfo',[filename],{encoding:'utf8'});
   const n=Number((info.match(/^Pages:\s+(\d+)/m)||[])[1]);
   assert(n>0,'No PDF pages');
   const dimension=execFileSync('pdfinfo',['-f','1','-l',String(n),filename],{encoding:'utf8'});
   const pageBoxes=[...dimension.matchAll(/^Page\s+\d+\s+size:\s+([\d.]+)\s+x\s+([\d.]+)/gm)];
   assert.equal(pageBoxes.length,n,'Uninspectable PDF orientation');
   for(const [_,w,h] of pageBoxes){
     assert(expected==='landscape'?Number(w)>Number(h):Number(h)>Number(w),
       'Wrong PDF page orientation: '+w+'x'+h+' expected '+expected);
   }
 }catch(e){if(e.code==='ENOENT')console.log('pdfinfo not available; PDF orientation test deferred to PDF CI');else throw e;}
 const modal=page.locator('[data-action="pdf-dismiss"]');
 if(await modal.count())await modal.click();
}
try{
 await page.goto(base);
 await start('eic');
 assert.equal(await page.locator('.cv-shell[data-cv-orientation="landscape"]').count(),1);
 assert(await page.locator('.cv-paper.cv-landscape').count()===1);
 assert.equal(await page.locator('.cv-viewport').evaluate(el=>el.scrollLeft),0);
 const first=page.locator('[data-cv-scope="field"][data-cv-key="clientName"]').first();
 // EIC fields are spread across certificate pages. Use first available field.
 const firstControl=page.locator('.cv-paper [data-cv-scope="field"]').first();
 const key=await firstControl.getAttribute('data-cv-key');
 await firstControl.fill('Certificate View QA');
 await firstControl.dispatchEvent('change');
 const original=(await saved())[0];
 assert.equal(original.fields[key],'Certificate View QA','CV edits must autosave to the existing data model');
 await page.locator('[data-action="cv-pages"]').click();
 assert(await page.locator('.cv-thumbnail').count()>3,'Page gallery missing');
 await page.locator('.cv-thumbnail').nth(1).click();
 assert.equal(await page.locator('.cv-viewport').evaluate(el=>el.scrollLeft),0);
 await page.locator('[data-action="cv-zoom-in"]').click();
 assert(await page.locator('[data-cv-zoom-label]').innerText()!=='100%','Zoom did not change');
 await page.locator('[data-action="cv-fit"]').click();
 assert((await page.locator('.cv-paper-wrap').evaluate(el=>el.clientWidth))<1122,'Fit Page did not scale');
 await page.locator('[data-action="cv-page-prev"]').click();
 await page.locator('[data-action="cv-next-empty"]').click();
 await page.locator('[data-action="switch-entry"]').click();
 assert.equal(await page.locator('.cv-shell').count(),0,'Quick Entry switch failed');
 assert.equal((await saved())[0].fields[key],'Certificate View QA');
 await page.locator('[data-action="switch-entry"]').click();
 assert(await page.locator('.cv-paper').count()===1,'Switching back lost CV');
 await pdfAndCheck('landscape','/tmp/sperin-v196-eic.pdf');

 // Return to library and assert the mandated opening choice appears for existing records.
 await home();
 await page.locator('[data-action="open-library"]').click();
 await page.locator('.saved-cert-row[data-action="edit"]').first().click();
 await choose('quick');
 assert.equal(await page.locator('.cv-shell').count(),0);
 await home();

 // EICR was previously mixed portrait/landscape: all PDF pages must now be landscape.
 await start('eicr');
 assert.equal(await page.locator('.cv-paper.cv-landscape').count(),1);
 await pdfAndCheck('landscape','/tmp/sperin-v196-eicr.pdf');
 await home();

 // Smoke certificate MUST stay portrait on screen AND in issued PDF.
 await start('smoke');
 assert.equal(await page.locator('.cv-paper.cv-portrait').count(),1);
 await pdfAndCheck('portrait','/tmp/sperin-v196-smoke.pdf');
 await home();

 // Quick Entry still available on a NEW certificate, including all existing functionality.
 await start('minor','quick');
 assert.equal(await page.locator('.cv-shell').count(),0);
 assert(await page.locator('.editor-dock').count()===1);
 await page.locator('[data-action="switch-entry"]').click();
 assert.equal(await page.locator('.cv-paper.cv-portrait').count(),1);
 assert.equal(await page.locator('[data-action="cv-page-next"]').count(),1);
 const field=page.locator('.cv-paper [data-cv-scope="field"][data-cv-key="clientName"]');
 if(await field.count()){
   await field.fill('Client v196 smoke test');
   await field.dispatchEvent('change');
   assert.equal((await saved())[0].fields.clientName,'Client v196 smoke test');
 }
 assert.deepEqual(errs,[],errs.join('; '));
 console.log('V196_DUAL_VIEW_CHOOSER_LANDSCAPE_EIC_EICR_PORTRAIT_SMOKE_PDF_AUTOSAVE_SWITCH_ZOOM_PAGES_PASS');
}finally{await browser.close();}
