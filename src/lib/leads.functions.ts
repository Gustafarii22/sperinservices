import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyseText, analyse } from "@/lib/leads/analyse";
import { mergeRates } from "@/lib/leads/rates";
import { SAMPLE_LEADS } from "@/lib/leads/samples";
import { idempotencyKey } from "@/lib/server/send-guard";
import { ukMobile, smsDraft } from "@/lib/server/channels";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

async function assertOwner(ctx: Ctx) {
  const { data, error } = await ctx.supabase.rpc("is_owner");
  if (error || data !== true) throw new Error("Forbidden: owner account only");
}
async function audit(ctx: Ctx, action: string, leadId: string | null, detail: Record<string, unknown> = {}) {
  await ctx.supabase.from("audit_logs").insert({ actor: "owner", action, lead_id: leadId, detail: detail as never });
}
async function loadRates(ctx: Ctx) {
  const { data } = await ctx.supabase.from("app_settings").select("rates, retention_days").eq("id", 1).maybeSingle();
  return { rates: mergeRates(data?.rates), retentionDays: data?.retention_days ?? 365 };
}

export const createLeadFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ subject: z.string().max(300).default(""), text: z.string().min(10).max(20000), source: z.enum(["paste", "forward", "sample"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { rates, retentionDays } = await loadRates(context);
    const a = analyseText(data.subject, data.text, rates);
    const sample = data.source === "sample";
    const { data: row, error } = await context.supabase.from("leads").insert({
      source: data.source,
      is_sample: sample,
      status: a.status,
      job_title: a.parsed.jobTitle,
      category: a.estimate.category,
      customer_name: a.parsed.customerName,
      customer_email: a.parsed.customerEmail,
      customer_phone: a.parsed.customerPhone,
      postcode: a.parsed.postcode,
      scope: a.parsed.scope,
      raw_excerpt: data.text.slice(0, 3000),
      suitability: a.suitability,
      travel_note: a.travelNote,
      estimate: a.estimate as never,
      reply_subject: a.reply.subject,
      reply_body: a.reply.body,
      retain_until: new Date(Date.now() + retentionDays * 864e5).toISOString(),
    }).select("id").single();
    if (error) throw new Error(error.message);
    await audit(context, "lead_created", row.id, { source: data.source });
    return { id: row.id };
  });

export const loadSampleLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { rates } = await loadRates(context);
    const rows = SAMPLE_LEADS.map((s) => {
      const a = analyseText(s.subject, s.text, rates);
      return {
        source: "sample", is_sample: true, status: a.status, job_title: a.parsed.jobTitle, category: a.estimate.category,
        customer_name: a.parsed.customerName, customer_email: a.parsed.customerEmail, postcode: a.parsed.postcode,
        scope: a.parsed.scope, raw_excerpt: s.text, suitability: a.suitability, travel_note: a.travelNote,
        estimate: a.estimate as never, reply_subject: a.reply.subject, reply_body: a.reply.body,
        retain_until: new Date(Date.now() + 30 * 864e5).toISOString(),
      };
    });
    const { error } = await context.supabase.from("leads").insert(rows);
    if (error) throw new Error(error.message);
    await audit(context, "samples_loaded", null, { count: rows.length });
    return { count: rows.length };
  });

export const recomputeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { rates } = await loadRates(context);
    const { data: l, error } = await context.supabase.from("leads").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const a = analyse({ jobTitle: l.job_title, customerName: l.customer_name, customerEmail: l.customer_email, customerPhone: l.customer_phone, postcode: l.postcode, scope: l.scope }, rates);
    await context.supabase.from("leads").update({
      category: a.estimate.category, suitability: a.suitability, travel_note: a.travelNote, estimate: a.estimate as never,
      reply_subject: a.reply.subject, reply_body: a.reply.body,
    }).eq("id", data.id);
    await audit(context, "lead_recomputed", data.id);
    return { ok: true };
  });

