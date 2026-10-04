import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2 } from "lucide-react";
import { SERVICES } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services" }],
    meta: [
      { title: "Electrical Services | Sperin Services" },
      {
        name: "description",
        content:
          "Electrical services for homes, landlords and commercial premises across Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "Electrical Services | Sperin Services" },
      {
        property: "og:description",
        content:
          "Rewires, consumer units, EICRs, EV charging, smart systems and commercial electrical work across Birmingham and the West Midlands.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ),
      },
    ],
  }),
  component: ServicesIndex,
});

function ServicesIndex() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-7 pt-8 lg:px-8 lg:pt-12">
        <span className="eyebrow">Electrical services</span>
        <h1 className="display-title mt-4 max-w-4xl text-5xl sm:text-6xl">
          Choose the job.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Short, practical information. Pick the service you need.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="border-t border-white/10">
          {SERVICES.map((service, index) => (
            <Link
              key={service.slug}
              to={service.path}
              className="group grid min-h-24 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 transition hover:bg-white/[0.018] sm:px-3"
            >
              <span className="font-mono text-xs text-electric">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong className="block text-lg sm:text-xl">{service.title}</strong>
                <span className="mt-1 block text-sm text-muted-foreground">{service.short}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>

        <Link
          to="/commercial"
          className="group mt-4 flex min-h-20 items-center gap-4 border border-electric/20 bg-electric/[0.035] px-4 py-4 transition hover:bg-electric/[0.06] sm:px-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-electric/10 text-electric">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-lg">Commercial Electrical</strong>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Schools, offices, shops and commercial premises.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-electric transition group-hover:translate-x-1" />
        </Link>
      </section>
    </>
  );
}
