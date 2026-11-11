import type { Estimate } from "./estimator";
import type { RateCard } from "./rates";

export function draftReply(
  lead: { customerName: string | null; jobTitle: string },
  est: Estimate,
  r: RateCard,
): { subject: string; body: string } {
  const first = lead.customerName?.split(/\s+/)[0];
  const greet = first ? `Hi ${first},` : "Hi,";
  const job = lead.jobTitle || "your electrical job";
  const parts: string[] = [greet, "", `Thanks for your enquiry on HaMuch about ${job.toLowerCase()}.`];

  if (est.kind === "fixed") {
    parts.push("", `I can do this for ${est.summary.replace(" fixed price", "")} (fixed price, ${r.vatRegistered ? "plus VAT" : "no VAT"}).`);
  } else if (est.kind === "range" && est.high > 0) {
    parts.push("", `From what you've described, I'd expect this to be around ${est.summary.replace(" (provisional)", "")}. I'll confirm a fixed price once I've seen a couple of photos.`);
  } else {
    parts.push("", "To give you an accurate price rather than a guess, I'd need a little more information first.");
  }

  if (est.notes.length) parts.push("", ...est.notes.slice(0, 2));
  if (est.exclusions.length) parts.push("", "Not included: " + est.exclusions.join(" "));
  if (est.questions.length) parts.push("", ...est.questions.map((q) => `• ${q}`));
  if (est.flags.some((f) => /evening|weekend/i.test(f))) parts.push("", "Evening and weekend work is possible at a different rate, which I'll confirm with you.");
  parts.push("", "I'm fully qualified and all work is tested and certified. Happy to answer any questions.", "", "Kind regards,", r.ownerSignature);

  return { subject: `Re: ${job} – quote from Sperin Services`, body: parts.join("\n") };
}