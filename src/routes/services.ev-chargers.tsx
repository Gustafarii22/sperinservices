import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/ev-chargers")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/services/ev-chargers" }],
    meta: [
      { title: "Home EV Charger Installation — Sperin Services, West Midlands" },
      {
        name: "description",
        content:
          "Smart home EV charger installations with tidy cable routes and load considerations. Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
      },
      { property: "og:title", content: "Home EV Chargers — Sperin Services" },
      {
        property: "og:description",
        content: "Tidy, smart EV charger installs for domestic properties.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/services/ev-chargers" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "EV Chargers",
            description:
              "Smart home EV charger installations with tidy cable routes and load considerations. Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
            path: "/services/ev-chargers",
          }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "EV Chargers", path: "/services/ev-chargers" },
          ]),
        ),
      },
    ],
  }),
  component: () => (
    <ServicePage
      title="EV Chargers"
      intro="EV charger installations planned around the existing supply, earthing arrangement, load, charger position and cable route — with testing, certification and DNO considerations handled as part of the job."
      included={[
        "Home EV charger installation",
        "Tidy cable routing and trunking",
        "Incoming supply, earthing and load assessment",
        "PEN protection, load management and CT requirements where applicable",
        "Cable route, mounting position and DNO requirements",
        "Testing and certification",
      ]}
      whyItMatters={[
        "A dedicated home charger is faster and cheaper than public charging",
        "Proper load assessment avoids tripping issues and supply problems",
        "Smart features can schedule charging for cheaper tariffs",
        "Tidy installs look better and last longer",
      ]}
      faqs={[
        {
          q: "How long does an EV charger install take?",
          a: "Most domestic installs are completed in a single day.",
        },
        {
          q: "Will my supply handle a charger?",
          a: "We check the incoming supply, main fuse where known, earthing arrangement and existing demand. Where necessary we consider load management, CT monitoring or a DNO application before installation.",
        },
        {
          q: "Do you cover my area?",
          a: "Yes — Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands.",
        },
        {
          q: "Can I get a quote?",
          a: "Yes. Send the postcode, charger make/model if chosen, photographs of the meter and consumer unit, proposed charger position and the likely cable route. That usually gives us enough information to identify what needs checking next.",
        },
      ]}
    />
  ),
});
