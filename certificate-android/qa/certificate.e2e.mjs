import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.CERT_BASE_URL || 'http://127.0.0.1:4173/certificates/';
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
      installationAddress: '1 Test Road\nBirmingham B1 1AA',
      issueDate: '2026-10-01',
      nominalVoltage: '230'
    },
    tables: {
      circuits: [null, { circuitNo: '1', description: 'Socket circuit', ocpdBs: 'BS EN 60898-1', ocpdType: 'B', ocpdRating: '32' }],
      tests: [null, { circuitNo: '1' }],
      eicInspection: [null]
    }
  };
  localStorage.setItem('sperin-certificates-data-v1', JSON.stringify({ certificates: [cert] }));
});

const page = await context.newPage();
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});
await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.saved-cert-card');

const saved = page.locator('.saved-cert-card').first();
assert((await saved.textContent()).includes('Jane Smith'), 'Saved card must show customer name');
assert((await saved.textContent()).includes('1 Test Road'), 'Saved card must show address');
assert((await saved.textContent()).includes('01/10/2026'), 'Saved card must show certificate date');

await saved.locator('.saved-cert-main').click();
await page.waitForSelector('.form-head');
assert((await page.locator('.form-title h2').textContent()).includes('Electrical Installation Certificate'), 'Existing certificate did not open');
assert(await page.locator('.app-error').count() === 0, 'Opening existing certificate hit render error');

await page.waitForTimeout(100);
assert(await page.locator('button[data-action="voice-one"]').count() > 5, 'Speak buttons not visible');

const voltage = page.locator('select[data-field="nominalVoltage"]');
assert(await voltage.count() === 1, 'Nominal voltage should be a dropdown');
const voltageOptions = await voltage.locator('option').allTextContents();
assert(voltageOptions.includes('230') && voltageOptions.includes('230/400'), 'Voltage dropdown choices missing');

const clientName = page.locator('[data-field="clientName"]');
await clientName.fill('Jane Smith Updated');
await page.waitForTimeout(450);
let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sperin-certificates-data-v1') || '{}'));
assert(stored.certificates?.[0]?.fields?.clientName === 'Jane Smith Updated', 'Typed field did not autosave');
console.log('AUTOSAVE_TYPED_PASS');

await voltage.selectOption('230/400');
await page.waitForTimeout(60);
stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sperin-certificates-data-v1') || '{}'));
assert(stored.certificates?.[0]?.fields?.nominalVoltage === '230/400', 'Dropdown did not autosave');
console.log('AUTOSAVE_DROPDOWN_PASS');


const spd = page.locator('select[data-field="dbSpd"]');
assert(await spd.count() === 1, 'SPD should be a dropdown');
const spdOptions = await spd.locator('option').allTextContents();
assert(spdOptions.some(x => x.includes('Type 1')) && spdOptions.some(x => x.includes('Type 2')), 'SPD Type 1 / Type 2 choices missing');

await page.locator('button[data-action="voice-guide"]').first().click();
await page.waitForSelector('.voice-assistant');
const grouped = page.locator('.voice-assist-card');
const groupCount = await grouped.count();
assert(groupCount >= 1 && groupCount <= 3, 'Assistant must show 1 to 3 related questions');
assert(await page.locator('[data-action="voice-read"]').count() === 0, 'Read-question control should be removed');

await grouped.first().locator('[data-action="voice-later"]').click();
await page.waitForTimeout(30);
assert(await page.locator('.voice-assistant').count() === 1, 'Assistant closed unexpectedly after Later');
if (await page.locator('.voice-assist-card').count()) {
  await page.locator('.voice-assist-card').first().locator('[data-action="voice-dismiss"]').click();
}
await page.locator('[data-action="voice-stop"]').first().click();
await page.waitForTimeout(30);
assert(await page.locator('[data-action="voice-review-later"]:visible').count() >= 1, 'Review later button should be visible');

const circuitCard = page.locator('.circuit-card').first();
assert(await circuitCard.count() === 1, 'Circuit card missing');
await circuitCard.locator('[data-action="circuit-open"]').click();
await page.waitForSelector('[data-circuit-input="details"][data-col="ocpdBs"]');

await page.locator('[data-circuit-input="details"][data-col="ocpdBs"]').fill('BS EN 60898-1');
await page.locator('[data-circuit-input="details"][data-col="ocpdType"]').fill('B');
await page.locator('[data-circuit-input="details"][data-col="ocpdRating"]').fill('32');
await page.waitForTimeout(30);
const maxZs = await page.locator('[data-circuit-input="details"][data-col="maxZs"]').inputValue();
assert(maxZs === '1.37', 'B32 automatic max Zs should calculate to 1.37 Ω at 230 V, got ' + maxZs);

