/**
 * The atlas index. `visibility` decides who sees each entry: `live` is public,
 * `draft` shows only to a signed-in editor (and its URL is closed to everyone
 * else). This is the single source of truth for both, change the word here and
 * the listings, the nav switcher, the contact dropdown and the URL gate follow.
 *
 * `url` makes a card a link; without it the card reads as forthcoming.
 * `date` is the full publish/added date (YYYY-MM-DD), placeholders, adjust freely.
 */

export type ProjectStatus = "live" | "in-progress" | "concept";

/**
 * Publication state, independent of `status` (which describes how finished a
 * project is). `live` = anyone can see it. `draft` = only a signed-in editor
 * sees it listed, and the public is turned away from its URL (see
 * `src/middleware.ts`). Flip a project by changing this one word.
 */
export type ProjectVisibility = "live" | "draft";

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  date: string; // full date YYYY-MM-DD (used for ordering + display)
  field: string; // short category, e.g. "Rural futures"
  status: ProjectStatus;
  visibility: ProjectVisibility; // live = public; draft = editors only
  url?: string; // external link if it exists
  path?: string; // internal path served within this site (e.g. "/coastlines-2100")
  image?: string; // card thumbnail (else a hatch plate)
  accent?: string; // optional per-project accent colour (CSS value), set on the project layout
  inHub?: boolean; // true = a route group inside this app (scaffolded), with /<slug>/research + /contact
}

