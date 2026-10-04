import { SITE } from "@/lib/site";

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.898 7.898 0 0 0-2.327-5.607Zm-5.607 12.2a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.157-.25a6.573 6.573 0 1 1 5.581 3.093Zm3.61-4.934c-.197-.099-1.17-.578-1.353-.644-.182-.066-.315-.099-.447.1-.132.197-.512.643-.627.775-.115.132-.23.148-.428.05-.197-.1-.832-.307-1.584-.98-.585-.522-.98-1.167-1.095-1.364-.115-.198-.012-.305.086-.404.089-.088.198-.23.296-.345.099-.115.132-.198.198-.33.066-.132.033-.247-.017-.346-.05-.099-.447-1.076-.612-1.472-.161-.387-.325-.334-.447-.34-.115-.005-.247-.006-.379-.006s-.346.05-.527.247c-.181.198-.692.676-.692 1.65 0 .973.709 1.914.807 2.046.099.132 1.395 2.13 3.38 2.988.472.203.84.324 1.127.415.473.15.904.129 1.244.078.38-.057 1.17-.479 1.336-.941.165-.462.165-.858.115-.941-.049-.082-.181-.131-.379-.23Z" />
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
      className={`whatsapp-button inline-flex items-center justify-center gap-2 font-semibold transition-colors ${iconOnly ? "h-12 w-12 rounded-md" : `rounded-md ${sizeCls}`} ${className}`}
    >
      <WhatsAppGlyph className={iconOnly ? "h-7 w-7" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {!iconOnly && <span className="tracking-wide">{label}</span>}
    </a>
  );
}
