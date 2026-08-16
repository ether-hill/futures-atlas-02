/**
 * Where Compute Gets Built — the data layer for /feed/where-compute-gets-built.
 *
 * Same contract as every Atlas report: this file is the single source of truth,
 * the page is a view of it, and the evidence rules live in `report-types.ts`.
 * One addition this subject demands.
 *
 * ── The brief was full of numbers. Most of them are not here ────────────────
 *
 * This report was commissioned from a brief carrying a dozen confident
 * figures — a $611bn ecosystem valuation, 368 unicorns, "80% of all compute
 * funding in three cities", a "6–12 month waitlist", "24–36 months of grid
 * approval". Almost none of them could be traced to a source that states them,
 * and two are contradicted by the measurements that do exist: the OECD's
 * country split puts France and the EU nowhere near a third of global AI
 * venture capital, and Berkeley Lab's queue data puts the median wait at 55
 * months rather than 24–36.
 *
 * So the rejects section is unusually long, and it is the most useful part of
 * this file. The brief's instinct — that compute is the binding constraint and
 * that nobody is measuring it systematically — survives intact. Its numbers
 * mostly did not, and that gap IS the finding: the thing everyone is certain
 * about is the thing nobody has counted.
 *
 * Where a figure here is a forecast rather than a measurement, the scope line
 * says so. A prediction about 2027 is not evidence about 2027.
 */

import {
  countTier,
  findingsInStrand,
  type Dropped,
  type Finding,
  type PressItem,
  type Tier,
  type TimelineEvent,
  type Video,
} from "./report-types";

export * from "./report-types";

/** Which section of the report a finding belongs to. */
export type Strand = "constraint" | "concentration" | "quantum" | "cities" | "geopolitics";

export const STRAND_NAME: Record<Strand, string> = {
  constraint: "The constraint",
  concentration: "Concentration",
  quantum: "Quantum",
  cities: "The new cities",
  geopolitics: "Chokepoints",
};

export const PUBLISHED = "2026-08-16";

