import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#new-certificates .cert-launch").count(), 5);
  assert.equal(await page.locator("#saved-certificates [data-certificate-search]").count(), 1);

  const jump = page.locator('[data-action="jump-to"][data-target="new-certificates"]');
  await jump.click();
  assert.equal(await page.locator("#new-certificates").count(), 1);

  await page.locator('[data-action="new"][data-type="eic"]').click();
  const form = page.locator(".form-entry-panel");
  await form.waitFor();
  assert.match(await form.innerText(), /Form field count only/);
  const before = Number(
    await form.locator('[role="progressbar"]').getAttribute("aria-valuenow"),
  );
  await page.locator('[data-field="clientName"]').fill("Example Visual Client");
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}")
      .certificates?.some((c) => c.fields?.clientName === "Example Visual Client"),
  );
  const after = Number(await form.locator('[role="progressbar"]').getAttribute("aria-valuenow"));
  assert(after >= before, "The progress meter decreased after a field was entered");
  assert.match(await form.innerText(), /fields recorded/);

  await page.locator('[data-action="section-toggle"][data-section-key="part-1"]').click();
  assert.equal(
    await page.locator('[data-action="section-toggle"][data-section-key="part-1"]')
      .getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(
    await page.locator('[data-action="section-toggle"][data-section-key="part-0"]')
      .getAttribute("aria-expanded"),
    "false",
  );

  await page.locator('.form-head [data-action="home"]').click();
  const saved = page.locator(".saved-cert-row").filter({ hasText: "Example Visual Client" });
  assert.equal(await saved.count(), 1);
  assert.match(await saved.innerText(), /form fields recorded/);
  assert.equal(await saved.locator(".entry-meter").count(), 1);
  assert.equal(await saved.locator(".pill-draft").count(), 1);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(overflow <= 2, "Visual refresh caused mobile horizontal overflow: " + overflow);

  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".saved-cert-row").filter({ hasText: "Example Visual Client" }).count(),
    1,
    "Dashboard update lost data after reload",
  );
  assert.deepEqual(errors, [], "Browser exception(s): " + errors.join("; "));
  console.log("VISUAL_EXPERIENCE_LAB_PORT_PASS");
} finally {
  await browser.close();
}
