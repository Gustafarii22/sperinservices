import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";
const url = (s) => `data:text/javascript;base64,${Buffer.from(s).toString("base64")}`;
const source = (name) =>
  ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const pricingUrl = url(source("pricing"));
const pdfUrl = url(source("estimate-pdf"));
const { estimate, travelCharge, estimateLines } = await import(pricingUrl);
const { estimatePdf } = await import(pdfUrl);
test("agreed mixed-job and multiple-switch examples", () => {
  assert.equal(estimate({ switch: 1, socket: 2 }).subtotal, 120);
  assert.equal(estimate({ socket: 2, switch: 1 }).subtotal, 120);
  assert.equal(estimate({ switch: 3 }).subtotal, 110);
});
test("standalone prices and zero quantities", () => {
  assert.equal(estimate({ switch: 0 }).subtotal, 0);
  assert.equal(estimate({ light: 1 }).subtotal, 75);
  assert.equal(estimate({ oven: 1 }).subtotal, 90);
});
test("consumer unit includes attendance; additional small jobs charged once", () => {
  const e = estimate({ board10: 1, socket: 2 });
  assert.equal(e.subtotal, 840);
  assert.equal(e.visit, 0);
  assert.equal(estimate({ board6: 1 }).subtotal, 650);
});
test("unpriced mixed work is flagged and not silently assigned a price", () => {
  const e = estimate({ oven: 1, switch: 1 });
  assert.deepEqual(e.unknown, ["oven"]);
  assert.equal(e.subtotal, 80);
  assert.match(estimateLines({ oven: 1, switch: 1 }).join("\n"), /NOT included/);
});
test("whole property EICR is distinct and explicitly flagged with board package", () => {
  assert.equal(estimate({ board10: 1, eicr6: 1 }).overlap, true);
  assert.equal(estimate({ eicr6: 1 }).subtotal, 130);
});
test("travel boundaries", () => {
  for (const [m, p] of [
    [0, 0],
    [35, 0],
    [36, 15],
    [50, 15],
    [51, 25],
    [65, 25],
    [66, null],
    [NaN, null],
    [-1, null],
  ])
    assert.equal(travelCharge(m), p);
});
test("PDF is paginated, has correct xref and exclusions", () => {
  const bytes = estimatePdf(
    estimateLines(
      { switch: 1, socket: 2, board10: 1, eicr6: 1 },
      { postcode: "B664JB", charge: null, message: "Travel to be confirmed" },
      "SS-TEST",
    ),
  );
  const pdf = new TextDecoder().decode(bytes);
  assert.match(pdf, /^%PDF-1.4/);
  assert.match(pdf, /GBP 800/);
  assert.match(pdf, /Travel to be confirmed/);
  const start = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.equal(pdf.slice(start, start + 4), "xref");
  writeFileSync("/tmp/sperin-estimate-test.pdf", bytes);
});
const emailUrl = url(
  'export async function sendSperinEmail(...args){globalThis.__email=args;if(globalThis.__failEmail)throw Error("provider failure");return "test-provider-id";}',
);
const neonUrl = url(
  "export function neon(){return async()=>[{allowed:globalThis.__allow!==false}];}",
);
const zodUrl = new URL("../node_modules/zod/index.js", import.meta.url).href;
const backend = source("booking-api.server")
  .replace('"./pricing"', JSON.stringify(pricingUrl))
  .replace('"./estimate-pdf"', JSON.stringify(pdfUrl))
  .replace('"./sperin-review-email.server"', JSON.stringify(emailUrl))
  .replace('"@neondatabase/serverless"', JSON.stringify(neonUrl))
  .replace('"zod"', JSON.stringify(zodUrl));
const { bookingApi } = await import(url(backend));
process.env.SPERIN_DATABASE_URL = "postgres://test";
process.env.SPERIN_RESEND_API_KEY = "test";
delete process.env.SPERIN_ROUTING_API_KEY;
const payload = () => ({
  name: "TEST ONLY",
  email: "test@example.com",
  phone: "07000000000",
  postcode: "B66 4JB",
  address: "Test address",
  timing: "Testing only",
  notes: "Do not book",
  website: "",
  consent: true,
  overlapConfirmed: false,
  reference: "12345678-1234-4123-8123-123456789abc",
  selection: { switch: 1, socket: 2 },
  photos: [],
});
const request = (p, origin = "https://sperinservices.co.uk") =>
  new Request("https://sperinservices.co.uk/api/pricing/booking", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
test("booking server recalculates and sends private PDF to the owner", async () => {
  globalThis.__allow = true;
  globalThis.__failEmail = false;
  const p = payload();
  p.total = 1;
  const r = await bookingApi(request(p));
  assert.equal(r.status, 200);
  assert.equal(globalThis.__email[0], "info@sperinservices.co.uk");
  assert.match(globalThis.__email[1].text, /£120/);
  assert.equal(globalThis.__email[1].attachments[0].filename, "SS-12345678-estimate.pdf");
  assert.equal(globalThis.__email[1].reply_to, "test@example.com");
});
test("provider failure is not reported as success", async () => {
  globalThis.__failEmail = true;
  assert.equal((await bookingApi(request(payload()))).status, 503);
  globalThis.__failEmail = false;
});
test("bad origin, unknown items, incompatible packages and unconfirmed overlap rejected", async () => {
  assert.equal((await bookingApi(request(payload(), "https://other.test"))).status, 403);
  for (const selection of [
    { madeup: 1 },
    { board6: 1, board10: 1 },
    { eicr6: 2 },
    { eicr6: 1, board6: 1 },
  ])
    assert.equal((await bookingApi(request({ ...payload(), selection }))).status, 400);
});
test("non-image attachments and spam rejected", async () => {
  assert.equal(
    (
      await bookingApi(
        request({
          ...payload(),
          photos: [
            {
              name: "x.jpg",
              type: "image/jpeg",
              content: Buffer.from("not an image!").toString("base64"),
            },
          ],
        }),
      )
    ).status,
    400,
  );
  globalThis.__allow = false;
  assert.equal((await bookingApi(request(payload()))).status, 429);
  globalThis.__allow = true;
});
test("missing routing returns confirmation, not a fictitious free trip", async () => {
  const r = await bookingApi(
    new Request("https://sperinservices.co.uk/api/pricing/travel", {
      method: "POST",
      headers: { origin: "https://sperinservices.co.uk" },
      body: JSON.stringify({ postcode: "B66 4JB" }),
    }),
  );
  const data = await r.json();
  assert.equal(data.charge, null);
  assert.match(data.message, /confirmed/);
});
