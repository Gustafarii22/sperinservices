import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(readFileSync("src/lib/certificate-scan.server.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { certificateScan: scan, scanInstructions } = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const original = globalThis.fetch,
  env = process.env.OPENAI_API_KEY;
afterEach(() => {
  globalThis.fetch = original;
  if (env === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = env;
});
const request = (data) =>
  new Request("https://sperinservices.co.uk/api/owner/certificate-scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
const data = { consent: true, images: ["data:image/jpeg;base64,/9j/AA=="] };
test("fails closed without server key", async () => {
  delete process.env.OPENAI_API_KEY;
  assert.equal((await scan(request(data))).status, 503);
});
test("rejects absent consent, remote URLs, oversized batches", async () => {
  process.env.OPENAI_API_KEY = "test";
  for (const bad of [
    { ...data, consent: false },
    { ...data, images: ["https://internal/secret"] },
    { ...data, images: Array(7).fill(data.images[0]) },
  ])
    assert.equal((await scan(request(bad))).status, 400);
});
test("requests structured multi-image analysis without storage and returns proposals", async () => {
  process.env.OPENAI_API_KEY = "test";
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const b = JSON.parse(init.body);
    assert.equal(b.store, false);
    assert.equal(b.text.format.strict, true);
    assert.equal(b.input[0].content.filter((c) => c.type === "input_image").length, 2);
    return Response.json({
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ board: [], circuits: [], warnings: [] }),
            },
          ],
        },
      ],
    });
  };
  const r = await scan(request({ ...data, images: [...data.images, ...data.images] }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("provider errors/refusals never expose secrets or raw upstream content", async () => {
  process.env.OPENAI_API_KEY = "test";
  globalThis.fetch = async () => new Response("secret detail", { status: 429 });
  const r = await scan(request(data));
  assert.equal(r.status, 429);
  assert.ok(!(await r.text()).includes("secret detail"));
  globalThis.fetch = async () => Response.json({ status: "incomplete" });
  assert.equal((await scan(request(data))).status, 502);
});

test("two uploaded views of one multi-bank CU are treated together, main-first and right-to-left when needed",()=>{
 assert.match(scanInstructions,/ONE USER-SELECTED consumer unit/i);
 assert.match(scanInstructions,/two or more DIN-rail banks/i);
 assert.match(scanInstructions,/MAIN SWITCH position 0, SPD position 1/i);
 assert.match(scanInstructions,/right-to-left or left-to-right/i);
 assert.match(scanInstructions,/do NOT by itself mean a different consumer unit/i);
 assert.match(scanInstructions,/blank cover as a spare way/i);
});
