import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Calculator, Home } from "lucide-react";
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
        <span className="eyebrow">Services</span>
        <h1 className="display-title mt-4 max-w-4xl text-5xl sm:text-6xl">
          Find the work you need.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Choose a service for practical detail, or use one of the two simple routes below.
        </p>

        <div className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          <Link to="/pricing" className="group bg-background p-5">
            <Calculator className="h-5 w-5 text-electric" />
            <h2 className="mt-3 text-xl font-semibold">Standard listed work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Build an estimate and check travel.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-electric">
              Prices & estimate <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link to="/contact" className="group bg-background p-5">
            <Home className="h-5 w-5 text-electric" />
            <h2 className="mt-3 text-xl font-semibold">Bespoke or uncertain scope</h2>
            <p className="mt-1 text-sm text-muted-foreground">Send details and photographs.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-electric">
              Discuss a project <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="group min-h-40 bg-background p-5 transition hover:bg-[#1a1d1f]"
            >
              <h2 className="text-xl font-semibold">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.short}</p>
              <ArrowRight className="mt-5 h-4 w-4 text-electric transition group-hover:translate-x-1" />
            </Link>
          ))}
          <Link
            to="/commercial"
            className="group min-h-40 bg-background p-5 transition hover:bg-[#1a1d1f]"
          >
            <Building2 className="h-5 w-5 text-electric" />
            <h2 className="mt-3 text-xl font-semibold">Commercial Electrical</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              EICRs, remedials, lighting, power, emergency lighting, access control and
              refurbishment work.
            </p>
            <ArrowRight className="mt-5 h-4 w-4 text-electric transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
