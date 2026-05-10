import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import hero from "@/assets/svc-consumer-unit.jpg";
import work2 from "@/assets/work-2.jpg";

export const Route = createFileRoute("/services/consumer-units")({
  head: () => ({
    meta: [
      { title: "Consumer Unit Upgrades & Fuse Box Replacements — Sperin Services" },
      { name: "description", content: "Modern consumer unit upgrades, fuse box replacements, RCBO and surge protection across Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "Consumer Unit Upgrades — Sperin Services" },
      { property: "og:description", content: "Safer modern protection with RCBOs and surge devices. West Midlands." },
      { property: "og:image", content: hero },
    ],
  }),
  component: () => (
    <ServicePage
      title="Consumer Unit Upgrades"
      heroImage={hero}
      intro="Modern consumer unit upgrades and fuse box replacements with RCBO protection, surge protection and full testing — for safer, more reliable domestic electrics across the West Midlands."
      intro2="If your fuse box is old, doesn't have RCD protection, or trips frequently, an upgrade brings your home in line with current standards (18th Edition Amendment 4) and gives you better fault protection."
      included={[
        "Consumer unit upgrades and fuse box replacements",
        "Individual RCBO protection per circuit",
        "Surge protection devices (SPD)",
        "Safer modern protection in line with current standards",
        "Full testing and certification on completion",
        "Tidy install with clear circuit labelling",
      ]}
      whyItMatters={[
        "Better fault protection — RCBOs trip individual circuits, not the whole house",
        "Surge protection helps protect sensitive electronics",
        "Improves safety and modernises older installations",
        "Often required when adding EV chargers, extensions or rewires",
      ]}
      workImages={[
        { src: hero, alt: "Modern UK consumer unit installed by Sperin Services" },
        { src: work2, alt: "Clean consumer unit installation with labelled circuits" },
      ]}
      faqs={[
        { q: "Do I need to upgrade my consumer unit?", a: "If yours is old (plastic or metal-clad without RCD protection), trips often, or you're adding new circuits like an EV charger, an upgrade is usually recommended." },
        { q: "How long does an upgrade take?", a: "Typically a single day for a straightforward swap, including testing and certification." },
        { q: "Will my power be off all day?", a: "Power is off only while we change the unit over and test. We'll plan the timing with you." },
        { q: "Do you provide certification?", a: "Yes — full electrical certification is provided on completion." },
        { q: "Do you cover my area?", a: "Yes, we cover Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands." },
      ]}
    />
  ),
});
