import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const url = (t) => `data:text/javascript;base64,${Buffer.from(t).toString("base64")}`;
const adapter = url(
  'export async function independentReviewApi(req){ return req.url.includes("/api/")?new Response("dedicated"):null; }',
);
const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/review-api.server.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const { reviewApi } = await import(
  url(source.replace('"./sperin-independent-reviews.server"', JSON.stringify(adapter)))
);
test("settings always use Sperin's independent system", async () => {
  const r = await reviewApi(new Request("https://sperinservices.co.uk/api/review-settings"));
  assert.deepEqual(await r.json(), { independent: true });
});
test("review requests delegate to dedicated adapter", async () => {
  assert.equal(
    await (await reviewApi(new Request("https://sperinservices.co.uk/api/reviews"))).text(),
    "dedicated",
  );
});
test("non-API pages continue through existing site router", async () => {
  assert.equal(await reviewApi(new Request("https://sperinservices.co.uk/about")), null);
});
test("public review configuration contains no EV database credentials", () => {
  const config = readFileSync(new URL("../src/lib/review-config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(config, /supabase|ooxeue|REVIEW_OWNER_ID|ANON_JWT/);
});
