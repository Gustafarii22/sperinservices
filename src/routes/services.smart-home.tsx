import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/smart-home")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/smart-home" }],
    meta: [
      { title: "Smart Home Automation — Sperin Services, West Midlands" },
      {
        name: "description",
        content:
          "Smart lighting, app and voice control, smart heating, security integration and future-ready wiring across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
      },
      { property: "og:title", content: "Smart Home Automation — Sperin Services" },
      {
        property: "og:description",
        content: "App, voice and scene-controlled homes done properly.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services/smart-home" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Smart Home Automation",
            description:
              "Smart lighting, app and voice control, smart heating, security integration and future-ready wiring across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
            path: "/services/smart-home",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Smart Home Automation", path: "/services/smart-home" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="Smart Home Automation"
      intro="Smart lighting, controls, heating interfaces, security wiring and future-ready cabling planned around the electrical installation — with simple controls rather than unnecessary technology for its own sake."
      included={[
        "Smart lighting and dimming",
        "App, scene and voice control where suitable",
        "Smart heating controls and zoning",
        "Security, door-entry and camera cabling/integration where specified",
        "Custom scenes and automations",
        "Future-ready wiring planned in during rewires",
      ]}
      whyItMatters={[
        "The useful functions are agreed first so the system solves a real problem rather than adding complexity",
        "Energy savings from smarter heating and lighting control",
        "Better security with integrated cameras and alerts",
        "Adds value and convenience to your home",
      ]}
      faqs={[
        {
          q: "Do I need to rewire to add smart home?",
          a: "Not always — many smart products work with existing wiring. For full rewires we plan smart-ready cabling so future upgrades are easy.",
        },
        {
          q: "Which platforms do you work with?",
          a: "The right platform depends on the job, existing wiring and what needs controlling. We can work with suitable mainstream lighting, control, heating and connected-home products, but we choose the system around the required function rather than promising every ecosystem.",
        },
        {
          q: "Do you cover my area?",
          a: "Yes — Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands.",
        },
      ]}
    />
  ),
});
