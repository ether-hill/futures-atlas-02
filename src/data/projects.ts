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
/*
  TYPE-ONLY, and it has to stay that way. scripts/gen-footer.mjs imports this
  file through Node's own ESM loader, which strips types but then resolves
  whatever imports survive — and it wants a file extension that TypeScript's
  bundler resolution will not accept here. A `type` import is erased before
  Node ever sees it. Anything from topics.ts that is needed at RUNTIME is used
  from topics.ts directly, by the component that needs it.
*/
import type { Topic } from "./topics";

export type ProjectVisibility = "live" | "draft";

/**
 * What a project IS, as opposed to what it is about.
 *
 * Two axes filter the listing and they answer different questions. This one is
 * "what will I be doing here" — reading, playing, looking, using. `topics` is
 * "what is it about", on the Atlas's shared vocabulary (data/topics.ts).
 * `field` is neither: it is the caption line on the card, kept because
 * "Waves & optics" reads better under a title than "Quantum" does.
 */
export type ProjectKind = "visuals" | "game" | "tool" | "story";

export const KIND_LABEL: Record<ProjectKind, string> = {
  visuals: "Visuals",
  game: "Game",
  tool: "Tool",
  story: "Story",
};

/** Listing order, so the filter row does not depend on the data's order. */
export const KIND_ORDER: ProjectKind[] = ["visuals", "game", "tool", "story"];

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  date: string; // full date YYYY-MM-DD (used for ordering + display)
  field: string; // caption line on the card, e.g. "Rural futures". Not a filter.
  kind: ProjectKind; // what it is: one of four, a filter row
  /**
   * What it is about, on the shared vocabulary. One or two, occasionally three.
   * MAY BE EMPTY, and four of them are: Generatives, Trajectories, Literal
   * Frequency and Social Composer are craft rather than argument, and a subject
   * invented for the sake of a filled row would be worse than an empty one.
   * They are still reachable — the topic row is a filter, not a requirement.
   */
  topics: Topic[];
  status: ProjectStatus;
  visibility: ProjectVisibility; // live = public; draft = editors only
  url?: string; // external link if it exists
  path?: string; // internal path served within this site (e.g. "/coastlines-2100")
  image?: string; // card thumbnail (else a hatch plate)
  cta?: string; // card link label when live, default "Open the project"
  accent?: string; // optional per-project accent colour (CSS value), set on the project layout
  inHub?: boolean; // true = a route group inside this app (scaffolded), with /<slug>/research + /contact
}

