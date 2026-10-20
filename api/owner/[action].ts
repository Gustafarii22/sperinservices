import { independentReviewApi } from "../../src/lib/sperin-independent-reviews.server.js";

// Keep every owner action behind the existing session and same-origin checks.
async function handle(request: Request) {
  return (await independentReviewApi(request)) ?? new Response("Not found", { status: 404 });
}
export const GET = handle;
export const POST = handle;
