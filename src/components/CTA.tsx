import { Link } from "@tanstack/react-router";
import { ArrowRight, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { WhatsAppButton } from "./WhatsAppButton";

export function CTA({
  title = "Good work starts with a conversation.",
  subtitle = "Tell Gus what you have in mind. Send your postcode, a short description and any useful photographs, and we’ll help you work out the next step.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto my-20 max-w-7xl px-4 lg:px-8">
      <div className="enquiry-section relative overflow-hidden p-7 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 technical-grid opacity-50 lg:block" />
        <div className="relative max-w-3xl">
          <span className="eyebrow">Start with the job</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/contact" className="button-primary">
              Request a quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`tel:${SITE.phone}`} className="button-secondary">
              <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
            </a>
            <WhatsAppButton size="md" />
          </div>
        </div>
      </div>
    </section>
  );
}
