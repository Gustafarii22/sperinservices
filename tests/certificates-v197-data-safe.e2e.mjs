import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const key='sperin-certificates-data-v1';
const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).certificates[0],key);
const openSection=async text=>{
 const el=page.locator('details').filter({has:page.locator(':scope > summary').filter({hasText:text})}).first();
 if(!await el.evaluate(e=>e.open))await el.locator(':scope > summary').click();
 await page.waitForTimeout(120);return el;
};
try{
 await page.goto(process.env.CERT_URL||'http://127.0.0.1:4173/certificates/');
 await page.locator('[data-action="open-new"]').click();await page.locator('[data-action="new"][data-type="eic"]').click();
 await page.locator('[data-action="choose-entry"][data-mode="quick"]').click();
 const fixture=await page.evaluate(k=>{
  const state=JSON.parse(localStorage.getItem(k)),c=state.certificates[0];
  Object.assign(c.fields,{clientName:'Existing customer',nominalVoltage:'230',supplyDeviceBs:'BS EN 60898-1',supplyDeviceType:'C',testerMake:'Megger',testerModel:'MFT-X1',testerSerial:'OLD-123',testerMft:true,instrumentSelectionVersion:0});
  c.tables.boards[0].spdBs='Existing SPD standard';
  c.tables.circuits=Array.from({length:4},(_,i)=>({id:'existing-'+i,boardRef:'DB1',circuitNo:String(i+1),description:'Existing circuit '+(i+1),deviceKind:'MCB',ocpdBs:'BS EN 60898-1',ocpdType:'B',ocpdRating:'32',installMethod:'Existing containment',testButtonVisual:'Visible'}));
  c.tables.tests=c.tables.circuits.map((r,i)=>({boardRef:r.boardRef,circuitNo:r.circuitNo,r1:'0.1',rn:'0.2',r2:'0.3',r1r2:'0.4',zs:'0.'+(i+5),irLE:'299',remarks:'Keep reading '+i,...(i===0?{r2only:'0.8'}:{})}));
  return JSON.stringify(state);
 },key);
 await page.addInitScript(({key,fixture})=>{if(!sessionStorage.getItem('fixture-v197')){localStorage.setItem(key,fixture);sessionStorage.setItem('fixture-v197','yes');}},{key,fixture});
 await page.reload();
 if(await page.locator('.cv-opening').count())await page.locator('[data-action="choose-entry"][data-mode="quick"]').click();
 await openSection('F · Supply');
 assert.equal(await page.locator('[data-field="supplyDeviceBs"]').inputValue(),'BS EN 60898-1 Type C');
 assert.equal(await page.locator('[data-field="supplyDeviceType"]').count(),0);
 await page.locator('[data-field="supplyDeviceBs"]').fill('BS EN 60898-1 Type D');await page.locator('[data-field="supplyDeviceBs"]').dispatchEvent('change');
 assert.equal((await read()).fields.supplyDeviceType,'D');
 const g=await openSection('G · Installation');
 assert.equal(await page.locator('[data-field="supplyDeviceBs"]').isVisible(),false);
 await page.locator('[data-field="earthElectrodeType"]').selectOption('N/A');
 for(const f of ['earthElectrodeLocation','earthElectrodeResistance']){await page.locator('[data-field="'+f+'"]').fill('N/A');await page.locator('[data-field="'+f+'"]').dispatchEvent('change');}
 const h=await openSection('H · Installation');assert.equal(await g.evaluate(e=>e.open),false);
 assert((await h.boundingBox()).y>=0 && (await h.boundingBox()).y<200,'New section must start at top');
 await openSection('Test instrument');
 assert.equal(await page.locator('[data-field="testerSerial"]').inputValue(),'OLD-123');
 assert.equal(await page.locator('[data-field="instrumentContinuity"]').count(),0);
 await page.locator('[data-field="testerLowOhm"]').check();await page.locator('[data-field="instrumentContinuity"]').fill('CONT-456');await page.locator('[data-field="instrumentContinuity"]').dispatchEvent('change');
 await page.locator('[data-field="testerLowOhm"]').uncheck();assert.equal((await read()).fields.instrumentContinuity,'CONT-456');
 await openSection('J · Distribution');await openSection('DB1 circuits');
 const card=i=>page.locator('[data-inline-index="'+i+'"]');
 await card(1).locator(':scope > summary').click();await page.waitForTimeout(120);
 assert.equal(await card(1).locator('[data-col="installMethod"],[data-col="testButtonVisual"],[data-col="r2only"]').count(),0);
 assert.equal(await card(1).locator('[data-col="maxZs"]').inputValue(),'1.37');
 for(const width of [320,360,390,412]){
  await page.setViewportSize({width,height:844});
  const overflow=await card(1).evaluate(e=>[...e.querySelectorAll('input,select,textarea,.inline-circuit-actions button')].filter(x=>x.getBoundingClientRect().width).map(x=>({label:x.textContent||x.getAttribute('data-col'),r:x.getBoundingClientRect().right})).filter(x=>x.r>innerWidth+1));
  assert.deepEqual(overflow,[],'Controls outside screen at '+width);
 }
 await page.setViewportSize({width:390,height:844});
 await card(1).locator('[data-action="template-save-circuit"]').click();
 await page.locator('[data-template-name]').fill('All readings');await page.locator('[data-action="template-save-choice"][data-results="yes"]').click();
 await card(1).locator('[data-action="template-save-circuit"]').click();await page.locator('[data-template-name]').fill('Design only');await page.locator('[data-action="template-save-choice"][data-results="no"]').click();
 const templates=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-circuit-templates-v1')));
 assert.equal(templates[0].tests.irLE,'299');assert.equal(templates[1].tests,undefined);
 const before=(await read());
 await card(1).locator('[data-action="circuit-duplicate"]').click();
 let after=await read();assert.equal(after.tables.circuits.length,5);
 const strip=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!['id','circuitNo'].includes(k)));
 assert.deepEqual(strip(after.tables.circuits[4]),strip(before.tables.circuits[1]));assert.deepEqual(strip(after.tables.tests[4]),strip(before.tables.tests[1]));
 await page.locator('[data-action="circuit-next"]').click();await page.locator('[data-action="circuit-complete"]').click();await page.waitForTimeout(150);
 assert.equal(await card(4).evaluate(e=>e.open),false);assert((await card(4).boundingBox()).y>=0 && (await card(4).boundingBox()).y<650,'Done must return to same circuit');
 await card(4).locator(':scope > summary [data-action="circuit-move-up"]').click();
 after=await read();assert.equal(after.tables.tests[3].remarks,'Keep reading 1');
 await page.locator('.board-circuit-tools [data-action="template-open"]').click();await page.locator('.template-row').filter({hasText:'All readings'}).locator('[data-action="template-use"]').click();
 after=await read();assert.equal(after.tables.tests.at(-1).irLE,'299');
 await page.locator('[data-action="circuit-next"]').click();await page.locator('[data-action="circuit-complete"]').click();
 await card(0).locator(':scope > summary').click();assert.equal(await card(0).locator('[data-col="r2only"]').inputValue(),'0.8');
 const persisted=await read();await page.reload();assert.deepEqual((await read()).tables.tests,persisted.tables.tests);
 assert.equal((await read()).fields.clientName,'Existing customer');assert.equal((await read()).tables.boards[0].spdBs,'Existing SPD standard');
 mkdirSync('certificate-android/qa-output',{recursive:true});await page.screenshot({path:'certificate-android/qa-output/v197-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('V197_DATA_PRESERVATION_DUPLICATE_TEMPLATES_SCROLL_MOBILE_INSTRUMENTS_PASS');
}finally{await browser.close();}
