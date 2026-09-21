export const SITE = {
  name: "Sperin Services",
  tagline: "Electrical work for homes, businesses and commercial premises",
  phone: "+447817360156",
  phoneDisplay: "07817 360156",
  whatsapp: "447817360156",
  email: "info@sperinservices.co.uk",
  website: "sperinservices.co.uk",
  url: "https://sperinservices.co.uk",
  founded: 2010,
  industrySince: 2003,
  areas: [
    "Birmingham",
    "Smethwick",
    "Quinton",
    "Harborne",
    "Oldbury",
    "Halesowen",
    "West Bromwich",
    "Solihull",
    "Dudley",
    "Walsall",
    "Sutton Coldfield",
    "Tamworth",
  ],
  qualifications: [
    "City & Guilds 2360 Parts 1 & 2",
    "City & Guilds 2391 Inspection & Testing",
    "18th Edition Wiring Regulations",
  ],
};

export const SERVICES = [
  {
    slug: "rewires",
    path: "/services/rewires",
    title: "Full & Part Rewires",
    short: "Planned rewires, alterations and extensions",
    image: "rewires",
  },
  {
    slug: "consumer-units",
    path: "/services/consumer-units",
    title: "Consumer Unit Upgrades",
    short: "Modern protection, testing and clear labelling",
    image: "consumer-unit",
  },
  {
    slug: "testing",
    path: "/services/testing",
    title: "Inspection & Testing",
    short: "EICRs, certification, fault finding and remedials",
    image: "testing",
  },
  {
    slug: "ev-chargers",
    path: "/services/ev-chargers",
    title: "EV Charging",
    short: "Home and small-commercial charging installations",
    image: "ev",
  },
  {
    slug: "smart-home",
    path: "/services/smart-home",
    title: "Smart & Connected Systems",
    short: "Lighting, controls, security wiring and automation",
    image: "smart",
  },
  {
    slug: "kitchens-bathrooms",
    path: "/services/kitchens-bathrooms",
    title: "Kitchens & Bathrooms",
    short: "Electrical work integrated with the wider project",
    image: "kitchen",
  },
] as const;

export type ServiceSlug = (typeof SERVICES)[number]["slug"];
