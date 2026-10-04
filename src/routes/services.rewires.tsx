import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/rewires")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/rewires" }],
    meta: [
      { title: "Full & Part Rewires — Sperin Services, West Midlands" },
      {
        name: "description",
        content:
          "Domestic full and part rewires across Birmingham, Sutton Coldfield, Tamworth and the West Midlands. Clean planning, tidy first and second fix wiring.",
      },
      { property: "og:title", content: "Full & Part Rewires — Sperin Services" },
      {
        property: "og:description",
        content: "Tidy domestic rewires with smart home options. West Midlands.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services/rewires" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Full & Part Rewires",
            description:
              "Domestic full and part rewires across Birmingham, Sutton Coldfield, Tamworth and the West Midlands. Clean planning, tidy first and second fix wiring.",
            path: "/services/rewires",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Full & Part Rewires", path: "/services/rewires" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="Full & Part Rewires"
      intro="Domestic full and part rewires planned and carried out cleanly — sockets, lighting, switches and full smart home options if needed. Serving Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands."
      intro2="A rewire is planned around the property layout, access, finishes, occupancy and future requirements. We agree socket and lighting positions, routes, first fix, second fix, testing and any making-good responsibilities before the programme is confirmed."
      included={[
        "Full rewires for older properties",
        "Part rewires for kitchens, extensions or specific circuits",
        "First fix wiring, routes, back boxes and new circuits",
        "Second fix sockets, switches, lighting and accessories",
        "Smart home automation prep & install",
        "Testing and certification on completion",
      ]}
      whyItMatters={[
        "Older wiring can degrade and become unsafe over time",
        "A modern install supports today's loads — appliances, EVs, smart tech",
        "Planning positions and routes before first fix reduces avoidable disruption and late changes",
        "Proper certification protects your home and any future sale",
      ]}
      faqs={[
        {
          q: "How long does a full rewire take?",
          a: "Timescale depends on property size, access, occupancy, number of points, floor and wall construction, and whether other refurbishment work is happening at the same time. We confirm a realistic programme after survey rather than promising a generic duration.",
        },
        {
          q: "Can the work be done while I live in the property?",
          a: "Sometimes, but a full rewire in an occupied home is significantly more disruptive. We discuss room access, temporary supplies, furniture, floor coverings and the daily sequence before deciding whether remaining in the property is practical.",
        },
        {
          q: "Do you provide certification?",
          a: "The new installation work is inspected and tested and the appropriate electrical certification is provided on completion. Any required domestic Building Regulations notification is dealt with through the appropriate route.",
        },
        {
          q: "Do you cover my area?",
          a: "We work across Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands. Get in touch and we'll confirm.",
        },
        {
          q: "Can I get a quote?",
          a: "Yes, free quotes — message us with your address and a brief on what you need.",
        },
      ]}
    />
  ),
});
