import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const launch = process.env.CHROME_PATH
  ? {
      executablePath: process.env.CHROME_PATH,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote", "--single-process"],
    }
  : {};
const browser = await chromium.launch({ headless: true, ...launch });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  acceptDownloads: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
let promptName = "Design template",
  cancel = false;
page.on("dialog", (d) =>
  cancel ? d.dismiss() : d.accept(d.type() === "prompt" ? promptName : undefined),
);
const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const key = "sperin-certificates-data-v1";
const fixture = {
  id: "workflow",
  type: process.env.CERT_WORKFLOW_TYPE || "eic",
  number: "TEST-WORKFLOW",
  fields: {
    nominalVoltage: "230",
    clientName: "QA only",
    dbLocation: "Legacy location",
    dbSpd: "Legacy SPD",
    dbIpf: "9.99",
  },
  tables: {
    boards: [
      {
        ref: "CU1",
        location: "Intake cupboard",
        mainSwitch: "100A double pole isolator",
        rcd: "Type A RCBO 30mA",
        spd: "Type 2 - BS EN IEC 61643-11:2025+A11:2025",
        zdb: "0.18",
        ipf: "1.28",
        polarity: "Yes",
        phaseSequence: "N/A",
        spdOperational: "Yes",
        feedSourceType: "Mains",
        suppliedFrom: "Mains",
      },
    ],
    circuits: [0, 1, 2, 3, 7, 15].map((n) => ({
      boardRef: "CU1",
      circuitNo: n,
      description: "QA circuit " + n,
      ocpdBs: "BS EN 61009-1",
      ocpdType: "B",
      ocpdRating: n === 7 ? "40" : "32",
      liveCsa: n === 7 ? "10" : "2.5",
      cpcCsa: "1.5",
      wiringType: "Twin & earth (flat)",
      rcdType: "A",
      rcdIdn: "30",
      breakingCapacity: "6",
    })),
    tests: [0, 1, 2, 3, 7, 15].map((n) => ({
      boardRef: "CU1",
      circuitNo: n,
      zs: "0.42",
      r1r2: "0.24",
      r1: "0.4",
      rn: "0.4",
      r2: "0.7",
      irLL: "200",
      irLE: "200",
      irVoltage: "500",
      rcdTime: "24",
      polarity: "Pass",
    })),
  },
};
await page.goto(base);
await page.addInitScript(
  ({ key, fixture }) => {
    if (!sessionStorage.qaSeeded) {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ certificates: [fixture] }));
      sessionStorage.qaSeeded = "1";
    }
  },
  { key, fixture },
);
await page.reload();
await page.locator('[data-action="edit"]').first().click();
const saved = async () => {
  await page.waitForTimeout(350);
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).certificates[0], key);
};
const board = (ref) => page.locator(`[data-board-key="${ref}"]`);
const input = (col) => page.locator(`[data-circuit-input="details"][data-col="${col}"]`);
const click = async (sel) => {
  await page.locator(sel).first().click();
  await page.waitForTimeout(100);
};
const change = async (sel, value) => {
  const el = page.locator(sel);
  await el.fill(value);
  await el.dispatchEvent("change");
  await page.waitForTimeout(80);
};
assert.equal((await saved()).tables.boards[0].location, "Intake cupboard");
await board("CU1").locator('[data-action="circuit-open"]').last().click();
await input("ocpdRating").click();
assert(await input("ocpdRating").evaluate((el) => document.activeElement === el));
const combo = input("ocpdRating").locator("..");
await combo.locator(".combo-arrow").click();
assert(await input("ocpdRating").evaluate((el) => document.activeElement !== el));
assert.equal(await combo.locator(".combo-option:visible").count(), 14);
await combo.locator('[data-value="125"]').click();
assert.equal(await input("maxZs").inputValue(), "0.35");
await combo.locator(".combo-arrow").click();
await combo.locator('[data-value="16"]').click();
assert.equal(await input("maxZs").inputValue(), "2.73");
assert(await input("ocpdRating").evaluate((el) => document.activeElement !== el));
await combo.locator(".combo-arrow").click();
assert.equal(await combo.locator(".combo-option:visible").count(), 14);
await combo.locator('[data-value="32"]').click();
await input("maxZs").fill("9.99");
await click('[data-action="circuit-next"]');
for (const col of ["zs", "r1r2", "r1", "rn", "r2", "irLL", "irLE", "rcdTime"])
  assert(
    ["numeric", "decimal"].includes(
      await page
        .locator(`[data-circuit-input="tests"][data-col="${col}"]`)
        .getAttribute("inputmode"),
    ),
  );
