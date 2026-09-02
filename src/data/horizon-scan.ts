/**
 * Horizon Scan — the rule file.
 *
 * This project has no editor. Nothing on /horizon-scan is chosen by hand: a
 * standing search runs against OpenAlex and arXiv, and whatever survives the
 * rules below is filed. So the rules ARE the curation, and they are published
 * on the page itself. If a paper you would expect is missing, the honest fix is
 * to widen a topic here, not to add the paper.
 *
 * Shape of a rule:
 *   probes  — what we ASK the indexes for (quoted phrases, OR'd into one query)
 *   terms   — what we ACCEPT: a record must contain at least one of these in its
 *             title or abstract, lowercased substring match. Probes cast wide,
 *             terms decide. A record retrieved by one topic's probe can be kept
 *             by another topic's terms; that is how convergence gets found.
 *
 * A record matching topics from two or more CLUSTERS is marked convergent. That
 * is the reason this page exists rather than nine separate alerts.
 *
 * Substring matching is deliberate and the terms are written for it:
 * "self-organi" catches organise/organize/organisation, "reproducib" catches
 * reproducible/reproducibility.
 *
 * The cost is that a short term is a trap, and the traps are not obvious until
 * you read the output. Three that were in here and are not any more: "asic"
 * matched every paper containing "basic", "siting" matched "visiting", "sport"
 * in the venue blocklist was throwing out every transport journal. Before
 * adding a term under about ten characters, say it out loud inside a longer
 * word first.
 */

export type ClusterId =
  | "quantum"
  | "ai"
  | "compute"
  | "power"
  | "foresight"
  | "society"
  | "earth"
  | "living"
  | "evidence";

export interface Cluster {
  id: ClusterId;
  label: string;
  /** One word, for the filter chips and the convergent badge. Nine full labels
   *  is one chip per row on a phone and eight hundred pixels before the first
   *  card. */
  chip: string;
  /** Why the Atlas watches this, in one line. Rendered on the rules page. */
  why: string;
  /** The Atlas projects this cluster feeds. Names, not links: projects move. */
  feeds: string[];
  /** arXiv categories worth a parallel preprint query, if any. */
  arxivCats?: string[];
}

export interface Topic {
  id: string;
  cluster: ClusterId;
  label: string;
  probes: string[];
  terms: string[];
}

export const CLUSTERS: Cluster[] = [
  {
    id: "quantum",
    label: "Quantum",
    chip: "Quantum",
    why: "The Atlas keeps arguing with the gap between what quantum technology can do and what it is promised to do.",
    feeds: ["Quantum Lag", "Quantum Sandbox", "Quantum Spark", "Quantum Dominance", "Quantum Interference Visuals"],
    arxivCats: ["quant-ph"],
  },
  {
    id: "ai",
    label: "Machine intelligence",
    chip: "AI",
    why: "Capability, failure and the arguments about both. The evidence base under most of the risk work here.",
    feeds: ["The Odds", "Signal Reactor", "Woodchipper Futures", "AI Hegemony", "Hypothetica Magnifica"],
    arxivCats: ["cs.AI", "cs.LG", "cs.CY"],
  },
  {
    id: "compute",
    label: "Compute and materiel",
    chip: "Compute",
    why: "The physical bill for the software: buildings, megawatts, water, wafers. Where a forecast meets a substation.",
    feeds: ["Hyperscale", "AI Gigawatts", "The Counterfactual Index"],
    arxivCats: ["cs.DC", "cs.AR"],
  },
  {
    id: "power",
    label: "Power and jurisdiction",
    chip: "Power",
    why: "Who owns the capability, who is allowed to buy it, and who is inventing new ground to stand on.",
    feeds: ["AI Hegemony", "AI Kill Chain", "Startup Cities", "Quantum Dominance"],
    arxivCats: ["cs.CY"],
  },
  {
    id: "foresight",
    label: "Foresight and method",
    chip: "Foresight",
    why: "How anyone claims to know anything about a year that has not happened. This is the Atlas's own trade.",
    feeds: ["Swipe the Future", "Village Oracle", "every report"],
    arxivCats: ["econ.GN"],
  },
  {
    id: "society",
    label: "Technology and society",
    chip: "Society",
    why: "Expectations, values, publics. The layer that decides whether a working machine is an acceptable one.",
    feeds: ["Hypothetica Magnifica", "Hard Questions", "Quantum Lag"],
  },
  {
    id: "earth",
    label: "Land and transition",
    chip: "Land",
    why: "Where infrastructure lands and who is already living there. Rural decline and the energy transition are the same map.",
    feeds: ["Village Oracle", "Hyperscale", "AI Gigawatts"],
  },
  {
    id: "living",
    label: "Living systems",
    chip: "Living",
    why: "Computation that is not a computer, and the organisms that got there first. The Atlas's other model of intelligence.",
    feeds: ["Underground Intelligence", "Generatives", "Trajectories", "Quantum Interference Visuals"],
    arxivCats: ["nlin.AO"],
  },
  {
    id: "evidence",
    label: "Evidence and the record",
    chip: "Evidence",
    why: "How numbers travel, how they are drawn, and how they get bent. The Counterfactual Index is an argument about exactly this.",
    feeds: ["Mappings", "Literal Frequency", "The Counterfactual Index", "Hard Questions"],
  },
];

