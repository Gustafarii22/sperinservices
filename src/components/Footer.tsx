import { Link } from "@tanstack/react-router";
import { Phone, Mail, Globe } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";
import { WhatsAppButton } from "./WhatsAppButton";

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
          <div className="mt-5"><WhatsAppButton size="md" /></div>
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
