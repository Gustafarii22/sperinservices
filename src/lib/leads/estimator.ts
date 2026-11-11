import type { RateCard } from "./rates";

export type Category =
  | "eicr"
  | "consumer_unit"
  | "ev_socket"
  | "sockets"
  | "doorbell"
  | "lighting"
  | "general";

export type Estimate = {
  category: Category;
  kind: "fixed" | "range" | "assessment";
  low: number;
  high: number;
  lines: { label: string; amount: string }[];
  notes: string[];
  exclusions: string[];
  flags: string[];
  questions: string[];
  materials: "included" | "tbc";
  summary: string;
};

export function classify(text: string): Category {
  const t = text.toLowerCase();
  if (/\beicr\b|condition report|periodic inspection|landlord (electrical )?certificate|electrical safety certificate/.test(t)) return "eicr";
  if (/\bev\b|electric (car|vehicle)|car charg|charging (my|the|a)? ?car|ev charg/.test(t)) return "ev_socket";
  if (/consumer unit|fuse ?box|fuseboard|rcbo|distribution board/.test(t)) return "consumer_unit";
  if (/doorbell|door bell|chime|ring (video|bell)/.test(t)) return "doorbell";
  if (/socket|plug point|power point|double socket/.test(t)) return "sockets";
  if (/light|downlight|spotlight|pendant|fitting/.test(t)) return "lighting";
  return "general";
}

/** Labour charge for N hours: £first hour, then £/hour (£ per half hour), 8h = day rate. */
export function labour(hours: number, r: RateCard): number {
  if (hours <= 0) return 0;
  const days = Math.floor(hours / 8);
  let rem = Math.round((hours - days * 8) * 2) / 2;
  let total = days * r.dayRate;
  if (rem > 0) {
    let part: number;
    if (days === 0) {
      part = r.firstHour;
      rem = Math.max(0, rem - 1);
    } else part = 0;
    const whole = Math.floor(rem);
    part += whole * r.furtherHour + (rem - whole > 0 ? r.furtherHalfHour : 0);
    total += Math.min(part, r.dayRate);
  }
  return total;
}

export function circuitCount(text: string): number | null {
  const m = text.toLowerCase().match(/(\d{1,2})\s*(?:-|to)?\s*(?:\d{1,2}\s*)?(?:circuits?|ways?|way board)/);
  return m?.[1] ? parseInt(m[1], 10) : null;
}

export function outOfHours(text: string) {
  return /evening|after (6|7|8)\s?pm|weekend|saturday|sunday|bank holiday|out of hours/i.test(text);
}

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;

