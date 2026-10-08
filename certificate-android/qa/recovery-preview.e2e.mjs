import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.dismiss());

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator('[data-action="new"][data-type="eic"]').first().click();
  const current = await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1"));
  assert.equal(
    JSON.parse(current).certificates.length,
    1,
    "Fixture EIC certificate was not created",
  );

  const baseline = JSON.parse(current);
  const imported = structuredClone(baseline.certificates[0]);
  imported.id = "safe-backup-test-imported-certificate";
  imported.number = "EIC-RECOVERY-TEST";
  imported.fields.clientName = "Preview Only Example";
  imported.fields.installationAddress = "Fictional Import Street, Birmingham";
  const payload = JSON.stringify({ version: "1.7.14", certificates: [imported] });

  // The native Android entry point must stage a preview without changing storage.
  await page.evaluate((json) => window.sperinRestoreBackup(json), payload);
  const preview = page.locator(".backup-preview-backdrop");
  await preview.waitFor();
  assert.match(await preview.innerText(), /Review before restoring/);
  assert.match(await preview.innerText(), /Preview Only Example/);
  assert.match(await preview.innerText(), /will be REPLACED/);
  assert.equal(await preview.locator('[data-action="backup-preview-apply"]').isDisabled(), true);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1")),
    current,
    "Opening the preview changed production data",
  );

  await preview.locator('[data-action="backup-preview-cancel"]').last().click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1")),
    current,
    "Cancel changed production data",
  );
  assert.equal(await preview.count(), 0, "Preview dialog remained after cancel");

  await page.evaluate((json) => window.sperinRestoreBackup(json), payload);
  await preview.locator("[data-backup-preview-consent]").check();
  assert.equal(await preview.locator('[data-action="backup-preview-apply"]').isEnabled(), true);
  await preview.locator('[data-action="backup-preview-apply"]').click();
  const restored = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1")),
  );
  assert.equal(restored.certificates.length, 1);
  assert.equal(restored.certificates[0].id, imported.id);
  assert.equal(restored.certificates[0].fields.clientName, imported.fields.clientName);

  const recovery = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-pre-restore-v1")),
  );
  assert.equal(
    recovery.certificates[0].id,
    baseline.certificates[0].id,
    "Original certificate was not snapshotted",
  );

  // Verify the existing Undo recovery control restores original certificate data.
  await page.locator('[data-action="settings"]').first().click();
  await page.locator('[data-action="undo-restore"]').click();
  const undone = JSON.parse(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1")),
  );
  assert.equal(
    undone.certificates[0].id,
    baseline.certificates[0].id,
    "Undo recovery did not restore original certificate",
  );

  // Invalid backups may never touch storage.
  const afterUndo = await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1"));
  await page.evaluate(() => window.sperinRestoreBackup('{"invalid":true}'));
  assert.equal(
    await page.evaluate(() => localStorage.getItem("sperin-certificates-data-v1")),
    afterUndo,
  );
  assert.equal(await page.locator(".backup-preview-backdrop").count(), 0);

  assert.deepEqual(errors, [], "Browser error(s): " + errors.join("; "));
  console.log(
    "PASS: preview-before-restore, cancel, explicit consent, pre-restore snapshot, undo, invalid-input protection",
  );
} finally {
  await browser.close();
}
