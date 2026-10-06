import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronDown, Images, Mail, Menu, Star, UserRound, Zap } from "lucide-react";
import logo from "@/assets/sperin-logo.png";
import { Logo } from "./Logo";
import { SERVICES } from "@/lib/site";

const NAV = [
  { to: "/pricing", label: "Pricing", icon: Calculator },
  { to: "/our-work", label: "Our Work", icon: Images },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/about", label: "About", icon: UserRound },
  { to: "/contact", label: "Contact", icon: Mail },
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
          className={`relative mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 transition-all lg:gap-5 lg:px-8 ${
            scrolled ? "min-h-[80px] lg:min-h-[74px]" : "min-h-[90px] lg:min-h-[86px]"
          }`}
        >
          <Link to="/" className="shrink-0" aria-label="Sperin Services home">
            <span className="relative block h-[72px] w-[76px] overflow-hidden sm:h-[78px] sm:w-[84px] lg:h-[82px] lg:w-[90px]">
              <img
                src={logo}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-[92px] w-auto max-w-none -translate-y-1/2 sm:h-[100px] lg:h-[106px]"
                draggable={false}
              />
            </span>
          </Link>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="Sperin Services home"
          >
            <span className="relative block h-[64px] w-[220px] overflow-hidden sm:h-[72px] sm:w-[280px] lg:h-[76px] lg:w-[330px]">
              <img
                src={logo}
                alt="Sperin Services"
                className="absolute right-0 top-1/2 h-[92px] w-auto max-w-none -translate-y-1/2 sm:h-[100px] lg:h-[106px]"
                style={{ clipPath: "inset(0 0 0 35%)" }}
                draggable={false}
              />
            </span>
          </Link>

          <nav className="hidden items-center justify-end gap-1 lg:flex" aria-label="Primary navigation">
            <ServicesDropdown />
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="mobile-menu-trigger absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/[0.025] transition hover:border-electric/40 hover:bg-electric/[0.05] lg:static"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DialogTrigger>
        </div>

        <DialogContent
          className="mobile-navigation max-h-[92dvh] w-[calc(100%-18px)] max-w-md overflow-y-auto border-white/12 bg-[#101314] p-0 shadow-2xl"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Sperin Services navigation</DialogTitle>

          <div className="border-b border-white/10 px-5 pb-4 pt-5 text-center">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center"
              aria-label="Sperin Services home"
            >
              <Logo className="h-20 w-auto max-w-[78vw]" />
            </Link>
            <div className="mx-auto mt-3 h-px w-12 bg-electric" />
          </div>

          <nav className="p-3" aria-label="Mobile navigation">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.018]">
              <details className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 text-[15px] font-semibold transition hover:bg-white/[0.035] [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-electric/10 text-electric">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span className="flex-1">Electrical Services</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="border-t border-white/10 bg-black/15 px-3 py-2">
                  {SERVICES.map((service) => (
                    <Link
                      key={service.slug}
                      to={service.path}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center border-b border-white/[0.07] px-3 text-sm text-foreground/82 transition last:border-b-0 hover:text-electric data-[status=active]:text-electric"
                    >
                      {service.title}
                    </Link>
                  ))}
                  <Link
                    to="/commercial"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center border-t border-white/[0.07] px-3 text-sm font-semibold text-foreground/90 transition hover:text-electric data-[status=active]:text-electric"
                  >
                    Commercial Electrical
                  </Link>
                </div>
              </details>

              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center gap-3 border-t border-white/10 px-4 text-[15px] font-semibold transition hover:bg-white/[0.035] data-[status=active]:text-electric"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.035] text-electric">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <p className="px-2 pb-1 pt-4 text-xs leading-relaxed text-muted-foreground">
              Simple routes to the work, pricing and contact details you need.
            </p>
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
      className="relative rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/72 transition hover:bg-white/[0.035] hover:text-foreground data-[status=active]:text-electric"
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
    <details
      ref={detailsRef}
      className="group relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && detailsRef.current) {
          detailsRef.current.open = false;
          detailsRef.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2.5 text-sm font-semibold transition hover:bg-white/[0.035] hover:text-foreground [&::-webkit-details-marker]:hidden ${
          isActive ? "text-electric" : "text-foreground/72"
        }`}
      >
        Electrical Services
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="absolute left-1/2 top-full w-[340px] -translate-x-1/2 pt-2">
        <div className="overflow-hidden rounded-md border border-white/10 bg-[#141819] shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-electric">
              Electrical Services
            </div>
          </div>

          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={service.path}
              className="block border-b border-white/[0.07] px-4 py-3.5 transition hover:bg-electric/[0.06]"
            >
              <div className="text-sm font-semibold text-foreground/92">{service.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {service.short}
              </div>
            </Link>
          ))}

          <Link
            to="/commercial"
            className="block bg-white/[0.02] px-4 py-3.5 transition hover:bg-electric/[0.06]"
          >
            <div className="text-sm font-semibold text-foreground/92">Commercial Electrical</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Electrical work for schools, offices, shops and commercial premises
            </div>
          </Link>
        </div>
      </div>
    </details>
  );
}
