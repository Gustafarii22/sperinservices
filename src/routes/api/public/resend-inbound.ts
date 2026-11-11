import { createFileRoute } from "@tanstack/react-router";
import { verifySvix } from "@/lib/server/svix";
import { processInbound } from "@/lib/server/inbound";
import { mergeRates } from "@/lib/leads/rates";

// Resend inbound webhook (email.received). Signature-verified, idempotent, never sends email.
export const Route = createFileRoute("/api/public/resend-inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RESEND_WEBHOOK_SECRET"];
        const apiKey = process.env["RESEND_API_KEY"];
        if (!secret || !apiKey) return new Response("Not configured", { status: 503 });

        const body = await request.text();
        if (body.length > 256_000) return new Response("Too large", { status: 413 });
        const id = request.headers.get("svix-id");
        const v = await verifySvix(secret, {
          id,
          timestamp: request.headers.get("svix-timestamp"),
          signature: request.headers.get("svix-signature"),
        }, body);
        if (!v.ok || !id) return new Response("Invalid signature", { status: 401 });

        let event: { type?: string; data?: { email_id?: string } };
        try { event = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: settings } = await supabaseAdmin.from("app_settings").select("rates, retention_days").eq("id", 1).maybeSingle();
        const retention = settings?.retention_days ?? 365;

        try {
          const result = await processInbound(id, event, {
            rates: mergeRates(settings?.rates),
            claimEvent: async (eid, eventType) => {
              const { error } = await supabaseAdmin.from("webhook_events").insert({ id: eid, event_type: eventType, outcome: "processing" });
              return !error;
            },
            finishEvent: async (eid, outcome, leadId) => {
              await supabaseAdmin.from("webhook_events").update({ outcome, lead_id: leadId ?? null }).eq("id", eid);
            },
            leadExists: async (mid) => {
              const { data } = await supabaseAdmin.from("leads").select("id").eq("source_message_id", mid).maybeSingle();
              return !!data;
            },
            fetchEmail: async (emailId) => {
              const r = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
                headers: { Authorization: `Bearer ${apiKey}` },
              });
              if (!r.ok) throw new Error(`Resend fetch failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
              const j = (await r.json()) as { from?: string; subject?: string; text?: string; html?: string };
              return { from: j.from ?? "", subject: j.subject ?? "", text: j.text ?? null, html: j.html ?? null };
            },
            insertLead: async (row) => {
              const { data, error } = await supabaseAdmin.from("leads")
                .insert({ ...row, retain_until: new Date(Date.now() + retention * 864e5).toISOString() } as never)
                .select("id").single();
              if (error) throw new Error(error.message);
              return data.id;
            },
            audit: async (action, detail, leadId) => {
              await supabaseAdmin.from("audit_logs").insert({ actor: "webhook", action, lead_id: leadId ?? null, detail: detail as never });
            },
          });
          return Response.json({ outcome: result.outcome });
        } catch (e) {
          console.error("inbound processing failed", e);
          // Release the claim so Resend's retry can be processed.
          await supabaseAdmin.from("webhook_events").delete().eq("id", id).eq("outcome", "processing");
          return new Response("Processing error", { status: 500 });
        }
      },
    },
  },
});