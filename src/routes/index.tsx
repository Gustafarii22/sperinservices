import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageCircle, ArrowRight, ShieldCheck, Sparkles, MapPin, Wrench } from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { CTA } from "@/components/CTA";
import heroImg from "@/assets/hero-electrician.jpg";
import imgRewires from "@/assets/svc-rewires.jpg";
import imgCU from "@/assets/svc-consumer-unit.jpg";
import imgEV from "@/assets/svc-ev.jpg";
import imgSmart from "@/assets/svc-smart.jpg";
import imgTesting from "@/assets/svc-testing.jpg";
import imgKitchen from "@/assets/svc-kitchen.jpg";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";

const SERVICE_IMAGES: Record<string, string> = {
  rewires: imgRewires,
  "consumer-unit": imgCU,
  ev: imgEV,
  smart: imgSmart,
  testing: imgTesting,
  kitchen: imgKitchen,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Electrician Birmingham | Rewires, Consumer Units, EV Chargers | Sperin Services" },
      {
        name: "description",
        content:
          "Sperin Services provides domestic electrical services in Birmingham and the West Midlands. Rewires, consumer unit upgrades, EV chargers, EICRs, smart home installations, kitchens and bathrooms.",
      },
      { property: "og:title", content: "Electrician Birmingham | Sperin Services" },
      {
        property: "og:description",
        content:
          "Domestic electrician in Birmingham covering rewires, consumer units, EV chargers, EICRs and smart home installations across the West Midlands.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Electrician",
          name: "Sperin Services",
          url: SITE.url,
          telephone: SITE.phone,
          email: SITE.email,
          image: `${SITE.url}/sperin-logo.png`,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Birmingham",
            addressRegion: "West Midlands",
            addressCountry: "GB",
          },
          areaServed: [
            "Birmingham",
            "Smethwick",
            "Quinton",
            "Harborne",
            "Oldbury",
            "Halesowen",
            "West Bromwich",
            "Sutton Coldfield",
            "Solihull",
            "Tamworth",
            "West Midlands",
          ],
          serviceType: [
            "Domestic electrician",
            "House rewires",
            "Consumer unit upgrades",
            "EV charger installation",
            "EICR testing",
            "Smart home installation",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Do you cover Birmingham?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, Sperin Services covers Birmingham, Smethwick, Quinton, Harborne, Oldbury, Halesowen, Sutton Coldfield, Tamworth and the wider West Midlands.",
              },
            },
            {
              "@type": "Question",
              name: "Do you carry out EICRs?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, we carry out Electrical Installation Condition Reports for domestic properties, landlords and rental properties.",
              },
            },
            {
              "@type": "Question",
              name: "Do you install consumer units?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, we install and upgrade modern consumer units including RCD, RCBO and surge protection options where suitable.",
              },
            },
            {
              "@type": "Question",
              name: "Can you quote for a rewire?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, we can quote for full rewires and partial rewires after discussing the size of the property, access, number of points and the finish required.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-radial-electric)" }} />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full -z-10 opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.5 0.22 250 / 0.45), transparent 65%)" }}
        />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full hairline px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-electric">
              <span className="h-1.5 w-1.5 rounded-full bg-electric glow-electric" />
              Birmingham · West Midlands · Domestic Electrician
            </div>

            <h1 className="mt-6 text-[2.4rem] sm:text-5xl lg:text-[4.5rem] font-extrabold leading-[0.98] tracking-[-0.04em] uppercase">
              Electrician Birmingham.
              <br />
              <span className="gradient-electric-text" style={{ filter: "drop-shadow(0 0 28px oklch(0.7 0.22 240 / 0.45))" }}>
                Quality you can trust.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Sperin Services provides domestic electrical services across Birmingham and the West Midlands, including house rewires,
              consumer unit upgrades, EV charger installation, EICRs, smart home installations, fault finding, kitchens and bathrooms.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="rounded-full gradient-electric px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-electric hover:brightness-110 transition">
                Get a Free Quote
              </Link>

              <a href={`tel:${SITE.phone}`} className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3.5 text-sm font-semibold hover:bg-white/5 transition">
                <Phone className="h-4 w-4 text-electric" /> Call {SITE.phoneDisplay}
              </a>

              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white hover:brightness-110 transition"
                style={{ background: "var(--whatsapp-deep)", boxShadow: "0 8px 24px -10px oklch(0.55 0.18 150 / 0.6)" }}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>

            <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              {[
                { i: ShieldCheck, t: "23 Years Experience" },
                { i: Sparkles, t: "Electrical Certification" },
                { i: ShieldCheck, t: "Part P Compliant Work" },
                { i: ShieldCheck, t: "Fully Insured" },
                { i: Wrench, t: "Domestic Specialists" },
                { i: MapPin, t: "Local West Midlands" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-electric" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-[2rem] opacity-50 blur-3xl gradient-electric" />
            <img
              src={heroImg}
              alt="Electrician in Birmingham installing a modern UK consumer unit"
              className="relative w-full rounded-3xl shadow-elegant electric-border-glow object-cover aspect-[4/3]"
              width={1920}
              height={1280}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* SERVICE BUTTONS */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">Electrical Services in Birmingham</span>
            </h2>
            <p className="mt-2 text-muted-foreground">Domestic electrical work, testing, installations and upgrades across the West Midlands.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link key={s.slug} to={s.path} className="group relative overflow-hidden rounded-3xl gold-border-glow bg-card hover:-translate-y-1 transition duration-500">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={SERVICE_IMAGES[s.image]} alt={`${s.title} Birmingham`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>

              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 35%, oklch(0.08 0.01 60 / 0.85) 100%)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{s.short}</p>
                </div>
                <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-primary-foreground shadow-gold">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-gold-text">Domestic Electrician in Birmingham & the West Midlands</span>
          </h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 text-muted-foreground leading-relaxed">
            <div>
              <p>
                Sperin Services provides reliable domestic electrical work across Birmingham, Smethwick, Quinton, Harborne, Oldbury,
                Halesowen, West Bromwich, Sutton Coldfield, Tamworth, Solihull and nearby areas. Whether you need a small electrical repair,
                a consumer unit upgrade, a landlord EICR, a full house rewire or a smart home installation, the focus is always on
                clean workmanship, clear communication and a safe finished job.
              </p>

              <p className="mt-4">
                With 23 years of electrical experience, Sperin Services is built around domestic work. That means understanding how
                people actually live in their homes: keeping disruption down, planning cable routes properly, protecting finished
                surfaces, working neatly and leaving the property tidy.
              </p>
            </div>

            <div>
              <p>
                Common electrical services include full and partial rewires, fuse board and consumer unit replacements, additional
                sockets, lighting upgrades, EV charger installations, fault finding, smoke alarms, smart lighting, smart heating,
                video doorbells, security wiring and electrical testing.
              </p>

              <p className="mt-4">
                If you are looking for an electrician in Birmingham for domestic electrical work, Sperin Services can provide advice,
                clear pricing where possible and a proper quotation for larger jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            <span className="gradient-gold-text">Why Choose Sperin Services</span>
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            A reliable local electrician delivering domestic electrical and building work to a premium standard.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Fully qualified", d: "Trained, experienced and continually developing." },
              { t: "Clean, tidy workmanship", d: "We treat your home with respect on every visit." },
              { t: "Domestic specialists", d: "Focused expertise in homes, rewires, consumer units and domestic upgrades." },
              { t: "Clear communication", d: "Honest updates, no jargon and no unnecessary confusion." },
              { t: "Local West Midlands service", d: "Covering Birmingham, Smethwick, Quinton, Harborne, Sutton Coldfield and nearby areas." },
              { t: "High attention to detail", d: "From cable routes and containment to the final finish." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl hairline p-5 bg-card/40">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gold glow-gold" />
                  <h3 className="font-semibold">{x.t}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY SERVICES SEO */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
          <span className="gradient-gold-text">Popular Electrical Services</span>
        </h2>

        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              title: "House Rewires Birmingham",
              text: "Full and partial rewires for homes, renovations, extensions and older properties. Ideal when wiring is outdated, damaged, unsafe or no longer suitable for modern electrical demand.",
              link: "/services/rewires",
            },
            {
              title: "Consumer Unit Upgrades Birmingham",
              text: "Modern fuse board and consumer unit upgrades including RCD, RCBO and surge protection options where suitable. A common upgrade after EICR issues or property renovation.",
              link: "/services/consumer-units",
            },
            {
              title: "EV Charger Installation Birmingham",
              text: "Domestic EV charger installations for homeowners wanting safe and convenient charging at home, with advice on load, cable routes and suitable charger options.",
              link: "/services/ev-chargers",
            },
            {
              title: "Smart Home Installation Birmingham",
              text: "Smart lighting, heating, security, video doorbells and home automation upgrades designed to make your home easier to control and more convenient to live in.",
              link: "/services/smart-home",
            },
          ].map((item) => (
            <Link key={item.title} to={item.link} className="rounded-2xl hairline p-6 bg-card/40 hover:bg-white/5 transition">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* AREAS */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="rounded-3xl hairline p-8 sm:p-10 bg-card/40">
          <h2 className="text-3xl font-bold">
            <span className="gradient-gold-text">Areas Covered</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sperin Services covers Birmingham and surrounding West Midlands areas.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {["Birmingham", "Smethwick", "Quinton", "Harborne", "Oldbury", "Halesowen", "West Bromwich", "Sutton Coldfield", "Tamworth", "Solihull", "Dudley", "Walsall"].map((area) => (
              <span key={area} className="rounded-full hairline px-4 py-2 bg-background/40">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT WORK PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">Recent Work</span>
            </h2>
            <p className="mt-2 text-muted-foreground">A quick look at recent electrical and installation work.</p>
          </div>
          <Link to="/gallery" className="hidden sm:inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5">
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[work1, work2, work3].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-2xl gold-border-glow">
              <img src={src} alt={`Recent electrical work in Birmingham ${i + 1}`} loading="lazy" className="w-full aspect-[4/3] object-cover hover:scale-105 transition duration-700" />
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link to="/gallery" className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5">
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-gold-text">Electrician Birmingham FAQs</span>
          </h2>

          <div className="mt-8 grid gap-5">
            {[
              {
                q: "Do you cover my area?",
                a: "Sperin Services covers Birmingham, Smethwick, Quinton, Harborne, Oldbury, Halesowen, West Bromwich, Sutton Coldfield, Tamworth, Solihull and nearby West Midlands areas.",
              },
              {
                q: "Can you quote for a full house rewire?",
                a: "Yes. For rewires, the price depends on property size, access, number of points, finish required, consumer unit work and whether the property is occupied.",
              },
              {
                q: "Do you carry out landlord EICRs?",
                a: "Yes. Sperin Services carries out EICRs for domestic properties, landlords and rental homes.",
              },
              {
                q: "Do you install EV chargers?",
                a: "Yes. Domestic EV charger installation is available, including advice on suitable locations, cable routes and electrical supply requirements.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl hairline p-5 bg-card/40">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
      }