export const TOPICS: Topic[] = [
  // ── Quantum ───────────────────────────────────────────────────────────────
  {
    id: "quantum-computing",
    cluster: "quantum",
    label: "Quantum computing",
    probes: ['"fault-tolerant quantum"', '"quantum error correction"', '"logical qubit"', '"quantum advantage"'],
    terms: [
      "quantum computing", "quantum computer", "qubit", "quantum error correction",
      "fault-tolerant quantum", "quantum advantage", "quantum supremacy", "quantum algorithm",
      "quantum processor", "quantum annealing",
    ],
  },
  {
    id: "quantum-networks",
    cluster: "quantum",
    label: "Quantum networks",
    probes: ['"quantum internet"', '"quantum repeater"', '"entanglement distribution"'],
    terms: [
      "quantum internet", "quantum network", "quantum repeater", "entanglement distribution",
      "quantum key distribution", "entangled photon", "quantum link",
    ],
  },
  {
    id: "quantum-sensing",
    cluster: "quantum",
    label: "Quantum sensing",
    probes: ['"quantum sensing"', '"quantum metrology"', '"quantum sensor"'],
    terms: [
      "quantum sensing", "quantum sensor", "quantum metrology", "optical clock",
      "atomic clock", "nv center", "nv centre", "magnetometr",
    ],
  },
  {
    id: "post-quantum",
    cluster: "quantum",
    label: "Post-quantum security",
    probes: ['"post-quantum cryptography"', '"quantum-safe"', '"harvest now, decrypt later"'],
    terms: [
      "post-quantum cryptography", "post-quantum crypto", "quantum-safe", "quantum safe migration",
      "harvest now", "cryptographically relevant quantum", "lattice-based cryptograph",
      "quantum threat to cryptograph",
    ],
  },
  {
    id: "quantum-expectations",
    cluster: "quantum",
    label: "Quantum expectations and policy",
    probes: ['"quantum technology" AND (policy OR expectations OR hype OR workforce OR strategy)', '"second quantum revolution"', '"national quantum"'],
    terms: [
      "quantum hype", "quantum ecosystem", "quantum workforce", "quantum readiness",
      "national quantum", "quantum strategy", "quantum industry", "second quantum revolution",
      "quantum technology policy", "expectations of quantum", "quantum roadmap", "quantum literacy",
    ],
  },
  {
    id: "wave-optics",
    cluster: "quantum",
    label: "Waves and interference",
    probes: ['"double-slit"', '"wavefront shaping"', '"interference pattern" AND (optic OR photonic OR acoustic)'],
    terms: [
      "interference pattern", "double-slit", "double slit", "interferometr", "wavefront",
      "diffraction pattern", "photonic lattice", "wave field", "standing wave", "moiré pattern",
    ],
  },

  // ── Machine intelligence ──────────────────────────────────────────────────
  {
    id: "frontier-capability",
    cluster: "ai",
    label: "Frontier capability",
    probes: ['"frontier model"', '"scaling law" AND (language OR model)', '"artificial general intelligence"'],
    terms: [
      "frontier model", "frontier ai", "foundation model", "large language model",
      "scaling law", "emergent capabilit", "general-purpose ai", "artificial general intelligence",
      "reasoning model", "test-time compute",
    ],
  },
  {
    id: "ai-safety",
    cluster: "ai",
    label: "AI safety and risk",
    probes: ['"ai safety"', '"existential risk" AND (ai OR artificial)', '"loss of control" AND ai', '"catastrophic risk" AND ai'],
    terms: [
      "ai safety", "ai alignment", "existential risk", "catastrophic risk", "loss of control",
      "dangerous capabilit", "deceptive alignment", "ai risk", "extinction risk",
      "goal misalignment", "power-seeking", "safety-critical failure",
    ],
  },
  {
    id: "ai-evaluation",
    cluster: "ai",
    label: "Evaluation and audit",
    probes: ['"model evaluation" AND (safety OR capability)', '"red teaming"', '"safety case" AND ai', '"third-party audit" AND ai'],
    terms: [
      "model evaluation", "capability evaluation", "benchmark contamination", "red team",
      "safety case", "systemic risk assessment", "third-party audit", "algorithmic audit",
      "evaluation protocol", "capability elicitation",
    ],
  },
  {
    id: "agents",
    cluster: "ai",
    label: "Agents and autonomy",
    probes: ['"ai agent" AND (autonomy OR deployment OR risk)', '"agentic"', '"multi-agent system" AND (llm OR language model)'],
    terms: [
      "ai agent", "agentic", "autonomous agent", "multi-agent system",
      "computer-use agent", "agent framework", "long-horizon task", "agent autonomy",
    ],
  },
  {
    id: "ai-and-work",
    cluster: "ai",
    label: "Work and displacement",
    probes: ['"labour market" AND (ai OR automation)', '"labor market" AND (ai OR automation)', '"future of work" AND (ai OR generative)'],
    terms: [
      "future of work", "labour market", "labor market", "task exposure", "job displacement",
      "deskilling", "occupational exposure", "automation of work", "wage effect",
      "productivity effect", "worker augmentation",
    ],
  },
  {
    id: "human-ai",
    cluster: "ai",
    label: "People using the thing",
    probes: ['"human-ai interaction"', '"automation bias"', '"over-reliance" AND ai', '"cognitive offloading"'],
    terms: [
      "human-ai", "human-machine team", "automation bias", "over-reliance", "overreliance",
      "cognitive offloading", "anthropomorph", "trust in automation", "appropriate reliance",
      "algorithm aversion",
    ],
  },

  // ── Compute and materiel ──────────────────────────────────────────────────
  {
    id: "data-centres",
    cluster: "compute",
    label: "Data centres",
    probes: ['"data center" AND (energy OR siting OR water OR grid)', '"data centre" AND (energy OR siting OR water OR grid)', '"hyperscale"'],
    terms: [
      "data center", "data centre", "hyperscale", "colocation", "server farm",
      "power usage effectiveness", "rack density", "compute cluster siting",
    ],
  },
  {
    id: "energy-water",
    cluster: "compute",
    label: "Energy, water, grid",
    probes: ['"electricity demand" AND (ai OR data cent)', '"water consumption" AND (data cent OR cooling)', '"grid congestion"'],
    terms: [
      "electricity demand", "energy consumption of ai", "water consumption", "water withdrawal",
      "liquid cooling", "grid connection", "grid congestion", "load growth", "megawatt",
      "gigawatt", "embodied carbon", "curtailment", "behind-the-meter",
    ],
  },
  {
    id: "chips",
    cluster: "compute",
    label: "Chips and fabrication",
    probes: ['"semiconductor" AND (supply chain OR export OR lithography)', '"euv lithography"', '"ai accelerator"'],
    terms: [
      "semiconductor", "lithograph", "chip fabrication", "foundry", "wafer",
      "ai accelerator", "gpu cluster", "application-specific integrated circuit",
      "memory bandwidth", "advanced packaging",
      "node shrink",
    ],
  },
  {
    id: "compute-governance",
    cluster: "compute",
    label: "Compute governance",
    probes: ['"compute governance"', '"training compute"', '"hardware-enabled governance"', '"export control" AND (chip OR semiconductor OR compute)'],
    terms: [
      "compute governance", "training compute", "training run", "flop threshold",
      "hardware-enabled", "chip export", "export control", "compute threshold",
      "on-chip governance", "compute divide",
    ],
  },

  // ── Power and jurisdiction ────────────────────────────────────────────────
  {
    id: "concentration",
    cluster: "power",
    label: "Concentration of capability",
    probes: ['"market concentration" AND (ai OR cloud OR platform)', '"platform power"', '"vertical integration" AND (ai OR cloud)'],
    terms: [
      "market concentration", "oligopol", "monopol", "platform power", "vertical integration",
      "market power", "infrastructural power", "gatekeeper", "cloud dependenc",
      "concentration of compute", "winner-take-all",
    ],
  },
  {
    id: "sovereignty",
    cluster: "power",
    label: "Sovereignty and industrial policy",
    probes: ['"digital sovereignty"', '"strategic autonomy" AND (technolog OR digital)', '"techno-nationalism"', '"industrial policy" AND (semiconductor OR ai)'],
    terms: [
      "digital sovereignty", "technological sovereignty", "strategic autonomy", "techno-nationalism",
      "industrial policy", "geopolitic", "national security", "sovereign ai", "reshoring",
      "friendshoring", "standard-setting",
    ],
  },
  {
    id: "military-ai",
    cluster: "power",
    label: "Military and dual use",
    probes: ['"autonomous weapon"', '"military ai"', '"kill chain"', '"dual-use" AND (ai OR quantum)'],
    terms: [
      "autonomous weapon", "lethal autonomous", "military ai", "targeting system", "kill chain",
      "defence technology", "defense technology", "dual-use", "arms control", "meaningful human control",
      "battlefield", "deterrence",
    ],
  },
  {
    id: "jurisdiction-experiments",
    cluster: "power",
    label: "New jurisdictions",
    probes: ['"charter city"', '"special economic zone" AND (governance OR experiment)', '"network state"', '"regulatory sandbox"'],
    terms: [
      "charter city", "special economic zone", "network state", "free private city",
      "startup city", "regulatory sandbox", "company town", "seasteading",
      "jurisdictional competition", "exit option", "prospera",
    ],
  },

  // ── Foresight and method ──────────────────────────────────────────────────
  {
    id: "scenarios",
    cluster: "foresight",
    label: "Scenarios and foresight",
    probes: ['"scenario planning"', '"strategic foresight"', '"horizon scanning"', '"anticipatory governance"'],
    terms: [
      "scenario planning", "scenario analysis", "futures studies", "strategic foresight",
      "horizon scanning", "backcasting", "anticipatory governance", "futures literacy",
      "delphi study", "weak signal", "wild card", "scenario axes",
    ],
  },
  {
    id: "speculative-design",
    cluster: "foresight",
    label: "Speculative and critical design",
    probes: ['"speculative design"', '"design fiction"', '"experiential futures"', '"participatory futures"'],
    terms: [
      "speculative design", "design fiction", "critical design", "experiential futures",
      "diegetic prototype", "discursive design", "participatory futures", "worldbuilding",
      "world-building", "adversarial design",
    ],
  },
  {
    id: "forecasting",
    cluster: "foresight",
    label: "Forecasting and calibration",
    probes: ['"expert elicitation"', '"prediction market"', '"forecast calibration"', '"judgmental forecasting"'],
    terms: [
      "judgmental forecasting", "judgemental forecasting", "expert elicitation", "prediction market",
      "forecast calibration", "calibration training", "superforecast", "probabilistic forecast",
      "base rate", "brier score", "overconfidence", "aggregation of forecasts",
    ],
  },
  {
    id: "modelling",
    cluster: "foresight",
    label: "Models of futures",
    probes: ['"agent-based model" AND (policy OR social)', '"integrated assessment model"', '"system dynamics" AND (policy OR transition)'],
    terms: [
      "agent-based model", "system dynamics", "integrated assessment model",
      "counterfactual analysis", "model uncertainty", "deep uncertainty",
      "exploratory modelling", "exploratory modeling", "scenario discovery",
      "robust decision making", "structural uncertainty",
    ],
  },

  // ── Technology and society ────────────────────────────────────────────────
  {
    id: "sts",
    cluster: "society",
    label: "Expectations and imaginaries",
    probes: ['"sociotechnical imaginaries"', '"technology assessment"', '"sociology of expectations"', '"hype cycle"'],
    terms: [
      "sociotechnical", "socio-technical", "science and technology studies", "imaginar",
      "technology assessment", "co-production", "hype cycle", "promissory", "expectation dynamics",
      "boundary work", "co-construction",
    ],
  },
  {
    id: "responsible-innovation",
    cluster: "society",
    label: "Responsible innovation",
    probes: ['"responsible innovation"', '"value sensitive design"', '"design for values"', '"anticipatory ethics"'],
    terms: [
      "responsible innovation", "responsible research and innovation", "value sensitive design",
      "design for values", "ethics of technology", "anticipatory ethics", "ethics washing",
      "value tension", "moral overload", "ethics guideline",
    ],
  },
  {
    id: "public-engagement",
    cluster: "society",
    label: "Publics and deliberation",
    probes: ['"public engagement" AND (science OR technolog)', '"citizens assembly"', '"deliberative" AND (technolog OR ai)', '"science communication"'],
    terms: [
      "public engagement", "citizen science", "deliberative", "citizens' assembly",
      "citizens assembly", "mini-public", "participatory", "science communication",
      "public understanding of science", "focus group",
    ],
  },
  {
    id: "belief-and-values",
    cluster: "society",
    label: "Belief, meaning, values",
    probes: ['"religion" AND (artificial intelligence OR technolog)', '"moral status" AND (ai OR machine)', '"theology" AND technolog'],
    terms: [
      "religion and technology", "theolog", "moral status", "moral philosophy", "spiritual",
      "meaning in life", "faith communit", "religious", "transhumanis", "techno-optimis",
      "techno-solutionis", "eschatolog",
    ],
  },

  // ── Land and transition ───────────────────────────────────────────────────
  {
    id: "rural-futures",
    cluster: "earth",
    label: "Rural futures",
    probes: ['"rural depopulation"', '"shrinking regions"', '"left-behind places"', '"rural revitalisation"', '"rural revitalization"'],
    terms: [
      "rural depopulation", "depopulation", "shrinking region", "shrinking cities",
      "left-behind place", "regional inequality", "peripheral region", "land abandonment",
      "rural revital", "village", "rural decline", "counterurbani",
    ],
  },
  {
    id: "transitions",
    cluster: "earth",
    label: "Transitions",
    probes: ['"sustainability transition"', '"energy transition" AND (governance OR justice OR infrastructure)', '"multi-level perspective"', '"just transition"'],
    terms: [
      "sustainability transition", "energy transition", "multi-level perspective",
      "socio-technical transition", "just transition", "degrowth", "circular economy",
      "niche innovation", "regime shift", "phase-out",
    ],
  },
  {
    id: "climate-futures",
    cluster: "earth",
    label: "Climate futures",
    probes: ['"climate scenario"', '"shared socioeconomic pathway"', '"tipping point" AND climate', '"climate adaptation" AND planning'],
    terms: [
      "climate scenario", "climate adaptation", "sea level rise", "planetary boundaries",
      "tipping point", "shared socioeconomic pathway", "overshoot", "flood risk",
      "climate projection", "adaptation pathway",
    ],
  },
  {
    id: "land-and-siting",
    cluster: "earth",
    label: "Land, siting, consent",
    probes: ['"spatial planning" AND (infrastructure OR energy)', '"land use conflict"', '"local opposition" AND (infrastructure OR energy)'],
    terms: [
      "spatial planning", "land use conflict", "land use change", "facility siting",
      "site selection", "local opposition",
      "community acceptance", "social licence", "social license", "nimby", "planning permission",
      "gentrification", "housing supply",
    ],
  },

  // ── Living systems ────────────────────────────────────────────────────────
  {
    id: "unconventional-computing",
    cluster: "living",
    label: "Unconventional computing",
    probes: ['"unconventional computing"', '"physarum"', '"reservoir computing"', '"morphological computation"'],
    terms: [
      "unconventional computing", "physarum", "slime mould", "slime mold", "reservoir computing",
      "morphological computation", "biocomputing", "wetware", "molecular computing",
      "material computation", "in-materio",
    ],
  },
  {
    id: "collective-behaviour",
    cluster: "living",
    label: "Collective behaviour",
    probes: ['"swarm intelligence"', '"collective behaviour"', '"stigmergy"', '"self-organisation" AND (network OR pattern)'],
    terms: [
      "swarm intelligence", "swarm robotic", "collective behaviour", "collective behavior",
      "stigmergy", "self-organi", "emergent structure", "ant colony", "flocking",
      "distributed decision", "quorum sensing",
    ],
  },
  {
    id: "underground-networks",
    cluster: "living",
    label: "Underground networks",
    probes: ['"mycorrhizal network"', '"fungal network"', '"soil microbiome" AND network'],
    terms: [
      "mycorrhiz", "fungal network", "mycelium", "mycelial", "soil microbiome",
      "root network", "hyphal", "common mycorrhizal network", "wood wide web",
    ],
  },
  {
    id: "pattern-formation",
    cluster: "living",
    label: "Pattern formation",
    probes: ['"reaction-diffusion"', '"turing pattern"', '"pattern formation" AND (biolog OR chemical OR physical)'],
    terms: [
      "reaction-diffusion", "reaction diffusion", "turing pattern", "morphogenesis",
      "pattern formation", "excitable medium", "phase separation", "differential growth",
      "spatial self-organi",
    ],
  },

  // ── Evidence and the record ───────────────────────────────────────────────
  {
    id: "data-visualisation",
    cluster: "evidence",
    label: "Data visualisation",
    probes: ['"data visualization" AND (perception OR uncertainty OR narrative)', '"visual analytics"', '"uncertainty visualization"', '"graphical perception"'],
    terms: [
      "data visualization", "data visualisation", "visual analytics", "graphical perception",
      "uncertainty visuali", "chart design", "data storytelling", "infographic",
      "visual encoding", "glyph design",
    ],
  },
  {
    id: "statistics-in-public",
    cluster: "evidence",
    label: "Numbers in public",
    probes: ['"risk communication"', '"statistical literacy"', '"uncertainty communication"', '"misleading" AND (statistic OR graph OR chart)'],
    terms: [
      "risk communication", "statistical literacy", "uncertainty communication", "numeracy",
      "framing effect", "misleading graph", "misleading statistic", "cherry-pick",
      "selective reporting", "index construction", "composite indicator",
    ],
  },
  {
    id: "epistemics",
    cluster: "evidence",
    label: "Epistemics and provenance",
    probes: ['"misinformation"', '"synthetic media"', '"trust in science"', '"content provenance"'],
    terms: [
      "misinformation", "disinformation", "epistemic", "trust in science", "synthetic media",
      "deepfake", "provenance", "fact-check", "information ecosystem", "source credibility",
      "model collapse", "data contamination",
    ],
  },
  {
    id: "research-infrastructure",
    cluster: "evidence",
    label: "The research record itself",
    probes: ['"open access" AND (policy OR infrastructure)', '"research assessment"', '"reproducibility crisis"', '"scientometric"'],
    terms: [
      "open access", "reproducib", "replication crisis", "replication study", "preprint",
      "peer review", "research assessment",
      "bibliometric", "scientometric", "research integrity", "paper mill", "retraction",
      "citation practice",
    ],
  },
];

