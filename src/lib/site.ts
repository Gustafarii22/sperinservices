export const SITE = {
  name: "Sperin Services",
  tagline: "Premium Electrical & Building Services",
  phone: "+447817360156",
  phoneDisplay: "07817 360156",
  whatsapp: "447817360156",
  email: "Gussysperin@yahoo.co.uk",
  website: "www.sperinservices.co.uk",
  areas: ["Birmingham", "Sutton Coldfield", "Tamworth", "West Midlands"],
  url: "https://www.sperinservices.co.uk",
};

export const SERVICES = [
  {
    slug: "rewires",
    path: "/services/rewires",
    title: "Full & Part Rewires",
    short: "Clean, planned domestic rewires",
    image: "rewires",
  },
  {
    slug: "consumer-units",
    path: "/services/consumer-units",
    title: "Consumer Unit Upgrades",
    short: "Modern fuse boards & RCBO protection",
    image: "consumer-unit",
  },
  {
    slug: "ev-chargers",
    path: "/services/ev-chargers",
    title: "EV Chargers",
    short: "Smart home EV charger installs",
    image: "ev",
  },
  {
    slug: "smart-home",
    path: "/services/smart-home",
    title: "Smart Home Automation",
    short: "App, voice & scene-controlled homes",
    image: "smart",
  },
  {
    slug: "testing",
    path: "/services/testing",
    title: "Testing & Certification",
    short: "Inspection, EICR & fault finding",
    image: "testing",
  },
  {
    slug: "kitchens-bathrooms",
    path: "/services/kitchens-bathrooms",
    title: "Kitchens & Bathrooms",
    short: "Electrical & building, beautifully finished",
    image: "kitchen",
  },
] as const;

export type ServiceSlug = (typeof SERVICES)[number]["slug"];
