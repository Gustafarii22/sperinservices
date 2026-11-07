import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const source=await browser.newPage({acceptDownloads:true});await source.goto('http://127.0.0.1:4173/certificates/');
 await source.locator('[data-action="open-new"]').click();await source.locator('[data-action="new"][data-type="eicr"]').click();await source.locator('[data-action="choose-entry"][data-mode="quick"]').click();
 const issued=await source.evaluate(async()=>{
  const c=JSON.parse(localStorage.getItem('sperin-certificates-data-v1')).certificates[0];c.fields.clientName='Immutable issue QA';c.tables.tests=[{circuitNo:'1',zs:'0.',rcdTime:'39. 9',r1r2:'0.0000'}];
  const render=snapshot=>{const d=new window.jspdf.jsPDF();d.text(JSON.stringify(snapshot.tables.tests),10,20);return d;};
  const r1=await window.SperinIssuedRecords.issue(c,render);c.fields.clientName='Revised QA';const r2=await window.SperinIssuedRecords.issue(c,render);
  const corrupt=structuredClone(r1);corrupt.pdf+='x';let rejected=false;try{await window.SperinIssuedRecords.restore([corrupt]);}catch{rejected=true;}
  const state={certificates:[{...c,issueMetadata:{revision:r2.revision,issuedAt:r2.issuedAt},issuedContent:window.SperinIssuedRecords.content(r2.snapshot),status:'Complete'}]};localStorage.setItem('sperin-certificates-data-v1',JSON.stringify(state));return {r1,r2,rejected};
 });
 assert(issued.rejected);assert.equal(issued.r1.revision,1);assert.equal(issued.r2.revision,2);assert.equal(issued.r1.snapshot.tables.tests[0].rcdTime,'39. 9');
 await source.reload();await source.locator('[data-action="home"]').first().click();await source.locator('[data-action="settings"]').first().click();
 const downloading=source.waitForEvent('download');await source.locator('[data-action="share-backup"]').click();const download=await downloading;const path=await download.path();const {readFile}=await import('node:fs/promises');const backup=await readFile(path,'utf8');assert.equal(JSON.parse(backup).issuedReports.length,2);
 const dest=await browser.newPage();await dest.goto('http://127.0.0.1:4173/certificates/');await dest.evaluate(b=>window.sperinRestoreBackup(b),backup);await dest.reload();
 const records=await dest.evaluate(()=>window.SperinIssuedRecords.all());assert.deepEqual(records.sort((a,b)=>a.revision-b.revision),[issued.r1,issued.r2]);
 // Identical reimport is idempotent; conflicting issued bytes cannot overwrite originals.
 await dest.evaluate(b=>window.sperinRestoreBackup(b),backup);assert.equal((await dest.evaluate(()=>window.SperinIssuedRecords.all())).length,2);
 console.log('IMMUTABLE_ISSUE_REVISIONS_EXACT_PDF_HASH_PORTABLE_RESTORE_PASS');
}finally{await browser.close();}
