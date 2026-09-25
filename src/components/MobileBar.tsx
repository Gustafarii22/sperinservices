import { Phone, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { WhatsAppGlyph } from "./WhatsAppButton";
export function MobileBar() {
  return (
    <div className="mobile-contact-bar">
      <a href={`tel:${SITE.phone}`}>
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
        <WhatsAppGlyph className="h-4 w-4 text-[#25d366]" />
        WhatsApp
      </a>
      <Link to="/contact">
        <span>Discuss a job</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
