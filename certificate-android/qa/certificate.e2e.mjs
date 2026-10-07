import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.CERT_BASE_URL || "http://127.0.0.1:4173/certificates/";
const auditPass = process.env.CERT_AUDIT_PASS || "forward";
const certificateTypeOrders = {
  forward: ["eic", "eicr", "minor", "emergency", "smoke"],
  reverse: ["smoke", "emergency", "minor", "eicr", "eic"],
  mixed: ["minor", "smoke", "eic", "emergency", "eicr"],
};
const certificateTypeOrder = certificateTypeOrders[auditPass] || certificateTypeOrders.forward;
console.log("CERT_AUDIT_PASS:", auditPass, certificateTypeOrder.join(" > "));
const appSource = fs.readFileSync("public/certificates/app.js", "utf8");
const ietSource = fs.readFileSync("public/certificates/iet-forms.js", "utf8");
const javaSource = fs.readFileSync(
  "certificate-android/app/src/main/java/uk/co/sperinservices/certificates/MainActivity.java",
  "utf8",
);
const manifestSource = fs.readFileSync(
  "certificate-android/app/src/main/AndroidManifest.xml",
  "utf8",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Static route map: every rendered action must have a click handler.
const actions = [
  ...new Set(
    [...appSource.matchAll(/data-action="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((a) => !/[+'?]/.test(a)),
  ),
];
const handlers = [
  ...new Set([
    ...[...appSource.matchAll(/action === '([^']+)'/g)].map((m) => m[1]),
    ...[...appSource.matchAll(/action==='([^']+)'/g)].map((m) => m[1]),
  ]),
];
const missingActions = actions.filter((a) => !handlers.includes(a));
const dynamicActions = ["site-read-plan", "site-scan-plan", "sheet-read-start", "sheet-read-stop"];
const missingDynamic = dynamicActions.filter((a) => !handlers.includes(a));
assert(missingActions.length === 0, "Missing action handlers: " + missingActions.join(", "));
assert(
  missingDynamic.length === 0,
  "Missing dynamic action handlers: " + missingDynamic.join(", "),
);
assert(!appSource.includes('data-action="circuit-copy"'), "Copy Details button must be removed");
assert(
  appSource.includes("SperinIetForms.build"),
  "Certificate app is not using the shared IET-style renderer",
);
assert(
  ietSource.includes("orientation:cert.type==='eic'?'landscape':'portrait'"),
  "EIC certificate renderer must start on landscape A4",
);
assert(ietSource.includes("function pdfText"), "PDF glyph-safety normalizer missing");
assert(ietSource.includes("MARK ONE BOX WITH X"), "Worksheet X-mark instruction missing");
assert(ietSource.includes("SPERIN SHEET"), "Machine-readable site sheet footer ID missing");
assert(
  !ietSource.includes("cols.map(c=>c[0]+' '+c[1])"),
  "Circuit schedule column numbers were reintroduced",
);
assert(
  !ietSource.includes("tcols.map(c=>c[0]+' '+c[1])"),
  "Test schedule column numbers were reintroduced",
);
assert(
  !ietSource.includes("Outcome ✓ / N/A"),
  "Unsupported check glyph remains in printed inspection heading",
);
assert(
  appSource.includes("Installation inspection checklist"),
  "Detailed EIC inspection checklist missing",
);
assert(
  appSource.includes('data-action="rapid-sheet">Site sheet'),
  "Site sheet action label missing",
);
assert(appSource.includes('data-action="rapid-entry">Voice'), "Voice action label missing");
assert(appSource.includes("prepareBackupData"), "Validated backup import staging missing");
assert(
  appSource.includes("normaliseBoardKey"),
  "Per-board circuit numbering normalisation missing",
);
assert(
  appSource.includes("scheduleNativeAutoBackup"),
  "Rolling recovery backup scheduling missing",
);
assert(javaSource.includes("createPrintDocumentAdapter"), "Native Android print route missing");
assert(javaSource.includes("showFileNotification"), "PDF notification route missing");
assert(javaSource.includes("restoreLatestBackup"), "Automatic restore route missing");
assert(javaSource.includes("shareBackup"), "Backup sharing route missing");
assert(javaSource.includes("sperinHandleBack"), "Android back bridge missing");
assert(manifestSource.includes("POST_NOTIFICATIONS"), "Notification permission missing");
assert(manifestSource.includes("FileProvider"), "FileProvider missing");
assert(appSource.includes("Blank Site Sheets"), "Blank Site Sheets workflow missing");
assert(appSource.includes("Read Completed Site Sheet"), "Fixed-order site-sheet readback missing");
assert(appSource.includes("Scan Completed Sheets"), "Photo site-sheet workflow missing");
assert(appSource.includes("validationWarnings"), "Technical warning engine missing");
assert(appSource.includes("tneCpc"), "Twin & earth CPC derivation missing");
assert(javaSource.includes("TextRecognition.getClient"), "Bundled ML Kit text recognition missing");
assert(javaSource.includes("captureAndScanSheet"), "Native camera sheet scan missing");
assert(javaSource.includes("scanSheetImageBase64"), "Gallery/base64 sheet scan missing");
assert(javaSource.includes("saveAutoBackup"), "Native rolling recovery backup bridge missing");
assert(javaSource.includes("auto-latest.json"), "Native automatic latest backup missing");
assert(
  !javaSource.includes("recoverChamberlainFromWebViewStorage"),
  "Retired Chamberlain auto-recovery code is still present",
);
assert(
  !javaSource.includes("exportForensicRecoveryBundle"),
  "Retired forensic export still runs in production",
);

const jsBridgeCalls = [
  ...new Set([...appSource.matchAll(/window\.Android\.([A-Za-z0-9_]+)/g)].map((m) => m[1])),
].sort();
const nativeBridgeMethods = [
  ...new Set(
    [
      ...javaSource.matchAll(/@JavascriptInterface\s+public\s+[\w<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(/g),
    ].map((m) => m[1]),
  ),
].sort();
const missingNativeBridge = jsBridgeCalls.filter((name) => !nativeBridgeMethods.includes(name));
assert(
  missingNativeBridge.length === 0,
  "JavaScript calls missing native Android methods: " + missingNativeBridge.join(", "),
);
console.log("STATIC_ROUTE_NATIVE_PASS");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });

await context.addInitScript(() => {
  const cert = {
    id: "legacy-eic-1",
    type: "eic",
    number: "SS-EIC-LEGACY-001",
    status: "Draft",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    fields: {
      clientName: "Jane Smith",
      clientAddress:
        "Flat 12, Long Client Address House\n145 Very Long Client Street\nKings Heath\nBirmingham",
      clientPostcode: "B14 7AA",
      installationAddress: "33 Chamberlain Road\nKings Heath\nBirmingham\nWest Midlands",
      installationPostcode: "B13 0AA",
      description:
        "Install new 15 way RCBO SPD consumer unit. Install new cooker circuit using 10mm2 cable. Alter kitchen socket circuit. Complete inspection, testing, labelling and certification. LONG DESCRIPTION END.",
      extent:
        "Fixed wiring, new consumer unit, new cooker circuit and the altered kitchen circuit, including all associated inspection and testing. EXTENT END.",
      workType: "Alteration to existing installation",
      issueDate: "2026-10-01",
      signatoryMode: "One person — design, construction & inspection",
      singleSignatoryName: "Augustine Sperin",
      singleSignatoryCompany: "Sperin Services",
      singleSignatoryAddress: "18 Dawson Street\nSmethwick\nWest Midlands",
      singleSignatoryPostcode: "B66 4JB",
      singleSignatoryPhone: "07817360156",
      singleSignatorySignature: "Augustine Sperin",
      singleSignatoryDate: "2026-10-01",
      designDepartures: "None",
      constructionDepartures: "None",
      inspectionDepartures: "None",
      permittedExceptions: "N/A",
      riskAssessmentAttached: "No",
      nextInspectionInterval: "10 years",
      earthingArrangement: "TN-S",
      liveConductors: "1-phase, 2-wire",
      supplyACDC: "AC",
      nominalVoltage: "230",
      frequency: "50",
      ipf: "2.10",
      ze: "0.13",
      supplyDeviceBs: "BS 88-2",
      supplyDeviceType: "BS 88 fuse",
      supplyDeviceRating: "80",
      supplyBreakingCapacity: "Other",
      supplyPolarity: "Yes",
      otherSources: "No",
      meansOfEarthing: "Distributor",
      maximumDemand: "60",
      maximumDemandUnit: "A",
      earthingConductorMaterial: "Copper",
      earthingConductorCsa: "16",
      earthingContinuity: "Yes",
      bondingMaterial: "Copper",
      bondingCsa: "10",
      bondingContinuity: "Yes",
      bondingTo: "Water and Gas",
      mainSwitchLocation: "Garage",
      mainSwitchBs: "60947-3",
      mainSwitchPoles: "2",
      mainSwitchCurrent: "100",
      mainSwitchVoltage: "230",
      mainSwitchDeviceType: "BS 88 fuse",
      mainSwitchBreaking: "Other",
      mainRcdType: "N/A",
      existingComments: "Circuits tested well and decently segregated.",
    },
    tables: {
      boards: [
        {
          ref: "DB1",
          location: "Lean To",
          suppliedFrom: "Main intake",
          mainSwitch: "BS 88 80A",
          rcd: "RCBO board",
          spd: "Type 2",
          zdb: "0.13",
          ipf: "2.10",
          polarity: "Pass",
          phaseSequence: "N/A",
          spdOperational: "Pass",
        },
      ],
      circuits: [
        {
          boardRef: "DB 1",
          circuitNo: "1",
          description: "Lighting",
          wiringType: "Twin & earth (flat)",
          installMethod: "Surface trunking on masonry wall",
          refMethod: "B",
          points: "8",
          liveCsa: "1.5",
          cpcCsa: "1",
          ocpdBs: "BS EN 60898-1",
          ocpdType: "B",
          ocpdRating: "6",
          breakingCapacity: "6",
          maxZs: "7.28",
          rcdBs: "BS EN 61009-1",
          rcdType: "A",
          rcdIdn: "30",
          rcdRating: "6",
        },
        {
          boardRef: "db1",
          circuitNo: "2",
          description: "Sockets",
          wiringType: "Twin & earth (flat)",
          installMethod: "Concealed in wall",
          refMethod: "C",
          points: "10",
          liveCsa: "2.5",
          cpcCsa: "1.5",
          ocpdBs: "BS EN 60898-1",
          ocpdType: "B",
          ocpdRating: "32",
          breakingCapacity: "6",
          maxZs: "1.37",
          rcdBs: "BS EN 61009-1",
          rcdType: "A",
          rcdIdn: "30",
          rcdRating: "32",
        },
      ],
      tests: [
        {
          boardRef: "DB1",
          circuitNo: "1",
          r1: "0.12",
          rn: "0.12",
          r2: "0.20",
          r1r2: "0.32",
          irVoltage: "500",
          irLL: "200",
          irLE: "200",
          polarity: "Pass",
          zs: "1.11",
          rcdTime: "24",
          rcdButton: "Pass",
          afddButton: "N/A",
          remarks: "Lighting test row complete",
        },
        {
          boardRef: "DB1",
          circuitNo: "2",
          r1: "0.08",
          rn: "0.08",
          r2: "0.15",
          r1r2: "0.23",
          irVoltage: "500",
          irLL: "200",
          irLE: "200",
          polarity: "Pass",
          zs: "0.22",
          rcdTime: "21",
          rcdButton: "Pass",
          afddButton: "N/A",
          remarks: "Sockets test row complete",
        },
      ],
      eicInspection: [
        {
          item: "1.0",
          description: "Condition of consumer’s intake equipment (visual inspection only)",
          outcome: "✓",
        },
        {
          item: "2.0",
          description: "Parallel or switched alternative sources of supply",
          outcome: "N/A",
        },
      ],
    },
  };
  const settings = {
    companyName: "Sperin Services",
    engineerName: "Gus Tester",
    engineerPosition: "Electrician / Inspector",
    address: "10 Business Road\nBirmingham",
    postcode: "B1 1AA",
    phone: "0121 000 0000",
    email: "test@example.com",
    registration: "",
    qualification: "C&G 2391 / 18th Edition",
    testerMake: "Megger",
    testerModel: "MFT-X1",
    testerSerial: "ABC123",
    postcodeApiKey: "ak_test",
  };
  localStorage.setItem("sperin-certificates-data-v1", JSON.stringify({ certificates: [cert] }));
  localStorage.setItem("sperin-certificates-settings-v1", JSON.stringify(settings));
});

const page = await context.newPage();
const errors = [];
const dialogs = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("dialog", async (d) => {
  dialogs.push(d.message());
  console.log("DIALOG:", d.message());
  await d.dismiss();
});
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("console: " + msg.text());
});

await page.addInitScript(() => {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = String(typeof input === "string" ? input : input?.url || "");
    if (url.includes("api.ideal-postcodes.co.uk/v1/postcodes/")) {
      window.__postcodeLookupHits = (window.__postcodeLookupHits || 0) + 1;
      return new Response(
        JSON.stringify({
          result: [
            {
              line_1: "1 Test Road",
              line_2: "Edgbaston",
              line_3: "",
              post_town: "Birmingham",
              county: "West Midlands",
              postcode: "B1 1AA",
            },
            {
              line_1: "2 Test Road",
              line_2: "Edgbaston",
              line_3: "",
              post_town: "Birmingham",
              county: "West Midlands",
              postcode: "B1 1AA",
            },
          ],
          code: 2000,
          message: "Success",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return realFetch(input, init);
  };
});

await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".saved-cert-row");

assert((await page.locator(".home-hero").count()) === 1, "Premium home hero missing");
assert(
  (await page.locator(".home-hero h2").textContent()).includes(
    "Professional electrical certification",
  ),
  "Home heading unclear",
);
assert((await page.locator(".home-visual").count()) === 1, "Home visual treatment missing");
assert((await page.locator(".cert-launch").count()) === 5, "Certificate launch list incomplete");
assert(
  (await page.locator(".workflow-card").count()) === 3,
  "Site field workflow must show blank sheets, voice readback and photo scan",
);
assert(
  (await page.locator(".site-workflow").textContent()).includes("Paper, voice or camera"),
  "Site field workflow explanation missing",
);

const saved = page.locator(".saved-cert-row").first();
const savedText = await saved.textContent();
assert(savedText.includes("Jane Smith"), "Saved row must show customer name");
assert(savedText.includes("33 Chamberlain Road"), "Saved row must show address");
assert(savedText.includes("01/10/2026"), "Saved row must show date");

// Whole row opens the saved certificate.
await saved.locator(".saved-cert-copy").click();
await page.waitForSelector(".form-head");
assert(
  (await page.locator(".form-title h2").textContent()).includes(
    "Electrical Installation Certificate",
  ),
  "Saved certificate did not open",
);
assert((await page.locator(".app-error").count()) === 0, "Legacy certificate hit render error");

// Compact field actions must stay obvious without icon-only controls.
assert(
  (await page.getByRole("button", { name: "Voice", exact: true }).count()) === 1,
  "Voice button missing",
);
assert(
  (await page.getByRole("button", { name: "Site sheet", exact: true }).count()) === 1,
  "Site sheet button missing",
);
const explainer = await page.locator(".entry-tools-explainer").textContent();
assert(explainer.includes("adds to long answers"), "Voice append explanation missing");
assert(explainer.includes("matches the issued PDF"), "Site-sheet explanation missing");

// One-tap field helpers: same-client, bonding and signatory mode.
await page.locator('[data-field="clientAddress"]').fill("1 Copy Road\nBirmingham");
await page.locator('[data-field="clientPostcode"]').fill("B1 2AA");
await page.locator('[data-action="copy-client-installation"]').click();
assert(
  (await page.locator('[data-field="installationAddress"]').inputValue()) ===
    "1 Copy Road\nBirmingham",
  "Same-as-client did not copy the address",
);
assert(
  (await page.locator('[data-field="installationPostcode"]').inputValue()) === "B1 2AA",
  "Same-as-client did not copy the postcode",
);

const bondingField = page.locator('[data-field="bondingTo"]');
await page.locator('[data-action="bonding-toggle"][data-value="Gas"]').click();
assert((await bondingField.inputValue()) === "Water", "Gas bonding toggle did not remove Gas");
await page.locator('[data-action="bonding-toggle"][data-value="Gas"]').click();
assert(
  (await page.locator('[data-field="bondingTo"]').inputValue()).includes("Gas"),
  "Gas bonding toggle did not restore Gas",
);

await page.locator('[data-action="signatory-mode"]').filter({ hasText: "Separate people" }).click();
assert(
  (await page.locator('[data-field="designer1"]').count()) === 1,
  "Separate designer fields missing",
);
assert(
  (await page.locator('[data-field="singleSignatoryName"]').count()) === 0,
  "Single signatory fields remained visible in separate mode",
);
await page.locator('[data-action="signatory-mode"]').filter({ hasText: "One person" }).click();
assert(
  (await page.locator('[data-field="singleSignatoryName"]').count()) === 1,
  "One-person signatory fields did not return",
);
console.log("QUICK_ENTRY_CONTROLS_PASS");

// Detailed EIC inspection checklist must be present and legacy row preserved.
const inspection = page
  .locator(".form-section")
  .filter({ hasText: "Installation inspection checklist" });
assert((await inspection.count()) === 1, "EIC inspection checklist section missing");
const inspectionRows = inspection.locator(".inspection-row");
assert((await inspectionRows.count()) >= 14, "EIC model-form inspection schedule is incomplete");
assert(
  (await inspection.textContent()).includes("Automatic Disconnection of Supply"),
  "IET EIC inspection categories missing",
);
assert(
  (await inspection.textContent()).includes("Prosumer"),
  "IET EIC inspection categories incomplete",
);
assert(
  (await inspection.locator('[data-action="inspection-outcome"]').count()) >= 42,
  "Direct tick/cross/N/A inspection buttons missing",
);
await inspection.locator('[data-action="inspection-bulk"][data-value="✓"]').click();
const inspectionStored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  inspectionStored.certificates?.[0]?.tables?.eicInspection?.every((r) => r.outcome === "✓"),
  "Apply-all tick control did not update the inspection schedule",
);
await inspection.locator('[data-action="inspection-bulk"][data-value="N/A"]').click();
let inspectionStored2 = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  inspectionStored2.certificates?.[0]?.tables?.eicInspection?.every((r) => r.outcome === "N/A"),
  "Apply-all N/A control did not update the inspection schedule",
);
await inspection
  .locator('[data-action="inspection-outcome"][data-row="0"][data-value="✕"]')
  .click();
inspectionStored2 = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  inspectionStored2.certificates?.[0]?.tables?.eicInspection?.[0]?.outcome === "✕",
  "Direct inspection cross control did not save",
);
await inspection.locator('[data-action="inspection-bulk"][data-value="✓"]').click();
console.log("INSPECTION_DIRECT_CONTROLS_PASS");