/**
 * The bin. Two blocklists, both applied AFTER a topic match, because the topic
 * terms are broad enough to drag in a neighbouring field: "quantum computing"
 * matches a paper on quantum chemistry for drug discovery, "automation bias"
 * matches a radiology study. Neither is wrong, both are somebody else's radar.
 *
 * These are published on the page with the rest of the rules. If good work is
 * being binned, cut a term here.
 */
export const VENUE_BLOCK = [
  "medic", "nursing", "nurse", "dental", "dentistr", "surgery", "surgical",
  "clinical", "oncolog",
  "radiolog", "pharmac", "veterinar", "orthop", "psychiatr", "cardio", "diabet",
  "cancer", "obstet", "pediatr", "paediatr", "physiother", "rehabilitation",
  "agronom", "poultry", "aquacultur", "horticultur", "food science",
  "tourism", "hospitality", "sports medicine", "sport science", "accounting",
  "dermatolog", "ophthalmolog",
  "anesthes", "anaesthes", "immunolog", "microbiolog and infect",
];

export const TEXT_BLOCK = [
  "clinical trial", "randomised controlled trial", "randomized controlled trial",
  "patient outcome", "in vitro", "cell line", "mouse model", "murine",
  "crop yield", "soil fertiliser", "soil fertilizer", "livestock",
  "medical students", "nursing students", "dental students",
  "tourist", "hotel guest", "athlete performance",
];

