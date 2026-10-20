import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
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
      board: [field("manufacturer", "Wylex"), field("model", "", "missing")],
      circuits: [
        {
          position: "Left device (test fixture)",
          association: "check",
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
await page.locator('[data-target="0"]').selectOption("new");
await page.locator('[data-number="0"]').fill("12");
await page.locator(".scan-device").first().getByLabel("Circuit description", {exact:true}).fill("Confirmed lights");
assert.equal(await page.locator(".scan-device [data-confirm]").count(), 0);
await page.locator('[data-device-confirm="0"]').check();
await page.locator(".scan-device").first().scrollIntoViewIfNeeded();
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
await page.locator('[data-action="board-scan"]').first().click();
await page.locator('[data-scan-command="add"]').click();
await page.locator('[data-target="0"]').selectOption(row.id);
await page.locator('[data-value="0:6"]').fill("BS EN 60898-1");
await page.locator('[data-device-confirm="0"]').check();
await page.locator('[data-scan-command="apply"]').click();
await page.locator("[data-cancel]").click();
assert.equal(await page.locator(".board-scan-diff").count(), 0);
await page.locator('[data-scan-command="close"]').click();
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
assert.deepEqual(errors, []);
await page.close();
await browser.close();
console.log(
  "SCAN_UI_PASS: local photo loading, mock review/correction, explicit mapping, diff/cancel, persistence, portrait/landscape, light inputs; no live recognition claim",
);
