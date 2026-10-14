import { bookingApi } from "../../src/lib/booking-api.server.js";

// Explicit Vercel API entry: native /api functions take precedence over the SSR fallback.
export async function POST(request: Request) {
  return (await bookingApi(request)) ?? new Response("Not found", { status: 404 });
}
