import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

export function CTA({
  title = "Ready to get a quote?",
  subtitle = "Free, no-obligation quotes across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
      <div className="relative overflow-hidden rounded-3xl gold-border-glow glass p-8 sm:p-12 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial-gold)" }}
        />
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-gold-text">{title}</span>
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">{subtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-110 transition"
            >
              Request a Quote
            </Link>
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3 text-sm font-semibold text-foreground hover:bg-white/5 transition"
            >
              <Phone className="h-4 w-4 text-gold" /> Call {SITE.phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3 text-sm font-semibold text-foreground hover:bg-white/5 transition"
            >
              <MessageCircle className="h-4 w-4" style={{ color: "var(--whatsapp)" }} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
