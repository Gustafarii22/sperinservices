import { describe, expect, it } from "vitest";
import { parseLeadEmail, checkLeadSource } from "@/lib/leads/parser";
import { estimate, labour, classify } from "@/lib/leads/estimator";
import { DEFAULT_RATES as R } from "@/lib/leads/rates";
import { SAMPLE_LEADS } from "@/lib/leads/samples";
import { analyseText } from "@/lib/leads/analyse";
import { isOwnerIdentity } from "@/lib/leads/status";
import { verifySvix, signSvix } from "@/lib/server/svix";
import { checkSend, idempotencyKey } from "@/lib/server/send-guard";
import { processInbound, type InboundDeps } from "@/lib/server/inbound";

describe("parser", () => {
  it("extracts fields from a HaMuch lead", () => {
    const sample = SAMPLE_LEADS[0];
    if (!sample) throw new Error('Sample missing');
    const p = parseLeadEmail(sample);
    expect(p.jobTitle).toBe("Install smart doorbell and chime");
    expect(p.customerName).toBe("Sam Example");
    expect(p.customerEmail).toBe("sam.sample@example.com");
    expect(p.postcode).toBe("B67 5AA");
    expect(p.scope).toMatch(/Ring video doorbell/);
  });
  it("accepts HaMuch sender, rejects others", () => {
    expect(checkLeadSource("HaMuch <jobs@hamuch.com>", "New job: x", "", "info@sperinservices.co.uk").ok).toBe(true);
    expect(checkLeadSource("evil@spam.com", "New job: x", "hamuch", "info@sperinservices.co.uk").ok).toBe(false);
    expect(checkLeadSource("jobs@hamuch.com", "Newsletter", "hello", "info@sperinservices.co.uk").ok).toBe(false);
    expect(checkLeadSource("info@sperinservices.co.uk", "Fwd: New job: x", "From HaMuch", "info@sperinservices.co.uk").ok).toBe(true);
  });
});

describe("estimator", () => {
  it("labour: £60 first hour, £40 further, £20 half, £300 day", () => {
    expect(labour(1, R)).toBe(60);
    expect(labour(2, R)).toBe(100);
    expect(labour(2.5, R)).toBe(120);
    expect(labour(8, R)).toBe(300);
  });
  it("EICR 8 circuits = £200, 6 circuits = £160", () => {
    expect(estimate({ jobTitle: "EICR", scope: "8 circuits" }, R).low).toBe(200);
    expect(estimate({ jobTitle: "EICR", scope: "6 circuits" }, R).low).toBe(160);
  });
  it("consumer unit 7-10 = £800, unknown = range 650-800", () => {
    const e = estimate({ jobTitle: "Consumer unit", scope: "9 circuits" }, R);
    expect([e.kind, e.low]).toEqual(["fixed", 800]);
    const u = estimate({ jobTitle: "Consumer unit replacement", scope: "old fuse box" }, R);
    expect([u.kind, u.low, u.high]).toEqual(["range", 650, 800]);
  });
  it("EV socket is never a fixed price", () => {
    const e = estimate({ jobTitle: "External socket for EV charging", scope: "car" }, R);
    expect(e.kind).toBe("assessment");
    expect(e.materials).toBe("tbc");
  });
  it("weekend requests flag a surcharge instead of pricing it", () => {
    const e = estimate({ jobTitle: "EICR", scope: "6 circuits, Saturday please" }, R);
    expect(e.flags.join()).toMatch(/surcharge to confirm/);
    expect(e.low).toBe(160);
  });
  it("classifies all five samples", () => {
    expect(SAMPLE_LEADS.map((s) => classify(s.subject + s.text))).toEqual(["doorbell", "sockets", "ev_socket", "eicr", "consumer_unit"]);
  });
  it("sample analysis produces a reply with no VAT", () => {
    const sample = SAMPLE_LEADS[3];
    if (!sample) throw new Error('Sample missing');
    const a = analyseText(sample.subject, sample.text, R);
    expect(a.reply.body).toMatch(/£200/);
    expect(a.reply.body).toMatch(/no VAT/);
  });
});

