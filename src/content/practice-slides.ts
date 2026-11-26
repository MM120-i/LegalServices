import { practiceAreas } from "./services";

const presentation: Record<(typeof practiceAreas)[number]["slug"], {
  summary: string;
  alt: string;
}> = {
  "traffic-tickets-provincial-offences": {
    summary: "Understand the charge, your options, and what comes next.",
    alt: "Vehicles travelling along a divided highway",
  },
  "accident-benefits-claims": {
    summary: "Make sense of benefit decisions and disputes after a motor vehicle accident.",
    alt: "A person reviewing and signing paperwork at a desk",
  },
  "refugee-hearings-appeals": {
    summary: "Ask about preparation for Immigration and Refugee Board hearings.",
    alt: "A Canadian flag flying outside a building in Toronto",
  },
  "landlord-tenant-matters": {
    summary: "Clear guidance on rental notices, hearings, and housing disputes.",
    alt: "The balconies and windows of an apartment building",
  },
  "employment-human-rights-matters": {
    summary: "Understand your options for workplace issues and discrimination concerns.",
    alt: "Two professionals shaking hands in a business setting",
  },
  "small-claims-court-matters": {
    summary: "Get help preparing a claim or responding to one.",
    alt: "The Frontenac County Courthouse in Kingston, Ontario",
  },
};

export const practiceSlides = practiceAreas.map((service) => ({
  title: service.title,
  href: service.href,
  image: `/practice-areas/${service.slug}.webp`,
  ...presentation[service.slug],
}));
