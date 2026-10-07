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
const pdfUrl = url(source("estimate-pdf").replace('"./pricing"', JSON.stringify(pricingUrl)));
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
test("PDF is branded, itemised, paginated and has a valid xref", () => {
  const bytes = estimatePdf(
    { switch: 1, socket: 2, board10: 1, eicr6: 1 },
    { postcode: "B664JB", charge: null, message: "Travel to be confirmed" },
    "SS-TEST",
    { customerName: "Test Customer", address: "Test address", postcode: "B66 4JB" },
  );
  const pdf = new TextDecoder().decode(bytes);
  assert.match(pdf, /^%PDF-1.4/);
  assert.match(pdf, /SPERIN SERVICES/);
  assert.match(pdf, /SperinServicesEstimateV2/);
  assert.match(pdf, /DESCRIPTION OF WORK/);
  assert.match(pdf, /COST/);
  assert.doesNotMatch(pdf, /Unit Price/);
  assert.match(pdf, /Standard white socket supplied/);
  assert.match(pdf, /Consumer unit/);\n  assert.match(pdf, /FuseBox unit/);
  assert.match(pdf, /VAT .*not registered/);
  assert.match(pdf, /PRICED SUBTOTAL/);
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
const { bookingApi, lookupTravel } = await import(url(backend));
process.env.SPERIN_DATABASE_URL = "postgres://test";
process.env.SPERIN_RESEND_API_KEY = "test";
delete process.env.SPERIN_ROUTING_API_KEY;
const nativeFetch = globalThis.fetch;
globalThis.__routeSeconds = 20 * 60;
globalThis.__routeFails = false;
globalThis.fetch = async (input, init) => {
  const target = typeof input === "string" ? input : input.url;
  if (target.startsWith("https://api.postcodes.io/postcodes/")) {
    return Response.json({
      result: {
        longitude: target.includes("B664JB") ? -1.99 : -2.42,
        latitude: target.includes("B664JB") ? 52.49 : 52.53,
      },
    });
  }
  if (target.startsWith("https://router.project-osrm.org/")) {
    if (globalThis.__routeFails) throw Error("router unavailable");
    return Response.json({ code: "Ok", routes: [{ duration: globalThis.__routeSeconds }] });
  }
  return nativeFetch(input, init);
};
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
test("download endpoint returns the new letterheaded two-column PDF", async () => {
  const r = await bookingApi(
    new Request("https://sperinservices.co.uk/api/pricing/pdf", {
      method: "POST",
      headers: { origin: "https://sperinservices.co.uk", "Content-Type": "application/json" },
      body: JSON.stringify({
        selection: { switch: 1, socket: 2 },
        postcode: "",
        reference: "12345678-1234-4123-8123-123456789abc",
      }),
    }),
  );
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
  const pdf = Buffer.from(await r.arrayBuffer()).toString("latin1");
  assert.match(pdf, /SPERIN SERVICES/);
  assert.match(pdf, /DESCRIPTION OF WORK/);
  assert.match(pdf, /COST/);
  assert.match(pdf, /ESTIMATE/);
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
test("project enquiry uses the same protected email backend", async () => {
  globalThis.__allow = true;
  globalThis.__failEmail = false;
  const enquiry = {
    name: "TEST ONLY",
    email: "test@example.com",
    phone: "07000000000",
    postcode: "B66 4JB",
    service: "Consumer Unit Upgrades",
    property: "House / flat",
    timescale: "Within 1 month",
    contactMethod: "Email",
    message: "Test project enquiry only. Do not book this job.",
    consent: true,
    website: "",
    reference: "12345678-1234-4123-8123-123456789abc",
    photos: [],
  };
  const r = await bookingApi(
    new Request("https://sperinservices.co.uk/api/enquiry", {
      method: "POST",
      headers: { origin: "https://sperinservices.co.uk", "Content-Type": "application/json" },
      body: JSON.stringify(enquiry),
    }),
  );
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.success, true);
  assert.equal(data.reference, "SS-12345678");
  assert.equal(globalThis.__email[0], "info@sperinservices.co.uk");
  assert.match(globalThis.__email[1].subject, /Consumer Unit Upgrades/);
  assert.match(globalThis.__email[1].text, /Test project enquiry only/);
  assert.equal(globalThis.__email[1].reply_to, "test@example.com");
});

test("project enquiry rejects invalid origins and missing consent", async () => {
  const base = {
    name: "TEST ONLY",
    email: "test@example.com",
    phone: "07000000000",
    postcode: "B66 4JB",
    service: "Other",
    property: "House / flat",
    timescale: "Planning stage / flexible",
    contactMethod: "Phone",
    message: "Test project enquiry only. Do not book.",
    consent: true,
    website: "",
    reference: "12345678-1234-4123-8123-123456789abc",
    photos: [],
  };
  const wrongOrigin = await bookingApi(
    new Request("https://sperinservices.co.uk/api/enquiry", {
      method: "POST",
      headers: { origin: "https://other.test", "Content-Type": "application/json" },
      body: JSON.stringify(base),
    }),
  );
  assert.equal(wrongOrigin.status, 403);
  const missingConsent = await bookingApi(
    new Request("https://sperinservices.co.uk/api/enquiry", {
      method: "POST",
      headers: { origin: "https://sperinservices.co.uk", "Content-Type": "application/json" },
      body: JSON.stringify({ ...base, consent: false }),
    }),
  );
  assert.equal(missingConsent.status, 400);
});

test("postcode travel check returns included and supplement outcomes", async () => {
  for (const [minutes, charge] of [
    [20, 0],
    [45, 15],
    [55, 25],
    [70, null],
  ]) {
    globalThis.__routeSeconds = minutes * 60;
    const r = await bookingApi(
      new Request("https://sperinservices.co.uk/api/pricing/travel", {
        method: "POST",
        headers: { origin: "https://sperinservices.co.uk" },
        body: JSON.stringify({ postcode: "WV15 5EG" }),
      }),
    );
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.minutes, minutes);
    assert.equal(data.charge, charge);
    assert.equal(data.source, "osrm");
  }
});

test("travel check has a deterministic fallback when road routing is unavailable", async () => {
  globalThis.__routeFails = true;
  const data = await lookupTravel("B66 4JB");
  assert.equal(data.source, "fallback");
  assert.equal(data.charge, 0);
  assert.match(data.message, /travel included/);
  globalThis.__routeFails = false;
});
