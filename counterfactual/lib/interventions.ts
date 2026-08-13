/**
 * The intervention set.
 *
 * Every entry here is what the model will eventually be asked to produce: a
 * typed, dated set of transforms over the published series, each with a stated
 * reason and a confidence. Nothing in this file is a data point. Hand-authored
 * for now so the interaction is real before there is an API behind it — the
 * shape is the contract, and a generated intervention has to satisfy it too.
 *
 * Confidence is used honestly:
 *   well-evidenced — the transform follows from the premise almost definitionally
 *   arguable       — a mechanism you could defend in a seminar, with a real counter
 *   speculative    — a guess with a direction but no defensible magnitude
 */

export type Op = "growthRate" | "levelShift" | "cap" | "freeze" | "converge";

export type Confidence = "well-evidenced" | "arguable" | "speculative";

export type Effect = {
  figureId: string;
  op: Op;
  /** growthRate: multiplier on year-on-year change. levelShift: fractional shift.
   *  cap / converge: an absolute value in the figure's own units. freeze: unused. */
  magnitude: number;
  /** Years for a levelShift or converge to reach full effect. Default 1. */
  rampYears?: number;
  /** Years after the intervention date before this effect starts. Default 0. */
  lag?: number;
  /** Restrict to named series. Omitted means all of them. */
  series?: string[];
  rationale: string;
  confidence: Confidence;
};

export type Intervention = {
  id: string;
  /** What someone might type to reach this one. Weak on purpose — see matchFrom. */
  keywords: string[];
  /** What you would have typed to get this. */
  prompt: string;
  /** A clause that is only true at the authored year, dropped if the date moves. */
  anchor?: string;
  short: string;
  summary: string;
  levers: string[];
  from: number;
  fromRange: [number, number];
  effects: Effect[];
  objection: { claim: string; response: string };
};

