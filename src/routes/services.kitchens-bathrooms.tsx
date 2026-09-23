import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";

export const Route = createFileRoute("/services/kitchens-bathrooms")({
  head: () => ({
    meta: [
      { title: "Kitchens & Bathrooms — Electrical Services — Sperin Services" },
      {
        name: "description",
        content:
          "Electrical and building works for kitchens and bathrooms — lighting, extractor fans, sockets, tiling and building coordination. West Midlands.",
      },
      { property: "og:title", content: "Kitchens & Bathrooms — Sperin Services" },
      { property: "og:description", content: "Electrical and building works with a clean finish." },
    ],
  }),
  component: () => (
    <ServicePage
      title="Kitchens & Bathrooms"
      intro="Electrical and building works for kitchens and bathrooms — coordinated, neat and finished to a high standard. Birmingham, Sutton Coldfield, Tamworth and the West Midlands."
      included={[
        "Lighting design and installation",
        "Extractor fans and ventilation",
        "Sockets and appliance circuits",
        "Tiling and building coordination",
        "First and second fix electrical",
        "Clean, considered final finish",
      ]}
      whyItMatters={[
        "Kitchens and bathrooms benefit from proper planning of services",
        "Good lighting transforms how a room feels and functions",
        "Coordinated trades = a faster, tidier project",
        "Long-lasting finishes and reliable electrics",
      ]}
      faqs={[
        {
          q: "Do you handle the full project or just the electrics?",
          a: "Both — we handle electrical and building elements and coordinate other trades as needed.",
        },
        {
          q: "How long does a kitchen or bathroom take?",
          a: "Depends on scope. We'll provide a clear timeline before starting.",
        },
        { q: "Do you cover my area?", a: "Yes — across the West Midlands." },
      ]}
    />
  ),
});
