type GoogleRating = "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";

type GoogleApiReview = {
  reviewId?: string;
  name?: string;
  reviewer?: {
    displayName?: string;
    isAnonymous?: boolean;
  };
  starRating?: GoogleRating;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

type GoogleApiResponse = {
  reviews?: GoogleApiReview[];
  averageRating?: number;
  totalReviewCount?: number;
};

export type PublicGoogleReview = {
  id: string;
  reviewer: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
  source: "google";
};

type CacheEntry = {
  expiresAt: number;
  payload: {
    configured: true;
    reviews: PublicGoogleReview[];
    averageRating: number | null;
    totalReviewCount: number | null;
    fetchedAt: string;
    stale?: boolean;
  };
};

let cache: CacheEntry | null = null;
const cacheMs = 15 * 60 * 1000;

const json = (value: unknown, status = 200, cacheControl = "no-store") =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": cacheControl },
  });

function config() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() || "";
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN?.trim() || "";
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim() || "";
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim() || "";
  const values = [clientId, clientSecret, refreshToken, accountId, locationId];
  if (values.every(Boolean))
    return { clientId, clientSecret, refreshToken, accountId, locationId };
  if (values.some(Boolean)) throw Error("Google Business Profile review configuration is incomplete.");
  return null;
}

function rating(value?: GoogleRating) {
  return value ? ["ONE", "TWO", "THREE", "FOUR", "FIVE"].indexOf(value) + 1 : 0;
}

async function accessToken(c: NonNullable<ReturnType<typeof config>>) {
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    refresh_token: c.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json()) as { access_token?: string };
  if (!response.ok || !data.access_token) throw Error("Google OAuth refresh failed.");
  return data.access_token;
}

function normalize(review: GoogleApiReview): PublicGoogleReview | null {
  const stars = rating(review.starRating);
  const date = review.createTime || review.updateTime;
  if (!stars || !date) return null;
  return {
    id:
      review.reviewId ||
      review.name ||
      `google-${date}-${review.reviewer?.displayName || "anonymous"}`,
    reviewer:
      review.reviewer?.isAnonymous || !review.reviewer?.displayName
        ? "Google customer"
        : review.reviewer.displayName,
    rating: stars,
    text: review.comment?.trim() || "",
    created_at: date,
    updated_at: review.updateTime || date,
    source: "google",
  };
}

export async function googleBusinessReviewsApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/google-reviews" || request.method !== "GET") return null;

  let c: ReturnType<typeof config>;
  try {
    c = config();
  } catch (error) {
    console.error(
      "Google review feed unavailable:",
      error instanceof Error ? error.message : "Unknown configuration error",
    );
    return json({ configured: false, reviews: [] }, 503);
  }
  if (!c) return json({ configured: false, reviews: [] });

  if (cache && cache.expiresAt > Date.now()) {
    return json(
      cache.payload,
      200,
      "public, max-age=300, s-maxage=900, stale-while-revalidate=86400",
    );
  }

  try {
    const token = await accessToken(c);
    const parent = `accounts/${encodeURIComponent(c.accountId)}/locations/${encodeURIComponent(c.locationId)}`;
    const endpoint = new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`);
    endpoint.searchParams.set("pageSize", "50");
    endpoint.searchParams.set("orderBy", "updateTime desc");
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as GoogleApiResponse;
    if (!response.ok) throw Error("Google Business Profile reviews request failed.");

    const reviews = (data.reviews || [])
      .map(normalize)
      .filter((review): review is PublicGoogleReview => Boolean(review))
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

    const payload = {
      configured: true as const,
      reviews,
      averageRating:
        typeof data.averageRating === "number" && Number.isFinite(data.averageRating)
          ? data.averageRating
          : null,
      totalReviewCount:
        typeof data.totalReviewCount === "number" && Number.isFinite(data.totalReviewCount)
          ? data.totalReviewCount
          : null,
      fetchedAt: new Date().toISOString(),
    };
    cache = { expiresAt: Date.now() + cacheMs, payload };
    return json(payload, 200, "public, max-age=300, s-maxage=900, stale-while-revalidate=86400");
  } catch (error) {
    console.error(
      "Google review feed unavailable:",
      error instanceof Error ? error.message : "Unknown provider error",
    );
    if (cache) {
      return json(
        { ...cache.payload, stale: true },
        200,
        "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      );
    }
    return json(
      { configured: true, reviews: [], error: "Google reviews are temporarily unavailable." },
      503,
    );
  }
}
