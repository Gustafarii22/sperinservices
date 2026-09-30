import { createHmac } from "node:crypto";
import { REVIEW_FIELDS } from "./review-config";
import { ownerCodeEmail, reviewNotification, sendSperinEmail } from "./sperin-review-email.server";
const cookieName = "sperin_services_owner_v2";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (value: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });
const cookie = (token: string, age = 3600) =>
  `${cookieName}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/owner; Max-Age=${age}`;
export function independentReviewsEnabled() {
  return process.env.SPERIN_INDEPENDENT_REVIEWS === "true";
}
function settings() {
  const url = process.env.SPERIN_SUPABASE_URL || "";
  const key = process.env.SPERIN_SUPABASE_SERVICE_ROLE_KEY || "";
  const email = process.env.SPERIN_OWNER_EMAIL?.toLowerCase() || "";
  const owner = process.env.SPERIN_OWNER_USER_ID || "";
  const site = process.env.SPERIN_SITE_URL || "";
  // Fail closed: this implementation must never authenticate against either other app.
  if (
    !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) ||
    /ooxeuejhuynglawkfwpp|xprmnikoyrocxyrhwdpn/.test(url) ||
    !key ||
    !email ||
    !uuid.test(owner) ||
    !site.startsWith("https://")
  )
    throw Error("Dedicated Sperin Services setup is incomplete.");
  return { url, key, email, owner, site };
}
export async function independentReviewApi(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname;
  if (
    path !== "/api/reviews" &&
    path !== "/api/reviews/submit" &&
    path !== "/api/reviews/notifications" &&
    !path.startsWith("/api/owner/")
  )
    return null;
  try {
    const c = settings();
    async function db(route: string, init: RequestInit = {}, token = c.key) {
      return fetch(`${c.url}${route}`, {
        ...init,
        signal: AbortSignal.timeout(12000),
        headers: {
          apikey: c.key,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
    }
    async function rpc(name: string, value: unknown) {
      const r = await db(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(value) });
      if (!r.ok) throw Error("Database operation unavailable.");
      return r.json();
    }
    async function notify(id: string) {
      const claimed = await rpc("sperin_claim_notification", { review_id: id });
      if (!claimed) return;
      try {
        const r = await db(`/rest/v1/sperin_reviews?id=eq.${id}&select=id,name,rating,service`);
        if (!r.ok) throw Error("Review unavailable");
        const [review] = await r.json();
        if (!review) throw Error("Review unavailable");
        const providerId = await sendSperinEmail(
          c.email,
          reviewNotification(c.site, review),
          `sperin-review-${id}`,
        );
        await rpc("sperin_finish_notification", { review_id: id, provider_id: providerId });
      } catch {
        await rpc("sperin_release_notification", { review_id: id });
      }
    }
    if (path === "/api/reviews/notifications" && req.method === "GET") {
      const secret = process.env.CRON_SECRET;
      if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
        return json({ error: "Not authorised" }, 401);
      const r = await db(
        "/rest/v1/sperin_review_notifications?sent_at=is.null&select=review_id&order=created_at.asc&limit=20",
      );
      if (!r.ok) throw Error("Queue unavailable");
      for (const row of await r.json()) await notify(row.review_id);
      return json({ success: true });
    }
    if (path === "/api/reviews" && req.method === "GET") {
      const r = await db(
        `/rest/v1/sperin_reviews?select=${REVIEW_FIELDS}&status=eq.approved&order=created_at.desc&limit=200`,
      );
      if (!r.ok) throw Error("Reviews unavailable");
      return json({ reviews: await r.json() });
    }
    if (req.method !== "GET" && req.headers.get("origin") !== new URL(req.url).origin)
      return json({ error: "Request origin not allowed." }, 403);
    const fingerprint = createHmac("sha256", c.key)
      .update(
        req.headers.get("x-vercel-forwarded-for") ||
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
      )
      .digest("hex");
    if (path === "/api/reviews/submit" && req.method === "POST") {
      const p = await req.json();
      const bounded = (x: unknown, min = 0) =>
        typeof x === "string" && x.trim().length >= min && x.trim().length <= 100;
      if (
        p.website ||
        !uuid.test(p.request_id) ||
        p.consent !== true ||
        !Number.isInteger(p.rating) ||
        p.rating < 1 ||
        p.rating > 5 ||
        !bounded(p.name, 2) ||
        !bounded(p.service, 2) ||
        !bounded(p.area) ||
        !bounded(p.job_reference) ||
        typeof p.text !== "string" ||
        !p.text.trim()
      )
        return json(
          { error: "Please complete your details, rating and review and confirm your consent." },
          400,
        );
      const r = await db("/rest/v1/rpc/sperin_accept_review", {
        method: "POST",
        body: JSON.stringify({
          payload: { ...p, text: p.text.trim(), name: p.name.trim(), service: p.service.trim() },
          fingerprint,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        return json(
          {
            error: err.message?.includes("Too many")
              ? "Too many submissions. Please try again later."
              : "Your review could not be saved. Please try again.",
          },
          err.message?.includes("Too many") ? 429 : 503,
        );
      }
      const id = await r.json();
      // The outbox is created atomically with the review. Email failure never loses feedback.
      await notify(id).catch(() => {});
      return json({ success: true, id }, 201);
    }
    if (path === "/api/owner/logout" && req.method === "POST")
      return json({ success: true }, 200, { "set-cookie": cookie("", 0) });
    if (
      (path === "/api/owner/request-code" || path === "/api/owner/verify-code") &&
      req.method === "POST"
    ) {
      const input = await req.json();
      if (typeof input.email !== "string" || input.email.toLowerCase().trim() !== c.email)
        return json({ error: "Use your Sperin Services owner email." }, 401);
      const allowed = await rpc("sperin_auth_attempt", {
        fingerprint: `${path}:${fingerprint}`,
        max_attempts: path.endsWith("request-code") ? 3 : 10,
      });
      if (!allowed)
        return json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
      if (path.endsWith("request-code")) {
        const mailAllowed = await rpc("sperin_auth_attempt", {
          fingerprint: "owner-mail",
          max_attempts: 3,
        });
        if (!mailAllowed)
          return json(
            { error: "A sign-in email was recently requested. Please try again later." },
            429,
          );
        const r = await db("/auth/v1/admin/generate_link", {
          method: "POST",
          body: JSON.stringify({ type: "magiclink", email: c.email }),
        });
        const data = await r.json();
        if (!r.ok || data.id !== c.owner || !data.email_otp)
          throw Error("Owner sign-in unavailable");
        await sendSperinEmail(
          c.email,
          ownerCodeEmail(data.email_otp),
          `sperin-signin-${crypto.randomUUID()}`,
        );
        return json({ success: true });
      }
      if (typeof input.code !== "string" || !/^\d{6,10}$/.test(input.code))
        return json({ error: "Enter the code from your email." }, 400);
      const r = await db("/auth/v1/verify", {
        method: "POST",
        body: JSON.stringify({ email: c.email, token: input.code, type: "email" }),
      });
      const data = await r.json();
      if (!r.ok || data.user?.id !== c.owner || !data.user?.email_confirmed_at)
        return json({ error: "The code is invalid or expired. Request a new code." }, 401);
      return json({ success: true }, 200, {
        "set-cookie": cookie(data.access_token, Math.min(data.expires_in || 3600, 3600)),
      });
    }
    const value = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`));
    const token = value ? decodeURIComponent(value.slice(cookieName.length + 1)) : "";
    if (!token) return json({ error: "Sign in to your Sperin Services owner area." }, 401);
    const u = await db("/auth/v1/user", {}, token);
    const user = await u.json();
    if (
      !u.ok ||
      user.id !== c.owner ||
      user.email?.toLowerCase() !== c.email ||
      !user.email_confirmed_at
    )
      return json({ error: "Your session has expired. Please sign in." }, 401, {
        "set-cookie": cookie("", 0),
      });
    if (path === "/api/owner/session" && req.method === "GET") return json({ email: user.email });
    if (path === "/api/owner/reviews" && req.method === "GET") {
      const r = await db(
        `/rest/v1/sperin_reviews?select=${REVIEW_FIELDS},sperin_review_private(job_reference),sperin_review_notifications(sent_at)&order=created_at.desc&limit=500`,
      );
      if (!r.ok) throw Error("Queue unavailable");
      const reviews = (await r.json()).map((x: Record<string, unknown>) => ({
        ...x,
        job_reference: (x.sperin_review_private as { job_reference?: string })?.job_reference || "",
        notification_sent: !!(x.sperin_review_notifications as { sent_at?: string })?.sent_at,
      }));
      return json({ reviews });
    }
    const match = path.match(/^\/api\/owner\/reviews\/([0-9a-f-]{36})$/i);
    if (match && uuid.test(match[1]) && req.method === "POST") {
      const { status, reply } = await req.json();
      if (
        !["approved", "rejected", "pending"].includes(status) ||
        typeof reply !== "string" ||
        reply.length > 2000
      )
        return json({ error: "Invalid review update." }, 400);
      const r = await db(`/rest/v1/sperin_reviews?id=eq.${match[1]}&select=${REVIEW_FIELDS}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status, reply: reply.trim() }),
      });
      if (!r.ok) throw Error("Update unavailable");
      const [review] = await r.json();
      return review ? json({ review }) : json({ error: "Review not found." }, 404);
    }
    return json({ error: "Not found." }, 404);
  } catch {
    return json(
      { error: "Sperin Services review management is temporarily unavailable. Please try again." },
      503,
    );
  }
}
