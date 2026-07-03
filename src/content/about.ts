/**
 * About page — ALL copy and data live here (brief §1: copy is editable
 * content, never buried in JSX). The stack list is the single source of
 * truth for both the stack grid and the workflow diagram's per-stage tools.
 */

export type OutputType = "read" | "copy" | "run";

export const HERO = {
  eyebrow: "About",
  headline: "A prototype lab for foresight",
  standfirst:
    "Futures Atlas is a showcase and prototype lab. We build frameworks and modular components for foresight — mostly around quantum computing, the evolution of quantum applications, emerging AI, and the organisations and people driving them. Some of what we post is editorial. Some is a working prototype with code you can copy. Some is a full, tested suite of tools and workshops. Take a piece, wire several together, or start your own path from one.",
  kicker: "It’s meant to be used.",
};

export const OUTPUT_TYPES: { type: OutputType; label: string; title: string; body: string }[] = [
  {
    type: "read",
    label: "READ",
    title: "Editorial",
    body: "Essays, research notes, and rhetoric breakdowns. Cited claims, weighed evidence, no forecasting theatre. Use them as briefings or as source material for your own work.",
  },
  {
    type: "copy",
    label: "COPY",
    title: "Prototypes",
    body: "Working tools with open, replicatable code. Rough by design. Fork them, gut them, wire them into larger workflows. If a prototype helps you build a better one, it did its job.",
  },
  {
    type: "run",
    label: "RUN",
    title: "Kits",
    body: "Full packaged suites — tools plus workshop formats, tested in real rooms. Ready to facilitate: group projects, foresight sessions, personal research sprints.",
  },
];

export const DOMAINS = {
  intro: "What we work on",
  items: [
    { term: "Quantum computing", def: "the technology, its real state, and the rhetoric sold around it." },
    { term: "Quantum applications", def: "how the field evolves from lab results to claimed use cases." },
    { term: "Emerging and future AI", def: "capabilities, trajectories, and the gap between the two." },
    { term: "The people and organisations", def: "who’s building, funding, and narrating these futures." },
  ],
  closing: "Across all of it: cite everything, substance over hype.",
};

export const WORKFLOW_INTRO =
  "Every project on the Atlas is made with a mix of AI systems, creative tools, and open web technology. We document the workflow for each one — which models, which libraries, which steps — so the process is as replicatable as the output.";

export type StackGroup = "ai-language" | "ai-media" | "web";

export interface StackTool {
  slug: string; // key into LOGOS, or typographic tile when absent
  name: string;
  group: StackGroup;
  url: string;
  role: string; // one plain sentence: what we actually use it for
  usedIn?: { slug: string; title: string }[]; // Atlas projects that used it
}

export const STACK_GROUPS: { id: StackGroup; label: string }[] = [
  { id: "ai-language", label: "AI — language & code" },
  { id: "ai-media", label: "AI — image & video" },
  { id: "web", label: "Web & creative code" },
];

export const STACK: StackTool[] = [
  {
    slug: "claude",
    name: "Claude / Claude Code",
    group: "ai-language",
    url: "https://claude.com",
    role: "Research, drafting, and most of the build work on this site.",
    usedIn: [
      { slug: "/signal-reactor", title: "Signal Reactor" },
      { slug: "/quantum-spark", title: "Quantum Spark" },
      { slug: "/gigawatt", title: "Gigawatt" },
      { slug: "/hollow-villages", title: "The Hollow Villages" },
    ],
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    group: "ai-language",
    url: "https://chatgpt.com",
    role: "Research cross-checks and alternative drafts.",
  },
  {
    slug: "huggingface",
    name: "Open-source models",
    group: "ai-language",
    url: "https://huggingface.co",
    role: "Local experiments and cost-free replication paths — the roster (Llama, Mistral, Qwen, Flux and peers) shifts too fast to pin down.",
  },
  {
    slug: "midjourney",
    name: "Midjourney",
    group: "ai-media",
    url: "https://www.midjourney.com",
    role: "Visual language and project imagery.",
    usedIn: [
      { slug: "/hollow-villages", title: "The Hollow Villages" },
      { slug: "/quantum-dominance", title: "Quantum Dominance" },
    ],
  },
  {
    slug: "kling",
    name: "Kling AI",
    group: "ai-media",
    url: "https://klingai.com",
    role: "Video generation.",
  },
  {
    slug: "nextjs",
    name: "Next.js",
    group: "web",
    url: "https://nextjs.org",
    role: "The framework the Atlas runs on.",
  },
  {
    slug: "vercel",
    name: "Vercel",
    group: "web",
    url: "https://vercel.com",
    role: "Hosting and deployment — every push builds the whole family of sub-apps.",
  },
  {
    slug: "threejs",
    name: "three.js",
    group: "web",
    url: "https://threejs.org",
    role: "3D and WebGL work.",
    usedIn: [
      { slug: "/gigawatt", title: "Gigawatt" },
      { slug: "/hyperscale", title: "Hyperscale" },
      { slug: "/trajectories", title: "Trajectories" },
    ],
  },
  {
    slug: "p5js",
    name: "p5.js",
    group: "web",
    url: "https://p5js.org",
    role: "Generative sketches and creative-code prototypes.",
  },
  {
    slug: "react",
    name: "React",
    group: "web",
    url: "https://react.dev",
    role: "The component layer.",
  },
  {
    slug: "tailwindcss",
    name: "Tailwind CSS",
    group: "web",
    url: "https://tailwindcss.com",
    role: "Styling, mapped onto the Atlas design tokens.",
  },
  {
    slug: "d3",
    name: "D3.js",
    group: "web",
    url: "https://d3js.org",
    role: "Data-driven visuals where prototypes need them.",
  },
];

export interface WorkflowStage {
  id: string;
  label: string;
  blurb: string;
  tools: string[]; // STACK slugs shown at this stage
  types: OutputType[]; // which output types pass through this stage
}

export const WORKFLOW: WorkflowStage[] = [
  {
    id: "research",
    label: "Research",
    blurb: "Source-first reading and claim-checking before anything is drawn or built.",
    tools: ["claude", "chatgpt"],
    types: ["read", "copy", "run"],
  },
  {
    id: "frameworks",
    label: "Frameworks",
    blurb: "Drafting the structure — briefs, schemas, prompts and page architecture.",
    tools: ["claude"],
    types: ["read", "copy", "run"],
  },
  {
    id: "visuals",
    label: "Visuals",
    blurb: "Imagery and motion in the project's own register.",
    tools: ["midjourney", "kling", "huggingface"],
    types: ["read", "run"],
  },
  {
    id: "build",
    label: "Build",
    blurb: "Working software, shipped from source on every push.",
    tools: ["nextjs", "react", "threejs", "p5js", "tailwindcss", "d3", "vercel"],
    types: ["copy", "run"],
  },
  {
    id: "test",
    label: "Test",
    blurb: "Real rooms, real workshops — kits earn the label by surviving contact.",
    tools: [],
    types: ["run"],
  },
  {
    id: "publish",
    label: "Publish",
    blurb: "Ship it on the Atlas and open the code.",
    tools: ["vercel"],
    types: ["read", "copy", "run"],
  },
];

export const STACK_INTRO = "The tools we use, in the open. Nothing here is an endorsement — it’s an inventory.";

export const WHO = {
  body: "Futures Atlas is a project by Frond Studio.",
  invite:
    "If you use something from the Atlas — a framework, a prototype, a kit — we’d like to hear how it went.",
  contactHref: "/contact",
  contactLabel: "Get in touch",
};

export const FOOTER_CTA = { label: "Browse the projects", href: "/projects" };
