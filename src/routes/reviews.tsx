import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/CTA";
import { Star, Quote } from "lucide-react";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Sperin Services Electrical & Building" },
      { name: "description", content: "Read reviews from homeowners across Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "Customer Reviews — Sperin Services" },
      { property: "og:description", content: "Trusted by homeowners across the West Midlands for premium electrical and building work." },
    ],
  }),
  component: Reviews,
});

const REVIEWS = [
  {
    name: "James W.",
    location: "Sutton Coldfield",
    text: "Outstanding work on our full rewire. Clean, tidy and explained everything along the way. Highly recommend.",
  },
  {
    name: "Priya S.",
    location: "Birmingham",
    text: "Installed our EV charger and a new consumer unit. Premium finish, fair price and turned up exactly when promised.",
  },
  {
    name: "Mark T.",
    location: "Tamworth",
    text: "Smart lighting throughout the house — the result is stunning. True craftsmen with a real eye for detail.",
  },
  {
    name: "Helen R.",
    location: "Lichfield",
    text: "Professional, polite and meticulous. The kitchen electrical work is flawless. Would not hesitate to use again.",
  },
  {
    name: "David K.",
    location: "Solihull",
    text: "EICR and full report came back the next day. Genuine, knowledgeable and friendly — exactly what you want.",
  },
  {
    name: "Sarah L.",
    location: "Walsall",
    text: "Bathroom rewire and downlights — the finish is luxury level. Worth every penny. Thank you Sperin Services.",
  },
];

function Reviews() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 lg:px-8 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-electric">
          <span className="h-1.5 w-1.5 rounded-full bg-electric glow-electric" /> Customer Reviews
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold">
          <span className="gradient-electric-text">Trusted across the West Midlands</span>
        </h1>
        <p className="mt-5 text-muted-foreground text-lg">
          Real feedback from homeowners we've worked with — clean workmanship, honest service, every time.
        </p>
        <div className="mt-6 flex items-center justify-center gap-1 text-electric">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">Rated 5/5 by our customers</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 pb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <article
            key={i}
            className="relative rounded-2xl glass p-6 electric-border-glow"
          >
            <Quote className="h-6 w-6 text-electric/70 mb-3" />
            <p className="text-sm text-foreground/90 leading-relaxed">"{r.text}"</p>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.location}</div>
              </div>
              <div className="flex gap-0.5 text-electric">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <CTA title="Ready to join our happy customers?" />
    </>
  );
}