export const projects: Project[] = [
  /*
   * Two concepts, and nothing more than that yet.
   *
   * status "concept" (not "in-progress") is the honest word: there is no work
   * behind either of these, only a question worth asking. Their pages say so in
   * as many words rather than dressing a placeholder up as a preview. Nothing
   * here asserts an answer — the whole point is that the answer is not written.
   */
  {
    id: "slime-quantum",
    title: "Slime mould and quantum computing",
    tagline:
      "A slime mould in a maze explores every corridor at once. So, we are told, does a quantum computer. Where the comparison breaks is the project.",
    year: "2026",
    date: "2026-09-01",
    field: "Biology & computation",
    topics: ["Quantum"],
    kind: "story",
    status: "concept",
    visibility: "draft",
    path: "/slime-quantum",
    image: "/projects/slime-quantum.jpg",
  },
  {
    id: "throat-singing-quantum",
    title: "Feynman's Tuva",
    tagline:
      "Feynman spent a decade trying to reach Tuva and died weeks before the visas came. The physics, the throat singing, and the obsession.",
    year: "2026",
    date: "2026-09-01",
    field: "Sound & physics",
    topics: ["Quantum", "Society"],
    kind: "story",
    status: "concept",
    visibility: "draft",
    path: "/throat-singing-quantum",
    image: "/projects/throat-singing-quantum.jpg",
  },
  {
    id: "horizon-scan",
    title: "Horizon Scan",
    tagline:
      "A standing search across open research. Forty topic rules run against OpenAlex and arXiv once a day, and the ones that land in two subjects at once are what turn into projects.",
    year: "2026",
    date: "2026-08-31",
    field: "Foresight & evidence",
    topics: ["Futures"],
    kind: "tool",
    // `status` is how finished the thing is, `visibility` is who may see it.
    // The scan runs, so it is live work held back as a draft, which is what
    // every other draft here is. status "in-progress" makes the card read
    // "Forthcoming" instead of its cta.
    status: "live",
    visibility: "draft",
    path: "/horizon-scan",
    image: "/projects/horizon-scan.jpg",
    cta: "Open the scan",
  },
  {
    id: "glossary",
    title: "Glossary",
    tagline:
      "315 plain definitions for the vocabulary the rest of the Atlas assumes: AI, quantum computing, compute and policy. Written to be read cold.",
    year: "2026",
    date: "2026-08-20",
    field: "Reference",
    topics: ["Quantum", "AI", "Compute & energy"],
    kind: "tool",
    status: "live",
    visibility: "live",
    path: "/glossary",
    image: "/projects/glossary.jpg",
  },
  {
    id: "superposition",
    title: "Quantum Superposition Visuals",
    tagline:
      "Five branching processes from nature, running live. A picture of the possibility space, not of a fuzzy object.",
    year: "2026",
    date: "2026-09-01",
    field: "Waves & optics",
    topics: ["Quantum"],
    kind: "visuals",
    status: "live",
    visibility: "draft",
    path: "/superposition",
    image: "/projects/superposition.jpg",
    cta: "Open the fields",
  },
  {
    id: "interference",
    title: "Quantum Interference Visuals",
    tagline:
      "Quantum mechanics is hard to picture, so here is the part you can look at. Ten live wave fields, tunable, recolourable, and yours to embed.",
    year: "2026",
    date: "2026-08-31",
    field: "Waves & optics",
    topics: ["Quantum"],
    kind: "visuals",
    status: "live",
    visibility: "live",
    path: "/interference",
    image: "/projects/interference.jpg",
    cta: "Open the fields",
  },
  {
    id: "mappings",
    title: "Mappings",
    tagline:
      "One number, a map of records, and the evidence behind every dot. Swap the data domain and the same widgets argue about something else.",
    year: "2026",
    date: "2026-08-31",
    field: "Data & evidence",
    topics: ["Futures"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/mappings",
    image: "/projects/mappings.jpg",
  },
  {
    id: "magnifica",
    title: "Hypothetica Magnifica",
    tagline:
      "Pope Leo XIV wrote the first papal encyclical on AI. Read it, then sixteen labelled speculative ones from other faith leaders.",
    year: "2026",
    date: "2026-08-11",
    field: "AI & faith",
    topics: ["AI", "Society"],
    kind: "story",
    status: "live",
    visibility: "draft",
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
    topics: ["AI", "Safety & policy"],
    kind: "game",
    status: "live",
    visibility: "live",
    path: "/theodds", // self-contained bundle served within this site (physically at /odds-of-surviving-ai/)
    image: "/projects/odds-of-surviving-ai.jpg",
    cta: "Play the odds",
  },
  {
    id: "signal-reactor",
    title: "Signal Reactor",
    tagline:
      "Name your organisation and get an eight-slide briefing on what quantum and advanced AI actually mean for it. AI-written, labelled as such.",
    year: "2026",
    date: "2026-07-02",
    field: "AI & risk",
    topics: ["Quantum", "AI"],
    kind: "tool",
    status: "live",
    visibility: "live",
    path: "/signal-reactor",
    image: "/projects/signal-reactor-2.jpg",
  },
  {
    id: "quantum-spark",
    title: "Quantum Spark",
    tagline:
      "Type your industry, get five bold glimpses of how quantum and next-wave AI could change it. Provocations to open a room, labelled as such.",
    year: "2026",
    date: "2026-07-03",
    field: "AI & risk",
    topics: ["Quantum", "AI"],
    kind: "tool",
    status: "live",
    visibility: "live",
    path: "/quantum-spark",
    image: "/projects/quantum-spark-2.jpg",
  },
  {
    id: "manipulate-ai-index",
    title: "The Counterfactual Index",
    tagline:
      "The 2026 Stanford AI Index, rebuilt from its own CSVs. Say what you would do about AI and when, then watch sixteen figures answer.",
    year: "2026",
    date: "2026-08-13",
    field: "Manipulate the data",
    topics: ["AI"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/manipulate-the-data", // static bundle served within this site
    image: "/projects/manipulate-ai-index.jpg",
  },
  {
    id: "manipulate-quantum",
    title: "Counterfactual Quantum",
    tagline:
      "Quantum has no AI Index, so this one is assembled from OpenAlex and Quantum Delta NL. Dutch funding ends in 2028, and six levers ask what follows.",
    year: "2026",
    date: "2026-08-13",
    field: "Manipulate the data",
    topics: ["Quantum", "Government"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/manipulate-the-data/quantum",
    image: "/projects/manipulate-quantum.jpg",
  },
  {
    id: "manipulate-ai-gigawatts",
    title: "AI Gigawatts",
    tagline:
      "Global AI data centre power as a rising field of light, passing whole countries on the way up. Pick a decision and see the gap it leaves.",
    year: "2026",
    date: "2026-08-13",
    field: "Manipulate the data",
    topics: ["AI", "Compute & energy"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/manipulate-the-data/ai-gigawatts",
    image: "/projects/manipulate-ai-gigawatts.jpg",
  },
  {
    id: "hyperscale",
    title: "Hyperscale",
    tagline:
      "A management sim about the physical cost of the AI buildout. Power a compute campus in a river valley and answer to the town next door.",
    year: "2026",
    date: "2026-07-01",
    field: "Simulation",
    topics: ["AI", "Compute & energy"],
    kind: "game",
    status: "live",
    visibility: "draft",
    path: "/hyperscale",
    image: "/projects/hyperscale-2.jpg",
  },
  {
    id: "hollow-villages",
    title: "Village Oracle",
    tagline:
      "Write to an oracle about a village losing its people. It answers with a cited plan and a picture of the place in 2050.",
    year: "2026",
    date: "2026-04-10",
    field: "Rural futures",
    topics: ["Futures", "Society"],
    kind: "story",
    status: "live",
    visibility: "draft",
    path: "/village-oracle", // the full project, served within this site
    image: "/projects/hollow-villages.jpg",
  },
  {
    id: "generatives",
    title: "Generatives",
    tagline:
      "A lab of animated treatments for the Atlas's visual language. Tune one, size it to any banner, and paste the embed wherever you need it.",
    year: "2026",
    date: "2026-06-19",
    field: "Generative visuals",
    topics: [],
    kind: "visuals",
    status: "in-progress",
    visibility: "live",
    path: "/generatives", // self-contained Vite static bundle (dashboard + embed player)
    image: "/projects/generatives-4.jpg",
  },
  {
    id: "swipe-the-future",
    title: "Swipe the Future",
    tagline:
      "Has this already happened, or not yet? Forty sourced claims, half of them older than you would guess. Swipe, then see where the room landed.",
    year: "2026",
    date: "2026-06-23",
    field: "Calibration",
    topics: ["Futures"],
    kind: "game",
    status: "live",
    visibility: "live",
    path: "/swipe-the-future",
    image: "/projects/swipe-the-future.jpg",
  },
  {
    id: "swipe-v1",
    title: "Swipe the Future v1",
    tagline:
      "The first version, frozen. Pick a job, swipe Believe or Doubt on six claims, and get a calibration score.",
    year: "2026",
    date: "2026-06-23",
    field: "Calibration",
    topics: ["Futures"],
    kind: "game",
    status: "live",
    visibility: "draft",
    path: "/swipe-v1",
    image: "/projects/swipe-v1.jpg",
  },
  {
    id: "trajectories",
    title: "Trajectories",
    tagline:
      "Thousands of luminous filaments reach from a boiling core to a shell, bending as they go. A WebGL take on Jeongho Park's Collective Trajectories.",
    year: "2026",
    date: "2026-06-28",
    field: "Generative visuals",
    topics: [],
    kind: "visuals",
    status: "live",
    visibility: "draft",
    path: "/trajectories",
    image: "/projects/trajectories.jpg",
  },
  {
    id: "quantum-lag",
    title: "Quantum Lag",
    tagline:
      "Place twenty claims about quantum technology on a timeline, then see where they really sit. Most people file finished work in the future.",
    year: "2026",
    date: "2026-08-13",
    field: "AI & risk",
    topics: ["Quantum", "Futures"],
    kind: "game",
    status: "live",
    visibility: "draft",
    path: "/quantum-lag",
    image: "/projects/quantum-lag.jpg",
  },
  {
    id: "quantum-dominance",
    title: "Quantum Dominance",
    tagline:
      "One official post about quantum dominance, two lenses. Pick The Dystopia or The Backfire and explore futures anchored to the record.",
    year: "2026",
    date: "2026-06-24",
    field: "AI & risk",
    topics: ["Quantum", "Government"],
    kind: "story",
    status: "live",
    visibility: "draft",
    path: "/quantum-dominance",
    image: "/projects/quantum-dominance.jpg",
  },
  {
    id: "woodchipper",
    title: "Woodchipper Futures",
    tagline:
      "Take the chair in January 2025 and decide what happens to USAID. Abolish, freeze, audit or reform, and watch the outcomes branch out.",
    year: "2026",
    date: "2026-06-23",
    field: "AI & risk",
    topics: ["Government", "Society"],
    kind: "game",
    status: "live",
    visibility: "draft",
    path: "/woodchipper",
    image: "/projects/woodchipper.jpg",
  },
  {
    id: "actually-hard-questions",
    title: "Hard Questions",
    tagline:
      "A workshop tool dressed as Anthropic's homepage. Hang a room's hardest AI questions on their five headings, beside what they published there.",
    year: "2026",
    date: "2026-08-13",
    field: "Public engagement",
    topics: ["AI", "Society"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/actually-hard-questions", // hand-authored static bundle, served within this site
    image: "/projects/actually-hard-questions.jpg",
  },
  {
    id: "underground-intelligence",
    title: "Underground Intelligence",
    tagline:
      "An investigation into the systems running beneath everyday life, where every claim links back to the source it came from.",
    year: "2025",
    date: "2025-11-30",
    field: "Systems & evidence",
    topics: ["Society"],
    kind: "story",
    status: "live",
    visibility: "draft",
    path: "/underground-intelligence", // the full project, served within this site
    image: "/projects/underground-intelligence.jpg",
  },
  {
    id: "quantum-sandbox",
    title: "Quantum Sandbox",
    tagline:
      "A prototyping dashboard for quantum generative systems. Every amplitude is drawn as colour, with magnitude as density and phase as hue.",
    year: "2026",
    date: "2026-05-28",
    field: "Quantum & computation",
    topics: ["Quantum"],
    kind: "visuals",
    status: "in-progress",
    visibility: "draft",
    path: "/quantum-sandbox", // self-contained Vite static bundle served within this site
    image: "/projects/quantum-sandbox.jpg",
  },
  {
    id: "literal-frequency",
    title: "Literal Frequency",
    tagline:
      "Load any book from the open Source Library archive and see what its vocabulary looks like from four angles.",
    year: "2026",
    date: "2026-06-22",
    field: "Data visualisation",
    topics: [],
    kind: "visuals",
    status: "in-progress",
    visibility: "draft",
    path: "/literal-frequency", // self-contained Vite static bundle served within this site
    image: "/projects/literal-frequency.jpg",
  },
  {
    id: "ancestors",
    title: "Source Library × Futures Atlas Recommended Reading",
    tagline:
      "Fifty works from the Source Library, read as early versions of what the rest of the Atlas works on: mechanical reasoning, automata, the physics that became quantum, and prediction as a practice.",
    year: "2026",
    date: "2026-09-01",
    field: "History & foresight",
    topics: ["Futures", "Society"],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/ancestors",
    image: "/projects/ancestors.jpg",
    cta: "Open the shelf",
  },
  {
    id: "social-composer",
    title: "Social Composer",
    tagline:
      "A composer for social posts with motion and PNG, GIF and video export. Paste any article URL and it pulls the reusable pieces out.",
    year: "2026",
    date: "2026-06-17",
    field: "Creative tools",
    topics: [],
    kind: "tool",
    status: "live",
    visibility: "draft",
    path: "/social-composer", // self-contained Next static export served within this site
    image: "/projects/social-composer.jpg",
  },
];

/**
 * Display order: newest first, everywhere.
 *
 * This used to be the array order above, curated by hand — which drifted, as a
 * hand-kept order does. The Odds (February) had ended up second while three
 * projects from August sat below it, so the listing no longer answered the
 * question a visitor actually asks first: what is new here?
 *
 * Sorted by `date`, descending. Array.prototype.sort is stable, so projects
 * sharing a date keep the curated order above as their tiebreak — five carry
 * 2026-08-13, and that is what decides between them.
 *
 * Everything downstream derives from this: liveProjects, draftProjects,
 * visibleProjects, editorOrdered, the /projects grid, the homepage strip and
 * the project switcher. Change the order here, not at a call site.
 */
export const projectsOrdered: Project[] = [...projects].sort((a, b) =>
  b.date.localeCompare(a.date),
);

/** Live projects kept off the homepage strip. They stay on /projects. */
const OFF_HOMEPAGE = ["glossary"];

/**
 * The published shelf, in the order it is read.
 *
 * Curated rather than chronological. The dates on the cards are real and stay
 * real, so the running order is stated here instead of being nudged by editing
 * them. Anything live and missing from this list keeps its date position at the
 * end, so forgetting to add an id can never hide a project.
 */
const LIVE_ORDER = [
  "interference",
  "odds-of-surviving-ai",
  "glossary",
  "signal-reactor",
  "quantum-spark",
  "swipe-the-future",
  "generatives",
];

/** Everything the public may see. */
export const liveProjects: Project[] = (() => {
  const rank = new Map(LIVE_ORDER.map((id, i) => [id, i] as const));
  return projectsOrdered
    .filter((p) => p.visibility === "live")
    .sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6));
})();

/**
 * The homepage strip. The same shelf, minus the projects that earn their place
 * on /projects but not in the first six a visitor meets — the Glossary is a
 * reference the rest of the Atlas leans on, and leading with a word list sells
 * the site short.
 */
export const homepageProjects: Project[] = liveProjects.filter(
  (p) => !OFF_HOMEPAGE.includes(p.id),
);

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

/** The kinds present in a list, in KIND_ORDER rather than data order. */
export function kindsOf(items: Project[]): ProjectKind[] {
  const present = new Set(items.map((p) => p.kind));
  return KIND_ORDER.filter((k) => present.has(k));
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
