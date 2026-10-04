import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/consumer-units")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/consumer-units" }],
    meta: [
      { title: "Consumer Unit Upgrades & Fuse Box Replacements — Sperin Services" },
      {
        name: "description",
        content:
          "Modern consumer unit upgrades, fuse box replacements, RCBO and surge protection across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
      },
      { property: "og:title", content: "Consumer Unit Upgrades — Sperin Services" },
      {
        property: "og:description",
        content: "Safer modern protection with RCBOs and surge devices. West Midlands.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services/consumer-units" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Consumer Unit Upgrades",
            description: "Modern consumer unit upgrades, fuse box replacements, RCBO and surge protection across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
            path: "/services/consumer-units",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Consumer Unit Upgrades", path: "/services/consumer-units" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="Consumer Unit Upgrades"
      intro="Modern consumer unit upgrades and fuse box replacements with RCBO protection, surge protection and full testing — for safer, more reliable domestic electrics across the West Midlands."
      intro2="A new consumer unit can improve circuit protection, but changing the board does not make every part of an existing installation compliant. The replacement work is designed, installed and tested to the applicable current requirements; existing defects, bonding issues or remedial work elsewhere are identified separately."
      included={[
        "Consumer unit upgrades and fuse box replacements",
        "Individual RCBO protection per circuit",
        "Surge protection devices (SPD)",
        "New consumer-unit work designed, installed and tested to the applicable current requirements",
        "Full testing and certification on completion",
        "Tidy install with clear circuit labelling",
      ]}
      whyItMatters={[
        "Better fault protection — RCBOs trip individual circuits, not the whole house",
        "Surge protection helps protect sensitive electronics",
        "Pre-change checks can expose existing faults or bonding issues that need separate remedial work",
        "Often required when adding EV chargers, extensions or rewires",
      ]}
      faqs={[
        {
          q: "Do I need to upgrade my consumer unit?",
          a: "Age alone does not decide it. We look at the existing protection, condition, RCD/RCBO provision, earthing and bonding, planned new circuits and any defects before recommending replacement.",
        },
        {
          q: "How long does an upgrade take?",
          a: "Typically a single day for a straightforward swap, including testing and certification.",
        },
        {
          q: "Will my power be off all day?",
          a: "Power is off only while we change the unit over and test. We'll plan the timing with you.",
        },
        {
          q: "Do you provide certification?",
          a: "Yes. The replacement work is inspected and tested and the appropriate electrical certification is provided. Where domestic Building Regulations notification is required, the appropriate notification route is used."
        },
        {
          q: "Do you cover my area?",
          a: "Yes, we cover Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands.",
        },
      ]}
    />
  ),
});
