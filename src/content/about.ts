/**
 * About page, ALL copy and data live here (brief §1: copy is editable
 * content, never buried in JSX). The stack list is the single source of
 * truth for both the stack grid and the workflow diagram's per-stage tools.
 */

export type OutputType = "read" | "copy" | "run";

export const HERO = {
  eyebrow: "About",
  headline: "A prototype lab for foresight",
  standfirst:
    "Futures Atlas is a showcase and prototype lab. We build frameworks and modular components for foresight, mostly around compute: quantum computing and where its applications are going, emerging AI, the power and infrastructure behind it, and the organisations and people driving all of it. Some of what we post is editorial. Some is a working prototype with code you can copy. Some is a full, tested suite of tools and workshops. Take a piece, wire several together, or start your own path from one.",
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
    body: "Full packaged suites, tools plus workshop formats, tested in real rooms. Ready to facilitate: group projects, foresight sessions, personal research sprints.",
  },
];

/**
 * "What we work on" is a term field, not four essays: the left column states
 * the subject, the cloud on the right is the vocabulary. Clusters drive both
 * the colour families and the connecting lines; weight is emphasis, a design
 * decision with no count behind it.
 */
export const WORK = {
  intro: "What we work on",
  body: "Compute and the power it is reorganising: where AI is actually heading, what the energy and infrastructure behind it costs, what quantum machines can demonstrably do as against what is claimed for them, and the labs, companies and ministries narrating all of it. The gap between a demonstrated capability and a projected trajectory is where most decisions go wrong, so that gap is the subject.",
  note: "The terms this work keeps returning to. Size is emphasis, not a tally.",
  closing: "Across all of it: cite everything, substance over hype.",
};

export type TermCluster = "futures" | "quantum" | "ai" | "society" | "craft";

export interface Term {
  t: string;
  c: TermCluster;
  /** 3 = a cluster's anchor, 1 = a supporting term. Emphasis only. */
  w: 1 | 2 | 3;
}

export const TERMS: Term[] = [
  // Futures practice
  { t: "Speculative design", c: "futures", w: 3 },
  { t: "Foresight", c: "futures", w: 2 },
  { t: "Prototyping", c: "futures", w: 2 },
  { t: "Backcasting", c: "futures", w: 2 },
  { t: "Scenarios", c: "futures", w: 2 },
  { t: "Design fiction", c: "futures", w: 2 },
  { t: "Workshops", c: "futures", w: 2 },
  { t: "Horizon scanning", c: "futures", w: 1 },
  { t: "Weak signals", c: "futures", w: 1 },
  { t: "Futures literacy", c: "futures", w: 1 },
  { t: "World-building", c: "futures", w: 1 },
  { t: "Provocation", c: "futures", w: 1 },

  // Quantum
  { t: "Quantum computing", c: "quantum", w: 3 },
  { t: "Quantum", c: "quantum", w: 2 },
  { t: "Quantum applications", c: "quantum", w: 2 },
  { t: "Quantum & society", c: "quantum", w: 2 },
  { t: "Qubits", c: "quantum", w: 1 },
  { t: "Error correction", c: "quantum", w: 1 },
  { t: "Post-quantum cryptography", c: "quantum", w: 1 },
  { t: "Quantum sensing", c: "quantum", w: 1 },
  { t: "Molecular simulation", c: "quantum", w: 1 },
  { t: "Optimisation", c: "quantum", w: 1 },

  // AI
  { t: "AI", c: "ai", w: 3 },
  { t: "AGI", c: "ai", w: 2 },
  { t: "Agentic systems", c: "ai", w: 2 },
  { t: "Frontier models", c: "ai", w: 2 },
  { t: "Vibe coding", c: "ai", w: 2 },
  { t: "AI safety", c: "ai", w: 2 },
  { t: "Compute", c: "ai", w: 2 },
  { t: "Open weights", c: "ai", w: 1 },
  { t: "Evals", c: "ai", w: 1 },
  { t: "Alignment", c: "ai", w: 1 },
  { t: "Datacentres", c: "ai", w: 1 },
  { t: "Gigawatts", c: "ai", w: 1 },
  { t: "Inference", c: "ai", w: 1 },

  // Society, policy, media
  { t: "Society", c: "society", w: 3 },
  { t: "Policy", c: "society", w: 2 },
  { t: "Governance", c: "society", w: 2 },
  { t: "Ethics", c: "society", w: 2 },
  { t: "Media", c: "society", w: 2 },
  { t: "Rhetoric", c: "society", w: 2 },
  { t: "Social commentary", c: "society", w: 2 },
  { t: "Public engagement", c: "society", w: 2 },
  { t: "Regulation", c: "society", w: 1 },
  { t: "Sovereignty", c: "society", w: 1 },
  { t: "Power", c: "society", w: 1 },
  { t: "Incentives", c: "society", w: 1 },
  { t: "Narrative", c: "society", w: 1 },
  { t: "Hype cycles", c: "society", w: 1 },
  { t: "Finger on the pulse", c: "society", w: 1 },

  // How it gets made
  { t: "Creative coding", c: "craft", w: 3 },
  { t: "Generative visuals", c: "craft", w: 2 },
  { t: "Data visualisation", c: "craft", w: 2 },
  { t: "Editorial", c: "craft", w: 2 },
  { t: "Evidence", c: "craft", w: 2 },
  { t: "WebGL & shaders", c: "craft", w: 1 },
  { t: "Simulation", c: "craft", w: 1 },
  { t: "Open source", c: "craft", w: 1 },
  { t: "Replicability", c: "craft", w: 1 },
  { t: "Citation", c: "craft", w: 1 },
];

/**
 * Links that cross clusters, by term text. Inside a cluster every term already
 * joins its anchor, so these are the joins worth drawing by hand.
 */