export const INTERVENTIONS: Intervention[] = [
  /* ------------------------------------------------------------------------ */
  {
    id: "moratorium",
    keywords: ["moratorium", "pause", "stop training", "halt training", "ban training", "stop making", "bigger models", "scaling", "frontier", "flop", "training cap", "freeze development"],
    prompt: "Everyone stops training bigger models",
    short: "Stop training bigger models",
    summary:
      "Frontier training is licensed and capped. Everything below the threshold carries on; everything above it stops.",
    levers: ["moratorium", "compute-cap", "regulation"],
    from: 2026,
    fromRange: [2019, 2029],
    effects: [
      {
        figureId: "1.1.13",
        op: "cap",
        magnitude: 1e11,
        rationale:
          "The cap is the intervention. 10^26 FLOP is 10^11 petaFLOP, so the top of the cloud is sheared off flat and everything beneath it is untouched.",
        confidence: "well-evidenced",
      },
      {
        figureId: "1.4.2",
        op: "cap",
        magnitude: 2.5e7,
        rationale:
          "At fixed hardware efficiency, training power draw tracks compute almost linearly. A compute ceiling is a power ceiling of roughly 25 MW.",
        confidence: "arguable",
      },
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 0.45,
        lag: 1,
        rationale:
          "Inference demand keeps the buildout going. It is the training share of new capacity that stalls, not the whole of it.",
        confidence: "arguable",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 0.35,
        lag: 1,
        rationale:
          "Benchmark gains since 2023 came from scale and post-training together. Algorithmic and post-training progress continue; the scale half stops.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.3",
        op: "growthRate",
        magnitude: 0.2,
        rationale:
          "Generative AI valuations are priced on the next model being better than the last one. Remove that and the funding case goes with it.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.45,
        rationale:
          "Corporate AI investment is over half infrastructure and frontier-lab funding by 2025. Both are directly exposed to the cap.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 0.45,
        series: ["United States", "Europe"],
        rationale: "Signatory jurisdictions absorb the full effect of the cap.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 0.85,
        series: ["China"],
        rationale:
          "A non-signatory, or a signatory with weaker verification, keeps most of its trajectory. This is where the moratorium leaks.",
        confidence: "speculative",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.5,
        rationale:
          "Private capital is the most exposed layer: it is priced on the next model, and the next model is what stops.",
        confidence: "arguable",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 0.55,
        lag: 1,
        rationale:
          "Organisations keep deploying what exists. What stops is the annual step change in capability that keeps pulling new functions into scope.",
        confidence: "arguable",
      },
      {
        figureId: "8.3.1",
        op: "growthRate",
        magnitude: 0.6,
        rationale:
          "Public supercomputers serve climate, biology and physics as well as frontier training. Only part of the pipeline stops.",
        confidence: "arguable",
      },
      {
        figureId: "8.4.1",
        op: "levelShift",
        magnitude: 0.5,
        rampYears: 2,
        rationale:
          "A moratorium is itself legislation, and a treaty spawns domestic implementing law in every signatory.",
        confidence: "arguable",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 0.7,
        lag: 1,
        rationale:
          "Fewer new capabilities reach deployment, but everything already in the field keeps failing at the same rate.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "A compute cap just moves the frontier offshore. The runs still happen; they simply stop being reported.",
      response:
        "Partly conceded, and it is why the China series here is damped far less than the US and Europe. But a 10^26 FLOP run needs a gigawatt-class site and tens of thousands of leading-edge accelerators, and both are visible: one from orbit, the other through three chokepoint suppliers. Of all the things in this report, frontier training is the hardest to hide.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "eu-act-global",
    keywords: ["regulat", "govern", "ai act", "law", "legislat", "rules", "compliance", "brussels", "europe", "safety standards", "licence", "license"],
    prompt: "What if governments had regulated AI back in 2021",
    anchor: ", when the EU was still drafting the Act?",
    short: "Regulate it everywhere",
    summary:
      "Risk tiering, conformity assessment before market, and transparency obligations — applied in every jurisdiction rather than one.",
    levers: ["regulation", "liability", "transparency", "public-opinion"],
    from: 2021,
    fromRange: [2018, 2029],
    effects: [
      {
        figureId: "8.4.1",
        op: "levelShift",
        magnitude: 1.4,
        rampYears: 2,
        rationale:
          "The premise is the transform. Every G20 member passes an implementing act, and most pass several.",
        confidence: "well-evidenced",
      },
      {
        figureId: "8.4.10",
        op: "levelShift",
        magnitude: 0.9,
        rampYears: 2,
        rationale:
          "Agency-level rulemaking follows statute with a lag of a year or two, and the Act delegates a great deal of it.",
        confidence: "well-evidenced",
      },
      {
        figureId: "9.3.1",
        op: "levelShift",
        magnitude: 0.28,
        rationale:
          "Trust in government regulation of AI is mostly trust that any regulation exists. The countries at the bottom of this ranking are the ones without a statute.",
        confidence: "arguable",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 0.75,
        lag: 1,
        rationale:
          "Conformity assessment adds months between building a system and deploying it. Adoption slows; it does not stop.",
        confidence: "arguable",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 0.55,
        lag: 1,
        rationale:
          "Pre-market assessment for high-risk systems catches a share of what currently ships and then fails in public.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.7,
        rationale:
          "Compliance cost is a drag on corporate investment, but a smaller one than the headlines suggest — most capital here is infrastructure, which the Act barely touches.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 0.72,
        rationale: "Private investment carries the same compliance drag as corporate.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.72,
        rationale:
          "The same compliance drag on the private total. Conformity assessment is a fixed cost, so it bites hardest on the smallest rounds.",
        confidence: "arguable",
      },
      {
        figureId: "4.4.1",
        op: "growthRate",
        magnitude: 0.88,
        rationale:
          "Regulation destroys some deployment roles and creates compliance ones. The net effect on AI job postings is small and negative.",
        confidence: "speculative",
      },
    ],
    objection: {
      claim:
        "The Act's high-risk tier covers a narrow slice of what is actually deployed. Most of what people use daily is minimal-risk and untouched by any of this.",
      response:
        "True of the Act as written, and the transforms reflect it — adoption is damped by about a quarter, not halted, and investment barely moves. What shifts most here is lawmaking and public trust, not the economy. If you expected an economic shock, that expectation is the thing this chart is arguing with.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "datacenters-halted",
    keywords: ["data cent", "datacent", "data-cent", "server farm", "stop building", "halt construction", "construction", "no new", "electricity", "grid", "water"],
    prompt: "Stop building new data centres",
    short: "Stop building data centres",
    summary:
      "No new AI data centre capacity comes online. Everything already built keeps running; nothing is added.",
    levers: ["data-centers", "energy", "compute-cap"],
    from: 2027,
    fromRange: [2022, 2029],
    effects: [
      {
        figureId: "1.2.4",
        op: "freeze",
        magnitude: 0,
        rationale:
          "Definitional. Cumulative capacity holds at whatever was standing on the day construction stopped.",
        confidence: "well-evidenced",
      },
      {
        figureId: "8.3.1",
        op: "growthRate",
        magnitude: 0.15,
        rationale:
          "A handful of public machines already under construction are completed. Nothing new is started.",
        confidence: "well-evidenced",
      },
      {
        figureId: "1.1.13",
        op: "cap",
        magnitude: 3e9,
        lag: 1,
        rationale:
          "With capacity fixed, the largest feasible training run is fixed too — and it has to share the site with everything else the operator sells.",
        confidence: "arguable",
      },
      {
        figureId: "1.4.2",
        op: "cap",
        magnitude: 8e6,
        lag: 1,
        rationale: "The same ceiling, expressed in watts.",
        confidence: "arguable",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 0.4,
        lag: 1,
        rationale:
          "Capability gains continue on algorithms and data quality, but the scaling half of the curve is capped by the hardware that exists.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.35,
        rationale:
          "A large share of 2024–25 corporate AI investment is literally buildings and power. Remove the buildings and the number falls hard.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.3",
        op: "growthRate",
        magnitude: 0.3,
        rationale:
          "Generative AI companies raise against projected inference capacity they can no longer be sold.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.35,
        rationale:
          "Private rounds since 2023 have been raised largely to buy compute. With no compute to buy, the round has no use of proceeds.",
        confidence: "arguable",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 0.7,
        lag: 1,
        rationale:
          "Incidents track how much is deployed. Capacity-bound deployment means a slower-growing surface for things to go wrong on.",
        confidence: "arguable",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 0.6,
        lag: 1,
        rationale:
          "Adoption becomes rationing. Organisations that already have capacity keep it; new entrants queue.",
        confidence: "arguable",
      },
      {
        figureId: "4.4.1",
        op: "growthRate",
        magnitude: 0.6,
        lag: 1,
        rationale: "Hiring follows deployment, and deployment is now capacity-bound.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "You cannot halt construction without halting inference, and halting inference means switching off products hundreds of millions of people already use.",
      response:
        "Which is exactly why adoption here flattens rather than falls. The transform freezes new capacity; it does not demolish the 29.6 GW already standing. What it really models is a hard ceiling on how many people can be served at once — and the interesting result is that the capability curve barely notices for two years while the investment curve collapses immediately.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "export-controls-dropped",
    keywords: ["export", "chip", "sanction", "nvidia", "trade", "tariff", "sell", "controls", "embargo"],
    prompt: "Sell the best chips to anyone who can pay",
    short: "Sell chips to anyone",
    summary:
      "Leading-edge accelerators sell to anyone who can pay. No end-use restrictions, no entity lists.",
    levers: ["export-controls", "compute-cap", "public-investment"],
    from: 2022,
    fromRange: [2019, 2029],
    effects: [
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 2.6,
        series: ["China"],
        rationale:
          "Capital follows access to accelerators. The Chinese private investment line is depressed by a supply constraint more than by appetite.",
        confidence: "arguable",
      },
      {
        figureId: "8.3.1",
        op: "growthRate",
        magnitude: 1.8,
        series: ["China", "East Asia and Pacific"],
        rationale:
          "State-backed machines are the easiest thing to build when the only missing input was the chips.",
        confidence: "arguable",
      },
      {
        figureId: "1.1.13",
        op: "levelShift",
        magnitude: 0.25,
        rampYears: 3,
        lag: 1,
        rationale:
          "A larger global accelerator supply lifts the whole distribution somewhat, not just its top.",
        confidence: "speculative",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 1.15,
        lag: 1,
        rationale:
          "More labs at the frontier means more shots at the benchmark, and these curves record the best result anyone got.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 1.2,
        rationale: "A larger addressable market for compute pulls in more capital everywhere.",
        confidence: "speculative",
      },
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 1.3,
        rationale: "Nothing constrains where capacity gets built.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 1.25,
        rationale:
          "A larger buildable market pulls more private capital in behind it, most visibly outside the US.",
        confidence: "speculative",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 1.1,
        lag: 1,
        rationale:
          "More serving capacity, sooner, means fewer organisations queuing for it. Adoption is partly a rationing curve.",
        confidence: "speculative",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 1.25,
        lag: 1,
        rationale:
          "More systems deployed by more operators in more jurisdictions, with no corresponding increase in oversight.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "This assumes export controls are the binding constraint. They are not — fabrication capacity and high-bandwidth memory supply are, and neither is set by US policy.",
      response:
        "Fair, and it is why the China investment multiplier does most of the work here while the compute distribution barely moves. If the binding constraint sits upstream of the control, then lifting the control moves money long before it moves silicon. The shape of this counterfactual is the argument: money reacts in a year, compute does not react for three.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "developer-liability",
    keywords: ["liab", "sue", "lawsuit", "responsib", "accountab", "insur", "harm", "damages", "negligen", "pay for", "consequences"],
    prompt: "What if AI companies had been liable for harm since 2020",
    anchor: ", the year GPT-3 shipped?",
    short: "Make them pay for harm",
    summary:
      "Whoever trained the model is liable for what it does, regardless of who deployed it or how.",
    levers: ["liability", "safety-testing", "regulation"],
    from: 2020,
    fromRange: [2016, 2029],
    effects: [
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 0.4,
        lag: 1,
        rationale:
          "Insurers price what regulators do not. Underwriting becomes the gate on release, and underwriters are conservative.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 0.75,
        rationale:
          "An unbounded tail liability is very hard to raise against, and venture capital is the most exposed part of this stack.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.72,
        rationale: "The same drag, diluted by infrastructure spending that carries no such risk.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.3",
        op: "growthRate",
        magnitude: 0.55,
        rationale:
          "Generative systems are general-purpose, which under strict liability means the harm surface is also general-purpose.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.75,
        rationale:
          "Venture capital is the layer least able to price an unbounded tail liability, and the first to reprice when it appears.",
        confidence: "arguable",
      },
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 0.8,
        lag: 1,
        rationale:
          "Buildout is underwritten against projected demand. Slower procurement means fewer sites financed.",
        confidence: "arguable",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 0.7,
        lag: 1,
        rationale:
          "Enterprise procurement slows when the vendor's indemnity gets expensive, and it gets expensive immediately.",
        confidence: "arguable",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 0.8,
        lag: 1,
        rationale:
          "Release cadence slows under evaluation requirements, and these curves record released systems rather than internal ones.",
        confidence: "arguable",
      },
      {
        figureId: "8.4.10",
        op: "levelShift",
        magnitude: 0.35,
        rampYears: 3,
        rationale: "A liability regime needs an agency to administer it, and agencies write rules.",
        confidence: "arguable",
      },
      {
        figureId: "9.3.1",
        op: "levelShift",
        magnitude: 0.18,
        rationale:
          "A liability regime is the most legible form of regulation to a survey respondent: someone is on the hook.",
        confidence: "speculative",
      },
    ],
    objection: {
      claim:
        "Strict liability does not reduce harm. It reduces disclosure. Incidents stop being reported, not stop happening.",
      response:
        "Genuinely unresolved, and the incident figure is the one to distrust here. The AI Incident Database counts *reported* incidents drawn from news coverage, so the same downward transform is equally consistent with fewer failures and with fewer admissions. An honest version of this chart needs a second line for reporting rate, and no such series exists anywhere in the report.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "public-compute",
    keywords: ["public", "state fund", "government fund", "nationalis", "nationaliz", "academ", "universit", "research access", "free compute", "supercomputer"],
    prompt: "Give every researcher free supercomputer time",
    short: "Public compute for everyone",
    summary:
      "States fund large machines and hand out time on them by peer review rather than by ability to pay.",
    levers: ["public-investment", "open-weights", "education", "compute-cap"],
    from: 2019,
    fromRange: [2015, 2029],
    effects: [
      {
        figureId: "8.3.1",
        op: "growthRate",
        magnitude: 2.2,
        rationale: "This figure counts exactly the thing being funded.",
        confidence: "well-evidenced",
      },
      {
        figureId: "1.1.13",
        op: "levelShift",
        magnitude: 3,
        rampYears: 3,
        series: ["Academia"],
        rationale:
          "The gap between the academic and industry clouds on this chart is a funding gap, not a talent gap. Allocated compute closes part of it.",
        confidence: "arguable",
      },
      {
        figureId: "1.1.13",
        op: "levelShift",
        magnitude: 1.2,
        rampYears: 3,
        series: ["Industry-academia collaboration"],
        rationale:
          "Collaborations are already the route academics take to compute; a public alternative raises their floor too.",
        confidence: "speculative",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 1.1,
        lag: 2,
        rationale:
          "A wider frontier produces more attempts on each benchmark, and these curves record the best attempt.",
        confidence: "speculative",
      },
      {
        figureId: "4.2.11",
        op: "growthRate",
        magnitude: 0.85,
        rationale:
          "Some private capital is crowded out where a public option exists. Not much — the public machines are not competing for the same work.",
        confidence: "speculative",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.9,
        rationale: "The same mild crowding-out, across all four investment categories.",
        confidence: "speculative",
      },
      {
        figureId: "4.4.1",
        op: "growthRate",
        magnitude: 1.15,
        lag: 2,
        rationale:
          "More trained researchers reaching the labour market, and a public sector that now employs some of them directly.",
        confidence: "speculative",
      },
      {
        figureId: "8.4.1",
        op: "levelShift",
        magnitude: 0.3,
        rampYears: 3,
        rationale:
          "Funding a national compute programme requires an authorising statute, and usually several amendments to it.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.85,
        rationale:
          "A public option crowds out some private funding at the research end, where the two actually compete.",
        confidence: "speculative",
      },
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 1.15,
        rationale:
          "Public machines are additional capacity, not a substitute for private capacity. The total goes up.",
        confidence: "arguable",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 1.05,
        lag: 2,
        rationale:
          "More researchers trained on real systems, reaching organisations that would otherwise have waited.",
        confidence: "speculative",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 1.2,
        lag: 2,
        rationale:
          "Wider access means more operators without safety teams. Openness has a failure surface, and this is where it shows up.",
        confidence: "speculative",
      },
    ],
    objection: {
      claim:
        "Public compute at frontier scale means the state operating a gigawatt data centre. No democracy has shown it can procure one of those on a five-year cycle.",
      response:
        "That is the weakest link here, and it is why almost every effect in this intervention is marked speculative. What the transform does not assume is that public compute matches private scale — the academic line rises by a factor of a few, not a factor of a thousand, and the industry cloud above it is left exactly where it was.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "carbon-price",
    keywords: ["carbon", "climate", "emission", "co2", "environment", "tax the", "carbon price", "polluter", "green"],
    prompt: "Put a carbon price on every training run",
    short: "Price the carbon",
    summary:
      "Training and serving a model costs what its emissions cost. Not a ban on anything — a bill.",
    levers: ["energy", "taxation", "compute-cap", "data-centers"],
    from: 2022,
    fromRange: [2018, 2029],
    effects: [
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 0.72,
        rationale:
          "Power stops being the cheap input in the model. Siting decisions move toward clean grids, which are slower to connect to than dirty ones.",
        confidence: "arguable",
      },
      {
        figureId: "1.1.13",
        op: "levelShift",
        magnitude: -0.3,
        rampYears: 3,
        lag: 1,
        rationale:
          "A priced externality bites hardest at the top of the distribution, where a single run is measured in gigawatt-hours.",
        confidence: "arguable",
      },
      {
        figureId: "1.4.2",
        op: "levelShift",
        magnitude: -0.35,
        rampYears: 3,
        lag: 1,
        rationale: "The same effect read in watts rather than FLOP.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.9,
        rationale:
          "A cost, not a prohibition. Private investment carries it rather than retreating from it.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.1",
        op: "growthRate",
        magnitude: 0.88,
        rationale:
          "Infrastructure spending absorbs most of the charge, since that is where the emissions are.",
        confidence: "arguable",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 0.92,
        lag: 1,
        rationale:
          "Capability barely notices. Efficiency research is the cheapest response to a carbon bill, and it substitutes for scale.",
        confidence: "speculative",
      },
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 0.95,
        rationale: "Inference gets marginally dearer; adoption barely registers it.",
        confidence: "speculative",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 0.97,
        rationale:
          "Almost nothing. A carbon price is not a safety measure and this figure is the proof.",
        confidence: "arguable",
      },
      {
        figureId: "8.4.1",
        op: "levelShift",
        magnitude: 0.35,
        rampYears: 2,
        rationale: "The pricing mechanism itself needs a statute in every jurisdiction that levies it.",
        confidence: "well-evidenced",
      },
    ],
    objection: {
      claim:
        "A carbon price high enough to change frontier training would be an order of magnitude above anything levied anywhere. One low enough to survive a legislature is a rounding error next to a $500M training run.",
      response:
        "Largely conceded, and it is why almost every line here moves by a tenth rather than a half. That is the finding rather than a weakness of the model: on this dashboard the carbon price is the intervention that changes the least, and the figure it moves least of all is the safety one. If you came here expecting environmental policy to be AI policy, this is the chart that argues otherwise.",
    },
  },

  /* ------------------------------------------------------------------------ */
  {
    id: "open-weights",
    keywords: ["open source", "open-source", "opensource", "open weight", "open-weight", "release the weights", "publish the weights", "share the models"],
    prompt: "Everyone open-sources their models",
    short: "Open-source everything",
    summary:
      "Weights are published rather than served. Anyone can run, inspect and modify a frontier model; nobody can withhold one.",
    levers: ["open-weights", "transparency", "public-investment", "liability"],
    from: 2027,
    fromRange: [2020, 2029],
    effects: [
      {
        figureId: "4.3.1",
        op: "growthRate",
        magnitude: 1.2,
        rationale:
          "The licence stops being a gate. Organisations that were priced out or blocked on data residency can deploy.",
        confidence: "arguable",
      },
      {
        figureId: "3.2.1",
        op: "growthRate",
        magnitude: 1.45,
        lag: 1,
        rationale:
          "Many more operators, most without a safety team, and no way to withdraw a model that turns out to be dangerous. This is the cost side of openness and it lands here.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.2",
        op: "growthRate",
        magnitude: 0.78,
        rationale:
          "Hard to raise against a moat that anyone can download. Capital moves to the layers that stay scarce, which is compute and distribution.",
        confidence: "arguable",
      },
      {
        figureId: "4.2.3",
        op: "growthRate",
        magnitude: 0.65,
        rationale:
          "Generative AI valuations rest most directly on model access being controllable.",
        confidence: "arguable",
      },
      {
        figureId: "1.2.4",
        op: "growthRate",
        magnitude: 1.12,
        lag: 1,
        rationale:
          "Serving moves from a few large operators to many small ones, which is less efficient per query, not more.",
        confidence: "speculative",
      },
      {
        figureId: "2.1.1",
        op: "growthRate",
        magnitude: 1.06,
        lag: 1,
        rationale:
          "More groups building on the same starting point. These curves record the best result anyone got, and there are more people trying.",
        confidence: "speculative",
      },
      {
        figureId: "4.4.1",
        op: "growthRate",
        magnitude: 1.12,
        lag: 1,
        rationale: "Deployment work spreads to organisations that previously bought a service.",
        confidence: "speculative",
      },
      {
        figureId: "8.4.10",
        op: "levelShift",
        magnitude: 0.45,
        rampYears: 2,
        lag: 1,
        rationale:
          "Regulators respond to the loss of a single point of control by writing rules for everyone downstream of it.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "Open weights democratise nothing if running the model still needs a cluster you cannot afford. It moves the bottleneck rather than removing it.",
      response:
        "True at the frontier and false almost everywhere else, which is why adoption moves more here than capability does. The ninety percent of deployment that runs a small model on ordinary hardware is exactly the part a licence was gating. What the objection gets right is who captures the value: the investment lines fall because the scarce thing becomes compute, and compute was never the part being opened.",
    },
  },
];

export const interventionById = (id: string) => INTERVENTIONS.find((i) => i.id === id);

/**
 * Free-text matching, standing in for the model.
 *
 * Deliberately weak: it looks for the words an intervention is about, scores by
 * how much of the sentence they account for, and gives up rather than returning
 * something adjacent. Each intervention carries its own keywords so a board can
 * be added without touching this function — and so nothing has to hand a
 * function across the server/client boundary.
 */
export function matchFrom(list: Intervention[], text: string): Intervention | null {
  const q = text.toLowerCase().trim();
  if (q.length < 3) return null;
  let best: { iv: Intervention; score: number } | null = null;
  for (const iv of list) {
    const score = iv.keywords.reduce((n, w) => n + (q.includes(w) ? w.length : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { iv, score };
  }
  return best?.iv ?? null;
}

/** A year written into the prompt is the date of the proposal, not decoration. */
export function yearIn(text: string): number | null {
  const hits = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const plausible = hits.filter((y) => y >= 1990 && y <= 2035);
  return plausible.length ? plausible[plausible.length - 1] : null;
}
