import { googleBusinessReviewsApi } from "./google-business-reviews.server";
import { independentReviewApi } from "./sperin-independent-reviews.server";

export async function reviewApi(request: Request): Promise<Response | null> {
  if (new URL(request.url).pathname === "/api/review-settings" && request.method === "GET")
    return Response.json({ independent: true }, { headers: { "Cache-Control": "no-store" } });

  const googleResponse = await googleBusinessReviewsApi(request);
  if (googleResponse) return googleResponse;

  return independentReviewApi(request);
}