/**
 * Query groups: which topics share one call to OpenAlex.
 *
 * This exists because of a hard budget, not because it is elegant. OpenAlex
 * meters by credits (1000 a day for a keyless caller) and charges a flat 10 for
 * a search however many rows come back, so the number of QUERIES is the whole
 * cost and the number of ROWS is free. One query per topic was 40 calls a run,
 * which is over budget by the second refresh of the day; one query per subject
 * was cheap but let a prolific topic crowd out a quiet one inside its own
 * subject (climate futures publishes roughly forty times what rural futures
 * does, and a date-sorted merge of the two is just climate).
 *
 * So: topics are paired inside their subject, one call per pair, 50 rows each.
 * Same recall as the per-topic version for a fifth of the credits.
 *
 * Every topic must appear in exactly one group. There is a check for that in
 * lib/horizon-scan/openalex.ts, which throws at build rather than quietly
 * dropping a topic from retrieval.
 */
export const QUERY_GROUPS: { id: string; topics: string[] }[] = [
  { id: "q-machines", topics: ["quantum-computing", "quantum-networks"] },
  { id: "q-instruments", topics: ["quantum-sensing", "wave-optics"] },
  { id: "q-security", topics: ["post-quantum", "quantum-expectations"] },
  { id: "ai-capability", topics: ["frontier-capability", "agents"] },
  { id: "ai-risk", topics: ["ai-safety", "ai-evaluation"] },
  { id: "ai-people", topics: ["ai-and-work", "human-ai"] },
  { id: "compute-plant", topics: ["data-centres", "energy-water"] },
  { id: "compute-supply", topics: ["chips", "compute-governance"] },
  { id: "power-markets", topics: ["concentration", "sovereignty"] },
  { id: "power-force", topics: ["military-ai", "jurisdiction-experiments"] },
  { id: "foresight-method", topics: ["scenarios", "speculative-design"] },
  { id: "foresight-numbers", topics: ["forecasting", "modelling"] },
  { id: "society-expectations", topics: ["sts", "responsible-innovation"] },
  { id: "society-publics", topics: ["public-engagement", "belief-and-values"] },
  { id: "earth-places", topics: ["rural-futures", "land-and-siting"] },
  { id: "earth-transition", topics: ["transitions", "climate-futures"] },
  { id: "living-computing", topics: ["unconventional-computing", "collective-behaviour"] },
  { id: "living-networks", topics: ["underground-networks", "pattern-formation"] },
  { id: "evidence-pictures", topics: ["data-visualisation", "statistics-in-public"] },
  { id: "evidence-record", topics: ["epistemics", "research-infrastructure"] },
];

