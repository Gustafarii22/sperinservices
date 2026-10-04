import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { electricianJsonLd } from "@/lib/seo";
import { ReviewPreview } from "@/components/ReviewPreview";
import { HomeTravelChecker } from "@/components/HomeTravelChecker";

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
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 lg:px-8 lg:pb-10 lg:pt-10">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-[2.9rem]">
              Electrical services for homes &amp; businesses.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              From small electrical jobs and EICRs to rewires, EV charging and commercial
              installations. Clear advice, careful installation, testing and certification — with
              one point of contact throughout.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-white/10 bg-[#15191a]">
            <Link
              to="/pricing"
              className="group flex min-h-24 items-center gap-4 border-b border-white/10 px-5 py-4 transition hover:bg-electric/[0.05]"
            >
              <Calculator className="h-5 w-5 shrink-0 text-electric" />
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">Price Your Job</strong>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Pick the work and see the price.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-electric transition group-hover:translate-x-1" />
            </Link>

            <Link
              to="/contact"
              className="group flex min-h-24 items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
            >
              <MessageSquareText className="h-5 w-5 shrink-0 text-electric" />
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">Discuss Your Job</strong>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Send the details, postcode and photos.
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-electric transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.012]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4 lg:px-8">
          {[
            [ShieldCheck, "£2m Public Liability"],
            [ClipboardCheck, "City & Guilds 2391"],
            [Wrench, "18th Edition"],
            [CheckCircle2, "Testing & Certification"],
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

      <section className="mx-auto max-w-7xl px-4 py-9 lg:px-8">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Electrical Services</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose what you need.</p>
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

          <Link
            to="/commercial"
            className="group grid min-h-24 grid-cols-[2.4rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 transition hover:bg-white/[0.018] lg:col-span-2 lg:px-4"
          >
            <span className="font-mono text-xs text-electric">07</span>
            <span>
              <strong className="block text-base sm:text-lg">Commercial Electrical</strong>
              <span className="mt-1 hidden text-sm text-muted-foreground sm:block">
                Testing, lighting, power, access control and refurbishment.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <ReviewPreview />

      <HomeTravelChecker />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-5 lg:px-8 lg:pb-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Our Work</h2>
            <p className="mt-1 text-sm text-muted-foreground">View genuine completed projects.</p>
          </div>
          <Link
            to="/our-work"
            className="hidden items-center gap-2 text-sm font-bold text-electric sm:inline-flex"
          >
            View projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Link
          to="/our-work/$slug"
          params={{ slug: "rowley-park-primary-academy-refurbishment" }}
          className="group block overflow-hidden rounded-md border border-white/10 bg-[#15191a]"
        >
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <strong className="text-base">Rowley Park Primary Academy</strong>
            <span className="ml-2 text-xs text-muted-foreground">Commercial refurbishment</span>
          </div>
          <img
            src="/projects/rowley-park/rowley-park-overview.webp"
            alt="Completed Sperin Services refurbishment at Rowley Park Primary Academy"
            width="1120"
            height="840"
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] max-h-[440px] w-full object-cover transition duration-500 group-hover:scale-[1.005]"
          />
        </Link>

        <Link
          to="/our-work"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-electric sm:hidden"
        >
          View projects <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
