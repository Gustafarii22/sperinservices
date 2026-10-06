import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.CERT_BASE_URL || 'http://127.0.0.1:4173/certificates/';
const appSource = fs.readFileSync('public/certificates/app.js','utf8');
const javaSource = fs.readFileSync('certificate-android/app/src/main/java/uk/co/sperinservices/certificates/MainActivity.java','utf8');
const manifestSource = fs.readFileSync('certificate-android/app/src/main/AndroidManifest.xml','utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Static route map: every rendered action must have a click handler.
const actions=[...new Set([...appSource.matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]).filter(a=>!/[+'?]/.test(a)))];
const handlers=[...new Set([
  ...[...appSource.matchAll(/action === '([^']+)'/g)].map(m=>m[1]),
  ...[...appSource.matchAll(/action==='([^']+)'/g)].map(m=>m[1])
])];
const missingActions=actions.filter(a=>!handlers.includes(a));
const dynamicActions=['site-read-plan','site-scan-plan','sheet-read-start','sheet-read-stop'];
const missingDynamic=dynamicActions.filter(a=>!handlers.includes(a));
assert(missingActions.length===0,'Missing action handlers: '+missingActions.join(', '));
assert(missingDynamic.length===0,'Missing dynamic action handlers: '+missingDynamic.join(', '));
assert(!appSource.includes('data-action="circuit-copy"'),'Copy Details button must be removed');
assert(appSource.includes("orientation: 'landscape'"),'Certificate PDF must be landscape');
assert(appSource.includes('Installation inspection checklist'),'Detailed EIC inspection checklist missing');
assert(appSource.includes('Printable Site Worksheet'),'Printable Site Worksheet label missing');
assert(appSource.includes('Voice Fill'),'Voice Fill label missing');
assert(javaSource.includes('createPrintDocumentAdapter'),'Native Android print route missing');
assert(javaSource.includes('showFileNotification'),'PDF notification route missing');
assert(javaSource.includes('restoreLatestBackup'),'Automatic restore route missing');
assert(javaSource.includes('shareBackup'),'Backup sharing route missing');
assert(javaSource.includes('sperinHandleBack'),'Android back bridge missing');
assert(manifestSource.includes('POST_NOTIFICATIONS'),'Notification permission missing');
assert(manifestSource.includes('FileProvider'),'FileProvider missing');
assert(appSource.includes('Blank Site Sheets'),'Blank Site Sheets workflow missing');
assert(appSource.includes('Read Completed Site Sheet'),'Fixed-order site-sheet readback missing');
assert(appSource.includes('Scan Completed Sheets'),'Photo site-sheet workflow missing');
assert(appSource.includes('validationWarnings'),'Technical warning engine missing');
assert(appSource.includes('tneCpc'),'Twin & earth CPC derivation missing');
assert(javaSource.includes('TextRecognition.getClient'),'Bundled ML Kit text recognition missing');
assert(javaSource.includes('captureAndScanSheet'),'Native camera sheet scan missing');
assert(javaSource.includes('scanSheetImageBase64'),'Gallery/base64 sheet scan missing');
console.log('STATIC_ROUTE_NATIVE_PASS');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });

await context.addInitScript(() => {
  const cert = {
    id: 'legacy-eic-1',
    type: 'eic',
    number: 'SS-EIC-LEGACY-001',
    status: 'Draft',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    fields: {
      clientName: 'Jane Smith',
      clientAddress: '1 Test Road\nBirmingham',
      installationAddress: '1 Test Road\nBirmingham',
      issueDate: '2026-10-01',
      nominalVoltage: '230'
    },
    tables: {
      circuits: [
        { circuitNo:'1', description:'Lighting', ocpdBs:'BS EN 60898-1', ocpdType:'B', ocpdRating:'6' },
        { circuitNo:'2', description:'Sockets', ocpdBs:'BS EN 60898-1', ocpdType:'B', ocpdRating:'32' }
      ],
      tests: [{circuitNo:'1',zs:'1.11'},{circuitNo:'2',zs:'0.22'}],
      eicInspection: [
        {item:'1.0',description:'Legacy inspection row',outcome:'✓'}
      ]
    }
  };
  const settings={
    companyName:'Sperin Services',
    engineerName:'Gus Tester',
    engineerPosition:'Electrician / Inspector',
    address:'10 Business Road\nBirmingham',
    postcode:'B1 1AA',
    phone:'0121 000 0000',
    email:'test@example.com',
    registration:'',
    qualification:'C&G 2391 / 18th Edition',
    testerMake:'Megger',
    testerModel:'MFT-X1',
    testerSerial:'ABC123',
    postcodeApiKey:'ak_test'
  };
  localStorage.setItem('sperin-certificates-data-v1', JSON.stringify({ certificates: [cert] }));
  localStorage.setItem('sperin-certificates-settings-v1', JSON.stringify(settings));
});

const page = await context.newPage();
const errors = [];
const dialogs=[];
page.on('pageerror', err => errors.push(String(err)));
page.on('dialog', async d => { dialogs.push(d.message()); console.log('DIALOG:',d.message()); await d.dismiss(); });
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

await page.addInitScript(() => {
  const realFetch=window.fetch.bind(window);
  window.fetch=async (input,init)=>{
    const url=String(typeof input==='string'?input:input?.url||'');
    if(url.includes('api.ideal-postcodes.co.uk/v1/postcodes/')){
      window.__postcodeLookupHits=(window.__postcodeLookupHits||0)+1;
      return new Response(JSON.stringify({
        result:[
          {line_1:'1 Test Road',line_2:'Edgbaston',line_3:'',post_town:'Birmingham',county:'West Midlands',postcode:'B1 1AA'},
          {line_1:'2 Test Road',line_2:'Edgbaston',line_3:'',post_town:'Birmingham',county:'West Midlands',postcode:'B1 1AA'}
        ],
        code:2000,
        message:'Success'
      }),{status:200,headers:{'Content-Type':'application/json'}});
    }
    return realFetch(input,init);
  };
});


await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.saved-cert-row');

assert(await page.locator('.home-hero').count()===1,'Premium home hero missing');
assert((await page.locator('.home-hero h2').textContent()).includes('Professional electrical certification'),'Home heading unclear');
assert(await page.locator('.home-visual').count()===1,'Home visual treatment missing');
assert(await page.locator('.cert-launch').count()===5,'Certificate launch list incomplete');
assert(await page.locator('.workflow-card').count()===3,'Site field workflow must show blank sheets, voice readback and photo scan');
assert((await page.locator('.site-workflow').textContent()).includes('Paper, voice or camera'),'Site field workflow explanation missing');

const saved = page.locator('.saved-cert-row').first();
const savedText=await saved.textContent();
assert(savedText.includes('Jane Smith'),'Saved row must show customer name');
assert(savedText.includes('1 Test Road'),'Saved row must show address');
assert(savedText.includes('01/10/2026'),'Saved row must show date');

// Whole row opens the saved certificate.
await saved.locator('.saved-cert-copy').click();
await page.waitForSelector('.form-head');
assert((await page.locator('.form-title h2').textContent()).includes('Electrical Installation Certificate'),'Saved certificate did not open');
assert(await page.locator('.app-error').count()===0,'Legacy certificate hit render error');

// Voice/worksheet controls must explain themselves.
assert(await page.getByRole('button',{name:/Voice Fill/}).count()===1,'Voice Fill button missing');
assert(await page.getByRole('button',{name:/Printable Site Worksheet/}).count()===1,'Printable Site Worksheet button missing');
const explainer=await page.locator('.entry-tools-explainer').textContent();
assert(explainer.includes('Speak answers in field order'),'Voice Fill explanation missing');
assert(explainer.includes('paper-friendly question list') || explainer.includes('paper-friendly') || explainer.includes('take around site'),'Worksheet explanation missing');

// Detailed EIC inspection checklist must be present and legacy row preserved.
const inspection = page.locator('.form-section').filter({hasText:'Installation inspection checklist'});
assert(await inspection.count()===1,'EIC inspection checklist section missing');
const inspectionRows=inspection.locator('tbody tr');
assert(await inspectionRows.count()>=40,'EIC inspection checklist is not detailed enough');
assert((await inspection.textContent()).includes('Main earthing conductor'),'Earthing inspection checks missing');
assert((await inspection.textContent()).includes('RCD'),'RCD inspection checks missing');

// Postcode-first address lookup.
const postcode=page.locator('[data-field="installationPostcode"]');
assert(await postcode.count()===1,'Installation postcode field missing');
await postcode.fill('b11aa');
await page.locator('[data-action="postcode-find"][data-postcode-key="installationPostcode"]').click();
await page.waitForTimeout(700);
const lookupHit=await page.evaluate(()=>window.__postcodeLookupHits||0);
console.log('LOOKUP_HITS:',lookupHit);
console.log('LOOKUP_DIALOGS:',JSON.stringify(dialogs));
console.log('POSTCODE_MODAL_COUNT:',await page.locator('.postcode-backdrop').count());
console.log('POSTCODE_BUTTON_COUNT:',await page.locator('.postcode-result').count());
assert(lookupHit>0,'Postcode button did not issue an address lookup request');
assert(await page.locator('.postcode-result').count()>0,'Postcode request returned but address selector did not render');
await page.locator('.postcode-result').first().click();
assert((await page.locator('[data-field="installationAddress"]').inputValue()).includes('\n'),'Selected address is not formatted on separate lines');
assert((await page.locator('[data-field="installationPostcode"]').inputValue())==='B1 1AA','Postcode not formatted correctly');
console.log('POSTCODE_LOOKUP_PASS');

// Autosave typed/dropdown.
await page.locator('[data-field="clientName"]').fill('Jane Smith Updated');
await page.waitForTimeout(450);
let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
assert(stored.certificates?.[0]?.fields?.clientName==='Jane Smith Updated','Typed field did not autosave');
await page.locator('[data-field="nominalVoltage"]').selectOption('230/400');
await page.waitForTimeout(80);
stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
assert(stored.certificates?.[0]?.fields?.nominalVoltage==='230/400','Dropdown did not autosave');
console.log('AUTOSAVE_PASS');

// Circuit list: no copy-details, duplicate/delete present, reorder works.
const circuitList=page.locator('.circuit-list');
assert(await circuitList.count()===1,'Circuit schedule missing');
assert(await circuitList.locator('[data-action="circuit-copy"]').count()===0,'Copy Details still present');
assert(await circuitList.locator('[data-action="circuit-duplicate"]').count()>=1,'Duplicate circuit missing');
assert(await circuitList.locator('[data-action="circuit-delete"]').count()>=1,'Delete circuit missing');
assert(await circuitList.locator('[data-action="circuit-move-down"]').count()>=1,'Circuit move-down control missing');

const beforeOrder=await page.locator('.circuit-card .circuit-main').allTextContents();
assert(beforeOrder[0].includes('Lighting') && beforeOrder[1].includes('Sockets'),'Initial circuit order wrong');
await page.locator('[data-action="circuit-move-down"]').first().click();
await page.waitForTimeout(60);
const afterOrder=await page.locator('.circuit-card .circuit-main').allTextContents();
assert(afterOrder[0].includes('Sockets') && afterOrder[0].includes('Zs 0.22') && afterOrder[1].includes('Lighting') && afterOrder[1].includes('Zs 1.11'),'Circuit reorder failed or test rows were not kept with their circuits');

// Open reordered B32 circuit and verify max Zs, next/back save and return position.
await page.locator('.circuit-card').first().locator('[data-action="circuit-open"]').click();
await page.waitForSelector('[data-circuit-input="details"][data-col="ocpdRating"]');
await page.waitForTimeout(40);
const maxZs=await page.locator('[data-circuit-input="details"][data-col="maxZs"]').inputValue();
assert(maxZs==='1.37','B32 automatic max Zs should be 1.37 Ω, got '+maxZs);
await page.locator('[data-action="circuit-next"]').click();
assert((await page.locator('.eyebrow').first().textContent()).includes('2 of 2'),'Circuit Next failed');
stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
assert(Array.isArray(stored.certificates?.[0]?.tables?.circuits),'Circuit Next failed to save');
await page.locator('[data-action="circuit-prev"]').click();
assert((await page.locator('.eyebrow').first().textContent()).includes('1 of 2'),'Circuit Back failed');
await page.locator('[data-action="circuit-list"]').first().click();
await page.waitForSelector('.circuit-list');
await page.waitForTimeout(80);
const circuitTop=await page.locator('.circuit-list').evaluate(el=>el.getBoundingClientRect().top);
assert(circuitTop>=-10 && circuitTop<190,'Saving circuit should return to circuit schedule, top='+circuitTop);
console.log('CIRCUIT_FLOW_PASS');

// PDF must be a real landscape PDF.
const pdfDownloadPromise=page.waitForEvent('download');
await page.locator('[data-action="pdf"]').first().click();
const pdfDownload=await pdfDownloadPromise;
const pdfPath=await pdfDownload.path();
assert(pdfPath && fs.existsSync(pdfPath),'PDF file missing');
const pdfBytes=fs.readFileSync(pdfPath);
assert(pdfBytes.subarray(0,4).toString()==='%PDF','PDF signature invalid');
const pdfText=pdfBytes.toString('latin1');
const media=pdfText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(media && Number(media[1])>Number(media[2]),'PDF is not landscape');
console.log('LANDSCAPE_PDF_PASS');

// Printable worksheet must also download and be landscape.
const worksheetPromise=page.waitForEvent('download');
await page.getByRole('button',{name:/Printable Site Worksheet/}).click();
const worksheet=await worksheetPromise;
assert(worksheet.suggestedFilename().includes('Site-Worksheet'),'Site worksheet filename unclear');
const worksheetPath=await worksheet.path();
const worksheetBytes=fs.readFileSync(worksheetPath);
const worksheetText=worksheetBytes.toString('latin1');
const worksheetMedia=worksheetText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(worksheetMedia && Number(worksheetMedia[1])>Number(worksheetMedia[2]),'Site worksheet is not landscape');

// Print browser fallback.
await page.evaluate(()=>{window.__printCalled=false;window.print=()=>{window.__printCalled=true;};});
await page.locator('[data-action="print"]').click();
assert(await page.evaluate(()=>window.__printCalled===true),'Print button did not invoke print route');
console.log('PRINT_PASS');

// App Back logic: circuit -> circuit list -> home, without exiting.
await page.locator('.circuit-card').first().locator('[data-action="circuit-open"]').click();
assert(await page.evaluate(()=>window.sperinHandleBack())===true,'Back handler did not handle circuit page');
await page.waitForSelector('.circuit-list');
assert(await page.evaluate(()=>window.sperinHandleBack())===true,'Back handler did not handle certificate page');
await page.waitForSelector('.home-page');
assert(await page.evaluate(()=>window.sperinHandleBack())===false,'Back handler should only exit from home');
console.log('APP_BACK_PASS');

// Profile defaults and profile-backed tester fields.
await page.locator('[data-action="settings"]').first().click();
await page.waitForSelector('.profile-modal');
assert(await page.locator('[data-setting="testerMake"]').inputValue()==='Megger','Tester make profile default missing');
assert(await page.locator('[data-setting="testerModel"]').inputValue()==='MFT-X1','Tester model profile default missing');
assert(await page.locator('[data-setting="postcodeApiKey"]').count()===1,'Postcode API profile setting missing');
await page.locator('[data-action="save-settings"]').click();
await page.waitForTimeout(50);

// Start new EIC and verify tester defaults prefill.
await page.locator('button[data-action="new"][data-type="eic"]').click();
await page.waitForSelector('[data-field="testerMake"]');
assert(await page.locator('[data-field="testerMake"]').inputValue()==='Megger','New certificate did not inherit tester make');
assert(await page.locator('[data-field="testerModel"]').inputValue()==='MFT-X1','New certificate did not inherit tester model');
assert(await page.locator('[data-field="testerSerial"]').inputValue()==='ABC123','New certificate did not inherit tester serial');

// Brand is a home button.
await page.locator('.brand-home').click();
await page.waitForSelector('.home-page');
console.log('PROFILE_HOME_PASS');

// Build a whole-certificate blank site pack with exactly two boards and 3 total circuit slots.
await page.locator('[data-action="site-builder"]').click();
await page.waitForSelector('.site-builder-modal');
await page.locator('[data-site-builder="name"]').fill('Test two-board EIC');
await page.locator('[data-site-board="0"][data-site-board-key="ref"]').fill('DB1');
await page.locator('[data-site-board="0"][data-site-board-key="location"]').fill('Main hall');
await page.locator('[data-site-board="0"][data-site-board-key="circuits"]').fill('2');
await page.locator('[data-action="site-board-add"]').click();
await page.locator('[data-site-board="1"][data-site-board-key="ref"]').fill('DB2');
await page.locator('[data-site-board="1"][data-site-board-key="location"]').fill('Garage');
await page.locator('[data-site-board="1"][data-site-board-key="circuits"]').fill('1');
await page.locator('[data-action="site-template-save"]').click();
let templates=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-site-sheet-templates-v1')||'[]'));
assert(templates.length===1 && templates[0].boards.length===2,'Site sheet template was not saved');

const sitePdfPromise=page.waitForEvent('download');
await page.locator('[data-action="site-generate"]').click();
const sitePdf=await sitePdfPromise;
const sitePdfPath=await sitePdf.path();
assert(sitePdfPath && fs.existsSync(sitePdfPath),'Configured blank site-sheet PDF missing');
const sitePdfBytes=fs.readFileSync(sitePdfPath);
assert(sitePdfBytes.subarray(0,4).toString()==='%PDF','Configured site sheet is not a real PDF');
const sitePdfText=sitePdfBytes.toString('latin1');
const siteMedia=sitePdfText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(siteMedia && Number(siteMedia[1])>Number(siteMedia[2]),'Configured site sheet PDF is not landscape');

let plans=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-site-sheets-v1')||'[]'));
assert(plans.length>0,'Generated site sheet plan was not stored');
const plan=plans[0];
assert(plan.boards.length===2 && plan.boards[0].circuits===2 && plan.boards[1].circuits===1,'Board/circuit quantities were not preserved in the site sheet plan');
assert(plan.descriptors.some(d=>d.kind==='field'&&d.key==='clientName'),'Whole-certificate site sheet is missing general certificate fields');
assert(plan.descriptors.some(d=>d.table==='boards'&&d.boardIndex===1),'Whole-certificate site sheet is missing second board fields');
assert(plan.descriptors.some(d=>d.code==='B01C01-ZS'),'Circuit field codes are missing from generated site sheet');
stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
const linked=stored.certificates.find(c=>c.siteSheetId===plan.id);
assert(linked,'Site sheet did not create a linked draft certificate');
assert(linked.tables.boards.length===2 && linked.tables.circuits.length===3 && linked.tables.tests.length===3,'Linked draft did not get exact board/circuit counts');
console.log('CONFIGURABLE_SITE_SHEET_PASS');

// Read the completed sheet using printed headings. Field-first/value-second must map values to exact fields.
await page.locator('[data-action="site-read"]').click();
await page.waitForSelector('.sheet-picker');
await page.locator('[data-action="site-read-plan"][data-plan-id="'+plan.id+'"]').click();
await page.waitForSelector('.sheet-read-modal');
const spokenSheet=[
  'Circuit 1',
  'Description kitchen sockets',
  'Points 7',
  'Cable 2.5 twin and earth',
  'Installation surface trunking on masonry wall',
  'Reference method B',
  'Protective device 61009',
  'Curve B',
  'Rating 32',
  'RCD type type A',
  'I delta n 30',
  'Insulation test voltage 500',
  'Live to live 200',
  'Live to earth 200',
  'R1 plus R2 0.27',
  'Zs 0.36',
  'Polarity pass',
  'RCD time 23.9'
].join('. ');
await page.locator('[data-sheet-read-text]').fill(spokenSheet);
await page.locator('[data-action="sheet-read-process"]').click();
await page.waitForTimeout(120);
await page.locator('[data-action="sheet-read-open-cert"]').click();
await page.waitForSelector('.circuit-list');

stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
let linkedAfter=stored.certificates.find(c=>c.siteSheetId===plan.id);
assert(linkedAfter.tables.circuits[0].points==='7','Voice readback put points in wrong field');
assert(linkedAfter.tables.circuits[0].liveCsa==='2.5','Voice readback did not extract T&E live CSA');
assert(linkedAfter.tables.circuits[0].wiringType==='Twin & earth (flat)','Voice readback did not identify twin & earth');
assert(linkedAfter.tables.circuits[0].cpcCsa==='1.5','Standard 2.5 T&E CPC was not derived as 1.5 mm²');
assert(linkedAfter.tables.circuits[0].refMethod==='B','Surface trunking on masonry wall did not map to Reference Method B');
assert(linkedAfter.tables.circuits[0].ocpdBs==='BS EN 61009-1','61009 speech was not normalised');
assert(linkedAfter.tables.circuits[0].ocpdType==='B','Breaker curve B was not kept separate');
assert(linkedAfter.tables.circuits[0].rcdType==='A','RCD Type A was not kept separate from breaker curve');
assert(linkedAfter.tables.tests[0].r1r2==='0.27','R1+R2 value went to wrong field');
assert(linkedAfter.tables.tests[0].zs==='0.36','Zs value went to wrong field');
assert(linkedAfter.tables.tests[0].rcdTime==='23.9','RCD time went to wrong field');
assert(linkedAfter.autoMeta?.['circuit:0:cpcCsa'],'Derived CPC is not marked as auto-filled');
console.log('FIXED_ORDER_VOICE_READBACK_PASS');

// Technical values remain as entered and a warning triangle explains a failure instead of changing it.
await page.locator('.circuit-card').first().locator('[data-action="circuit-open"]').click();
await page.locator('[data-action="circuit-next"]').click();
await page.locator('[data-circuit-input="tests"][data-col="zs"]').fill('2.00');
await page.getByRole('button',{name:'Save circuit'}).click();
await page.waitForSelector('.validation-banner.warn');
assert((await page.locator('.validation-banner.warn').textContent()).includes('need checking'),'Out-of-range Zs did not create a warning');
await page.locator('.validation-banner.warn').click();
await page.waitForSelector('.warning-modal');
assert((await page.locator('.warning-modal').textContent()).includes('Zs exceeds configured maximum'),'Warning does not explain Zs issue');
await page.locator('.warning-modal [data-action="close-modal"]').click();
stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
linkedAfter=stored.certificates.find(c=>c.siteSheetId===plan.id);
assert(linkedAfter.tables.tests[0].zs==='2.00','Validation must never change the electrician\'s measured value');
console.log('TECHNICAL_WARNING_PASS');

// Feed a synthetic on-device OCR result through the exact photo-review path.
await page.locator('.brand-home').click();
await page.waitForSelector('.home-page');
await page.locator('[data-action="site-scan"]').click();
await page.waitForSelector('.sheet-picker');
await page.locator('[data-action="site-scan-plan"][data-plan-id="'+plan.id+'"]').click();
await page.waitForSelector('.sheet-scan-modal');
const zsDescriptor=plan.descriptors.find(d=>d.code==='B01C01-ZS');
assert(zsDescriptor,'Zs scan descriptor missing');
await page.evaluate(({id,pageNo})=>{
  window.sperinSheetScanResult('',JSON.stringify({
    fullText:'SPERIN SHEET '+id+' PAGE '+pageNo+'\\nB01C01-ZS Zs 0.44',
    width:2000,height:1400,
    lines:[
      {text:'SPERIN SHEET '+id+' PAGE '+pageNo,left:20,top:20,right:900,bottom:60},
      {text:'B01C01-ZS Zs 0.44',left:50,top:200,right:700,bottom:250}
    ]
  }),'');
},{id:plan.id,pageNo:zsDescriptor.page||1});
await page.waitForSelector('.scan-review-row');
assert((await page.locator('.scan-summary').textContent()).includes('clear'),'Exact field-code OCR was not marked clear');
await page.locator('[data-action="scan-apply"]').click();
await page.waitForSelector('.circuit-list');
stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')||'{}'));
linkedAfter=stored.certificates.find(c=>c.siteSheetId===plan.id);
assert(linkedAfter.tables.tests[0].zs==='0.44','Photo scan did not apply Zs to the exact linked circuit');
console.log('PHOTO_SCAN_MAPPING_PASS');

// Backup browser fallback should create JSON.
const backupPromise=page.waitForEvent('download');
await page.locator('[data-action="backup"]').click();
const backupDownload=await backupPromise;
assert(backupDownload.suggestedFilename().endsWith('.json'),'Backup is not JSON');
console.log('BACKUP_PASS');

await page.locator('.brand-home').click();
await page.waitForSelector('.home-page');

// Every certificate type must open without render errors and include voice controls.
for (const type of ['eic','eicr','minor','emergency','smoke']) {
  await page.locator('button[data-action="new"][data-type="'+type+'"]').click();
  await page.waitForSelector('.form-head');
  assert(await page.locator('.app-error').count()===0,type+' form hit render error');
  assert(await page.locator('button[data-action="voice-one"]').count()>0,type+' form missing Speak controls');
  await page.locator('.brand-home').click();
  await page.waitForSelector('.home-page');
}
console.log('ALL_CERTIFICATE_TYPES_PASS');

assert(errors.length===0,'Browser errors: '+errors.join(' | '));

console.log('CERTIFICATE_E2E_PASS');
console.log(JSON.stringify({
  routeMap:true,
  nativeHooks:true,
  premiumHome:true,
  legacyOpen:true,
  detailedInspection:true,
  postcodeLookup:true,
  autosave:true,
  circuitReorder:true,
  autoZsB32:maxZs,
  circuitReturnPosition:true,
  landscapePdf:true,
  worksheet:true,
  print:true,
  appBack:true,
  profileDefaults:true,
  backup:true,
  configurableSiteSheets:true,
  fixedOrderVoiceReadback:true,
  photoScanMapping:true,
  technicalWarnings:true,
  allCertificateTypes:true
}));

await browser.close();
