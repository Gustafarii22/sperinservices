import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { canClaim, summaryStatus } from './channels';
import { messagingConfig, sendGmail, sendSms } from './providers.server';

export async function dispatchChannel(db: SupabaseClient<Database>, outboundId: string, channel: 'gmail' | 'sms', retry: boolean) {
  const { data: row, error: readError } = await db.from('outbound_channels').select('*').eq('outbound_id', outboundId).eq('channel', channel).single();
  if (readError || !row) throw new Error('Channel not found');
  if (!canClaim(row.status, retry)) return;
  const token = crypto.randomUUID();
  // Compare-and-set is durable across double clicks, workers, and simultaneous retries.
  const { data: claimed, error } = await db.from('outbound_channels').update({ status: 'sending', attempt_token: token, attempts: row.attempts + 1, error: null, provider_id: null, updated_at: new Date().toISOString() }).eq('id', row.id).eq('status', retry ? 'failed' : 'pending').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  if (!claimed) return;
  const { data: outbound, error: outError } = await db.from('outbound_messages').select('*').eq('id', outboundId).single();
  if (outError || !outbound) throw new Error('Approved message not found; retry is locked for safety');
  const result = channel === 'gmail'
    ? await sendGmail({ to: outbound.to_email, subject: outbound.subject, body: claimed.body, key: `${outbound.id}-${token}` }, messagingConfig())
    : await sendSms({ to: claimed.recipient ?? '', body: claimed.body, channelId: claimed.id, attempt: token }, messagingConfig());
  // A callback can beat the HTTP response. Never overwrite callback delivery state.
  const { error: finishError } = await db.from('outbound_channels').update({ status: result.status, provider_id: result.providerId ?? null, error: result.error ?? null, updated_at: new Date().toISOString() }).eq('id', row.id).eq('attempt_token', token).eq('status', 'sending').is('provider_id', null);
  if (finishError) throw new Error('Provider outcome could not be saved. Retry is locked; check provider history.');
  await refreshDispatch(db, outboundId);
  const { error: auditError } = await db.from('audit_logs').insert({ actor: 'owner', action: retry ? 'channel_retried' : 'channel_dispatched', lead_id: outbound.lead_id, detail: { channel, status: result.status, outbound_id: outboundId, provider_id: result.providerId ?? null } });
  if (auditError) throw new Error('Channel result saved, but audit recording failed');
}

export async function refreshDispatch(db: SupabaseClient<Database>, id: string) {
  const { data: channels, error } = await db.from('outbound_channels').select('*').eq('outbound_id', id);
  if (error || !channels?.length) throw new Error('Unable to read delivery states');
  const gmail = channels.find(c => c.channel === 'gmail');
  const sms = channels.find(c => c.channel === 'sms');
  const status = summaryStatus(channels.map(c => c.status));
  const { error: updateError } = await db.from('outbound_messages').update({ status, email_delivery_status: gmail?.status ?? null, gmail_message_id: gmail?.provider_id ?? null, provider_id: gmail?.provider_id ?? null, error: gmail?.error ?? null, sms_status: sms?.status ?? null, sms_provider_id: sms?.provider_id ?? null, sms_error: sms?.error ?? null, sms_updated_at: sms?.updated_at ?? null, sent_at: gmail && ['sent','delivered'].includes(gmail.status) ? gmail.updated_at : null }).eq('id', id);
  if (updateError) throw new Error(updateError.message);
  if (gmail && ['sent','delivered'].includes(gmail.status)) {
    const { data: out } = await db.from('outbound_messages').select('lead_id').eq('id', id).single();
    if (out) await db.from('leads').update({ status: 'approved_sent' }).eq('id', out.lead_id).in('status', ['received','needs_info','ready_for_review']);
  }
}