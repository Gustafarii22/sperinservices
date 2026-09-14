import { Link } from "@tanstack/react-router";
import { Phone, FileText } from "lucide-react";
import { SITE } from "@/lib/site";

import { WhatsAppGlyph } from "./WhatsAppButton";

export function MobileBar() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div
        className="mx-3 mb-3 rounded-2xl grid grid-cols-3 overflow-hidden"
        style={{
          background: "oklch(0.05 0.008 250 / 0.9)",
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          boxShadow:
            "0 24px 60px -20px oklch(0 0 0 / 0.85), 0 0 0 1px oklch(0.7 0.22 240 / 0.25), 0 0 30px -8px oklch(0.5 0.22 250 / 0.4), inset 0 1px 0 oklch(0.85 0.12 240 / 0.12)",
        }}
      >
        <a
          href={`tel:${SITE.phone}`}
          className="flex flex-col items-center justify-center gap-1 py-3.5 text-[11px] font-semibold tracking-wide text-foreground/95 hover:bg-white/[0.04] transition active:scale-95"
        >
          <Phone className="h-[19px] w-[19px] text-electric" style={{ filter: "drop-shadow(0 0 6px oklch(0.7 0.22 240 / 0.6))" }} />
          Call
        </a>
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-3.5 text-[11px] font-semibold tracking-wide text-foreground/95 border-x border-electric/15 hover:bg-white/[0.04] transition active:scale-95"
        >
          <WhatsAppGlyph className="h-8 w-8" />
          WhatsApp
        </a>
        <Link
          to="/contact"
          className="flex flex-col items-center justify-center gap-1 py-3.5 text-[11px] font-bold tracking-wide text-primary-foreground gradient-electric"
          style={{ boxShadow: "inset 0 1px 0 oklch(0.95 0.05 240 / 0.3)" }}
        >
          <FileText className="h-[19px] w-[19px]" />
          Free Quote
        </Link>
      </div>
    </div>
  );
}
