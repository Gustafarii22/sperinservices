/** Validate the structure of ordinary UK 07 mobile numbers for customer SMS.
 * Excludes 070 personal numbering and 076 paging numbers, not a carrier lookup.
 * The SMS gateway returns a separate final carrier delivery outcome.
 */
export function ukMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits=raw.trim().replace(/[\s().-]/g,'').replace(/^0044/,'+44').replace(/^\+440/,'+44');
  const e164=digits.startsWith('07')?'+44'+digits.slice(1):digits;
  return /^\+447[1-57-9]\d{8}$/.test(e164)?e164:null;
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