export const FINDINGS: Finding[] = [
  // ── the constraint ───────────────────────────────────────────────────────
  // The spine: the shortage moved. It was chips, and it is now the grid — and
  // the grid is the one input that cannot be air-freighted.
  {
    id: "gartner-power",
    strand: "constraint",
    claim:
      "Gartner forecasts that 40% of existing AI data centres will be operationally constrained by power availability by 2027.",
    detail:
      "The stated mechanism is that hyperscale build-out for generative AI creates demand faster than utilities can expand capacity, which Gartner expects to limit new data-centre growth for GenAI from 2026 onwards. It is the most-quoted number in this area and it is a forecast, not a count.",
    figure: "40% by 2027",
    scope:
      "A Gartner prediction published November 2024, about existing AI data centres. A forecast is not a measurement, and no audited count of power-constrained facilities has been published by anyone.",
    tier: "reported",
    source: {
      name: "Gartner press release",
      author: "Gartner",
      published: "2024-11-12",
      url: "https://www.gartner.com/en/newsroom/press-releases/2024-11-12-gartner-predicts-power-shortages-will-restrict-40-percent-of-ai-data-centers-by-20270",
    },
    chart: {
      kind: "waffle",
      max: 100,
      cells: 100,
      axis: "of existing AI data centres, forecast to be power-constrained by 2027",
      bars: [{ label: "Constrained", value: 40, unit: "%" }],
    },
  },
  {
    id: "queue-backlog",
    strand: "constraint",
    claim:
      "About 2,290 GW of generation and storage sat in US interconnection queues at the end of 2024 — nearly twice the entire existing US fleet.",
    detail:
      "Berkeley Lab's annual queue census counts what has asked to connect, not what will. Most of it will never be built: withdrawal rates are high and have been for years. What the number measures is the size of the line, and the line is now larger than the grid it wants to join.",
    figure: "~2,290 GW",
    scope:
      "Active capacity in US transmission interconnection queues as of end-2024, across generation and storage. Requests, not commitments — this is demand to connect, not capacity coming. Excludes large-load requests such as data centres connecting behind the meter.",
    tier: "documented",
    source: {
      name: "Lawrence Berkeley National Laboratory — Queued Up, 2025 edition",
      author: "Berkeley Lab, Energy Markets & Policy",
      published: "2025",
      url: "https://emp.lbl.gov/publications/queued-2025-edition-characteristics",
    },
    chart: {
      kind: "count",
      max: 2290,
      axis: "gigawatts active in US interconnection queues, end of 2024",
      bars: [{ label: "Gigawatts queued", value: 2290, unit: " GW", prefix: "about " }],
    },
  },
  {
    id: "queue-duration",
    strand: "constraint",
    claim:
      "The median time from interconnection request to commercial operation has roughly doubled, to over four years.",
    detail:
      "Berkeley Lab puts the median at under two years for projects built between 2000 and 2007, and over four years for those built between 2018 and 2024; the typical project reaching operation in 2024 had spent about 55 months in the queue. This is the number the industry's rules of thumb are usually a year or two short of.",
    figure: "<2 yrs → >4 yrs",
    scope:
      "US transmission interconnection, generation and storage projects that reached commercial operation. Measures completed projects, so it survivor-biases toward the ones that made it; the withdrawn majority waited too and are not in the median.",
    tier: "documented",
    source: {
      name: "Lawrence Berkeley National Laboratory — Queued Up, 2025 edition",
      author: "Berkeley Lab, Energy Markets & Policy",
      published: "2025",
      url: "https://emp.lbl.gov/publications/queued-2025-edition-characteristics",
    },
    chart: {
      kind: "slope",
      max: 55,
      axis: "median months in the interconnection queue, by build period",
      bars: [
        { label: "Built 2000–2007", value: 24, unit: " mo", prefix: "under " },
        { label: "Reaching operation 2024", value: 55, unit: " mo", prefix: "about " },
      ],
    },
  },
  {
    id: "twh-2027",
    strand: "constraint",
    claim:
      "The power needed for incremental AI-optimised servers is forecast to reach 500 TWh a year by 2027 — 2.6 times the 2023 level.",
    detail:
      "The same Gartner analysis that produced the 40% figure. For scale, this is the additional demand from AI-optimised servers alone, not total data-centre consumption, which was around 415 TWh globally in 2024 on the IEA's numbers.",
    figure: "500 TWh · 2.6×",
    scope:
      "A forecast for incremental AI-optimised servers, published November 2024. Not total data-centre demand, not measured consumption, and not specific to any country.",
    tier: "reported",
    source: {
      name: "Gartner press release",
      author: "Gartner",
      published: "2024-11-12",
      url: "https://www.gartner.com/en/newsroom/press-releases/2024-11-12-gartner-predicts-power-shortages-will-restrict-40-percent-of-ai-data-centers-by-20270",
    },
    chart: {
      kind: "multiple",
      max: 3,
      axis: "power for incremental AI-optimised servers, against 2023",
      bars: [
        { label: "2023", value: 1, unit: "×", baseline: true },
        { label: "2027, forecast", value: 2.6, unit: "×" },
      ],
    },
  },

  // ── concentration ────────────────────────────────────────────────────────
  {
    id: "ai-share-vc",
    strand: "concentration",
    claim:
      "AI companies took 61% of all global venture capital in 2025 — $258.7bn of $427.1bn.",
    detail:
      "The OECD's figure, from its review of venture investment in AI through 2025. It measures where venture money went, which is the closest widely-available proxy for where compute-intensive companies are being built — and it is a proxy, not a measure of compute.",
    figure: "61% of global VC",
    scope:
      "Global venture capital deal value in 2025, by recipient sector. Venture funding is not compute: it says who raised money, not who has GPUs, power or floor space.",
    tier: "documented",
    source: {
      name: "OECD",
      author: "OECD",
      published: "2026-02",
      url: "https://www.oecd.org/en/about/news/announcements/2026/02/ai-firms-capture-61-percent-of-global-venture-capital-in-2025.html",
    },
    chart: {
      kind: "ring",
      max: 100,
      axis: "share of global venture capital going to AI companies, 2025",
      bars: [{ label: "AI companies", value: 61, unit: "%" }],
    },
  },
  {
    id: "us-share",
    strand: "concentration",
    claim:
      "US firms took about 75% of global AI venture deal value. The EU27 took 6%, China 5% and the UK 5%.",
    detail:
      "$194bn to the United States against $15.8bn to the EU27, $13.9bn to China and $13.8bn to the UK. The gap between first and second place is more than twelve to one, and the three next-largest recipients together do not reach a quarter of the US total.",
    figure: "US 75% · EU 6%",
    scope:
      "Global AI venture capital deal value, 2025, by recipient country. Venture capital only — it excludes state R&D funding, corporate capital expenditure and sovereign programmes, which is where a great deal of Chinese and European compute money actually sits.",
    tier: "documented",
    source: {
      name: "OECD",
      author: "OECD",
      published: "2026-02",
      url: "https://www.oecd.org/en/publications/venture-capital-investments-in-artificial-intelligence-through-2025_a13752f5-en/full-report.html",
    },
    chart: {
      kind: "bars",
      max: 100,
      axis: "share of global AI venture deal value, 2025",
      bars: [
        { label: "United States", value: 75, unit: "%", prefix: "about " },
        { label: "EU27", value: 6, unit: "%" },
        { label: "China", value: 5, unit: "%" },
        { label: "United Kingdom", value: 5, unit: "%" },
      ],
    },
  },
  {
    id: "bay-area",
    strand: "concentration",
    claim:
      "The San Francisco Bay Area took around 60% of global AI funding on 22% of the deals.",
    detail:
      "Roughly $126bn, on about a fifth of the transactions — which is a statement about cheque size as much as about place. The same analysis puts the Bay Area at about 76% of the US total, meaning the concentration inside America is sharper than America's concentration in the world.",
    figure: "60% on 22% of deals",
    scope:
      "One analyst's read of 2025 AI venture data, not an official statistic, and not audited here. Deal-value share by metro. Says nothing about installed compute, which nobody publishes by city.",
    tier: "reported",
    source: {
      name: "The AI Economy",
      author: "The AI Economy",
      published: "2026",
      url: "https://theaieconomy.substack.com/p/ai-vc-2025-bay-area-concentration",
    },
    chart: {
      kind: "bars",
      max: 100,
      axis: "Bay Area share of global AI venture activity, 2025",
      bars: [
        { label: "Share of funding", value: 60, unit: "%", prefix: "about " },
        { label: "Share of deals", value: 22, unit: "%", prefix: "about " },
      ],
    },
  },
  {
    id: "no-compute-census",
    strand: "concentration",
    claim:
      "There is no public census of installed compute by city. Every concentration figure in circulation is a funding figure standing in for one.",
    detail:
      "Venture databases measure money. Nobody publishes GPUs per metro, available megawatts for new load, or waiting times for capacity, and the operators who know are not obliged to say. Every claim in this report about where compute IS rests on where compute money went, which is a different question with a plausible-looking answer.",
    figure: null,
    scope:
      "As of publication, across the sources reached for this report. An absence rather than a measurement: it is possible such a dataset exists commercially and behind a paywall, in which case it is not public.",
    tier: "emergent",
    source: {
      name: "OECD",
      author: "OECD",
      published: "2026-02",
      url: "https://www.oecd.org/en/about/news/announcements/2026/02/ai-firms-capture-61-percent-of-global-venture-capital-in-2025.html",
    },
  },

  // ── quantum ──────────────────────────────────────────────────────────────
  {
    id: "nqi",
    strand: "quantum",
    claim:
      "The US National Quantum Initiative was authorised at about $1.2bn for its first five years and reauthorised at $1.8bn for 2025–2029.",
    detail:
      "Quantum's money comes from a different place than AI's. Where AI capital is venture-led and concentrates in one metro, quantum programmes are national, multi-year and deliberately distributed across university and national-laboratory sites.",
    figure: "$1.2bn → $1.8bn",
    scope:
      "US federal authorisation for the National Quantum Initiative. Authorised is not appropriated and not spent; figures reported via secondary compilations rather than read off the appropriations themselves.",
    tier: "reported",
    source: {
      name: "Qureca — Quantum Initiatives Worldwide",
      author: "Qureca",
      published: "2026",
      url: "https://www.qureca.com/quantum-initiatives-worldwide/",
    },
    chart: {
      kind: "slope",
      max: 1.8,
      axis: "US National Quantum Initiative authorisation, $ billions",
      bars: [
        { label: "2019–2024", value: 1.2, unit: "bn", prefix: "$" },
        { label: "2025–2029", value: 1.8, unit: "bn", prefix: "$" },
      ],
    },
  },
  {
    id: "eu-quantum",
    strand: "quantum",
    claim:
      "The European Commission has put more than €1.9bn into second-quantum-revolution projects over five years, and France committed €1.8bn on its own.",
    detail:
      "France's 2021 plan raised national public investment in quantum technologies from about €60m a year to about €200m. These are the kinds of sums that keep a research base in more than one place — and they are an order of magnitude below what a single AI hyperscaler spends on capital expenditure in a year.",
    figure: "€1.9bn · €1.8bn",
    scope:
      "European Commission programme funding and one French national plan, reported via a compilation rather than read off the budget lines. Committed, not necessarily disbursed.",
    tier: "reported",
    source: {
      name: "Qureca — Quantum Initiatives Worldwide",
      author: "Qureca",
      published: "2026",
      url: "https://www.qureca.com/quantum-initiatives-worldwide/",
    },
  },
  {
    id: "quantum-model",
    strand: "quantum",
    claim:
      "Quantum is still distributed because it is still mostly public money — which makes it a control case rather than a counter-example.",
    detail:
      "The comparison the brief draws is a good one and it is an argument, not a finding: quantum research sits in many cities because national programmes put it there, and AI compute sits in few because venture capital put it there. If quantum commercialises on AI's terms, the prediction is that it concentrates the same way. Nothing here tests that prediction.",
    figure: null,
    scope:
      "A characterisation of the two funding models, drawn from the funding figures above. An argument about mechanism, tiered as such — no one has measured quantum research sites per city either.",
    tier: "emergent",
    source: {
      name: "Qureca — Quantum Initiatives Worldwide",
      author: "Qureca",
      published: "2026",
      url: "https://www.qureca.com/quantum-initiatives-worldwide/",
    },
  },

  // ── the new cities ───────────────────────────────────────────────────────
  {
    id: "telosa-no-site",
    strand: "cities",
    claim: "Telosa has no site. Five states are still under consideration.",
    detail:
      "Marc Lore's city is designed for five million residents by 2050, with a first phase of 50,000 projected for 2030. Nevada, Utah, Idaho, Arizona and Texas remain candidates, and the project has declined to give a timeline for choosing. Nine years from a stated 2030 opening, the land question is open.",
    figure: "no site chosen",
    scope:
      "As reported in 2025–26 trade coverage. Population figures are the project's own targets, not approvals, permits or construction.",
    tier: "reported",
    source: {
      name: "Smart Cities Dive",
      author: "Smart Cities Dive",
      published: "2025",
      url: "https://www.smartcitiesdive.com/news/billionaire-smart-cities-update-elon-musk-telosa-utopia/699348/",
    },
  },
  {
    id: "itana",
    strand: "cities",
    claim:
      "Itana, Nigeria's digital free zone, reported 50 companies registered at the end of 2025 and targets its first physical residents in 2027.",
    detail:
      "It sits as a district inside Alaro City, in the Lagos region, and raised $2m in July 2025. Its own framing for the physical district is a test of whether it can supply 24/7 power and reliable fibre — which is the same constraint this whole report is about, arriving at the scale of one office park.",
    figure: "50 companies",
    scope:
      "The operator's own 2025 recap, reported via BitKE. A count of registered companies in a digital zone, which is not a count of people, buildings or compute.",
    tier: "reported",
    source: {
      name: "BitKE",
      author: "BitKE",
      published: "2025-12",
      url: "https://bitcoinke.io/2025/12/the-itana-digital-economic-zone-in-2025/",
    },
    chart: {
      kind: "count",
      max: 50,
      axis: "companies registered in the zone, operator's 2025 recap",
      bars: [{ label: "Companies", value: 50, unit: "" }],
    },
  },
  {
    id: "praxis-funding",
    strand: "cities",
    claim: "Praxis announced $525m in October 2024 and has not built anything.",
    detail:
      "The best-funded of the network-state projects. In April 2025 its chief executive named Vandenberg Space Force Base as the intended site of a first city — a federal military installation, for a project premised on exit from the state.",
    figure: "$525m",
    scope:
      "An announced financing package, not a receipt and not a construction budget. Covered in more detail in this Atlas's Start-up Cities report.",
    tier: "reported",
    source: {
      name: "The Block",
      author: "The Block",
      published: "2024-10",
      url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    },
    chart: {
      kind: "count",
      max: 525,
      axis: "announced financing, October 2024",
      bars: [{ label: "Raised", value: 525, unit: "m", prefix: "$" }],
    },
  },
  {
    id: "no-city-compute",
    strand: "cities",
    claim:
      "Not one of the intentional cities has published a compute figure — no megawatts secured, no interconnection agreement, no installed capacity.",
    detail:
      "Próspera, Praxis, Telosa and Itana are all pitched at least partly on being where advanced work can happen. Between them the public record contains land, funding, company registrations and governance arrangements. It contains no power capacity and no compute. On this report's own thesis, that is the number that would matter.",
    figure: "0 published",
    scope:
      "Across the four projects and the sources reached here, as of publication. An absence, which is weaker than a measurement: a figure may exist unpublished. It is included because the claim being made for these places is a compute claim.",
    tier: "emergent",
    source: {
      name: "Smart Cities Dive",
      author: "Smart Cities Dive",
      published: "2025",
      url: "https://www.smartcitiesdive.com/news/billionaire-smart-cities-update-elon-musk-telosa-utopia/699348/",
    },
    chart: {
      kind: "count",
      max: 4,
      axis: "of four intentional cities publishing a power or compute figure",
      bars: [{ label: "Projects with a published figure", value: 0, unit: "" }],
    },
  },

  // ── chokepoints ──────────────────────────────────────────────────────────
  {
    id: "diffusion-rule",
    strand: "geopolitics",
    claim:
      "The AI Diffusion Rule, which would have tiered the world's access to US chips, was scrapped in May 2025.",
    detail:
      "It was the most systematic attempt to make compute access a matter of allied status. Its withdrawal, and the subsequent relaxations on specific parts, mean the geography of who can buy advanced chips is now being set case by case rather than by a published framework.",
    figure: null,
    scope:
      "US export-control policy. Describes the rule's withdrawal and the direction of subsequent decisions, not their effect on any country's installed compute.",
    tier: "documented",
    source: {
      name: "Chatham House",
      author: "Chatham House",
      published: "2026-04",
      url: "https://www.chathamhouse.org/2026/04/ai-export-controls-are-not-best-bargaining-chip",
    },
  },
  {
    id: "chip-security-act",
    strand: "geopolitics",
    claim:
      "Congress approved the Chip Security Act in March 2026, requiring location verification to be built into advanced AI chips.",
    detail:
      "It moves enforcement from the border to the silicon: rather than checking what leaves the country, it asks the chip to say where it is. If implemented as passed, it makes the physical location of compute a property of the hardware, which is a considerable change to what a data centre is.",
    figure: "26 Mar 2026",
    scope:
      "US legislation as approved by Congress. Passage is not implementation: no verification requirement has yet been shown to be technically specified or in force.",
    tier: "documented",
    source: {
      name: "Congressional Research Service — R48642",
      author: "Congressional Research Service",
      published: "2026",
      url: "https://www.congress.gov/crs-product/R48642",
    },
  },
  {
    id: "gatekeeper",
    strand: "geopolitics",
    claim:
      "A single US enforcement operation disrupted at least $160m of AI chips heading for mainland China and Hong Kong.",
    detail:
      "Operation Gatekeeper, announced in December 2025, involved a multi-defendant network. What one operation intercepts is a floor on the size of the diversion trade, not a measure of it — and it is evidence that controls bind hard enough to be worth evading at that scale.",
    figure: "$160m+",
    scope:
      "One announced enforcement action. A floor, not a total: the value of what was not intercepted is unknown by construction.",
    tier: "reported",
    source: {
      name: "Bloomsbury Intelligence and Security Institute",
      author: "BISI",
      published: "2026",
      url: "https://bisi.org.uk/reports/ai-chip-smuggling-the-limits-of-us-export-controls",
    },
    chart: {
      kind: "count",
      max: 160,
      axis: "value of AI chips disrupted in one operation, $ millions",
      bars: [{ label: "At least", value: 160, unit: "m", prefix: "$" }],
    },
  },
];

