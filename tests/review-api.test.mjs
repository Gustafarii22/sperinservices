import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const moduleUrl = (text) => `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
const config = moduleUrl(compile("../src/lib/review-config.ts"));
const mail = moduleUrl(compile("../src/lib/sperin-review-email.server.ts"));
const independent = moduleUrl(
  compile("../src/lib/sperin-independent-reviews.server.ts")
    .replace('"./review-config"', JSON.stringify(config))
    .replace('"./sperin-review-email.server"', JSON.stringify(mail)),
);
const { reviewApi } = await import(
  moduleUrl(
    compile("../src/lib/review-api.server.ts")
      .replace('"./review-config"', JSON.stringify(config))
      .replace('"./sperin-independent-reviews.server"', JSON.stringify(independent)),
  )
);
const nativeFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = nativeFetch;
});
const owner = "7319fcef-63e7-4761-9174-179ecabba17e";
const request = (path, body, cookie) =>
  new Request(`https://sperinservices.co.uk${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body
        ? { origin: "https://sperinservices.co.uk", "content-type": "application/json" }
        : {}),
      ...(cookie ? { cookie: "sperin_owner=test-token" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const response = (value, status = 200) => new Response(JSON.stringify(value), { status });
test("anonymous cannot read the owner queue", async () => {
  const r = await reviewApi(request("/api/owner/reviews"));
  assert.equal(r.status, 401);
});
test("cross-site approval is refused before auth or mutation", async () => {
  globalThis.fetch = () => {
    throw Error("must not fetch");
  };
  const r = await reviewApi(
    new Request("https://sperinservices.co.uk/api/owner/reviews/a", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      body: "{}",
    }),
  );
  assert.equal(r.status, 403);
});
test("non-owner credentials never receive an owner cookie", async () => {
  globalThis.fetch = async () => response({ user: { id: "someone-else" }, access_token: "other" });
  const r = await reviewApi(
    request("/api/owner/login", { email: "other@example.test", password: "test-only" }),
  );
  assert.equal(r.status, 401);
  assert.equal(r.headers.get("set-cookie"), null);
});
test("owner login uses short-lived secure HttpOnly SameSite cookies", async () => {
  globalThis.fetch = async () =>
    response({ user: { id: owner }, access_token: "test-token", expires_in: 7200 });
  const r = await reviewApi(
    request("/api/owner/login", { email: "owner@example.test", password: "test-only" }),
  );
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie");
  for (const flag of ["HttpOnly", "SameSite=Strict", "Secure", "Max-Age=3600", "Path=/api/owner"])
    assert.ok(cookie.includes(flag));
  assert.equal((await r.json()).access_token, undefined);
});
test("public endpoint fetches approved reviews and never job references", async () => {
  globalThis.fetch = async (url) => {
    assert.ok(url.includes("status=eq.approved"));
    assert.ok(!url.includes("job_reference"));
    return response([]);
  };
  const r = await reviewApi(request("/api/reviews"));
  assert.deepEqual(await r.json(), { reviews: [] });
});
test("expired session is rejected and cleared", async () => {
  globalThis.fetch = async () => response({ error: "expired" }, 401);
  const r = await reviewApi(request("/api/owner/reviews", null, true));
  assert.equal(r.status, 401);
  assert.ok(r.headers.get("set-cookie").includes("Max-Age=0"));
});
test("approval forwards only status and reply; customer text is immutable", async () => {
  let n = 0;
  globalThis.fetch = async (url, init) => {
    if (++n === 1) return response({ id: owner });
    assert.deepEqual(JSON.parse(init.body), { status: "approved", reply: "Thank you" });
    assert.ok(init.headers.Authorization === "Bearer test-token");
    return response([{ id: "b48d5c61-1e7d-4af3-91d2-24efac223cdf", status: "approved" }]);
  };
  const r = await reviewApi(
    request(
      "/api/owner/reviews/b48d5c61-1e7d-4af3-91d2-24efac223cdf",
      { status: "approved", reply: " Thank you ", text: "Changed review" },
      true,
    ),
  );
  assert.equal(r.status, 200);
});
test("backend failure produces an error, never an empty success", async () => {
  globalThis.fetch = async () => response({}, 503);
  assert.equal((await reviewApi(request("/api/reviews"))).status, 503);
});
