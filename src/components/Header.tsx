import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/gallery", label: "Our Work" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4 px-3 sm:px-5">
      <div
        className="mx-auto max-w-7xl rounded-2xl lg:rounded-full transition-all duration-300"
        style={{
          background: scrolled
            ? "oklch(0.05 0.008 250 / 0.86)"
            : "oklch(0.055 0.01 250 / 0.68)",
          backdropFilter: "blur(24px) saturate(170%)",
          WebkitBackdropFilter: "blur(24px) saturate(170%)",
          boxShadow:
            "inset 0 1px 0 oklch(0.85 0.12 240 / 0.2), 0 0 0 1px oklch(0.7 0.22 240 / 0.42), 0 0 36px -8px oklch(0.55 0.22 250 / 0.65), 0 18px 55px -18px oklch(0 0 0 / 0.9)",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2 sm:py-2.5">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Sperin Services — Home"
          >
            <Logo className="h-12 sm:h-14 lg:h-16 w-auto shrink-0" />
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-2 xl:gap-4">
            <NavItem to="/" label="Home" exact />
            <ServicesDropdown />
            {NAV.slice(1).map((n) => (
              <NavItem key={n.to} to={n.to} label={n.label} />
            ))}
          </nav>

          <div className="hidden lg:flex items-center shrink-0">
            <a
              href={`tel:${SITE.phone}`}
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "oklch(0.08 0.01 250 / 0.72)",
                boxShadow:
                  "inset 0 1px 0 oklch(0.85 0.12 240 / 0.2), 0 0 0 1px oklch(0.7 0.22 240 / 0.6), 0 0 26px -4px oklch(0.6 0.22 245 / 0.7)",
              }}
            >
              <Phone
                className="h-4 w-4 text-electric"
                style={{
                  filter:
                    "drop-shadow(0 0 7px oklch(0.7 0.22 240 / 0.9))",
                }}
              />
              <span className="tracking-wide">{SITE.phoneDisplay}</span>
            </a>
          </div>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="lg:hidden rounded-full p-2.5 text-foreground transition active:scale-95"
            style={{
              background: "oklch(0.08 0.01 250 / 0.7)",
              boxShadow:
                "inset 0 1px 0 oklch(0.85 0.12 240 / 0.2), 0 0 0 1px oklch(0.7 0.22 240 / 0.45), 0 0 16px -4px oklch(0.6 0.22 245 / 0.5)",
            }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.12 0.05 250 / 0.96), oklch(0.04 0.005 250 / 0.99) 70%)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
        }}
      >
        <div className="h-full overflow-y-auto pt-24 pb-12 px-6">
          <nav className="flex flex-col gap-1 max-w-md mx-auto">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              activeOptions={{ exact: true }}
              className="block rounded-2xl px-5 py-4 text-2xl font-semibold text-foreground/95 transition-all duration-500 data-[status=active]:text-electric"
              style={{
                background: "oklch(0.08 0.01 250 / 0.5)",
                boxShadow:
                  "inset 0 1px 0 oklch(0.85 0.12 240 / 0.1), 0 0 0 1px oklch(0.7 0.22 240 / 0.2)",
              }}
            >
              Home
            </Link>

            <div className="mt-3 mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-electric">
              Services
            </div>

            {SERVICES.map((s, i) => (
              <Link
                key={s.slug}
                to={s.path}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-5 py-3 text-base text-foreground/85 hover:text-electric transition-all duration-500 data-[status=active]:text-electric ${
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: open ? `${80 + i * 40}ms` : "0ms",
                  background: "oklch(0.08 0.01 250 / 0.35)",
                  boxShadow: "0 0 0 1px oklch(0.7 0.22 240 / 0.12)",
                }}
              >
                {s.title}
              </Link>
            ))}

            {NAV.slice(1).map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`block rounded-2xl px-5 py-4 text-2xl font-semibold text-foreground/95 transition-all duration-500 data-[status=active]:text-electric ${
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: open ? `${320 + i * 50}ms` : "0ms",
                  background: "oklch(0.08 0.01 250 / 0.5)",
                  boxShadow:
                    "inset 0 1px 0 oklch(0.85 0.12 240 / 0.1), 0 0 0 1px oklch(0.7 0.22 240 / 0.2)",
                }}
              >
                {n.label}
              </Link>
            ))}

            <a
              href={`tel:${SITE.phone}`}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-foreground transition active:scale-95"
              style={{
                background: "oklch(0.08 0.01 250 / 0.8)",
                boxShadow:
                  "inset 0 1px 0 oklch(0.85 0.12 240 / 0.22), 0 0 0 1px oklch(0.7 0.22 240 / 0.55), 0 0 28px -6px oklch(0.6 0.22 245 / 0.6)",
              }}
            >
              <Phone className="h-5 w-5 text-electric" />
              {SITE.phoneDisplay}
            </a>

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-full gradient-electric px-6 py-4 text-base font-bold text-primary-foreground shadow-electric"
            >
              Request a Quote
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavItem({
  to,
  label,
  exact,
}: {
  to: string;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className="group relative px-4 py-2.5 text-sm font-medium text-foreground/82 hover:text-foreground transition-colors data-[status=active]:text-electric data-[status=active]:font-semibold after:pointer-events-none after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:rounded-full after:bg-electric after:shadow-[0_0_14px_oklch(0.7_0.22_240)] after:transition-all after:duration-300 hover:after:w-8 data-[status=active]:after:w-10"
    >
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

function ServicesDropdown() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hover, setHover] = useState(false);
  const isActive = pathname.startsWith("/services");

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        className={`group relative flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors after:pointer-events-none after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-electric after:shadow-[0_0_14px_oklch(0.7_0.22_240)] after:transition-all after:duration-300 hover:after:w-8 ${
          isActive
            ? "text-electric font-semibold after:w-10"
            : "text-foreground/82 hover:text-foreground after:w-0"
        }`}
      >
        Services{" "}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${hover ? "rotate-180" : ""}`}
        />
      </button>

      {hover && (
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-80">
          <div
            className="rounded-2xl p-2"
            style={{
              background: "oklch(0.06 0.01 250 / 0.92)",
              backdropFilter: "blur(22px) saturate(160%)",
              WebkitBackdropFilter: "blur(22px) saturate(160%)",
              boxShadow:
                "inset 0 1px 0 oklch(0.85 0.12 240 / 0.15), 0 0 0 1px oklch(0.7 0.22 240 / 0.3), 0 24px 60px -20px oklch(0 0 0 / 0.85), 0 0 30px -8px oklch(0.5 0.22 250 / 0.4)",
            }}
          >
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to={s.path}
                className="block rounded-xl px-3 py-2.5 text-sm text-foreground/85 hover:bg-electric/10 hover:text-electric transition data-[status=active]:bg-electric/10 data-[status=active]:text-electric"
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.short}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
