import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const url='http://127.0.0.1:4173/certificates/';
const key='sperin-certificates-data-v1';
const types=['eic','eicr','minor','emergency','smoke','pat','ev','solar','commercialFire'];
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
try {
 const source=await browser.newPage({acceptDownloads:true});
 await source.goto(url);
 await source.locator('[data-action="open-new"]').click();
 await source.locator('[data-action="new"][data-type="eic"]').click();
 await source.locator('[data-action="choose-entry"][data-mode="quick"]').click();
 const fixture=await source.evaluate(async({key,types,photo})=>{
  const base=JSON.parse(localStorage.getItem(key)).certificates[0];
  const certificates=types.map(type=>({...structuredClone(base),id:crypto.randomUUID(),type,
    fields:{...base.fields,clientName:'BACKUP '+type,clientAddress:'1 Test Road',testerSerial:'SERIAL-'+type,signature:'Signature '+type},
    tables:{...base.tables,circuits:[{id:'circuit-'+type,boardRef:'DB1',circuitNo:'1',description:'Circuit '+type}],tests:[{boardRef:'DB1',circuitNo:'1',zs:'0.43',r1r2:'0.21',r2only:'0.18',unknownLegacyReading:'KEEP'}]},unknownLegacy:{nested:['KEEP',type]}}));
  localStorage.setItem(key,JSON.stringify({certificates}));
  const id=crypto.randomUUID(),job={id:crypto.randomUUID(),assetId:crypto.randomUUID(),siteName:'Photo job',certIds:certificates.map(c=>c.id),evidence:[{id,label:'Original evidence'}],reminders:[]};
  window.SperinJobCentre.replaceMetadata([job]);
  await window.SperinJobCentre.restorePhotos({[id]:photo});
  const plans=[{id:'plan',name:'Retained plan',custom:'KEEP'}],templates=[{id:'sheet',name:'Retained sheet',custom:'KEEP'}];
  localStorage.setItem('sperin-certificates-site-sheets-v1',JSON.stringify(plans));
  localStorage.setItem('sperin-certificates-site-sheet-templates-v1',JSON.stringify(templates));
  return {certificates,job,plans,templates};
 },{key,types,photo});
 await source.reload();
 await source.locator('[data-action="home"]').first().click();
 await source.locator('[data-action="settings"]').first().click();
 const downloading=source.waitForEvent('download');
 await source.locator('[data-action="share-backup"]').click();
 const file=await downloading;await file.saveAs('/tmp/complete-backup.json');
 const content=await readFile('/tmp/complete-backup.json','utf8'),exported=JSON.parse(content);
 assert.equal(exported.backupSchema,2);assert.equal(exported.jobPhotos[fixture.job.evidence[0].id],photo);
 const dest=await browser.newPage();dest.on('dialog',d=>d.accept());await dest.goto(url);
 await dest.evaluate(content=>window.sperinRestoreBackup(content),content);
 await dest.reload();
 const actual=await dest.evaluate(async key=>({data:JSON.parse(localStorage.getItem(key)),jobs:window.SperinJobCentre.backup(),photos:await window.SperinJobCentre.exportPhotos(window.SperinJobCentre.backup()),plans:JSON.parse(localStorage.getItem('sperin-certificates-site-sheets-v1')),templates:JSON.parse(localStorage.getItem('sperin-certificates-site-sheet-templates-v1'))}),key);
 assert.equal(actual.data.certificates.length,types.length);
 for(const expected of fixture.certificates){
  const c=actual.data.certificates.find(c=>c.id===expected.id);assert(c);
  assert.deepEqual(c.unknownLegacy,expected.unknownLegacy);
  for(const field of ['clientName','clientAddress','testerSerial','signature'])assert.equal(c.fields[field],expected.fields[field]);
  for(const field of ['zs','r1r2','r2only','unknownLegacyReading'])assert.equal(c.tables.tests[0][field],expected.tables.tests[0][field]);
 }
 assert.deepEqual(actual.jobs,[fixture.job]);assert.deepEqual(actual.photos,exported.jobPhotos);
 assert.deepEqual(actual.plans,fixture.plans);assert.deepEqual(actual.templates,fixture.templates);
 // Invalid complete backup must not alter saved state.
 const bad=structuredClone(exported);bad.jobPhotos={};
 await dest.evaluate(data=>window.sperinRestoreBackup(JSON.stringify(data)),bad);
 assert.deepEqual(await dest.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),actual.data);
 // Undo restores the clean destination including an empty job list.
 await dest.locator('[data-action="settings"]').first().click();
 await dest.locator('[data-action="undo-restore"]').click();
 await dest.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).certificates.length===0,key);
 assert.deepEqual(await dest.evaluate(()=>window.SperinJobCentre.backup()),[]);
 console.log('COMPLETE_BACKUP_NINE_TYPES_PHOTO_BYTES_SITE_PLANS_RELOAD_INVALID_IMPORT_UNDO_PASS');
}finally{await browser.close();}
