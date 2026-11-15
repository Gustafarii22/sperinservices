import { rawGmail, type ProviderResult } from './channels';

type Config = { gmailClientId?: string; gmailClientSecret?: string; gmailRefreshToken?: string; twilioAccountSid?: string; twilioAuthToken?: string; smsFrom?: string; callbackUrl?: string; smsGateUser?: string; smsGatePassword?: string };
export function messagingConfig(): Config {
  return {
    gmailClientId: process.env['GMAIL_CLIENT_ID'],
    gmailClientSecret: process.env['GMAIL_CLIENT_SECRET'],
    gmailRefreshToken: process.env['GMAIL_REFRESH_TOKEN'],
    twilioAccountSid: process.env['TWILIO_ACCOUNT_SID'],
    twilioAuthToken: process.env['TWILIO_AUTH_TOKEN'],
    smsFrom: process.env['TWILIO_FROM_NUMBER'],
    callbackUrl: process.env['TWILIO_STATUS_CALLBACK_URL'],
    smsGateUser: process.env['SMSGATE_USERNAME'],
    smsGatePassword: process.env['SMSGATE_PASSWORD'],
  };
}
export function missingConfig(channel: string, c: Config): string | null {
  if (channel === 'gmail') return c.gmailClientId && c.gmailClientSecret && c.gmailRefreshToken ? null : 'Gmail OAuth credentials are not configured (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).';
  if (!c.smsGateUser || !c.smsGatePassword) return 'Install SMSGate Cloud on your Samsung, then securely set SMSGATE_USERNAME and SMSGATE_PASSWORD in Vercel. SMS composer remains available without them.';
  return null;
  /* Legacy Twilio configuration is intentionally disabled for new sends.
  if (!c.twilioAccountSid || !/^AC[0-9a-f]{32}$/i.test(c.twilioAccountSid)) return 'Set TWILIO_ACCOUNT_SID.';
  if (!c.twilioAuthToken) return 'Set TWILIO_AUTH_TOKEN.';
  if (!c.smsFrom || !/^\+[1-9]\d{7,14}$/.test(c.smsFrom)) return 'Set a valid TWILIO_FROM_NUMBER.';
  try {
    const url = new URL(c.callbackUrl || '');
    if (url.protocol !== 'https:' || url.pathname !== '/api/public/twilio-status' || url.search) return 'Set TWILIO_STATUS_CALLBACK_URL to the deployed HTTPS callback.';
  } catch { return 'Set a valid TWILIO_STATUS_CALLBACK_URL.'; }
  return null;
  */
}
async function parseResponse(response: Response) {
  let data: Record<string, unknown> = {};
  try { data = await response.json() as Record<string, unknown>; } catch { /* outcome may be uncertain */ }
  return data;
}
async function gmailAccessToken(c: Config, fetcher: typeof fetch) {
  const response = await fetcher('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: c.gmailClientId!, client_secret: c.gmailClientSecret!, refresh_token: c.gmailRefreshToken!, grant_type: 'refresh_token' }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await parseResponse(response);
  if (!response.ok || typeof data['access_token'] !== 'string') throw new Error('Gmail OAuth token refresh failed');
  return data['access_token'];
}
export async function sendGmail(input: { to: string; subject: string; body: string; key: string }, c: Config, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const missing = missingConfig('gmail', c);
  if (missing) return { status: 'failed', error: missing };
  let token: string;
  try { token = await gmailAccessToken(c, fetcher); } catch { return { status: 'failed', error: 'Unable to authenticate Gmail; no message sent.' }; }
  try {
    const profile = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    const data = await parseResponse(profile);
    if (!profile.ok || !['sperinservices@gmail.com', 'info@sperinservices.co.uk'].includes(String(data['emailAddress']).toLowerCase())) return { status: 'failed', error: 'Wrong Gmail account; no message sent.' };
    // Gmail's send endpoint must also accept info@sperinservices.co.uk as a verified Send mail as alias.
  } catch { return { status: 'failed', error: 'Unable to verify Gmail sender; no message sent.' }; }
  try {
    const response = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawGmail(input.to, input.subject, input.body, input.key) }), signal: AbortSignal.timeout(20000),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { status: response.status >= 500 || response.status === 408 ? 'unknown' : 'failed', error: `Gmail HTTP ${response.status}` };
    return typeof data['id'] === 'string' ? { status: 'sent', providerId: data['id'] } : { status: 'unknown', error: 'Gmail response had no message ID; check Sent before retrying.' };
  } catch { return { status: 'unknown', error: 'Gmail send outcome uncertain; check Sent before retrying.' }; }
}
export async function sendSms(input: { to: string; body: string; channelId: string; attempt: string }, c: Config, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const missing = missingConfig('sms', c);
  if (missing) return { status: 'failed', error: missing };
  const callback = `${c.callbackUrl}?channel=${encodeURIComponent(input.channelId)}&attempt=${encodeURIComponent(input.attempt)}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${c.twilioAccountSid}/Messages.json`;
  try {
    const response = await fetcher(url, {
      method: 'POST', headers: {
        Authorization: `Basic ${btoa(`${c.twilioAccountSid}:${c.twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: input.to, From: c.smsFrom!, Body: input.body, StatusCallback: callback }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { status: response.status >= 500 || response.status === 408 ? 'unknown' : 'failed', error: `Twilio HTTP ${response.status}` };
    if (typeof data['sid'] !== 'string') return { status: 'unknown', error: 'Twilio returned no message SID; check message logs.' };
    const status = String(data['status'] ?? '');
    return { status: status === 'delivered' ? 'delivered' : ['failed','undelivered','canceled'].includes(status) ? 'failed' : status === 'sent' ? 'sent' : 'sending', providerId: data['sid'] };
  } catch { return { status: 'unknown', error: 'SMS outcome uncertain; check Twilio logs before retrying.' }; }
}

/** Free SMSGate cloud relay: phone and SMS allowance belong to the owner.
 * Credentials never appear in browser bundles or GitHub. The remote gateway
 * queues to the authorised Android app; accepted != carrier delivered.
 * Keep the client-provided id stable to avoid accidental duplicate retries.
 */
export async function sendPhoneSms(input:{to:string;body:string;channelId:string}, c:Config, fetcher:typeof fetch=fetch):Promise<ProviderResult> {
 const issue=missingConfig('sms',c);
 if(issue)return {status:'failed',error:issue};
 if(!/^\+447\d{9}$/.test(input.to)||!input.body.trim()||input.body.length>480) return {status:'failed',error:'Invalid UK mobile SMS'};
 try {
   const response=await fetcher('https://api.sms-gate.app/3rdparty/v1/messages',{
     method:'POST',
     headers:{
       Authorization:'Basic '+btoa(c.smsGateUser+':'+c.smsGatePassword),
       'Content-Type':'application/json'
     },
     body:JSON.stringify({id:input.channelId,phoneNumbers:[input.to],textMessage:{text:input.body},ttl:3600,withDeliveryReport:true}),
     signal:AbortSignal.timeout(18000)
   });
   const result=await parseResponse(response);
   if(!response.ok) return {status:[408,429,500,502,503,504].includes(response.status)?'unknown':'failed',error:'Phone gateway HTTP '+response.status};
   if(typeof result['id']!=='string')return {status:'unknown',error:'Gateway accepted request without message ID; inspect gateway before retrying'};
   const state=String(result['state']||'Pending').toLowerCase();
   return {status:state==='delivered'?'delivered':state==='sent'?'sent':state==='failed'?'failed':'sending',providerId:result['id']};
 } catch {return {status:'unknown',error:'Phone gateway outcome uncertain; do not resend until checking message history'};}
}

export async function phoneSmsStatus(messageId:string,c:Config,fetcher:typeof fetch=fetch):Promise<ProviderResult> {
 if(missingConfig('sms',c))return {status:'unknown',error:'Phone gateway disconnected'};
 if(!/^[a-zA-Z0-9_-]{10,100}$/.test(messageId))return {status:'unknown',error:'Invalid gateway message ID'};
 try{
  const response=await fetcher('https://api.sms-gate.app/3rdparty/v1/messages/'+encodeURIComponent(messageId),{
    headers:{Authorization:'Basic '+btoa(c.smsGateUser+':'+c.smsGatePassword)},signal:AbortSignal.timeout(8500)
  });
  if(!response.ok)return {status:'unknown',error:'Unable to read phone SMS state'};
  const info=await parseResponse(response),state=String(info['state']||'').toLowerCase();
  return {status:state==='delivered'?'delivered':state==='sent'?'sent':state==='failed'||state==='cancelled'?'failed':'sending',providerId:messageId};
 }catch{return {status:'unknown',error:'Gateway status temporarily unavailable'};}
}