await click('[data-action="circuit-prev"]');
assert.equal(await input("maxZs").inputValue(), "9.99");
await input("ocpdBs").fill("Other");
assert.equal(await input("maxZs").inputValue(), "");
await input("ocpdBs").fill("BS EN 61009-1");
assert.equal(await input("maxZs").inputValue(), "1.37");
await input("maxZs").fill("9.99");
await click('[data-action="circuit-list"]');
await change('[data-field="nominalVoltage"]', "240");
assert.equal(
  (await saved()).tables.circuits.find((c) => String(c.circuitNo) === "15").maxZs,
  "1.43",
);
await change('[data-field="nominalVoltage"]', "230");
await board("CU1").locator('[data-action="circuit-open"]').last().click();
await click('[data-action="circuit-next"]');
await click('[data-action="circuit-complete"]');
const rect = await board("CU1").locator("[data-board-add-circuit]").boundingBox();
assert(rect.y > 0 && rect.y + rect.height < 916);
for (let i = 0; i < 3; i++) {
  const row = board("CU1").locator(".circuit-card").filter({ hasText: "Circuit 15" });
  await row.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await row.locator('[data-action="circuit-move-up"]').click();
  await page.waitForTimeout(80);
  assert(Math.abs((await page.evaluate(() => scrollY)) - y) < 3);
}
assert.equal((await saved()).tables.circuits[2].circuitNo, "15");
await click('[data-action="edit-undo"]');
assert.equal((await saved()).tables.circuits[3].circuitNo, "15");
await click('[data-action="edit-redo"]');
assert.equal((await saved()).tables.circuits[2].circuitNo, "15");
await click('[data-action="board-add"]');
await page
  .locator('[data-board-index="1"][data-board-input="feedSourceType"]')
  .selectOption("Another consumer unit");
await page.locator('[data-board-index="1"][data-board-input="sourceBoardRef"]').selectOption("CU1");
assert.deepEqual(
  await page
    .locator('[data-board-index="1"][data-board-input="sourceCircuitNo"] option')
    .allTextContents(),
  ["Select…", "Circuit 0", "Circuit 1", "Circuit 15", "Circuit 2", "Circuit 3", "Circuit 7"],
);
await page.locator('[data-board-index="1"][data-board-input="sourceCircuitNo"]').selectOption("7");
let cert = await saved(),
  child = cert.tables.boards[1],
  incoming = cert.tables.circuits.findIndex((c) => c.boardRef === child.ref && c.circuitNo === "0");
assert(incoming >= 0);
assert.equal(cert.tables.circuits[incoming].liveCsa, "10");
assert(!cert.tables.tests[incoming].zs);
assert.equal(child.sourceCircuitNo, "7");
// Measured incoming readings belong to the selected feed. Changing that feed must clear them.
await board(child.ref).locator('[data-action="circuit-open"]').first().click();
await click('[data-action="circuit-next"]');
await page.locator('[data-circuit-input="tests"][data-col="zs"]').fill("0.88");
await click('[data-action="circuit-complete"]');
assert.equal((await saved()).tables.tests.find((t) => t._incomingFeed).zs, "0.88");
await page.locator('[data-board-index="1"][data-board-input="sourceCircuitNo"]').selectOption("3");
cert = await saved();
incoming = cert.tables.circuits.findIndex((c) => c.boardRef === child.ref && c.circuitNo === "0");
assert.equal(cert.tables.boards[1].sourceCircuitNo, "3");
assert.equal(cert.tables.tests[incoming].zs || "", "");
await page.locator('[data-board-index="1"][data-board-input="sourceCircuitNo"]').selectOption("7");
cert = await saved();
incoming = cert.tables.circuits.findIndex((c) => c.boardRef === child.ref && c.circuitNo === "0");
assert.equal(cert.tables.circuits[incoming].liveCsa, "10");
assert.equal(cert.tables.tests[incoming].zs || "", "");
await board("CU1").locator('[data-action="board-delete"]').click();
assert.equal((await saved()).tables.boards.length, 2);
await board("CU1")
  .locator(".circuit-card")
  .filter({ hasText: "Circuit 7" })
  .locator('[data-action="circuit-open"]')
  .click();
