import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
export function AnalyticsPreference() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem("sperin-analytics") === "yes");
    } catch {
      /* optional */
    }
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.("a");
      const href = link?.getAttribute("href") || "";
      if (href.startsWith("tel:")) track("phone_click");
      else if (href.startsWith("https://wa.me/")) track("whatsapp_click");
      else if (href.startsWith("mailto:")) track("email_click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return (
    <button
      type="button"
      aria-pressed={enabled}
      className="min-h-11 text-left text-xs text-muted-foreground underline"
      onClick={() => {
        try {
          localStorage.setItem("sperin-analytics", enabled ? "no" : "yes");
          setEnabled(!enabled);
        } catch {
          /* unavailable */
        }
      }}
    >
      Optional usage measurement: {enabled ? "on — turn off" : "off — allow"}
    </button>
  );
}
