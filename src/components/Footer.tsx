import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-gold/15 bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="h-14 w-auto" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Domestic electrical & building specialists across Birmingham, Sutton
            Coldfield, Tamworth and the wider West Midlands. Clean workmanship,
            honest service.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to={s.path} className="hover:text-gold transition">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gold">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`tel:${SITE.phone}`} className="hover:text-gold">
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-gold">
                {SITE.email}
              </a>
            </li>
            <li>{SITE.areas.join(" · ")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/10">
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Sperin Services. All rights reserved.</span>
          <span>Domestic electrical & building specialists · West Midlands</span>
        </div>
      </div>
    </footer>
  );
}
