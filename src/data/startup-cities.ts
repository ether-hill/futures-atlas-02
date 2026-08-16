/**
 * Sovereign by Contract — the data layer for the report at
 * /feed/startup-cities.
 *
 * Same contract as `hegemony.ts` and `killchain.ts`: this file is the single
 * source of truth, the page is a view of it, and the evidence rules live in
 * `report-types.ts`. Two additions this subject demands.
 *
 * ── One: most of the numbers belong to the people being measured ────────────
 *
 * There is no census of Próspera and no independent audit of Praxis. Resident
 * counts, business counts and investment totals come from the operators' own
 * announcements. That does not make them false, and it does not make them
 * evidence in the sense the rest of this report uses the word — so every one
 * of them is tiered `reported` and its scope line says whose number it is.
 * Where a figure exists only as a company's marketing, it is not here at all.
 *
 * ── Two: the arbitration is the story, and it is a live case ────────────────
 *
 * The damages figures are CLAIMED, in a pending ICSID case with no award. A
 * claim is a number one party has asked for. Reporting it as what Honduras
 * owes would be inventing an outcome, so every mention says "claimed" and the
 * scope line says the case is undecided.
 *
 * This is a report about a political project, and its subjects are living
 * people acting in public. Everything here is what they have said, funded,
 * filed or built, taken from their own words and from the public record.
 */

import {
  countTier,
  findingsInStrand,
  type Dropped,
  type Finding,
  type PressItem,
  type Video,
  type Tier,
  type TimelineEvent,
} from "./report-types";

export * from "./report-types";

/** Which section of the report a finding belongs to. */
export type Strand = "idea" | "projects" | "money" | "bill" | "argentina";

export const STRAND_NAME: Record<Strand, string> = {
  idea: "The idea",
  projects: "The projects",
  money: "The money",
  bill: "The bill",
  argentina: "Argentina",
};

export const PUBLISHED = "2026-08-15";

