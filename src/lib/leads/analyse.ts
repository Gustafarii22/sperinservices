import { parseLeadEmail, type ParsedLead } from "./parser";
import { estimate, type Estimate } from "./estimator";
import { travelBand } from "./travel";
import { draftReply } from "./reply";
import type { RateCard } from "./rates";
import type { LeadStatus } from "./status";

export type Analysis = {
  parsed: ParsedLead;
  estimate: Estimate;
  suitability: "suitable" | "review" | "outside_area" | "not_electrical";
  travelNote: string;
  status: LeadStatus;
  reply: { subject: string; body: string };
};

export function analyse(parsed: ParsedLead, r: RateCard): Analysis {
  const travel = travelBand(parsed.postcode);
  const est = estimate(parsed, r, travel.band === "included" ? null : travel.note);
  const notElectrical = /\b(plumb|boiler|gas|roof|plaster(ing)? only|tiling)\b/i.test(parsed.scope) && est.category === "general";
  const suitability: Analysis["suitability"] = notElectrical
    ? "not_electrical"
    : travel.band === "supplement" ? "outside_area"
    : est.kind === "assessment" || travel.band === "check" ? "review" : "suitable";
  const missing = !parsed.postcode || parsed.scope.trim().length < 15 || !parsed.customerEmail;
  return {
    parsed,
    estimate: est,
    suitability,
    travelNote: travel.note,
    status: missing ? "needs_info" : "ready_for_review",
    reply: draftReply(parsed, est, r),
  };
}

export function analyseText(subject: string, text: string, r: RateCard) {
  return analyse(parseLeadEmail({ subject, text }), r);
}