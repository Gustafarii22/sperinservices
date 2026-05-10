import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, FileText } from "lucide-react";
import { SITE } from "@/lib/site";

export function MobileBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div
        className="mx-3 mb-3 rounded-2xl grid grid-cols-3 overflow-hidden border border-gold/20"
        style={{
          background: "oklch(0.07 0.004 70 / 0.85)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          boxShadow:
            "0 20px 50px -20px oklch(0 0 0 / 0.8), 0 0 0 1px oklch(0.78 0.082 90 / 0.08), inset 0 1px 0 oklch(0.95 0.05 90 / 0.06)",
        }}
      >
        <a
          href={`tel:${SITE.phone}`}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium tracking-wide text-foreground/90 hover:bg-white/[0.03] transition"
        >
          <Phone className="h-[18px] w-[18px] text-gold" />
          Call
        </a>
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium tracking-wide text-foreground/90 border-x border-gold/10 hover:bg-white/[0.03] transition"
        >
          <MessageCircle className="h-[18px] w-[18px]" style={{ color: "var(--whatsapp)" }} />
          WhatsApp
        </a>
        <Link
          to="/contact"
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold tracking-wide text-primary-foreground gradient-gold"
        >
          <FileText className="h-[18px] w-[18px]" />
          Quote
        </Link>
      </div>
    </div>
  );
}
