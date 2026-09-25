import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";
import { SITE, SERVICES } from "@/lib/site";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/contact")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/contact" }],
    meta: [
      { title: "Request an Electrical Quote | Sperin Services" },
      {
        name: "description",
        content:
          "Request an electrical quote from Sperin Services for domestic or commercial work across Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "Request a Quote | Sperin Services" },
      {
        property: "og:description",
        content: "Tell us what the job actually involves and we can advise on the right next step.",
      },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(7, "Phone number is required").max(25),
  email: z.string().trim().email("Enter a valid email address").max(255),
  postcode: z.string().trim().min(3, "Postcode is required").max(10),
  service: z.string().min(1, "Choose the type of work"),
  property: z.string().min(1, "Choose the property or premises type"),
  timescale: z.string().min(1, "Choose a timescale"),
  contactMethod: z.string().min(1, "Choose how you would like us to reply"),
  message: z.string().trim().min(10, "Add a little more detail about the work").max(2500),
});

type FormState = z.infer<typeof schema>;

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  postcode: "",
  service: "",
  property: "",
  timescale: "",
  contactMethod: "",
  message: "",
};

function Contact() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (website) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError("");
    setSending(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `New Sperin Services enquiry — ${form.service}`,
          _template: "table",
          name: form.name,
          phone: form.phone,
          email: form.email,
          postcode: form.postcode,
          service: form.service,
          property_or_premises: form.property,
          timescale: form.timescale,
          preferred_contact: form.contactMethod,
          message: form.message,
        }),
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true"))
        throw new Error("Submission failed");
      setSent(true);
      setForm(initialForm);
    } catch {
      setSubmitError("The form could not be sent. Please call, WhatsApp or email instead.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 lg:px-8 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <span className="eyebrow">Quote / enquiry</span>
            <h1 className="display-title mt-5 text-5xl sm:text-6xl">
              Start with the job, not a sales form.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              The more useful the first details are, the quicker we can tell you what needs checking
              and whether a site visit is the right next step.
            </p>

            <div className="rule mt-8 space-y-0 pt-2">
              <a
                href={`tel:${SITE.phone}`}
                className="flex items-center gap-4 border-b border-white/10 py-4 transition hover:text-electric"
              >
                <Phone className="h-5 w-5 text-electric" />
                <span>
                  <span className="block text-xs text-muted-foreground">Call</span>
                  <span className="font-semibold">{SITE.phoneDisplay}</span>
                </span>
              </a>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 border-b border-white/10 py-4 transition hover:text-[#25D366]"
              >
                <WhatsAppGlyph className="h-6 w-6" />
                <span>
                  <span className="block text-xs text-muted-foreground">WhatsApp</span>
                  <span className="font-semibold">Best for photos and quick job details</span>
                </span>
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-4 border-b border-white/10 py-4 transition hover:text-electric"
              >
                <Mail className="h-5 w-5 text-electric" />
                <span>
                  <span className="block text-xs text-muted-foreground">Email</span>
                  <span className="font-semibold">{SITE.email}</span>
                </span>
              </a>
              <div className="flex items-start gap-4 py-4">
                <MapPin className="mt-0.5 h-5 w-5 text-electric" />
                <span>
                  <span className="block text-xs text-muted-foreground">Coverage</span>
                  <span className="font-semibold">Birmingham & wider West Midlands</span>
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="surface-raised rounded-2xl p-6 sm:p-8" noValidate>
            <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
                  Project details
                </div>
                <h2 className="mt-2 text-3xl font-bold">Request a quote</h2>
              </div>
              <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                SS / ENQUIRY
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Name" error={errors.name}>
                <input
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  maxLength={100}
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  aria-invalid={Boolean(errors.phone)}
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  maxLength={25}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  maxLength={255}
                />
              </Field>
              <Field label="Postcode" error={errors.postcode}>
                <input
                  aria-invalid={Boolean(errors.postcode)}
                  autoComplete="postal-code"
                  className={inputCls}
                  value={form.postcode}
                  onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </Field>

              <Field label="What work do you need?" error={errors.service}>
                <select
                  aria-invalid={Boolean(errors.service)}
                  className={inputCls}
                  value={form.service}
                  onChange={(e) => update("service", e.target.value)}
                >
                  <option value="">Choose…</option>
                  {SERVICES.map((service) => (
                    <option key={service.slug} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                  <option value="Commercial electrical">Commercial electrical</option>
                  <option value="Access control / door entry">Access control / door entry</option>
                  <option value="Lighting / emergency lighting">
                    Lighting / emergency lighting
                  </option>
                  <option value="Fault finding / remedials">Fault finding / remedials</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Property / premises" error={errors.property}>
                <select
                  aria-invalid={Boolean(errors.property)}
                  className={inputCls}
                  value={form.property}
                  onChange={(e) => update("property", e.target.value)}
                >
                  <option value="">Choose…</option>
                  <option>House / flat</option>
                  <option>Rental / HMO</option>
                  <option>School / nursery</option>
                  <option>Office / shop</option>
                  <option>Commercial unit</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Timescale" error={errors.timescale}>
                <select
                  aria-invalid={Boolean(errors.timescale)}
                  className={inputCls}
                  value={form.timescale}
                  onChange={(e) => update("timescale", e.target.value)}
                >
                  <option value="">Choose…</option>
                  <option>Urgent fault / safety issue</option>
                  <option>Within 2 weeks</option>
                  <option>Within 1 month</option>
                  <option>1–3 months</option>
                  <option>Planning stage / flexible</option>
                </select>
              </Field>

              <Field label="Preferred reply" error={errors.contactMethod}>
                <select
                  aria-invalid={Boolean(errors.contactMethod)}
                  className={inputCls}
                  value={form.contactMethod}
                  onChange={(e) => update("contactMethod", e.target.value)}
                >
                  <option value="">Choose…</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                </select>
              </Field>

              <Field label="What needs doing?" error={errors.message} className="sm:col-span-2">
                <textarea
                  aria-invalid={Boolean(errors.message)}
                  rows={6}
                  className={inputCls}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  maxLength={2500}
                  placeholder="Tell us what is there now, what you want changed, and anything that may affect access or timing."
                />
              </Field>

              <div className="absolute -left-[10000px]" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/[0.055] p-4 text-sm leading-relaxed text-muted-foreground">
              Photos of the consumer unit, meter position, route or affected area can save a lot of
              guesswork. Send them by{" "}
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#25D366] underline underline-offset-2"
              >
                WhatsApp
              </a>{" "}
              after submitting.
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={sending}
                className="button-primary sm:min-w-44 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send enquiry"}
              </button>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Your details are used to respond to this enquiry and manage the job.{" "}
                <Link to="/privacy" className="text-electric underline underline-offset-2">
                  Privacy policy
                </Link>
                .
              </p>
            </div>

            {sent && (
              <div
                role="status"
                className="mt-5 rounded-lg border border-[#25D366]/20 bg-[#25D366]/10 p-4 text-sm text-[#7ef0a7]"
              >
                Enquiry sent. Thank you — we’ll use the details above to respond.
              </div>
            )}
            {submitError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/12 bg-black/20 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/20";

function Field({
  label,
  children,
  error,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.09em] text-foreground/72">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
