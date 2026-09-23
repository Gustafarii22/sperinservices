import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Gauge,
  Home as HomeIcon,
  Phone,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { CTA } from "@/components/CTA";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";

const AREAS = SITE.areas;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Electrician Birmingham & West Midlands | Sperin Services",
      },
      {
        name: "description",
        content:
          "Sperin Services provides domestic and commercial electrical work across Birmingham and the West Midlands, including rewires, consumer units, EICRs, EV charging, access control, lighting, maintenance and remedials.",
      },
      {
        property: "og:title",
        content: "Sperin Services | Electrical Contractors, Birmingham & West Midlands",
      },
      {
        property: "og:description",
        content:
          "Electrical work for homes, businesses and commercial premises. In the industry since 2003 and trading independently since 2010.",
      },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Electrician",
          name: SITE.name,
          url: SITE.url,
          telephone: SITE.phone,
          email: SITE.email,
          image: `${SITE.url}/sperin-logo.png`,
          foundingDate: String(SITE.founded),
          address: {
            "@type": "PostalAddress",
            addressLocality: "Birmingham",
            addressRegion: "West Midlands",
            addressCountry: "GB",
          },
          areaServed: AREAS.map((name) => ({ "@type": "City", name })),
          knowsAbout: [
            "Electrical installation",
            "Electrical inspection and testing",
            "EICR",
            "Consumer units",
            "EV charging",
            "Commercial electrical work",
            "Access control",
            "Emergency lighting",
          ],
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-12 lg:px-8 lg:pb-22 lg:pt-20">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="py-3 lg:py-8">
            <span className="eyebrow">Birmingham · West Midlands · Established 2010</span>
            <h1 className="display-title mt-5 max-w-5xl text-[3.4rem] sm:text-7xl lg:text-[5.5rem]">
              Electrical work,
              <br />
              <span className="text-electric">properly planned.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Domestic and commercial electrical work across Birmingham and the West Midlands — from rewires, consumer units and EV charging to testing, smart homes, kitchens and bathrooms. 23 years of industry experience, with clear advice from first enquiry to handover.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/contact" className="button-primary">
                Discuss a job <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone}`} className="button-secondary">
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[0.7rem] bg-[#128C4A] px-5 py-3 text-sm font-bold text-black transition hover:brightness-105"
              >
                <WhatsAppGlyph className="h-5 w-5" /> WhatsApp
              </a>
            </div>
          </div>

          <aside className="surface-raised technical-grid rounded-2xl p-6 sm:p-8 lg:p-9" aria-label="Sperin Services capability summary">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-electric">Electrical capability</div>
                <h2 className="mt-3 text-2xl font-bold">Built around real electrical work.</h2>
              </div>
              <Zap className="h-7 w-7 text-electric" aria-hidden="true" />
            </div>

            <dl className="mt-8 space-y-0">
              {[
                ["Industry experience", `Since ${SITE.industrySince}`],
                ["Trading independently", `Since ${SITE.founded}`],
                ["Inspection & testing", "City & Guilds 2391"],
                ["Wiring regulations", "18th Edition"],
                ["Project types", "Domestic · Commercial · Light industrial"],
              ].map(([term, value]) => (
                <div key={term} className="rule grid grid-cols-[1fr_auto] gap-5 py-4 first:border-t-0 first:pt-0">
                  <dt className="text-sm text-muted-foreground">{term}</dt>
                  <dd className="text-right text-sm font-semibold text-foreground/95">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4 lg:px-8">
          {[
            [ShieldCheck, "Industry experience since 2003"],
            [ClipboardCheck, "City & Guilds 2391"],
            [Wrench, "Survey · install · test"],
            [Gauge, "18th Edition wiring regulations"],
          ].map(([Icon, text], index) => {
            const IconComponent = Icon as typeof ShieldCheck;
            return (
              <div key={String(text)} className={`flex min-h-24 items-center gap-3 px-3 py-5 sm:px-5 ${index > 0 ? "border-l border-white/10" : ""}`}>
                <IconComponent className="h-5 w-5 shrink-0 text-electric" />
                <span className="text-xs font-semibold text-foreground/82 sm:text-sm">{String(text)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl section-pad px-4 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
          <div>
            <span className="eyebrow">Choose the right route</span>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Not every job needs the same process.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Domestic work needs care around the property and a clear finish. Commercial work needs scope, programme, coordination and documentation. Sperin Services approaches each around the property, programme and required handover rather than forcing every job through the same process.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/contact" className="surface-raised group rounded-2xl p-6 sm:p-7">
              <HomeIcon className="h-6 w-6 text-electric" />
              <div className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">For homeowners & landlords</div>
              <h3 className="mt-2 text-3xl font-bold">Domestic electrical</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Rewires, consumer units, EICRs, faults, sockets, lighting, EV charging, kitchens, bathrooms and alterations.</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-electric">Start a domestic enquiry <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>

            <Link to="/commercial" className="surface-raised group rounded-2xl p-6 sm:p-7">
              <Building2 className="h-6 w-6 text-electric" />
              <div className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">For businesses & premises</div>
              <h3 className="mt-2 text-3xl font-bold">Commercial electrical</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Testing, remedials, lighting, power, distribution, emergency lighting, access control, maintenance and refurbishment work.</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-electric">View commercial capability <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Electrical services</span>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">What we actually do.</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Choose the work you need and go straight to the relevant scope, process and information.</p>
        </div>

        <div>
          {SERVICES.map((service, index) => (
            <Link
              key={service.slug}
              to={service.path}
              className="group grid gap-3 border-b border-white/10 py-5 transition hover:bg-white/[0.018] sm:grid-cols-[4rem_1fr_1fr_auto] sm:items-center sm:px-2"
            >
              <span className="font-mono text-xs text-electric">0{index + 1}</span>
              <h3 className="text-xl font-bold sm:text-2xl">{service.title}</h3>
              <p className="text-sm text-muted-foreground">{service.short}</p>
              <ArrowRight className="hidden h-5 w-5 text-electric transition group-hover:translate-x-1 sm:block" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl section-pad px-4 lg:px-8">
        <div className="surface-raised overflow-hidden rounded-2xl">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <span className="eyebrow">Commercial capability</span>
              <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Built for more than domestic call-outs.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sperin Services also takes on planned work for schools, nurseries, offices, shops, landlords and small commercial premises — including inspection and testing, lighting, power, emergency lighting, access control, remedials and upgrades.
              </p>
              <Link to="/commercial" className="button-primary mt-7">
                Commercial services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="technical-grid border-t border-white/10 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="space-y-4">
                {[
                  "Commercial EICRs and remedial works",
                  "Lighting and emergency lighting",
                  "Access control and door-entry wiring",
                  "Power, distribution and containment",
                  "Refurbishment and alteration works",
                  "Fault finding and planned maintenance",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-foreground/88">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        <span className="eyebrow">How a job runs</span>
        <div className="mt-6 grid gap-0 border-y border-white/10 md:grid-cols-4">
          {[
            ["01", "Understand", "Site details, existing installation, access, finish and what you actually need."],
            ["02", "Specify", "A clear scope and quotation rather than vague allowances wherever the job permits."],
            ["03", "Install", "Work planned around the property or premises, with changes discussed before they become surprises."],
            ["04", "Test & hand over", "Inspection, testing and the appropriate certification or documentation on completion."],
          ].map(([number, title, text], index) => (
            <div key={number} className={`p-5 sm:p-6 ${index > 0 ? "border-t border-white/10 md:border-l md:border-t-0" : ""}`}>
              <div className="font-mono text-xs text-electric">{number}</div>
              <h3 className="mt-8 text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <div>
            <span className="eyebrow">Service area</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Birmingham and the wider West Midlands.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <span key={area} className="rounded-md border border-white/10 bg-white/[0.018] px-3 py-2 text-sm text-foreground/78">{area}</span>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
