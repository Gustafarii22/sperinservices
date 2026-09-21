import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/commercial", label: "Commercial" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`surface-strong mx-auto max-w-7xl rounded-xl transition-all duration-200 ${
          scrolled ? "shadow-elegant" : ""
        }`}
      >
        <div className="flex min-h-[68px] items-center justify-between gap-4 px-3 sm:px-5">
          <Link
            to="/"
            className="flex shrink-0 items-center"
            aria-label="Sperin Services home"
          >
            <Logo className="h-12 w-auto sm:h-14" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <NavItem to="/" label="Home" exact />
            <ServicesDropdown />
            {NAV.slice(1).map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
            >
              <Phone className="h-4 w-4 text-electric" />
              {SITE.phoneDisplay}
            </a>
            <Link to="/contact" className="button-primary text-sm">
              Get a quote
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="button-secondary !min-h-0 !p-2.5 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-background/98 px-4 pt-24 transition-opacity duration-200 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="surface mx-auto max-w-lg rounded-2xl p-4" aria-label="Mobile navigation">
          <div className="grid gap-1">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              activeOptions={{ exact: true }}
              className="rounded-lg px-4 py-3 text-lg font-semibold transition hover:bg-white/5 data-[status=active]:text-electric"
            >
              Home
            </Link>

            <div className="rule mt-2 pt-4">
              <div className="px-4 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Electrical services
              </div>
              {SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  to={service.path}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm text-foreground/85 transition hover:bg-white/5 hover:text-electric data-[status=active]:text-electric"
                >
                  {service.title}
                </Link>
              ))}
            </div>

            <div className="rule mt-3 grid gap-1 pt-3">
              {NAV.slice(1).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-lg font-semibold transition hover:bg-white/5 data-[status=active]:text-electric"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <a href={`tel:${SITE.phone}`} className="button-secondary text-sm">
              <Phone className="h-4 w-4 text-electric" /> Call
            </a>
            <Link to="/contact" onClick={() => setOpen(false)} className="button-primary text-sm">
              Get a quote
            </Link>
          </div>
        </nav>
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
      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/72 transition hover:bg-white/[0.035] hover:text-foreground data-[status=active]:bg-white/[0.045] data-[status=active]:text-electric"
    >
      {label}
    </Link>
  );
}

function ServicesDropdown() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActive = pathname.startsWith("/services");

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:bg-white/[0.035] hover:text-foreground [&::-webkit-details-marker]:hidden ${
          isActive ? "bg-white/[0.045] text-electric" : "text-foreground/72"
        }`}
      >
        Services
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-3">
        <div className="surface-strong rounded-xl p-2 shadow-elegant">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="block rounded-lg px-3 py-3 transition hover:bg-white/[0.045] data-[status=active]:bg-white/[0.05]"
            >
              <div className="text-sm font-semibold text-foreground/90 group-open:data-[status=active]:text-electric">
                {service.title}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{service.short}</div>
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
