import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export type FAQItem = { q: string; a: string };

export function FAQ({ items, title = "Frequently Asked Questions" }: { items: FAQItem[]; title?: string }) {
  return (
    <section className="mx-auto max-w-4xl px-4 lg:px-8 my-20">
      <h2 className="text-3xl sm:text-4xl font-bold text-center">
        <span className="gradient-gold-text">{title}</span>
      </h2>
      <div className="mt-10 space-y-3">
        {items.map((it, i) => (
          <FAQRow key={i} item={it} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((it) => ({
              "@type": "Question",
              name: it.q,
              acceptedAnswer: { "@type": "Answer", text: it.a },
            })),
          }),
        }}
      />
    </section>
  );
}

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-foreground">{item.q}</span>
        {open ? (
          <Minus className="h-5 w-5 text-gold shrink-0" />
        ) : (
          <Plus className="h-5 w-5 text-gold shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{item.a}</div>
      )}
    </div>
  );
}
