/**
 * Developers page. ALL copy lives here (same rule as content/about.ts: copy is
 * editable content, never buried in JSX). The page renders this against
 * `projects.ts` and `source-map.ts`; nothing on it is a hand-kept second list.
 */

export const HERO = {
  eyebrow: "For developers",
  headline: "Take the code",
  standfirst:
    "Everything on the Atlas is one repository: the site, every project bundled under it, and the data files behind the research. This page is the map. How it fits together, where each project's source sits, and which parts are yours to take.",
  kicker: "Open by default.",
};

export const ARCHITECTURE_INTRO =
  "One Next.js app hosts a set of smaller, self-contained apps. Each was written in whatever suited it, and each is served from the same domain. That decision shapes everything else here, so it's worth knowing before you clone anything.";

export interface Layer {
  n: string;
  title: string;
  body: string;
  detail: string;
}

export const LAYERS: Layer[] = [
  {
    n: "01",
    title: "The host",
    body: "A Next.js 15 app in src/. The homepage, the feed, the reports, the glossary, the design system reference, the contact form, the editor gate.",
    detail: "src/app · Next.js 15 · React 19 · TypeScript",
  },
  {
    n: "02",
    title: "The sub-apps",
    body: "Each project is its own app in a top-level directory with its own package.json and its own framework. On every deploy they are compiled straight into public/ and served as static bundles. The built output is never committed, so two people can't overwrite each other's build.",
    detail: "scripts/build-subapps.sh · Vite or Next static export",
  },
  {
    n: "03",
    title: "The static bundles",
    body: "A few projects have no build step at all. Hand-authored HTML, CSS and JavaScript, committed whole under public/. Interference is fifteen fragment shaders and a file that runs them, and that's genuinely the entire source.",
    detail: "public/<slug> · committed as-is",
  },
  {
    n: "04",
    title: "The design system",
    body: "Colour, type scale, spacing, motion, as a package rather than a stylesheet. It is vendored into the repo and consumed by the host and the sub-apps. This is the Atlas’s own look, so it is documented here but not offered for reuse.",
    detail: "futures-atlas-core · tokens.css + components",
  },
];

export const SOURCES_INTRO =
  "Every project below links to the exact folder it is built from. The three build kinds behave differently, so the tag tells you what you are getting into before you clone: a directory you can npm install and run, or a bundle you can just open.";

export const RUN_INTRO =
  "The host app and every sub-app build from a single clone. Node 20 or newer; the sub-app builds are skipped unless their source has changed, so the first run is slow and the rest are not.";

export const RUN_STEPS: { cmd: string; note: string }[] = [
  {
    cmd: "git clone https://github.com/ether-hill/futures-atlas-02.git",
    note: "One repo. The design system comes with it, vendored at packages/futures-atlas-core.",
  },
  {
    cmd: "npm install",
    note: "Installs the host app only. Each sub-app installs its own dependencies when it builds.",
  },
  {
    cmd: "npm run dev",
    note: "The host app on :3000. Sub-app routes 404 until you build them at least once.",
  },
  {
    cmd: "npm run build:subapps",
    note: "Compiles every sub-app into public/. Slow the first time, then it skips anything unchanged.",
  },
];

export const ENV_NOTE =
  "Nothing above needs a secret. The environment variables the deployed site uses (the theming store, the editor sign-in, the two generation endpoints) are all optional and degrade gracefully: without them the theme falls back to its defaults, the gated routes stay closed, and Signal Reactor and Quantum Spark render but cannot generate.";

export const OPENNESS_INTRO =
  "“Open” means different things for the code and for the site, and the difference is deliberate rather than an oversight. Here is exactly where the line sits.";

export interface OpennessRow {
  thing: string;
  state: "open" | "closed" | "unlisted";
  detail: string;
}

export const OPENNESS: OpennessRow[] = [
  {
    thing: "The source code",
    state: "open",
    detail:
      "The repository is public on GitHub. Clone it, run it, fork it; there is no access to request.",
  },
  {
    thing: "The research and data",
    state: "open",
    detail:
      "Every report, every finding and every glossary entry is a plain TypeScript data file in the repo, with its sources attached. Free to cite, free to check, free to disagree with.",
  },
  {
    thing: "The design system",
    state: "closed",
    detail:
      "Readable, and documented at /design-system, which is drawn from the same variables the site runs on. It is the Atlas’s visual identity though, so it is not licensed for reuse.",
  },
  {
    thing: "The site in search engines",
    state: "unlisted",
    detail:
      "The Atlas is draft work, shared by link. Every response carries a noindex header and robots.txt disallows everything, so nothing here is findable by searching. That lifts when the site launches properly.",
  },
  {
    thing: "Unpublished projects",
    state: "closed",
    detail:
      "Work in progress isn't listed anywhere on the site, and its URLs are closed. An anonymous visitor gets a sign-in form, never the page. It goes public when it's finished, not before.",
  },
  {
    thing: "The editor and theming panels",
    state: "closed",
    detail:
      "The publishing overview, the internal pages and the live theming control panel sit behind a password, and fail closed if it is not configured.",
  },
  {
    thing: "Keys and credentials",
    state: "closed",
    detail:
      "Never in the repo. Every key lives in the deployment's environment, and no environment file has ever been committed.",
  },
];

export const LICENCE = {
  intro:
    "There are four kinds of material here and they carry four different permissions. Find the one that covers what you want.",
  terms: [
    {
      label: "Project code",
      licence: "MIT",
      body: "The published projects: the interactive pieces, the simulations, the visualisations, the games. Use them commercially, fork them, ship them. Keep the copyright notice and you have met the whole obligation.",
    },
    {
      label: "Research & data",
      licence: "CC BY 4.0",
      body: "Reports, findings, the evidence behind them, the glossary and the datasets. Cite it, republish it, argue with it. Credit the Atlas and link back.",
    },
    {
      label: "The site itself",
      licence: "Reserved",
      body: "The design system, the site chrome, the Futures Atlas name and mark, and the words on these pages. Readable so the work can be checked, not licensed for reuse. Quoting with attribution is ordinary citation and always fine.",
    },
    {
      label: "Third-party assets",
      licence: "Their own terms",
      body: "Fonts under the SIL Open Font License, and the Wikimedia portraits in Hypothetica Magnifica under their individual CC licences. We pass those along rather than relicensing them, so check the credit before you reuse one.",
    },
  ],
  closing:
    "Take a project's code and take the research. Build your own thing with them, under your own name, with your own design and your own words.",
};

export const CONTACT = {
  title: "Used any of it?",
  body: "If you forked something, wired a component into your own work, or used a prototype in a workshop or a classroom, we would like to hear how it went. Bug reports and pull requests are welcome on GitHub; anything longer is better as a message.",
  cta: { label: "Get in touch", href: "/contact" },
};
