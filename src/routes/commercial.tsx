import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Cable,
  ClipboardCheck,
  DoorOpen,
  Lightbulb,
  Phone,
  Wrench,
} from "lucide-react";
import { CTA } from "@/components/CTA";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/commercial")({
  head: () => ({
    meta: [
      { title: "Commercial Electrician Birmingham & West Midlands | Sperin Services" },
      {
        name: "description",
        content:
          "Commercial electrical work across Birmingham and the West Midlands: EICRs, remedials, lighting, emergency lighting, power, distribution, access control, fault finding and refurbishment works.",
      },
      { property: "og:title", content: "Commercial Electrical | Sperin Services" },
      {
        property: "og:description",
        content: "Electrical work for schools, offices, shops, landlords and small commercial premises across the West Midlands.",
      },
    ],
  }),
  component: Commercial,
});

const CAPABILITIES = [
  {
    icon: ClipboardCheck,
    title: "Inspection, EICRs & remedials",
    text: "Inspection and testing for commercial premises, with faults and remedial requirements explained clearly rather than reduced to a code list with no context.",
  },
  {
    icon: Lightbulb,
    title: "Lighting & emergency lighting",
    text: "Alterations, upgrades, emergency lighting and practical controls for classrooms, offices, circulation areas, toilets, stores and external areas.",
  },
  {
    icon: DoorOpen,
    title: "Access control & door entry",
    text: "Power, containment and wiring for access-controlled doors, readers, locks, intercoms and fire-alarm release interfaces where specified.",
  },
  {
    icon: Cable,
    title: "Power, distribution & containment",
    text: "New circuits, alterations, distribution work, containment and supplies for equipment, with routes and future access considered before installation.",
  },
  {
    icon: Wrench,
    title: "Refurbishment & alterations",
    text: "Electrical work within refurbishments and change-of-use projects, coordinated around other trades, finishes and the programme rather than treated as an isolated task.",
  },
  {
    icon: BadgeCheck,
    title: "Testing, handover & documentation",
    text: "Inspection, testing and appropriate certification or handover information so completed work is not left as an undocumented alteration.",
  },
];

function Commercial() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 lg:px-8 lg:pb-18 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.14fr_.86fr] lg:items-stretch">
          <div className="py-3 lg:py-8">
            <span className="eyebrow">Commercial electrical · West Midlands</span>
            <h1 className="display-title mt-5 max-w-5xl text-5xl sm:text-6xl lg:text-[5.1rem]">
              Electrical work for premises that have to
              <span className="text-electric"> keep working.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Planned electrical work for schools, nurseries, offices, shops, landlords and small commercial premises — from testing and remedials to lighting, power, access control and refurbishment work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="button-primary">
                Discuss a commercial job <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone}`} className="button-secondary">
                <Phone className="h-4 w-4 text-electric" /> {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          <aside className="surface-raised technical-grid rounded-2xl p-6 sm:p-8">
            <Building2 className="h-7 w-7 text-electric" />
            <h2 className="mt-6 text-3xl font-bold">Commercial without the generic contractor language.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The useful information is the scope: what is being altered, what must remain operational, what other trades are doing, what documentation is needed and how the programme affects access. That is what a quotation should be built around.
            </p>
            <div className="rule mt-7 pt-6 text-sm font-semibold text-foreground/90">
              Survey → scope → quotation → programme → installation → testing → handover
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <span className="eyebrow">Capability</span>
        <h2 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">The work is broader than a list of domestic services.</h2>
        <div className="mt-10 grid gap-x-10 gap-y-0 lg:grid-cols-2">
          {CAPABILITIES.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="rule grid grid-cols-[2.7rem_1fr] gap-4 py-6">
              <div className="pt-1">
                <Icon className="h-5 w-5 text-electric" />
              </div>
              <div>
                <div className="font-mono text-[11px] text-muted-foreground">0{index + 1}</div>
                <h3 className="mt-2 text-2xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="surface-raised rounded-2xl p-7 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <span className="eyebrow">Project information</span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">What helps produce a useful quotation.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Site address and type of premises",
                "Drawings or scope if one already exists",
                "What must remain live during the work",
                "Access restrictions and working hours",
                "Target dates or programme constraints",
                "Photos of boards, routes and affected areas",
                "Any known fire alarm or access-control interfaces",
                "Who is coordinating the other trades",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/88">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA title="Send the commercial scope, not just a one-line enquiry." subtitle="If you already have drawings, a schedule, photographs or an outline programme, mention that in the enquiry. It makes the first conversation much more useful." />
    </>
  );
}