export function estimate(input: { scope: string; jobTitle: string }, r: RateCard, travelFlag?: string | null): Estimate {
  const text = `${input.jobTitle}\n${input.scope}`;
  const category = classify(text);
  const notes: string[] = [];
  const exclusions: string[] = [];
  const flags: string[] = [];
  const questions: string[] = [];
  const lines: Estimate["lines"] = [];
  let kind: Estimate["kind"] = "range";
  let low = 0;
  let high = 0;
  let materials: Estimate["materials"] = "tbc";
  const vat = r.vatRegistered ? "plus VAT" : "no VAT added";

  switch (category) {
    case "eicr": {
      const c = circuitCount(text);
      materials = "included";
      if (c !== null && c <= 6) {
        kind = "fixed"; low = high = r.eicrUpTo6;
        lines.push({ label: "EICR up to 6 circuits", amount: gbp(r.eicrUpTo6) });
      } else if (c !== null && c <= 10) {
        kind = "fixed"; low = high = r.eicr7to10;
        lines.push({ label: "EICR 7–10 circuits", amount: gbp(r.eicr7to10) });
      } else {
        low = r.eicrUpTo6; high = r.eicr7to10;
        lines.push({ label: "EICR up to 6 circuits", amount: gbp(r.eicrUpTo6) });
        lines.push({ label: "EICR 7–10 circuits", amount: gbp(r.eicr7to10) });
        if (c !== null && c > 10) flags.push("More than 10 circuits – price to confirm");
        else questions.push("Roughly how many circuits / ways are on the consumer unit? A photo of the board is ideal.");
      }
      notes.push("Includes testing and the written report.");
      exclusions.push("Remedial work found during testing is quoted separately.");
      break;
    }
    case "consumer_unit": {
      const c = circuitCount(text);
      materials = "included";
      if (c !== null && c <= 6) { kind = "fixed"; low = high = r.cuUpTo6; }
      else if (c !== null && c <= 10) { kind = "fixed"; low = high = r.cu7to10; }
      else { low = r.cuUpTo6; high = r.cu7to10; questions.push("How many circuits are on the existing board? Please send a photo of the fuse box with the cover on and the meter/supply area."); }
      lines.push({ label: "RCBO + SPD consumer unit, up to 6 circuits", amount: gbp(r.cuUpTo6) });
      lines.push({ label: "RCBO + SPD consumer unit, 7–10 circuits", amount: gbp(r.cu7to10) });
      kind = kind === "fixed" ? "fixed" : "range";
      notes.push("Includes the unit, RCBOs, surge protection, installation, testing and certification.");
      exclusions.push("Faults found on existing circuits during testing (quoted before any extra work).");
      exclusions.push("Earthing / main bonding upgrades if required.");
      exclusions.push("Building Control notification fee, if applicable, confirmed at survey.");
      break;
    }
    case "ev_socket": {
      kind = "assessment";
      low = labour(4, r); high = r.dayRate;
      lines.push({ label: "Labour (approx. 4 hours – 1 day)", amount: `${gbp(low)}–${gbp(high)}` });
      lines.push({ label: "Materials (cable, outdoor socket, RCBO, fixings)", amount: "To confirm after photos" });
      notes.push("Provisional range only – a dedicated outdoor circuit is usually needed for car charging.");
      notes.push("A purpose-made EV charger is recommended for regular charging; a standard outdoor socket is only suitable for occasional slow charging.");
      questions.push("Please send photos of the fuse box, the meter, and where you'd like the socket outside.");
      questions.push("Roughly how far is the socket position from the fuse box?");
      exclusions.push("Consumer unit upgrade if the existing board has no spare way or RCD protection.");
      exclusions.push("Groundworks / trenching.");
      flags.push("Assessment needed before a firm price");
      break;
    }
    case "sockets": {
      low = labour(2, r); high = labour(5, r);
      const n = text.match(/(\d+)\s*(?:x\s*)?(?:new\s*)?(?:double\s*)?sockets?/i)?.[1];
      lines.push({ label: `Labour${n ? ` for ${n} socket(s)` : ""} (approx. 2–5 hours)`, amount: `${gbp(low)}–${gbp(high)}` });
      lines.push({ label: "Materials (sockets, cable, back boxes)", amount: "To confirm" });
      notes.push("Range depends on whether sockets can be spurred from an existing circuit or need a new circuit.");
      questions.push("Are the walls solid brick or plasterboard, and is there an existing socket nearby?");
      questions.push("Will any appliances (washer, dryer, freezer) be on these sockets?");
      exclusions.push("Making good / decorating after chasing walls.");
      break;
    }
    case "doorbell": {
      low = labour(1, r); high = labour(2, r);
      lines.push({ label: "Labour (approx. 1–2 hours)", amount: `${gbp(low)}–${gbp(high)}` });
      lines.push({ label: "Doorbell / chime / transformer", amount: "Customer supplied, or confirmed before purchase" });
      notes.push("Includes fitting the doorbell, chime and a suitable power supply, and testing.");
      questions.push("Which doorbell model do you have (or would like)? Is there an existing wired bell?");
      exclusions.push("App / Wi-Fi setup issues beyond the doorbell itself.");
      break;
    }
    case "lighting": {
      low = labour(1, r); high = labour(4, r);
      lines.push({ label: "Labour (approx. 1–4 hours)", amount: `${gbp(low)}–${gbp(high)}` });
      lines.push({ label: "Fittings and materials", amount: "To confirm" });
      questions.push("How many lights, and is there loft access above?");
      break;
    }
    default: {
      kind = "assessment";
      low = r.firstHour; high = 0;
      lines.push({ label: "First hour", amount: gbp(r.firstHour) });
      lines.push({ label: "Each further hour", amount: `${gbp(r.furtherHour)} (${gbp(r.furtherHalfHour)} per half hour)` });
      lines.push({ label: "Full 8-hour day", amount: gbp(r.dayRate) });
      questions.push("Could you send a few photos and a little more detail so I can give an accurate price?");
      flags.push("Not enough detail to estimate");
    }
  }

  if (outOfHours(text)) flags.push("Evening/weekend requested – surcharge to confirm, not included");
  if (travelFlag) flags.push(travelFlag);
  notes.push(`Prices are ${vat}. Travel within ~${r.travelIncludedMinutes} minutes of ${r.baseOutward.split(" ")[0]} is included.`);

  const summary =
    kind === "fixed" ? `${gbp(low)} fixed price`
    : high > 0 ? `${gbp(low)}–${gbp(high)}${materials === "tbc" ? " + materials" : ""} (provisional)`
    : "Hourly rates – price after photos/assessment";

  return { category, kind, low, high, lines, notes, exclusions, flags, questions, materials, summary };
}