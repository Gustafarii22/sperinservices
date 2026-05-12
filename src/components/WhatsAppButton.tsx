import { SITE } from "@/lib/site";

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
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

export function WhatsAppButton({
  label = "Chat on WhatsApp",
  size = "md",
  className = "",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeCls =
    size === "lg"
      ? "px-7 py-3.5 text-base"
      : size === "sm"
      ? "px-4 py-2 text-xs"
      : "px-6 py-3 text-sm";
  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}`}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-2.5 rounded-full font-semibold text-foreground transition-all duration-300 hover:scale-[1.04] active:scale-95 ${sizeCls} ${className}`}
      style={{
        background: "oklch(0.08 0.012 250 / 0.7)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        boxShadow:
          "inset 0 1px 0 oklch(0.95 0.1 150 / 0.15), 0 0 0 1px oklch(0.6 0.18 150 / 0.55), 0 0 22px -4px oklch(0.55 0.18 150 / 0.55), 0 8px 24px -10px oklch(0 0 0 / 0.7)",
      }}
    >
      <WhatsAppGlyph className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      <span className="tracking-wide">{label}</span>
    </a>
  );
}
