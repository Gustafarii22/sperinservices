// Inbound email processing, written against injected deps so it can be unit-tested.
import { checkLeadSource, htmlToText } from "../leads/parser";
import { analyseText } from "../leads/analyse";
import type { RateCard } from "../leads/rates";
import { OWNER_EMAIL } from "../leads/status";

export type InboundDeps = {
  claimEvent: (eventId: string, type: string) => Promise<boolean>; // false if already seen
  finishEvent: (eventId: string, outcome: string, leadId?: string) => Promise<void>;
  fetchEmail: (emailId: string) => Promise<{ from: string; subject: string; text?: string | null; html?: string | null }>;
  leadExists: (messageId: string) => Promise<boolean>;
  insertLead: (row: Record<string, unknown>) => Promise<string>;
  audit: (action: string, detail: Record<string, unknown>, leadId?: string) => Promise<void>;
  rates: RateCard;
};

export async function processInbound(eventId: string, event: { type?: string; data?: { email_id?: string } }, deps: InboundDeps) {
  const type = event.type ?? "unknown";
  if (!(await deps.claimEvent(eventId, type))) return { status: 200, outcome: "duplicate" };
  if (type !== "email.received") {
    await deps.finishEvent(eventId, "ignored_type");
    return { status: 200, outcome: "ignored_type" };
  }
  const emailId = event.data?.email_id;
  if (!emailId || !/^[A-Za-z0-9-]{8,80}$/.test(emailId)) {
    await deps.finishEvent(eventId, "bad_payload");
    return { status: 200, outcome: "bad_payload" };
  }
  if (await deps.leadExists(emailId)) {
    await deps.finishEvent(eventId, "duplicate_email");
    return { status: 200, outcome: "duplicate_email" };
  }
  const email = await deps.fetchEmail(emailId);
  const text = email.text?.trim() || (email.html ? htmlToText(email.html) : "");
  const src = checkLeadSource(email.from, email.subject, text, OWNER_EMAIL);
  if (!src.ok) {
    await deps.finishEvent(eventId, `rejected_${src.reason}`);
    await deps.audit("inbound_rejected", { reason: src.reason });
    return { status: 200, outcome: `rejected_${src.reason}` };
  }
  const a = analyseText(email.subject, text, deps.rates);
  const leadId = await deps.insertLead({
    source: src.via === "hamuch" ? "webhook" : "forward",
    source_message_id: emailId,
    status: a.status,
    job_title: a.parsed.jobTitle,
    category: a.estimate.category,
    customer_name: a.parsed.customerName,
    customer_email: a.parsed.customerEmail,
    customer_phone: a.parsed.customerPhone,
    postcode: a.parsed.postcode,
    scope: a.parsed.scope,
    raw_excerpt: text.slice(0, 3000),
    suitability: a.suitability,
    travel_note: a.travelNote,
    estimate: a.estimate,
    reply_subject: a.reply.subject,
    reply_body: a.reply.body,
  });
  await deps.finishEvent(eventId, "created", leadId);
  await deps.audit("lead_received", { via: src.via }, leadId);
  return { status: 200, outcome: "created", leadId };
}