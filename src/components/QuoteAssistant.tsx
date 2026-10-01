import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Phone, ClipboardList } from "lucide-react";
import { SITE } from "@/lib/site";

const SERVICES = [
  "Full / part rewire",
  "Consumer unit",
  "EV charger",
  "Testing / EICR",
  "Smart home",
  "Kitchen",
  "Bathroom",
  "Commercial electrical",
  "Other",
] as const;
type Service = (typeof SERVICES)[number];

const questions: Record<Service, { key: string; label: string; placeholder?: string }[]> = {
  "Full / part rewire": [
    { key: "property", label: "What type of property is it?", placeholder: "e.g. 3-bed semi" },
    { key: "scope", label: "Full or part rewire?", placeholder: "Tell us the rooms / scope" },
    {
      key: "occupancy",
      label: "Is the property occupied?",
      placeholder: "Occupied / vacant / being renovated",
    },
  ],
  "Consumer unit": [
    {
      key: "reason",
      label: "What do you need help with?",
      placeholder: "Replacement, additional circuits, fault...",
    },
    { key: "age", label: "What is there now?", placeholder: "Approximate age/type if known" },
    { key: "circuits", label: "How many circuits roughly?", placeholder: "If known" },
  ],
  "EV charger": [
    {
      key: "charger",
      label: "Have you chosen a charger?",
      placeholder: "Make/model or not chosen yet",
    },
    {
      key: "parking",
      label: "Where will the vehicle park?",
      placeholder: "Driveway, garage, allocated space...",
    },
    {
      key: "route",
      label: "What is the likely cable route?",
      placeholder: "Approx distance and route if known",
    },
  ],
  "Testing / EICR": [
    {
      key: "property",
      label: "What property needs testing?",
      placeholder: "Home, rental, shop, office...",
    },
    {
      key: "reason",
      label: "What is the test for?",
      placeholder: "Landlord EICR, purchase, fault...",
    },
    { key: "date", label: "When do you need it?", placeholder: "Preferred date/timeframe" },
  ],
  "Smart home": [
    {
      key: "scope",
      label: "What would you like to control?",
      placeholder: "Lighting, heating, blinds, security...",
    },
    {
      key: "property",
      label: "Tell us about the property",
      placeholder: "New build, renovation, existing home...",
    },
  ],
  Kitchen: [
    {
      key: "scope",
      label: "What work do you need?",
      placeholder: "Full installation, electrical only, alterations...",
    },
    {
      key: "stage",
      label: "What stage is the project at?",
      placeholder: "Planning, units ordered, strip-out...",
    },
  ],
  Bathroom: [
    {
      key: "scope",
      label: "What work do you need?",
      placeholder: "Full installation, lighting, fan, shower...",
    },
    {
      key: "stage",
      label: "What stage is the project at?",
      placeholder: "Planning, refurbishment underway...",
    },
  ],
  "Commercial electrical": [
    {
      key: "premises",
      label: "What type of premises?",
      placeholder: "School, office, shop, warehouse...",
    },
    {
      key: "scope",
      label: "What work is required?",
      placeholder: "Testing, lighting, power, remedials...",
    },
    {
      key: "programme",
      label: "What is the required timeframe?",
      placeholder: "Dates / access restrictions",
    },
  ],
  Other: [
    { key: "scope", label: "Tell us what you need", placeholder: "A short description of the job" },
  ],
};

