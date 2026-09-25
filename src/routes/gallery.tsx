import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  DoorOpen,
  Lightbulb,
  PanelsTopLeft,
  Zap,
} from "lucide-react";
import { CTA } from "@/components/CTA";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Electrical Projects & Work | Sperin Services" },
      { name: "robots", content: "noindex,follow" },
      {
        name: "description",
        content:
          "Project capability from Sperin Services across domestic and commercial electrical work in Birmingham and the West Midlands.",
      },
      { property: "og:title", content: "Projects | Sperin Services" },
      {
        property: "og:description",
        content:
          "A project-led view of the electrical work Sperin Services undertakes across the West Midlands.",
      },
    ],
  }),
  component: Gallery,
});

const PROJECT_TYPES = [
  {
    icon: PanelsTopLeft,
    label: "Distribution",
    title: "Consumer units & distribution work",
    text: "Replacement boards, new circuits, alterations, protection upgrades, labelling, inspection and testing.",
  },
  {
    icon: ClipboardCheck,
    label: "Testing",
    title: "EICRs, fault finding & remedials",
    text: "Inspection and testing followed by practical remedial work where faults or non-compliances are identified.",
  },
  {
    icon: Lightbulb,
    label: "Lighting",
    title: "Lighting & emergency lighting",
    text: "New lighting, controls, occupancy sensors, emergency luminaires and alterations for homes and commercial premises.",
  },
  {
    icon: DoorOpen,
    label: "Access",
    title: "Access control & door entry",
    text: "Power, wiring and interfaces for readers, locks, intercoms and access-controlled doors where specified.",
  },
  {
    icon: Zap,
    label: "Installation",
    title: "Rewires, alterations & refurbishment",
    text: "First fix, second fix, new circuits and electrical work coordinated within refurbishment and change-of-use projects.",
  },
];

function Gallery() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pb-16 lg:pt-18">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
          <div>
            <span className="eyebrow">Projects / work</span>
            <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Proof should come from the work itself.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              This project archive is reserved for real Sperin Services work. Until genuine site
              photography is available, the page documents capability and scope rather than using
              stock imagery as evidence.
            </p>
          </div>
          <div className="surface rounded-2xl p-6 sm:p-7">
            <Camera className="h-6 w-6 text-electric" />
            <h2 className="mt-5 text-2xl font-bold">What will be added here</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Real site photographs only",
                "Location and project type",
                "What was installed or altered",
                "Testing / handover detail where relevant",
                "Before-and-after views when they add useful context",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="border-b border-white/10 pb-7">
          <span className="eyebrow">Current project disciplines</span>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Work the project archive will document.
          </h2>
        </div>
        <div>
          {PROJECT_TYPES.map(({ icon: Icon, label, title, text }, index) => (
            <article
              key={title}
              className="grid gap-4 border-b border-white/10 py-6 sm:grid-cols-[3rem_8rem_1fr_1fr] sm:items-start"
            >
              <Icon className="h-5 w-5 text-electric" />
              <span className="font-mono text-xs text-muted-foreground">
                0{index + 1} / {label}
              </span>
              <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="surface-raised rounded-2xl p-7 sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="eyebrow">Need evidence for a similar job?</span>
              <h2 className="mt-4 text-3xl font-bold">Tell us the project type you are pricing.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A useful conversation about scope is better than a gallery full of generic pictures.
                Once the real archive is populated, relevant case studies will be linked directly
                from the service pages.
              </p>
            </div>
            <Link to="/contact" className="button-primary">
              Discuss a project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
