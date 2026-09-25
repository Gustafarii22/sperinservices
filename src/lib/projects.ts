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
    slug: "nursery-refurbishment-west-midlands",
    title: "Nursery Refurbishment & Electrical Installation",
    service: "Commercial",
    area: "West Midlands",
    date: "2026",
    summary:
      "A complete nursery refurbishment covering the electrical installation, lighting, access control, flooring, decorating, carpentry and alterations to the space.",
    description:
      "Sperin Services took on the wider refurbishment of an existing nursery area, with the project covering alterations to walls and ceilings, a full electrical installation for the refurbished space, new lighting and emergency lighting, access control and emergency door-release equipment, power and controls, flooring, decorating and carpentry. The result is a brighter, practical space finished as one coordinated project rather than a collection of separate trades.",
    cover: "/projects/nursery-refurbishment/nursery-overview.webp",
    photos: [
      {
        src: "/projects/nursery-refurbishment/nursery-overview.webp",
        alt: "Completed nursery refurbishment with new lighting, flooring and electrical installation",
        stage: "after",
      },
      {
        src: "/projects/nursery-refurbishment/staff-kitchen.webp",
        alt: "Completed kitchen and staff area within the nursery refurbishment",
        stage: "after",
      },
      {
        src: "/projects/nursery-refurbishment/distribution-board.webp",
        alt: "Labelled distribution board serving the refurbished nursery area",
        stage: "after",
      },
      {
        src: "/projects/nursery-refurbishment/access-control.webp",
        alt: "Access control, video entry and emergency door-release installation",
        stage: "after",
      },
    ],
    scope: [
      "Strip-out and alterations to walls and ceilings",
      "Full electrical installation for the refurbished area",
      "General lighting and emergency lighting",
      "Distribution, power and controls",
      "Access control, video entry and emergency door release",
      "Flooring",
      "Decorating",
      "Carpentry and finishing work",
      "Testing and handover",
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