export function QuoteAssistant() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({
    name: "",
    postcode: "",
    phone: "",
    email: "",
    contactMethod: "Phone",
    timeframe: "",
  });
  const [step, setStep] = useState(0);
  const qs = useMemo(() => (service ? questions[service] : []), [service]);
  const summary = useMemo(
    () =>
      service
        ? [
            `Service: ${service}`,
            ...qs.map((q) => `${q.label} ${answers[q.key] || "Not supplied"}`),
            `Name: ${contact.name || "Not supplied"}`,
            `Postcode/area: ${contact.postcode || "Not supplied"}`,
            `Phone: ${contact.phone || "Not supplied"}`,
            `Email: ${contact.email || "Not supplied"}`,
            `Preferred contact: ${contact.contactMethod}`,
            `Timeframe: ${contact.timeframe || "Not supplied"}`,
          ].join("\n")
        : "",
    [service, answers, contact, qs],
  );
  const whatsapp = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi Sperin Services, I'd like a quote.\n\n" + summary)}`;
  const reset = () => {
    setService(null);
    setAnswers({});
    setContact({
      name: "",
      postcode: "",
      phone: "",
      email: "",
      contactMethod: "Phone",
      timeframe: "",
    });
    setFiles([]);
    setError("");
    setSent(false);
    setStep(0);
  };
  async function sendEnquiry() {
    setSending(true);
    setError("");
    try {
      const body = new FormData();
      const enquiryId = `SS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      body.set("enquiry_id", enquiryId);
      body.set("_subject", `Quick quote — ${service}`);
      body.set("_template", "table");
      body.set("summary", summary);
      files.forEach((file, i) => body.append(`attachment${i + 1}`, file));
      const response = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true"))
        throw new Error("Delivery failed");
      setSent(true);
    } catch {
      setError("We could not send this enquiry. Please use WhatsApp or call us instead.");
    } finally {
      setSending(false);
    }
  }
  const photoPrompt =
    service === "EV charger"
      ? "Meter, consumer unit, proposed charger location and cable route"
      : service === "Consumer unit"
        ? "A clear photograph of the existing consumer unit"
        : service === "Full / part rewire"
          ? "Rooms, existing installation or plans if available"
          : "Photographs or plans that explain the work (optional)";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="quote-launcher fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-md border border-white/20 bg-[#202426] px-4 py-3 text-sm font-bold text-foreground md:bottom-20">
          <ClipboardList className="h-4 w-4 text-electric" /> Quick quote
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[88dvh] w-[calc(100%-24px)] max-w-xl overflow-y-auto p-5 sm:p-7"
        aria-describedby={undefined}
      >
        <div className="pr-6">
          <span className="eyebrow">Sperin quick quote</span>
          <DialogTitle className="mt-2 text-2xl font-bold">Tell us about the job.</DialogTitle>
        </div>
        {!service ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            {SERVICES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setService(s);
                  setStep(0);
                }}
                className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-left text-sm font-semibold transition hover:border-electric/40 hover:bg-electric/[.06]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : step < qs.length ? (
          <div className="mt-6">
            <div className="text-xs text-muted-foreground">
              Question {step + 1} of {qs.length}
            </div>
            <div
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={qs.length + 2}
              aria-label="Quote progress"
              className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full bg-electric"
                style={{ width: `${((step + 1) / (qs.length + 2)) * 100}%` }}
              />
            </div>
            <label htmlFor="quote-answer" className="mt-3 block text-xl font-bold">
              {qs[step].label}
            </label>
            <textarea
              id="quote-answer"
              autoFocus
              value={answers[qs[step].key] || ""}
              onChange={(e) => setAnswers({ ...answers, [qs[step].key]: e.target.value })}
              placeholder={qs[step].placeholder}
              className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => (step === 0 ? reset() : setStep(step - 1))}
                className="button-secondary"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => {
                  if (!(answers[qs[step].key] || "").trim()) {
                    setError("Please answer this question before continuing.");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
                className="button-primary"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : step === qs.length ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Nearly done. Add the details we need to reply.
            </p>
            {(["name", "postcode", "phone", "email", "timeframe"] as const).map((k) => (
              <input
                aria-label={
                  k === "name"
                    ? "Your name"
                    : k === "postcode"
                      ? "Postcode or area"
                      : k === "phone"
                        ? "Phone number"
                        : k === "email"
                          ? "Email address"
                          : "Preferred timeframe"
                }
                type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                key={k}
                value={contact[k]}
                onChange={(e) => setContact({ ...contact, [k]: e.target.value })}
                placeholder={
                  k === "name"
                    ? "Your name"
                    : k === "postcode"
                      ? "Postcode / area"
                      : k === "email"
                        ? "Email address"
                        : k === "timeframe"
                          ? "When would you like the work done?"
                          : "Phone number"
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"
              />
            ))}
            <label className="block text-sm">
              Preferred contact method
              <select
                value={contact.contactMethod}
                onChange={(e) => setContact({ ...contact, contactMethod: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#101923] p-3"
              >
                <option>Phone</option>
                <option>Email</option>
                <option>WhatsApp</option>
              </select>
            </label>
            <label className="block text-sm">
              Helpful photos or documents: {photoPrompt}
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  const chosen = Array.from(e.target.files || []);
                  if (
                    chosen.length > 5 ||
                    chosen.reduce((total, f) => total + f.size, 0) > 9_500_000
                  ) {
                    setError("Choose up to five files, under 9.5 MB combined.");
                    setFiles([]);
                  } else {
                    setError("");
                    setFiles(chosen);
                  }
                }}
                className="mt-2 block w-full text-sm"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(step - 1)} className="button-secondary">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => {
                  if (
                    !contact.name.trim() ||
                    !contact.phone.trim() ||
                    !contact.postcode.trim() ||
                    !/^\S+@\S+\.\S+$/.test(contact.email)
                  ) {
                    setError("Enter your name, phone, postcode and a valid email address.");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
                className="button-primary"
              >
                Review <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap text-sm leading-6">
              {summary}
              {files.length > 0 && `\nFiles: ${files.map((f) => f.name).join(", ")}`}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              This starts an enquiry, not a fixed quotation. Photos and a site visit can be arranged
              where needed.
            </p>
            {sent ? (
              <p role="status" className="mt-4 text-sm text-electric">
                Enquiry delivered. We will be in touch.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setStep(qs.length)} className="button-secondary">
                    Edit details
                  </button>
                  <button
                    onClick={sendEnquiry}
                    disabled={sending}
                    className="button-primary disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send enquiry"}
                  </button>
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
              </>
            )}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="button-primary">
                <MessageCircle className="h-4 w-4" />{" "}
                {files.length ? "WhatsApp (attach files there)" : "Send by WhatsApp"}
              </a>
              <a href={`tel:${SITE.phone}`} className="button-secondary">
                <Phone className="h-4 w-4" /> Call instead
              </a>
            </div>
            <button onClick={reset} className="mt-4 text-sm font-bold text-electric">
              Start again
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
