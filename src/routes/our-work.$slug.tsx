import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { projects } from "@/lib/projects";

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
    ],
  }),
  component: ProjectPage,
});
function ProjectPage() {
  const project = Route.useLoaderData();
  const [active, setActive] = useState<string | null>(null);
  const related = projects
    .filter((p) => p.slug !== project.slug && p.service === project.service)
    .slice(0, 3);
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Link to="/our-work" className="text-sm text-electric">
        ← All genuine projects
      </Link>
      <p className="eyebrow mt-9">
        {project.service} · {project.area} · {project.date}
      </p>
      <h1 className="display-title mt-4 text-5xl">{project.title}</h1>
      <p className="mt-5 max-w-3xl text-muted-foreground">{project.description}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {project.photos.map((photo, index) => (
          <button
            type="button"
            key={photo.src}
            onClick={() => setActive(photo.src)}
            className="overflow-hidden rounded-xl text-left"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              width="900"
              height="675"
              loading={index ? "lazy" : "eager"}
              className="aspect-[4/3] w-full object-cover"
            />
            <span className="mt-2 block text-sm capitalize text-muted-foreground">
              {photo.stage} · {photo.alt}
            </span>
          </button>
        ))}
      </div>
      {project.products?.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Equipment used</h2>
          <p className="mt-3 text-muted-foreground">{project.products.join(" · ")}</p>
        </section>
      ) : null}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/contact" className="button-primary">
          Request similar work
        </Link>
        {project.relatedService && (
          <a href={project.relatedService} className="button-secondary">
            Explore this service
          </a>
        )}
      </div>
      {related.length > 0 && (
        <section className="mt-16">
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
            aria-label="Close photograph"
            className="absolute right-6 top-6 text-3xl text-white"
            onClick={() => setActive(null)}
          >
            ×
          </button>
          <img
            src={active}
            alt={project.title}
            className="max-h-[85vh] max-w-full object-contain"
          />
        </div>
      )}
    </main>
  );
}