await page.locator('[data-action="circuit-next"]').click();
assert((await page.locator('.eyebrow').first().textContent()).includes('2 of 2'), 'Circuit next route failed');
stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sperin-certificates-data-v1') || '{}'));
const storedCircuit = stored.certificates?.[0]?.tables?.circuits?.find(r => r && r.description === 'Socket circuit') || stored.certificates?.[0]?.tables?.circuits?.[1] || stored.certificates?.[0]?.tables?.circuits?.[0];
assert(storedCircuit?.ocpdRating === '32', 'Circuit Next did not save circuit data');
console.log('AUTOSAVE_CIRCUIT_NEXT_PASS');
await page.locator('[data-action="circuit-prev"]').click();
assert((await page.locator('.eyebrow').first().textContent()).includes('1 of 2'), 'Circuit previous route failed');
stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sperin-certificates-data-v1') || '{}'));
assert(Array.isArray(stored.certificates?.[0]?.tables?.circuits), 'Circuit Back did not preserve saved certificate');
console.log('AUTOSAVE_CIRCUIT_BACK_PASS');
await page.locator('[data-action="circuit-list"]').first().click();
await page.waitForSelector('.circuit-list');
await page.waitForTimeout(80);
const circuitTop = await page.locator('.circuit-list').evaluate(el => el.getBoundingClientRect().top);
assert(circuitTop >= -10 && circuitTop < 180, 'Saving circuit should return to the circuit schedule, top=' + circuitTop);
console.log('CIRCUIT_RETURN_POSITION_PASS');

const beforeCircuitDuplicate = await page.locator('.circuit-card').count();
await page.locator('[data-action="circuit-duplicate"]').first().click();
await page.waitForSelector('[data-circuit-input="details"]');
await page.locator('[data-action="circuit-list"]').first().click();
assert(await page.locator('.circuit-card').count() === beforeCircuitDuplicate + 1, 'Circuit duplicate failed');

const pdfDownloadPromise = page.waitForEvent('download');
await page.locator('[data-action="pdf"]').first().click();
const pdfDownload = await pdfDownloadPromise;
const pdfPath = await pdfDownload.path();
assert(pdfDownload.suggestedFilename().toLowerCase().endsWith('.pdf'), 'PDF filename should end .pdf');
assert(pdfPath && fs.existsSync(pdfPath), 'PDF download file missing');
const pdfBytes = fs.readFileSync(pdfPath);
assert(pdfBytes.length > 1000, 'PDF download is unexpectedly small');
assert(pdfBytes.subarray(0, 4).toString() === '%PDF', 'Downloaded file is not a valid PDF');
console.log('PDF_DOWNLOAD_PASS');

await page.locator('[data-action="home"]').last().click();
await page.waitForSelector('.saved-cert-card');

const beforeDup = await page.locator('.saved-cert-card').count();
await page.locator('.saved-cert-card').first().locator('[data-action="duplicate"]').click();
await page.waitForTimeout(30);
assert(await page.locator('.saved-cert-card').count() === beforeDup + 1, 'Certificate duplicate failed');

page.once('dialog', d => d.accept());
await page.locator('.saved-cert-card').first().locator('[data-action="delete"]').click();
await page.waitForTimeout(30);
assert(await page.locator('.saved-cert-card').count() === beforeDup, 'Certificate delete failed');

await page.locator('[data-action="settings"]').click();
await page.waitForSelector('[data-modal]');
await page.locator('[data-action="close-modal"]').last().click();
assert(await page.locator('[data-modal]').count() === 0, 'Settings close failed');

const downloadPromise = page.waitForEvent('download');
await page.locator('[data-action="backup"]').click();
const download = await downloadPromise;
assert(download.suggestedFilename().endsWith('.json'), 'Backup should download JSON');

for (const type of ['eic','eicr','minor','emergency','smoke']) {
  const startButton = page.locator('button[data-action="new"][data-type="'+type+'"]');
  assert(await startButton.count() === 1, 'Missing start button for '+type);
  await startButton.click();
  await page.waitForSelector('.form-head');
  assert(await page.locator('.app-error').count() === 0, type+' form hit render error');
  assert(await page.locator('button[data-action="voice-one"]').count() > 0, type+' form missing Speak controls');
  await page.locator('[data-action="home"]').last().click();
  await page.waitForSelector('.saved-cert-card');
}
console.log('ALL_CERTIFICATE_TYPES_PASS');

assert(errors.length === 0, 'Browser errors: ' + errors.join(' | '));

console.log('CERTIFICATE_E2E_PASS');
console.log(JSON.stringify({
  savedCard: true,
  legacyOpen: true,
  speakButtons: true,
  groupedAssistant: true,
  laterDismiss: true,
  dropdowns: true,
  spdChoices: true,
  autoZsB32: maxZs,
  circuitRoutes: true,
  certificateDuplicateDelete: true,
  settings: true,
  backup: true,
  autosaveTyped: true,
  autosaveDropdown: true,
  autosaveNextBack: true,
  circuitReturnPosition: true,
  pdfDownload: true,
  allCertificateTypes: true,
  actionRouteMap: true
}));

await browser.close();