// Postcode-first address lookup.
const postcode = page.locator('[data-field="installationPostcode"]');
assert((await postcode.count()) === 1, "Installation postcode field missing");
await postcode.fill("b11aa");
await page
  .locator('[data-action="postcode-find"][data-postcode-key="installationPostcode"]')
  .click();
await page.waitForTimeout(700);
const lookupHit = await page.evaluate(() => window.__postcodeLookupHits || 0);
console.log("LOOKUP_HITS:", lookupHit);
console.log("LOOKUP_DIALOGS:", JSON.stringify(dialogs));
console.log("POSTCODE_MODAL_COUNT:", await page.locator(".postcode-backdrop").count());
console.log("POSTCODE_BUTTON_COUNT:", await page.locator(".postcode-result").count());
assert(lookupHit > 0, "Postcode button did not issue an address lookup request");
assert(
  (await page.locator(".postcode-result").count()) > 0,
  "Postcode request returned but address selector did not render",
);
await page.locator(".postcode-result").first().click();
assert(
  (await page.locator('[data-field="installationAddress"]').inputValue()).includes("\n"),
  "Selected address is not formatted on separate lines",
);
assert(
  (await page.locator('[data-field="installationPostcode"]').inputValue()) === "B1 1AA",
  "Postcode not formatted correctly",
);
console.log("POSTCODE_LOOKUP_PASS");

