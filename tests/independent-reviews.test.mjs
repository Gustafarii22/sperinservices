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
const emailModule = moduleUrl(compile("../src/lib/sperin-review-email.server.ts"));
const { reviewNotification } = await import(emailModule);
const { independentReviewApi: api } = await import(
  moduleUrl(
    compile("../src/lib/sperin-independent-reviews.server.ts")
      .replace('"./review-config"', JSON.stringify(config))
      .replace('"./sperin-review-email.server"', JSON.stringify(emailModule)),
  )
);
const nativeFetch = globalThis.fetch;
const owner = "11111111-1111-4111-8111-111111111111",
  id = "22222222-2222-4222-8222-222222222222";
const variables = {
  SPERIN_SUPABASE_URL: "https://dedicatedsperintest.supabase.co",
  SPERIN_SUPABASE_SERVICE_ROLE_KEY: "test-only-service-key",
  SPERIN_OWNER_EMAIL: "owner@example.test",
  SPERIN_OWNER_USER_ID: owner,
  SPERIN_SITE_URL: "https://sperinservices.co.uk",
  SPERIN_RESEND_API_KEY: "test-only-mail-key",
  SPERIN_EMAIL_FROM: "Sperin Services <reviews@example.test>",
};
const old = Object.fromEntries(Object.keys(variables).map((k) => [k, process.env[k]]));
function setup() {
  Object.assign(process.env, variables);
}
afterEach(() => {
  globalThis.fetch = nativeFetch;
  for (const [k, v] of Object.entries(old))
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
});
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const req = (path, body, cookie) =>
  new Request("https://sperinservices.co.uk" + path, {
    method: body ? "POST" : "GET",
    headers: {
      origin: "https://sperinservices.co.uk",
      ...(cookie ? { cookie } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
test("dedicated implementation refuses EV and Word of Trade databases", async () => {
  setup();
  globalThis.fetch = () => {
    throw Error("must not access shared apps");
  };
  for (const ref of ["ooxeuejhuynglawkfwpp", "xprmnikoyrocxyrhwdpn"]) {
    process.env.SPERIN_SUPABASE_URL = `https://${ref}.supabase.co`;
    assert.equal((await api(req("/api/reviews"))).status, 503);
  }
});
test("EV owner session cannot access separate dashboard", async () => {
  setup();
  globalThis.fetch = () => {
    throw Error("must not call auth");
  };
  assert.equal(
    (await api(req("/api/owner/reviews", null, "sperin_owner=old-app-token"))).status,
    401,
  );
});
test("notification deep-link targets one review and never auto-approves", () => {
  const mail = reviewNotification("https://sperinservices.co.uk", {
    id,
    name: "<script>bad</script>",
    rating: 4,
    service: "Testing",
  });
  assert.ok(mail.text.includes(`/owner-reviews?review=${id}`));
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(!mail.text.includes("/api/"));
});
test("wrong owner email cannot trigger sign-in email", async () => {
  setup();
  globalThis.fetch = () => {
    throw Error("must not send email");
  };
  assert.equal(
    (await api(req("/api/owner/request-code", { email: "someone@example.test" }))).status,
    401,
  );
});
test("email code is sent only to configured owner and never returned to browser", async () => {
  setup();
  let sent;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("sperin_auth_attempt")) return response(true);
    if (String(url).includes("generate_link")) return response({ id: owner, email_otp: "123456" });
    if (url === "https://api.resend.com/emails") {
      sent = JSON.parse(init.body);
      return response({ id: "message-1" });
    }
    throw Error("unexpected");
  };
  const r = await api(req("/api/owner/request-code", { email: "owner@example.test" }));
  assert.equal(r.status, 200);
  assert.ok(!(await r.text()).includes("123456"));
  assert.deepEqual(sent.to, ["owner@example.test"]);
  assert.ok(sent.subject.includes("Sperin Services"));
});
test("mail failure never claims a sign-in email was sent", async () => {
  setup();
  globalThis.fetch = async (url) =>
    String(url).includes("sperin_auth_attempt")
      ? response(true)
      : String(url).includes("generate_link")
        ? response({ id: owner, email_otp: "123456" })
        : response({}, 503);
  assert.equal(
    (await api(req("/api/owner/request-code", { email: "owner@example.test" }))).status,
    503,
  );
});
test("verified owner receives independent secure cookie", async () => {
  setup();
  globalThis.fetch = async (url) =>
    String(url).includes("sperin_auth_attempt")
      ? response(true)
      : response({
          user: { id: owner, email_confirmed_at: "2026-09-30" },
          access_token: "dedicated-token",
          expires_in: 3600,
        });
  const r = await api(
    req("/api/owner/verify-code", { email: "owner@example.test", code: "123456" }),
  );
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie");
  for (const s of ["sperin_services_owner_v2=", "HttpOnly", "Secure", "SameSite=Strict"])
    assert.ok(cookie.includes(s));
  assert.ok(!(await r.text()).includes("dedicated-token"));
});
test("expired code cannot establish a session", async () => {
  setup();
  globalThis.fetch = async (url) =>
    String(url).includes("sperin_auth_attempt")
      ? response(true)
      : response({ error: "expired" }, 403);
  const r = await api(
    req("/api/owner/verify-code", { email: "owner@example.test", code: "123456" }),
  );
  assert.equal(r.status, 401);
  assert.equal(r.headers.get("set-cookie"), null);
});
test("short review saves and notification contains exact approval link", async () => {
  setup();
  let sent,
    finished = false;
  globalThis.fetch = async (url, init) => {
    url = String(url);
    if (url.includes("sperin_accept_review")) {
      assert.equal(JSON.parse(init.body).payload.text, "good");
      return response(id);
    }
    if (url.includes("sperin_claim_notification")) return response(true);
    if (url.includes("sperin_reviews?"))
      return response([{ id, name: "Test", service: "Testing", rating: 5 }]);
    if (url === "https://api.resend.com/emails") {
      sent = JSON.parse(init.body);
      return response({ id: "message-2" });
    }
    if (url.includes("sperin_finish_notification")) {
      finished = true;
      return response(null);
    }
    throw Error(url);
  };
  const r = await api(
    req("/api/reviews/submit", {
      request_id: id,
      name: "Test",
      area: "",
      service: "Testing",
      job_reference: "",
      rating: 5,
      consent: true,
      text: "good",
    }),
  );
  assert.equal(r.status, 201);
  assert.ok(sent.text.includes(`review=${id}`));
  assert.ok(finished);
});
test("notification outage preserves saved review and releases delivery for retry", async () => {
  setup();
  let retry = false;
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes("sperin_accept_review")) return response(id);
    if (url.includes("sperin_claim_notification")) return response(true);
    if (url.includes("sperin_reviews?"))
      return response([{ id, name: "Test", service: "Testing", rating: 5 }]);
    if (url.includes("sperin_release_notification")) {
      retry = true;
      return response(null);
    }
    return response({}, 503);
  };
  const r = await api(
    req("/api/reviews/submit", {
      request_id: id,
      name: "Test",
      area: "",
      service: "Testing",
      job_reference: "",
      rating: 5,
      consent: true,
      text: "good",
    }),
  );
  assert.equal(r.status, 201);
  assert.ok(retry);
});
test("cross-site approval is rejected", async () => {
  setup();
  const r = await api(
    new Request(`https://sperinservices.co.uk/api/owner/reviews/${id}`, {
      method: "POST",
      headers: { origin: "https://attacker.test" },
      body: "{}",
    }),
  );
  assert.equal(r.status, 403);
});
test("GET on a review link cannot publish a review", async () => {
  setup();
  globalThis.fetch = async (url, init) => {
    assert.notEqual(init.method, "PATCH");
    return response({ id: owner, email: "owner@example.test", email_confirmed_at: "2026-09-30" });
  };
  assert.equal(
    (await api(req(`/api/owner/reviews/${id}`, null, "sperin_services_owner_v2=token"))).status,
    404,
  );
});
