import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const eventName = "sperin-theme-change";
function getTheme() { return document.documentElement.classList.contains("dark"); }
function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111314" : "#ffffff");
  window.dispatchEvent(new Event(eventName));
}
function subscribe(callback: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === "sperin-theme" || event.key === null) applyTheme(event.newValue === "dark");
  };
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", sync);
  };
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, () => false);
  return (
    <button type="button" className="theme-toggle" aria-label="Dark theme" aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = !getTheme();
        applyTheme(next);
        try { localStorage.setItem("sperin-theme", next ? "dark" : "light"); } catch { /* Works when storage is unavailable. */ }
      }}>
      <span className="theme-sun items-center gap-1.5"><Sun aria-hidden="true" /><span>Light</span></span>
      <span className="theme-moon items-center gap-1.5"><Moon aria-hidden="true" /><span>Dark</span></span>
    </button>
  );
}
