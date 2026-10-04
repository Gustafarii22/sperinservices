import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { electricianJsonLd } from "@/lib/seo";
import { ReviewPreview } from "@/components/ReviewPreview";
import { WhatsAppGlyph } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Electrician Birmingham & West Midlands | Sperin Services" },
      {
        name: "description",
        content:
          "Domestic and commercial electrician across Birmingham and the West Midlands. Rewires, consumer units, EICRs, EV charging, lighting, fault finding and commercial electrical work.",
      },
      {
        property: "og:title",
        content: "Sperin Services | Electrician Birmingham & West Midlands",
      },
      {
        property: "og:description",
        content:
          "Domestic and commercial electrical work with clear pricing, inspection, testing and one point of contact.",
      },
      { property: "og:url", content: SITE.url },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(electricianJsonLd()),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-9 pt-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8 lg:pb-12 lg:pt-12">
        <div className="py-2">
          <span className="eyebrow">Established 2010 · Industry experience since 2003</span>
          <h1 className="display-title mt-5 max-w-4xl text-[clamp(2.8rem,7vw,5.3rem)] leading-[.98]">
            Domestic &amp; commercial electrician.
            <span className="mt-2 block text-electric">Birmingham &amp; West Midlands.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Carefully planned electrical work, clear prices where the scope allows it, proper
            testing and one point of contact from first conversation to handover.
          </p>

          <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
            <Link to="/pricing" className="button-primary">
              <Calculator className="h-4 w-4" /> Build an estimate
            </Link>
            <Link to="/contact" className="button-secondary">
              Discuss a project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-foreground/78">
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 hover:text-electric"
            >
              <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-[#72d997]"
            >
              <WhatsAppGlyph className="h-4 w-4 text-[#72d997]" /> WhatsApp
            </a>
          </div>
        </div>

        <Link
          to="/our-work/$slug"
          params={{ slug: "rowley-park-primary-academy-refurbishment" }}
          className="group block overflow-hidden bg-[#202426]"
          aria-label="View Rowley Park Primary Academy project"
        >
          <figure className="relative">
            <img
              src="/projects/rowley-park/rowley-park-overview.webp"
              width="1120"
              height="840"
              fetchPriority="high"
              alt="Completed Sperin Services refurbishment at Rowley Park Primary Academy"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 m-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-12 text-xs text-white/85">
              Genuine Sperin Services project · Rowley Park Primary Academy
            </figcaption>
          </figure>
        </Link>
      </section>

      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4 lg:px-8">
          {[
            [ShieldCheck, "Public liability insured"],
            [ClipboardCheck, "City & Guilds 2391"],
            [Wrench, "18th Edition"],
            [CheckCircle2, "Test & certification"],
          ].map(([Icon, text], index) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return (
              <div
                key={String(text)}
                className={`flex min-h-20 items-center gap-3 px-2 py-4 sm:px-4 ${
                  index > 0 ? "border-l border-white/10" : ""
                }`}
              >
                <ItemIcon className="h-5 w-5 shrink-0 text-electric" />
                <span className="text-xs font-semibold text-foreground/86 sm:text-sm">
                  {String(text)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex items-end justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <span className="eyebrow">Services</span>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Choose what you need.</h2>
          </div>
          <Link
            to="/services"
            className="hidden items-center gap-2 text-sm font-bold text-electric sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="group min-h-28 bg-background p-4 transition hover:bg-[#1a1d1f] sm:p-5"
            >
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.short}</p>
              <ArrowRight className="mt-5 h-4 w-4 text-electric transition group-hover:translate-x-1" />
            </Link>
          ))}
          <Link
            to="/commercial"
            className="group col-span-2 min-h-24 bg-background p-4 transition hover:bg-[#1a1d1f] sm:p-5 lg:col-span-3"
          >
            <h3 className="text-xl font-semibold">Commercial Electrical</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Testing, lighting, power, access control, remedials and refurbishment work.
            </p>
            <ArrowRight className="mt-5 h-4 w-4 text-electric transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid overflow-hidden border border-white/10 md:grid-cols-[.9fr_1.1fr]">
          <img
            src="/projects/rowley-park/rowley-park-rest-area.webp"
            alt="Completed rest area at Rowley Park Primary Academy"
            width="900"
            height="675"
            loading="lazy"
            className="aspect-[16/10] h-full w-full object-cover"
          />
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <span className="eyebrow">Recent work</span>
            <h2 className="mt-3 text-3xl font-semibold">Rowley Park Primary Academy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A coordinated early-years refurbishment including a full electrical installation,
              lighting, access control, flooring, decorating and carpentry.
            </p>
            <Link
              to="/our-work/$slug"
              params={{ slug: "rowley-park-primary-academy-refurbishment" }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-electric"
            >
              View genuine project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <ReviewPreview />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
          <Link to="/pricing" className="group bg-[#15191b] p-6 sm:p-8">
            <Calculator className="h-6 w-6 text-electric" />
            <h2 className="mt-5 text-3xl font-semibold">Straightforward job?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Choose listed work, check travel, see the running estimate and download a PDF.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-electric">
              Build an estimate{" "}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <Link to="/contact" className="group bg-[#15191b] p-6 sm:p-8">
            <BriefcaseBusiness className="h-6 w-6 text-electric" />
            <h2 className="mt-5 text-3xl font-semibold">Bespoke or larger project?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Send the postcode, scope and useful photographs. A survey can be arranged where
              needed.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-electric">
              Discuss a project{" "}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Home className="h-4 w-4 text-electric" />
          <span>Serving Birmingham, Smethwick, Quinton and the wider West Midlands.</span>
          <Link to="/contact" className="font-semibold text-electric">
            Check your area
          </Link>
        </div>
      </section>
    </>
  );
}
