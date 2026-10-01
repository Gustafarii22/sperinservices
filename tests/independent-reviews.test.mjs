import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const moduleUrl = (t) => `data:text/javascript;base64,${Buffer.from(t).toString("base64")}`;
const compile = (f) =>
  ts.transpileModule(readFileSync(new URL(f, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const config = moduleUrl(compile("../src/lib/review-config.ts"));
const mail = moduleUrl(compile("../src/lib/sperin-review-email.server.ts"));
const driver = moduleUrl("export const neon=()=>globalThis.testSql;");
const { independentReviewApi: api } = await import(
  moduleUrl(
    compile("../src/lib/sperin-independent-reviews.server.ts")
      .replace('"@neondatabase/serverless"', JSON.stringify(driver))
      .replace('"./review-config"', JSON.stringify(config))
      .replace('"./sperin-review-email.server"', JSON.stringify(mail)),
  )
);
const { reviewNotification } = await import(mail);
const id = "22222222-2222-4222-8222-222222222222",
  email = "info@sperinservices.co.uk";
const env = {
  SPERIN_DATABASE_URL:
    "postgresql://test:test@ep-tiny-glitter-zads9u9d.eu-west-2.aws.neon.tech/neondb",
  SPERIN_NEON_AUTH_URL:
    "https://ep-tiny-glitter-zads9u9d.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth",
  SPERIN_OWNER_EMAIL: email,
  SPERIN_SITE_URL: "https://sperinservices.co.uk",
  SPERIN_RESEND_API_KEY: "test-only",
  SPERIN_EMAIL_FROM: "Sperin Services <reviews@sperinservices.co.uk>",
};
const previous = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]])),
  nativeFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = nativeFetch;
  delete globalThis.testSql;
  for (const [k, v] of Object.entries(previous))
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
});
const res = (v, status = 200) => new Response(JSON.stringify(v), { status });
const req = (path, body, token, origin = "https://sperinservices.co.uk") =>
  new Request("https://sperinservices.co.uk" + path, {
    method: body ? "POST" : "GET",
    headers: {
      origin,
      "content-type": "application/json",
      ...(token ? { cookie: `sperin_services_owner_v2=${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
let calls = [];
function setup(handler = () => []) {
  Object.assign(process.env, env);
  calls = [];
  const query = async (q, p = []) => {
    calls.push([q, p]);
    return handler(q, p);
  };
  globalThis.testSql = Object.assign((parts, ...values) => query(parts.join("?"), values), {
    query,
  });
  globalThis.fetch = async () => {
    throw Error("Unexpected network");
  };
}
const payload = {
  request_id: id,
  name: "QA test",
  area: "",
  service: "Testing",
  rating: 5,
  text: "good",
  consent: true,
  job_reference: "",
};
const session = { session: { id: "session" }, user: { id: "owner", email, emailVerified: true } };
test("fails closed for another application auth endpoint", async () => {
  setup();
  process.env.SPERIN_NEON_AUTH_URL = "https://ooxeuejhuynglawkfwpp.supabase.co";
  assert.equal((await api(req("/api/reviews"))).status, 503);
  assert.equal(calls.length, 0);
});
test("short and long reviews are saved; email outage does not lose feedback", async () => {
  for (const text of ["g", "good", "x".repeat(20000)]) {
    setup((q) =>
      q.includes("sperin_accept_review")
        ? [{ id }]
        : q.includes("sperin_claim_notification")
          ? [{ result: true }]
          : q.startsWith("select id,name")
            ? [{ id, name: "QA", rating: 5, service: "Testing" }]
            : [{ result: true }],
    );
    globalThis.fetch = async () => res({ error: "outage" }, 503);
    const result = await api(req("/api/reviews/submit", { ...payload, text }));
    assert.equal(result.status, 201);
    assert.ok(calls.some(([q]) => q.includes("sperin_release_notification")));
  }
});
test("empty review, missing consent and honeypot are rejected before database", async () => {
  setup();
  for (const change of [{ text: "  " }, { consent: false }, { website: "bot" }])
    assert.equal((await api(req("/api/reviews/submit", { ...payload, ...change }))).status, 400);
  assert.equal(calls.length, 0);
});
test("cross-origin approval and submission are rejected", async () => {
  setup();
  for (const path of ["/api/reviews/submit", "/api/owner/reviews/" + id])
    assert.equal((await api(req(path, payload, "token", "https://other.test"))).status, 403);
  assert.equal(calls.length, 0);
});
test("unauthenticated and wrong-owner sessions cannot read or moderate reviews", async () => {
  setup();
  assert.equal((await api(req("/api/owner/reviews"))).status, 401);
  globalThis.fetch = async () =>
    res({ ...session, user: { ...session.user, email: "someone@example.test" } });
  assert.equal((await api(req("/api/owner/reviews", null, "token"))).status, 401);
  assert.equal(calls.length, 0);
});
test("unverified email cannot become owner", async () => {
  setup();
  globalThis.fetch = async () =>
    res({ ...session, user: { ...session.user, emailVerified: false } });
  assert.equal((await api(req("/api/owner/session", null, "token"))).status, 401);
});
test("public endpoint selects approved fields only and never private job references", async () => {
  setup(() => []);
  assert.equal((await api(req("/api/reviews"))).status, 200);
  assert.match(calls[0][0], /where status='approved'/);
  assert.doesNotMatch(calls[0][0], /job_reference|consent|request_id/);
});
test("email notification deep-link is escaped and never auto-publishes", () => {
  const m = reviewNotification(env.SPERIN_SITE_URL, {
    id,
    name: "<script>bad</script>",
    rating: 5,
    service: "Testing",
  });
  assert.ok(m.text.includes("/owner-reviews?review=" + id));
  assert.ok(m.html.includes("&lt;script&gt;"));
  assert.doesNotMatch(m.html, /<script>/);
  assert.match(m.text, /private until/);
});
test("successful submission records provider acceptance and deduplicated delivery key", async () => {
  setup((q) =>
    q.includes("accept_review")
      ? [{ id }]
      : q.startsWith("select id,name")
        ? [{ id, name: "QA", rating: 5, service: "Testing" }]
        : [{ result: true }],
  );
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(init.headers["Idempotency-Key"], "sperin-review-" + id);
    assert.deepEqual(JSON.parse(init.body).to, [email]);
    return res({ id: "mail-accepted" });
  };
  assert.equal((await api(req("/api/reviews/submit", payload))).status, 201);
  assert.ok(calls.some(([q, p]) => q.includes("finish_notification") && p[1] === "mail-accepted"));
});
test("managed sign-in sends only to fixed Sperin owner", async () => {
  setup(() => [{ result: true }]);
  assert.equal(
    (await api(req("/api/owner/request-code", { email: "wrong@example.test" }))).status,
    401,
  );
  globalThis.fetch = async (url, init) => {
    assert.ok(url.startsWith(env.SPERIN_NEON_AUTH_URL));
    assert.deepEqual(JSON.parse(init.body), { email, type: "sign-in" });
    return res({ success: true });
  };
  assert.equal((await api(req("/api/owner/request-code", { email }))).status, 200);
});
test("valid owner code creates Secure HttpOnly cookie; invalid code never does", async () => {
  setup(() => [{ result: true }]);
  globalThis.fetch = async () => res({ message: "invalid" }, 401);
  assert.equal((await api(req("/api/owner/verify-code", { email, code: "000000" }))).status, 401);
  globalThis.fetch = async () => res({ user: session.user, token: "test-session-token" });
  const r = await api(req("/api/owner/verify-code", { email, code: "123456" }));
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Strict/);
  assert.equal((await r.json()).token, undefined);
});
test("owner explicitly approves and unpublishes with parameterized SQL", async () => {
  setup((q, p) => [{ id, status: p[0], reply: p[1] }]);
  globalThis.fetch = async () => res(session);
  for (const status of ["approved", "rejected"]) {
    const r = await api(
      req("/api/owner/reviews/" + id, { status, reply: "owner's reply" }, "token"),
    );
    assert.equal(r.status, 200);
    assert.equal((await r.json()).review.status, status);
  }
  assert.ok(calls.every(([q]) => q.includes("where id=$3::uuid")));
});
test("logout revokes managed session before clearing cookie", async () => {
  setup();
  const routes = [];
  globalThis.fetch = async (url) => {
    routes.push(url);
    return res(url.endsWith("/get-session") ? session : { success: true });
  };
  const r = await api(req("/api/owner/logout", {}, "token"));
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
  assert.ok(routes[1].endsWith("/sign-out"));
});