export const FINDINGS: Finding[] = [
  // ── the idea ─────────────────────────────────────────────────────────────
  // The spine: this is not a property play with a philosophy attached. The
  // philosophy came first, it is written down, and it names its own goal —
  // diplomatic recognition. Everything else follows from taking that
  // seriously rather than treating it as branding.
  {
    id: "network-state-definition",
    strand: "idea",
    claim:
      "The founding text defines the goal as diplomatic recognition, not as a better neighbourhood.",
    detail:
      "Balaji Srinivasan's The Network State, self-published in 2022, defines a network state as a highly aligned online community with a capacity for collective action that crowdfunds territory around the world and eventually gains diplomatic recognition from pre-existing states. Recognition is in the definition. Every project in this report is measured against a target its own literature sets.",
    figure: null,
    scope:
      "The book's own definition, as published by the author. A statement of intent by one writer — influential among these founders, but not a description of what any project has achieved.",
    tier: "documented",
    source: {
      name: "The Network State",
      author: "Balaji Srinivasan",
      published: "2022",
      url: "https://thenetworkstate.com/",
    },
  },
  {
    id: "exit-over-voice",
    strand: "idea",
    claim:
      "The political theory is exit rather than voice: you do not reform a jurisdiction, you leave it and start another.",
    detail:
      "The lineage runs through seasteading and charter cities, and the mechanism is competitive — jurisdictions are products, residents are customers, and a bad government is a bad supplier. It is a coherent position. It is also the reason these projects concentrate in states with weak fiscal positions rather than strong ones, which is the part the theory does not dwell on.",
    figure: null,
    scope:
      "A characterisation of the stated position, drawn from the movement's own founding text and from the projects' public materials. It is an argument about ideas, not a measured finding, and is tiered accordingly.",
    tier: "emergent",
    source: {
      name: "The Network State",
      author: "Balaji Srinivasan",
      published: "2022",
      url: "https://thenetworkstate.com/",
    },
  },

  // ── the projects ─────────────────────────────────────────────────────────
  {
    id: "prospera-scale",
    strand: "projects",
    claim:
      "Próspera reports about 1,700 residents from 40 countries, and roughly 250 companies incorporated.",
    detail:
      "The zone on Roatán is the furthest advanced of these projects: it has a legal framework, a regulator, a residency programme and physical construction. Its residency is also sold as a product — e-residency at $130 a year, physical residency at $1,300 for foreigners and $260 for Hondurans.",
    figure: "~1,700 residents",
    scope:
      "Próspera's own published figures, as of 2024–25. Self-reported by the operator, with no census, independent audit or government count to check them against. E-residents and physical residents are not separated in the published totals.",
    tier: "reported",
    source: {
      name: "Próspera",
      author: "Honduras Próspera Inc.",
      published: "2025",
      url: "https://www.prospera.co/en/about",
    },
    chart: {
      kind: "count",
      max: 1700,
      axis: "residents reported by the operator, from 40 countries",
      bars: [{ label: "Residents", value: 1700, unit: "", prefix: "about " }],
    },
  },
  {
    id: "praxis-raise",
    strand: "projects",
    claim: "Praxis announced $525 million to build a city it had not yet sited.",
    detail:
      "The October 2024 raise made Praxis the best-funded of the network-state projects. It described itself as the world's first network state. In an April 2025 interview its chief executive said the first city, Atlas, would be built at Vandenberg Space Force Base in Santa Barbara County — a US military installation, which is a striking site for a project premised on exit from the state.",
    figure: "$525m",
    scope:
      "An announced financing package, October 2024, as reported by The Block and Gizmodo. Announced is not the same as received or deployed, and no construction figures have been published.",
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
    id: "california-forever-land",
    strand: "projects",
    claim:
      "A company spent about $900 million quietly buying 50,000 acres of Californian farmland before saying who it was.",
    detail:
      "From 2017, California Forever assembled land in Solano County through a shell company, prompting local speculation and a federal inquiry before the backers were identified. The plan is a new city for up to 400,000 people. It is the same idea as the offshore projects with the sovereignty removed — the constraint here is a county planning process, not a treaty.",
    figure: "50,000 acres",
    scope:
      "Land assembled in Solano County, California, from 2017 to 2023, as reported. The acreage and price are reported figures; the 400,000 population is the company's own proposal, not an approval.",
    tier: "reported",
    source: {
      name: "NBC Bay Area",
      author: "NBC Bay Area",
      published: "2024-07-22",
      url: "https://www.nbcbayarea.com/news/local/north-bay/california-forever-solano-county-ballot-measure-pulled/3599985/",
    },
    chart: {
      kind: "count",
      max: 50000,
      axis: "acres assembled in Solano County before the buyer was named",
      bars: [{ label: "Acres", value: 50000, unit: "", prefix: "about " }],
    },
  },
  {
    id: "california-forever-withdrawal",
    strand: "projects",
    claim:
      "California Forever pulled its ballot measure one day before the county was due to vote on it.",
    detail:
      "The measure was withdrawn in July 2024 after a county report concluded the plan would require billions in infrastructure spending. The company said it would complete an environmental impact report and a development agreement and return in 2026. The project did not fail; it discovered how long a planning process takes.",
    figure: null,
    scope:
      "Solano County, July 2024. A withdrawal, not a rejection — the measure was never voted on, and the company has stated its intention to return.",
    tier: "documented",
    source: {
      name: "Local News Matters",
      author: "Bay City News",
      published: "2024-07-23",
      url: "https://localnewsmatters.org/2024/07/23/california-forever-abandons-ballot-measure-in-face-of-growing-opposition-looks-to-2026/",
    },
    chart: {
      kind: "count",
      max: 1,
      axis: "how long before the county vote the measure was pulled",
      bars: [
        { label: "Day", value: 1, unit: "" },
      ],
    },
  },

  // ── the money ────────────────────────────────────────────────────────────
  {
    id: "same-cap-table",
    strand: "money",
    claim: "The same handful of investors appears behind project after project.",
    detail:
      "Praxis's backers as reported include Peter Thiel and Marc Andreessen through Pronomos Capital, Sam Altman through Apollo Projects, Joe Lonsdale, and the Winklevoss twins. Pronomos, which exists specifically to fund charter cities, is also an investor in Próspera. This is not a movement of many funders; it is a small network placing repeated bets on the same thesis.",
    figure: null,
    scope:
      "Reported investor lists for Praxis, October 2024, plus Pronomos Capital's own stated purpose. Investor lists in private rounds are incomplete by nature, and amounts per investor are not public.",
    tier: "reported",
    source: {
      name: "Gizmodo",
      author: "Gizmodo",
      published: "2024-10",
      url: "https://gizmodo.com/praxis-another-tech-billionaire-backed-urban-project-gets-525-million-in-funding-2000512690",
    },
  },
  {
    id: "us-government-report",
    strand: "money",
    claim:
      "The US State Department reports to Congress on American investment in a private city inside another country.",
    detail:
      "Próspera is the subject of a recurring unclassified report to Congress on United States investment in the ZEDE, published in 2025 and again in 2026. A private jurisdiction has become an item of US foreign policy — which is a form of recognition the projects' own literature sets as the goal, arriving through a channel it did not predict.",
    figure: null,
    scope:
      "US Department of State reports to Congress, 2025 and 2026. The existence and subject of the reports; this report does not summarise their contents or characterise their conclusions.",
    tier: "documented",
    source: {
      name: "US Department of State — Report to Congress",
      author: "US Department of State",
      published: "2026-06",
      url: "https://www.state.gov/wp-content/uploads/2026/06/United-States-Investment-in-Prospera-ZEDE-Accessible-HRC1399978.pdf",
    },
    chart: {
      kind: "count",
      max: 2,
      axis: "reports to Congress on US investment in the zone, 2025 and 2026",
      bars: [
        { label: "Reports published", value: 2, unit: "" },
      ],
    },
  },

  // ── the bill ─────────────────────────────────────────────────────────────
  // The load-bearing section. Sovereignty here is not seized, it is
  // contracted — and a contract has a remedy when the other party walks away.
  {
    id: "zede-repeal",
    strand: "bill",
    claim: "Honduras repealed the law that created these zones by a unanimous vote.",
    detail:
      "In April 2022, three months after Xiomara Castro took office, the Honduran Congress voted unanimously to repeal the ZEDE statute. The government framed it as retaking sovereignty. The zones had been created in 2013 by a Congress the current one repudiated, and the vote against them was the least contested thing in Honduran politics.",
    figure: "unanimous",
    scope:
      "The Honduran Congress's repeal vote, April 2022. Repeal of the statute — the constitutional entrenchment of the ZEDEs required ratification in a subsequent session, which is where the legal argument begins.",
    tier: "documented",
    source: {
      name: "Al Jazeera",
      author: "Al Jazeera",
      published: "2022-05-13",
      url: "https://www.aljazeera.com/news/2022/5/13/honduras-retakes-sovereignty-by-nixing-corporate-enclaves",
    },
  },
  {
    id: "supreme-court",
    strand: "bill",
    claim:
      "In 2024 the Honduran Supreme Court declared the founding ZEDE decrees unconstitutional — and the zone kept operating.",
    detail:
      "The court struck down Decrees 236-2012 and 120-2013 in September 2024. Because the framework had been written into the constitution, the repeal required ratification by a subsequent Congress, which did not happen. The result is a zone whose legal basis a country's highest court has voided and which continues to function.",
    figure: null,
    scope:
      "The Supreme Court of Honduras, September 2024, on the two named decrees. The procedural position remains contested and is itself the subject of the pending arbitration.",
    tier: "documented",
    source: {
      name: "US Department of State — Report to Congress",
      author: "US Department of State",
      published: "2026-06",
      url: "https://www.state.gov/wp-content/uploads/2026/06/United-States-Investment-in-Prospera-ZEDE-Accessible-HRC1399978.pdf",
    },
    chart: {
      kind: "count",
      max: 2,
      axis: "founding decrees struck down — 236-2012 and 120-2013",
      bars: [
        { label: "Decrees voided", value: 2, unit: "" },
      ],
    },
  },
  {
    id: "claim-size",
    strand: "bill",
    claim:
      "Próspera's damages experts value the claim against Honduras at an average of $10.6 billion, and up to $26.4 billion.",
    detail:
      "The case is Honduras Próspera Inc. and others v. Republic of Honduras, ICSID Case No. ARB/23/2, filed under CAFTA-DR. The claimants' October 2025 memorial values the intrinsic worth of a 30-year business plan. The figure is what a private city says a country owes it for changing its mind about hosting one.",
    figure: "$10.6bn claimed",
    scope:
      "A claimed valuation in a PENDING arbitration with no award. A claim is a number one party has asked for. It is not a debt, not a judgment, and not what Honduras will pay.",
    tier: "documented",
    source: {
      name: "Claimants' Memorial on the Merits, ICSID ARB/23/2",
      author: "Honduras Próspera Inc. and others",
      published: "2025-10-15",
      url: "https://www.italaw.com/cases/9971",
    },
    chart: {
      kind: "dots",
      max: 26.4,
      axis: "claimed valuation of a 30-year business plan, $ billions",
      bars: [
        { label: "Average valuation", value: 10.6, unit: "bn", prefix: "$" },
        { label: "Upper valuation", value: 26.4, unit: "bn", prefix: "up to $" },
      ],
    },
  },
  {
    id: "icsid-exit",
    strand: "bill",
    claim:
      "Honduras withdrew from the World Bank's arbitration convention — and still has to answer this claim.",
    detail:
      "Honduras filed to leave ICSID in February 2024, effective that August. Withdrawal does not extinguish claims already registered, so the case continues. Leaving the venue is the strongest move a state can make against investor-state arbitration, and it does not reach the case that prompted it.",
    figure: null,
    scope:
      "Honduras's denunciation of the ICSID Convention, filed February 2024, effective August 2024. Concerns the forum, not the underlying CAFTA-DR obligations.",
    tier: "documented",
    source: {
      name: "UNCTAD Investment Dispute Settlement Navigator",
      author: "UNCTAD",
      published: "2025",
      url: "https://investmentpolicy.unctad.org/investment-dispute-settlement/cases/1292/pr-spera-and-others-v-honduras",
    },
  },
  {
    id: "sovereign-by-contract",
    strand: "bill",
    claim:
      "The sovereignty in these projects is contractual, and the contract is enforced somewhere else.",
    detail:
      "Próspera's autonomy came from a Honduran statute and its protection comes from an investment treaty adjudicated in Washington. That is the mechanism the whole model rests on: the host state grants the exemption, and an international tribunal makes the grant expensive to revoke. Exit from the state is underwritten by the state system.",
    figure: null,
    scope:
      "A characterisation of the legal structure evidenced by the findings above — the statute, the repeal, and the CAFTA-DR arbitration. An argument about mechanism, tiered as such rather than presented as a measurement.",
    tier: "emergent",
    source: {
      name: "UNCTAD Investment Dispute Settlement Navigator",
      author: "UNCTAD",
      published: "2025",
      url: "https://investmentpolicy.unctad.org/investment-dispute-settlement/cases/1292/pr-spera-and-others-v-honduras",
    },
  },

  // ── argentina ────────────────────────────────────────────────────────────
  {
    id: "thiel-milei",
    strand: "argentina",
    claim:
      "Peter Thiel moved to Buenos Aires and has met Argentina's president repeatedly.",
    detail:
      "Reporting in 2026 places Thiel in Buenos Aires and describes a third meeting with Javier Milei since February 2024. Argentina is the first case in this report of a national government, rather than a county or a small state's legislature, aligning itself with the thesis — which changes the scale of what can be attempted.",
    figure: null,
    scope:
      "Press reporting, 2026. Meetings and residence, not investments: no figure for capital committed to Argentina by Thiel or his funds has been published, and none is asserted here.",
    tier: "reported",
    source: {
      name: "New Lines Magazine",
      author: "New Lines Magazine",
      published: "2026",
      url: "https://newlinesmag.com/argument/what-is-peter-thiel-up-to-in-argentina/",
    },
    chart: {
      kind: "count",
      max: 3,
      axis: "meetings with Argentina's president since February 2024",
      bars: [
        { label: "Reported meetings", value: 3, unit: "" },
      ],
    },
  },
  {
    id: "rigi",
    strand: "argentina",
    claim:
      "Argentina offers thirty years of legal and tax stability to investments above $200 million.",
    detail:
      "The RIGI regime locks the applicable tax, customs and exchange rules for three decades for qualifying large investments. It is the charter-city bargain — jurisdictional certainty traded for capital — written as national law and open to anyone who can meet the threshold, rather than carved into a territory.",
    figure: "30 years · $200m",
    scope:
      "Argentina's Régimen de Incentivo para Grandes Inversiones as reported. A national investment regime, not a special jurisdiction: it does not create separate courts, police or residency.",
    tier: "reported",
    source: {
      name: "21CBI",
      author: "21CBI",
      published: "2025",
      url: "https://21cbi.io/blog/milei-rigi-explained-200m-threshold-30-year-tax-stability-lock-not-for-most-bitcoiners",
    },
    chart: {
      kind: "bars",
      max: 30,
      axis: "years of locked tax and customs rules for qualifying investments",
      bars: [{ label: "Stability period", value: 30, unit: " years" }],
    },
  },
  {
    id: "non-human-corporations",
    strand: "argentina",
    claim:
      "Argentina's government has proposed corporations with no human owners, held in tokens on a blockchain.",
    detail:
      "A draft bill sent to Congress proposes recognising non-human companies whose ownership is expressed in tokens and whose records are held on a blockchain. Whatever else it is, it is the clearest statement yet of where this project ends: not a city with unusual rules, but a legal person with no natural person behind it.",
    figure: null,
    scope:
      "A draft bill as reported by the Buenos Aires Herald. Proposed, not passed — this report makes no claim about its prospects, and a draft is not a law.",
    tier: "reported",
    source: {
      name: "Buenos Aires Herald",
      author: "Buenos Aires Herald",
      published: "2026",
      url: "https://buenosairesherald.com/business/tech/mileis-proposal-to-allow-non-human-corporations-run-by-ai-causes-concern-in-argentina",
    },
  },
];

