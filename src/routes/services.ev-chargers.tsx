import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import hero from "@/assets/svc-ev.jpg";
import work3 from "@/assets/work-3.jpg";

export const Route = createFileRoute("/services/ev-chargers")({
  head: () => ({
    meta: [
      { title: "Home EV Charger Installation — Sperin Services, West Midlands" },
      { name: "description", content: "Smart home EV charger installations with tidy cable routes and load considerations. Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "Home EV Chargers — Sperin Services" },
      { property: "og:description", content: "Tidy, smart EV charger installs for domestic properties." },
      { property: "og:image", content: hero },
    ],
  }),
  component: () => (
    <ServicePage
      title="EV Chargers"
      heroImage={hero}
      intro="Home EV charger installations done properly — neat cable routes, smart charging features and proper load considerations for your property. Across Birmingham, Sutton Coldfield, Tamworth and the West Midlands."
      included={[
        "Home EV charger installation",
        "Tidy cable routing and trunking",
        "Load considerations and supply checks",
        "Smart charging features and app setup",
        "Domestic properties, indoor and outdoor mounting",
        "Testing and certification",
      ]}
      whyItMatters={[
        "A dedicated home charger is faster and cheaper than public charging",
        "Proper load assessment avoids tripping issues and supply problems",
        "Smart features can schedule charging for cheaper tariffs",
        "Tidy installs look better and last longer",
      ]}
      workImages={[
        { src: work3, alt: "Clean EV charger install on a UK home" },
        { src: hero, alt: "EV charger mounted on brick wall at dusk" },
      ]}
      faqs={[
        { q: "How long does an EV charger install take?", a: "Most domestic installs are completed in a single day." },
        { q: "Will my supply handle a charger?", a: "We assess your incoming supply and existing loads before quoting. If load management is needed, we'll specify a unit that supports it." },
        { q: "Do you cover my area?", a: "Yes — Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands." },
        { q: "Can I get a quote?", a: "Yes, free quotes. Send us your address, the charger you'd like (or ask us to recommend), and a couple of photos of your fuse board and proposed location." },
      ]}
    />
  ),
});
