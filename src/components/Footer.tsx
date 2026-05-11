import { Link } from "@tanstack/react-router";
import { Phone, Mail, Globe } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#128C4A" d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.47 2.04 7.78L.5 31.5l7.92-2.07A15.43 15.43 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5Z" />
      <path fill="#fff" d="M23.6 19.43c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.92-1.79-2.24-.19-.32-.02-.49.14-.65.14-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.59 1.16 3.13 1.32 3.34.16.21 2.27 3.46 5.5 4.85.77.33 1.37.53 1.83.68.77.25 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-electric/15 bg-background/70">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="h-16 w-auto" />
          <p className="mt-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Domestic electrical &amp; building specialists across Birmingham, Sutton
            Coldfield, Tamworth and the wider West Midlands. Clean workmanship,
            honest service.
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            style={{ background: "var(--whatsapp-deep)", boxShadow: "0 8px 24px -10px oklch(0.55 0.18 150 / 0.6)" }}
          >
            <WhatsAppIcon className="h-4 w-4" /> Message on WhatsApp
          </a>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-electric uppercase tracking-wider">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to={s.path} className="hover:text-electric transition">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-electric uppercase tracking-wider">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <a href={`tel:${SITE.phone}`} className="inline-flex items-center gap-2 hover:text-electric">
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-electric break-all">
                <Mail className="h-4 w-4 text-electric shrink-0" /> {SITE.email}
              </a>
            </li>
            <li>
              <span className="inline-flex items-center gap-2">
                <Globe className="h-4 w-4 text-electric" /> {SITE.website}
              </span>
            </li>
            <li className="text-xs">{SITE.areas.join(" · ")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-electric/10">
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Sperin Services. All rights reserved.</span>
          <span>Domestic electrical &amp; building specialists · West Midlands</span>
        </div>
      </div>
    </footer>
  );
}
