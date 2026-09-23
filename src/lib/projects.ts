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
  products?: string[];
  relatedService?: string;
  relatedReviewId?: string;
  featured?: boolean;
};
export const projects: Project[] = [];
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
