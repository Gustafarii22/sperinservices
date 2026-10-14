import { createFileRoute, Link } from "@tanstack/react-router";
import { ServicePage } from "@/components/ServicePage";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

const path = "/services/data-network-cabling";
const description =
  "Cat6 and Cat6A cabling across Birmingham, Smethwick, Sutton Coldfield, Tamworth and the West Midlands. Hardwired data points, Wi-Fi access point cabling, smart homes, CCTV and gate intercom connections.";
export const Route = createFileRoute("/services/data-network-cabling")({
  head: () => ({
    links: [{ rel: "canonical", href: `https://sperinservices.co.uk${path}` }],
    meta: [
      { title: "Cat6 Data & Network Cabling Birmingham | Sperin Services" },
      { name: "description", content: description },
      { property: "og:title", content: "Wi-Fi struggling? Get connected with Sperin Services" },
      { property: "og:description", content: description },
      { property: "og:url", content: `https://sperinservices.co.uk${path}` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({ name: "Data & Network Cabling", description, path }),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Data & Network Cabling", path },
          ]),
        ),
      },
    ],
  }),
  component: DataCabling,
});

function DataCabling() {
  return (
    <>
      <ServicePage
        title="Data & Network Cabling"
        intro="Wi-Fi struggling to reach the room where you need it? Stop working around dropouts, buffering and unreliable connections. A neatly installed Cat6 point gives your home office, TV or games console a direct wired connection — so you can get on with working, watching and playing."
        intro2="From one hardwired point to a connected home or commercial premises, we plan the route, install and terminate the cabling, label the points and carry out basic wire-map checks. Covering Birmingham, Smethwick, Sutton Coldfield, Tamworth and the wider West Midlands."
        included={[
          "Hardwired Cat6 data points for home offices, desktop computers, smart TVs and games consoles",
          "Cat6 and Cat6A cable runs, RJ45 outlets, patch panels and network cabinets for homes, offices, shops and schools",
          "Wired connections for Wi-Fi access points and compatible mesh systems — put coverage where it is needed",
          "Smart-home infrastructure for compatible hubs, controllers and connected equipment",
          "Data cabling for compatible gate automation controllers, IP video intercoms and access-control systems",
          "PoE cabling for compatible CCTV cameras, Wi-Fi access points and VoIP phones, using suitable power equipment",
          "Network connections for printers, network storage and compatible audio/video equipment using the correct interfaces",
          "Cable identification, labelling, termination repairs and basic wire-map fault finding",
          "Planned links to garden offices and outbuildings, with copper or fibre suitability assessed for the route",
        ]}
        whyItMatters={[
          "Make the most of the broadband you already pay for. A wired connection can avoid weak Wi-Fi and wireless interference; it cannot increase your provider’s incoming broadband speed.",
          "Give important devices a dependable connection. Reduce reliance on a shared wireless signal for video meetings, streaming and gaming; performance still depends on your service and equipment.",
          "Improve Wi-Fi where it matters. A wired access point can bring coverage closer to upstairs rooms, extensions and workspaces without relying on a weak wireless link back to the router.",
          "Plan once and avoid repeat disruption. Rewiring, renovating or fitting a kitchen? Put data points in while access is easier, with sensible spare capacity for future devices.",
          "A tidy installation you can use and understand: agreed cable routes, labelled points and a clear explanation of what connects where.",
        ]}
        faqs={[
          {
            q: "Will Cat6 fix slow internet?",
            a: "If weak Wi-Fi or wireless interference is the bottleneck, a wired point can improve the connection to your device. It will not fix a slow incoming broadband service or a provider fault. Tell us where the problem happens and what you want to connect so we can recommend an appropriate approach.",
          },
          {
            q: "Can I keep using Wi-Fi?",
            a: "Yes. Use wired connections for fixed devices and Wi-Fi for phones and tablets. We can also install data cabling for a suitable Wi-Fi access point or compatible mesh unit. Equipment supply and configuration are agreed as part of the quotation.",
          },
          {
            q: "Can Cat6 be used for electric gates, CCTV and smart homes?",
            a: "Yes, where the equipment supports it: for example IP gate intercoms, network-connected controllers and compatible PoE cameras. The cable and connection must match the manufacturer’s requirements. Cat6 does not replace the power supply for a gate motor. Gate automation, safety devices and commissioning are separately scoped; this service covers the agreed cabling and connections.",
          },
          {
            q: "Can you connect a detached garage or garden office?",
            a: "We assess the distance, external route and building arrangement first. Outdoor copper may be suitable in some cases; fibre may be the better choice between buildings. Groundworks, containment, power and equipment are quoted separately where needed.",
          },
          {
            q: "Is the installation fully Cat6 certified?",
            a: "Our standard offer includes basic wire-map and continuity checks, identification and labelling. These are not full Cat6/Cat6A performance certification. If your project needs certification or a manufacturer-backed system warranty, tell us before booking so the required testing and scope can be agreed.",
          },
          {
            q: "How much does a Cat6 data point cost?",
            a: "We quote for your property rather than advertise a price that assumes an easy cable route. The number of points, run lengths, access, containment and equipment affect the cost. Add your requirements in the job calculator and send photos of your router and the rooms you want connected. Network work is assessed separately and excluded from the priced subtotal until quoted. No VAT is added.",
          },
          {
            q: "Will you need to chase walls or lift floors?",
            a: "Not always. We discuss available routes and the finish you want, including discreet surface containment where suitable. Concealed routes, access work and any making good are agreed before work starts.",
          },
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="surface p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Which room would you like to get connected?</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Send your postcode, a photo of the router and the locations you want connected. We’ll
            discuss the route and give you a clear quotation before work starts.
          </p>
          <Link to="/pricing" hash="calculator" className="button-primary mt-5">
            Add Cat6 to your job →
          </Link>
        </div>
      </section>
    </>
  );
}
