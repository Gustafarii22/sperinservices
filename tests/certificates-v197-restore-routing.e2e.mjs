import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Regression for old-app users: a fresh permanent-package install has no
// local "latest" backup, so Restore must offer the Android JSON picker.
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844}});
const dialogs = [];
page.on('dialog', async dialog => {
  dialogs.push(dialog.message());
  await dialog.dismiss();
});
try {
  await page.goto(process.env.CERT_URL || 'http://127.0.0.1:4173/certificates/');
  await page.waitForFunction(() => typeof window.sperinRestoreBackup === 'function');
  await page.locator('[data-action="settings"]').first().click();
  const profile = page.locator('.profile-modal');
  assert.match(await profile.locator('[data-action="import-backup"]').innerText(), /Import certificate JSON/);
  assert.match(await profile.locator('[data-action="restore"]').innerText(), /Restore this app/);
  assert.match(await profile.innerText(), /signing-key \\.bin file is not a certificate backup/);

  await page.evaluate(() => {
    window.__backupPickerCalls = 0;
    window.Android = {
      importBackupFile: () => { window.__backupPickerCalls += 1; }
    };
  });
  const before = await page.evaluate(() => localStorage.getItem('sperin-certificates-data-v1'));

  // New installation: no local backup, choose an old-app exported JSON instead
  // of displaying an unhelpful technical "backup not found" JavaScript alert.
  await page.evaluate(() => window.sperinRestoreBackup('', 'No Sperin Certificates backup was found'));
  assert.equal(await page.evaluate(() => window.__backupPickerCalls), 1);
  assert.equal(dialogs.length, 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('sperin-certificates-data-v1')), before);

  // Do not interpret the encrypted Android signing-key backup as a certificate file.
  await page.evaluate(() => window.sperinRestoreBackup('NOT-JSON-ENCRYPTED-KEY-DATA', ''));
  assert.match(dialogs.at(-1) || '', /Select a Sperin Certificates \\.json backup/);
  assert.equal(await page.evaluate(() => localStorage.getItem('sperin-certificates-data-v1')), before);

  // Unrelated errors must not silently redirect to another file.
  await page.evaluate(() => window.sperinRestoreBackup('', 'Permission denied'));
  assert.match(dialogs.at(-1) || '', /Permission denied/);
  assert.equal(await page.evaluate(() => window.__backupPickerCalls), 1);
  console.log('FRESH_INSTALL_BACKUP_IMPORT_RECOVERY_PASS');
} finally {
  await browser.close();
}
