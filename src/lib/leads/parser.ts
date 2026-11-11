// Parses HaMuch "New job:" enquiry emails (direct, forwarded, or pasted).
// Keeps only the minimum fields needed to quote and reply.
import { extractUkPhone } from '../server/channels';

export type ParsedLead = {
  jobTitle: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  postcode: string | null;
  scope: string;
};

const POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const OUTWARD_ONLY_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\b/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function field(text: string, labels: string[]): string | null {
  for (const l of labels) {
    const re = new RegExp(`^\\s*(?:\\*\\s*)?${l}\\s*[:\\-]\\s*(.+)$`, "im");
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

function block(text: string, labels: string[]): string | null {
  for (const l of labels) {
    const re = new RegExp(
      `^\\s*${l}\\s*[:\\-]\\s*([\\s\\S]*?)(?=^\\s*(?:name|customer|email|phone|telephone|mobile|postcode|location|address|budget|timing|when|start date|preferred)\\s*[:\\-]|^\\s*(?:view job|reply|kind regards|thanks|--)|$(?![\\s\\S]))`,
      "im",
    );
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function normalisePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.toUpperCase().match(POSTCODE_RE);
  if (m) return `${m[1]} ${m[2]}`;
  const o = raw.toUpperCase().match(OUTWARD_ONLY_RE);
  return o?.[1] ?? null;
}

export function parseLeadEmail(input: { subject?: string; text: string }): ParsedLead {
  const text = input.text.replace(/\r/g, "");
  const subject = input.subject ?? "";

  let jobTitle =
    subject.match(/new job:\s*(.+)/i)?.[1]?.trim() ||
    text.match(/new job:\s*(.+)/i)?.[1]?.trim() ||
    field(text, ["job title", "job", "title"]) ||
    "";
  jobTitle = jobTitle.replace(/^(fwd?|re):\s*/i, "").slice(0, 140);

  const customerName = field(text, ["customer name", "customer", "name", "contact"]);
  const emailField = field(text, ["email", "e-mail", "customer email"]);
  const emails = [...(emailField ?? "").matchAll(EMAIL_RE), ...text.matchAll(EMAIL_RE)]
    .map((m) => m[0].toLowerCase())
    .filter((e) => !/hamuch\.com$|sperinservices\.co\.uk$|resend\.|noreply|no-reply/.test(e));
  const phoneField = field(text, ["phone", "telephone", "mobile", "tel"]);
  const phone = extractUkPhone(phoneField ?? text);
  const pcField = field(text, ["postcode", "post code", "location", "address", "area"]);
  const postcode = normalisePostcode(pcField) ?? normalisePostcode(text.match(POSTCODE_RE)?.[0]);

  const scope =
    block(text, ["job description", "description", "details", "job details", "message", "scope"]) ??
    text.split("\n").filter((l) => l.trim().length > 25).slice(0, 4).join(" ");

  return {
    jobTitle: jobTitle || scope.slice(0, 60),
    customerName: customerName ? customerName.split(/\s+/).slice(0, 2).join(" ").slice(0, 60) : null,
    customerEmail: emails[0] ?? null,
    customerPhone: phone,
    postcode,
    scope: scope.slice(0, 2000),
  };
}

export const HAMUCH_SENDER_DOMAINS = ["hamuch.com"];

function senderDomain(from: string) {
  const m = from.toLowerCase().match(/@([a-z0-9.-]+)/);
  return m?.[1] ?? "";
}

/**
 * Accept only: (a) mail from a HaMuch domain, or (b) a forward from the owner's own
 * mailbox that clearly contains a HaMuch enquiry. Both must look like "New job:" content.
 */
export function checkLeadSource(from: string, subject: string, text: string, ownerEmail: string) {
  const dom = senderDomain(from);
  const fromHamuch = HAMUCH_SENDER_DOMAINS.some((d) => dom === d || dom.endsWith("." + d));
  const fromOwner = from.toLowerCase().includes(ownerEmail.toLowerCase());
  const plausible = /new job:/i.test(subject) || /new job:/i.test(text);
  const mentionsHamuch = /hamuch/i.test(text) || /hamuch/i.test(subject);
  if (!plausible) return { ok: false as const, reason: "not_new_job_content" };
  if (fromHamuch) return { ok: true as const, via: "hamuch" as const };
  if (fromOwner && mentionsHamuch) return { ok: true as const, via: "forward" as const };
  return { ok: false as const, reason: "unexpected_sender" };
}