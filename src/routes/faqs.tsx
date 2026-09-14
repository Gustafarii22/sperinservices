import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/CTA";

const FAQS = [
  {
    q: "Do you cover domestic, commercial and industrial electrical work?",
    a: "Yes. Sperin Services carries out domestic, commercial and industrial electrical work across Birmingham and the West Midlands.",
  },
  {
    q: "Do you carry out EICRs for landlords and businesses?",
    a: "Yes. We carry out EICRs for homes, rental properties, offices, shops, commercial units and other premises.",
  },
  {
    q: "Can you quote for commercial electrical work?",
    a: "Yes. We can quote for commercial electrical work including testing, remedials, lighting, power, distribution, maintenance and upgrades.",
  },
  {
    q: "Do you carry out house rewires and consumer unit upgrades?",
    a: "Yes. We carry out full and partial rewires, consumer unit upgrades, fault finding, additional sockets, lighting upgrades and domestic electrical improvements.",
  },
  {
    q: "Do you install EV chargers and smart home systems?",
    a: "Yes. We install EV chargers, smart lighting, smart heating, video doorbells, security wiring and home automation systems.",
  },
];

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "Electrical Services FAQs — Sperin Services" },
      {
        name: "description",
        content:
          "Answers to common questions about domestic, commercial and industrial electrical services from Sperin Services across Birmingham and the West Midlands.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }),
      },
    ],
  }),
  component: FAQs,
});

function FAQs() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 lg:px-8 pt-12 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" />
          Helpful information
        </div>

        <h1 className="mt-5 text-4xl sm:text-5xl font-bold">
          <span className="gradient-gold-text">Frequently Asked Questions</span>
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          Clear answers about electrical work, testing, rewires, consumer units,
          EV chargers and commercial projects across the West Midlands.
        </p>

        <div className="mt-10 grid gap-5">
          {FAQS.map((item) => (
            <article key={item.q} className="glass rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg sm:text-xl font-semibold">{item.q}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <CTA />
    </>
  );
}
