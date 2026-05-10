import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import hero from "@/assets/svc-smart.jpg";

export const Route = createFileRoute("/services/smart-home")({
  head: () => ({
    meta: [
      { title: "Smart Home Automation — Sperin Services, West Midlands" },
      { name: "description", content: "Smart lighting, app and voice control, smart heating, security integration and future-ready wiring across Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "Smart Home Automation — Sperin Services" },
      { property: "og:description", content: "App, voice and scene-controlled homes done properly." },
      { property: "og:image", content: hero },
    ],
  }),
  component: () => (
    <ServicePage
      title="Smart Home Automation"
      heroImage={hero}
      intro="App-controlled lighting, voice control, scenes, smart heating and security integration — wired and configured cleanly so it just works. Across the West Midlands."
      included={[
        "Smart lighting and dimming",
        "App control and voice control",
        "Smart heating controls and zoning",
        "Security and camera integration",
        "Custom scenes and automations",
        "Future-ready wiring planned in during rewires",
      ]}
      whyItMatters={[
        "A well-set-up smart home is genuinely useful, not gimmicky",
        "Energy savings from smarter heating and lighting control",
        "Better security with integrated cameras and alerts",
        "Adds value and convenience to your home",
      ]}
      faqs={[
        { q: "Do I need to rewire to add smart home?", a: "Not always — many smart products work with existing wiring. For full rewires we plan smart-ready cabling so future upgrades are easy." },
        { q: "Which platforms do you work with?", a: "We work with the main platforms (Hue, Lutron, Shelly, smart heating systems, Apple Home, Google, Alexa, etc.). We'll recommend the right setup for your needs." },
        { q: "Do you cover my area?", a: "Yes — Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands." },
      ]}
    />
  ),
});
