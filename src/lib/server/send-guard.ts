// Pure checks run on the server immediately before any outbound email.
export type SendPayload = { leadId: string; to: string; subject: string; body: string; confirmed: boolean };
export type LeadForSend = { id: string; status: string; is_sample: boolean; customer_email: string | null; reply_subject: string; reply_body: string };
export type ExistingSend = { status: string; idempotency_key: string };

const EMAIL_OK = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

export async function idempotencyKey(p: { leadId: string; to: string; subject: string; body: string }) {
  const data = new TextEncoder().encode(`${p.leadId}|${p.to.toLowerCase()}|${p.subject}|${p.body}`);
  const h = await crypto.subtle.digest("SHA-256", data);
  return "lead-" + [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

export function checkSend(payload: SendPayload, lead: LeadForSend | null, existing: ExistingSend[], key: string):
  { ok: true } | { ok: false; reason: string } {
  if (!payload.confirmed) return { ok: false, reason: "Owner confirmation missing" };
  if (!lead) return { ok: false, reason: "Lead not found" };
  if (lead.is_sample) return { ok: false, reason: "Sample leads can't be sent" };
  if (["approved_sent", "won", "declined", "archived"].includes(lead.status)) return { ok: false, reason: "A reply was already sent or the lead is closed" };
  if (!EMAIL_OK.test(payload.to.trim())) return { ok: false, reason: "Recipient email is not valid" };
  if (!payload.subject.trim() || payload.body.trim().length < 20) return { ok: false, reason: "Subject or message is empty" };
  if (payload.subject !== lead.reply_subject || payload.body !== lead.reply_body || payload.to.trim().toLowerCase() !== (lead.customer_email ?? "").toLowerCase())
    return { ok: false, reason: "The draft changed since you last saved – review again" };
  if (existing.some((e) => e.status === "sent" || e.status === "sending")) return { ok: false, reason: "Already sent (duplicate blocked)" };
  if (existing.some((e) => e.idempotency_key === key && e.status !== "failed")) return { ok: false, reason: "Duplicate send blocked" };
  return { ok: true };
}