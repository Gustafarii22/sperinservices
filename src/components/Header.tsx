import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

const NAV = [
  { to: "/pricing", label: "Prices" },
  { to: "/our-work", label: "Our Work" },
  { to: "/reviews", label: "Reviews" },
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
    <Dialog open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#111314]/95 backdrop-blur-xl">
        <div
          className={`mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-4 px-4 transition-all lg:px-8 ${
            scrolled ? "min-h-[58px]" : ""
          }`}
        >
          <Link to="/" className="flex shrink-0 items-center" aria-label="Sperin Services home">
            <Logo className="h-11 w-auto sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <ServicesDropdown />
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-foreground/82 transition hover:text-foreground"
            >
              <Phone className="h-4 w-4 text-electric" />
              {SITE.phoneDisplay}
            </a>
            <Link to="/pricing" className="button-primary text-sm">
              Build estimate
            </Link>
          </div>

          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="mobile-menu-trigger inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/[0.025]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DialogTrigger>
        </div>

        <DialogContent
          className="mobile-navigation max-h-[92dvh] w-[calc(100%-20px)] max-w-md overflow-y-auto p-4"
          aria-describedby={undefined}
        >
          <DialogTitle className="px-2 pr-8 text-xl">Sperin Services</DialogTitle>
          <nav className="mt-3" aria-label="Mobile navigation">
            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="button-primary mb-3 w-full"
            >
              Build an estimate
            </Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="button-secondary mb-5 w-full"
            >
              Discuss a project
            </Link>

            <div className="border-t border-white/10 pt-3">
              <Link
                to="/services"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-semibold"
              >
                Services
              </Link>
              <Link
                to="/commercial"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-foreground/75"
              >
                Commercial electrical
              </Link>
              {SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  to={service.path}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm text-foreground/75"
                >
                  {service.title}
                </Link>
              ))}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              {NAV.filter((item) => item.to !== "/pricing" && item.to !== "/contact").map(
                (item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-semibold"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>

            <a
              href={`tel:${SITE.phone}`}
              className="mt-4 flex min-h-12 items-center justify-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold"
            >
              <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
            </a>
          </nav>
        </DialogContent>
      </header>
    </Dialog>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/72 transition hover:bg-white/[0.035] hover:text-foreground data-[status=active]:text-electric"
    >
      {label}
    </Link>
  );
}

function ServicesDropdown() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActive = pathname.startsWith("/services") || pathname === "/commercial";
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node))
        detailsRef.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2.5 text-sm font-semibold transition hover:bg-white/[0.035] [&::-webkit-details-marker]:hidden ${
          isActive ? "text-electric" : "text-foreground/72"
        }`}
      >
        Services
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-2">
        <div className="surface-strong rounded-md p-2 shadow-elegant">
          <Link
            to="/services"
            className="block rounded-md px-3 py-3 text-sm font-bold text-electric transition hover:bg-white/[0.045]"
          >
            View all services
          </Link>
          <Link
            to="/commercial"
            className="block rounded-md px-3 py-3 transition hover:bg-white/[0.045]"
          >
            <div className="text-sm font-semibold">Commercial electrical</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Premises, testing, lighting, power & access
            </div>
          </Link>
          <div className="my-1 border-t border-white/10" />
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="block rounded-md px-3 py-3 transition hover:bg-white/[0.045]"
            >
              <div className="text-sm font-semibold text-foreground/90">{service.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{service.short}</div>
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