// Autosave typed/dropdown.
await page.locator('[data-field="clientName"]').fill("Jane Smith Updated");
await page.waitForTimeout(450);
let stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  stored.certificates?.[0]?.fields?.clientName === "Jane Smith Updated",
  "Typed field did not autosave",
);
await page.locator('[data-field="nominalVoltage"]').selectOption("230/400");
await page.waitForTimeout(80);
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(stored.certificates?.[0]?.fields?.nominalVoltage === "230/400", "Dropdown did not autosave");
console.log("AUTOSAVE_PASS");

// Circuit list: no copy-details, duplicate/delete present, reorder works.
const circuitList = page.locator(".circuit-list");
assert((await circuitList.count()) === 1, "Circuit schedule missing");
assert(
  (await circuitList.locator('[data-action="circuit-copy"]').count()) === 0,
  "Copy Details still present",
);
assert(
  (await circuitList.locator('[data-action="circuit-duplicate"]').count()) >= 1,
  "Duplicate circuit missing",
);
assert(
  (await circuitList.locator('[data-action="circuit-delete"]').count()) >= 1,
  "Delete circuit missing",
);
assert(
  (await circuitList.locator('[data-action="circuit-move-down"]').count()) >= 1,
  "Circuit move-down control missing",
);

const beforeOrder = await page.locator(".circuit-card .circuit-main").allTextContents();
assert(
  beforeOrder[0].includes("Lighting") && beforeOrder[1].includes("Sockets"),
  "Initial circuit order wrong",
);
await page.locator('[data-action="circuit-move-down"]').first().click();
await page.waitForTimeout(60);
const afterOrder = await page.locator(".circuit-card .circuit-main").allTextContents();
assert(
  afterOrder[0].includes("Sockets") &&
    afterOrder[0].includes("Zs 0.22") &&
    afterOrder[1].includes("Lighting") &&
    afterOrder[1].includes("Zs 1.11"),
  "Circuit reorder failed or test rows were not kept with their circuits",
);