export const TIMELINE: TimelineEvent[] = [
  {
    id: "gartner-forecast",
    date: "2024-11-12",
    dateNote: "publication",
    strand: "finding",
    title: "Gartner forecasts power constraints on 40% of AI data centres",
    detail:
      "The number that reframed the bottleneck from chips to electricity, and the one most often quoted since as though it were a count.",
    tier: "reported",
    source: {
      name: "Gartner press release",
      author: "Gartner",
      published: "2024-11-12",
      url: "https://www.gartner.com/en/newsroom/press-releases/2024-11-12-gartner-predicts-power-shortages-will-restrict-40-percent-of-ai-data-centers-by-20270",
    },
  },
  {
    id: "praxis-raise-cc",
    date: "2024-10",
    dateNote: "announcement",
    strand: "release",
    title: "Praxis announces $525m",
    detail: "The largest financing in the network-state movement, for a city with no site.",
    tier: "reported",
    source: {
      name: "The Block",
      author: "The Block",
      published: "2024-10",
      url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    },
  },
  {
    id: "diffusion-scrapped",
    date: "2025-05",
    dateNote: "announcement",
    strand: "response",
    title: "The AI Diffusion Rule is scrapped",
    detail:
      "The framework that would have tiered global access to US chips by allied status is withdrawn, leaving case-by-case licensing in its place.",
    tier: "documented",
    source: {
      name: "Chatham House",
      author: "Chatham House",
      published: "2026-04",
      url: "https://www.chathamhouse.org/2026/04/ai-export-controls-are-not-best-bargaining-chip",
    },
  },
  {
    id: "itana-raise",
    date: "2025-07",
    dateNote: "announcement",
    strand: "release",
    title: "Itana raises $2m",
    detail:
      "Nigeria's digital free zone, a district inside Alaro City in the Lagos region, funds its build-out.",
    tier: "reported",
    source: {
      name: "FurtherAfrica",
      author: "FurtherAfrica",
      published: "2025-07-22",
      url: "https://furtherafrica.com/2025/07/22/itana-raises-2m-to-build-lagos-based-digital-free-trade-zone/",
    },
  },
  {
    id: "lbnl-2025",
    date: "2025",
    dateNote: "publication",
    strand: "finding",
    title: "Berkeley Lab counts 2,290 GW in the queue",
    detail:
      "The annual census of what wants to connect to the US grid finds a line nearly twice the size of the existing fleet, and a median wait past four years.",
    tier: "documented",
    source: {
      name: "Lawrence Berkeley National Laboratory — Queued Up, 2025 edition",
      author: "Berkeley Lab, Energy Markets & Policy",
      published: "2025",
      url: "https://emp.lbl.gov/publications/queued-2025-edition-characteristics",
    },
  },
  {
    id: "gatekeeper-op",
    date: "2025-12",
    dateNote: "announcement",
    strand: "response",
    title: "Operation Gatekeeper",
    detail:
      "US authorities announce the disruption of a network moving at least $160m of AI chips to mainland China and Hong Kong.",
    tier: "reported",
    source: {
      name: "Bloomsbury Intelligence and Security Institute",
      author: "BISI",
      published: "2026",
      url: "https://bisi.org.uk/reports/ai-chip-smuggling-the-limits-of-us-export-controls",
    },
  },
  {
    id: "itana-recap",
    date: "2025-12",
    dateNote: "publication",
    strand: "finding",
    title: "Itana reports 50 companies",
    detail:
      "The zone's own year-end recap, with first physical residents targeted for 2027 and power and fibre named as the test.",
    tier: "reported",
    source: {
      name: "BitKE",
      author: "BitKE",
      published: "2025-12",
      url: "https://bitcoinke.io/2025/12/the-itana-digital-economic-zone-in-2025/",
    },
  },
  {
    id: "oecd-vc",
    date: "2026-02",
    dateNote: "publication",
    strand: "finding",
    title: "OECD: AI takes 61% of global venture capital",
    detail:
      "$258.7bn of $427.1bn in 2025, with about 75% of AI deal value going to US firms and 6% to the EU27.",
    tier: "documented",
    source: {
      name: "OECD",
      author: "OECD",
      published: "2026-02",
      url: "https://www.oecd.org/en/about/news/announcements/2026/02/ai-firms-capture-61-percent-of-global-venture-capital-in-2025.html",
    },
  },
  {
    id: "chip-act",
    date: "2026-03-26",
    dateNote: "publication",
    strand: "response",
    title: "Congress approves the Chip Security Act",
    detail:
      "Location verification is to be embedded in advanced AI chips, moving enforcement from the border into the hardware.",
    tier: "documented",
    source: {
      name: "Congressional Research Service — R48642",
      author: "Congressional Research Service",
      published: "2026",
      url: "https://www.congress.gov/crs-product/R48642",
    },
  },
];

