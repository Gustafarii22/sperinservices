import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { SITE } from "@/lib/site";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#25D366" d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.47 2.04 7.78L.5 31.5l7.92-2.07A15.43 15.43 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5Z" />
      <path fill="#fff" d="M23.6 19.43c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.92-1.79-2.24-.19-.32-.02-.49.14-.65.14-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.59 1.16 3.13 1.32 3.34.16.21 2.27 3.46 5.5 4.85.77.33 1.37.53 1.83.68.77.25 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
    </svg>
  );
}

export function CTA({
  title = "Ready to get a quote?",
  subtitle = "Free, no-obligation quotes across Birmingham, Sutton Coldfield, Tamworth and the West Midlands.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
      <div className="relative overflow-hidden rounded-3xl electric-border-glow glass p-8 sm:p-12 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial-electric)" }}
        />
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-electric-text">{title}</span>
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">{subtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="rounded-full gradient-electric px-6 py-3 text-sm font-semibold text-primary-foreground shadow-electric hover:brightness-110 transition"
            >
              Request a Quote
            </Link>
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3 text-sm font-semibold text-foreground hover:bg-white/5 transition"
            >
              <Phone className="h-4 w-4 text-electric" /> Call {SITE.phoneDisplay}
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: "var(--whatsapp-deep)", boxShadow: "0 8px 24px -10px oklch(0.55 0.18 150 / 0.6)" }}
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