await input("ocpdRating").fill("50");
await click('[data-action="circuit-list"]');
cert = await saved();
assert.equal(cert.tables.circuits.find((c) => c._incomingFeed).ocpdRating, "50");
// A manual incoming-circuit limit survives unrelated edits, but changes with its source device.
await board(child.ref).locator('[data-action="circuit-open"]').first().click();
assert.equal(await input("ocpdRating").getAttribute("readonly"), "");
await input("maxZs").fill("1.11");
await click('[data-action="circuit-list"]');
assert.equal((await saved()).tables.circuits.find((c) => c._incomingFeed).maxZs, "1.11");
await page.reload();
assert.equal((await saved()).tables.circuits.find((c) => c._incomingFeed).maxZs, "1.11");
await board("CU1")
  .locator(".circuit-card")
  .filter({ hasText: "Circuit 7" })
  .locator('[data-action="circuit-open"]')
  .click();
await input("ocpdRating").fill("40");
await click('[data-action="circuit-list"]');
assert.equal((await saved()).tables.circuits.find((c) => c._incomingFeed).maxZs, "1.09");
promptName = "Domestic RCBO + SPD";
await board("CU1").locator('[data-action="template-save-board"]').click();
await click('[data-action="template-open"][data-kind="board"]');
fs.mkdirSync("certificate-android/qa-output/visual", { recursive: true });
await page.screenshot({ path: "certificate-android/qa-output/visual/template-picker.png", fullPage: true });
await click('[data-action="template-use"]');
cert = await saved();
assert.equal(cert.tables.boards.length, 3);
const templated = cert.tables.boards[2];
assert.notEqual(templated.ref, child.ref);
assert.equal(templated.rcd, cert.tables.boards[0].rcd);
for (const k of [
  "zdb",
  "ipf",
  "polarity",
  "phaseSequence",
  "spdOperational",
  "location",
  "sourceBoardRef",
  "sourceCircuitNo",
])
  assert(!templated[k], k + " copied into board template");
for (const [i, c] of cert.tables.circuits.entries())
  if (c.boardRef === templated.ref) {
    assert(!cert.tables.tests[i].zs);
    assert(!cert.tables.tests[i].r1r2);
  }