export const projects: Project[] = [
  {
    id: "magnifica",
    title: "Hypothetica Magnifica",
    tagline:
      "In May 2026 Pope Leo XIV published the first papal encyclical on AI. Explore the real Magnifica Humanitas, then read sixteen research-grounded, clearly-labeled speculative equivalents — what the Dalai Lama, the Grand Imam of Al-Azhar, the Archbishop of Canterbury and other world faith leaders might write about artificial intelligence.",
    year: "2026",
    date: "2026-08-11",
    field: "AI & faith",
    status: "live",
    visibility: "live",
    path: "/magnifica",
    image: "/projects/magnifica.jpg",
  },
  {
    id: "odds-of-surviving-ai",
    title: "The Odds",
    tagline:
      "The people who build and study AI have put odds on the risk. Roll the dice, spin the wheel, draw the card, and gamble on our future.",
    year: "2026",
    date: "2026-02-14",
    field: "AI & risk",
    status: "live",
    visibility: "live",
    path: "/theodds", // self-contained bundle served within this site (physically at /odds-of-surviving-ai/)
    image: "/projects/odds-of-surviving-ai.jpg",
  },
  {
    id: "signal-reactor",
    title: "Signal Reactor",
    tagline:
      "An organizational foresight instrument: name your organization, get an honest eight-slide briefing on what quantum and advanced AI actually mean for it, deflating the hype, redirecting to the real signal. AI-generated and labeled as such; built to structure a stakeholder conversation, not to make the decision.",
    year: "2026",
    date: "2026-07-02",
    field: "AI & risk",
    status: "live",
    visibility: "live",
    path: "/signal-reactor",
    image: "/projects/signal-reactor-2.jpg",
  },
  {
    id: "quantum-spark",
    title: "Quantum Spark",
    tagline:
      "Signal Reactor's energized companion: type your industry and get five bold, grounded glimpses of how quantum computing and next-wave AI will transform it, the kind of insight that makes a room lean forward. Grounded hype with an honest label: provocations to spark conversation, not forecasts.",
    year: "2026",
    date: "2026-07-03",
    field: "AI & risk",
    status: "live",
    visibility: "live",
    path: "/quantum-spark",
    image: "/projects/quantum-spark-2.jpg",
  },
  {
    id: "counterfactual-ai-index",
    title: "The Counterfactual Index",
    tagline:
      "The 2026 Stanford AI Index, rebuilt from the report's own published CSVs so the numbers are theirs rather than an approximation of theirs, then redrawn under decisions nobody took. Say what you would do about AI and when: sixteen figures move, or say plainly that they don't and name the lever that was missing. An intervention never invents a data point. It emits a typed, dated transform over the real series, carrying a stated reason and a confidence you can argue with.",
    year: "2026",
    date: "2026-08-13",
    field: "AI & policy",
    status: "live",
    visibility: "draft",
    path: "/counterfactual", // static bundle served within this site
    image: "/projects/counterfactual-ai-index.jpg",
  },
  {
    id: "counterfactual-quantum",
    title: "Counterfactual Quantum",
    tagline:
      "Quantum has no AI Index, so this board is assembled: publication counts pulled from OpenAlex and queried by topic, next to the two endpoints Quantum Delta NL's own report actually publishes. The Dutch programme runs out of Growth Fund money in 2028 and that report ends by asking what happens next, so four of the six interventions are versions of that question. Delft's output inflected in 2017, three years before the programme existed.",
    year: "2026",
    date: "2026-08-13",
    field: "Quantum & policy",
    status: "live",
    visibility: "draft",
    path: "/counterfactual/quantum",
    image: "/projects/counterfactual-quantum.jpg",
  },
  {
    id: "counterfactual-one",
    title: "One Figure: The Power",
    tagline:
      "Global AI data centre power capacity as a rising field of light, with the countries it passes on the way up (New Zealand, the Netherlands, New York State at peak) and the quarter each one is crossed. Pick a decision and the counterfactual is cut out of the glow as a solid shape, so the gap between them is the subject rather than something to infer from two lines. Underneath: what you changed, what you changed elsewhere, and what you left alone.",
    year: "2026",
    date: "2026-08-13",
    field: "AI & energy",
    status: "live",
    visibility: "draft",
    path: "/counterfactual/one",
    image: "/projects/counterfactual-one.jpg",
  },
  {
    id: "hyperscale",
    title: "Hyperscale",
    tagline:
      "A 3D management sim about the physical reality of the AI buildout, a compute campus in a river valley with a town next door. Mix grid, solar, wind, gas and batteries; keep GPU halls cool through heat waves and dust storms; watch the aquifer, the smog and civic sentiment as you grow toward a gigawatt. Full day–night cycle, seeded weather and markets, procedural audio.",
    year: "2026",
    date: "2026-07-01",
    field: "Simulation",
    status: "live",
    visibility: "draft",
    path: "/hyperscale",
    image: "/projects/hyperscale-2.jpg",
  },
  {
    id: "hollow-villages",
    title: "Village Oracle",
    tagline:
      "An AI oracle forecasting how depopulating rural villages could be revived, people write it letters; it answers with grounded, cited plans and a picture of the place in 2050.",
    year: "2026",
    date: "2026-04-10",
    field: "Rural futures",
    status: "live",
    visibility: "draft",
    path: "/village-oracle", // the full project, served within this site
    image: "/projects/hollow-villages.jpg",
  },
  {
    id: "generatives",
    title: "Generatives",
    tagline:
      "A generative-visual lab, an array of animated, embeddable treatments (flow fields, noise, interference) for the project's visual language. Each one tunable, resizable to any banner, and copy-paste embeddable.",
    year: "2026",
    date: "2026-06-19",
    field: "Generative visuals",
    status: "in-progress",
    visibility: "live",
    path: "/generatives", // self-contained Vite static bundle (dashboard + embed player)
    image: "/projects/generatives-4.jpg",
  },
  {
    id: "swipe-the-future",
    title: "Swipe the Future",
    tagline:
      "A calibration game with one question: has this already happened, or not yet? Forty sourced claims about what machines are doing in medicine, transport, work and law, half of them older than you would guess. Swipe, then see which futures everyone buys early and which ones arrived while nobody was looking.",
    year: "2026",
    date: "2026-06-23",
    field: "Calibration",
    status: "live",
    visibility: "live",
    path: "/swipe-the-future",
    image: "/projects/swipe-the-future.jpg",
  },
  {
    id: "swipe-v1",
    title: "Swipe the Future v1",
    tagline:
      "The first version, frozen: pick a job, swipe Believe or Doubt on six claims, get a calibration score. Kept playable beside the current game, which asks whether a thing has already happened rather than whether it is true.",
    year: "2026",
    date: "2026-06-23",
    field: "Calibration",
    status: "live",
    visibility: "draft",
    path: "/swipe-v1",
    image: "/projects/swipe-v1.jpg",
  },
  {
    id: "trajectories",
    title: "Trajectories",
    tagline:
      "A real-time sphere of luminous filaments: thousands of strands reach from a boiling core to the shell, bending through noise that grows with radius, while pulses of brightness flow outward and ripples bloom at the surface. A non-commercial reimplementation (WebGL) of Jeongho Park's “Collective Trajectories” (CC BY-NC 4.0).",
    year: "2026",
    date: "2026-06-28",
    field: "Generative visuals",
    status: "live",
    visibility: "draft",
    path: "/trajectories",
    image: "/projects/trajectories.jpg",
  },
  {
    id: "quantum-lag",
    title: "Quantum Lag",
    tagline:
      "An instrument from the Centre for Quantum & Society at TU Delft. Place twenty claims about quantum technology on a timeline, then find out where they actually sit. It measures a specific error: people put finished work in the future and unfinished work in the past.",
    year: "2026",
    date: "2026-08-13",
    field: "AI & risk",
    status: "live",
    visibility: "draft",
    path: "/quantum-lag",
    image: "/projects/quantum-lag.jpg",
  },
  {
    id: "quantum-dominance",
    title: "Quantum Dominance",
    tagline:
      "Speculative satire: one official 'quantum dominance' post, two lenses. Pick The Dystopia or The Backfire and explore randomized futures, each anchored to something on the record, ready to push into the composer.",
    year: "2026",
    date: "2026-06-24",
    field: "AI & risk",
    status: "live",
    visibility: "draft",
    path: "/quantum-dominance",
    image: "/projects/quantum-dominance.jpg",
  },
  {
    id: "woodchipper",
    title: "Woodchipper Futures",
    tagline:
      "An interactive futures engine on the 2025 USAID cuts: take the January-2025 chair, abolish, freeze, audit or reform, and watch a fact-checked, source-cited constellation of outcomes branch out. Every figure links to its study.",
    year: "2026",
    date: "2026-06-23",
    field: "AI & risk",
    status: "live",
    visibility: "draft",
    path: "/woodchipper",
    image: "/projects/woodchipper.jpg",
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
    visibility: "live",
    path: "/underground-intelligence", // the full project, served within this site
    image: "/projects/underground-intelligence.jpg",
  },
  {
    id: "quantum-sandbox",
    title: "Quantum Sandbox",
    tagline:
      "A prototyping dashboard for quantum-computing generative systems, every amplitude drawn as colour, with magnitude as density and phase as hue.",
    year: "2026",
    date: "2026-05-28",
    field: "Quantum & computation",
    status: "in-progress",
    visibility: "draft",
    path: "/quantum-sandbox", // self-contained Vite static bundle served within this site
    image: "/projects/quantum-sandbox.jpg",
  },
  {
    id: "literal-frequency",
    title: "Literal Frequency",
    tagline:
      "Word-frequency visualisations built live from the Source Library, the open-access archive of digitised, translated books. Loads a book over the API and reads its vocabulary as a cloud, a word nebula, a bubble field, or bars, each view linking back to its source.",
    year: "2026",
    date: "2026-06-22",
    field: "Data visualisation",
    status: "in-progress",
    visibility: "draft",
    path: "/literal-frequency", // self-contained Vite static bundle served within this site
    image: "/projects/literal-frequency.jpg",
  },
  {
    id: "social-composer",
    title: "Social Composer",
    tagline:
      "A standalone social-post composer, post types, layouts, motion, and PNG / GIF / video export, with a URL “transmutate” importer that pulls the reusable pieces out of any article.",
    year: "2026",
    date: "2026-06-17",
    field: "Creative tools",
    status: "live",
    visibility: "draft",
    path: "/social-composer", // self-contained Next static export served within this site
    image: "/projects/social-composer.jpg",
  },
];

