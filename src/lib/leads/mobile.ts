import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
export function ukMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^0044/, '+44').replace(/\+44\s*\(0\)/, '+44');
  const phone = parsePhoneNumberFromString(cleaned, 'GB');
  return phone?.country === 'GB' && phone.isValid() && phone.getType() === 'MOBILE' ? phone.number : null;
}

/** Opens the phone's own SMS composer; neither sends nor incurs a provider fee. */
export function smsComposeLink(raw: string | null | undefined, body: string): string | null {
  const to=ukMobile(raw);
  if (!to || !body.trim()) return null;
  return `sms:${to}?body=${encodeURIComponent(body)}`;
}

export function gmailComposeLink(to: string, subject: string, body: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error('Invalid email');
  const params=new URLSearchParams({view:'cm',fs:'1',to,su:subject,body});
  return 'https://mail.google.com/mail/?'+params.toString();
}