// Open reordered B32 circuit and verify max Zs, next/back save and return position.
await page.locator(".circuit-card").first().locator('[data-action="circuit-open"]').click();
await page.waitForSelector('[data-circuit-input="details"][data-col="ocpdRating"]');
await page.waitForTimeout(40);
const maxZs = await page.locator('[data-circuit-input="details"][data-col="maxZs"]').inputValue();
assert(maxZs === "1.37", "B32 automatic max Zs should be 1.37 Ω, got " + maxZs);
await page.locator('[data-circuit-input="details"][data-col="maxZs"]').fill("9.99");
await page.locator('[data-action="circuit-recalc"]').click();
assert(
  (await page.locator('[data-circuit-input="details"][data-col="maxZs"]').inputValue()) === "1.37",
  "Recalculate did not restore the automatic maximum Zs",
);
await page.locator('[data-action="circuit-next"]').click();
assert(
  (await page.locator(".eyebrow").first().textContent()).includes("2 of 2"),
  "Circuit Next failed",
);
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(Array.isArray(stored.certificates?.[0]?.tables?.circuits), "Circuit Next failed to save");
await page.locator('[data-action="circuit-prev"]').click();
assert(
  (await page.locator(".eyebrow").first().textContent()).includes("1 of 2"),
  "Circuit Back failed",
);
await page.locator('[data-action="circuit-list"]').first().click();
await page.waitForSelector(".circuit-list");
await page.waitForTimeout(80);
const circuitTop = await page
  .locator(".circuit-list")
  .evaluate((el) => el.getBoundingClientRect().top);