export const TIMELINE: TimelineEvent[] = [
  {
    id: "zede-law",
    date: "2013",
    dateNote: "publication",
    strand: "release",
    title: "Honduras writes the ZEDE framework into law",
    detail:
      "Decrees 236-2012 and 120-2013 create Zones for Employment and Economic Development with their own legal, regulatory and judicial arrangements — the statutory basis every later project cites.",
    tier: "documented",
    source: {
      name: "US Department of State — Report to Congress",
      author: "US Department of State",
      published: "2026-06",
      url: "https://www.state.gov/wp-content/uploads/2026/06/United-States-Investment-in-Prospera-ZEDE-Accessible-HRC1399978.pdf",
    },
  },
  {
    id: "network-state-book",
    date: "2022",
    dateNote: "publication",
    strand: "finding",
    title: "The Network State published",
    detail:
      "Balaji Srinivasan defines the goal as crowdfunded territory and eventual diplomatic recognition — the sentence the whole movement organises around.",
    tier: "documented",
    source: {
      name: "The Network State",
      author: "Balaji Srinivasan",
      published: "2022",
      url: "https://thenetworkstate.com/",
    },
  },
  {
    id: "repeal",
    date: "2022-04",
    dateNote: "publication",
    strand: "response",
    title: "Honduras repeals the ZEDE law, unanimously",
    detail:
      "Three months into Xiomara Castro's presidency, Congress votes without dissent to repeal the statute, framing it as retaking sovereignty.",
    tier: "documented",
    source: {
      name: "Al Jazeera",
      author: "Al Jazeera",
      published: "2022-05-13",
      url: "https://www.aljazeera.com/news/2022/5/13/honduras-retakes-sovereignty-by-nixing-corporate-enclaves",
    },
  },
  {
    id: "icsid-filed",
    date: "2023",
    dateNote: "publication",
    strand: "response",
    title: "Próspera files against Honduras at ICSID",
    detail:
      "Honduras Próspera Inc. and two affiliates bring a claim under CAFTA-DR, registered as ICSID Case No. ARB/23/2.",
    tier: "documented",
    source: {
      name: "italaw — ICSID Case No. ARB/23/2",
      author: "italaw",
      published: "2023",
      url: "https://www.italaw.com/cases/9971",
    },
  },
  {
    id: "cf-revealed",
    date: "2023-08",
    dateNote: "publication",
    strand: "finding",
    title: "California Forever's buyers are identified",
    detail:
      "After six years of land assembly through a shell company, the backers behind roughly 50,000 acres of Solano County farmland are named publicly.",
    tier: "reported",
    source: {
      name: "NBC Bay Area",
      author: "NBC Bay Area",
      published: "2024-07-22",
      url: "https://www.nbcbayarea.com/news/local/north-bay/california-forever-solano-county-ballot-measure-pulled/3599985/",
    },
  },
  {
    id: "honduras-icsid-exit",
    date: "2024-02-24",
    dateNote: "publication",
    strand: "response",
    title: "Honduras files to leave ICSID",
    detail:
      "The denunciation takes effect on 25 August 2024. Claims already registered — including this one — survive it.",
    tier: "documented",
    source: {
      name: "UNCTAD Investment Dispute Settlement Navigator",
      author: "UNCTAD",
      published: "2025",
      url: "https://investmentpolicy.unctad.org/investment-dispute-settlement/cases/1292/pr-spera-and-others-v-honduras",
    },
  },
  {
    id: "cf-withdraws",
    date: "2024-07-22",
    dateNote: "announcement",
    strand: "response",
    title: "California Forever withdraws its ballot measure",
    detail:
      "One day before the county vote, after a report finding the plan would need billions in infrastructure. The company says it will return in 2026 with an environmental impact report.",
    tier: "documented",
    source: {
      name: "Local News Matters",
      author: "Bay City News",
      published: "2024-07-23",
      url: "https://localnewsmatters.org/2024/07/23/california-forever-abandons-ballot-measure-in-face-of-growing-opposition-looks-to-2026/",
    },
  },
  {
    id: "supreme-court-event",
    date: "2024-09",
    dateNote: "publication",
    strand: "response",
    title: "Honduran Supreme Court voids the ZEDE decrees",
    detail:
      "Decrees 236-2012 and 120-2013 are declared unconstitutional. Congress does not ratify in the following session, and the zone continues to operate.",
    tier: "documented",
    source: {
      name: "US Department of State — Report to Congress",
      author: "US Department of State",
      published: "2026-06",
      url: "https://www.state.gov/wp-content/uploads/2026/06/United-States-Investment-in-Prospera-ZEDE-Accessible-HRC1399978.pdf",
    },
  },
  {
    id: "praxis-raise-event",
    date: "2024-10",
    dateNote: "announcement",
    strand: "release",
    title: "Praxis announces $525 million",
    detail:
      "The largest single financing in the network-state movement, from a cap table that recurs across these projects.",
    tier: "reported",
    source: {
      name: "The Block",
      author: "The Block",
      published: "2024-10",
      url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    },
  },
  {
    id: "praxis-vandenberg",
    date: "2025-04",
    dateNote: "announcement",
    strand: "release",
    title: "Praxis names a US Space Force base as its first site",
    detail:
      "Its chief executive says the first city, Atlas, will be built at Vandenberg — a federal military installation, for a project premised on exit from the state.",
    tier: "reported",
    source: {
      name: "Gizmodo",
      author: "Gizmodo",
      published: "2024-10",
      url: "https://gizmodo.com/praxis-another-tech-billionaire-backed-urban-project-gets-525-million-in-funding-2000512690",
    },
  },
  {
    id: "state-report",
    date: "2025-08",
    dateNote: "publication",
    strand: "finding",
    title: "The State Department reports to Congress on Próspera",
    detail:
      "A private jurisdiction inside another country becomes a recurring item of US foreign policy, reported again in June 2026.",
    tier: "documented",
    source: {
      name: "US Department of State — Report to Congress",
      author: "US Department of State",
      published: "2025-08",
      url: "https://www.state.gov/wp-content/uploads/2025/08/Report-United-States-investment-in-Pro%C2%B4spera-ZEDE-006088-1-508-Accessible-HRC1152641.pdf",
    },
  },
  {
    id: "memorial",
    date: "2025-10-15",
    dateNote: "publication",
    strand: "finding",
    title: "The claim is valued at $10.6bn, and up to $26.4bn",
    detail:
      "The claimants' memorial on the merits puts the intrinsic value of the 30-year business plan on the record. The case remains undecided.",
    tier: "documented",
    source: {
      name: "italaw — ICSID Case No. ARB/23/2",
      author: "italaw",
      published: "2025-10-15",
      url: "https://www.italaw.com/cases/9971",
    },
  },
  {
    id: "thiel-ba",
    date: "2026-04",
    dateNote: "publication",
    strand: "finding",
    title: "Thiel in Buenos Aires",
    detail:
      "Reporting places Peter Thiel living in Buenos Aires and meeting Javier Milei for the third time since February 2024.",
    tier: "reported",
    source: {
      name: "New Lines Magazine",
      author: "New Lines Magazine",
      published: "2026",
      url: "https://newlinesmag.com/argument/what-is-peter-thiel-up-to-in-argentina/",
    },
  },
  {
    id: "non-human-bill",
    date: "2026",
    dateNote: "announcement",
    strand: "release",
    title: "Argentina proposes non-human corporations",
    detail:
      "A draft bill would recognise companies with no human owners, held in tokens and recorded on a blockchain.",
    tier: "reported",
    source: {
      name: "Buenos Aires Herald",
      author: "Buenos Aires Herald",
      published: "2026",
      url: "https://buenosairesherald.com/business/tech/mileis-proposal-to-allow-non-human-corporations-run-by-ai-causes-concern-in-argentina",
    },
  },
];

