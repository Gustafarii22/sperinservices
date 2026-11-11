import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
export function ukMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^0044/, '+44').replace(/\+44\s*\(0\)/, '+44');
  const phone = parsePhoneNumberFromString(cleaned, 'GB');
  return phone?.country === 'GB' && phone.isValid() && phone.getType() === 'MOBILE' ? phone.number : null;
}