assert(
  circuitTop >= -10 && circuitTop < 190,
  "Saving circuit should return to circuit schedule, top=" + circuitTop,
);
console.log("CIRCUIT_FLOW_PASS");

// Circuit numbers should drive the normal schedule order without losing paired test results.
// Set the Lighting circuit to 0 and confirm it moves ahead of circuit 2 automatically.
await page
  .locator(".circuit-card")
  .filter({ hasText: "Lighting" })
  .locator('[data-action="circuit-open"]')
  .click();
await page.waitForSelector('[data-circuit-input="details"][data-col="circuitNo"]');
const zeroNo = page.locator('[data-circuit-input="details"][data-col="circuitNo"]');
await zeroNo.fill("0");
await zeroNo.press("Tab");
await page.waitForTimeout(100);
await page.locator('[data-action="circuit-list"]').first().click();
await page.waitForSelector(".circuit-list");
const autoSorted = await page.locator(".circuit-card .circuit-main").allTextContents();
assert(
  autoSorted[0].includes("Circuit 0") &&
    autoSorted[0].includes("Lighting") &&
    autoSorted[0].includes("Zs 1.11"),
  "Circuit 0 did not auto-sort to the first position with its test results",
);
assert(
  autoSorted[1].includes("Circuit 2") &&
    autoSorted[1].includes("Sockets") &&
    autoSorted[1].includes("Zs 0.22"),
  "Automatic circuit sort separated circuit details from test results",
);
console.log("CIRCUIT_AUTOSORT_PASS");

// Rotation/reload must preserve the active certificate, circuit page and autosaved data.
await page.locator(".circuit-card").first().locator('[data-action="circuit-open"]').click();
await page.locator('[data-action="circuit-next"]').click();
const rotationField = page.locator('[data-circuit-input="tests"][data-col="r2only"]');
await rotationField.fill("0.20");
await page.waitForTimeout(450);
await page.setViewportSize({ width: 844, height: 390 });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-circuit-input="tests"][data-col="r2only"]');
assert(
  (await page.locator('[data-circuit-input="tests"][data-col="r2only"]').inputValue()) === "0.20",
  "Reload/rotation lost the active circuit test value",
);
assert(
  (await page.locator(".eyebrow").first().textContent()).includes("2 of 2"),
  "Reload/rotation did not keep the circuit test page",
);
assert(
  (await page.locator(".form-title h2").textContent()).includes("Circuit 0"),
  "Reload/rotation changed the active circuit",
);
await page.locator('[data-action="circuit-list"]').first().click();
await page.waitForSelector(".circuit-list");
const landscapeOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
assert(
  landscapeOverflow <= 2,
  "Landscape certificate page overflows horizontally by " + landscapeOverflow,
);
await page.setViewportSize({ width: 390, height: 844 });
const mobileOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
assert(mobileOverflow <= 2, "Mobile certificate page overflows horizontally by " + mobileOverflow);
const inspectionRight = await page
  .locator(".inspection-section")
  .evaluate((el) => el.getBoundingClientRect().right);
assert(inspectionRight <= 392, "Inspection checklist extends beyond the mobile page");
await page.setViewportSize({ width: 1280, height: 900 });
console.log("ROTATION_RELOAD_MOBILE_PASS");

// Restore deliberately long PDF values after the postcode lookup / circuit reorder tests.
await page
  .locator('[data-field="installationAddress"]')
  .fill(
    "33 Chamberlain Road\nKings Heath\nBirmingham\nWest Midlands\nLONG INSTALLATION ADDRESS END",
  );
await page.locator('[data-field="installationPostcode"]').fill("B13 0AA");
await page.waitForTimeout(80);

// PDF must be a real landscape PDF.
const pdfDownloadPromise = page.waitForEvent("download");
await page.locator('[data-action="pdf"]').first().click();
const pdfDownload = await pdfDownloadPromise;
const pdfPath = await pdfDownload.path();
assert(pdfPath && fs.existsSync(pdfPath), "PDF file missing");
const pdfBytes = fs.readFileSync(pdfPath);
assert(pdfBytes.subarray(0, 4).toString() === "%PDF", "PDF signature invalid");
const pdfText = pdfBytes.toString("latin1");
const media = pdfText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(media && Number(media[1]) > Number(media[2]), "EIC certificate first page is not landscape");
fs.mkdirSync("certificate-android/qa-output", { recursive: true });
fs.copyFileSync(pdfPath, "certificate-android/qa-output/eic-regression.pdf");
console.log("EIC_LANDSCAPE_PDF_PASS");

// Complete & PDF must create the file before the saved certificate is marked complete.
const completePdfPromise = page.waitForEvent("download");
await page.locator('[data-action="complete-pdf"]').click();
const completedPdf = await completePdfPromise;
assert((await completedPdf.path()) != null, "Complete & PDF did not create a PDF");
await page.waitForTimeout(80);
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  stored.certificates?.[0]?.status === "Complete",
  "Complete & PDF did not save Complete status",
);
await page.locator('[data-action="status"]').click();
await page.waitForTimeout(40);
console.log("COMPLETE_PDF_PASS");

// Printable worksheet must also download and be landscape.
const worksheetPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Site sheet", exact: true }).click();
const worksheet = await worksheetPromise;
assert(worksheet.suggestedFilename().includes("Site-Worksheet"), "Site worksheet filename unclear");
const worksheetPath = await worksheet.path();
const worksheetBytes = fs.readFileSync(worksheetPath);
const worksheetText = worksheetBytes.toString("latin1");
const worksheetMedia = worksheetText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(
  worksheetMedia && Number(worksheetMedia[1]) > Number(worksheetMedia[2]),
  "Site worksheet first page is not landscape like the certificate",
);

// Print browser fallback.
await page.evaluate(() => {
  window.__printCalled = false;
  window.print = () => {
    window.__printCalled = true;
  };
});
await page.locator('[data-action="print"]').click();
assert(
  await page.evaluate(() => window.__printCalled === true),
  "Print button did not invoke print route",
);
console.log("PRINT_PASS");

