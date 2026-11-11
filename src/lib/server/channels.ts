import { parsePhoneNumberFromString, findPhoneNumbersInText } from 'libphonenumber-js/max';

export type ChannelStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'unknown' | 'skipped';
export type ProviderResult = { status: ChannelStatus; providerId?: string; error?: string };

export function ukMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^0044/, '+44').replace(/\+44\s*\(0\)/, '+44');
  const phone = parsePhoneNumberFromString(cleaned, 'GB');
  return phone?.country === 'GB' && phone.isValid() && phone.getType() === 'MOBILE' ? phone.number : null;
}

export function extractUkPhone(text: string): string | null {
  const numbers = findPhoneNumbersInText(text.replace(/0044/g, '+44'), 'GB');
  return numbers.find(n => ukMobile(n.number.number))?.number.number ?? numbers[0]?.number.number ?? null;
}

export function smsDraft(name: string | null, job: string): string {
  const first = name?.split(/\s+/)[0];
  return `Hi${first ? ` ${first}` : ''}, Augustine at Sperin Services here regarding your HaMuch enquiry: ${job.slice(0, 110)}. Please reply or email info@sperinservices.co.uk to discuss your quote. Thank you.`;
}

export function canClaim(status: string, retry: boolean) {
  return retry ? status === 'failed' : status === 'pending';
}

export function summaryStatus(statuses: string[]): 'sending' | 'sent' | 'failed' {
  if (statuses.some(s => ['pending', 'sending', 'unknown'].includes(s))) return 'sending';
  return statuses.some(s => s === 'failed') ? 'failed' : 'sent';
}

function base64(value: string) {
  return btoa(Array.from(new TextEncoder().encode(value), b => String.fromCharCode(b)).join(''));
}
export function rawGmail(to: string, subject: string, body: string, messageKey: string) {
  if (/[\r\n]/.test(to + subject + messageKey)) throw new Error('Invalid email headers');
  const encodedSubject = /^[\x00-\x7F]*$/.test(subject) ? subject : `=?UTF-8?B?${base64(subject)}?=`;
  // Encode the body so long lines and Unicode remain valid MIME.
  const email = [
    'From: Sperin Services <info@sperinservices.co.uk>', `To: ${to}`, `Subject: ${encodedSubject}`,
    'Reply-To: info@sperinservices.co.uk', `Message-ID: <${messageKey}@sperinservices.co.uk>`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    base64(body).match(/.{1,76}/g)?.join('\r\n') ?? '',
  ].join('\r\n');
  return base64(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function twilioSignature(token: string, url: string, params: Record<string, string>) {
  const value = url + Object.keys(params).sort().map(k => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(Array.from(new Uint8Array(signature), b => String.fromCharCode(b)).join(''));
}
export async function verifyTwilio(token: string, url: string, params: Record<string, string>, signature: string | null) {
  if (!signature) return false;
  const expected = await twilioSignature(token, url, params);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}