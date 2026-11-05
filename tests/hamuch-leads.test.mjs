import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const asUrl = (s) => "data:text/javascript;base64," + Buffer.from(s).toString("base64");
const transpile = (name) =>
  ts.transpileModule(readFileSync(new URL("../src/lib/" + name + ".ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const pricingUrl = asUrl(transpile("pricing"));
const hamuchUrl = asUrl(
  transpile("hamuch-leads").replace('"./pricing"', JSON.stringify(pricingUrl)),
);
const { parseHamuchLead, recommendHamuchLead, prepareHamuchReply } = await import(hamuchUrl);

const doorbell = [
  "New job: Jamie Example, B66 4JB 07700900123",
  "jamie@example.com",
  "Fit a wired smart doorbell with a chime. We have an existing doorbell I'd like a quote please.",
  "Interested in this job?",
  "Click to exchange details",
].join("\n");

test("extracts customer contact and scope from HaMuch notification", () => {
  const lead = parseHamuchLead(doorbell);
  assert.equal(lead.name, "Jamie Example");
  assert.equal(lead.postcode, "B66 4JB");
  assert.equal(lead.phone, "07700900123");
  assert.equal(lead.email, "jamie@example.com");
  assert.match(lead.description, /smart doorbell/i);
  assert.doesNotMatch(lead.description, /Click to exchange details/);
});
test("doorbell gets provisional labour range not a fixed materials quote", () => {
  const lead = parseHamuchLead(doorbell);
  const rec = recommendHamuchLead(lead);
  assert.equal(rec.category, "Wired doorbell installation");
  assert.match(rec.price, /£100–£140 labour/);
  assert.equal(rec.needsAssessment, true);
  const draft = prepareHamuchReply(lead, rec);
  assert.match(draft.message, /Hi Jamie/);
  assert.match(draft.message, /make\/model/);
  assert.match(draft.message, /Sperin Services/);
});
test("new EV-use outdoor socket is assessed instead of casually fixed priced", () => {
  const lead = parseHamuchLead(
    "New job: Taylor Example, B66 4JB 07700900125\ntaylor@example.com\nOutside electrical socket to plug in EV charger.",
  );
  const rec = recommendHamuchLead(lead);
  assert.equal(rec.price, "Assessment required");
  assert.match(rec.guidance, /continuous EV charging/);
});
test("washer/dryer new socket enquiry requests photos and scope", () => {
  const lead = parseHamuchLead(
    "New job: Alex Example, B66 4JB 07700900124\nalex@example.com\nSockets for washer and dryer plus sockets in utility room",
  );
  assert.equal(recommendHamuchLead(lead).needsAssessment, true);
});
test("uses current website prices for inspection and consumer-unit estimates", () => {
  const base = { name: "", email: "", phone: "", postcode: "", description: "" };
  assert.equal(recommendHamuchLead({ ...base, description: "EICR 6 circuits" }).price, "£160");
  assert.equal(recommendHamuchLead({ ...base, description: "EICR 7-10 circuits" }).price, "£200");
  assert.equal(
    recommendHamuchLead({ ...base, description: "Replace consumer unit 6 circuits" }).price,
    "From £650",
  );
  assert.equal(
    recommendHamuchLead({ ...base, description: "Replace consumer unit 8 circuits" }).price,
    "From £800",
  );
  assert.equal(
    recommendHamuchLead({ ...base, description: "Fault finding tripping circuits" }).price,
    "£60 first hour, then £40/hour",
  );
});
