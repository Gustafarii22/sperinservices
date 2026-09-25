/** Only add projects with photographs and permission to identify them as Sperin Services work. */
export type ProjectPhoto = { src: string; alt: string; stage: "before" | "during" | "after" };
export type Project = {
  slug: string;
  title: string;
  service: string;
  area: string;
  date: string;
  summary: string;
  description: string;
  cover: string;
  photos: ProjectPhoto[];
  scope?: string[];
  products?: string[];
  relatedService?: string;
  relatedReviewId?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "rowley-park-primary-academy-refurbishment",
    title: "Rowley Park Primary Academy — Early Years Refurbishment",
    service: "Commercial",
    area: "Stafford",
    date: "2026",
    summary:
      "A complete refurbishment of the academy's early-years area, delivered as one coordinated project covering structural alterations, the full electrical installation, lighting, access control, flooring, decorating and carpentry.",
    description:
      "Sperin Services delivered the refurbishment of an early-years area at Rowley Park Primary Academy in Stafford. The existing space was stripped back and reconfigured, with alterations to walls and ceilings followed by a full electrical installation for the refurbished area. The works also included general and emergency lighting, distribution and power, access-control and emergency door-release equipment, flooring, decorating, carpentry and final finishing. Managing the work as one coordinated project helped keep the electrical installation, building alterations and finished environment working together from the outset.",
    cover: "/projects/rowley-park/rowley-park-overview.webp",
    photos: [
      {
        src: "/projects/rowley-park/rowley-park-overview.webp",
        alt: "Completed early-years refurbishment at Rowley Park Primary Academy",
        stage: "after",
      },
      {
        src: "/projects/rowley-park/rowley-park-kitchen.webp",
        alt: "Completed kitchen and preparation area with new lighting and electrical installation",
        stage: "after",
      },
      {
        src: "/projects/rowley-park/rowley-park-board.webp",
        alt: "Consumer unit and circuit protection serving the refurbished area",
        stage: "after",
      },
      {
        src: "/projects/rowley-park/rowley-park-access-control.webp",
        alt: "Access-control reader and emergency door-release equipment",
        stage: "after",
      },
      {
        src: "/projects/rowley-park/rowley-park-rest-area.webp",
        alt: "Completed rest area with general and emergency lighting",
        stage: "after",
      },
      {
        src: "/projects/rowley-park/rowley-park-entrance.webp",
        alt: "Completed entrance area with lighting and door-access equipment",
        stage: "after",
      },
    ],
    scope: [
      "Strip-out and alterations to walls and ceilings",
      "Full electrical installation for the refurbished area",
      "General lighting and emergency lighting",
      "Distribution, power and controls",
      "Access control and emergency door release",
      "Flooring",
      "Decorating",
      "Carpentry and finishing work",
      "Inspection, testing and handover",
    ],
    relatedService: "/commercial",
    featured: true,
  },
];

export const projectCategories = [
  "All",
  "Rewires",
  "Consumer Units",
  "EV Chargers",
  "Testing & Inspection",
  "Smart Home",
  "Kitchens",
  "Bathrooms",
  "Commercial",
  "Building Work",
];
