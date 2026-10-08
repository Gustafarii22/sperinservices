import { chromium } from "playwright";

const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const KEY = "sperin-certificates-data-v1";
const PRE = "sperin-certificates-pre-restore-v1";
const assert = (yes, why) => { if (!yes) throw Error(why); };
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on("dialog", dialog => dialog.accept());
  await page.goto(base);
  await page.locator('[data-action="new"][data-type="eic"]').click();
  const original = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(original?.certificates?.length === 1, "Could not create sample certificate");
  const backedUpId = original.certificates[0].id;
  const emptyBackup = JSON.stringify({
    version: "1.7.15", exportedAt: new Date().toISOString(), certificates: []
  });

  await page.evaluate(backup => window.sperinRestoreBackup(backup), emptyBackup);
  await page.locator(".import-review-backdrop").waitFor();
  const preview = await page.locator(".import-review-modal").innerText();
  assert(preview.includes("On this device: 1"), "Current certificate count not shown");
  assert(preview.includes("In selected backup: 0"), "Backup certificate count not shown");
  assert(preview.includes("selected backup is empty"), "Empty backup warning missing");
  let before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(before.certificates[0].id === backedUpId, "Preview replaced live data before confirmation");

  await page.locator('[data-action="import-review-cancel"]').last().click();
  await page.locator(".import-review-backdrop").waitFor({ state: "detached" });
  before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(before.certificates[0].id === backedUpId, "Cancellation lost certificate data");

  await page.evaluate(backup => window.sperinRestoreBackup(backup), emptyBackup);
  await page.locator('[data-action="import-review-apply"]').click();
  const replaced = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(replaced.certificates.length === 0, "Confirmed import failed");
  const rescue = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PRE);
  assert(rescue.certificates.some(c => c.id === backedUpId), "Pre-import recovery snapshot missing");

  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="undo-restore"]').click();
  const recovered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(recovered.certificates.some(c => c.id === backedUpId), "Undo failed to recover certificate");
  await page.reload();
  const afterReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  assert(afterReload.certificates.some(c => c.id === backedUpId), "Recovered certificate was not persisted");
  console.log("SAFE_IMPORT_PREVIEW_CANCEL_CONFIRM_UNDO_PASS");
} finally {
  await browser.close();
}
