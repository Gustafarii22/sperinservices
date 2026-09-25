import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/15">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo className="h-16 w-auto" />
            <p className="mt-5 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-foreground/92">
              Electrical work for homes, businesses and commercial premises across the West
              Midlands.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              In the electrical industry since {SITE.industrySince}. Trading as Sperin Services
              since {SITE.founded}. Design, installation, inspection, testing, fault finding and
              remedial work handled with one clear point of contact.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {SITE.qualifications.map((item) => (
                <span key={item} className="rounded-md border border-white/10 px-3 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link to={service.path} className="transition hover:text-foreground">
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/commercial" className="transition hover:text-foreground">
                  Commercial electrical
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
              Talk to Sperin
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href={`tel:${SITE.phone}`}
                className="flex items-center gap-2 text-foreground/90 transition hover:text-electric"
              >
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2 break-all text-foreground/90 transition hover:text-electric"
              >
                <Mail className="h-4 w-4 shrink-0 text-electric" /> {SITE.email}
              </a>
              <Link
                to="/contact"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-electric"
              >
                Request a quote <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="rule mt-12 flex flex-col gap-3 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sperin Services. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/faqs" className="transition hover:text-foreground">
              FAQs
            </Link>
            <Link to="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
