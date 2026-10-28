import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2 } from "lucide-react";
import { ServiceCards } from "@/components/ServiceCards";
import { CTA } from "@/components/CTA";
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
        <h1 className="display-title mt-4 max-w-4xl text-5xl sm:text-6xl">Choose the job.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Short, practical information. Pick the service you need.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <ServiceCards />
      </section>
      <CTA />
    </>
  );
}
