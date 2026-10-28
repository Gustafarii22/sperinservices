import { AnalyticsPreference } from "./AnalyticsPreference";
import { Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-0 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-9 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Logo className="h-12 w-auto" />
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Domestic and commercial electrical work across Birmingham and the West Midlands.
              Industry experience since {SITE.industrySince}; trading independently since{" "}
              {SITE.founded}.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 hover:text-electric"
              >
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 hover:text-electric"
              >
                <Mail className="h-4 w-4 text-electric" /> {SITE.email}
              </a>
            </div>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground sm:grid-cols-3"
            aria-label="Footer"
          >
            <Link to="/services">Services</Link>
            <Link to="/pricing">Prices</Link>
            <Link to="/our-work">Our Work</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/services/data-network-cabling">Data & networks</Link>
            <Link to="/commercial">Commercial</Link>
            <Link to="/leave-a-review">Leave a review</Link>
          </nav>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Serving Birmingham, Smethwick &amp; Bearwood, Sutton Coldfield, Tamworth and surrounding
          West Midlands locations. Travel is assessed from our Smethwick base; use the postcode
          checker for an indication.
        </p>
        <AnalyticsPreference />
        <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sperin Services.</span>
          <div className="flex gap-5">
            <Link to="/faqs">FAQs</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
