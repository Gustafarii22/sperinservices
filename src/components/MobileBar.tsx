import { Calculator, Mail, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { WhatsAppGlyph } from "./WhatsAppButton";

export function MobileBar() {
  return (
    <div className="mobile-contact-bar" aria-label="Quick contact">
      <a href={`tel:${SITE.phone}`}>
        <Phone className="h-[18px] w-[18px] text-electric" strokeWidth={1.8} />
        <span>Call</span>
      </a>
      <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer">
        <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" />
        <span>WhatsApp</span>
      </a>
      <a href={`mailto:${SITE.email}`}>
        <Mail className="h-[18px] w-[18px] text-electric" strokeWidth={1.8} />
        <span>Email</span>
      </a>
      <Link to="/pricing">
        <Calculator className="h-[18px] w-[18px] text-electric" strokeWidth={1.8} />
        <span>Price</span>
      </Link>
    </div>
  );
}
