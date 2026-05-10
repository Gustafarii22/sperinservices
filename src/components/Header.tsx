import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
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

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass-strong" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 lg:px-10 lg:py-4">
        <Link to="/" className="flex items-center shrink-0 -my-1">
          <Logo className="h-20 w-auto sm:h-24 lg:h-28" />
          <span className="sr-only">Sperin Services</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            to="/"
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors"
            activeProps={{ className: "px-3 py-2 text-sm font-medium text-gold" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>

          <ServicesDropdown />

          {NAV.slice(1).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm font-medium text-gold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`tel:${SITE.phone}`}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-foreground/80 hover:text-gold transition-colors"
          >
            <Phone className="h-4 w-4" />
            {SITE.phoneDisplay}
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-110 transition"
          >
            Get Quote
          </Link>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className="lg:hidden rounded-full p-2 text-foreground hairline"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden glass-strong border-t border-gold/20">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-foreground/90 hover:bg-white/5"
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-2 pb-1 text-xs uppercase tracking-wider text-gold/80 px-3">
              Services
            </div>
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to={s.path}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base text-foreground/80 hover:bg-white/5"
              >
                {s.title}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-full gradient-gold px-5 py-3 text-center text-base font-semibold text-primary-foreground shadow-gold"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function ServicesDropdown() {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors">
        Services <ChevronDown className="h-4 w-4" />
      </button>
      {hover && (
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2 w-72">
          <div className="glass rounded-2xl p-2 shadow-elegant">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to={s.path}
                className="block rounded-xl px-3 py-2.5 text-sm text-foreground/85 hover:bg-gold/10 hover:text-gold transition"
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
