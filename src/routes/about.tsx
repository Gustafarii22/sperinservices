import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/CTA";
import { ShieldCheck, Sparkles, MapPin, Wrench, Users, Star } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Sperin Services — Domestic Electrical & Building, West Midlands" },
      { name: "description", content: "Sperin Services are domestic electrical and building specialists serving Birmingham, Sutton Coldfield, Tamworth and the West Midlands." },
      { property: "og:title", content: "About Sperin Services" },
      { property: "og:description", content: "Local, reliable, premium domestic electrical and building services." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 lg:px-8 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" /> About Us
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold">
          <span className="gradient-gold-text">Built on craft and trust</span>
        </h1>
        <p className="mt-5 text-muted-foreground text-lg">
          Sperin Services are domestic electrical and building specialists. We focus on
          clean workmanship, clear communication and a finish you'll be proud of —
          across Birmingham, Sutton Coldfield, Tamworth and the wider West Midlands.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { i: ShieldCheck, t: "Fully qualified", d: "Trained, experienced and continually developing." },
          { i: Sparkles, t: "Clean workmanship", d: "Tidy installs and respect for your home." },
          { i: Wrench, t: "Domestic specialists", d: "Focused on homes, not commercial." },
          { i: MapPin, t: "Local team", d: "Birmingham, Sutton Coldfield, Tamworth and surrounding." },
          { i: Users, t: "Clear communication", d: "Honest updates, no jargon." },
          { i: Star, t: "Attention to detail", d: "From cable routes to the final finish." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="glass rounded-2xl p-6">
            <Icon className="h-6 w-6 text-gold" />
            <h3 className="mt-3 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <CTA title="Let's talk about your project" subtitle="Tell us what you need and we'll give you a clear, free quote." />
    </>
  );
}
