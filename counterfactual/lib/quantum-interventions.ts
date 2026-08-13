/**
 * Interventions for the quantum board.
 *
 * These are pointed at a live argument rather than an abstract one. Quantum
 * Delta NL's own 2025 report ends by asking for funding to continue past 2028,
 * when the National Growth Fund money runs out. Four of the six below are
 * versions of that question; the other two are the ways the field is usually
 * said to go wrong.
 *
 * Same contract as the AI Index set: typed, dated transforms, each with a stated
 * reason and a confidence. Nothing here is a data point.
 */

import type { Intervention } from "@/lib/interventions";

export const QUANTUM_INTERVENTIONS: Intervention[] = [
  {
    id: "q-funding-stops",
    keywords: ["stop", "runs out", "ends", "cut", "no more funding", "2028", "austerity"],
    prompt: "The Growth Fund money runs out in 2028 and nothing replaces it",
    short: "Funding stops in 2028",
    summary:
      "The €615M National Growth Fund programme ends on schedule. No successor, no bridge — the ecosystem carries on at whatever it can raise privately.",
    levers: ["public-investment", "talent", "eu-coordination"],
    from: 2029,
    fromRange: [2026, 2029],
    effects: [
      {
        figureId: "Q2",
        op: "levelShift",
        magnitude: -0.35,
        rampYears: 3,
        lag: 1,
        rationale:
          "Losing a third of the programme is losing a third of the people it pays for, phased over the time it takes contracts to run out. Papers lag by a year — a PhD already started finishes.",
        confidence: "arguable",
      },
      {
        figureId: "Q4",
        op: "levelShift",
        magnitude: -0.3,
        rampYears: 3,
        lag: 1,
        rationale:
          "Share is a race, and the denominator keeps growing whatever the Netherlands does.",
        confidence: "arguable",
      },
      {
        figureId: "Q6",
        op: "converge",
        magnitude: 90,
        rampYears: 3,
        rationale:
          "Public money is the signal private money reads. Dutch quantum rounds have been raised against a state commitment as much as against a product — investment falls back toward the companies that have revenue.",
        confidence: "arguable",
      },
      {
        figureId: "Q7",
        op: "levelShift",
        magnitude: -0.4,
        rampYears: 3,
        lag: 2,
        rationale:
          "Filings follow the research that generates them, with the lag of a patent process.",
        confidence: "arguable",
      },
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: -0.3,
        rampYears: 3,
        series: ["Netherlands"],
        lag: 1,
        rationale: "Only the Dutch line is exposed to a Dutch decision.",
        confidence: "well-evidenced",
      },
      {
        figureId: "Q1",
        op: "levelShift",
        magnitude: -0.01,
        rationale:
          "World output barely notices. The Netherlands is about 1% of it, and that is the uncomfortable half of this scenario.",
        confidence: "well-evidenced",
      },
    ],
    objection: {
      claim:
        "Research funding does not switch off like a tap. Groups have grants, chairs are permanent, and the good people were going to publish anyway.",
      response:
        "Which is why the effect here is dated a year late and damps rather than stops. What it models is hiring, not firing — the size of the next cohort rather than the fate of the current one. The honest limit is that a five-year window cannot show the part that actually matters, which is where a 2029 PhD student ends up in 2038.",
    },
  },

  {
    id: "q-funding-doubles",
    keywords: ["double", "renew", "more money", "increase", "invest more", "scale up"],
    prompt: "The Netherlands renews the quantum programme and doubles it",
    short: "Double the programme",
    summary:
      "A successor to the Growth Fund at twice the scale, aimed at the step Quantum Delta NL says is missing: from lab to factory.",
    levers: ["public-investment", "talent", "manufacturing"],
    from: 2029,
    fromRange: [2026, 2029],
    effects: [
      {
        figureId: "Q2",
        op: "levelShift",
        magnitude: 0.5,
        rampYears: 3,
        lag: 2,
        rationale:
          "Money buys people and people write papers, but the lag is a hiring cycle plus a publication cycle. Nothing happens in year one.",
        confidence: "arguable",
      },
      {
        figureId: "Q4",
        op: "levelShift",
        magnitude: 0.45,
        rampYears: 3,
        lag: 2,
        rationale: "Share moves only if Dutch growth outpaces a world that is also growing.",
        confidence: "arguable",
      },
      {
        figureId: "Q6",
        op: "levelShift",
        magnitude: 0.9,
        rampYears: 2,
        lag: 1,
        rationale:
          "Public commitment is the strongest de-risking signal a small market has. This is the line that moves first and fastest.",
        confidence: "arguable",
      },
      {
        figureId: "Q7",
        op: "levelShift",
        magnitude: 0.5,
        rampYears: 3,
        lag: 2,
        rationale: "A manufacturing push is a patenting push almost by definition.",
        confidence: "arguable",
      },
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: 0.45,
        rampYears: 3,
        series: ["Netherlands"],
        lag: 2,
        rationale: "Again, only the Dutch line responds to a Dutch decision.",
        confidence: "well-evidenced",
      },
    ],
    objection: {
      claim:
        "Doubling the budget of a small country's programme does not change a field where China's public commitment is an order of magnitude larger.",
      response:
        "Correct, and the world chart shows it: the global line does not move at all. The argument for the spend was never that it changes the field. It is that a supply chain has a handful of chokepoints and the Netherlands already owns one of them in lithography — which is a claim about position, not about volume, and no chart on this board can settle it.",
    },
  },

  {
    id: "q-started-earlier",
    keywords: ["earlier", "sooner", "started", "head start", "back in", "if we had"],
    prompt: "What if the Netherlands had started the quantum programme in 2015?",
    anchor: ", five years before it actually did?",
    short: "Start five years earlier",
    summary:
      "Quantum Delta NL was founded in 2020 and funded from 2021. This moves the whole thing to the middle of the decade before.",
    levers: ["public-investment", "talent", "eu-coordination"],
    from: 2015,
    fromRange: [2013, 2025],
    effects: [
      {
        figureId: "Q2",
        op: "growthRate",
        magnitude: 1.55,
        lag: 1,
        rationale:
          "Delft's output inflected around 2017 on its own. This is the same inflection arriving with money behind it rather than ahead of it.",
        confidence: "arguable",
      },
      {
        figureId: "Q4",
        op: "growthRate",
        magnitude: 1.5,
        lag: 1,
        rationale:
          "The share window matters more than the paper count: 2015–2020 is when China's line pulled away, and a share lost then is not recovered later.",
        confidence: "arguable",
      },
      {
        figureId: "Q3",
        op: "growthRate",
        magnitude: 1.45,
        series: ["Netherlands"],
        lag: 1,
        rationale: "The national line, compounded over ten years instead of five.",
        confidence: "arguable",
      },
      {
        figureId: "Q6",
        op: "growthRate",
        magnitude: 1.35,
        rationale:
          "A five-year head start on company formation is five more years of Series A rounds.",
        confidence: "speculative",
      },
      {
        figureId: "Q7",
        op: "growthRate",
        magnitude: 1.4,
        rationale: "Patents follow the same clock, one lag further back.",
        confidence: "speculative",
      },
    ],
    objection: {
      claim:
        "In 2015 there was nothing to fund at scale. The transmon and spin-qubit results that justify this programme had not happened yet, and money arriving early mostly buys the wrong things.",
      response:
        "The strongest objection in this set, and it is why every effect here is a damped growth multiplier rather than a level shift — the counterfactual compounds an existing trend instead of conjuring one. It is also worth noting what the chart shows about the actual history: Delft's inflection is in 2017, three years before Quantum Delta NL existed. The programme did not cause the rise it is credited with. It arrived after it.",
    },
  },

  {
    id: "q-talent-leaves",
    keywords: ["talent", "brain drain", "leave", "leaves", "emigrat", "poach", "america", "us labs"],
    prompt: "The best quantum researchers all leave for American labs",
    short: "The talent leaves",
    summary:
      "Google, IBM, PsiQuantum and the US national labs outbid European academia for the people, as they did in AI.",
    levers: ["talent", "public-investment"],
    from: 2026,
    fromRange: [2018, 2029],
    effects: [
      {
        figureId: "Q2",
        op: "levelShift",
        magnitude: -0.4,
        rampYears: 2,
        lag: 1,
        rationale:
          "A quantum group is three or four people deep at the top. Losing them is not a marginal loss of capacity, it is the end of a line of work.",
        confidence: "arguable",
      },
      {
        figureId: "Q4",
        op: "levelShift",
        magnitude: -0.4,
        rampYears: 2,
        lag: 1,
        rationale: "The papers do not stop existing; they stop having a Dutch affiliation.",
        confidence: "arguable",
      },
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: 0.06,
        rampYears: 2,
        series: ["United States"],
        lag: 1,
        rationale: "And they start having an American one. This is a transfer, not a loss.",
        confidence: "arguable",
      },
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: -0.4,
        rampYears: 2,
        series: ["Netherlands"],
        lag: 1,
        rationale: "The other side of the same transfer.",
        confidence: "arguable",
      },
      {
        figureId: "Q6",
        op: "levelShift",
        magnitude: -0.5,
        rampYears: 2,
        lag: 1,
        rationale:
          "Dutch quantum startups are spin-outs of Dutch labs. No founders, no companies, no rounds.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "This already happened in AI and European research did not collapse. People move, collaborations persist, and co-authorship means the papers keep both affiliations.",
      response:
        "Half right, and the transform reflects it — the US line rises by less than the Dutch line falls, because co-authored work is counted at both ends. What the AI comparison misses is scale: AI research needs a cluster you can rent, and quantum research needs a fabrication facility you cannot. Moving the person moves less of the capability in AI than it does here.",
    },
  },

  {
    id: "q-eu-pools",
    keywords: ["europe", "eu ", "pool", "together", "coordinat", "joint", "cern"],
    prompt: "Europe pools its quantum money instead of splitting it by country",
    short: "Europe pools its money",
    summary:
      "One European programme with one set of facilities, rather than twenty-seven national strategies each funding its own cleanroom.",
    levers: ["eu-coordination", "public-investment", "manufacturing"],
    from: 2027,
    fromRange: [2018, 2029],
    effects: [
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: 0.3,
        rampYears: 3,
        series: ["Germany"],
        lag: 2,
        rationale: "Pooling raises the European total; Germany is the largest single contributor to it.",
        confidence: "speculative",
      },
      {
        figureId: "Q3",
        op: "levelShift",
        magnitude: 0.28,
        rampYears: 3,
        series: ["Netherlands"],
        lag: 2,
        rationale:
          "A small country with a strong position gains from pooling — it buys access to facilities it could not fund alone.",
        confidence: "speculative",
      },
      {
        figureId: "Q2",
        op: "levelShift",
        magnitude: 0.25,
        rampYears: 3,
        lag: 2,
        rationale: "Delft is one of the places a pooled programme would concentrate work in.",
        confidence: "speculative",
      },
      {
        figureId: "Q4",
        op: "levelShift",
        magnitude: 0.2,
        rampYears: 3,
        lag: 2,
        rationale: "Share rises, but slowly: the world denominator is growing too.",
        confidence: "speculative",
      },
      {
        figureId: "Q6",
        op: "levelShift",
        magnitude: 0.18,
        rampYears: 2,
        lag: 1,
        rationale:
          "A larger, more predictable public market is easier to raise against, even for a national company.",
        confidence: "speculative",
      },
    ],
    objection: {
      claim:
        "Pooling means someone loses their national facility, and no member state has ever agreed to be the one that loses it.",
      response:
        "Which is why every effect in this intervention is marked speculative. The transform models the technical case for concentration and ignores the political case against it entirely, and the political case has won every time it has been tested. Read this one as the ceiling of what coordination could buy, not as a forecast.",
    },
  },

  {
    id: "q-winter",
    keywords: ["winter", "bubble", "hype", "bust", "crash", "too early", "disillusion"],
    prompt: "A quantum winter: the money decides it is too early",
    short: "Quantum winter",
    summary:
      "No breakthrough arrives, error correction stays expensive, and private capital rotates out — the pattern AI itself went through twice.",
    levers: ["public-investment", "talent", "hype-cycle"],
    from: 2027,
    fromRange: [2020, 2029],
    effects: [
      {
        figureId: "Q6",
        op: "converge",
        magnitude: 25,
        rampYears: 2,
        rationale:
          "Private investment does not decay, it leaves. What remains is the handful of companies with revenue.",
        confidence: "arguable",
      },
      {
        figureId: "Q1",
        op: "levelShift",
        magnitude: -0.18,
        rampYears: 3,
        lag: 1,
        rationale:
          "The literature keeps growing — it is mostly publicly funded — but the growth rate halves as the field loses its industrial tail.",
        confidence: "arguable",
      },
      {
        figureId: "Q2",
        op: "levelShift",
        magnitude: -0.22,
        rampYears: 3,
        lag: 1,
        rationale:
          "A university group is more insulated than a startup. Delft falls by less than the money does.",
        confidence: "arguable",
      },
      {
        figureId: "Q4",
        op: "levelShift",
        magnitude: 0.12,
        rampYears: 3,
        lag: 1,
        rationale:
          "The counterintuitive one: in a winter, the places with permanent public funding gain share. The Dutch line rises because everyone else's falls faster.",
        confidence: "speculative",
      },
      {
        figureId: "Q7",
        op: "levelShift",
        magnitude: -0.55,
        rampYears: 2,
        lag: 1,
        rationale: "Patents are a commercial act and this is a commercial retreat.",
        confidence: "arguable",
      },
    ],
    objection: {
      claim:
        "The AI winters happened because the technology did not work. Quantum hardware demonstrably works; it is only a question of scale, and scale is an engineering problem with money already committed to it.",
      response:
        "The same was said of expert systems in 1986. What makes this one worth keeping on the board is the share chart: it is the only intervention here where the Dutch line goes up, and it goes up because permanent public funding is a hedge against exactly this. If you think a winter is plausible, the case for the 2028 renewal gets stronger rather than weaker.",
    },
  },
];
