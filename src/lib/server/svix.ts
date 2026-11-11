// Svix (Resend webhook) signature verification using Web Crypto (works on Workers).
// https://docs.svix.com/receiving/verifying-payloads/how-manual

const TOLERANCE_SECONDS = 5 * 60;

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: ArrayBuffer): string {
  let s = "";
  const u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i] ?? 0);
  return btoa(s);
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signSvix(secret: string, id: string, timestamp: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    b64ToBytes(secret.replace(/^whsec_/, "")) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  return bytesToB64(sig);
}

export async function verifySvix(
  secret: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { id, timestamp, signature } = headers;
  if (!secret) return { ok: false, reason: "no_secret" };
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing_headers" };
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return { ok: false, reason: "timestamp" };
  let expected: string;
  try {
    expected = await signSvix(secret, id, timestamp, body);
  } catch {
    return { ok: false, reason: "bad_secret" };
  }
  const match = signature
    .split(" ")
    .map((p) => p.split(","))
    .some(([v, s]) => v === "v1" && !!s && safeEqual(s, expected));
  return match ? { ok: true } : { ok: false, reason: "signature" };
}