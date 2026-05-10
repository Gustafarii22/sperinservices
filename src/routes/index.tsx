import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageCircle, ArrowRight, ShieldCheck, Sparkles, MapPin, Wrench } from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { CTA } from "@/components/CTA";
import heroImg from "@/assets/hero-electrician.jpg";
import imgRewires from "@/assets/svc-rewires.jpg";
import imgCU from "@/assets/svc-consumer-unit.jpg";
import imgEV from "@/assets/svc-ev.jpg";
import imgSmart from "@/assets/svc-smart.jpg";
import imgTesting from "@/assets/svc-testing.jpg";
import imgKitchen from "@/assets/svc-kitchen.jpg";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";

const SERVICE_IMAGES: Record<string, string> = {
  rewires: imgRewires,
  "consumer-unit": imgCU,
  ev: imgEV,
  smart: imgSmart,
  testing: imgTesting,
  kitchen: imgKitchen,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sperin Services — Electrical & Building Services in Birmingham, Sutton Coldfield & Tamworth" },
      { name: "description", content: "Premium domestic electrical and building services across the West Midlands. Rewires, consumer units, EV chargers, smart home, testing, kitchens & bathrooms." },
      { property: "og:title", content: "Sperin Services — Premium Electrical & Building, West Midlands" },
      { property: "og:description", content: "Clean workmanship across Birmingham, Sutton Coldfield, Tamworth and surrounding areas." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Sperin Services",
          url: SITE.url,
          telephone: SITE.phone,
          areaServed: SITE.areas,
          address: { "@type": "PostalAddress", addressRegion: "West Midlands", addressCountry: "GB" },
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-radial-gold)" }}
        />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full hairline px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-gold/90">
              <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" />
              West Midlands · Domestic Specialists
            </div>
            <h1 className="mt-6 text-[2.5rem] sm:text-5xl lg:text-[4.25rem] font-bold leading-[1.02] tracking-[-0.035em]">
              Premium electrical
              <br className="hidden sm:block" /> & building services,
              <br className="hidden sm:block" />{" "}
              <span className="gradient-gold-text">crafted for your home.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Domestic rewires, consumer units, EV chargers, smart home, testing &amp; certification, kitchens and bathrooms — delivered with the precision of a luxury build.
            </p>
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
                <Phone className="h-4 w-4 text-gold" /> Call {SITE.phoneDisplay}
              </a>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3 text-sm font-semibold hover:bg-white/5 transition"
              >
                <MessageCircle className="h-4 w-4" style={{ color: "var(--whatsapp)" }} /> WhatsApp
              </a>
            </div>
            <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              {[
                { i: ShieldCheck, t: "Fully qualified" },
                { i: Sparkles, t: "Clean workmanship" },
                { i: Wrench, t: "Domestic specialists" },
                { i: MapPin, t: "Local West Mids" },
                { i: ShieldCheck, t: "Reliable service" },
                { i: Sparkles, t: "Free quotes" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gold" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] opacity-60 blur-3xl gradient-gold" />
            <img
              src={heroImg}
              alt="Sperin Services electrician installing a modern consumer unit in a UK home"
              className="relative w-full rounded-3xl shadow-elegant gold-border-glow object-cover aspect-[4/3]"
              width={1920}
              height={1280}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* SERVICE BUTTONS */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">Our Services</span>
            </h2>
            <p className="mt-2 text-muted-foreground">Tap any service to learn more.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to={s.path}
              className="group relative overflow-hidden rounded-3xl gold-border-glow bg-card hover:-translate-y-1 transition duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={SERVICE_IMAGES[s.image]}
                  alt={s.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 35%, oklch(0.08 0.01 60 / 0.85) 100%)",
                }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                style={{ background: "var(--gradient-radial-gold)" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{s.short}</p>
                </div>
                <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-primary-foreground shadow-gold">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            <span className="gradient-gold-text">Why Choose Sperin Services</span>
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            A reliable, local team delivering domestic electrical and building work to a premium standard.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Fully qualified", d: "Trained, experienced and continually developing." },
              { t: "Clean, tidy workmanship", d: "We treat your home with respect, every visit." },
              { t: "Domestic specialists", d: "Focused expertise in homes — not commercial." },
              { t: "Clear communication", d: "Honest updates, no jargon, no surprises." },
              { t: "Local West Midlands service", d: "Birmingham, Sutton Coldfield, Tamworth and surrounding." },
              { t: "High attention to detail", d: "From cable routes to final finish." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl hairline p-5 bg-card/40">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gold glow-gold" />
                  <h3 className="font-semibold">{x.t}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT WORK PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">Recent Work</span>
            </h2>
            <p className="mt-2 text-muted-foreground">A quick look at recent installs.</p>
          </div>
          <Link
            to="/gallery"
            className="hidden sm:inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5"
          >
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[work1, work2, work3].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-2xl gold-border-glow">
              <img
                src={src}
                alt={`Recent work ${i + 1}`}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover hover:scale-105 transition duration-700"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5"
          >
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>
      </section>

      <CTA />
    </>
  );
}