/** How far back the standing search looks, in days. */
export const WINDOW_DAYS = 180;

/** Rows per OpenAlex call. Costs the same as asking for one, so ask for plenty. */
export const PER_QUERY = 50;

/**
 * Cache lifetime for every upstream call, in seconds.
 *
 * Once a day. Journals do not publish faster than that in any way a reader
 * would notice, and it puts the whole run at 220 of OpenAlex's 1000 daily
 * credits, so a preview deployment and a local session can share the
 * allowance without anyone hitting a 429.
 */
export const REVALIDATE_SECONDS = 24 * 60 * 60;

/**
 * Cards rendered. Retrieval clears this most days, and the page says by how
 * much. A hundred is about a browsing session; the two hundred it used to be
 * was a wall nobody reached the bottom of.
 */
export const MAX_HELD = 100;

/** How many go in the digest at the top of the page. */
export const TOP_PICKS = 10;

/**
 * No subject may take more than this share of the page.
 *
 * Quantum has the most distinctive vocabulary of the nine, so it matches
 * hardest and it was taking a third of the list on its own, which made the
 * page read as a quantum feed with other things in it. Papers over the cap are
 * pushed to the end rather than dropped, so nothing is hidden, and the cap is
 * on the PRIMARY subject only: a crossover paper counts once, against the
 * subject it lands in hardest.
 */
