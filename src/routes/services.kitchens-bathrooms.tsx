import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/kitchens-bathrooms")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/kitchens-bathrooms" }],
    meta: [
      { title: "Kitchens & Bathrooms — Electrical Services — Sperin Services" },
      {
        name: "description",
        content:
          "Electrical and building works for kitchens and bathrooms — lighting, extractor fans, sockets, tiling and building coordination. West Midlands.",
      },
      { property: "og:title", content: "Kitchens & Bathrooms — Sperin Services" },
      { property: "og:description", content: "Electrical and building works with a clean finish." },
      { property: "og:url", content: "https://sperinservices.co.uk/services/kitchens-bathrooms" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Kitchens & Bathrooms",
            description: "Electrical and coordinated building work for kitchens and bathrooms across Birmingham and the West Midlands.",
            path: "/services/kitchens-bathrooms",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Kitchens & Bathrooms", path: "/services/kitchens-bathrooms" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="Kitchens & Bathrooms"
      intro="Kitchen and bathroom electrical work planned around appliance loads, lighting, extraction, safe zones, controls and the wider refurbishment — with other trades coordinated where the project requires it."
      included={[
        "Lighting design and installation",
        "Extractor fans and ventilation",
        "Sockets and appliance circuits",
        "Electrical coordination with tiling, cabinetry and other building work",
        "First and second fix electrical",
        "Clean, considered final finish",
      ]}
      whyItMatters={[
        "Appliance circuits, lighting, extraction and accessory positions need agreeing before finishes go in",
        "Good lighting transforms how a room feels and functions",
        "Coordinated trades = a faster, tidier project",
        "Long-lasting finishes and reliable electrics",
      ]}
      faqs={[
        {
          q: "Do you handle the full project or just the electrics?",
          a: "We can undertake the electrical work and, where agreed in the quotation, coordinate wider refurbishment elements. The exact trade scope is stated clearly before work starts."
        },
        {
          q: "How long does a kitchen or bathroom take?",
          a: "It depends on strip-out, first fix, drying/finishing stages, appliance delivery and other trades. The programme is agreed from the actual project scope rather than using a generic duration."
        },
        { q: "Do you cover my area?", a: "Yes — across the West Midlands." },
      ]}
    />
  ),
});
