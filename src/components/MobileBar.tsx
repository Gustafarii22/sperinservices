import { Link } from "@tanstack/react-router";
import { Phone, FileText } from "lucide-react";
import { SITE } from "@/lib/site";

// Authentic WhatsApp glyph (so it instantly reads as WhatsApp)
function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="#25D366"
        d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.47 2.04 7.78L.5 31.5l7.92-2.07A15.43 15.43 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5Z"
      />
      <path
        fill="#fff"
        d="M23.6 19.43c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.92-1.79-2.24-.19-.32-.02-.49.14-.65.14-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.59 1.16 3.13 1.32 3.34.16.21 2.27 3.46 5.5 4.85.77.33 1.37.53 1.83.68.77.25 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z"
      />
    </svg>
  );
}

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
          <WhatsAppIcon className="h-[22px] w-[22px]" />
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
