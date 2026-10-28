import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Phone, ClipboardCheck, Wrench, UserRound, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";
import { electricianJsonLd } from "@/lib/seo";
import { ReviewPreview } from "@/components/ReviewPreview";
import { HomeTravelChecker } from "@/components/HomeTravelChecker";
import { ServiceCards } from "@/components/ServiceCards";
import { HowItWorks } from "@/components/HowItWorks";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Electrician Birmingham & West Midlands | Sperin Services" },
      {
        name: "description",
        content:
          "Domestic and commercial electrician across Birmingham and the West Midlands. Rewires, consumer units, EICRs, EV charging, lighting, fault finding and commercial electrical work.",
      },
      {
        property: "og:title",
        content: "Sperin Services | Electrician Birmingham & West Midlands",
      },
      {
        property: "og:description",
        content:
          "Domestic and commercial electrical work with clear pricing, inspection, testing and one point of contact.",
      },
      { property: "og:url", content: SITE.url },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(electricianJsonLd()),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <section className="premium-hero mx-auto max-w-7xl px-4 lg:px-8">
        <div>
          <span className="eyebrow">Independent electrician · West Midlands</span>
          <h1>
            Good electrical work.
            <br />
            <span className="text-electric">Made straightforward.</span>
          </h1>
          <p className="hero-lead">
            Electrical installations, EICRs, rewires and repairs for homes and businesses across
            Birmingham and the West Midlands. Speak directly with Gus, your electrician.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/contact" className="button-primary">
              Get a Quote <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="button-secondary">
              Estimate your job
            </Link>
          </div>
          <div className="hero-contact">
            <a href={`tel:${SITE.phone}`}>
              <Phone size={17} />
              {SITE.phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi Gus, I’d like a quote for electrical work. My postcode is: ")}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              WhatsApp your photos
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Industry experience since {SITE.industrySince} · Independent since {SITE.founded}
          </p>
        </div>
        <figure className="hero-project">
          <img
            src="/projects/rowley-park/rowley-park-overview.webp"
            alt="Completed lighting and electrical installation at Rowley Park Primary Academy"
            width="1120"
            height="840"
            fetchPriority="high"
            decoding="async"
          />
          <figcaption>
            <span>Our work, in the real world</span>
            <Link
              to="/our-work/$slug"
              params={{ slug: "rowley-park-primary-academy-refurbishment" }}
            >
              Rowley Park Primary Academy <ArrowRight size={17} />
            </Link>
          </figcaption>
        </figure>
      </section>
      <div className="border-y border-border bg-muted/50">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3 lg:px-8">
          {[
            { icon: UserRound, title: "One point of contact", text: "Deal directly with Gus" },
            { icon: Wrench, title: "City & Guilds 2360", text: "Parts 1 & 2" },
            { icon: ClipboardCheck, title: "City & Guilds 2391", text: "Inspection & testing" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="text-electric" size={23} />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <section className="section-pad mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">What can we help with?</span>
            <h2 className="mt-3 text-3xl sm:text-4xl">Electrical services</h2>
          </div>
          <Link to="/services" className="card-link">
            All services <ArrowRight size={16} />
          </Link>
        </div>
        <ServiceCards />
      </section>
      <HowItWorks />
      <section className="section-pad mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">A closer look</span>
            <h2 className="mt-3 text-3xl sm:text-4xl">Care in every detail.</h2>
          </div>
          <Link to="/our-work" className="card-link">
            Explore our work <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { src: "board", title: "Distribution & circuit protection" },
            { src: "kitchen", title: "Kitchen electrical installation" },
            { src: "access-control", title: "Access control & door release" },
          ].map((p) => (
            <Link
              key={p.src}
              to="/our-work/$slug"
              params={{ slug: "rowley-park-primary-academy-refurbishment" }}
              className="project-tile"
            >
              <img
                src={`/projects/rowley-park/rowley-park-${p.src}.webp`}
                alt={`${p.title} at Rowley Park Primary Academy`}
                width="900"
                height="675"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>{p.title}</h3>
                <p>Rowley Park Primary Academy</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <ReviewPreview />
      <HomeTravelChecker />
      <FAQ
        items={[
          {
            q: "Can I get a price before booking?",
            a: "Yes. Use the calculator for an indicative estimate or send your job details. A fixed quotation follows assessment; some work needs a site survey.",
          },
          {
            q: "Can I send photographs on WhatsApp?",
            a: "Yes. Send your postcode, a short description and photos of the relevant fittings or area. Only photograph what is safely accessible; do not remove electrical covers.",
          },
          {
            q: "Will I receive a certificate?",
            a: "We inspect and test electrical installation work and provide the appropriate certification and handover information where applicable. EICRs report on the condition of an existing installation.",
          },
        ]}
      />
      <CTA
        title="Let’s talk about your job."
        subtitle="A small repair or a bigger project — send the details and we’ll agree the next step."
      />
    </>
  );
}
