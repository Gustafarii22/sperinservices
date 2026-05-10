import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, MessageCircle, Mail, MapPin, Send } from "lucide-react";
import { z } from "zod";
import { SITE, SERVICES } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sperin Services — Get a Free Quote, West Midlands" },
      { name: "description", content: "Contact Sperin Services for a free quote on domestic electrical and building work. Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "Contact Sperin Services" },
      { property: "og:description", content: "Get a free quote across the West Midlands." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  phone: z.string().trim().min(7, "Phone required").max(20),
  email: z.string().trim().email("Invalid email").max(255),
  postcode: z.string().trim().min(3, "Postcode required").max(10),
  service: z.string().min(1, "Please choose"),
  message: z.string().trim().min(1, "Tell us a bit more").max(2000),
});

function Contact() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", postcode: "", service: "", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    // Static-friendly: open email/WhatsApp with prefilled body
    const body = `Name: ${form.name}%0APhone: ${form.phone}%0AEmail: ${form.email}%0APostcode: ${form.postcode}%0AService: ${form.service}%0A%0A${encodeURIComponent(form.message)}`;
    window.location.href = `mailto:${SITE.email}?subject=Quote%20Request%20-%20${encodeURIComponent(form.service)}&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 pb-6 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" /> Contact
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold">
              <span className="gradient-gold-text">Get in touch</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Free quotes across Birmingham, Sutton Coldfield, Tamworth and the wider
              West Midlands. Call, WhatsApp or send a message.
            </p>
          </div>

          <div className="space-y-3">
            <a href={`tel:${SITE.phone}`} className="flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/5">
              <Phone className="h-5 w-5 text-gold" />
              <div>
                <div className="text-xs text-muted-foreground">Call</div>
                <div className="font-medium">{SITE.phoneDisplay}</div>
              </div>
            </a>
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/5">
              <MessageCircle className="h-5 w-5" style={{ color: "var(--whatsapp)" }} />
              <div>
                <div className="text-xs text-muted-foreground">WhatsApp</div>
                <div className="font-medium">Message us</div>
              </div>
            </a>
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/5">
              <Mail className="h-5 w-5 text-gold" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{SITE.email}</div>
              </div>
            </a>
            <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
              <MapPin className="h-5 w-5 text-gold" />
              <div>
                <div className="text-xs text-muted-foreground">Service area</div>
                <div className="font-medium">{SITE.areas.join(" · ")}</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="lg:col-span-3 glass rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-2xl font-bold gradient-gold-text">Request a quote</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={100} />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={20} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
            </Field>
            <Field label="Postcode" error={errors.postcode}>
              <input className={inputCls} value={form.postcode} onChange={(e) => update("postcode", e.target.value.toUpperCase())} maxLength={10} />
            </Field>
            <Field label="Service required" error={errors.service} className="sm:col-span-2">
              <select className={inputCls} value={form.service} onChange={(e) => update("service", e.target.value)}>
                <option value="">Choose a service…</option>
                {SERVICES.map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Message" error={errors.message} className="sm:col-span-2">
              <textarea rows={5} className={inputCls} value={form.message} onChange={(e) => update("message", e.target.value)} maxLength={2000} placeholder="Tell us a little about the work…" />
            </Field>
            <Field label="Photos (optional)" className="sm:col-span-2">
              <input type="file" accept="image/*" multiple className={`${inputCls} file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-gold/20 file:text-gold`} />
              <p className="mt-1 text-xs text-muted-foreground">Photos won't auto-upload — please attach them in the email that opens.</p>
            </Field>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-110 transition"
          >
            <Send className="h-4 w-4" /> Send Quote Request
          </button>
          {sent && <p className="text-sm text-gold">Opening your email app — please send the prefilled message to complete your request.</p>}
        </form>
      </section>
    </>
  );
}

const inputCls = "w-full rounded-xl bg-background/60 hairline px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50";

function Field({ label, children, error, className = "" }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-foreground/80 mb-1.5">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
