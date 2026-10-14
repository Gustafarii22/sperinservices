import { bookingApi } from "../src/lib/booking-api.server";

export async function POST(request: Request) {
  return (await bookingApi(request)) ?? new Response("Not found", { status: 404 });
}
