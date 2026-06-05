import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Wrench,
  CheckCircle2,
  Zap,
  ClipboardCheck,
  Building2,
  Factory,
  Home,
} from "lucide-react";
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

const AREAS = [
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
  "Dudley",
  "Walsall",
];

const FAQS = [
  {
    q: "Do you cover domestic, commercial and industrial electrical work?",
    a: "Yes. Sperin Services carries out domestic, commercial and industrial electrical work across Birmingham and the West Midlands.",
  },
  {
    q: "Do you carry out EICRs for landlords and businesses?",
    a: "Yes. We carry out EICRs for homes, rental properties, offices, shops, commercial units and other premises.",
  },
  {
    q: "Can you quote for commercial electrical work?",
    a: "Yes. We can quote for commercial electrical work including testing, remedials, lighting, power, distribution, maintenance and upgrades.",
  },
  {
    q: "Do you carry out house rewires and consumer unit upgrades?",
    a: "Yes. We carry out full and partial rewires, consumer unit upgrades, fault finding, additional sockets, lighting upgrades and domestic electrical improvements.",
  },
  {
    q: "Do you install EV chargers and smart home systems?",
    a: "Yes. We install EV chargers, smart lighting, smart heating, video doorbells, security wiring and home automation systems.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Electrician Birmingham | Domestic, Commercial & Industrial | Sperin Services",
      },
      {
        name: "description",
        content:
          "Sperin Services provides domestic, commercial and industrial electrical services across Birmingham and the West Midlands. Rewires, consumer units, EICRs, EV chargers, smart home, commercial testing, remedials, kitchens and bathrooms.",
      },
      {
        property: "og:title",
        content:
          "Electrician Birmingham | Domestic, Commercial & Industrial | Sperin Services",
      },
      {
        property: "og:description",
        content:
          "Electrical services across Birmingham and the West Midlands. Domestic, commercial and industrial electrical work, EICRs, rewires, consumer units, EV chargers and smart installations.",
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
          areaServed: AREAS,
          serviceType: [
            "Domestic electrician",
            "Commercial electrician",
            "Industrial electrician",
            "EICR testing",
            "House rewires",
            "Consumer unit upgrades",
            "EV charger installation",
            "Smart home installation",
            "Emergency lighting",
            "Fire alarm wiring",
            "Access control",
            "Kitchen electrics",
            "Bathroom electrics",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-radial-electric)" }}
        />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full -z-10 opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.5 0.22 250 / 0.45), transparent 65%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full hairline px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-electric">
              <span className="h-1.5 w-1.5 rounded-full bg-electric glow-electric" />
              Birmingham · West Midlands · Electrical Specialists
            </div>

            <h1 className="mt-6 text-[2.35rem] sm:text-5xl lg:text-[4.5rem] font-extrabold leading-[0.98] tracking-[-0.04em] uppercase">
              Quality you can see.
              <br />
              <span
                className="gradient-electric-text"
                style={{
                  filter:
                    "drop-shadow(0 0 28px oklch(0.7 0.22 240 / 0.45))",
                }}
              >
                Service you can trust.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Domestic, commercial and industrial electrical services across
              Birmingham and the West Midlands. Rewires, consumer units, EICRs,
              EV chargers, smart systems, maintenance, remedials, kitchens and
              bathrooms.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-full gradient-electric px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-electric hover:brightness-110 transition"
              >
                Get a Free Quote
              </Link>

              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 rounded-full hairline px-6 py-3.5 text-sm font-semibold hover:bg-white/5 transition"
              >
                <Phone className="h-4 w-4 text-electric" /> Call{" "}
                {SITE.phoneDisplay}
              </a>

              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white hover:brightness-110 transition"
                style={{
                  background: "var(--whatsapp-deep)",
                  boxShadow:
                    "0 8px 24px -10px oklch(0.55 0.18 150 / 0.6)",
                }}
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
                { i: Building2, t: "Commercial Work" },
                { i: Factory, t: "Industrial Work" },
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

      <section className="mx-auto max-w-7xl px-4 lg:px-8 -mt-4 mb-14">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { icon: CheckCircle2, text: "Clean workmanship" },
            { icon: ShieldCheck, text: "Fully insured" },
            { icon: Zap, text: "Modern installations" },
            { icon: ClipboardCheck, text: "Clear quotes" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="rounded-2xl hairline bg-card/40 px-4 py-4 flex items-center gap-3 text-sm"
            >
              <Icon className="h-5 w-5 text-electric" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">
                Electrical & Building Services
              </span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Domestic, commercial and industrial electrical work, plus kitchens
              and bathrooms across the West Midlands.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to={s.path}
              className="group relative overflow-hidden rounded-3xl gold-border-glow bg-card hover:-translate-y-1 transition duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={SERVICE_IMAGES[s.image]}
                  alt={`${s.title} Birmingham`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 35%, oklch(0.08 0.01 60 / 0.85) 100%)",
                }}
              />

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                style={{ background: "var(--gradient-radial-gold)" }}
              />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {s.short}
                  </p>
                </div>
                <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-primary-foreground shadow-gold">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              icon: Home,
              title: "Domestic Electrical",
              text: "Rewires, consumer units, EICRs, sockets, lighting, EV chargers, smart home systems, fault finding, kitchens and bathrooms.",
            },
            {
              icon: Building2,
              title: "Commercial Electrical",
              text: "Office, shop, unit and landlord electrical work including EICRs, remedials, lighting, power, maintenance and upgrades.",
            },
            {
              icon: Factory,
              title: "Industrial Electrical",
              text: "Industrial electrical support including distribution, containment, three-phase work, testing, maintenance and fault finding.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass rounded-3xl p-7">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-electric shadow-electric">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">
                <span className="gradient-gold-text">{title}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-gold-text">
              Electrician in Birmingham for Homes, Businesses & Industrial Sites
            </span>
          </h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 text-muted-foreground leading-relaxed">
            <div>
              <p>
                Sperin Services provides electrical work across Birmingham,
                Smethwick, Quinton, Harborne, Oldbury, Halesowen, West
                Bromwich, Sutton Coldfield, Tamworth, Solihull and nearby areas.
                The work covers domestic properties, rental homes, offices,
                shops, commercial units and light industrial environments.
              </p>

              <p className="mt-4">
                Domestic work includes rewires, consumer unit upgrades, EICRs,
                EV chargers, fault finding, extra sockets, lighting upgrades,
                smart home installations, kitchens and bathrooms. Commercial
                and industrial work includes testing, remedials, lighting,
                power, containment, maintenance, access control and electrical
                upgrades.
              </p>
            </div>

            <div>
              <p>
                The aim is simple: safe work, clean finishes, clear
                communication and a reliable service. Whether it is a one-bedroom
                flat EICR, a consumer unit upgrade, an office testing programme
                or a larger commercial installation, the job is approached
                properly from start to finish.
              </p>

              <p className="mt-4">
                For larger projects, you can get a clear quotation based on the
                property, access, condition of the existing installation,
                required finish, timescale and specification.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
          <span className="gradient-gold-text">
            High-Value Electrical Services
          </span>
        </h2>

        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              title: "Commercial EICRs & Remedial Works",
              text: "Electrical testing for offices, shops, units, rental properties and business premises, with clear remedial advice where issues are found.",
              link: "/services/testing",
            },
            {
              title: "House Rewires Birmingham",
              text: "Full and partial rewires for homes, renovations, extensions and older properties where wiring is outdated, unsafe or unsuitable for modern use.",
              link: "/services/rewires",
            },
            {
              title: "Consumer Unit Upgrades",
              text: "Modern fuse board and consumer unit upgrades including RCD, RCBO and surge protection options where suitable.",
              link: "/services/consumer-units",
            },
            {
              title: "EV Chargers & Smart Systems",
              text: "EV charger installation, smart lighting, smart heating, security wiring, video doorbells and connected home upgrades.",
              link: "/services/ev-chargers",
            },
            {
              title: "Commercial & Industrial Electrical Work",
              text: "Lighting, power, containment, three-phase distribution, fault finding, maintenance, access control and electrical upgrades.",
              link: "/contact",
            },
            {
              title: "Kitchens & Bathrooms",
              text: "Kitchen and bathroom installation support including electrics, lighting, extraction, accessories and complete project finishing.",
              link: "/services/kitchens-bathrooms",
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="rounded-2xl hairline p-6 bg-card/40 hover:bg-white/5 transition"
            >
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {item.text}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            <span className="gradient-gold-text">
              Why Choose Sperin Services
            </span>
          </h2>

          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            Electrical and building work carried out with clean workmanship,
            clear communication and attention to detail.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                t: "23 years experience",
                d: "Practical electrical experience across domestic, commercial and industrial work.",
              },
              {
                t: "Clean, tidy workmanship",
                d: "Properties are treated with care from the first visit to the final clean-up.",
              },
              {
                t: "Domestic, commercial & industrial",
                d: "A wider skill set for homes, businesses, landlords and larger premises.",
              },
              {
                t: "Clear communication",
                d: "Straight answers, proper advice and no unnecessary jargon.",
              },
              {
                t: "West Midlands coverage",
                d: "Covering Birmingham, Smethwick, Quinton, Harborne, Sutton Coldfield and surrounding areas.",
              },
              {
                t: "High attention to detail",
                d: "From cable routes and containment to accessories, testing and final finish.",
              },
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

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="rounded-3xl hairline p-8 sm:p-10 bg-card/40">
          <h2 className="text-3xl font-bold">
            <span className="gradient-gold-text">Areas Covered</span>
          </h2>

          <p className="mt-3 text-muted-foreground">
            Sperin Services covers Birmingham and surrounding West Midlands
            areas.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {AREAS.map((area) => (
              <span
                key={area}
                className="rounded-full hairline px-4 py-2 bg-background/40"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="gradient-gold-text">Recent Work</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              A quick look at recent electrical and installation work.
            </p>
          </div>

          <Link
            to="/gallery"
            className="hidden sm:inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5"
          >
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[work1, work2, work3].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-2xl gold-border-glow">
              <img
                src={src}
                alt={`Recent electrical work in Birmingham ${i + 1}`}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover hover:scale-105 transition duration-700"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm hover:bg-white/5"
          >
            View Full Gallery <ArrowRight className="h-4 w-4 text-gold" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 my-20">
        <div className="glass rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-gold-text">
              Electrical Services FAQs
            </span>
          </h2>

          <div className="mt-8 grid gap-5">
            {FAQS.map((item) => (
              <div key={item.q} className="rounded-2xl hairline p-5 bg-card/40">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
                  }
