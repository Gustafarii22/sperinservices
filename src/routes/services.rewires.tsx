import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import hero from "@/assets/svc-rewires.jpg";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";

export const Route = createFileRoute("/services/rewires")({
  head: () => ({
    meta: [
      { title: "Full & Part Rewires — Sperin Services, West Midlands" },
      { name: "description", content: "Domestic full and part rewires across Birmingham, Sutton Coldfield, Tamworth and the West Midlands. Clean planning, tidy first and second fix wiring." },
      { property: "og:title", content: "Full & Part Rewires — Sperin Services" },
      { property: "og:description", content: "Tidy domestic rewires with smart home options. West Midlands." },
      { property: "og:image", content: hero },
    ],
  }),
  component: () => (
    <ServicePage
      title="Full & Part Rewires"
      heroImage={hero}
      intro="Domestic full and part rewires planned and carried out cleanly — sockets, lighting, switches and full smart home options if needed. Serving Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands."
      intro2="Whether you need a complete rewire of an older property or a partial rewire of a kitchen, extension or upstairs, we plan the cable routes, first fix and second fix to keep disruption low and the finish neat."
      included={[
        "Full rewires for older properties",
        "Part rewires for kitchens, extensions or specific circuits",
        "First fix wiring (cables, back boxes)",
        "Second fix (sockets, switches, lighting)",
        "Smart home automation prep & install",
        "Testing and certification on completion",
      ]}
      whyItMatters={[
        "Older wiring can degrade and become unsafe over time",
        "A modern install supports today's loads — appliances, EVs, smart tech",
        "Tidy cable routes mean fewer issues and easier upgrades",
        "Proper certification protects your home and any future sale",
      ]}
      workImages={[
        { src: work1, alt: "Tidy first fix cable routing in a UK loft" },
        { src: work2, alt: "Modern consumer unit after rewire" },
        { src: work3, alt: "Clean second fix install" },
      ]}
      faqs={[
        { q: "How long does a full rewire take?", a: "A typical 3-bed home takes around 5–10 working days depending on size, access and finishes. We'll give a clear timeline up front." },
        { q: "Can the work be done while I live in the property?", a: "Often yes — we plan the work to keep essential power and lighting available where possible, and discuss any disruption in advance." },
        { q: "Do you provide certification?", a: "Yes. All electrical work is tested and certified on completion." },
        { q: "Do you cover my area?", a: "We work across Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands. Get in touch and we'll confirm." },
        { q: "Can I get a quote?", a: "Yes, free quotes — message us with your address and a brief on what you need." },
      ]}
    />
  ),
});