// Display order is curated by the owner, the array order above IS the order.
export const projectsOrdered: Project[] = [...projects];

/** Everything the public may see. */
export const liveProjects: Project[] = projectsOrdered.filter((p) => p.visibility === "live");

/** Unpublished work, listed only for a signed-in editor. */
export const draftProjects: Project[] = projectsOrdered.filter((p) => p.visibility === "draft");

/** The list for the current viewer: editors get everything, the public gets live only. */
export function visibleProjects(isEditor: boolean): Project[] {
  return isEditor ? projectsOrdered : liveProjects;
}

/** The full listing regrouped for an editor: what the public sees first, drafts
 *  after. Curated order is kept inside each group. */
export const editorOrdered: Project[] = [...liveProjects, ...draftProjects];

/** The distinct category tags (from `field`) present in a given list. */
export function fieldsOf(items: Project[]): string[] {
  return Array.from(new Set(items.map((p) => p.field)));
}

/** The distinct category tags across the public listing. */
export const projectFields: string[] = fieldsOf(liveProjects);

/** In-site paths belonging to draft projects, what the middleware gate closes. */
export const draftPaths: string[] = draftProjects.flatMap((p) => (p.path ? [p.path] : []));

/**
 * True if `pathname` is a draft project's page (the path itself or anything
 * under it). Runs in Edge middleware, so it stays plain string work.
 */
export function isDraftPath(pathname: string): boolean {
  return draftPaths.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

/** "2026-06-20" → "20 Jun 2026". */
export function formatProjectDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

/** The shared Project dropdown list for every contact form across the family.
 *  Adding a live project (with a `path`) makes it appear here automatically;
 *  drafts stay out of it, since the public can't reach them. */
export const contactProjects: string[] = [
  "Futures Atlas",
  ...liveProjects.filter((p) => p.path).map((p) => p.title),
  "Another project / general",
];
