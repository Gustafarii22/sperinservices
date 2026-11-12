import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:393,height:852}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const type of ['eic','eicr','minor','emergency','smoke','pat','ev','solar','commercialFire']){
  await page.goto(process.env.CERT_URL||'http://127.0.0.1:4173/certificates/');
  if(await page.locator('[data-action="home"]').count())await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-action="open-new"]').click();
  await page.locator('[data-action="new"][data-type="'+type+'"]').click();
  await page.locator('[data-action="choose-entry"][data-mode="quick"]').click();
  const input=page.locator('.section-page-content input[data-field]').first();
  const key=await input.getAttribute('data-field');
  await input.fill('Saved section '+type);
  const links=page.locator('.section-pages button');const total=await links.count();
  assert(total>2);
  for(let i=1;i<total;i++){
   await links.nth(i).click();
   assert.equal(await page.locator('.section-page-content > .form-section').count(),1,type+' shows exactly one section');
   assert.equal(await page.locator('.section-pages [aria-current="step"]').getAttribute('data-section-index'),String(i));
   const detail=page.locator('.section-page-content > details');
   if(await detail.count())assert(await detail.evaluate(e=>e.open));
  }
  await links.first().click();
  assert.equal(await page.locator('[data-field="'+key+'"]').inputValue(),'Saved section '+type);
  await page.reload();
  assert.equal(await page.locator('[data-field="'+key+'"]').inputValue(),'Saved section '+type);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'No horizontal page overflow '+type);
  console.log('SECTION_PAGES_SAVE_RELOAD_PASS',type,total);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
