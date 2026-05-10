import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CTA } from "@/components/CTA";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";
import imgRewires from "@/assets/svc-rewires.jpg";
import imgCU from "@/assets/svc-consumer-unit.jpg";
import imgEV from "@/assets/svc-ev.jpg";
import imgSmart from "@/assets/svc-smart.jpg";
import imgTesting from "@/assets/svc-testing.jpg";
import imgKitchen from "@/assets/svc-kitchen.jpg";

const ALL = [
  { src: imgRewires, cat: "Rewires", alt: "Domestic rewire — sockets and cables" },
  { src: work1, cat: "Rewires", alt: "Tidy first fix in a UK loft" },
  { src: imgCU, cat: "Consumer Units", alt: "Modern consumer unit installation" },
  { src: work2, cat: "Consumer Units", alt: "Labelled consumer unit" },
  { src: imgEV, cat: "EV Chargers", alt: "Home EV charger on UK brick wall" },
  { src: work3, cat: "EV Chargers", alt: "Tidy EV charger install" },
  { src: imgSmart, cat: "Smart Home", alt: "Smart home control with phone app" },
  { src: imgKitchen, cat: "Kitchens & Bathrooms", alt: "Modern kitchen with pendant lighting" },
  { src: imgTesting, cat: "Testing", alt: "Electrical testing of a consumer unit" },
] as const;

const CATS = ["All", "Rewires", "Consumer Units", "EV Chargers", "Smart Home", "Kitchens & Bathrooms", "Testing"] as const;

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Recent Work — Sperin Services" },
      { name: "description", content: "Recent work from Sperin Services across the West Midlands — rewires, consumer units, EV chargers, smart home, kitchens, bathrooms and testing." },
      { property: "og:title", content: "Gallery — Sperin Services" },
      { property: "og:description", content: "Recent work across the West Midlands." },
      { property: "og:image", content: imgKitchen },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const items = cat === "All" ? ALL : ALL.filter((i) => i.cat === cat);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 lg:px-8 pt-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1 text-xs text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold glow-gold" /> Recent Work
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold">
            <span className="gradient-gold-text">Gallery</span>
          </h1>
          <p className="mt-3 text-muted-foreground">A look at our recent installs across the West Midlands.</p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                cat === c
                  ? "gradient-gold text-primary-foreground shadow-gold"
                  : "hairline text-foreground/80 hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <figure key={i} className="overflow-hidden rounded-2xl gold-border-glow group">
              <img
                src={it.src}
                alt={it.alt}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-700"
              />
              <figcaption className="px-4 py-3 text-xs text-muted-foreground bg-card/40 flex justify-between">
                <span>{it.alt}</span>
                <span className="text-gold">{it.cat}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <CTA />
    </>
  );
}
