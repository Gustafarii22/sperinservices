import { Link } from "@tanstack/react-router";
import { Check, ArrowRight, Phone } from "lucide-react";
import { CTA } from "./CTA";
import { FAQ, type FAQItem } from "./FAQ";
import { SITE } from "@/lib/site";

export type ServicePageProps = {
  title: string;
  intro: string;
  heroImage: string;
  intro2?: string;
  included: string[];
  whyItMatters: string[];
  workImages?: { src: string; alt: string }[];
  faqs: FAQItem[];
};

export function ServicePage(p: ServicePageProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-radial-gold)" }}
        />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 pb-12 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" />
              West Midlands · Domestic Specialists
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              <span className="gradient-gold-text">{p.title}</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">{p.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-110 transition"
              >
                Get a Free Quote
              </Link>
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3 text-sm font-semibold hover:bg-white/5 transition"
              >
                <Phone className="h-4 w-4 text-gold" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl opacity-50 blur-2xl gradient-gold" />
            <img
              src={p.heroImage}
              alt={p.title}
              className="relative w-full rounded-3xl shadow-elegant gold-border-glow object-cover aspect-[4/3]"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Intro 2 + Included + Why */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-12 grid gap-8 lg:grid-cols-2">
        <div className="glass rounded-3xl p-7">
          <h2 className="text-2xl font-bold gradient-gold-text">What's included</h2>
          {p.intro2 && <p className="mt-3 text-muted-foreground">{p.intro2}</p>}
          <ul className="mt-5 space-y-3">
            {p.included.map((x) => (
              <li key={x} className="flex items-start gap-3 text-sm">
                <Check className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span className="text-foreground/90">{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-3xl p-7">
          <h2 className="text-2xl font-bold gradient-gold-text">Why it matters</h2>
          <ul className="mt-5 space-y-3">
            {p.whyItMatters.map((x) => (
              <li key={x} className="flex items-start gap-3 text-sm">
                <ArrowRight className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span className="text-foreground/90">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {p.workImages && p.workImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 lg:px-8 my-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold gradient-gold-text">Recent work</h2>
            <Link to="/gallery" className="text-sm text-gold hover:underline">
              View full gallery →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.workImages.map((w) => (
              <div key={w.src} className="overflow-hidden rounded-2xl gold-border-glow">
                <img
                  src={w.src}
                  alt={w.alt}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover hover:scale-105 transition duration-700"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <FAQ items={p.faqs} />
      <CTA />
    </>
  );
}
