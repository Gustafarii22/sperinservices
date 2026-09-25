import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { projects, type ProjectPhoto } from "@/lib/projects";

export const Route = createFileRoute("/our-work/$slug")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData: project }) => ({
    links: [
      { rel: "canonical", href: `https://sperinservices.co.uk/our-work/${project?.slug || ""}` },
    ],
    meta: [
      { title: `${project?.title || "Project"} | Sperin Services` },
      { name: "description", content: project?.summary || "Sperin Services project" },
      ...(project?.cover
        ? [
            {
              property: "og:image",
              content: `https://sperinservices.co.uk${project.cover}`,
            },
          ]
        : []),
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  const [active, setActive] = useState<ProjectPhoto | null>(null);
  const related = projects
    .filter((p) => p.slug !== project.slug && p.service === project.service)
    .slice(0, 3);
  const gallery = project.photos.slice(1);

  useEffect(() => {
    if (!active) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [active]);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-12 lg:px-8 lg:pt-18">
        <Link to="/our-work" className="text-sm font-semibold text-electric">
          ← All completed projects
        </Link>
        <p className="eyebrow mt-9">
          {project.service} · {project.area} · {project.date}
        </p>
        <h1 className="display-title mt-4 max-w-5xl text-5xl sm:text-6xl lg:text-7xl">
          {project.title}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {project.description}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <button
          type="button"
          onClick={() => setActive(project.photos[0])}
          className="group block w-full overflow-hidden rounded-2xl bg-black/20 text-left"
        >
          <img
            src={project.cover}
            alt={project.photos[0]?.alt || project.title}
            width="1400"
            height="1050"
            className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
          />
        </button>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:py-16">
        <div>
          <span className="eyebrow">Project scope</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">One coordinated refurbishment.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            The job covered the wider space as well as the electrical installation, so the finished
            result could be delivered as a complete area rather than separate isolated packages.
          </p>
        </div>

        {project.scope?.length ? (
          <div className="grid gap-x-8 sm:grid-cols-2">
            {project.scope.map((item) => (
              <div
                key={item}
                className="rule flex items-start gap-3 py-4 text-sm leading-relaxed text-foreground/88"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {gallery.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8 lg:pb-14">
          <div className="border-b border-white/10 pb-6">
            <span className="eyebrow">Finished details</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">A few details from the completed job.</h2>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {gallery.map((photo) => (
              <button
                type="button"
                key={photo.src}
                onClick={() => setActive(photo)}
                className="group overflow-hidden rounded-xl bg-black/20 text-left"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width="900"
                  height="675"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <span className="block px-1 pt-3 text-sm leading-relaxed text-muted-foreground">
                  {photo.alt}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="surface-raised rounded-2xl p-7 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="eyebrow">Planning something similar?</span>
              <h2 className="mt-4 text-3xl font-bold">Talk through the whole scope.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                If the project involves electrical work alongside refurbishment, send the drawings,
                photographs or outline scope and we can look at the job as a whole.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/contact" className="button-primary">
                Request similar work
              </Link>
              {project.relatedService && (
                <a href={project.relatedService} className="button-secondary">
                  Commercial services
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <h2 className="text-2xl font-bold">Related projects</h2>
          <div className="mt-5 flex flex-wrap gap-4">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/our-work/$slug"
                params={{ slug: p.slug }}
                className="button-secondary"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project photograph"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-5"
        >
          <button
            type="button"
            aria-label="Close photograph"
            className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/50 p-2 text-white"
            onClick={() => setActive(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={active.src}
            alt={active.alt}
            className="max-h-[88vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