export const PRESS: PressItem[] = [
  {
    id: "state-dept",
    publisher: "US Department of State",
    title: "Report to Congress on United States Investment in Próspera ZEDE",
    published: "2026-06",
    blurb:
      "The primary document behind most of this report's legal chronology, and evidence in itself of how far a private jurisdiction has travelled into foreign policy.",
    url: "https://www.state.gov/wp-content/uploads/2026/06/United-States-Investment-in-Prospera-ZEDE-Accessible-HRC1399978.pdf",
    image: null,
  },
  {
    id: "italaw",
    publisher: "italaw",
    title: "Honduras Próspera Inc. and others v. Republic of Honduras, ICSID ARB/23/2",
    published: "2025",
    blurb:
      "The case file, including the claimants' memorial. The arbitration is public, and reading it is the fastest route past everybody's summary of it.",
    url: "https://www.italaw.com/cases/9971",
    image: null,
  },
  {
    id: "aljazeera-repeal",
    publisher: "Al Jazeera",
    title: "Honduras 'retakes sovereignty' by nixing corporate enclaves",
    published: "2022-05-13",
    blurb: "The repeal, reported at the time, with the government's own framing of it.",
    url: "https://www.aljazeera.com/news/2022/5/13/honduras-retakes-sovereignty-by-nixing-corporate-enclaves",
    image:
      "https://www.aljazeera.com/wp-content/uploads/2022/05/2021-09-15T192650Z_2005148847_RC28QP95OT9N_RTRMADP_3_HONDURAS-PROTEST.jpg?resize=1920%2C1440",
  },
  {
    id: "fp-honduras",
    publisher: "Foreign Policy",
    title: "U.S. Investors Could Bankrupt Honduras, With Biden Administration Support",
    published: "2024-01-24",
    blurb:
      "The argument about what an arbitration of this size means for a country of this size. Opinion, and included as such.",
    url: "https://foreignpolicy.com/2024/01/24/honduras-zedes-us-prospera-world-bank-biden-castro/",
    image:
      "https://foreignpolicy.com/wp-content/uploads/2024/01/GettyImages-1234139450.jpg",
  },
  {
    id: "newlines-thiel",
    publisher: "New Lines Magazine",
    title: "What Is Peter Thiel up to in Argentina?",
    published: "2026",
    blurb: "The Argentine strand, and the clearest account of what has actually been observed there.",
    url: "https://newlinesmag.com/argument/what-is-peter-thiel-up-to-in-argentina/",
    image:
      "https://newlinesmag.com/wp-content/uploads/GettyImages-1239811965.jpg-web.jpg",
  },
  {
    id: "block-praxis",
    publisher: "The Block",
    title: "'Network State' project Praxis secures $525 million to build crypto-friendly city",
    published: "2024-10",
    blurb: "The raise, the backers, and the absence of a site at the time of announcing.",
    url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    image: null,
  },
];

