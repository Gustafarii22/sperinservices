import { Calculator, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { WhatsAppGlyph } from "./WhatsAppButton";

export function MobileBar() {
  return (
    <div className="mobile-contact-bar" aria-label="Quick contact">
      <a href={`tel:${SITE.phone}`}>
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
        <WhatsAppGlyph className="h-4 w-4 text-[#72d997]" />
        WhatsApp
      </a>
      <Link to="/pricing">
        <Calculator className="h-4 w-4" />
        <span>Estimate</span>
      </Link>
    </div>
  );
}
