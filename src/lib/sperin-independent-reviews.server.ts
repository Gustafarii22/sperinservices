import { neon } from "@neondatabase/serverless";
import { createHmac } from "node:crypto";
import { REVIEW_FIELDS } from "./review-config";
import { reviewNotification, sendSperinEmail } from "./sperin-review-email.server";
const cookieName = "sperin_services_owner_v2";
const ownerEmail = "info@sperinservices.co.uk";
const canonicalSite = "https://sperinservices.co.uk";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (value: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });
const cookie = (token: string, age = 3600) =>
  `${cookieName}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/owner; Max-Age=${age}`;
function settings() {
  const url = process.env.SPERIN_DATABASE_URL || "";
  const auth = process.env.SPERIN_NEON_AUTH_URL || process.env.SPERIN_NEON_AUTH_BASE_URL || "";
  const email = process.env.SPERIN_OWNER_EMAIL?.toLowerCase() || ownerEmail;
  const site = (process.env.SPERIN_SITE_URL || canonicalSite).replace(/\/+$/, "");
  // Dedicated Neon project only; no credentials or identities from other apps.
  if (
    !/^postgres(?:ql)?:\/\//.test(url) ||
    !new URL(url).hostname.endsWith(".neon.tech") ||
    !/^https:\/\/ep-tiny-glitter-zads9u9d\.neonauth\.c-2\.eu-west-2\.aws\.neon\.tech\/neondb\/auth$/.test(
      auth,
    ) ||
    email !== ownerEmail ||
    !site.startsWith("https://")
  )
    throw Error("Dedicated Sperin Services setup is incomplete.");
  return { url, auth, email, site };
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
    const sql = neon(c.url, { fetchOptions: { signal: AbortSignal.timeout(25000) } });
    async function auth(route: string, init: RequestInit = {}, sessionCookies?: string) {
      return fetch(`${c.auth}${route}`, {
        ...init,
        signal: AbortSignal.timeout(12000),
        headers: {
          "Content-Type": "application/json",
          Origin: c.site,
          ...(sessionCookies ? { Cookie: sessionCookies } : {}),
          ...init.headers,
        },
      });
    }
    function sessionCookiesFrom(response: Response) {
      const headers = response.headers as Headers & { getSetCookie?: () => string[] };
      const values =
        typeof headers.getSetCookie === "function"
          ? headers.getSetCookie()
          : [response.headers.get("set-cookie") || ""];
      return values
        .map((value) => value.split(";", 1)[0]?.trim())
        .filter(Boolean)
        .join("; ");
    }
    async function rpc(name: string, value: Record<string, unknown>) {
      const signatures: Record<string, string> = {
        sperin_claim_notification: "select public.sperin_claim_notification($1::uuid) as result",
        sperin_finish_notification:
          "select public.sperin_finish_notification($1::uuid,$2::text) as result",
        sperin_release_notification:
          "select public.sperin_release_notification($1::uuid) as result",
        sperin_auth_attempt: "select public.sperin_auth_attempt($1::text,$2::integer) as result",
      };
      if (!signatures[name]) throw Error("Unknown database operation");
      const rows = await sql.query(signatures[name], Object.values(value));
      return rows[0]?.result;
    }
    async function notify(id: string) {
      const claimed = await rpc("sperin_claim_notification", { review_id: id });
      if (!claimed) return;
      try {
        const [review] =
          await sql`select id,name,rating,service from public.sperin_reviews where id=${id}::uuid`;
        if (!review) throw Error("Review unavailable");
        const providerId = await sendSperinEmail(
          c.email,
          reviewNotification(
            c.site,
            review as { id: string; name: string; rating: number; service: string },
          ),
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
      const rows =
        await sql`select review_id from public.sperin_review_notifications where sent_at is null and (claimed_until is null or claimed_until<now()) order by created_at limit 5`;
      for (const row of rows) await notify(row.review_id);
      return json({ success: true });
    }
    if (path === "/api/reviews" && req.method === "GET") {
      const reviews = await sql.query(
        `select ${REVIEW_FIELDS} from public.sperin_reviews where status='approved' order by created_at desc limit 200`,
      );
      return json({ reviews });
    }
    if (req.method !== "GET" && req.headers.get("origin") !== new URL(req.url).origin)
      return json({ error: "Request origin not allowed." }, 403);
    const fingerprint = createHmac("sha256", c.url)
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
      let id: string;
      try {
        const payload = {
          ...p,
          text: p.text.trim(),
          name: p.name.trim(),
          service: p.service.trim(),
        };
        const [row] =
          await sql`select public.sperin_accept_review(${JSON.stringify(payload)}::jsonb,${fingerprint}) as id`;
        id = row.id;
      } catch (error) {
        const limited = error instanceof Error && error.message.includes("Too many");
        return json(
          {
            error: limited
              ? "Too many submissions. Please try again later."
              : "Your review could not be saved. Please try again.",
          },
          limited ? 429 : 503,
        );
      }
      // The outbox is created atomically with the review. Email failure never loses feedback.
      await notify(id).catch(() => {});
      return json({ success: true, id }, 201);
    }
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
        const r = await auth("/email-otp/send-verification-otp", {
          method: "POST",
          body: JSON.stringify({ email: c.email, type: "sign-in" }),
        });
        const data = await r.json();
        if (!r.ok || data.success !== true) throw Error("Owner sign-in unavailable");
        return json({ success: true });
      }
      if (typeof input.code !== "string" || !/^\d{6,10}$/.test(input.code))
        return json({ error: "Enter the code from your email." }, 400);
      const r = await auth("/sign-in/email-otp", {
        method: "POST",
        body: JSON.stringify({ email: c.email, otp: input.code, name: "Gus · Sperin Services" }),
      });
      const data = await r.json();
      const sessionCookies = sessionCookiesFrom(r);
      if (
        !r.ok ||
        data.user?.email?.toLowerCase() !== c.email ||
        !data.user?.emailVerified ||
        !sessionCookies
      )
        return json({ error: "The code is invalid or expired. Request a new code." }, 401);
      return json({ success: true }, 200, {
        "set-cookie": cookie(sessionCookies),
      });
    }
    const value = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`));
    const sessionCookies = value ? decodeURIComponent(value.slice(cookieName.length + 1)) : "";
    if (!sessionCookies)
      return json({ error: "Sign in to your Sperin Services owner area." }, 401);
    const u = await auth("/get-session", {}, sessionCookies);
    const session = await u.json();
    const user = session?.user;
    if (
      !u.ok ||
      !session?.session ||
      user?.email?.toLowerCase() !== c.email ||
      !user?.emailVerified
    )
      return json({ error: "Your session has expired. Please sign in." }, 401, {
        "set-cookie": cookie("", 0),
      });
    if (path === "/api/owner/logout" && req.method === "POST") {
      const result = await auth("/sign-out", { method: "POST", body: "{}" }, sessionCookies);
      if (!result.ok) throw Error("Sign-out unavailable");
      return json({ success: true }, 200, { "set-cookie": cookie("", 0) });
    }
    if (path === "/api/owner/session" && req.method === "GET") return json({ email: user.email });
    if (path === "/api/owner/retry-notifications" && req.method === "POST") {
      const rows =
        await sql`select review_id from public.sperin_review_notifications where sent_at is null and (claimed_until is null or claimed_until<now()) order by created_at limit 5`;
      for (const row of rows) await notify(row.review_id);
      const [remaining] =
        await sql`select count(*)::integer as count from public.sperin_review_notifications where sent_at is null`;
      return json({ success: true, remaining: remaining.count });
    }
    if (path === "/api/owner/reviews" && req.method === "GET") {
      const fields = REVIEW_FIELDS.split(",")
        .map((x) => `r.${x}`)
        .join(",");
      const reviews = await sql.query(
        `select ${fields},coalesce(p.job_reference,'') as job_reference,(n.sent_at is not null) as notification_sent from public.sperin_reviews r left join public.sperin_review_private p on p.review_id=r.id left join public.sperin_review_notifications n on n.review_id=r.id order by r.created_at desc limit 500`,
      );
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
      const [review] = await sql.query(
        `update public.sperin_reviews set status=$1,reply=$2 where id=$3::uuid returning ${REVIEW_FIELDS}`,
        [status, reply.trim(), match[1]],
      );
      return review ? json({ review }) : json({ error: "Review not found." }, 404);
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    console.error(
      "Sperin review API unavailable:",
      error instanceof Error ? error.message : "Unknown server error",
    );
    return json(
      { error: "Sperin Services review management is temporarily unavailable. Please try again." },
      503,
    );
  }
}
