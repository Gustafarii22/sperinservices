// Rough drive-time bands from B66 (Smethwick). Deliberately conservative: anything
// outside the "near" list is flagged for the owner to confirm, never auto-priced.
const NEAR_AREAS = ["B", "WS", "DY", "WV"];
const FRINGE_DISTRICTS = /^(B(4[6-9]|5\d|6[0-1]|7[5-9]|8\d|9\d)|WS(1[0-5])|DY(1[0-4])|WV(1[0-6]))$/;
const EDGE_AREAS = ["CV", "WR", "ST", "TF", "LE"];

export type TravelBand = "included" | "check" | "supplement";

export function travelBand(postcode: string | null): { band: TravelBand; note: string } {
  if (!postcode) return { band: "check", note: "No postcode – confirm location" };
  const outward = postcode.toUpperCase().split(" ")[0] ?? '';
  const area = outward.match(/^[A-Z]+/)?.[0] ?? "";
  if (NEAR_AREAS.includes(area)) {
    if (FRINGE_DISTRICTS.test(outward)) return { band: "check", note: `${outward} may be near the 35-min limit – check route` };
    return { band: "included", note: `${outward}: travel included` };
  }
  if (EDGE_AREAS.includes(area)) return { band: "supplement", note: `${outward}: likely beyond 35 min – small travel supplement to confirm` };
  return { band: "supplement", note: `${outward}: outside usual area – consider declining or confirm supplement` };
}