export const TERM_LINKS: [string, string][] = [
  ["Quantum computing", "Compute"],
  ["Quantum & society", "Society"],
  ["AI", "Policy"],
  ["AI safety", "Governance"],
  ["Foresight", "Policy"],
  ["Speculative design", "Social commentary"],
  ["Prototyping", "Creative coding"],
  ["Vibe coding", "Prototyping"],
  ["Evidence", "Rhetoric"],
  ["Data visualisation", "Evidence"],
  ["Scenarios", "Governance"],
  ["Media", "Hype cycles"],
];

export type StackGroup = "ai-language" | "ai-media" | "ai-open" | "web";

export interface StackTool {
  slug: string; // key into LOGOS, or typographic tile when absent
  name: string;
  group: StackGroup;
  url: string;
  role: string; // one plain sentence: what we actually use it for
  usedIn?: { slug: string; title: string }[]; // Atlas projects that used it
}

export const STACK_GROUPS: { id: StackGroup; label: string }[] = [
  { id: "ai-language", label: "AI, language & code" },
  { id: "ai-media", label: "AI, image & video" },
  { id: "ai-open", label: "AI, open-source models" },
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
      { slug: "/hyperscale", title: "Hyperscale" },
      { slug: "/village-oracle", title: "Village Oracle" },
    ],
  },
  {
    slug: "openai",
    name: "ChatGPT",
    group: "ai-language",
    url: "https://chatgpt.com",
    role: "Research cross-checks and alternative drafts.",
  },
  {
    slug: "makemode",
    name: "MakeMode",
    group: "ai-language",
    url: "https://makemode.eu",
    role: "European AI coding agent, build work that stays on EU infrastructure.",
  },
  {
    slug: "midjourney",
    name: "Midjourney",
    group: "ai-media",
    url: "https://www.midjourney.com",
    role: "Visual language and project imagery.",
    usedIn: [
      { slug: "/village-oracle", title: "Village Oracle" },
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
    slug: "seedance",
    name: "Seedance",
    group: "ai-media",
    url: "https://seed.bytedance.com/seedance",
    role: "Video generation, multi-shot sequences and motion studies.",
  },
  {
    slug: "nanobanana",
    name: "Nano Banana",
    group: "ai-media",
    url: "https://gemini.google",
    role: "Image generation and editing, fast iterations on project imagery.",
  },
  {
    slug: "veo",
    name: "Google Veo",
    group: "ai-media",
    url: "https://deepmind.google/models/veo/",
    role: "Video generation, cinematic clips with native audio.",
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    group: "ai-open",
    url: "https://huggingface.co",
    role: "Where the open-model experiments live, weights, spaces, and evals.",
  },
  {
    slug: "meta",
    name: "Llama",
    group: "ai-open",
    url: "https://www.llama.com",
    role: "Local language-model experiments and cost-free replication paths.",
  },
  {
    slug: "mistral",
    name: "Mistral",
    group: "ai-open",
    url: "https://mistral.ai",
    role: "Small, fast open models for local pipelines.",
  },
  {
    slug: "qwen",
    name: "Qwen",
    group: "ai-open",
    url: "https://qwen.ai",
    role: "Open multilingual models, capability cross-checks.",
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    group: "ai-open",
    url: "https://www.deepseek.com",
    role: "Open reasoning models, a benchmark for what open weights can do.",
  },
  {
    slug: "ollama",
    name: "Ollama",
    group: "ai-open",
    url: "https://ollama.com",
    role: "Runs the open models locally, one command from weights to endpoint.",
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
    role: "Hosting and deployment, every push builds the whole family of sub-apps.",
  },
  {
    slug: "threejs",
    name: "three.js",
    group: "web",
    url: "https://threejs.org",
    role: "3D and WebGL work.",
    usedIn: [
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

export const STACK_INTRO = "The tools we use, in the open. Nothing here is an endorsement, it’s an inventory.";

export const FOOTER_CTA = { label: "Browse the projects", href: "/projects" };

/**
 * The open-code signpost under the stack. Deliberately NOT a second copy of
 * the licence table: /developers owns that, this is three labels and a way in.
 */
export const OPEN = {
  eyebrow: "Open by default",
  intro: "Take the code",
  body: "The Atlas is one public repository: the site, every project bundled under it, and the data files behind the research. Project code is MIT and the research is CC BY 4.0, so you can fork a prototype or cite a finding without asking anyone. Nothing here needs a key to run it yourself.",
  licences: [
    { thing: "Project code", licence: "MIT" },
    { thing: "Research & data", licence: "CC BY 4.0" },
  ],
  cta: { label: "How it\u2019s built, and where every project\u2019s source lives", href: "/developers" },
  repo: { label: "ether-hill/futures-atlas-02", href: "https://github.com/ether-hill/futures-atlas-02" },
};

/**
 * Who the Atlas is made with. Marks render mono (currentColor) so they hold in
 * both themes, see components/about/Collaborators.
 */
export const COLLAB = {
  intro: "Made with",
  body: "Futures Atlas is a collaboration between the Centre for Quantum and Society and Frond Studio.",
  partners: [
    {
      id: "cqs",
      name: "Centre for Quantum and Society",
      org: "Quantum Delta NL",
      url: "https://quantumdelta.nl/centre-for-quantum-and-society",
      blurb:
        "A knowledge and co-creation centre for the societal side of quantum technology: ethics, law, communication, and foresight.",
    },
    {
      id: "frond",
      name: "Frond Studio",
      org: "Design and development",
      url: "https://frond-studio.com",
      blurb:
        "Design that crosses disciplines and stays close to the natural world. Art direction, interface, and build.",
    },
  ],
};