export const VIDEOS: Video[] = [
  {
    id: "j2w4X1OkdIo",
    channel: "Curiosity Stream",
    title: "The Data Center Energy Crisis: Can We Power the Age of AI? | Breakthrough",
    published: "2025-10-17",
    blurb: "The long-form version of the constraint, from the generation side.",
    thumb: "https://i.ytimg.com/vi/j2w4X1OkdIo/maxresdefault.jpg",
  },
  {
    id: "qcEVloh-dG0",
    channel: "Forbes",
    title:
      "Why America's Power Grid Will Be Able To Withstand The $2.5 Trillion A.I. Datacenter Building Boom",
    published: "2025-12-22",
    blurb:
      "The optimistic case, included because a rail carrying only the alarm would be making the argument for the reader.",
    thumb: "https://i.ytimg.com/vi/qcEVloh-dG0/maxresdefault.jpg",
  },
  {
    id: "RzjD9DicWTk",
    channel: "Oxford Energy Network",
    title: "AI Data Center Growth: Challenges and Opportunities for Electric Power Systems",
    published: "2026-05-20",
    blurb: "The academic treatment — the most careful of these on what the grid can actually absorb.",
    thumb: "https://i.ytimg.com/vi/RzjD9DicWTk/maxresdefault.jpg",
  },
  {
    id: "UBgLVDxakVI",
    channel: "NowMedia Television Networks",
    title: "AI Data Centers, Grid Capacity and Clean Power: Solving the Energy Challenge of the AI Boom",
    published: "2026-06-05",
    blurb: "A panel on interconnection and siting, useful on why queues behave the way they do.",
    thumb: "https://i.ytimg.com/vi/UBgLVDxakVI/maxresdefault.jpg",
  },
  {
    id: "HfzfFXb7RoA",
    channel: "Lisa Cabrera",
    title: "Data Centers Are Consuming Electricity at Double the Rate — Your State Could Be Next",
    published: "2026-06-22",
    blurb: "The local politics of it, which is where siting decisions are actually settled.",
    thumb: "https://i.ytimg.com/vi/HfzfFXb7RoA/maxresdefault.jpg",
  },
];

