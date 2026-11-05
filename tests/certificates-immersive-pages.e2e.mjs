import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1340,height:660},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.CERT_URL||'http://127.0.0.1:4173/certificates/';
const menu=async action=>{
  await page.locator('.cv-menu>summary').click();
  await page.locator('.cv-menu-panel [data-action="'+action+'"]').click();
};
try {
  await page.goto(base);
  await page.locator('[data-action="open-new"]').click();
  await page.locator('[data-action="new"][data-type="eic"]').click();
  await page.locator('[data-action="choose-entry"][data-mode="certificate"]').click();
  assert.equal(await page.locator('.cv-shell.cv-immersive').count(),1,'Immersive certificate mode missing');
  assert.equal(await page.locator('.editor-dock').count(),0,'Bottom editing dock should not cover page');
  assert.equal(await page.locator('.topbar').count(),0,'Main topbar should not cover page');
  assert.equal(await page.locator('.cv-menu>summary').count(),1,'Floating menu missing');
  const dimensions=await page.locator('.cv-viewport').evaluate(port=>{
    const page=port.querySelector('.cv-paper').getBoundingClientRect();
    return {port:port.getBoundingClientRect().toJSON(),page:page.toJSON(),
      visibleHeight:port.clientHeight,contentsHeight:port.querySelector('.cv-sheet-content').scrollHeight,
      contentAvailable:port.querySelector('.cv-sheet-content').clientHeight};
  });
  assert(dimensions.visibleHeight>=500,'Certificate viewport too short: '+dimensions.visibleHeight);
  assert(dimensions.page.width<=dimensions.port.width+1,'PDF-sized page cut off horizontally on initial view');
  assert(dimensions.page.height<=dimensions.port.height+1,'PDF-sized page cut off vertically on initial view');

  const first=page.locator('.cv-paper [data-cv-scope="field"]').first();
  const name=await first.getAttribute('data-cv-key');
  await first.fill('Certificate page layout check');
  await first.dispatchEvent('change');

  const editorTotal=Number((await page.locator('.cv-page-count').innerText()).match(/of (\d+)/)[1]);
  assert(editorTotal>=4&&editorTotal<13,'PDF editor still has artificial pages: '+editorTotal);

  await menu('cv-pages');
  assert.equal(await page.locator('.cv-thumbnail').count(),editorTotal);
  const checklist=page.locator('.cv-page-grid .cv-thumbnail').filter({hasText:/Inspection, comments/});
  if(await checklist.count()) {
    await checklist.click();
    assert((await page.locator('.cv-inspection-line').count())>=8,'Inspection checklist must share one compact page');
  } else {
    await page.locator('.cv-thumbnail').nth(Math.min(2,editorTotal-1)).click();
  }
  await menu('cv-zoom-in');
  const zoomed=await page.locator('.cv-paper').evaluate(el=>el.getBoundingClientRect().width);
  await menu('cv-fit');
  const fitted=await page.locator('.cv-paper').evaluate(el=>el.getBoundingClientRect().width);
  assert(zoomed>fitted,'Zoom in and fit did not alter page scale');

  const download=page.waitForEvent('download',{timeout:30000});
  await menu('pdf');
  const file=await download;
  const path='/tmp/sperin-immersive-eic.pdf';
  await file.saveAs(path);
  const info=execFileSync('pdfinfo',[path],{encoding:'utf8'});
  const pdfTotal=Number((info.match(/^Pages:\s+(\d+)/m)||[])[1]);
  assert.equal(editorTotal,pdfTotal,'Editor page count must match generated PDF count');
  assert.equal(errors.length,0,errors.join('; '));
  console.log('IMMERSIVE_PDF_PAGE_COUNT_FIT_MENU_EDIT_PRESERVATION_PASS',editorTotal);
}finally{await browser.close();}