describe("authorisation", () => {
  it("only the confirmed owner email is the owner", () => {
    expect(isOwnerIdentity("info@sperinservices.co.uk", true)).toBe(true);
    expect(isOwnerIdentity("INFO@sperinservices.co.uk", true)).toBe(true);
    expect(isOwnerIdentity("info@sperinservices.co.uk", false)).toBe(false);
    expect(isOwnerIdentity("someone@else.com", true)).toBe(false);
  });
});

describe("svix signature", () => {
  const secret = "whsec_" + btoa("test-secret-123456789012345678");
  it("accepts valid and rejects tampered", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(secret, "msg_1", ts, '{"a":1}');
    expect((await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: `v1,${sig}` }, '{"a":1}')).ok).toBe(true);
    expect((await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: `v1,${sig}` }, '{"a":2}')).ok).toBe(false);
    expect((await verifySvix(secret, { id: "msg_1", timestamp: "1000", signature: `v1,${sig}` }, '{"a":1}')).ok).toBe(false);
  });
});

describe("duplicate webhook events", () => {
  it("processes an event once", async () => {
    const seen = new Set<string>();
    const leads: string[] = [];
    const deps: InboundDeps = {
      rates: R,
      claimEvent: async (id) => (seen.has(id) ? false : (seen.add(id), true)),
      finishEvent: async () => {},
      leadExists: async () => false,
      fetchEmail: async () => ({ from: "jobs@hamuch.com", subject: SAMPLE_LEADS[1]?.subject ?? '', text: SAMPLE_LEADS[1]?.text ?? '' }),
      insertLead: async () => (leads.push("x"), "lead-1"),
      audit: async () => {},
    };
    const ev = { type: "email.received", data: { email_id: "abcd-1234-efgh" } };
    expect((await processInbound("evt1", ev, deps)).outcome).toBe("created");
    expect((await processInbound("evt1", ev, deps)).outcome).toBe("duplicate");
    expect(leads.length).toBe(1);
  });
  it("rejects unexpected sender", async () => {
    const deps = {
      rates: R, claimEvent: async () => true, finishEvent: async () => {}, leadExists: async () => false,
      fetchEmail: async () => ({ from: "x@phish.com", subject: "New job: free money", text: "hamuch" }),
      insertLead: async () => { throw new Error("should not insert"); }, audit: async () => {},
    };
    expect((await processInbound("e2", { type: "email.received", data: { email_id: "abcd-1234-efgh" } }, deps)).outcome).toBe("rejected_unexpected_sender");
  });
});

describe("send guards", () => {
  const lead = { id: "l1", status: "ready_for_review", is_sample: false, customer_email: "a@example.com", reply_subject: "Subj", reply_body: "Hello there, this is the reply body." };
  const payload = { leadId: "l1", to: "a@example.com", subject: "Subj", body: lead.reply_body, confirmed: true };
  it("allows a reviewed, matching draft", async () => {
    expect(checkSend(payload, lead, [], await idempotencyKey(payload)).ok).toBe(true);
  });
  it("blocks unconfirmed, samples, changed drafts and duplicates", async () => {
    const k = await idempotencyKey(payload);
    expect(checkSend({ ...payload, confirmed: false }, lead, [], k).ok).toBe(false);
    expect(checkSend(payload, { ...lead, is_sample: true }, [], k).ok).toBe(false);
    expect(checkSend({ ...payload, body: payload.body + "!" }, lead, [], k).ok).toBe(false);
    expect(checkSend(payload, lead, [{ status: "sent", idempotency_key: k }], k).ok).toBe(false);
    expect(checkSend(payload, { ...lead, status: "approved_sent" }, [], k).ok).toBe(false);
  });
});