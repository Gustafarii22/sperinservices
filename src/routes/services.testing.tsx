import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import hero from "@/assets/svc-testing.jpg";

export const Route = createFileRoute("/services/testing")({
  head: () => ({
    meta: [
      { title: "Electrical Testing & Certification (EICR) — Sperin Services" },
      { name: "description", content: "Domestic electrical testing, EICR-style inspection and certification, fault finding and safety checks across the West Midlands." },
      { property: "og:title", content: "Testing & Certification — Sperin Services" },
      { property: "og:description", content: "Inspection, certification and fault finding for domestic properties." },
      { property: "og:image", content: hero },
    ],
  }),
  component: () => (
    <ServicePage
      title="Testing & Certification"
      heroImage={hero}
      intro="Inspection, certification, fault finding and safety checks for domestic properties — across Birmingham, Sutton Coldfield, Tamworth and the West Midlands."
      included={[
        "Electrical testing of domestic installations",
        "Inspection and certification (EICR-style reports)",
        "Fault finding and diagnosis",
        "Safety checks before purchase or letting",
        "Certification for new circuits and alterations",
        "Clear written reports and recommendations",
      ]}
      whyItMatters={[
        "Identifies hidden faults before they become safety issues",
        "Often required for landlords and property sales",
        "Peace of mind for older properties or after DIY work",
        "Helps prioritise any remedial work required",
      ]}
      faqs={[
        { q: "How long does a test take?", a: "A typical domestic property is around half a day. Larger or more complex installations may take longer." },
        { q: "Will my power be off?", a: "Power is interrupted briefly during certain tests. We'll plan around your day where possible." },
        { q: "Do you provide a written report?", a: "Yes — a clear report with any observations and recommendations." },
        { q: "Do you cover my area?", a: "Yes — across the West Midlands." },
      ]}
    />
  ),
});