await board("CU1").locator('[data-action="circuit-open"]').first().click();
promptName = "32A ring";
await click('[data-action="template-save-circuit"]');
await click('[data-action="circuit-list"]');
await board(child.ref).locator('[data-action="template-open"]').click();
await click('[data-action="template-use"]');
assert.equal(await input("circuitNo").inputValue(), "1");
assert.equal(await input("boardRef").inputValue(), child.ref);
await click('[data-action="circuit-next"]');
assert.equal(await page.locator('[data-col="zs"]').inputValue(), "");
await click('[data-action="circuit-complete"]');
await page.waitForTimeout(100);
const addCircuitBox = await board(child.ref).locator('[data-board-add-circuit]').boundingBox();
assert(addCircuitBox, "Add circuit button missing after completing circuit");
const viewport = page.viewportSize();
assert(
  addCircuitBox.y + addCircuitBox.height <= viewport.height - 72,
  "Add circuit button is obscured by the fixed save bar",
);
await board(child.ref).screenshot({ path: "certificate-android/qa-output/visual/consumer-unit.png" });
await page.screenshot({ path: "certificate-android/qa-output/visual/grouped-workflow.png", fullPage: true });
// Reload durability, template backup/export and import through the app's public import bridge.
await page.reload();
cert = await saved();
assert.equal(cert.tables.boards.length, 3);
assert.equal(
  cert.tables.circuits.filter((c) => c.boardRef === child.ref && c.circuitNo === "0").length,
  1,
);
const templates = await page.evaluate(() => ({
  board: JSON.parse(localStorage.getItem("sperin-certificates-board-templates-v1")),
  circuit: JSON.parse(localStorage.getItem("sperin-certificates-circuit-templates-v1")),
}));
assert.equal(templates.board.length, 1);
assert.equal(templates.circuit.length, 1);
// Backup must contain separate template collections, and restore must recover them.
await page.evaluate(() => {
  window.Android = {
    saveBackup: (data) => {
      window.qaBackup = data;
      return true;
    },
  };
});
await click('[data-action="backup"]');
await click('[data-action="recovery-confirm-next"]');
await click('[data-action="recovery-confirm-do"]');
const backup = await page.evaluate(() => window.qaBackup);
assert.equal(JSON.parse(backup).boardTemplates.length, 1);
assert.equal(JSON.parse(backup).circuitTemplates.length, 1);
await page.evaluate((backup) => {
  localStorage.removeItem("sperin-certificates-board-templates-v1");
  localStorage.removeItem("sperin-certificates-circuit-templates-v1");
  window.sperinRestoreBackup(backup);
}, backup);
await click('[data-action="edit"]');
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("sperin-certificates-board-templates-v1")).length,
  ),
  1,
);
// Older imports with no templates retain the existing template library.
await page.evaluate((backup) => {
  const old = JSON.parse(backup);
  delete old.boardTemplates;
  delete old.circuitTemplates;
  window.sperinRestoreBackup(JSON.stringify(old));
}, backup);
await click('[data-action="edit"]');
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("sperin-certificates-circuit-templates-v1")).length,
  ),
  1,
);
// Save actual PDF via native bridge stub; app still builds the real jsPDF document.
await page.evaluate(() => {
  window.Android = {
    savePdfBase64: (data, name) => {
      window.qaPdf = { data, name };
      return true;
    },
  };
});
await click('[data-action="pdf"]');
const pdf = await page.evaluate(() => window.qaPdf);
assert(pdf?.data);
fs.mkdirSync("certificate-android/qa-output", { recursive: true });
fs.writeFileSync(
  "certificate-android/qa-output/workflow.pdf",
  Buffer.from(pdf.data.split(",")[1], "base64"),
);
// Board delete cancellation, real removal, undo/redo and no resurrection on reload.
cancel = true;
await board(templated.ref).locator('[data-action="board-delete"]').click();
cancel = false;
assert.equal((await saved()).tables.boards.length, 3);
await board(templated.ref).locator('[data-action="board-delete"]').click();
assert.equal((await saved()).tables.boards.length, 2);
await click('[data-action="edit-undo"]');
assert.equal((await saved()).tables.boards.length, 3);
await click('[data-action="edit-redo"]');
await page.reload();
assert.equal((await saved()).tables.boards.length, 2);
// Delete circuit stays near its old neighbours.
const row = board("CU1").locator(".circuit-card").filter({ hasText: "Circuit 2" });
await row.scrollIntoViewIfNeeded();
const beforeY = await page.evaluate(() => scrollY);
await row.locator('[data-action="circuit-delete"]').click();
await page.waitForTimeout(100);
assert(Math.abs((await page.evaluate(() => scrollY)) - beforeY) < 3);
assert(!(await saved()).tables.circuits.some((c) => c.boardRef === "CU1" && c.circuitNo === "2"));
for (const kind of ["board", "circuit"]) {
  await click(`[data-action="template-open"][data-kind="${kind}"]`);
  promptName = "Renamed " + kind;
  await click('[data-action="template-rename"]');
  assert((await page.locator(".template-picker").innerText()).includes(promptName));
  await click('[data-action="template-delete"]');
  assert.equal(await page.locator('[data-action="template-use"]').count(), 0);
  await click('[data-action="close-modal"]');
}
// Deliberately empty board/circuit lists must remain empty after reload.
await page
  .locator(`[data-board-key="${child.ref}"] [data-board-input="feedSourceType"]`)
  .selectOption("Mains");
await board(child.ref).locator('[data-action="board-delete"]').click();
await board("CU1").locator('[data-action="board-delete"]').click();
await page.reload();
cert = await saved();
assert.equal(cert.tables.boards.length, 0);
assert.equal(cert.tables.circuits.length, 0);
assert.equal(cert.tables.tests.length, 0);
// Legacy header-only data must migrate into its named board, not a phantom DB1.
await page.evaluate(() =>
  window.sperinRestoreBackup(
    JSON.stringify({
      certificates: [
        {
          id: "legacy-header",
          type: "eic",
          fields: {
            dbReference: "CU9",
            dbLocation: "Legacy garage",
            distributionOcpd: "63A isolator",
            zdb: "0.27",
            dbIpf: "0.85",
            dbSpd: "Type 2",
            dbPolarity: "Pass",
          },
          tables: {
            circuits: [{ boardRef: "CU9", circuitNo: 0 }],
            tests: [{ boardRef: "CU9", circuitNo: 0, zs: "0.31" }],
          },
        },
      ],
    }),
  ),
);
await click('[data-action="edit"]');
cert = await saved();
assert.equal(cert.tables.boards.length, 1);
assert.equal(cert.tables.boards[0].ref, "CU9");
assert.equal(cert.tables.boards[0].location, "Legacy garage");
assert.equal(cert.tables.boards[0].zdb, "0.27");
assert.equal(await page.locator('[data-board-input="polarity"]').inputValue(), "Pass");
await change('[data-board-input="zdb"]', "");
await page.reload();
assert.equal((await saved()).tables.boards[0].zdb, "");
assert.deepEqual(errors, []);
console.log("WORKFLOW_E2E_PASS");
await browser.close();
