import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { serviceJsonLd, breadcrumbJsonLd } from "@/lib/seo";
const path = "/services/data-network-cabling";
const title = "Data & Network Cabling";
const description =
  "Data and network cabling for homes and businesses in Birmingham, Smethwick, Bearwood and the West Midlands. Planned cable routes, data outlets and tidy terminations.";
export const Route = createFileRoute("/services/data-network-cabling")({
  head: () => ({
    meta: [
      { title: `${title} Birmingham | Sperin Services` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Sperin Services` },
      { property: "og:description", content: description },
      { property: "og:url", content: `https://sperinservices.co.uk${path}` },
    ],
    links: [{ rel: "canonical", href: `https://sperinservices.co.uk${path}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(serviceJsonLd({ name: title, description, path })),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: title, path },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title={title}
      intro="Reliable connections start with well-planned cabling. Data outlets and wired network installations for home offices, renovations and commercial premises across Birmingham and the West Midlands."
      intro2="Tell us where connections are needed and what equipment you use. We agree the cable specification, routes, outlet positions and testing requirements before quotation."
      included={[
        "New data outlets for desks, home offices and working areas",
        "Structured copper cabling with suitable routes and containment",
        "Termination and labelling of outlets and patch connections",
        "Cabling for access points, connected equipment and smart systems",
        "Coordination with electrical installations and refurbishment",
        "Testing and handover to the agreed scope",
      ]}
      whyItMatters={[
        "A wired connection can reduce reliance on wireless coverage for fixed equipment.",
        "Planning routes and outlet positions helps avoid surface cabling added as an afterthought.",
        "Clear labels make future changes and fault finding easier.",
        "The quotation confirms cabling, equipment supply and testing so the scope is clear.",
      ]}
      faqs={[
        {
          q: "Can you cable my home office?",
          a: "Yes. Send the router location, proposed desk position and photographs of the route. We will assess access and the most practical option.",
        },
        {
          q: "Do I need Cat6 or another cable specification?",
          a: "The right specification depends on the distances, environment and intended equipment. We agree this after checking your requirements rather than promising a speed from cable type alone.",
        },
        {
          q: "Are routers and Wi-Fi access points included?",
          a: "Equipment supply and configuration are agreed separately in the quotation. Please tell us what you already have.",
        },
        {
          q: "Can this be done during a rewire or refurbishment?",
          a: "Yes. Planning data and electrical routes together is particularly useful while floors, walls or ceilings are accessible.",
        },
      ]}
    />
  ),
});
