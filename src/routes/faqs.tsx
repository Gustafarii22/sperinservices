import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/CTA";

const FAQS = [
  {
    q: "What information do you need to quote?",
    a: "A postcode, the type of property or premises, what is there now, what you want changed, and any timing or access constraints. Photos of the consumer unit, meter position, route or affected area are often useful.",
  },
  {
    q: "Do you handle both domestic and commercial work?",
    a: "Yes. Domestic work includes rewires, consumer units, EICRs, faults, lighting, EV charging and alterations. Commercial work includes testing, remedials, lighting, power, emergency lighting, access-control wiring, maintenance and refurbishment work.",
  },
  {
    q: "Do you carry out inspection and testing?",
    a: "Yes. Sperin Services carries out inspection, testing, fault finding and certification appropriate to the work being undertaken.",
  },
  {
    q: "Will I receive certification?",
    a: "Where the work requires electrical certification or test documentation, the appropriate paperwork is provided as part of the handover.",
  },
  {
    q: "Do you install EV chargers?",
    a: "Yes. EV charging work is assessed around the existing supply, earthing arrangement, cable route, load requirements and the charger being installed.",
  },
  {
    q: "Can you work in schools, nurseries and other occupied premises?",
    a: "Yes. Commercial work can be planned around access, occupied areas, other trades and the programme. The exact arrangements are agreed for each site.",
  },
  {
    q: "Do you undertake access control and door-entry work?",
    a: "Sperin Services can undertake the electrical power, containment and wiring associated with access-controlled doors, readers, locks, intercoms and interfaces where the system specification is clear.",
  },
  {
    q: "What areas do you cover?",
    a: "The main service area is Birmingham and the wider West Midlands, including Smethwick, Quinton, Harborne, Oldbury, Halesowen, West Bromwich, Solihull, Dudley, Walsall, Sutton Coldfield and Tamworth.",
  },
];

export const Route = createFileRoute("/faqs")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/faqs" }],
    meta: [
      { title: "Electrical FAQs | Sperin Services" },
      {
        name: "description",
        content:
          "Straight answers about electrical quotes, EICRs, certification, EV charging, commercial work, access control and coverage across Birmingham and the West Midlands.",
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
            acceptedAnswer: { "@type": "Answer", text: faq.a },
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
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 lg:px-8 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <span className="eyebrow">Useful answers</span>
            <h1 className="display-title mt-5 text-5xl sm:text-6xl">
              Questions worth answering before the job starts.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              These are practical questions about scope, access, testing and handover rather than
              generic SEO filler.
            </p>
          </div>
          <div>
            {FAQS.map((item, index) => (
              <article key={item.q} className="rule grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
                <div className="font-mono text-xs text-electric">0{index + 1}</div>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">{item.q}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.a}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
