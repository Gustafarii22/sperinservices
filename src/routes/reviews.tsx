import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { CTA } from "@/components/CTA";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Feedback | Sperin Services" },
      { name: "robots", content: "noindex,follow" },
      {
        name: "description",
        content: "Customer feedback and trust information for Sperin Services electrical work across Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "Customer Feedback | Sperin Services" },
      { property: "og:description", content: "Sperin Services is moving this page to independently verifiable customer feedback rather than anonymous placeholder testimonials." },
    ],
  }),
  component: Reviews,
});

function Reviews() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pb-16 lg:pt-18">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <span className="eyebrow">Customer feedback</span>
            <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">Customer feedback should be verifiable.</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Customer feedback will only be published here when it can be traced to a genuine customer or an independent review source. Until then, the site relies on stated qualifications, scope and process rather than anonymous testimonial cards.
            </p>
          </div>

          <aside className="surface-raised rounded-2xl p-6 sm:p-8">
            <MessageSquareQuote className="h-7 w-7 text-electric" />
            <h2 className="mt-6 text-3xl font-bold">What counts as useful proof.</h2>
            <div className="mt-6 space-y-4">
              {[
                "A genuine review connected to a real customer or platform",
                "A date and location where it is appropriate to publish them",
                "A relevant project reference rather than generic praise",
                "No overall rating displayed until the source is verifiable",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/88">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" /> {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ShieldCheck, "Qualifications", "City & Guilds electrical training, inspection and testing qualification, and 18th Edition knowledge can be stated directly without dressing them up as reviews."],
            [CheckCircle2, "Process", "Clear scope, appropriate testing and proper handover are stronger trust signals than six anonymous five-star quotes."],
            [MessageSquareQuote, "Verified feedback", "When live review sources are connected, this page can show the original source and date rather than retyping praise into a website card."],
          ].map(([Icon, title, text]) => {
            const IconComponent = Icon as typeof ShieldCheck;
            return (
              <article key={String(title)} className="surface rounded-2xl p-6">
                <IconComponent className="h-5 w-5 text-electric" />
                <h2 className="mt-5 text-2xl font-bold">{String(title)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{String(text)}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          Looking for project-specific reassurance before booking? <Link to="/contact" className="inline-flex items-center gap-1 font-bold text-electric">Ask about the type of work you need <ArrowRight className="h-4 w-4" /></Link>.
        </div>
      </section>

      <CTA title="Judge the job on the details, not a badge." subtitle="Tell us what you need done and ask anything you want to know about the process, testing, certification or previous experience with that type of work." />
    </>
  );
}
