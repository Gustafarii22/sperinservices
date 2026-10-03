import { SERVICES, SITE } from "@/lib/site";
import type { Project } from "@/lib/projects";

const businessId = `${SITE.url}/#business`;

function absoluteUrl(path: string) {
  if (path === "/") return SITE.url;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

const areaServed = () =>
  SITE.areas.map((name) => ({
    "@type": "City",
    name,
  }));

export function electricianJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Electrician",
    "@id": businessId,
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    logo: `${SITE.url}/sperin-logo.png`,
    image: absoluteUrl(SITE.socialImage),
    foundingDate: String(SITE.founded),
    areaServed: areaServed(),
    openingHoursSpecification: SITE.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.days.map((day) => `https://schema.org/${day}`),
      opens: hours.opens,
      closes: hours.closes,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "customer service",
      availableLanguage: "en",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Electrical services",
      itemListElement: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          url: absoluteUrl(service.path),
        },
      })),
    },
    knowsAbout: [
      "Electrical installation",
      "Electrical inspection and testing",
      "EICR",
      "Consumer units",
      "EV charging",
      "Commercial electrical work",
      "Access control",
      "Emergency lighting",
      "Smart home controls",
    ],
  };
}

export function serviceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    serviceType: name,
    description,
    url: absoluteUrl(path),
    provider: {
      "@id": businessId,
      "@type": "Electrician",
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone,
    },
    areaServed: areaServed(),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function projectJsonLd(project: Project) {
  const path = `/our-work/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(path)}#project`,
    name: project.title,
    description: project.summary,
    url: absoluteUrl(path),
    image: project.photos.map((photo) => absoluteUrl(photo.src)),
    dateCreated: project.date,
    spatialCoverage: {
      "@type": "Place",
      name: project.area,
    },
    creator: {
      "@id": businessId,
      "@type": "Electrician",
      name: SITE.name,
      url: SITE.url,
    },
    about: project.scope ?? [],
  };
}
