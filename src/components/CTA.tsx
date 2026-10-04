import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function CTA({
  title = "Ready for the next step?",
  subtitle = "Use the estimate calculator for listed standard jobs, or send the project details for anything bespoke, larger or uncertain.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4 lg:px-8">
      <div className="enquiry-section p-6 sm:p-8 lg:p-10">
        <span className="eyebrow">Start here</span>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
        <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <Link to="/pricing" className="button-primary">
            <Calculator className="h-4 w-4" /> Build an estimate
          </Link>
          <Link to="/contact" className="button-secondary">
            Discuss a project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <a
          href={`tel:${SITE.phone}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-4 w-4 text-electric" /> Prefer to call? {SITE.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