export const MAX_PER_SUBJECT = 16;
/** The same, for the ten at the top, which should read as a spread. */
export const DIGEST_PER_SUBJECT = 2;

/**
 * What counts as interesting.
 *
 * The honest problem with a keyword feed is that keywords cannot tell a finding
 * from a framework, and academia produces far more frameworks. Everything below
 * is a signal you can read off the paper's own words, so it stays the same kind
 * of rule as the rest of this file and gets printed next to it.
 *
 * `claim`  — the paper says it found something. Papers that report a result
 *            phrase it this way; papers that propose a scaffold do not.
 * `stakes` — the result is about something large, irreversible or unprecedented.
 * `dull`   — the signature of a paper with no finding in it. Weighted twice as
 *            heavily when it is in the TITLE, because a title is a promise:
 *            "Towards a conceptual framework for..." is telling you.
 *
 * This is a heuristic about wording, not a judgement about worth. A careful
 * review is not a bad paper; it is a bad opening item for a page whose job is
 * to surface things worth chasing. There is a sort that puts it first and it
 * never removes anything.
 */
export const SPARK = {
  claim: [
    "we find", "we show", "we demonstrate", "we estimate", "we report",
    "we observe", "we identify", "our results show", "our findings",
    "here we", "for the first time", "first demonstration", "first evidence",
    "contrary to", "counter to", "surprisingly", "unexpectedly",
    "we find no evidence", "no evidence that", "challenges the",
    "overturn", "revises", "contradicts", "reveals that", "turns out",
    "outperform", "we built", "we deployed", "we release",
  ],
  stakes: [
    "unprecedented", "orders of magnitude", "irreversible", "tipping point",
    "at risk", "worldwide", "global", "billion", "trillion", "gigawatt",
    "terawatt", "decades", "century", "existential", "catastrophic",
    "collapse", "unsustainable", "faster than expected", "underestimat",
    "systemic",
  ],
  dull: [
    "framework", "taxonomy", "conceptual model", "systematic review",
    "systematic literature", "scoping review", "bibliometric", "meta-analysis",
    "towards a", "toward a", "a review of", "an overview of", "state of the art",
    "research agenda", "questionnaire", "survey of practitioners",
    "curriculum", "pedagog", "students", "case study of", "a study of",
    "maturity model", "roadmap for", "guidelines for", "we propose a framework",
    "position paper", "editorial", "commentary on",
  ],
};

/** How much `spark` may move a paper, in the same points as the rest of the
 *  ranking (freshness 6, crossover 5, standing 4). */
export const SPARK_WEIGHT = 6;

/**
 * The bar a record has to clear to be held at all.
 *
 * A single accept term, once, in the middle of an abstract is a mention, not a
 * subject, and holding on one of those is what made the first build enormous
 * and boring: half of what came back was an agricultural economics paper that
 * used the phrase "agent-based model" in its methods. So a record is kept only
 * if at least one topic matched SOLIDLY (in the title, or twice over), or if
 * two different topics matched at all. Everything else is counted and dropped,
 * and the count is on the page.
 */
export const MIN_SOLID_TOPICS = 1;
export const MIN_WEAK_TOPICS = 2;

/** Abstracts are cut to this before they leave the server. */
export const ABSTRACT_CHARS = 1100;

export const clusterById = (id: ClusterId): Cluster =>
  CLUSTERS.find((c) => c.id === id)!;

export const topicById = (id: string): Topic | undefined =>
  TOPICS.find((t) => t.id === id);

export const topicsOf = (cluster: ClusterId): Topic[] =>
  TOPICS.filter((t) => t.cluster === cluster);
