import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  acceptDownloads: true,
  recordVideo: { dir: "certificate-android/qa-output/video", size: { width: 412, height: 915 } },
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const dir = "certificate-android/qa-output";
fs.mkdirSync(dir, { recursive: true });
await page.goto(base);
await page.screenshot({ path: dir + "/white-dashboard.png", fullPage: true });
await page.locator('[data-action="new"][data-type="eic"]').click();
await page.locator('[data-field="clientName"]').fill("Scanner regression customer");
await page.locator('[data-action="board-scan"]').first().click();
await page
  .locator("[data-board-photos]")
  .setInputFiles("public/projects/nursery-refurbishment/distribution-board.webp");
await page.waitForSelector(".board-photo-strip img");
assert.equal(await page.locator(".board-photo-strip img").count(), 1);
assert.equal(await page.locator('[data-scan-command="analyse"]').isDisabled(), true);
// Deliberately mocked response: this tests the review/save pipeline, NOT recognition accuracy.
const field = (key, value, confidence = "high") => ({
  key,
  value,
  confidence,
  evidence: [{ image: 1, text: value }],
  reason: "Controlled test response — not a live recognition result",
});
await page.route("**/api/owner/certificate-scan", (route) =>
  route.fulfill({
    json: {
      board: [field("manufacturer", "Wylex"), field("model", "", "missing"),field("mainSwitch","100 A"),field("spd","Type 2 SPD")],
      circuits: [
        {
          position: "Left device (test fixture)",
          association: "high",
          reason: "Confirm label relationship manually",
          fields: [
            field("circuitNo", "1"),
            field("description", "Lighting", "check"),
            field("ocpdRating", "6"),
            field("ocpdType", "B"),
            field("liveCsa", "2.5"),
          ],
        },
      ],
      warnings: ["TEST RESPONSE: recognition accuracy is not being tested."],
    },
  }),
);
await page.locator("[data-board-consent]").check();
await page.locator('[data-scan-command="analyse"]').click();
await page.waitForSelector(".scan-device");
assert.equal(await page.locator("[data-confirm]:checked").count(), 0);
assert.equal(await page.locator(".board-scan-modal").getByText("Live conductor csa").count(), 0);
await page.locator('[data-confirm="board:0"]').check();
assert.equal(await page.locator('[data-number="0"]').inputValue(),'0');
assert.ok(await page.locator('[data-target="1"]').inputValue());
if(await page.locator('[data-target="1"]').inputValue()==='new')assert.equal(await page.locator('[data-number="1"]').inputValue(),'1');
const suggestedTarget=await page.locator('[data-target="2"]').inputValue();
assert.ok(suggestedTarget, 'clear, unique circuit number should suggest a target');
if(suggestedTarget==='new')assert.equal(await page.locator('[data-number="2"]').inputValue(), '2');
await page.locator('[data-target="2"]').selectOption("new");
await page.locator('[data-number="2"]').fill("12");
await page.locator(".scan-device").nth(2).getByLabel("Circuit description", {exact:true}).fill("Confirmed lights");
assert.equal(await page.locator(".scan-device [data-confirm]").count(), 0);
await page.locator('[data-device-confirm="0"]').check();
await page.locator('[data-device-confirm="1"]').check();
await page.locator('[data-device-confirm="2"]').check();
await page.locator(".scan-device").nth(2).scrollIntoViewIfNeeded();
await page.screenshot({ path: dir + "/scan-review.png" });
await page.setViewportSize({ width: 915, height: 412 });
assert.ok(await page.locator('[data-scan-command="close"]').isVisible());
await page.screenshot({ path: dir + "/scan-landscape.png" });
await page.setViewportSize({ width: 412, height: 915 });
await page.locator('[data-scan-command="apply"]').click();
await page.waitForSelector(".board-scan-diff");
await page.screenshot({ path: dir + "/scan-confirm.png" });
assert.ok((await page.locator(".board-scan-diff").innerText()).includes("Confirmed lights"));
await page.locator("[data-save]").click();
const state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1")),
);
const cert = state.certificates[0],
  row = cert.tables.circuits.find((r) => r.circuitNo === "12");
