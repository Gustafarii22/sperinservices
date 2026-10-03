import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
          "Rewires, consumer units, EICRs, EV charging, smart systems and coordinated electrical work across Birmingham and the West Midlands.",
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
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pt-18">
        <span className="eyebrow">Electrical services</span>
        <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          Electrical work planned properly.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          From testing and consumer-unit upgrades to rewires, EV charging and connected systems,
          choose the service that best matches the job.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="surface-raised group rounded-2xl p-6 transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-electric">
                Sperin Services
              </p>
              <h2 className="mt-3 text-2xl font-bold">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.short}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-electric">
                View service
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="surface mt-8 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">Not sure which service applies?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send a brief description or photographs and we can point you in the right direction.
            </p>
          </div>
          <Link to="/contact" className="button-primary shrink-0">
            Get a quote
          </Link>
        </div>
      </section>
    </>
  );
}
