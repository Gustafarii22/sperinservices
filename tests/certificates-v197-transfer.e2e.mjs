import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const base=process.env.CERT_URL||'http://127.0.0.1:4173/certificates/';
const key='sperin-certificates-data-v1';
const backupPath='/tmp/sperin-v197-portable-backup.json';
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(base);
  await page.locator('[data-action="open-new"]').click();
  await page.locator('[data-action="new"][data-type="eic"]').click();
  await page.locator('[data-action="choose-entry"][data-mode="quick"]').click();

  const seeded=await page.evaluate(storageKey=>{
    const data=JSON.parse(localStorage.getItem(storageKey));
    const cert=data.certificates[0];
    cert.fields.clientName='PORTABLE BACKUP CUSTOMER';
    cert.fields.testerSerial='MFT-X1-BACKUP-QA';
    cert.tables.circuits=[{id:'backup-circuit-1',boardRef:'DB1',circuitNo:'1',description:'Protected kitchen ring',ocpdBs:'BS EN 60898-1',ocpdType:'B',ocpdRating:'32'}];
    cert.tables.tests=[{boardRef:'DB1',circuitNo:'1',zs:'0.51',r1r2:'0.24',r2only:'0.18',remarks:'Do not lose these results'}];
    return JSON.stringify(data);
  },key);
  await page.addInitScript(({key,seeded})=>{
    if(!sessionStorage.getItem('portability-fixture')) {
      localStorage.setItem(key,seeded);
      sessionStorage.setItem('portability-fixture','yes');
    }
  },{key,seeded});
  await page.reload();
  if(await page.locator('.cv-opening').count())await page.locator('[data-action="choose-entry"][data-mode="quick"]').click();
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-action="settings"]').first().click();

  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:15000}),
    (async()=>{
      await page.locator('.profile-modal [data-action="backup"]').click();
      await page.locator('[data-action="recovery-confirm-next"]').click();
      await page.locator('[data-action="recovery-confirm-do"]').click();
    })()
  ]);
  assert(download.suggestedFilename().endsWith('.json'));
  await download.saveAs(backupPath);
  const content=await readFile(backupPath,'utf8');
  const exported=JSON.parse(content);
  assert.equal(exported.certificates.length,1);
  assert.equal(exported.certificates[0].fields.clientName,'PORTABLE BACKUP CUSTOMER');
  assert.equal(exported.certificates[0].tables.tests[0].zs,'0.51');
  assert.equal(exported.certificates[0].tables.tests[0].r2only,'0.18');

  // Fresh independent browser profile models the separately installed replacement.
  const destination=await browser.newPage({viewport:{width:390,height:844}});
  destination.on('pageerror',e=>errors.push(e.message));
  try {
    await destination.goto(base);
    assert.equal(await destination.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"certificates":[]}').certificates.length,key),0);
    await destination.locator('[data-action="settings"]').first().click();
    await destination.locator('[data-action="import-backup"]').click();
    await destination.locator('[data-action="recovery-confirm-next"]').click();
    const chooseFile=destination.waitForEvent('filechooser',{timeout:15000});
    await destination.locator('[data-action="recovery-confirm-do"]').click();
    await (await chooseFile).setFiles({name:download.suggestedFilename(),mimeType:'application/json',buffer:Buffer.from(content)});
    await destination.waitForFunction(k=>{
      const saved=JSON.parse(localStorage.getItem(k)||'{"certificates":[]}');
      return saved.certificates.some(c=>c.fields?.clientName==='PORTABLE BACKUP CUSTOMER');
    },key,{timeout:15000});
    const migrated=await destination.evaluate(k=>JSON.parse(localStorage.getItem(k)).certificates[0],key);
    assert.equal(migrated.tables.circuits.length,1);
    assert.equal(migrated.tables.circuits[0].description,'Protected kitchen ring');
    assert.equal(migrated.tables.tests[0].zs,'0.51');
    assert.equal(migrated.tables.tests[0].r1r2,'0.24');
    assert.equal(migrated.tables.tests[0].r2only,'0.18');
    assert.equal(migrated.fields.testerSerial,'MFT-X1-BACKUP-QA');
    await destination.reload();
    const stillSaved=await destination.evaluate(k=>JSON.parse(localStorage.getItem(k)).certificates[0],key);
    assert.equal(stillSaved.tables.tests[0].zs,'0.51');
  } finally {await destination.close();}
  assert.deepEqual(errors,[]);
  console.log('V197_JSON_BACKUP_EXPORT_IMPORT_FRESH_PROFILE_LEGACY_TEST_RESULTS_PERSIST_PASS');
} finally {await browser.close();}
