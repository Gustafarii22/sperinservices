const events = new Set([
  "phone_click",
  "whatsapp_click",
  "email_click",
  "calculator_change",
  "estimate_pdf",
  "enquiry_success",
]);
/** Opt-in counts in existing hosting logs. No visitor IDs, query strings, addresses or form values. */
export async function analyticsApi(req: Request): Promise<Response | null> {
  if (new URL(req.url).pathname !== "/api/events") return null;
  const empty = (status: number) =>
    new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  if (req.method !== "POST") return empty(405);
  if (req.headers.get("origin") !== new URL(req.url).origin) return empty(403);
  if (!req.body) return empty(400);
  const reader = req.body.getReader();
  let text = "",
    bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 100) {
      await reader.cancel();
      return empty(413);
    }
    text += new TextDecoder().decode(value);
  }
  try {
    const body = JSON.parse(text);
    if (Object.keys(body).length !== 1 || !events.has(body.event)) return empty(400);
    console.info(JSON.stringify({ type: "sperin_conversion", event: body.event }));
    return empty(204);
  } catch {
    return empty(400);
  }
}