export const PRESS: PressItem[] = [
  {
    id: "gartner",
    publisher: "Gartner",
    title: "Gartner Predicts Power Shortages Will Restrict 40% of AI Data Centers By 2027",
    published: "2024-11-12",
    blurb: "The primary source for the number this whole area quotes. Read it for the word 'predicts'.",
    url: "https://www.gartner.com/en/newsroom/press-releases/2024-11-12-gartner-predicts-power-shortages-will-restrict-40-percent-of-ai-data-centers-by-20270",
    image: null,
  },
  {
    id: "lbnl",
    publisher: "Berkeley Lab",
    title: "Queued Up: Characteristics of Power Plants Seeking Transmission Interconnection",
    published: "2025",
    blurb:
      "The annual census of the interconnection queue. The only place in this report where the constraint is counted rather than forecast.",
    url: "https://emp.lbl.gov/queues",
    image: null,
  },
  {
    id: "oecd",
    publisher: "OECD",
    title: "Venture capital investments in artificial intelligence through 2025",
    published: "2026-02",
    blurb: "Where the money went, by sector and by country, from the body that compiles it.",
    url: "https://www.oecd.org/en/publications/venture-capital-investments-in-artificial-intelligence-through-2025_a13752f5-en/full-report.html",
    image: null,
  },
  {
    id: "crs",
    publisher: "Congressional Research Service",
    title: "U.S. Export Controls and China: Advanced Semiconductors",
    published: "2026",
    blurb: "The chronology of the controls, without the advocacy attached at either end of it.",
    url: "https://www.congress.gov/crs-product/R48642",
    image: null,
  },
  {
    id: "chatham",
    publisher: "Chatham House",
    title: "AI export controls are not the best bargaining chip",
    published: "2026-04",
    blurb: "The argument against using compute access as leverage. Opinion, and included as such.",
    url: "https://www.chathamhouse.org/2026/04/ai-export-controls-are-not-best-bargaining-chip",
    image: null,
  },
  {
    id: "scd-telosa",
    publisher: "Smart Cities Dive",
    title: "Billionaire-planned smart cities in the US: What's the latest?",
    published: "2025",
    blurb: "The running status check on Telosa and its neighbours, including what has not happened.",
    url: "https://www.smartcitiesdive.com/news/billionaire-smart-cities-update-elon-musk-telosa-utopia/699348/",
    image:
      "https://imgproxy.divecdn.com/ceCdJajZfljvD1aiWQHo65IVbnjRHDgIVNQJV9vErSI/g:ce/rs:fit:770:435/Z3M6Ly9kaXZlc2l0ZS1zdG9yYWdlL2RpdmVpbWFnZS9TY3JlZW5zaG90XzIwMjEtMDktMjBfMTEuNTcuMTZfQU0ucG5n.webp",
  },
];

