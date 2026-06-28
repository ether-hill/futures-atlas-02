/**
 * The atlas index. Two projects are live; the rest are placeholders the owner
 * will flesh out. `url` makes a card a link; without it the card reads as
 * forthcoming. Copy here is placeholder except the two live entries.
 * `date` is the full publish/added date (YYYY-MM-DD) — placeholders, adjust freely.
 */

export type ProjectStatus = "live" | "in-progress" | "concept";

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  date: string; // full date YYYY-MM-DD (used for ordering + display)
  field: string; // short category, e.g. "Rural futures"
  status: ProjectStatus;
  url?: string; // external link if it exists
  path?: string; // internal path served within this site (e.g. "/coastlines-2100")
  image?: string; // card thumbnail (else a hatch plate)
  accent?: string; // optional per-project accent colour (CSS value), set on the project layout
  inHub?: boolean; // true = a route group inside this app (scaffolded), with /<slug>/research + /contact
}

export const projects: Project[] = [
  {
    id: "hyperscale",
    title: "Hyperscale",
    tagline:
      "A data-center management sim about the physical reality behind the compute boom. Lay racks, substations and cooling on the floor, then keep power, heat, compute and cash in balance as demand climbs — underfeed power or fall behind on cooling and machines throttle, then fail. Seeded runs, replayable to the day.",
    year: "2026",
    date: "2026-06-28",
    field: "Simulation",
    status: "live",
    path: "/hyperscale",
  },
  {
    id: "quantum-dominance",
    title: "Quantum Dominance",
    tagline:
      "Speculative satire: one official 'quantum dominance' post, two lenses. Pick The Dystopia or The Backfire and explore randomized futures — each anchored to something on the record, ready to push into the composer.",
    year: "2026",
    date: "2026-06-24",
    field: "AI & risk",
    status: "live",
    path: "/quantum-dominance",
    image: "/projects/quantum-dominance.jpg",
  },
  {
    id: "woodchipper",
    title: "Woodchipper Futures",
    tagline:
      "An interactive futures engine on the 2025 USAID cuts: take the January-2025 chair — abolish, freeze, audit or reform — and watch a fact-checked, source-cited constellation of outcomes branch out. Every figure links to its study.",
    year: "2026",
    date: "2026-06-23",
    field: "AI & risk",
    status: "live",
    path: "/woodchipper",
    image: "/projects/woodchipper.jpg",
  },
  {
    id: "swipe-the-future",
    title: "Swipe the Future",
    tagline:
      "A calibration game: pick your line of work, swipe Believe or Doubt on six source-checked claims about AI and quantum, then see how far your gut sat from where the evidence actually lands.",
    year: "2026",
    date: "2026-06-23",
    field: "Calibration",
    status: "live",
    path: "/swipe-the-future",
    image: "/projects/swipe-the-future.jpg",
  },
  {
    id: "hollow-villages",
    title: "The Hollow Villages",
    tagline:
      "An AI oracle forecasting how depopulating rural villages could be revived — people write it letters; it answers with grounded, cited plans and a picture of the place in 2050.",
    year: "2026",
    date: "2026-04-10",
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
    date: "2025-11-30",
    field: "Systems & evidence",
    status: "live",
    path: "/underground-intelligence", // the full project, served within this site
    image: "/projects/underground-intelligence.jpg",
  },
  {
    id: "odds-of-surviving-ai",
    title: "The Odds",
    tagline:
      "An interactive that plays three public p(doom) estimates — Amodei’s die, Musk’s wheel, Tegmark’s deck — as games of chance, then asks what your survival odds really are.",
    year: "2026",
    date: "2026-02-14",
    field: "AI & risk",
    status: "live",
    path: "/theodds", // self-contained bundle served within this site (physically at /odds-of-surviving-ai/)
    image: "/projects/odds-of-surviving-ai.jpg",
  },
  {
    id: "quantum-sandbox",
    title: "Quantum Sandbox",
    tagline:
      "A prototyping dashboard for quantum-computing generative systems — every amplitude drawn as colour, with magnitude as density and phase as hue.",
    year: "2026",
    date: "2026-05-28",
    field: "Quantum & computation",
    status: "in-progress",
    path: "/quantum-sandbox", // self-contained Vite static bundle served within this site
    image: "/projects/quantum-sandbox.jpg",
  },
  {
    id: "generatives",
    title: "Generatives",
    tagline:
      "A generative-visual lab — an array of animated, embeddable treatments (flow fields, noise, interference) for the project's visual language. Each one tunable, resizable to any banner, and copy-paste embeddable.",
    year: "2026",
    date: "2026-06-19",
    field: "Generative visuals",
    status: "in-progress",
    path: "/generatives", // self-contained Vite static bundle (dashboard + embed player)
    image: "/projects/generatives.jpg",
  },
  {
    id: "literal-frequency",
    title: "Literal Frequency",
    tagline:
      "Word-frequency visualisations built live from the Source Library — the open-access archive of digitised, translated books. Loads a book over the API and reads its vocabulary as a cloud, a word nebula, a bubble field, or bars, each view linking back to its source.",
    year: "2026",
    date: "2026-06-22",
    field: "Data visualisation",
    status: "in-progress",
    path: "/literal-frequency", // self-contained Vite static bundle served within this site
    image: "/projects/literal-frequency.jpg",
  },
  {
    id: "social-composer",
    title: "Social Composer",
    tagline:
      "A standalone social-post composer — post types, layouts, motion, and PNG / GIF / video export, with a URL “transmutate” importer that pulls the reusable pieces out of any article.",
    year: "2026",
    date: "2026-06-17",
    field: "Creative tools",
    status: "live",
    path: "/social-composer", // self-contained Next static export served within this site
    image: "/projects/social-composer.jpg",
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  "in-progress": "In progress",
  concept: "Concept",
};

/** Projects newest-first (by `date`). */
export const projectsByDate: Project[] = [...projects].sort((a, b) => (a.date < b.date ? 1 : -1));

/** The distinct category tags (from `field`), for the projects-page filters. */
export const projectFields: string[] = Array.from(new Set(projects.map((p) => p.field)));

/** "2026-06-20" → "20 Jun 2026". */
export function formatProjectDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

/** The shared Project dropdown list for every contact form across the family.
 *  Adding a project (with a `path`) makes it appear here automatically. */
export const contactProjects: string[] = [
  "Futures Atlas",
  ...projects.filter((p) => p.path).map((p) => p.title),
  "Another project / general",
];
