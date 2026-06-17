/**
 * The atlas index. Two projects are live; the rest are placeholders the owner
 * will flesh out. `url` makes a card a link; without it the card reads as
 * forthcoming. Copy here is placeholder except the two live entries.
 */

export type ProjectStatus = "live" | "in-progress" | "concept";

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  field: string; // short category, e.g. "Rural futures"
  status: ProjectStatus;
  url?: string; // external link if it exists
  path?: string; // internal path served within this site (reverse-proxied zone)
  image?: string; // card thumbnail (else a hatch plate)
}

export const projects: Project[] = [
  {
    id: "hollow-villages",
    title: "The Hollow Villages",
    tagline:
      "An AI oracle forecasting how depopulating rural villages could be revived — people write it letters; it answers with grounded, cited plans and a picture of the place in 2050.",
    year: "2026",
    field: "Rural futures",
    status: "live",
    path: "/hollow-villages", // the full project, served within this site
    image: "/projects/hollow-villages.jpg",
  },
  {
    id: "underground-intelligence",
    title: "Underground Intelligence",
    tagline:
      "An investigation into the unseen systems beneath everyday life, built on a traceable evidence base where every claim links back to its source.",
    year: "2025",
    field: "Systems & evidence",
    status: "live",
    path: "/underground-intelligence", // the full project, served within this site
    image: "/projects/underground-intelligence.jpg",
  },
  {
    id: "long-now-ledger",
    title: "The Long Now Ledger",
    tagline:
      "Placeholder — a speculative account book for decisions whose costs and returns land centuries from now.",
    year: "2026",
    field: "Deep time",
    status: "in-progress",
  },
  {
    id: "after-work",
    title: "After Work",
    tagline:
      "Placeholder — what a day, a street, and a life look like once paid work stops being the organising centre of them.",
    year: "2026",
    field: "Labour & life",
    status: "concept",
  },
  {
    id: "coastlines-2100",
    title: "Coastlines 2100",
    tagline:
      "Placeholder — a navigable atlas of the shorelines we are about to lose and the new ones we will have to learn.",
    year: "2026",
    field: "Climate & place",
    status: "in-progress",
  },
  {
    id: "seed-vault-letters",
    title: "The Seed Vault Letters",
    tagline:
      "Placeholder — correspondence between the people storing the future of food and the ones who will have to plant it.",
    year: "2025",
    field: "Food futures",
    status: "concept",
  },
  {
    id: "synthetic-commons",
    title: "Synthetic Commons",
    tagline:
      "Placeholder — designing shared resources for a world where the most valuable materials are grown, printed, and licensed.",
    year: "2026",
    field: "Materials & ownership",
    status: "in-progress",
  },
  {
    id: "grid-down",
    title: "Grid Down",
    tagline:
      "Placeholder — a calm field guide to the first seventy-two hours, and the first seventy-two years, after the power stays off.",
    year: "2025",
    field: "Resilience",
    status: "concept",
  },
  {
    id: "the-repair-economy",
    title: "The Repair Economy",
    tagline:
      "Placeholder — what cities, jobs, and shops look like when fixing things finally beats replacing them.",
    year: "2026",
    field: "Circular futures",
    status: "concept",
  },
  {
    id: "migration-weather",
    title: "Migration Weather",
    tagline:
      "Placeholder — forecasting human movement the way we forecast storms: as a system, not a series of emergencies.",
    year: "2026",
    field: "Mobility & borders",
    status: "in-progress",
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  "in-progress": "In progress",
  concept: "Concept",
};
