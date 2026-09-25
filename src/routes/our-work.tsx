import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ArrowRight } from "lucide-react";
import { useState } from "react";
import { projects, projectCategories } from "@/lib/projects";
export const Route = createFileRoute("/our-work")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/our-work" }],
    meta: [
      { title: "Our Work | Sperin Services" },
      {
        name: "description",
        content:
          "Real Sperin Services electrical and installation projects across Birmingham and the West Midlands.",
      },
    ],
  }),
  component: OurWork,
});
function OurWork() {
  const [category, setCategory] = useState("All");
  const shown = category === "All" ? projects : projects.filter((p) => p.service === category);
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pt-18">
        <span className="eyebrow">Real work</span>
        <h1 className="display-title mt-5 text-5xl sm:text-6xl lg:text-7xl">
          Electrical work, in detail.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          A closer look at Sperin Services projects, from the first fix to the finished
          installation.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter projects by category"
        >
          {projectCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full border px-3 py-2 text-xs ${category === c ? "border-electric text-electric" : "border-white/15 text-muted-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {projects.length === 0 ? (
          <div className="surface-raised rounded-2xl p-8 sm:p-12">
            <Camera className="h-8 w-8 text-electric" />
            <h2 className="mt-5 text-3xl font-bold">Project photographs are on their way.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              We’re preparing photographs and notes from our own installations. Every project shown
              here will be genuine Sperin Services work. In the meantime, talk to Gus about the work
              you need.
            </p>
            <Link to="/contact" className="button-primary mt-7">
              Discuss your project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-12 text-muted-foreground">No projects in this category yet.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <article key={p.slug} className="surface rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-electric">
                  {p.service} · {p.area}
                </div>
                <h2 className="mt-3 text-2xl font-bold">{p.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{p.summary}</p>
                <Link
                  to="/our-work/$slug"
                  params={{ slug: p.slug }}
                  className="mt-5 inline-block text-sm text-electric"
                >
                  View project →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
