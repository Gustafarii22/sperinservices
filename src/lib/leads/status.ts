export const STATUSES = [
  { id: "received", label: "Received" },
  { id: "needs_info", label: "Needs Info" },
  { id: "ready_for_review", label: "Ready for Review" },
  { id: "approved_sent", label: "Approved / Sent" },
  { id: "customer_replied", label: "Customer Replied" },
  { id: "won", label: "Won" },
  { id: "declined", label: "Declined" },
  { id: "archived", label: "Archive" },
] as const;

export type LeadStatus = (typeof STATUSES)[number]["id"];

export function statusLabel(id: string) {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

export const OWNER_EMAIL = "info@sperinservices.co.uk";

/** Mirrors the database is_owner() rule: exact owner email AND confirmed address. */
export function isOwnerIdentity(email: string | null | undefined, emailConfirmed: boolean) {
  return !!email && email.trim().toLowerCase() === OWNER_EMAIL && emailConfirmed;
}