import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, FileText } from "lucide-react";
import { SITE } from "@/lib/site";

export function MobileBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 glass-strong rounded-2xl shadow-elegant border border-gold/25 grid grid-cols-3 overflow-hidden">
        <a
          href={`tel:${SITE.phone}`}
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground hover:bg-white/5"
        >
          <Phone className="h-5 w-5 text-gold" />
          Call
        </a>
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground border-x border-gold/15 hover:bg-white/5"
        >
          <MessageCircle className="h-5 w-5" style={{ color: "var(--whatsapp)" }} />
          WhatsApp
        </a>
        <Link
          to="/contact"
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-primary-foreground gradient-gold"
        >
          <FileText className="h-5 w-5" />
          Quote
        </Link>
      </div>
    </div>
  );
}
