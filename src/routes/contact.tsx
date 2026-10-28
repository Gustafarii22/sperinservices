import { track } from "@/lib/analytics";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";
import { SITE, SERVICES } from "@/lib/site";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";

import { CONTACT_DRAFT, ESTIMATE_DRAFT, clearDraft, readDraft, saveDraft } from "@/lib/drafts";
import { JOBS, estimate, money, type Selection } from "@/lib/pricing";
export const Route = createFileRoute("/contact")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/contact" }],
    meta: [
      { title: "Discuss Your Job | Sperin Services" },
      {
        name: "description",
        content:
          "Discuss domestic or commercial electrical work with Sperin Services across Birmingham and the West Midlands. Send the postcode, scope and useful photographs.",
      },
      { property: "og:title", content: "Discuss Your Job | Sperin Services" },
      {
        property: "og:description",
        content:
          "Send the job details and useful photographs. We will confirm the right next step.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/contact" },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(7, "Phone number is required").max(25),
  email: z.string().trim().email("Enter a valid email address").max(255),
  address: z.string().trim().max(300),
  postcode: z.string().trim().min(3, "Postcode is required").max(10),
  service: z.string().min(1, "Choose the type of work"),
  property: z.string().min(1, "Choose the property or premises type"),
  timescale: z.string().min(1, "Choose a timescale"),
  contactMethod: z.string().min(1, "Choose how you would like us to reply"),
  message: z.string().trim().min(10, "Add a little more detail about the work").max(2500),
});

type FormState = z.infer<typeof schema>;
type Photo = { name: string; type: "image/jpeg"; content: string };

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  postcode: "",
  address: "",
  service: "",
  property: "",
  timescale: "",
  contactMethod: "",
  message: "",
};

const inputCls =
  "mt-2 w-full rounded-md border border-border bg-muted px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/20";

async function preparePhoto(file: File): Promise<Photo> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15000000)
    throw Error("Choose JPG, PNG or WebP images up to 15 MB each.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw Error("Photo processing is unavailable in this browser.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
  if (data.length > 1000000)
    throw Error("This photograph is too detailed. Please use a smaller image.");
  return { name: file.name, type: "image/jpeg", content: data };
}