assert.equal(cert.fields.clientName, "Scanner regression customer");
assert.equal(row.description, "Confirmed lights");
assert.equal(row.ocpdRating, "6");
const mainPosition=cert.tables.circuits.find(r=>r.circuitNo==="0");
const spdPosition=cert.tables.circuits.find(r=>r.circuitNo==="1");
assert.equal(mainPosition?.deviceKind,"Main switch");
assert.equal(spdPosition?.deviceKind,"SPD");
assert.equal(mainPosition?.ocpdRating,undefined);
assert.equal(spdPosition?.ocpdRating,undefined);
assert.equal(row.ocpdType, "B");
assert.equal(row.liveCsa, undefined);
assert.equal(cert.tables.boards[0].manufacturer, "Wylex");
await page.reload();
await page.locator('[data-action="board-scan"]').first().waitFor();
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1")),
);
assert.equal(
  saved.certificates[0].tables.circuits.find((r) => r.circuitNo === "12").description,
  "Confirmed lights",
);
assert.ok(!JSON.stringify(saved).includes("data:image"));
const [firstScanPdf] = await Promise.all([
  page.waitForEvent("download"),
  page.locator('[data-action="pdf"]').first().click(),
]);
await firstScanPdf.saveAs(dir + "/scan-confirmed.pdf");
assert.ok(fs.statSync(dir+"/scan-confirmed.pdf").size > 10000, "populated PDF should not be empty");
await page.locator('[data-action="board-scan"]').first().click();
await page.locator('[data-scan-command="add"]').click();
await page.locator('[data-target="0"]').selectOption(row.id);
await page.locator('[data-value="0:6"]').fill("BS EN 60898-1");
await page.locator('[data-device-confirm="0"]').check();
await page.locator('[data-scan-command="apply"]').click();
await page.locator("[data-cancel]").click();
assert.equal(await page.locator(".board-scan-diff").count(), 0);
await page.locator('[data-scan-command="close"]').click();
await page.locator('[data-action="board-scan"]').first().click();
for (const [index,number] of [[0,"13"],[1,"14"]]) {
  await page.locator('[data-scan-command="spare"]').click();
  await page.locator('[data-target="'+index+'"]').selectOption("new");
  await page.locator('[data-number="'+index+'"]').fill(number);
  await page.locator('[data-device-confirm="'+index+'"]').check();
}
await page.locator('[data-scan-command="apply"]').click();
assert.ok((await page.locator(".board-scan-diff").innerText()).includes("SPARE"));
await page.locator("[data-save]").click();
const spareState=await page.evaluate(()=>JSON.parse(localStorage.getItem("sperin-certificates-data-v1")));
for(const n of ["13","14"]) {
  const spare=spareState.certificates[0].tables.circuits.find(c=>c.circuitNo===n);
  assert.equal(spare?.description,"SPARE");
  assert.equal(spare?.deviceKind,"Spare");
  assert.equal(spare?.ocpdRating,undefined);
}
const [sparesPdf]=await Promise.all([page.waitForEvent("download"),page.locator('[data-action="pdf"]').first().click()]);
await sparesPdf.saveAs(dir+"/scan-with-spares.pdf");
assert.ok(fs.statSync(dir+"/scan-with-spares.pdf").size>10000);
// Regression: the Android ML Kit bridge must deliver OCR to the consumer-unit scanner,
// not the unrelated site-sheet callback. This checks that the asynchronous consumer
// result is displayed, reviewed and saved in the same certificate.
await page.evaluate(() => {
  window.Android = {
    scanSheetImageBase64(token, photo) {
      if (!token.startsWith("board-ocr-") || !photo.startsWith("data:image/")) throw Error("Wrong consumer-unit OCR route");
      queueMicrotask(() => window.SperinConsumerScan.ocrResult(
        token, JSON.stringify({fullText:"B32\\nBS EN 61009-1\\nType A"}), ""
      ));
    }
  };
});
await page.locator('[data-action="board-scan"]').first().click();
await page.locator('[data-board-photos]').setInputFiles('public/projects/nursery-refurbishment/distribution-board.webp');
await page.waitForSelector('.board-photo-strip img');
await page.locator('[data-scan-command="ocr"]').click();
await page.waitForFunction(() => document.querySelectorAll('.scan-device').length === 1);
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Local OCR complete'));
assert.equal(await page.locator('[data-value="0:0"]').inputValue(),'B');
assert.equal(await page.locator('[data-value="0:1"]').inputValue(),'32');
await page.locator('[data-target="0"]').selectOption('new');
await page.locator('[data-number="0"]').fill('15');
await page.locator('[data-device-confirm="0"]').check();
await page.locator('[data-scan-command="apply"]').click();
await page.locator('[data-save]').click();
const ocrSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sperin-certificates-data-v1')));
const ocrCircuit=ocrSaved.certificates[0].tables.circuits.find(c=>c.circuitNo==='15');
assert.equal(ocrCircuit?.ocpdType,'B');
assert.equal(ocrCircuit?.ocpdRating,'32');
await page.reload();
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sperin-certificates-data-v1')).certificates[0].tables.circuits.find(c=>c.circuitNo==='15')?.ocpdRating),'32');
await page.locator('[data-board-input="manufacturer"]').first().scrollIntoViewIfNeeded();
await page.screenshot({ path: dir + "/white-consumer-unit.png" });
const dark = await page.evaluate(
  () =>
    [...document.querySelectorAll("#app input,#app select,#app .card,#app .combo-menu")]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        const c = getComputedStyle(el).backgroundColor.match(/\d+/g);
        return c && c.length >= 3 && Number(c[0]) + Number(c[1]) + Number(c[2]) < 280;
      }).length,
);
assert.equal(dark, 0);
await page.locator('[data-action="board-add"]').click();
assert.equal(await page.locator('.consumer-unit-card').count(),2);
assert.equal(await page.locator('.consumer-unit-card [data-action="board-scan"]').count(),2);
await page.locator('.consumer-unit-card').nth(1).locator('[data-action="board-scan"]').click();
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Scan DB2'));
await page.locator('[data-scan-command="close"]').click();
await page.locator('.consumer-unit-card').first().locator('[data-action="board-scan"]').click();
assert.ok((await page.locator('.board-scan-modal').innerText()).includes('Scan DB1'));
await page.locator('[data-scan-command="close"]').click();
assert.deepEqual(errors, []);
await page.close();
await browser.close();
console.log(
  "SCAN_UI_PASS: local photo loading, mock review/correction, explicit mapping, diff/cancel, persistence, portrait/landscape, light inputs; no live recognition claim",
);
