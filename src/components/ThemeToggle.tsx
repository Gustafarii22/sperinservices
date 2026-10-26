import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const eventName = "sperin-theme-change";
const storageKey = "sperin-theme";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    dark ? "#192126" : "#ffffff",
  );
  window.dispatchEvent(new Event(eventName));
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    // A change on another tab should be reflected without a page reload.
    let selected = "light";
    try { selected = localStorage.getItem(storageKey) || "light"; }
    catch { /* Storage can be unavailable in a private browser. */ }
    applyTheme(selected === "dark");
  };
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function selectTheme(dark: boolean) {
  applyTheme(dark);
  try { localStorage.setItem(storageKey, dark ? "dark" : "light"); }
  catch { /* The toggle still works without persistent storage. */ }
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <div className="theme-toggle" role="group" aria-label="Website appearance">
      <button
        type="button"
        aria-label="Use light theme"
        aria-pressed={!dark}
        title="Light theme"
        onClick={() => selectTheme(false)}
      >
        <Sun aria-hidden="true" />
        <span className="theme-label">Light</span>
      </button>
      <button
        type="button"
        aria-label="Use dark theme"
        aria-pressed={dark}
        title="Dark theme"
        onClick={() => selectTheme(true)}
      >
        <Moon aria-hidden="true" />
        <span className="theme-label">Dark</span>
      </button>
    </div>
  );
}