// App Back logic: circuit -> circuit list -> home, without exiting.
await page.locator(".circuit-card").first().locator('[data-action="circuit-open"]').click();
assert(
  (await page.evaluate(() => window.sperinHandleBack())) === true,
  "Back handler did not handle circuit page",
);
await page.waitForSelector(".circuit-list");
assert(
  (await page.evaluate(() => window.sperinHandleBack())) === true,
  "Back handler did not handle certificate page",
);
await page.waitForSelector(".home-page");
assert(
  (await page.evaluate(() => window.sperinHandleBack())) === false,
  "Back handler should only exit from home",
);
console.log("APP_BACK_PASS");

// Profile defaults and profile-backed tester fields.
await page.locator('[data-action="settings"]').first().click();
await page.waitForSelector(".profile-modal");
assert(
  (await page.locator('[data-setting="testerMake"]').inputValue()) === "Megger",
  "Tester make profile default missing",
);
assert(
  (await page.locator('[data-setting="testerModel"]').inputValue()) === "MFT-X1",
  "Tester model profile default missing",
);
assert(
  (await page.locator('[data-setting="postcodeApiKey"]').count()) === 1,
  "Postcode API profile setting missing",
);

// Closing Profile must discard unsaved edits.
await page.locator('[data-setting="testerMake"]').fill("UNSAVED TESTER");
await page.locator(".profile-modal").locator('[data-action="close-modal"]').click();
await page.locator('[data-action="settings"]').first().click();
await page.waitForSelector(".profile-modal");
assert(
  (await page.locator('[data-setting="testerMake"]').inputValue()) === "Megger",
  "Closing Profile without Save changed the in-memory defaults",
);
await page.locator('[data-action="save-settings"]').click();
await page.waitForTimeout(50);

// Start new EIC and verify tester defaults prefill.
await page.locator('button[data-action="new"][data-type="eic"]').click();
await page.waitForSelector('[data-field="testerMake"]');
assert(
  (await page.locator('[data-field="testerMake"]').inputValue()) === "Megger",
  "New certificate did not inherit tester make",
);
assert(
  (await page.locator('[data-field="testerModel"]').inputValue()) === "MFT-X1",
  "New certificate did not inherit tester model",
);
assert(
  (await page.locator('[data-field="testerSerial"]').inputValue()) === "ABC123",
  "New certificate did not inherit tester serial",
);

// Brand is a home button.
await page.locator(".brand-home").click();
await page.waitForSelector(".home-page");
console.log("PROFILE_HOME_PASS");

// Build a whole-certificate blank site pack with exactly two boards and 3 total circuit slots.
await page.locator('[data-action="site-builder"]').click();
await page.waitForSelector(".site-builder-modal");
await page.locator('[data-site-builder="name"]').fill("Test two-board EIC");
await page.locator('[data-site-board="0"][data-site-board-key="ref"]').fill("DB1");
await page.locator('[data-site-board="0"][data-site-board-key="location"]').fill("Main hall");
await page.locator('[data-site-board="0"][data-site-board-key="circuits"]').fill("2");
await page.locator('[data-action="site-board-add"]').click();
await page.locator('[data-site-board="1"][data-site-board-key="ref"]').fill("DB2");
await page.locator('[data-site-board="1"][data-site-board-key="location"]').fill("Garage");
await page.locator('[data-site-board="1"][data-site-board-key="circuits"]').fill("1");
await page.locator('[data-action="site-template-save"]').click();
let templates = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-site-sheet-templates-v1") || "[]"),
);
assert(
  templates.length === 1 && templates[0].boards.length === 2,
  "Site sheet template was not saved",
);

const sitePdfPromise = page.waitForEvent("download");
await page.locator('[data-action="site-generate"]').click();
const sitePdf = await sitePdfPromise;
const sitePdfPath = await sitePdf.path();
assert(sitePdfPath && fs.existsSync(sitePdfPath), "Configured blank site-sheet PDF missing");
const sitePdfBytes = fs.readFileSync(sitePdfPath);
assert(
  sitePdfBytes.subarray(0, 4).toString() === "%PDF",
  "Configured site sheet is not a real PDF",
);
const sitePdfText = sitePdfBytes.toString("latin1");
const siteMedia = sitePdfText.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)/);
assert(
  siteMedia && Number(siteMedia[1]) > Number(siteMedia[2]),
  "Configured site sheet first page is not landscape like the certificate",
);

let plans = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-site-sheets-v1") || "[]"),
);
assert(plans.length > 0, "Generated site sheet plan was not stored");
const plan = plans[0];
assert(
  plan.boards.length === 2 && plan.boards[0].circuits === 2 && plan.boards[1].circuits === 1,
  "Board/circuit quantities were not preserved in the site sheet plan",
);
assert(
  plan.descriptors.some((d) => d.kind === "field" && d.key === "clientName"),
  "Whole-certificate site sheet is missing general certificate fields",
);
assert(
  plan.descriptors.some((d) => d.table === "boards" && d.boardIndex === 1),
  "Whole-certificate site sheet is missing second board fields",
);
assert(
  plan.descriptors.some((d) => d.code === "B01C01-ZS"),
  "Circuit field codes are missing from generated site sheet",
);
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
const linked = stored.certificates.find((c) => c.siteSheetId === plan.id);
assert(linked, "Site sheet did not create a linked draft certificate");
assert(
  linked.tables.boards.length === 2 &&
    linked.tables.circuits.length === 3 &&
    linked.tables.tests.length === 3,
  "Linked draft did not get exact board/circuit counts",
);
console.log("CONFIGURABLE_SITE_SHEET_PASS");

// Read the completed sheet using printed headings. Field-first/value-second must map values to exact fields.
await page.locator('[data-action="site-read"]').click();
await page.waitForSelector(".sheet-picker");
await page.locator('[data-action="site-read-plan"][data-plan-id="' + plan.id + '"]').click();
await page.waitForSelector(".sheet-read-modal");
const spokenSheet = [
  "Circuit 1",
  "Description kitchen sockets",
  "Points 7",
  "Cable 2.5 twin and earth",
  "Installation surface trunking on masonry wall",
  "Reference method B",
  "Protective device 61009",
  "Curve B",
  "Rating 32",
  "RCD type type A",
  "I delta n 30",
  "Insulation test voltage 500",
  "Live to live 200",
  "Live to earth 200",
  "R1 plus R2 0.27",
  "Zs 0.36",
  "Polarity pass",
  "RCD time 23.9",
].join(". ");
await page.locator("[data-sheet-read-text]").fill(spokenSheet);
await page.locator('[data-action="sheet-read-process"]').click();
await page.waitForTimeout(120);
await page.locator('[data-action="sheet-read-open-cert"]').click();
await page.waitForSelector(".circuit-list");

stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
let linkedAfter = stored.certificates.find((c) => c.siteSheetId === plan.id);
assert(linkedAfter.tables.circuits[0].points === "7", "Voice readback put points in wrong field");
assert(
  linkedAfter.tables.circuits[0].liveCsa === "2.5",
  "Voice readback did not extract T&E live CSA",
);
assert(
  linkedAfter.tables.circuits[0].wiringType === "Twin & earth (flat)",
  "Voice readback did not identify twin & earth",
);
assert(
  linkedAfter.tables.circuits[0].cpcCsa === "1.5",
  "Standard 2.5 T&E CPC was not derived as 1.5 mm²",
);
assert(
  linkedAfter.tables.circuits[0].refMethod === "B",
  "Surface trunking on masonry wall did not map to Reference Method B",
);
assert(
  linkedAfter.tables.circuits[0].ocpdBs === "BS EN 61009-1",
  "61009 speech was not normalised",
);
assert(linkedAfter.tables.circuits[0].ocpdType === "B", "Breaker curve B was not kept separate");
assert(
  linkedAfter.tables.circuits[0].rcdType === "A",
  "RCD Type A was not kept separate from breaker curve",
);
assert(linkedAfter.tables.tests[0].r1r2 === "0.27", "R1+R2 value went to wrong field");
assert(linkedAfter.tables.tests[0].zs === "0.36", "Zs value went to wrong field");
assert(linkedAfter.tables.tests[0].rcdTime === "23.9", "RCD time went to wrong field");
assert(linkedAfter.autoMeta?.["circuit:0:cpcCsa"], "Derived CPC is not marked as auto-filled");
console.log("FIXED_ORDER_VOICE_READBACK_PASS");

// Technical values remain as entered and a warning triangle explains a failure instead of changing it.
await page.locator(".circuit-card").first().locator('[data-action="circuit-open"]').click();
await page.locator('[data-action="circuit-next"]').click();
await page.locator('[data-circuit-input="tests"][data-col="zs"]').fill("2.00");
await page.getByRole("button", { name: "Save circuit" }).click();
await page.waitForSelector(".validation-banner.warn");
assert(
  (await page.locator(".validation-banner.warn").textContent()).includes("need checking"),
  "Out-of-range Zs did not create a warning",
);
await page.locator(".validation-banner.warn").click();
await page.waitForSelector(".warning-modal");
assert(
  (await page.locator(".warning-modal").textContent()).includes("Zs exceeds configured maximum"),
  "Warning does not explain Zs issue",
);
await page.locator('.warning-modal [data-action="close-modal"]').click();
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
linkedAfter = stored.certificates.find((c) => c.siteSheetId === plan.id);
assert(
  linkedAfter.tables.tests[0].zs === "2.00",
  "Validation must never change the electrician's measured value",
);
console.log("TECHNICAL_WARNING_PASS");

// Feed a synthetic on-device OCR result through the exact photo-review path.
await page.locator(".brand-home").click();
await page.waitForSelector(".home-page");
await page.locator('[data-action="site-scan"]').click();
await page.waitForSelector(".sheet-picker");
await page.locator('[data-action="site-scan-plan"][data-plan-id="' + plan.id + '"]').click();
await page.waitForSelector(".sheet-scan-modal");
const zsDescriptor = plan.descriptors.find((d) => d.code === "B01C01-ZS");
assert(zsDescriptor, "Zs scan descriptor missing");
await page.evaluate(
  ({ id, pageNo }) => {
    window.sperinSheetScanResult(
      "",
      JSON.stringify({
        fullText:
          "SPERIN SHEET " +
          id +
          " PAGE " +
          pageNo +
          "\\nB01C01-ZS Zs 0.44\\nEarthing arrangement X TN-S",
        width: 2000,
        height: 1400,
        lines: [
          {
            text: "SPERIN SHEET " + id + " PAGE " + pageNo,
            left: 20,
            top: 20,
            right: 900,
            bottom: 60,
          },
          { text: "B01C01-ZS Zs 0.44", left: 50, top: 200, right: 700, bottom: 250 },
          { text: "Earthing arrangement", left: 50, top: 320, right: 420, bottom: 360 },
          { text: "X TN-S", left: 430, top: 320, right: 650, bottom: 360 },
        ],
      }),
      "",
    );
  },
  { id: plan.id, pageNo: zsDescriptor.page || 1 },
);
await page.waitForSelector(".scan-review-row");
assert(
  (await page.locator(".scan-summary").textContent()).includes("clear"),
  "Exact field-code OCR was not marked clear",
);
await page.locator('[data-action="scan-apply"]').click();
await page.waitForSelector(".circuit-list");
stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
linkedAfter = stored.certificates.find((c) => c.siteSheetId === plan.id);
assert(
  linkedAfter.tables.tests[0].zs === "0.44",
  "Photo scan did not apply Zs to the exact linked circuit",
);
assert(
  linkedAfter.fields.earthingArrangement === "TN-S",
  "Photo scan did not recognise the single X-marked multiple-choice option",
);
console.log("PHOTO_SCAN_MAPPING_PASS");

// On a multi-board certificate, Add circuit must continue the last board's numbering, not the global maximum.
await page.locator('[data-action="circuit-add"]').click();
await page.waitForSelector('[data-circuit-input="details"][data-col="circuitNo"]');
assert(
  (await page.locator('[data-circuit-input="details"][data-col="boardRef"]').inputValue()) ===
    "DB2",
  "Added circuit did not stay on the last distribution board",
);
assert(
  (await page.locator('[data-circuit-input="details"][data-col="circuitNo"]').inputValue()) === "2",
  "DB2 added circuit should be circuit 2 on DB2",
);
await page.locator('[data-action="circuit-list"]').first().click();
console.log("MULTIBOARD_NUMBERING_PASS");