export const DROPPED: Dropped[] = [
  {
    claim: "That Próspera is suing Honduras for a third of its GDP",
    reason:
      "The comparison is everywhere and the arithmetic is never shown. GDP, government budget and foreign reserves are different denominators giving very different fractions, and none of the sources reached stated which they used. The claim amount is reported on its own instead.",
  },
  {
    claim: "That Honduras will have to pay $10.6 billion",
    reason:
      "The case is pending and there is no award. A claimed valuation is a number one party has asked for. Reporting it as a debt would be inventing an outcome.",
  },
  {
    claim: "Honduras rejoining ICSID under a new president in March 2026",
    reason:
      "Reported by a secondary legal-explainer site with no primary document or ICSID notice reachable to confirm it. Directly relevant and excluded anyway, under the same rule as everything else.",
  },
  {
    claim: "Próspera's e-resident count, as distinct from physical residents",
    reason:
      "The published total does not separate the two, and the distinction matters enormously to what 1,700 residents means. Not estimated.",
  },
  {
    claim: "That Vitalia and Zuzalu are network states or cities",
    reason:
      "Both are pop-up residencies of a few months. Search results conflate them with permanent settlements and place them in contradictory locations. Excluded as unreliable rather than tidied up.",
  },
  {
    claim: "Specific capital committed by Peter Thiel to Argentine ventures",
    reason:
      "Meetings and residence are documented; investment figures are not. The absence of a number is not a reason to reach for one.",
  },
  {
    claim: "Employment and investment totals published by Próspera",
    reason:
      "Figures for jobs created and dollars invested appear only in the operator's own marketing, with no third party able to check them. The resident and company counts are included because they are load-bearing, and are flagged as self-reported; the rest is left out.",
  },
  {
    claim: "That the network-state movement is a single coordinated project",
    reason:
      "The funders overlap heavily, which is documented and in the report. Coordination is a stronger claim, and nothing reached here evidences it.",
  },
];

