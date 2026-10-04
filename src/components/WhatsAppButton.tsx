import { SITE } from "@/lib/site";

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.6a8.5 8.5 0 1 1 16.2-4.1Z" />
      <path d="M8.2 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.7 1.2 1.7 2.1 2.9 2.7.3.2.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .6-.3 1.6-1 2.1-.6.5-1.5.8-2.4.6-1.4-.3-3.5-1.1-5.3-2.8-1.5-1.4-2.5-3.2-2.8-4.5-.2-.9 0-1.6.3-2.2Z" />
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
