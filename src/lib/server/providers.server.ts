import { rawGmail, type ProviderResult } from './channels';

type Config = { gatewayKey?: string | undefined; gmailKey?: string | undefined; twilioKey?: string | undefined; smsFrom?: string | undefined; callbackUrl?: string | undefined; twilioAuthToken?: string | undefined };
const BASE = 'https://connector-gateway.lovable.dev';
export function messagingConfig(): Config {
  return { gatewayKey: process.env['LOVABLE_API_KEY'], gmailKey: process.env['GOOGLE_MAIL_API_KEY'], twilioKey: process.env['TWILIO_API_KEY'], smsFrom: process.env['TWILIO_FROM_NUMBER'], callbackUrl: process.env['TWILIO_STATUS_CALLBACK_URL'], twilioAuthToken: process.env['TWILIO_AUTH_TOKEN'] };
}
export function missingConfig(channel: string, c: Config): string | null {
  if (!c.gatewayKey) return 'Lovable connection key is missing.';
  if (channel === 'gmail') return c.gmailKey ? null : 'Connect Gmail as info@sperinservices.co.uk in Setup.';
  if (!c.twilioKey) return 'Connect Twilio in Setup.';
  if (!c.smsFrom || !/^\+[1-9]\d{7,14}$/.test(c.smsFrom)) return 'Set a valid TWILIO_FROM_NUMBER.';
  if (!c.twilioAuthToken) return 'Set TWILIO_AUTH_TOKEN for signed delivery updates.';
  try { if (!c.callbackUrl || new URL(c.callbackUrl).protocol !== 'https:' || new URL(c.callbackUrl).pathname !== '/api/public/twilio-status' || new URL(c.callbackUrl).search) return 'Set the exact HTTPS TWILIO_STATUS_CALLBACK_URL shown in Setup.'; } catch { return 'Set a valid TWILIO_STATUS_CALLBACK_URL.'; }
  return null;
}

async function providerResponse(response: Response): Promise<{ result?: ProviderResult; data?: Record<string, unknown> }> {
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { /* Unparseable success is uncertain, never resend. */ }
  if (!response.ok) {
    const message = typeof data['message'] === 'string' ? data['message'] : typeof data['error'] === 'object' && data['error'] ? String((data['error'] as Record<string, unknown>)['message'] ?? 'Provider rejected the request') : 'Provider rejected the request';
    // Do not persist raw gateway bodies: they may contain credentials or account details.
    return { result: { status: response.status >= 500 || response.status === 408 ? 'unknown' : 'failed', error: `Provider HTTP ${response.status}: ${message.slice(0, 400)}` } };
  }
  return { data };
}

export async function sendGmail(input: { to: string; subject: string; body: string; key: string }, c: Config, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const missing = missingConfig('gmail', c);
  if (missing) return { status: 'failed', error: missing };
  const headers = { Authorization: `Bearer ${c.gatewayKey}`, 'X-Connection-Api-Key': String(c.gmailKey) };
  // A profile read is mandatory: Gmail must be the requested account, not another workspace inbox.
  try {
    const profile = await fetcher(`${BASE}/google_mail/gmail/v1/users/me/profile`, { headers, signal: AbortSignal.timeout(15000) });
    const parsed = await providerResponse(profile);
    if (parsed.result) return { ...parsed.result, status: 'failed' }; // no send was attempted
    if (String(parsed.data?.['emailAddress']).toLowerCase() !== 'info@sperinservices.co.uk') return { status: 'failed', error: 'Gmail must be connected as info@sperinservices.co.uk; no email was sent.' };
  } catch { return { status: 'failed', error: 'Unable to verify the Gmail account; no email was sent.' }; }
  try {
    const response = await fetcher(`${BASE}/google_mail/gmail/v1/users/me/messages/send`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawGmail(input.to, input.subject, input.body, input.key) }), signal: AbortSignal.timeout(20000),
    });
    const parsed = await providerResponse(response);
    if (parsed.result) return parsed.result;
    return typeof parsed.data?.['id'] === 'string' ? { status: 'sent', providerId: parsed.data['id'] } : { status: 'unknown', error: 'Gmail accepted the request but did not return a message ID. Check Gmail Sent before taking further action.' };
  } catch { return { status: 'unknown', error: 'Gmail outcome is unknown. Check Gmail Sent; retry is blocked to avoid duplicates.' }; }
}

export async function sendSms(input: { to: string; body: string; channelId: string; attempt: string }, c: Config, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const missing = missingConfig('sms', c);
  if (missing) return { status: 'failed', error: missing };
  const callback = `${c.callbackUrl}?channel=${encodeURIComponent(input.channelId)}&attempt=${encodeURIComponent(input.attempt)}`;
  try {
    const response = await fetcher(`${BASE}/twilio/Messages.json`, {
      method: 'POST', headers: { Authorization: `Bearer ${c.gatewayKey}`, 'X-Connection-Api-Key': String(c.twilioKey), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: input.to, From: String(c.smsFrom), Body: input.body, StatusCallback: callback }), signal: AbortSignal.timeout(20000),
    });
    const parsed = await providerResponse(response);
    if (parsed.result) return parsed.result;
    const sid = parsed.data?.['sid'];
    if (typeof sid !== 'string') return { status: 'unknown', error: 'Twilio returned no message ID; retry blocked to avoid duplicates.' };
    const state = parsed.data?.['status'];
    return { status: state === 'delivered' ? 'delivered' : ['failed','undelivered','canceled'].includes(String(state)) ? 'failed' : state === 'sent' ? 'sent' : 'sending', providerId: sid };
  } catch { return { status: 'unknown', error: 'SMS outcome is unknown. Check Twilio message logs; retry is blocked to avoid duplicates.' }; }
}