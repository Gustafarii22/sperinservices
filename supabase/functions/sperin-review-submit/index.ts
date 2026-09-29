import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const origins =
  /^https:\/\/(sperinservices\.co\.uk|www\.sperinservices\.co\.uk|sperinservices(?:-[a-z0-9-]+)?\.vercel\.app)$/;
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origins.test(origin) ? origin : "https://sperinservices.co.uk",
    "Access-Control-Allow-Headers": "content-type,apikey,authorization",
    Vary: "Origin",
  };
  const respond = (status: number, value: unknown) =>
    new Response(JSON.stringify(value), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" });
  if (Number(req.headers.get("content-length")) > 16000)
    return respond(413, { error: "Review is too long" });
  try {
    const raw = await req.text();
    if (raw.length > 16000) return respond(413, { error: "Review is too long" });
    const input = JSON.parse(raw);
    const clean = (key: string, max: number, min = 0) => {
      if (typeof input[key] !== "string") throw Error("Please complete the required fields.");
      const value = input[key].trim();
      if (value.length < min || value.length > max)
        throw Error("Please check the length of your review and details.");
      return value;
    };
    if (input.website) return respond(400, { error: "Unable to accept this submission." });
    if (
      input.consent !== true ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        input.request_id,
      )
    )
      return respond(400, { error: "Please select a rating and confirm your consent." });
    const payload = {
      request_id: input.request_id,
      name: clean("name", 100, 2),
      area: clean("area", 100),
      service: clean("service", 100, 2),
      text: clean("text", 3000, 10),
      job_reference: clean("job_reference", 100),
      rating: input.rating,
      consent: true,
    };
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hmac = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hash = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(ip));
    const fingerprint = Array.from(new Uint8Array(hash))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, key);
    const { data, error } = await db.rpc("sperin_accept_review", { payload, fingerprint });
    if (error)
      return respond(error.message.includes("Too many") ? 429 : 503, {
        error: error.message.includes("Too many")
          ? "Too many submissions. Please try again in an hour."
          : "We could not save your review. Your text is still here; please try again.",
      });
    return respond(201, { success: true, id: data });
  } catch {
    return respond(400, {
      error: "Please check your details. Reviews must contain 10–3,000 characters.",
    });
  }
});
