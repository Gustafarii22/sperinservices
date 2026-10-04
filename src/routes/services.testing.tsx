import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/testing")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/testing" }],
    meta: [
      { title: "Electrical Installation Condition Reports (EICRs) | Sperin Services" },
      {
        name: "description",
        content:
          "Electrical Installation Condition Reports (EICRs), inspection, testing, fault finding and certification across Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "Testing & Certification — Sperin Services" },
      {
        property: "og:description",
        content: "Inspection, certification and fault finding for domestic properties.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services/testing" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Testing & Certification",
            description: "Electrical Installation Condition Reports (EICRs), inspection, testing, fault finding and certification across Birmingham and the West Midlands.",
            path: "/services/testing",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Testing & Certification", path: "/services/testing" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="Electrical Installation Condition Reports (EICRs)"
      intro="Electrical Installation Condition Reports (EICRs), inspection, testing, fault finding and certification for homes, landlords and small commercial premises across the West Midlands."
      included={[
        "Electrical testing of domestic installations",
        "Electrical Installation Condition Reports (EICRs)" ,
        "Fault finding and diagnosis",
        "Safety checks before purchase or letting",
        "Certification for new circuits and alterations",
        "Clear written reports and recommendations",
      ]}
      whyItMatters={[
        "Identifies hidden faults before they become safety issues",
        "Useful for landlords, property purchases, older installations and planned remedial work",
        "Peace of mind for older properties or after DIY work",
        "Helps prioritise any remedial work required",
      ]}
      faqs={[
        {
          q: "How long does a test take?",
          a: "It depends on the number of circuits, access, installation size and what is found. A small straightforward property may take a few hours; larger or more complex installations take longer. The scope is agreed before the inspection."
        },
        {
          q: "Will my power be off?",
          a: "Power is interrupted briefly during certain tests. We'll plan around your day where possible.",
        },
        {
          q: "Do you provide a written report?",
          a: "Yes. For an EICR you receive an Electrical Installation Condition Report with observations and classification codes where applicable, plus clear recommendations on the next step."
        },
        { q: "Do you cover my area?", a: "Yes — across the West Midlands." },
      ]}
    />
  ),
});