// Backup browser fallback should create JSON.
const backupPromise = page.waitForEvent("download");
await page.locator('[data-action="backup"]').click();
const backupDownload = await backupPromise;
assert(backupDownload.suggestedFilename().endsWith(".json"), "Backup is not JSON");
console.log("BACKUP_PASS");

await page.locator(".brand-home").click();
await page.waitForSelector(".home-page");

// Import a valid exact backup, then Undo recovery back to the complete current device state.
const beforeImportRaw = await page.evaluate(
  () => localStorage.getItem("sperin-certificates-data-v1") || "",
);
const beforeImportState = JSON.parse(beforeImportRaw || "{}");
const importedCert = JSON.parse(JSON.stringify(beforeImportState.certificates[0]));
importedCert.id = "audit-imported-cert";
importedCert.number = "SS-EIC-AUDIT-IMPORT";
importedCert.fields.certificateNo = importedCert.number;
importedCert.fields.clientName = "Imported Audit Client";
const importPath = "certificate-android/qa-output/audit-valid-backup.json";
fs.mkdirSync("certificate-android/qa-output", { recursive: true });
fs.writeFileSync(
  importPath,
  JSON.stringify({
    version: "1.7.9",
    exportedAt: new Date().toISOString(),
    settings: { companyName: "Sperin Services" },
    certificates: [importedCert],
  }),
);
await page.evaluate(() => {
  window.confirm = () => true;
});
const importChooserPromise = page.waitForEvent("filechooser");
await page.locator('[data-action="import-backup"]').click();
const importChooser = await importChooserPromise;
await importChooser.setFiles(importPath);
await page.waitForSelector(".home-page");
await page.waitForTimeout(100);
let importedState = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  importedState.certificates?.length === 1 &&
    importedState.certificates[0].fields?.clientName === "Imported Audit Client",
  "Valid backup import did not replace state cleanly",
);

await page.locator('[data-action="settings"]').first().click();
await page.waitForSelector(".profile-modal");
await page.locator('[data-action="undo-restore"]').click();
await page.waitForSelector(".home-page");
await page.waitForTimeout(80);
let undoState = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  undoState.certificates?.some((cert) => cert.id === beforeImportState.certificates[0].id),
  "Undo recovery did not restore the pre-import certificates",
);
console.log("IMPORT_UNDO_PASS");

// A malformed/unsupported backup must be rejected before it can replace current state.
const beforeBadIds = undoState.certificates.map((cert) => cert.id).sort();
const badImportPath = "certificate-android/qa-output/audit-invalid-backup.json";
fs.writeFileSync(
  badImportPath,
  JSON.stringify({
    version: "broken",
    certificates: [{ id: "bad-cert", type: "not-a-certificate", fields: {}, tables: {} }],
  }),
);
const badChooserPromise = page.waitForEvent("filechooser");
await page.locator('[data-action="import-backup"]').click();
const badChooser = await badChooserPromise;
await badChooser.setFiles(badImportPath);
await page.waitForTimeout(120);
const afterBadState = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("sperin-certificates-data-v1") || "{}"),
);
assert(
  JSON.stringify(afterBadState.certificates.map((cert) => cert.id).sort()) ===
    JSON.stringify(beforeBadIds),
  "Invalid backup changed the saved certificate state",
);
console.log("INVALID_IMPORT_GUARD_PASS");

// Every certificate type must open, expose voice controls and generate a real PDF.
for (const type of certificateTypeOrder) {
  await page.locator('button[data-action="new"][data-type="' + type + '"]').click();
  await page.waitForSelector(".form-head");
  assert((await page.locator(".app-error").count()) === 0, type + " form hit render error");
  assert(
    (await page.locator('button[data-action="voice-one"]').count()) > 0,
    type + " form missing Speak controls",
  );
  if (type === "smoke") {
    const alarmRowsBefore = await page
      .locator('[data-table-input="alarms"][data-col="ref"]')
      .count();
    await page.locator('[data-action="row-add"][data-table="alarms"]').click();
    assert(
      (await page.locator('[data-table-input="alarms"][data-col="ref"]').count()) ===
        alarmRowsBefore + 1,
      "Smoke alarm Add row failed",
    );
    await page.locator('[data-action="row-delete"][data-table="alarms"]').last().click();
    assert(
      (await page.locator('[data-table-input="alarms"][data-col="ref"]').count()) ===
        alarmRowsBefore,
      "Smoke alarm Delete row failed",
    );
  }
  const typePdfPromise = page.waitForEvent("download");
  await page.locator('[data-action="pdf"]').first().click();
  const typePdf = await typePdfPromise;
  const typePdfPath = await typePdf.path();
  assert(typePdfPath && fs.existsSync(typePdfPath), type + " PDF was not created");
  assert(
    fs.readFileSync(typePdfPath).subarray(0, 4).toString() === "%PDF",
    type + " PDF signature invalid",
  );
  await page.locator(".brand-home").click();
  await page.waitForSelector(".home-page");
}
console.log("ALL_CERTIFICATE_TYPES_PASS");

assert(errors.length === 0, "Browser errors: " + errors.join(" | "));

console.log("CERTIFICATE_E2E_PASS");
console.log(
  JSON.stringify({
    routeMap: true,
    nativeHooks: true,
    premiumHome: true,
    legacyOpen: true,
    detailedInspection: true,
    postcodeLookup: true,
    autosave: true,
    circuitReorder: true,
    autoZsB32: maxZs,
    circuitReturnPosition: true,
    ietStylePdf: true,
    worksheet: true,
    print: true,
    appBack: true,
    profileDefaults: true,
    backup: true,
    configurableSiteSheets: true,
    fixedOrderVoiceReadback: true,
    photoScanMapping: true,
    technicalWarnings: true,
    allCertificateTypes: true,
  }),
);

await browser.close();
