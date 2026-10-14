import { timingSafeEqual } from "node:crypto";
const RECIPIENT = "info@sperinservices.co.uk";
const FROM = "EV4i feedback <reviews@sperinservices.co.uk>";
const BASE = "https://sperinservices.co.uk/api/ev4i-feedback";
const DB = "https://ooxeuejhuynglawkfwpp.supabase.co";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[0-9a-f]{64}$/;
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const same = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  b.length >= 64 &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
const page = (title, body, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · EV4i</title><style>body{font:16px system-ui,sans-serif;background:#f3f6fc;color:#132340;margin:0;padding:24px}main{max-width:680px;margin:24px auto;background:white;border-radius:24px;padding:28px;box-shadow:0 8px 30px #14244012}h1{font-size:28px}h2{font-size:18px;margin-top:28px}p,dd{line-height:1.5;overflow-wrap:anywhere;white-space:pre-wrap}dt{font-weight:700;margin-top:14px}dd{margin:4px 0}textarea{box-sizing:border-box;width:100%;min-height:110px;padding:12px;border:1px solid #bdcbe0;border-radius:12px;font:inherit}button{padding:16px 22px;border:0;border-radius:14px;background:#086be8;color:white;font:600 16px system-ui;cursor:pointer;margin-top:16px}button:active{transform:scale(.97)}.tag{display:inline-block;padding:6px 12px;background:#e7f2ff;border-radius:12px}.muted{color:#53647b;font-size:14px}</style></head><body><main><p class="muted">EV4i · Owner feedback</p><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`,
    { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
  );
export function feedbackContent(row) {
  const p = row.payload;
  const url = `${BASE}?id=${encodeURIComponent(row.id)}&token=${encodeURIComponent(row.access_token)}`;
  const ai = row.feedback_table === "assistant_feedback";
  const fields = [
    ["Type", ai ? "AI feedback" : p.category],
    ["Submitted", p.created_at],
    ["From", p.reporter_email || "Contact not available"],
    ["App version", p.app_version || "Not recorded by this app version"],
    ["Screen", p.route || (ai ? "/assistant" : "Not recorded")],
    ...(ai
      ? [
          ["Helpful", p.helpful ? "Yes" : "No"],
          ["Question", p.question],
          ["Answer summary", p.answer_summary],
          ["Issue", p.issue || "No extra issue selected"],
        ]
      : [["Feedback", p.message]]),
  ];
  const subject = `EV4i: ${p.is_test ? "[SETUP TEST] " : ""}${ai ? (p.helpful ? "AI feedback — helpful" : "AI feedback — needs attention") : "New " + (p.category || "app") + " feedback"}`;
  const text =
    fields.map(([label, value]) => `${label}: ${String(value ?? "")}`).join("\n\n") +
    `\n\nView and mark resolved: ${url}\n\nOpening this link does not mark it resolved. This private link expires after 90 days. Keep it private.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#132340"><h1>EV4i feedback</h1>${fields.map(([k, v]) => `<h2 style="font-size:15px">${escapeHtml(k)}</h2><p style="white-space:pre-wrap">${escapeHtml(v)}</p>`).join("")}<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:16px 22px;border-radius:14px;background:#086be8;color:white;text-decoration:none">View &amp; resolve</a></p><p>Opening the link does not mark this resolved. Keep the link private; it expires after 90 days.</p></div>`;
  return { subject, text, html };
}
async function rpc(name, params, env, fetcher) {
  if (!env.EV4I_FEEDBACK_DB_KEY) throw Error("Database configuration unavailable");
  const r = await fetcher(`${DB}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: env.EV4I_FEEDBACK_DB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw Error(`Database request failed (${r.status})`);
  return r.json();
}
export async function handle(request, env = process.env, fetcher = fetch) {
  try {
    const url = new URL(request.url);
    if (
      request.method === "GET" ||
      (request.method === "POST" &&
        !request.headers.get("content-type")?.includes("application/json"))
    ) {
      const id = url.searchParams.get("id"),
        token = url.searchParams.get("token");
      if (!UUID.test(id || "") || !TOKEN.test(token || ""))
        return page(
          "Private feedback link",
          "<p>Open the private link in your EV4i feedback email.</p>",
          404,
        );
      let action = "view",
        note = "";
      if (request.method === "POST") {
        if (Number(request.headers.get("content-length") || 0) > 10000)
          return json({ error: "Request too large" }, 413);
        const form = await request.formData();
        if (form.get("confirm") !== "resolve" || form.get("token") !== token)
          return json({ error: "Invalid confirmation" }, 403);
        action = "resolve";
        note = String(form.get("note") || "").slice(0, 2000);
      }
      const row = await rpc(
        "ev4i_feedback_owner_action",
        { p_id: id, p_token: token, p_action: action, p_note: note },
        env,
        fetcher,
      );
      if (!row)
        return page(
          "Link unavailable",
          "<p>This link is invalid, expired or has been revoked.</p>",
          404,
        );
      const content = feedbackContent({ ...row, access_token: token });
      const entries = Object.entries(row.payload).filter(
        ([key]) => !["owner_id", "is_test", "source_refs"].includes(key),
      );
      const detail = entries
        .map(
          ([key, value]) =>
            `<dt>${escapeHtml(key.replace(/_/g, " "))}</dt><dd>${escapeHtml(typeof value === "object" ? JSON.stringify(value) : value)}</dd>`,
        )
        .join("");
      const form = row.resolved_at
        ? `<h2>Resolved</h2><p>${escapeHtml(row.resolved_at)}</p><p>${escapeHtml(row.resolution_note || "")}</p>`
        : `<form method="post" action="${escapeHtml(url.pathname + url.search)}"><h2>Resolve this feedback</h2><label for="note">Fix or resolution note (optional)</label><textarea id="note" name="note" maxlength="2000"></textarea><input type="hidden" name="token" value="${escapeHtml(token)}"><button name="confirm" value="resolve">Mark as resolved</button></form>`;
      return page(
        content.subject,
        `<p class="tag">${row.resolved_at ? "Resolved" : "Open"}</p><dl>${detail}</dl>${form}<p class="muted">This link gives access to this feedback item only. Keep it private.</p>`,
      );
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (
      !same(
        request.headers.get("authorization")?.replace(/^Bearer /, ""),
        env.EV4I_FEEDBACK_RELAY_SECRET,
      )
    )
      return json({ error: "Unauthorized" }, 401);
    if (Number(request.headers.get("content-length") || 0) > 2048)
      return json({ error: "Request too large" }, 413);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: "Request too large" }, 413);
    const body = JSON.parse(raw);
    if (body.action === "health")
      return json({
        ready: Boolean(env.SPERIN_RESEND_API_KEY && env.EV4I_FEEDBACK_DB_KEY),
        recipient: RECIPIENT,
        from: FROM,
      });
    if (body.action === "delivery" && UUID.test(body.email_id || "")) {
      const r = await fetcher(`https://api.resend.com/emails/${body.email_id}`, {
        headers: { Authorization: `Bearer ${env.SPERIN_RESEND_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok)
        return json({ error: "Delivery lookup unavailable", provider_status: r.status }, 502);
      const data = await r.json();
      return json({ id: data.id, last_event: data.last_event, to: data.to });
    }
    if (body.action !== "notify" || !UUID.test(body.id || ""))
      return json({ error: "Invalid notification" }, 400);
    if (!env.SPERIN_RESEND_API_KEY) return json({ error: "Email service not configured" }, 503);
    const auth = { p_secret: env.EV4I_FEEDBACK_RELAY_SECRET, p_id: body.id };
    const row = await rpc(
      "ev4i_feedback_relay",
      { ...auth, p_action: "claim", p_result: {} },
      env,
      fetcher,
    );
    if (!row) return json({ status: "already_sent_or_claimed" });
    try {
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SPERIN_RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `ev4i-feedback-${row.id}`,
        },
        body: JSON.stringify({ from: FROM, to: [RECIPIENT], ...feedbackContent(row) }),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok || !UUID.test(result.id || "")) {
        await rpc(
          "ev4i_feedback_relay",
          {
            ...auth,
            p_action: "failed",
            p_result: {
              error: `Email provider rejected request (${response.status}): ${String(result.name || "unknown")}`,
            },
          },
          env,
          fetcher,
        );
        return json(
          { error: "Email provider did not accept the alert", provider_status: response.status },
          502,
        );
      }
      await rpc(
        "ev4i_feedback_relay",
        { ...auth, p_action: "sent", p_result: { email_id: result.id } },
        env,
        fetcher,
      );
      console.info("EV4i feedback alert accepted", row.id, result.id);
      return json({ status: "accepted", email_id: result.id });
    } catch (error) {
      // Leave uncertain attempts claimed until lease expires; retry uses the same provider idempotency key.
      console.error(
        "EV4i feedback dispatch incomplete",
        body.id,
        error instanceof Error ? error.message : "Unknown error",
      );
      return json({ error: "Dispatch incomplete; queued for retry" }, 503);
    }
  } catch (error) {
    console.error(
      "EV4i feedback handler failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return json({ error: "Feedback service temporarily unavailable" }, 503);
  }
}
export function GET(request) {
  return handle(request);
}
export function POST(request) {
  return handle(request);
}
