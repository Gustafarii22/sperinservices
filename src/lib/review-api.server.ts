import {
  REVIEW_DATABASE_URL as DB,
  REVIEW_PUBLIC_KEY as KEY,
  REVIEW_OWNER_ID,
  REVIEW_FIELDS,
} from "./review-config";
const json = (value: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });
const cookieName = "sperin_owner";
const authCookie = (token: string, req: Request, age = 3600) =>
  `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api/owner; Max-Age=${age}${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
async function db(path: string, token?: string, init: RequestInit = {}) {
  return fetch(`${DB}${path}`, {
    ...init,
    signal: AbortSignal.timeout(12000),
    headers: {
      apikey: KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}
export async function reviewApi(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname;
  if (path !== "/api/reviews" && !path.startsWith("/api/owner/")) return null;
  try {
    if (path === "/api/reviews" && req.method === "GET") {
      const r = await db(
        `/rest/v1/sperin_reviews?select=${REVIEW_FIELDS}&status=eq.approved&order=created_at.desc&limit=200`,
      );
      return r.ok
        ? json({ reviews: await r.json() })
        : json({ error: "Reviews are temporarily unavailable. Please try again." }, 503);
    }
    if (req.method !== "GET" && req.headers.get("origin") !== new URL(req.url).origin)
      return json({ error: "Request origin not allowed." }, 403);
    if (Number(req.headers.get("content-length")) > 10000)
      return json({ error: "Request too large." }, 413);
    if (path === "/api/owner/logout" && req.method === "POST")
      return json({ success: true }, 200, { "set-cookie": authCookie("", req, 0) });
    if (path === "/api/owner/login" && req.method === "POST") {
      const { email, password } = await req.json();
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        password.length > 200 ||
        email.length > 254
      )
        return json({ error: "Enter your owner email and password." }, 400);
      const r = await db("/auth/v1/token?grant_type=password", undefined, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok || data.user?.id !== REVIEW_OWNER_ID)
        return json(
          { error: "Unable to sign in. Use your existing owner account and password." },
          401,
        );
      return json({ success: true }, 200, {
        "set-cookie": authCookie(data.access_token, req, Math.min(data.expires_in || 3600, 3600)),
      });
    }
    const cookie = req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(`${cookieName}=`));
    const token = cookie ? decodeURIComponent(cookie.slice(cookieName.length + 1)) : "";
    if (!token) return json({ error: "Please sign in to manage reviews." }, 401);
    const u = await db("/auth/v1/user", token);
    const user = await u.json();
    if (!u.ok || user.id !== REVIEW_OWNER_ID)
      return json({ error: "Your session has expired. Please sign in again." }, 401, {
        "set-cookie": authCookie("", req, 0),
      });
    if (path === "/api/owner/session" && req.method === "GET") return json({ email: user.email });
    if (path === "/api/owner/reviews" && req.method === "GET") {
      const [r, p] = await Promise.all([
        db(
          `/rest/v1/sperin_reviews?select=${REVIEW_FIELDS}&order=created_at.desc&limit=500`,
          token,
        ),
        db("/rest/v1/sperin_review_private?select=review_id,job_reference", token),
      ]);
      if (!r.ok || !p.ok) return json({ error: "Could not load reviews. Please refresh." }, 503);
      const reviews = await r.json(),
        details = await p.json();
      return json({
        reviews: reviews.map((x: { id: string }) => ({
          ...x,
          job_reference:
            details.find((d: { review_id: string }) => d.review_id === x.id)?.job_reference || "",
        })),
      });
    }
    const match = path.match(/^\/api\/owner\/reviews\/([0-9a-f-]{36})$/i);
    if (match && req.method === "POST") {
      const { status, reply } = await req.json();
      if (
        !["pending", "approved", "rejected"].includes(status) ||
        typeof reply !== "string" ||
        reply.length > 2000
      )
        return json({ error: "Invalid review update." }, 400);
      const r = await db(
        `/rest/v1/sperin_reviews?id=eq.${match[1]}&select=${REVIEW_FIELDS}`,
        token,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status, reply: reply.trim() }),
        },
      );
      if (!r.ok) return json({ error: "Update failed. Please try again." }, 503);
      const rows = await r.json();
      return rows.length ? json({ review: rows[0] }) : json({ error: "Review not found." }, 404);
    }
    return json({ error: "Not found." }, 404);
  } catch {
    return json({ error: "The service could not complete this request. Please try again." }, 503);
  }
}