/**
 * Broadcast coverage, harvested and checked — every id, title, channel and
 * date read off the watch page, every `thumb` confirmed to return 200.
 *
 * Deliberately spans the argument rather than one side of it: Bloomberg and
 * AJ+ are hostile, ReasonTV is the movement's own outlet, and two are
 * enthusiast tours. A coverage rail that only carried the critics would be
 * making the report's case for it.
 */
export const VIDEOS: Video[] = [
  {
    id: "n6My2aYZByw",
    channel: "Bloomberg Podcasts",
    title: "How a Libertarian Island Experiment Became an $11 Billion Nightmare | Big Take",
    published: "2025-02-18",
    blurb: "The arbitration, told as a business story — the clearest broadcast account of the claim.",
    thumb: "https://i.ytimg.com/vi/n6My2aYZByw/maxresdefault.jpg",
  },
  {
    id: "X9xmdRgHEj4",
    channel: "AJ+",
    title: "What Happens When American Billionaires Build A Private City In Your Country",
    published: "2025-04-28",
    blurb: "The Honduran side of it, and the part of the story that is about sovereignty rather than tax.",
    thumb: "https://i.ytimg.com/vi/X9xmdRgHEj4/maxresdefault.jpg",
  },
  {
    id: "RGrh3JuR0A0",
    channel: "Business Insider",
    title: "Inside The Mysterious Bitcoin City Billionaires Are Pouring Money Into",
    published: "2024-03-04",
    blurb: "A reported visit, filmed inside the zone while the repeal was already law.",
    thumb: "https://i.ytimg.com/vi/RGrh3JuR0A0/maxresdefault.jpg",
  },
  {
    id: "TwiE1dxGYNY",
    channel: "ReasonTV",
    title: "A private libertarian city in Honduras",
    published: "2023-07-06",
    blurb:
      "The case for it, made by the movement's own magazine. Included because a report that only shows the critics is not showing the argument.",
    thumb: "https://i.ytimg.com/vi/TwiE1dxGYNY/maxresdefault.jpg",
  },
  {
    id: "Oohil-QfBvA",
    channel: "My Latin Life",
    title: "What is Prospera? The charter city on the island of Roatán, Honduras",
    published: "2025-07-03",
    blurb: "A resident's-eye tour — useful for what the place physically is, at what scale.",
    thumb: "https://i.ytimg.com/vi/Oohil-QfBvA/maxresdefault.jpg",
  },
  {
    id: "PCGSIlhDfJk",
    channel: "Etienne de la Boetie2",
    title: "A Tour of Prospera — The Low-Tax, Pro-Freedom Charter City on Roatan Island",
    published: "2025-04-30",
    blurb: "An advocate's walkthrough, and a plain look at how much has actually been built.",
    thumb: "https://i.ytimg.com/vi/PCGSIlhDfJk/maxresdefault.jpg",
  },
];

/**
 * Every preview image on the page, in one list, for the masthead mosaic.
 *
 * Derived, so the wall behind the title is literally the coverage below it and
 * can never show a picture the page does not also credit.
 */
export const MOSAIC: string[] = [
  ...VIDEOS.map((v) => v.thumb),
  ...PRESS.map((p) => p.image).filter((src): src is string => src !== null),
];

export const findingsIn = (s: Strand) => findingsInStrand(FINDINGS, s);
export const countByTier = (t: Tier) => countTier(FINDINGS, t);
