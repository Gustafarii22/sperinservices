import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { electricianJsonLd } from "@/lib/seo";
import { ReviewPreview } from "@/components/ReviewPreview";
import { HomeTravelChecker } from "@/components/HomeTravelChecker";
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
      <section className="mx-auto max-w-7xl px-4 pb-7 pt-8 lg:px-8 lg:pb-10 lg:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <span className="eyebrow">Sperin Services · Birmingham & West Midlands</span>
            <h1 className="display-title mt-4 max-w-4xl text-[clamp(2.8rem,7vw,5.4rem)] leading-[.96]">
              Electrical work.
              <span className="block text-electric">Clear, tested, done properly.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Domestic and commercial electrical work with one point of contact and clear pricing
              where the job allows it.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-white/10 bg-[#15191a]">
            <Link
              to="/pricing"
              className="group flex min-h-24 items-center gap-4 border-b border-white/10 px-5 py-4 transition hover:bg-electric/[0.05]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-electric/10 text-electric">
                <Calculator className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">Price Your Job</strong>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Pick the work, see the price, check travel.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-electric transition group-hover:translate-x-1" />
            </Link>

            <Link
              to="/contact"
              className="group flex min-h-24 items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-electric">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">Discuss Your Job</strong>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Send details, postcode and photos.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-electric transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid overflow-hidden rounded-md border border-white/10 sm:grid-cols-3">
          <a
            href={`tel:${SITE.phone}`}
            className="flex min-h-14 items-center justify-center gap-2 border-b border-white/10 px-4 text-sm font-semibold transition hover:bg-white/[0.03] hover:text-electric sm:border-b-0 sm:border-r"
          >
            <Phone className="h-4 w-4 text-electric" /> Call
          </a>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 items-center justify-center gap-2 border-b border-white/10 px-4 text-sm font-semibold transition hover:bg-[#25D366]/[0.05] hover:text-[#25D366] sm:border-b-0 sm:border-r"
          >
            <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" /> WhatsApp
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="flex min-h-14 items-center justify-center gap-2 px-4 text-sm font-semibold transition hover:bg-white/[0.03] hover:text-electric"
          >
            <Mail className="h-4 w-4 text-electric" /> Email
          </a>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.012]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4 lg:px-8">
          {[
            [ShieldCheck, "Public liability insured"],
            [ClipboardCheck, "City & Guilds 2391"],
            [Wrench, "18th Edition"],
            [CheckCircle2, "Testing & certification"],
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
                <span className="text-xs font-semibold text-foreground/88 sm:text-sm">
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
            <span className="eyebrow">Electrical services</span>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Choose what you need.</h2>
          </div>
          <Link
            to="/services"
            className="hidden items-center gap-2 text-sm font-bold text-electric sm:inline-flex"
          >
            All services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2">
          {SERVICES.map((service, index) => (
            <Link
              key={service.slug}
              to={service.path}
              className={`group grid min-h-24 grid-cols-[2.4rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 transition hover:bg-white/[0.018] lg:px-4 ${
                index % 2 === 0 ? "lg:border-r" : ""
              }`}
            >
              <span className="font-mono text-xs text-electric">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong className="block text-base sm:text-lg">{service.title}</strong>
                <span className="mt-1 hidden text-sm text-muted-foreground sm:block">
                  {service.short}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>

        <Link
          to="/commercial"
          className="group mt-3 flex min-h-20 items-center gap-4 border border-electric/20 bg-electric/[0.035] px-4 py-4 transition hover:bg-electric/[0.06] sm:px-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-electric/10 text-electric">
            <Zap className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-lg">Commercial Electrical</strong>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Testing, lighting, power, access control and refurbishment.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
        </Link>
      </section>

      <ReviewPreview />

      <HomeTravelChecker />

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-4 lg:px-8 lg:pb-12">
        <Link
          to="/our-work/$slug"
          params={{ slug: "rowley-park-primary-academy-refurbishment" }}
          className="group grid overflow-hidden rounded-md border border-white/10 bg-[#15191a] md:grid-cols-[1.15fr_.85fr]"
        >
          <img
            src="/projects/rowley-park/rowley-park-overview.webp"
            alt="Completed Sperin Services refurbishment at Rowley Park Primary Academy"
            width="1120"
            height="840"
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-[1.01]"
          />
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <span className="eyebrow">Recent work · genuine project</span>
            <h2 className="mt-3 text-3xl font-semibold">Rowley Park Primary Academy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Early-years refurbishment with a full electrical installation, lighting and access
              control alongside the wider finish.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-electric">
              View project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>
    </>
  );
}
