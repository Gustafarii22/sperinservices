import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyTwilio } from '@/lib/server/channels';

export const Route = createFileRoute('/api/public/twilio-status')({ server: { handlers: {
  POST: async ({ request }) => {
    const token = process.env['TWILIO_AUTH_TOKEN'];
    const base = process.env['TWILIO_STATUS_CALLBACK_URL'];
    if (!token || !base) return new Response('Not configured', { status: 503 });
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response('Unsupported content type', { status: 415 });
    const text = await request.text();
    if (text.length > 32000) return new Response('Too large', { status: 413 });
    const search = new URL(request.url).search;
    const form = new URLSearchParams(text);
    const params: Record<string, string> = {};
    for (const [k,v] of form) {
      if (k in params) return new Response('Duplicate fields', { status: 400 });
      params[k] = v;
    }
    if (!await verifyTwilio(token, base + search, params, request.headers.get('x-twilio-signature'))) return new Response('Invalid signature', { status: 403 });
    const query = z.object({ channel: z.string().uuid(), attempt: z.string().uuid() }).safeParse(Object.fromEntries(new URL(request.url).searchParams));
    const payload = z.object({ MessageSid: z.string().regex(/^SM[a-fA-F0-9]{32}$/), MessageStatus: z.enum(['accepted','scheduled','queued','sending','sent','delivered','read','failed','undelivered','canceled']), ErrorCode: z.string().max(20).optional() }).safeParse(params);
    if (!query.success || !payload.success) return new Response('Invalid callback', { status: 400 });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: matched, error } = await supabaseAdmin.rpc('apply_sms_delivery', { p_channel: query.data.channel, p_attempt: query.data.attempt, p_sid: payload.data.MessageSid, p_status: payload.data.MessageStatus, p_error: payload.data.ErrorCode ? `Twilio error ${payload.data.ErrorCode}` : '' });
    if (error) return new Response('Unable to record status', { status: 500 });
    if (matched) {
      const { data: c } = await supabaseAdmin.from('outbound_channels').select('outbound_id').eq('id', query.data.channel).single();
      if (c) {
        const { refreshDispatch } = await import('@/lib/server/dispatch.server');
        await refreshDispatch(supabaseAdmin, c.outbound_id);
      }
    }
    return new Response(null, { status: 204 });
  },
} } });