export const approveAndSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ leadId: z.string().uuid(), to: z.string().email().max(320), subject: z.string().min(1).max(300).refine(s => !/[\r\n]/.test(s)), body: z.string().min(20).max(10000), sms: z.string().min(10).max(480), confirmed: z.literal(true) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { data: lead, error: leadError } = await context.supabase.from('leads').select('customer_phone').eq('id', data.leadId).single();
    if (leadError || !lead) throw new Error('Lead not found');
    const key = await idempotencyKey(data);
    const { data: outboundId, error } = await context.supabase.rpc('approve_quote', { p_lead: data.leadId, p_to: data.to, p_subject: data.subject, p_body: data.body, p_sms: data.sms, p_mobile: ukMobile(lead.customer_phone) ?? '', p_confirmed: data.confirmed, p_key: key });
    if (error || !outboundId) return { ok: false as const, reason: error?.message ?? 'Approval failed' };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { dispatchChannel } = await import('@/lib/server/dispatch.server');
    const outcomes = await Promise.allSettled([dispatchChannel(supabaseAdmin, outboundId, 'gmail', false), dispatchChannel(supabaseAdmin, outboundId, 'sms', false)]);
    const uncertain = outcomes.some(o => o.status === 'rejected');
    return { ok: true as const, outboundId, warning: uncertain ? 'One result could not be recorded. Check Sent history; do not send again.' : null };
  });

export const retryChannel = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ outboundId: z.string().uuid(), channel: z.enum(['gmail','sms']), confirmed: z.literal(true) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { data: out, error } = await context.supabase.from('outbound_messages').select('id').eq('id', data.outboundId).single();
    if (error || !out) throw new Error('Approved message not found');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { dispatchChannel } = await import('@/lib/server/dispatch.server');
    await dispatchChannel(supabaseAdmin, out.id, data.channel, true);
    return { ok: true };
  });

export const saveDraft = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), to: z.string().email().max(320), phone: z.string().max(80), subject: z.string().min(1).max(300).refine(s => !/[\r\n]/.test(s)), body: z.string().min(20).max(10000) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { data: previous } = await context.supabase.from('outbound_messages').select('id').eq('lead_id', data.id).limit(1);
    if (previous?.length) throw new Error('This quote is approved. Use Sent history for failed-channel retries.');
    const { error } = await context.supabase.from('leads').update({ customer_email: data.to, customer_phone: data.phone || null, reply_subject: data.subject, reply_body: data.body }).eq('id', data.id);
    if (error) throw new Error(error.message);
    await audit(context, 'draft_saved', data.id);
    return { ok: true };
  });

export const getWorkspace = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const [leads, sent, channels] = await Promise.all([
      context.supabase.from('leads').select('*').order('created_at', { ascending: false }),
      context.supabase.from('outbound_messages').select('*').order('created_at', { ascending: false }),
      context.supabase.from('outbound_channels').select('*'),
    ]);
    if (leads.error || sent.error || channels.error) throw new Error('Unable to load private workspace');
    const { messagingConfig, missingConfig } = await import('@/lib/server/providers.server');
    const config = messagingConfig();
    return { leads: leads.data ?? [], sent: sent.data ?? [], channels: channels.data ?? [], gmailMissing: missingConfig('gmail', config), smsMissing: missingConfig('sms', config), smsDrafts: Object.fromEntries((leads.data ?? []).map(l => [l.id, smsDraft(l.customer_name, l.job_title)])) };
  });

export const getConnectionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data: lastEvent } = await context.supabase.from("webhook_events").select("received_at,outcome").order("received_at", { ascending: false }).limit(1).maybeSingle();
    const { data: lastCreated } = await context.supabase.from("webhook_events").select("received_at").eq("outcome", "created").order("received_at", { ascending: false }).limit(1).maybeSingle();
    const { data: lastSent } = await context.supabase.from("outbound_messages").select("sent_at").eq("status", "sent").order("sent_at", { ascending: false }).limit(1).maybeSingle();
    return {
      hasApiKey: !!process.env["RESEND_API_KEY"],
      hasWebhookSecret: !!process.env["RESEND_WEBHOOK_SECRET"],
      hasFromAddress: !!process.env["RESEND_FROM_ADDRESS"],
      lastEvent: lastEvent ?? null,
      lastVerifiedLeadAt: lastCreated?.received_at ?? null,
      lastSentAt: lastSent?.sent_at ?? null,
    };
  });

export const purgeExpired = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data, error } = await context.supabase.rpc("purge_expired_leads");
    if (error) throw new Error(error.message);
    return { deleted: data as number };
  });