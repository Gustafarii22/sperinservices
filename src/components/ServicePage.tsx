import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Phone } from "lucide-react";
import { CTA } from "./CTA";
import { FAQ, type FAQItem } from "./FAQ";
import { SITE } from "@/lib/site";
import { illustrativeImages } from "@/lib/illustrative-images";

export type ServicePageProps = {
  title: string;
  intro: string;
  intro2?: string;
  included: string[];
  whyItMatters: string[];
  faqs: FAQItem[];
};

export function ServicePage(p: ServicePageProps) {
  const illustration = illustrativeImages[p.title];
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pb-16 lg:pt-18">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="py-4 lg:py-8">
            <span className="eyebrow">Electrical service · West Midlands</span>
            <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              {p.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {p.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/contact" className="button-primary">
                Discuss this job <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone}`} className="button-secondary">
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          <aside
            className="surface-raised technical-grid rounded-2xl p-6 sm:p-8"
            aria-label="Service standards"
          >
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
              Sperin standard
            </div>
            <div className="mt-8 space-y-6">
              {[
                [
                  "01",
                  "Plan",
                  "Understand the existing installation, the required result and any constraints before work starts.",
                ],
                [
                  "02",
                  "Install",
                  "Use sensible routes, appropriate protection and a finish that suits the property.",
                ],
                [
                  "03",
                  "Test",
                  "Inspect and test the work, then provide the appropriate documentation for the job.",
                ],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="rule grid grid-cols-[3rem_1fr] gap-4 pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="font-mono text-sm text-electric">{number}</div>
                  <div>
                    <h2 className="text-lg font-bold">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {illustration && (
        <figure className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={`${illustration.url}?auto=format&fit=crop&w=1200&q=78`}
              srcSet={`${illustration.url}?auto=format&fit=crop&w=640&q=75 640w, ${illustration.url}?auto=format&fit=crop&w=1200&q=78 1200w, ${illustration.url}?auto=format&fit=crop&w=1800&q=80 1800w`}
              sizes="(max-width: 768px) 100vw, 1200px"
              width="1200"
              height="600"
              loading="lazy"
              decoding="async"
              alt={illustration.alt}
              className="aspect-[16/9] max-h-[540px] w-full object-cover lg:aspect-[2/1]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090d12]/70 via-transparent to-transparent" />
          </div>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            Illustrative photograph · not a Sperin Services project
          </figcaption>
        </figure>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="eyebrow">Scope</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">What the work can include</h2>
            {p.intro2 && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {p.intro2}
              </p>
            )}
            <ul className="mt-7 space-y-3">
              {p.included.map((item) => (
                <li
                  key={item}
                  className="rule flex items-start gap-3 py-3 text-sm text-foreground/90 first:border-t-0"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface rounded-2xl p-6 sm:p-8">
            <span className="eyebrow">Why it matters</span>
            <div className="mt-6 space-y-5">
              {p.whyItMatters.map((item, index) => (
                <div key={item} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-mono text-xs text-electric">0{index + 1}</span>
                  <p className="text-sm leading-relaxed text-foreground/88">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rule grid gap-5 pt-8 sm:grid-cols-3">
          {SITE.qualifications.map((qualification) => (
            <div key={qualification}>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Qualification
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground/90">{qualification}</div>
            </div>
          ))}
        </div>
      </section>

      <FAQ items={p.faqs} />
      <CTA />
    </>
  );
}
