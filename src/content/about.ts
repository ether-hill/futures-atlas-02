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
    {
      term: "Quantum computing",
      def: "The technology itself, its real state, and the rhetoric sold around it. Quantum hardware is genuinely advancing — more qubits, better error correction, real laboratory milestones — and at the same time it is one of the most over-narrated technologies of the decade. We track both: what the machines can demonstrably do today, and how the story told about them departs from that baseline. When a claim reaches the press wrapped in inevitability, we trace it back to the paper, the benchmark, or the investor deck it came from.",
    },
    {
      term: "Quantum applications",
      def: "How the field evolves from lab results to claimed use cases. Between a physics result and an industry 'application' sits a long chain of assumptions — error rates, scaling, integration, economics — and most public claims skip the chain entirely. We map which applications have a credible path (optimization, molecular simulation, sensing, post-quantum cryptography), which are speculative, and which are marketing. The interesting work is in the middle: applications that are real but narrower, slower, or stranger than the pitch.",
    },
    {
      term: "Emerging and future AI",
      def: "Capabilities, trajectories, and the gap between the two. AI is moving fast enough that honest foresight has to be re-checked constantly — which is exactly why we build instruments instead of predictions. We look at what current systems actually do in working hands, where the next capabilities plausibly land, and how organisations should reason under that uncertainty. The gap between demonstrated capability and projected trajectory is where most decisions go wrong, so that gap is our subject.",
    },
    {
      term: "The people and organisations",
      def: "Who's building, funding, and narrating these futures. Technologies don't arrive on their own; they are carried by labs, companies, ministries and individuals with positions to defend and rounds to raise. We read the announcements, the filings and the incentives together, because the shape of a claimed future usually says as much about its narrator as about the technology. Understanding who benefits from a story is part of evaluating it.",
    },
  ],
  closing: "Across all of it: cite everything, substance over hype.",
};

export const WORKFLOW_INTRO =
  "Every project on the Atlas is made with a mix of AI systems, creative tools, and open web technology. We document the workflow for each one — which models, which libraries, which steps — so the process is as replicatable as the output.";

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
  { id: "ai-language", label: "AI — language & code" },
  { id: "ai-media", label: "AI — image & video" },
  { id: "ai-open", label: "AI — open-source models" },
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
    role: "Video generation — multi-shot sequences and motion studies.",
  },
  {
    slug: "nanobanana",
    name: "Nano Banana",
    group: "ai-media",
    url: "https://gemini.google",
    role: "Image generation and editing — fast iterations on project imagery.",
  },
  {
    slug: "veo",
    name: "Google Veo",
    group: "ai-media",
    url: "https://deepmind.google/models/veo/",
    role: "Video generation — cinematic clips with native audio.",
  },
  {
    slug: "huggingface",
    name: "Hugging Face",
    group: "ai-open",
    url: "https://huggingface.co",
    role: "Where the open-model experiments live — weights, spaces, and evals.",
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
    role: "Open multilingual models — capability cross-checks.",
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    group: "ai-open",
    url: "https://www.deepseek.com",
    role: "Open reasoning models — a benchmark for what open weights can do.",
  },
  {
    slug: "ollama",
    name: "Ollama",
    group: "ai-open",
    url: "https://ollama.com",
    role: "Runs the open models locally — one command from weights to endpoint.",
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
    tools: ["claude", "openai"],
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
    tools: ["midjourney", "kling", "seedance", "nanobanana", "veo"],
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

export const FOOTER_CTA = { label: "Browse the projects", href: "/projects" };
