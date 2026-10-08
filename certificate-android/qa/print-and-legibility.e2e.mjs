import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  acceptDownloads: true,
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator('[data-action="new"][data-type="eic"]').click();
  const cuAccordion = page.locator(".consumer-unit-accordion");
  assert.equal(await cuAccordion.count(), 1, "Consumer unit/circuit dropdown is missing");
  const toggle = cuAccordion.locator('.section-toggle[data-action="section-toggle"]');
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.equal(await cuAccordion.locator('[data-action="circuit-add"]').count(), 1);
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  await cuAccordion.locator('[data-action="circuit-add"]').click();
  await page.locator('[data-circuit-input="details"][data-col="description"]').waitFor();
  await page.locator('[data-action="circuit-list"]').first().click();
  await page.waitForSelector(".circuit-list");

  // Font sizes must be legible on actual phone-size viewport.
  const style = await page
    .locator(".field input")
    .first()
    .evaluate((el) => ({
      size: Number.parseFloat(getComputedStyle(el).fontSize),
      background: getComputedStyle(el).backgroundColor,
    }));
  assert(style.size >= 16, "Form input font is too small for mobile readability");
  await page.evaluate(() => {
    window.__nativePrinted = null;
    window.Android = {
      printPdfBase64(dataUri, name) {
        window.__nativePrinted = { dataUri, name };
        return true;
      },
    };
  });
  await page.locator('[data-action="print"]').first().click();
  const native = await page.evaluate(() => window.__nativePrinted);
  assert(
    native && native.name.endsWith(".pdf"),
    "Print did not hand native Android a PDF filename",
  );
  assert(
    native.dataUri.startsWith("data:application/pdf;"),
    "Print did not send the real certificate PDF",
  );
  const pdf = Buffer.from(native.dataUri.slice(native.dataUri.indexOf(",") + 1), "base64");
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF", "Print PDF signature invalid");
  const med = pdf.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
  assert(med && Number(med[1]) > Number(med[2]), "EIC print PDF not landscape");

  // The native Android hand-off is a distinct path from the browser's print-page fallback.
  await page.evaluate(() => {
    delete window.Android;
    window.__browserPrinted = false;
    window.print = () => {
      window.__browserPrinted = true;
    };
  });
  await page.locator('[data-action="print"]').first().click();
  assert(await page.evaluate(() => window.__browserPrinted), "Browser print fallback failed");
  assert.deepEqual(errors, [], "Browser exceptions: " + errors.join("; "));
  console.log("CERT_PRINT_AND_LEGIBILITY_PASS");
} finally {
  await browser.close();
}