export const DROPPED: Dropped[] = [
  {
    claim: "“Silicon Valley: $611 billion in AI-native value” and “368 active unicorns”",
    reason:
      "In the brief for this report, and untraceable. No source reached states either figure, and 'AI-native value' is not a defined metric with a published methodology. Excluded rather than attributed to a plausible-sounding database.",
  },
  {
    claim: "“New York City: $96 billion in AI-native value”",
    reason: "The same metric, the same problem. Not stated by any source reached.",
  },
  {
    claim: "“80% of all compute funding in 3 cities — Silicon Valley, Beijing, Paris”",
    reason:
      "Contradicted by the measurement that does exist. The OECD puts the EU27 at 6% of global AI venture deal value and China at 5%, which cannot support Paris or Beijing as a top-three recipient on funding. The underlying instinct — that this is extremely concentrated — is right, and the US share of 75% is the number that shows it.",
  },
  {
    claim: "“24–36 months of grid approval” for new data centre capacity",
    reason:
      "Understates the measured figure. Berkeley Lab puts the median from interconnection request to commercial operation at about 55 months for projects reaching operation in 2024. The report uses the measured number.",
  },
  {
    claim: "“6–12 month waitlist” for compute outside the top five cities",
    reason:
      "Widely repeated and not published anywhere reached. Cloud capacity waits are commercial terms, disclosed under contract and not in aggregate. If a dataset exists it is not public.",
  },
  {
    claim: "That compute itself is concentrated in three to five cities",
    reason:
      "Probably true and not evidenced. Every figure available measures venture funding by metro, which is a proxy. Nobody publishes GPUs, megawatts or floor space by city, and the report says so rather than letting the proxy stand in.",
  },
  {
    claim: "Itana's “over 100 companies”",
    reason:
      "Conflicts with the operator's own 2025 year-end recap of 50. The lower, dated, attributable figure is used.",
  },
  {
    claim: "A ranked list of quantum hubs — Boston, Delft, Oxford, Munich, Sydney and the rest",
    reason:
      "Plausible and unranked by anyone. No source reached counts quantum research sites or capability by city, so the report describes the funding model instead of naming a league table it cannot support.",
  },
  {
    claim: "China's “1 trillion yuan” state fund as a quantum figure",
    reason:
      "The fund is real and announced in March 2025, but it covers AI, quantum and hydrogen together, and the quantum allocation has not been published. Quoting the headline as quantum funding would be an order-of-magnitude error.",
  },
  {
    claim: "That 40% of AI data centres ARE power-constrained",
    reason:
      "A forecast about 2027, published in 2024, routinely quoted in the present tense. It is in the report as a forecast, labelled as one.",
  },
];

/**
 * Every preview image on the page, in one list, for the masthead mosaic.
 * Press items whose og:image could not be reached contribute nothing rather
 * than a placeholder — most of the primary sources here publish none.
 */
export const MOSAIC: string[] = [
  ...VIDEOS.map((v) => v.thumb),
  ...PRESS.map((p) => p.image).filter((src): src is string => src !== null),
];

export const findingsIn = (s: Strand) => findingsInStrand(FINDINGS, s);
export const countByTier = (t: Tier) => countTier(FINDINGS, t);
