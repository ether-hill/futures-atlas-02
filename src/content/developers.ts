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
  "One Next.js app hosts a set of smaller, self-contained apps. Each was written in whatever suited it.";

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
    body: "A Next.js 15 app in src/. The homepage, the feed, the reports, the glossary, the contact form, the editor gate.",
    detail: "src/app · Next.js 15 · React 19 · TypeScript",
  },
  {
    n: "02",
    title: "The sub-apps",
    body: "Each project is its own app in a top-level directory with its own package.json and its own framework. On every deploy they are compiled straight into public/ and served as static bundles. The built output is never committed, so two people can't overwrite each other's build. A few have no build step at all: hand-authored HTML, CSS and JavaScript, committed whole. Interference is fifteen fragment shaders and a file that runs them, and that's genuinely the entire source.",
    detail: "scripts/build-subapps.sh · Vite, Next static export, or committed as-is",
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
      label: "Third-party assets",
      licence: "Their own terms",
      body: "Fonts under the SIL Open Font License, and the Wikimedia portraits in Hypothetica Magnifica under their individual CC licences. We pass those along rather than relicensing them, so check the credit before you reuse one.",
    },
  ],
  closing:
    "Take a project's code and take the research, and build your own thing with them.",
};

export const CONTACT = {
  title: "Used any of it?",
  body: "If you forked something, wired a component into your own work, or used a prototype in a workshop or a classroom, we would like to hear how it went. Bug reports and pull requests are welcome on GitHub; anything longer is better as a message.",
  cta: { label: "Get in touch", href: "/contact" },
};
