import { SITE } from "@/lib/site";

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect width="16" height="16" rx="3.4" fill="#25D366" />
      <path
        fill="#fff"
        d="M13.6 2.33A7.85 7.85 0 0 0 7.99 0C3.63 0 .07 3.56.06 7.93c0 1.4.37 2.76 1.06 3.96L0 16l4.2-1.1A7.93 7.93 0 0 0 8 15.86h.01c4.37 0 7.93-3.56 7.93-7.93a7.86 7.86 0 0 0-2.34-5.6ZM8 14.52a6.58 6.58 0 0 1-3.36-.92l-.24-.14-2.49.65.67-2.43-.16-.25a6.59 6.59 0 1 1 5.59 3.09Zm3.61-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.45.1-.13.2-.51.64-.63.77-.11.13-.23.15-.43.05-.2-.1-.83-.31-1.59-.98a5.96 5.96 0 0 1-1.1-1.37c-.11-.2-.01-.3.09-.4l.3-.35c.1-.12.13-.2.2-.33.06-.13.03-.25-.02-.35-.05-.1-.45-1.08-.61-1.48-.16-.39-.33-.34-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.69.67-.69 1.65 0 .97.71 1.91.81 2.04.1.13 1.39 2.12 3.37 2.97.47.2.84.32 1.12.41.47.15.9.13 1.23.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.85.12-.94-.05-.08-.18-.13-.38-.23Z"
      />
    </svg>
  );
}

export function WhatsAppButton({
  label = "Chat on WhatsApp",
  size = "md",
  className = "",
  iconOnly = false,
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
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
      aria-label={iconOnly ? "Chat on WhatsApp" : undefined}
      className={`group inline-flex items-center justify-center gap-2.5 font-semibold text-foreground transition-all duration-300 hover:scale-[1.04] active:scale-95 ${
        iconOnly ? "h-16 w-16 rounded-2xl p-0" : `rounded-full ${sizeCls}`
      } ${className}`}
      style={{
        background: iconOnly ? "#25D366" : "oklch(0.08 0.012 250 / 0.7)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        boxShadow: iconOnly
          ? "0 8px 24px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.16)"
          : "inset 0 1px 0 oklch(0.95 0.1 150 / 0.15), 0 0 0 1px oklch(0.6 0.18 150 / 0.55), 0 0 22px -4px oklch(0.55 0.18 150 / 0.55), 0 8px 24px -10px oklch(0 0 0 / 0.7)",
      }}
    >
      <WhatsAppGlyph
        className={iconOnly ? "h-14 w-14" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}
      />
      {!iconOnly && <span className="tracking-wide">{label}</span>}
    </a>
  );
}
