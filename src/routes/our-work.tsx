import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera } from "lucide-react";
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
          "Genuine Sperin Services electrical, commercial and refurbishment projects across Birmingham and the West Midlands.",
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
        <span className="eyebrow">Completed projects</span>
        <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          Real work, shown properly.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          A closer look at genuine Sperin Services projects — electrical installations,
          commercial work and wider refurbishments, with the actual scope and finished result.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div
          className="mb-7 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter projects by category"
        >
          {projectCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full border px-3 py-2 text-xs transition ${
                category === c
                  ? "border-electric bg-electric/10 text-electric"
                  : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground"
              }`}
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
              Every project shown here will be genuine Sperin Services work.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-12 text-muted-foreground">No projects in this category yet.</p>
        ) : (
          <div className="space-y-6">
            {shown.map((project) => (
              <article
                key={project.slug}
                className="surface-raised group overflow-hidden rounded-2xl md:grid md:grid-cols-[1.15fr_.85fr]"
              >
                <Link
                  to="/our-work/$slug"
                  params={{ slug: project.slug }}
                  className="block overflow-hidden bg-black/20"
                  aria-label={`View ${project.title}`}
                >
                  <img
                    src={project.cover}
                    alt={project.photos[0]?.alt || project.title}
                    width="1120"
                    height="840"
                    loading="eager"
                    className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                  />
                </Link>

                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-electric">
                    {project.service} · {project.area} · {project.date}
                  </div>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{project.title}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {project.summary}
                  </p>
                  {project.scope?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.scope.slice(0, 4).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-foreground/70"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    to="/our-work/$slug"
                    params={{ slug: project.slug }}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-electric"
                  >
                    View project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
