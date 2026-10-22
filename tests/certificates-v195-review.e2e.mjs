async function autoChooseQuickEntry(page){
  await page.addInitScript(()=>{
    const choose=()=>document.querySelector('.cv-opening [data-action="choose-entry"][data-mode="quick"]')?.click();
    new MutationObserver(choose).observe(document,{childList:true,subtree:true});
    document.addEventListener('DOMContentLoaded',choose,{once:true});
  });
}
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({args:['--no-sandbox']});
const base=process.env.CERT_BASE_URL||'http://127.0.0.1:4173/certificates/';
const errors=[];let context=await browser.newContext({viewport:{width:412,height:915},acceptDownloads:true});let p=await context.newPage();await autoChooseQuickEntry(p);p.on('pageerror',e=>errors.push(e.message));
await p.goto(base);await p.locator('[data-action="open-tools"]').click();assert(await p.locator('[data-tool="backup"]').isVisible());await p.locator('[data-speed-close]').click();
await p.locator('[data-action="open-new"]').click();await p.locator('[data-type="eic"]').click();
assert.equal(await p.locator('[data-action="edit-undo"]').count(),1);
await p.locator('[data-field="clientName"]').fill('UI test');await p.locator('[data-field="clientName"]').blur();await p.locator('[data-action="edit-undo"]').click();assert.equal(await p.locator('[data-field="clientName"]').inputValue(),'');await p.locator('[data-action="edit-redo"]').click();assert.equal(await p.locator('[data-field="clientName"]').inputValue(),'UI test');
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const dock=await p.locator('.editor-dock').boundingBox();assert(dock.y>0&&dock.y+dock.height<915);
const dl=p.waitForEvent('download');await p.locator('.editor-dock [data-action="pdf"]').click();await dl;await p.locator('[data-action="pdf-dismiss"]').click();
await p.locator('[data-action="complete-pdf"]').click();assert(await p.locator('[data-action="review-finish"]').isDisabled());assert((await p.locator('.review-items').innerText()).includes('address is missing'));
await p.locator('[data-action="review-edit"]').first().click();await p.locator('[data-field="installationAddress"]').fill('1 Test Road');await p.locator('[data-field="installationAddress"]').blur();
await p.locator('[data-action="complete-pdf"]').click();assert.equal(await p.locator('[data-action="review-finish"]').isDisabled(),false);await p.locator('[data-review-confirm]').check();
const pdf=p.waitForEvent('download');await p.locator('[data-action="review-finish"]').click();await pdf;
let state=await p.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')));assert.equal(state.certificates[0].status,'Complete');assert(state.certificates[0].reviewRecord);await context.close();
async function seed(c){context=await browser.newContext({viewport:{width:360,height:800}});await context.addInitScript(s=>localStorage.setItem('sperin-certificates-data-v1',JSON.stringify(s)),{...state,certificates:[c]});p=await context.newPage();await autoChooseQuickEntry(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('[data-action="open-library"]').click();await p.locator('[data-action="edit"]').first().click();}
let c=structuredClone(state.certificates[0]);c.status='Draft';c.voiceMeta={later:{'field:clientName':true,'circuit:tests:0:zs':true},completed:{},dismissed:{}};
await seed(c);await p.locator('[data-action="complete-pdf"]').click();assert.equal(await p.locator('[data-action="review-na"]').count(),2);assert(await p.locator('[data-action="review-finish"]').isDisabled());p.on('dialog',d=>d.accept('Not applicable to the agreed scope'));
await p.locator('[data-action="review-na"]').first().click();await p.locator('[data-action="review-na"]').first().click();assert.equal(await p.locator('[data-action="review-finish"]').isDisabled(),false);const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')));assert.equal(Object.keys(stored.certificates[0].reviewNotApplicable).length,2);await context.close();
c=structuredClone(state.certificates[0]);c.type='eicr';c.status='Draft';c.fields.overallAssessment='Satisfactory';c.fields.extentInspected='Whole installation';c.tables.observations=[{code:'C2',observation:'Defect'}];await seed(c);await p.locator('[data-action="complete-pdf"]').click();assert((await p.locator('.review-items').innerText()).includes('conflicts with findings'));assert(await p.locator('[data-action="review-finish"]').isDisabled());await context.close();
c=structuredClone(state.certificates[0]);c.type='minor';c.fields.irVoltage='500';c.fields.irLE='0.2';c.fields.polarity='No';await seed(c);await p.locator('[data-action="certificate-review"]').click();const review=await p.locator('.review-items').innerText();assert(review.includes('Insulation resistance'));assert(review.includes('Polarity test failed'));await context.close();
assert.deepEqual(errors,[]);await browser.close();console.log('V195_TOOLBAR_UNDO_REDO_PDF_REVIEW_DEFERRED_EICR_MINOR_PASS');
