/** Tab-scoped drafts; no contact details or photos are sent to analytics. */
export const ESTIMATE_DRAFT = "sperin-estimate-v1";
export const CONTACT_DRAFT = "sperin-contact-v1";
export function readDraft<T>(key: string): T | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (!saved || Date.now() - saved.at > 24 * 60 * 60 * 1000) return null;
    return saved.value as T;
  } catch {
    return null;
  }
}
export function saveDraft(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* Storage can be disabled. Forms still work. */
  }
}
export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* optional storage */
  }
}
