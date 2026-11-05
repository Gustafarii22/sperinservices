import { JOBS } from "./pricing";

export type HamuchLead = {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  description: string;
};
export type HamuchRecommendation = {
  category: string;
  price: string;
  rationale: string;
  guidance: string;
  needsAssessment: boolean;
};
const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const postcodePattern = /\b(?:GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?)\s?\d[A-Z]{2})\b/i;
const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
const pounds = (n: number) => "£" + n.toFixed(0);

export function parseHamuchLead(raw: string): HamuchLead {
  const input = raw.slice(0, 16000).replace(/\r/g, "");
  const postcode = input.match(postcodePattern)?.[0]?.toUpperCase() || "";
  const jobLine = input.match(/New job:\s*([^\n]+)/i)?.[1] || "";
  const jobName = jobLine.split(",")[0]?.trim() || "";
  const name = /^[\p{L}.' -]{2,80}$/u.test(jobName) ? jobName : "";
  const allEmails = Array.from(input.matchAll(emailPattern)).map((m) => m[0]);
  const email =
    allEmails.find((e) => !/hamuch\.com$/i.test(e) && !/sperinservices\.co\.uk$/i.test(e)) || "";
  const normalizedPhone = (input.match(/(?:\+44\s?7|07)[\d\s-]{9,15}/)?.[0] || "").replace(
    /[^\d+]/g,
    "",
  );
  const phone = /^\+44/.test(normalizedPhone)
    ? "0" + normalizedPhone.slice(3)
    : normalizedPhone.slice(0, 11);
  const stop = input.search(
    /Interested in this job\?|Click to exchange details|Regards\s*\nHaMuch/i,
  );
  const main = (stop > 0 ? input.slice(0, stop) : input).trim();
  const emailOffset = email ? main.toLowerCase().lastIndexOf(email.toLowerCase()) : -1;
  let description = emailOffset >= 0 ? main.slice(emailOffset + email.length) : "";
  if (!description.trim()) {
    const subject = main.match(/(?:Subject:\s*)?([^\n]{12,150})/i)?.[1] || "";
    description = subject;
  }
  description = tidy(description).slice(0, 1300);
  return { name, email, phone: /^\d{11}$/.test(phone) ? phone : "", postcode, description };
}

function job(id: string) {
  const found = JOBS.find((j) => j.id === id);
  if (!found) throw Error("Missing published price");
  return found;
}

export function recommendHamuchLead(lead: HamuchLead): HamuchRecommendation {
  const text = lead.description.toLowerCase();
  if (
    /\b(ev|electric vehicle|car charg|charging)\b/.test(text) &&
    /\b(outside|outdoor|socket|plug)\b/.test(text)
  ) {
    return {
      category: "Outdoor supply for EV use",
      price: "Assessment required",
      rationale:
        "Charging demand, earthing, protection, cable route and the intended charger must be assessed.",
      guidance:
        "Ask for the vehicle charging method, consumer-unit photo, socket location and cable route. Do not quote an ordinary outdoor socket as suitable for continuous EV charging.",
      needsAssessment: true,
    };
  }
  if (/eicr|electrical installation condition|landlord.*(certificat|report)/.test(text)) {
    const ten = /7[\s–-]*(?:to[\s–-]*)?10|seven.*ten/.test(text);
    const six = /up to\s*6|\b6\s*circuits?\b|six circuits?/.test(text);
    const known = ten || six;
    const amount = job(ten ? "eicr10" : "eicr6").price;
    return {
      category: "Electrical installation condition report",
      price: known ? pounds(amount) : "From " + pounds(job("eicr6").price),
      rationale: "One consumer unit; circuit count must be confirmed. Remedial work is additional.",
      guidance:
        "Ask for a photograph of the consumer unit, circuit count, property type and access details.",
      needsAssessment: !known,
    };
  }
  if (
    /consumer unit|fuse box|fuseboard|distribution board/.test(text) &&
    /replace|change|upgrade|new|fit/.test(text)
  ) {
    const ten = /7[\s–-]*(?:to[\s–-]*)?10|(?:8|9|10)\s*circuits?/.test(text);
    const six = /up to\s*6|\b[1-6]\s*circuits?\b/.test(text);
    const known = ten || six;
    const amount = job(ten ? "board10" : "board6").price;
    return {
      category: "Consumer unit replacement",
      price: known ? "From " + pounds(amount) : "From " + pounds(job("board6").price),
      rationale:
        "FuseBox RCBO/SPD package; subject to pre-change inspection, bonding and existing faults.",
      guidance:
        "Ask for clear consumer-unit and meter/bonding photos, number of circuits and any existing defects.",
      needsAssessment: true,
    };
  }
  if (/doorbell|door bell/.test(text)) {
    return {
      category: "Wired doorbell installation",
      price: "About £100–£140 labour",
      rationale:
        "Allow roughly two to three hours at the revised weekday rates, excluding parts. A straightforward basic replacement may cost less.",
      guidance:
        "Request doorbell make/model, chime and transformer details, and a photo of the existing wiring.",
      needsAssessment: true,
    };
  }
  if (
    /new.*(socket|spur|lighting point)|socket.*(washer|dryer|outside|outdoor)|external socket|outside socket|rewire|new circuit|cable run/.test(
      text,
    )
  ) {
    return {
      category: "New wiring or socket installation",
      price: "Photos needed for fixed quote",
      rationale:
        "Labour, materials, protective device, cable length and making good depend on the route and existing supply.",
      guidance: "Ask for consumer-unit photo, proposed position and likely cable route.",
      needsAssessment: true,
    };
  }
  if (/fault|tripp|no power|dead socket|not working|intermittent/.test(text)) {
    return {
      category: "Fault finding",
      price: "£60 first hour, then £40/hour",
      rationale:
        "Standard weekday labour rates; parts, remedials and travel if applicable are extra.",
      guidance:
        "Ask what has stopped working and whether anything is tripping; avoid promising a same-day fix.",
      needsAssessment: true,
    };
  }
  const exact: Array<[RegExp, string]> = [
    [/\blight switch\b|\bswitch replacement\b/, "switch"],
    [/\b(usb double socket|usb socket)\b/, "usb-socket"],
    [/\b(double socket|replace.*socket)\b/, "socket"],
    [/\b(extractor fan)\b/, "fan"],
    [/\b(light fitting|replace.*light)\b/, "light"],
    [/\b(oven connection|connect.*oven)\b/, "oven"],
  ];
  for (const [pattern, id] of exact) {
    if (pattern.test(text)) {
      const work = job(id);
      return {
        category: work.name,
        price: "From " + pounds(work.price),
        rationale: work.detail,
        guidance:
          "Confirm the existing position, wiring condition, accessories and access before fixing the quote.",
        needsAssessment: true,
      };
    }
  }
  return {
    category: "General electrical enquiry",
    price: "£60 first hour, then £40/hour",
    rationale: "Use hourly pricing for uncertain work; fixed quotes need assessment.",
    guidance: "Ask for photos, the exact scope, location and any timing constraints.",
    needsAssessment: true,
  };
}

export function prepareHamuchReply(lead: HamuchLead, recommendation: HamuchRecommendation) {
  const firstName = lead.name.split(" ")[0];
  const greeting = firstName ? "Hi " + firstName + "," : "Hello,";
  const category = recommendation.category.toLowerCase();
  const pricing =
    recommendation.price === "Assessment required" ||
    recommendation.price === "Photos needed for fixed quote"
      ? "I can provide a fixed quote once I have a little more detail."
      : "My initial guide price is " +
        recommendation.price +
        ", subject to confirming the job details.";
  const questions = recommendation.guidance.includes("EV use")
    ? "Could you send a photo of the consumer unit, the proposed socket position, and details of how the vehicle will be charged?"
    : recommendation.guidance.includes("doorbell")
      ? "Could you send the make/model of the doorbell and chime, plus a photo of the existing wiring?"
      : "Could you send a couple of photos of the existing setup and confirm what work is needed?";
  const message = [
    greeting,
    "",
    "Thanks for your HaMuch enquiry about " + category + ". I'd be happy to help.",
    pricing,
    questions,
    "",
    "Kind regards,",
    "Sperin Services",
    "info@sperinservices.co.uk",
    "07817 360156",
  ].join("\n");
  return { subject: "Your HaMuch electrical enquiry — Sperin Services", message };
}
