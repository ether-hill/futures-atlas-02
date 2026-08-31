/**
 * Where each project's code actually lives, and how it gets onto the site.
 *
 * This is the developer-facing half of `projects.ts`: that file says what a
 * project IS and who may see it, this one says what you would clone to change
 * it. Keyed by the same `Project.id`, so the two can never describe different
 * sets. `sourceFor()` returns undefined for anything missing and the page
 * renders the project without a source row rather than inventing one.
 *
 * `dir` is a path inside the repo named by `repo`, so the GitHub link is
 * derived, never hand-written. `build` is the honest answer to "what happens on
 * deploy", because the three shapes behave differently:
 *
 *   host   = a route inside the Next app in src/, rendered per request
 *   built  = its own app in a top-level directory, compiled into public/ by
 *            scripts/build-subapps.sh on every deploy (bundle is git-ignored)
 *   static = a hand-authored bundle with no build step, committed under public/
 */

export type BuildKind = "host" | "built" | "static";

export interface ProjectSource {
  /** GitHub repo, "owner/name". */
  repo: string;
  /** Path inside that repo. */
  dir: string;
  build: BuildKind;
  /** The libraries that decide the shape of the thing, not the full lockfile. */
  stack: string[];
  /** One sentence a developer would want before opening the folder. */
  note?: string;
}

export const ATLAS_REPO = "ether-hill/futures-atlas-02";
export const CORE_REPO = "laubaumau/futures-atlas-core";

export const SOURCE_MAP: Record<string, ProjectSource> = {
  interference: {
    repo: ATLAS_REPO,
    dir: "public/interference",
    build: "static",
    stack: ["WebGL2", "GLSL", "Vanilla JS"],
    note: "Fifteen fragment shaders and one shared field.js, used by both the gallery and the embeddable player. No build step: the shaders are the source.",
  },
  magnifica: {
    repo: ATLAS_REPO,
    dir: "magnifica",
    build: "built",
    stack: ["Vite", "TypeScript", "Web Audio", "ElevenLabs"],
    note: "portraits.ts is a licence registry as much as a data file. Every portrait is a freely-licensed Wikimedia photograph, and its credit renders on screen.",
  },
  "odds-of-surviving-ai": {
    repo: ATLAS_REPO,
    dir: "public/odds-of-surviving-ai",
    build: "static",
    stack: ["Vanilla JS", "Canvas"],
    note: "One hand-authored index.html; scripts/build-odds-routes.mjs generates the per-player pages so each has its own share metadata. Never edit those by hand.",
  },
  "signal-reactor": {
    repo: ATLAS_REPO,
    dir: "signal-reactor",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
    note: "Static export on the front, but its generation endpoint runs in the host app at /api/signal-reactor, so this one needs a key to run fully.",
  },
  "quantum-spark": {
    repo: ATLAS_REPO,
    dir: "quantum-spark",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
    note: "Same split as Signal Reactor: the page is static, /api/quantum-spark in the host app does the generating.",
  },
  "manipulate-ai-gigawatts": {
    repo: ATLAS_REPO,
    dir: "manipulate-the-data",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
    note: "One codebase, three views. AI Gigawatts shares its data layer and transform engine with the two Counterfactual entries.",
  },
  generatives: {
    repo: ATLAS_REPO,
    dir: "generatives",
    build: "built",
    stack: ["Vite", "Three.js", "TypeScript"],
    note: "A dashboard plus a separate embed.html player, so a single generative can be dropped into someone else's page.",
  },
  "swipe-the-future": {
    repo: ATLAS_REPO,
    dir: "swipe-the-future",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  "actually-hard-questions": {
    repo: ATLAS_REPO,
    dir: "public/actually-hard-questions",
    build: "static",
    stack: ["Vanilla JS", "Canvas"],
    note: "A single hash-routed page. Nothing to install: open index.html.",
  },
  "underground-intelligence": {
    repo: ATLAS_REPO,
    dir: "public/underground-intelligence",
    build: "static",
    stack: ["Vanilla JS", "SVG", "Canvas"],
    note: "A single-page app with client-side tab routing, committed whole. The four tab URLs are rewrites in next.config.ts.",
  },

  // ── Draft projects. Listed on the page only for a signed-in editor, but kept
  //    here so the map stays complete and the editor view needs no second file.
  mappings: {
    repo: ATLAS_REPO,
    dir: "mappings",
    build: "built",
    stack: ["Vite", "TypeScript", "d3-geo"],
  },
  "manipulate-ai-index": {
    repo: ATLAS_REPO,
    dir: "manipulate-the-data",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  "manipulate-quantum": {
    repo: ATLAS_REPO,
    dir: "manipulate-the-data",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  "quantum-lag": {
    repo: ATLAS_REPO,
    dir: "quantum-lag",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  hyperscale: {
    repo: ATLAS_REPO,
    dir: "gigawatt",
    build: "built",
    stack: ["Vite", "Three.js", "TypeScript"],
    note: "The directory and the URL differ: gigawatt/ builds to /hyperscale.",
  },
  trajectories: {
    repo: ATLAS_REPO,
    dir: "trajectories",
    build: "built",
    stack: ["Vite", "Three.js", "TypeScript"],
  },
  "quantum-dominance": {
    repo: ATLAS_REPO,
    dir: "quantum-dominance",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  "swipe-v1": {
    repo: ATLAS_REPO,
    dir: "swipe-v1",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
    note: "The first version, frozen deliberately so it stays playable beside v2.",
  },
  woodchipper: {
    repo: ATLAS_REPO,
    dir: "woodchipper",
    build: "built",
    stack: ["Next.js", "React", "TypeScript"],
  },
  "literal-frequency": {
    repo: ATLAS_REPO,
    dir: "literal-frequency",
    build: "built",
    stack: ["Vite", "TypeScript"],
  },
  "social-composer": {
    repo: ATLAS_REPO,
    dir: "social-composer",
    build: "built",
    stack: ["Next.js", "React", "Tailwind CSS"],
  },
  "quantum-sandbox": {
    repo: ATLAS_REPO,
    dir: "quantum-sandbox",
    build: "built",
    stack: ["Vite", "Three.js", "TypeScript"],
  },
  "hollow-villages": {
    repo: ATLAS_REPO,
    dir: "hollow-villages",
    build: "built",
    stack: ["Next.js", "React", "Tailwind CSS"],
    note: "Directory and URL differ again: hollow-villages/ builds to /village-oracle.",
  },
};

/** The dev metadata for a project id, or undefined if none is recorded. */
export function sourceFor(id: string): ProjectSource | undefined {
  return SOURCE_MAP[id];
}

/** A link straight to the folder on GitHub. */
export function githubUrl(src: ProjectSource, branch = "main"): string {
  return `https://github.com/${src.repo}/tree/${branch}/${src.dir}`;
}

/** How a build kind reads on the page. */
export const BUILD_LABEL: Record<BuildKind, string> = {
  host: "Route in the host app",
  built: "Built on deploy",
  static: "Committed static bundle",
};
