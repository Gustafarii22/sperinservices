export type Job = {
  id: string;
  name: string;
  price: number;
  additional?: number;
  detail: string;
  group?: "eicr" | "board";
  quoteOnly?: boolean;
};
export const JOBS: Job[] = [
  {
    id: "switch",
    name: "Light switch",
    price: 80,
    additional: 15,
    detail: "Standard white switch supplied. Same position and suitable existing wiring.",
  },
  {
    id: "socket",
    name: "Double socket",
    price: 85,
    additional: 20,
    detail: "Standard white socket supplied. Decorative, USB and smart accessories extra.",
  },
  {
    id: "fcu",
    name: "Fused spur / FCU",
    price: 85,
    additional: 20,
    detail: "Standard white fused connection unit supplied.",
  },
  {
    id: "pendant",
    name: "Pendant & rose",
    price: 85,
    additional: 25,
    detail: "Standard pendant and ceiling rose supplied.",
  },
  {
    id: "light",
    name: "Light fitting",
    price: 75,
    additional: 25,
    detail:
      "Customer supplies light. Straightforward fitting; chandeliers, assembly and heavy fittings assessed separately.",
  },
  {
    id: "external",
    name: "External light",
    price: 90,
    additional: 35,
    detail: "Customer supplies light. Existing position, suitable wiring and normal safe access.",
  },
  {
    id: "oven",
    name: "Oven connection",
    price: 90,
    detail:
      "Customer supplies oven. Suitable existing connection; additional ovens assessed separately.",
  },
  {
    id: "fan",
    name: "Extractor fan",
    price: 100,
    detail:
      "Customer supplies fan. Existing opening and suitable wiring; additional fans assessed separately.",
  },
  {
    id: "alarm",
    name: "Smoke / heat alarm",
    price: 75,
    additional: 20,
    detail:
      "Customer supplies a compatible alarm. Existing position and suitable circuit/interconnection.",
  },
  {
    id: "doorbell",
    name: "Wired doorbell",
    price: 90,
    detail:
      "Customer supplies doorbell. Suitable existing wiring and transformer required; additional units assessed separately.",
  },
  {
    id: "usb-socket",
    name: "USB double socket",
    price: 100,
    additional: 35,
    detail: "Standard USB double socket supplied. Same position and suitable existing wiring.",
  },
  {
    id: "dimmer",
    name: "LED dimmer",
    price: 95,
    additional: 30,
    detail: "Standard compatible LED dimmer supplied. Existing lamps and wiring must be suitable.",
  },
  {
    id: "outside-socket",
    name: "Outdoor socket",
    price: 0,
    detail:
      "New external socket installation. Route, circuit protection and cable length assessed before a fixed quotation.",
    quoteOnly: true,
  },
  {
    id: "new-point",
    name: "New socket / light point",
    price: 0,
    detail:
      "New point from existing or new circuit. Cable route, wall construction and circuit capacity assessed first.",
    quoteOnly: true,
  },
  {
    id: "rewire",
    name: "Full / part rewire",
    price: 0,
    detail: "Survey required. Add this to your request and upload photos or plans where available.",
    quoteOnly: true,
  },
  {
    id: "ev-charger",
    name: "EV charger",
    price: 0,
    detail:
      "Survey required for supply, earthing, cable route, load assessment, DNO requirements and charger model.",
    quoteOnly: true,
  },
  {
    id: "commercial-work",
    name: "Commercial work",
    price: 0,
    detail: "For schools, offices, shops and other premises. Scope is assessed before quotation.",
    quoteOnly: true,
  },
  {
    id: "eicr6",
    name: "EICR — up to 6 circuits",
    price: 130,
    group: "eicr",
    detail:
      "One consumer unit. Inspection, testing and report included. Remedial work quoted separately.",
  },
  {
    id: "eicr10",
    name: "EICR — 7–10 circuits",
    price: 180,
    group: "eicr",
    detail:
      "One consumer unit. Inspection, testing and report included. Larger installations quoted individually.",
  },
  {
    id: "board6",
    name: "Consumer unit — up to 6 circuits",
    price: 650,
    group: "board",
    detail:
      "FuseBox unit, RCBOs, surge protection, installation, testing, certification and applicable notification included.",
  },
  {
    id: "board10",
    name: "Consumer unit — 7–10 circuits",
    price: 800,
    group: "board",
    detail:
      "FuseBox unit, RCBOs, surge protection, installation, testing, certification and applicable notification included.",
  },
];
export type Selection = Record<string, number>;
export type Travel = {
  postcode: string;
  minutes?: number;
  charge: number | null;
  message: string;
  source?: "openrouteservice" | "osrm" | "fallback";
};
export const money = (value: number) => `£${value.toFixed(value % 1 ? 2 : 0)}`;
export function travelCharge(minutes: number): number | null {
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return minutes <= 35 ? 0 : minutes <= 50 ? 15 : minutes <= 65 ? 25 : null;
}
export function estimate(selection: Selection) {
  const chosen = JOBS.filter((j) => selection[j.id] > 0);
  const packages = chosen.filter((j) => j.group);
  const small = chosen.filter((j) => !j.group);
  // One visit allowance: select the largest standalone-minus-additional allowance.
  // A package already includes attendance. Never add another attendance fee.
  const rows = chosen.map((j) => ({
    ...j,
    quantity: selection[j.id],
    amount: j.group
      ? j.price
      : j.additional === undefined
        ? packages.length || small.length > 1 || selection[j.id] > 1
          ? 0
          : j.price
        : j.additional * selection[j.id],
  }));
  const unknown = small
    .filter(
      (j) =>
        j.quoteOnly ||
        (j.additional === undefined &&
          (packages.length || small.length > 1 || selection[j.id] > 1)),
    )
    .map((j) => j.id);
  // Individually priced items do not establish an attendance allowance when mixed.
  const actualAllowance = packages.length
    ? 0
    : Math.max(
        0,
        ...small
          .filter((j) => j.additional !== undefined && !j.quoteOnly)
          .map((j) => j.price - j.additional!),
      );
  const visit = small.some((j) => j.additional !== undefined && !j.quoteOnly) ? actualAllowance : 0;
  const subtotal = rows.reduce((sum, j) => sum + j.amount, 0) + visit;
  return {
    rows,
    subtotal,
    visit,
    unknown,
    overlap: packages.some((j) => j.group === "board") && packages.some((j) => j.group === "eicr"),
    count: chosen.reduce((n, j) => n + selection[j.id], 0),
  };
}
export const CONDITIONS = [
  "Estimate only: fixed quotation after assessment, before work starts. Booking subject to availability.",
  "Daytime weekday prices, suitable existing wiring, same-position replacements and normal safe access.",
  "No VAT added — Sperin Services is not VAT registered.",
  "Consumer-unit faults, bonding upgrades, relocation and EICR remedial work are not included.",
  "Customer-supplied items and any work marked for assessment are excluded from the priced subtotal.",
  "Travel is estimated each way from our Smethwick base; any supplement is agreed before booking.",
];
export function estimateLines(selection: Selection, travel?: Travel, reference = "DRAFT") {
  const e = estimate(selection);
  return [
    "SPERIN SERVICES",
    "Electrical work / estimate",
    `Reference: ${reference}`,
    `Prepared: ${new Date().toLocaleDateString("en-GB")}`,
    "",
    ...e.rows.flatMap((j) => [
      `${j.quantity} x ${j.name}: ${e.unknown.includes(j.id) ? "to be confirmed" : money(j.amount)}`,
      j.detail,
    ]),
    ...(e.visit ? [`Single visit allowance: ${money(e.visit)}`] : []),
    `Priced work subtotal: ${money(e.subtotal)}`,
    `Travel: ${travel?.message || "Enter postcode; supplement to be confirmed"}`,
    `Estimated ${e.unknown.length || travel?.charge == null ? "priced subtotal" : "total"}: ${money(e.subtotal + (travel?.charge || 0))}`,
    ...(e.unknown.length
      ? ["Additional selected work requires assessment and is NOT included in this subtotal."]
      : []),
    ...(e.overlap
      ? [
          "EICR and consumer unit selected: confirm whether a separate whole-property EICR is required.",
        ]
      : []),
    "",
    ...CONDITIONS,
    "",
    "info@sperinservices.co.uk | 07817 360156",
    "https://sperinservices.co.uk/pricing",
  ];
}
