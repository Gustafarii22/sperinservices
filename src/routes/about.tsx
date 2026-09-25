import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Phone } from "lucide-react";
import { CTA } from "@/components/CTA";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/about" }],
    meta: [
      { title: "About Sperin Services | Electrical Contractor, West Midlands" },
      {
        name: "description",
        content:
          "Meet the electrician behind Sperin Services. In the electrical industry since 2003 and trading independently since 2010 across Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "About Sperin Services" },
      {
        property: "og:description",
        content:
          "A straightforward electrical business built on long-term trade experience, inspection and testing capability, and clear project delivery.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pb-16 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <span className="eyebrow">Gus Sperin · Your electrician</span>
            <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Experience on the tools,
              <br />
              <span className="text-electric">one point of contact.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              I’m Gus, the electrician behind Sperin Services. I started in the electrical industry
              in {SITE.industrySince} and have traded independently since {SITE.founded}. The aim is
              simple: understand the job properly, give clear advice, carry out the work carefully
              and leave the installation documented and tested as required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="button-primary">
                Talk about a project <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone}`} className="button-secondary">
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          <aside className="surface-raised technical-grid rounded-2xl p-6 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
              Trade record
            </div>
            <dl className="mt-7 space-y-0">
              {[
                ["Electrical industry", `Since ${SITE.industrySince}`],
                ["Sperin Services", `Trading since ${SITE.founded}`],
                ["Inspection & testing", "City & Guilds 2391"],
                ["Electrical training", "City & Guilds 2360 Parts 1 & 2"],
                ["Wiring regulations", "18th Edition"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="rule grid grid-cols-[1fr_auto] gap-5 py-4 first:border-t-0 first:pt-0"
                >
                  <dt className="text-sm text-muted-foreground">{term}</dt>
                  <dd className="text-right text-sm font-semibold text-foreground/95">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <span className="eyebrow">How Sperin works</span>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
              Experience matters most when something is not straightforward.
            </h2>
          </div>
          <div className="space-y-0">
            {[
              [
                "Survey before assumptions",
                "Existing installations are not all the same. Access, supply, earthing, circuit condition and the intended finish can all change the right solution.",
              ],
              [
                "Design, install and test",
                "The work is considered as one job rather than disconnected stages. That makes it easier to spot issues before they become expensive changes.",
              ],
              [
                "Domestic and commercial",
                "Work ranges from homes and landlords to schools, offices, shops and small commercial premises, with the approach adjusted to suit the environment.",
              ],
              [
                "Straight communication",
                "If the scope changes, the reason and options should be clear before additional work is simply added to the bill.",
              ],
            ].map(([title, text], index) => (
              <div key={title} className="rule grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
                <div className="font-mono text-xs text-electric">0{index + 1}</div>
                <div>
                  <h3 className="text-2xl font-bold">{title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="surface rounded-2xl p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <span className="eyebrow">What you can expect</span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Specific standards, not generic promises.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "A clear scope before work begins where the job allows it",
                "Testing and appropriate documentation on completion",
                "Practical advice without unnecessary jargon",
                "Care around occupied homes and working premises",
                "Options explained when there is more than one sensible route",
                "Qualifications and credentials stated accurately, without overclaiming",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/88"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA
        title="Got a job in mind? Start with the details."
        subtitle="Send the postcode and a short description of the work. If photos will help, WhatsApp is usually the quickest way to give us the full picture."
      />
    </>
  );
}