function Contact() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [website, setWebsite] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const reference = useRef("");
  const [selection, setSelection] = useState<Selection>({});
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    const saved = readDraft<Partial<FormState>>(CONTACT_DRAFT);
    const priced = readDraft<{ selection: Selection; postcode: string }>(ESTIMATE_DRAFT);
    if (saved) setForm({ ...initialForm, ...saved });
    if (priced) {
      setSelection(
        Object.fromEntries(
          JOBS.filter(
            (j) => Number.isInteger(priced.selection?.[j.id]) && priced.selection[j.id] > 0,
          ).map((j) => [j.id, Math.min(j.group ? 1 : 20, priced.selection[j.id])]),
        ),
      );
      if (!saved?.postcode) setForm((current) => ({ ...current, postcode: priced.postcode || "" }));
    }
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (draftReady && !sent) saveDraft(CONTACT_DRAFT, form);
  }, [draftReady, form, sent]);
  const selectedEstimate = estimate(selection);
  const whatsappText = [
    "Hi Gus, I’d like a quote.",
    form.postcode && `Postcode: ${form.postcode}`,
    form.message,
    ...selectedEstimate.rows.map((j) => `${j.quantity} × ${j.name}`),
    "I can attach photos in WhatsApp.",
  ]
    .filter(Boolean)
    .join("\n");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    reference.current = "";
    setForm((current) => ({ ...current, [key]: value }));
    setSent("");
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const next = [...files].slice(0, Math.max(0, 3 - photos.length));
      const prepared = await Promise.all(next.map(preparePhoto));
      setPhotos((current) => [...current, ...prepared].slice(0, 3));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not prepare that photograph.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (website || sending || sent || photoBusy) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    if (!consent) {
      setSubmitError("Please agree to the privacy notice before sending.");
      return;
    }

    setErrors({});
    setSubmitError("");
    setSending(true);
    try {
      reference.current ||= crypto.randomUUID();
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          postcode: form.postcode.toUpperCase(),
          consent,
          website,
          photos,
          reference: reference.current,
          selection,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw Error(result.error || "The enquiry could not be sent.");
      setSent(result.reference);
      track("enquiry_success");
      clearDraft(CONTACT_DRAFT);
      clearDraft(ESTIMATE_DRAFT);
      setSelection({});
      setForm(initialForm);
      setPhotos([]);
      setConsent(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The enquiry could not be sent. Please call, WhatsApp or email instead.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 lg:px-8 lg:pt-12">
        <span className="eyebrow">Discuss your job</span>
        <div className="mt-4 grid gap-7 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
          <div>
            <h1 className="display-title text-5xl sm:text-6xl">Tell us what needs doing.</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Send the postcode, a short description and useful photos. We’ll tell you the next
              step.
            </p>

            <div className="mt-6 border-y border-border">
              <a href={`tel:${SITE.phone}`} className="flex items-center gap-3 py-4">
                <Phone className="h-5 w-5 text-electric" />
                <span>
                  <span className="block text-xs text-muted-foreground">Call</span>
                  <strong>{SITE.phoneDisplay}</strong>
                </span>
              </a>
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border-t border-border py-4"
              >
                <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" />
                <span>
                  <span className="block text-xs text-muted-foreground">WhatsApp</span>
                  <strong>Send quick details or photos</strong>
                </span>
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 border-t border-border py-4"
              >
                <Mail className="h-5 w-5 text-electric" />
                <span>
                  <span className="block text-xs text-muted-foreground">Email</span>
                  <strong>{SITE.email}</strong>
                </span>
              </a>
            </div>

            <div className="mt-6 border-l-2 border-electric pl-4">
              <p className="font-semibold">Urgent electrical fault or loss of power?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Call us so we can quickly establish whether the fault is something we can attend to.
                This is not advertised as a 24/7 emergency service.
              </p>
            </div>

            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-electric">
                What happens next
              </p>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                {[
                  "We review the scope and photographs.",
                  "We contact you and arrange a survey if needed.",
                  "You receive the confirmed quotation before work is booked.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-mono text-electric">0{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <form onSubmit={submit} className="surface-raised p-5 sm:p-7" noValidate>
            <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-electric">
                  Job details
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Send your job</h2>
              </div>
              <MapPin className="h-5 w-5 text-electric" />
            </div>

            {selectedEstimate.count > 0 && (
              <div className="mt-5 rounded-xl border border-electric/30 bg-electric/5 p-4">
                <h3 className="font-semibold">Your estimate is attached</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {selectedEstimate.rows.map((j) => (
                    <li key={j.id}>
                      {j.quantity} × {j.name} —{" "}
                      {selectedEstimate.unknown.includes(j.id) ? "Quote required" : money(j.amount)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  {selectedEstimate.visit > 0 && (
                    <>Single visit allowance: {money(selectedEstimate.visit)}. </>
                  )}
                  Priced subtotal: {money(selectedEstimate.subtotal)}. Travel and survey items to be
                  confirmed. No VAT added.
                </p>
                <Link
                  to="/pricing"
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-electric underline"
                >
                  Edit estimate
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelection({});
                    clearDraft(ESTIMATE_DRAFT);
                  }}
                  className="ml-4 min-h-11 text-sm underline"
                >
                  Remove estimate
                </button>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Text details are kept in this browser tab for up to 24 hours. If you leave this page,
              please reattach photographs before sending.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name}>
                <input
                  className={inputCls}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  className={inputCls}
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  className={inputCls}
                  autoComplete="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Postcode" error={errors.postcode}>
                <input
                  className={inputCls}
                  autoComplete="postal-code"
                  value={form.postcode}
                  onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </Field>

              <Field
                label="Job address (optional)"
                error={errors.address}
                className="sm:col-span-2"
              >
                <input
                  className={inputCls}
                  autoComplete="street-address"
                  value={form.address}
                  maxLength={300}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
              <Field label="Work" error={errors.service}>
                <select
                  className={inputCls}
                  value={form.service}
                  onChange={(e) => update("service", e.target.value)}
                >
                  <option value="">Choose…</option>
                  {SERVICES.map((service) => (
                    <option key={service.slug}>{service.title}</option>
                  ))}
                  <option>Commercial electrical</option>
                  <option>Access control / door entry</option>
                  <option>Lighting / emergency lighting</option>
                  <option>Fault finding / remedials</option>
                  <option>Urgent electrical fault</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Property / premises" error={errors.property}>
                <select
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
                  rows={5}
                  className={inputCls}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  maxLength={2500}
                  placeholder="What is there now, what you want changed, and anything that may affect access or timing."
                />
              </Field>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center justify-between gap-4 border border-border bg-foreground/[0.025] p-4">
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <Camera className="h-4 w-4 text-electric" /> Add photographs
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Up to 3 JPG, PNG or WebP images. Consumer unit, meter, route or affected area
                      are useful.
                    </span>
                  </span>
                  <span className="text-sm font-bold text-electric">
                    {photoBusy ? "Preparing…" : "Choose"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    disabled={photoBusy || photos.length >= 3}
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                </label>
                {photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {photos.map((photo, index) => (
                      <button
                        key={`${photo.name}-${index}`}
                        type="button"
                        onClick={() =>
                          setPhotos((current) => current.filter((_, n) => n !== index))
                        }
                        className="min-h-11 rounded-md border border-border px-2.5 py-1.5 text-muted-foreground"
                      >
                        {photo.name} ×
                      </button>
                    ))}
                  </div>
                )}
                {photoError && <p className="mt-2 text-sm text-red-300">{photoError}</p>}
              </div>
            </div>

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

            <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree that these details can be used to respond to this enquiry and manage the
                job.{" "}
                <Link to="/privacy" className="text-electric underline underline-offset-2">
                  Privacy policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={sending || photoBusy || !!sent}
              className="button-primary mt-5 w-full disabled:opacity-50"
            >
              <Send className="h-4 w-4" />{" "}
              {sent ? "Enquiry sent" : sending ? "Sending…" : "Send job details"}
            </button>

            {sent && (
              <div
                role="status"
                className="mt-4 border border-[#25D366]/20 bg-[#25D366]/10 p-4 text-sm text-whatsapp"
              >
                <div className="flex gap-2">
                  <Check className="h-4 w-4" /> Enquiry received.
                </div>
                <div className="mt-1 text-xs">
                  Reference: {sent}. Gus will review your details and contact you about the next
                  step. No work is booked yet.
                </div>
              </div>
            )}
            {submitError && (
              <div
                role="alert"
                className="mt-4 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8" aria-labelledby="coverage-title">
        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-electric" />
            <h2 id="coverage-title" className="text-sm font-semibold">
              Main service area
            </h2>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SITE.areas.map((area) => (
              <span
                key={area}
                className="shrink-0 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground"
              >
                {area}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Outside these areas? Send the postcode and we will confirm whether the job is practical
            to cover.
          </p>
        </div>
      </section>
    </>
  );
}

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
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-foreground/72">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
