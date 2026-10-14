import assert from "node:assert/strict";
import { handle, feedbackContent } from "../api/ev4i-feedback.mjs";
const id = "11111111-1111-4111-8111-111111111111",
  emailId = "22222222-2222-4222-8222-222222222222",
  token = "a".repeat(64),
  secret = "b".repeat(64);
const env = {
  EV4I_FEEDBACK_RELAY_SECRET: secret,
  EV4I_FEEDBACK_DB_KEY: "public-test-key",
  SPERIN_RESEND_API_KEY: "test-mail-key",
};
const row = {
  id,
  access_token: token,
  feedback_table: "app_feedback",
  payload: {
    category: "problem",
    message: "<script>alert(1)</script>",
    route: "/tool/demand",
    app_version: "0.9.1",
    reporter_email: "test@example.test",
  },
  resolved_at: null,
};
let mails = 0,
  claims = 0,
  resolves = 0,
  fail = false,
  sent = false;
const fetcher = async (url, init = {}) => {
  const body = init.body ? JSON.parse(init.body) : {};
  if (url.endsWith("/ev4i_feedback_owner_action")) {
    if (body.p_token !== token) return Response.json(null);
    if (body.p_action === "resolve") {
      resolves++;
      row.resolved_at = "2026-10-11T16:00:00Z";
    }
    return Response.json(row);
  }
  if (url.endsWith("/ev4i_feedback_relay")) {
    assert.equal(body.p_secret, secret);
    if (body.p_action === "claim") {
      claims++;
      return Response.json(sent ? null : row);
    }
    if (body.p_action === "sent") sent = true;
    return Response.json({ ok: true });
  }
  assert.equal(url, "https://api.resend.com/emails");
  mails++;
  assert.deepEqual(body.to, ["info@sperinservices.co.uk"]);
  assert.equal(init.headers["Idempotency-Key"], "ev4i-feedback-" + id);
  assert(!body.html.includes("<script>"));
  return Response.json(fail ? { name: "rate_limit_exceeded" } : { id: emailId }, {
    status: fail ? 429 : 200,
  });
};
const request = (auth = true) =>
  new Request("https://example.test/api/ev4i-feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: "Bearer " + secret } : {}),
    },
    body: JSON.stringify({ action: "notify", id, to: "attacker@example.test" }),
  });
assert.equal((await handle(request(false), env, fetcher)).status, 401);
assert.equal(claims, 0);
assert.equal((await handle(request(), env, fetcher)).status, 200);
assert.equal(mails, 1);
await handle(request(), env, fetcher);
assert.equal(mails, 1, "Duplicate work must not resend");
const url = `https://example.test/api/ev4i-feedback?id=${id}&token=${token}`;
const view = await handle(new Request(url), env, fetcher);
assert.equal(view.status, 200);
assert.equal(resolves, 0);
assert((await view.text()).includes("&lt;script&gt;"));
const denied = await handle(new Request(url.replace(token, "c".repeat(64))), env, fetcher);
assert.equal(denied.status, 404);
const missing = new URLSearchParams({ confirm: "resolve", token: "wrong" });
assert.equal(
  (await handle(new Request(url, { method: "POST", body: missing }), env, fetcher)).status,
  403,
);
assert.equal(resolves, 0);
const form = new URLSearchParams({ confirm: "resolve", token, note: "Fixed" });
assert.equal(
  (await handle(new Request(url, { method: "POST", body: form }), env, fetcher)).status,
  200,
);
assert.equal(resolves, 1);
sent = false;
fail = true;
assert.equal((await handle(request(), env, fetcher)).status, 502);
const ai = feedbackContent({
  ...row,
  feedback_table: "assistant_feedback",
  payload: { helpful: false, question: "Question", answer_summary: "Answer" },
});
assert(ai.subject.includes("needs attention"));
assert(ai.text.includes("Not recorded by this app version"));
console.log(
  "PASS: authenticated dispatch, fixed recipient, idempotency, escaped content, private per-item view, GET non-mutation, explicit resolution, provider failure, AI payload.",
);
