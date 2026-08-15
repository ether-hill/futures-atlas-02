/**
 * The AI Kill Chain — the data layer for the report at /feed/ai-kill-chain.
 *
 * Same contract as `hegemony.ts`: this file is the single source of truth and
 * the page is a view of it. The evidence rules live in `report-types.ts` and
 * are not restated here, with one addition that this subject demands.
 *
 * ── The addition ────────────────────────────────────────────────────────────
 *
 * On this subject the temptation is not to overstate a number. It is to
 * overstate a CAUSAL CHAIN: to move from "a system produced a list" to "a
 * machine chose to kill", which is a different claim and one nobody has
 * evidenced. Every finding here is scoped to what was actually documented —
 * what the system output, who reviewed it, for how long, and what the reviewer
 * was permitted to do. Where the record stops, the finding stops.
 *
 * The other trap is the opposite one. "A human was in the loop" is quoted as
 * though it settles the question, when the measured question is what that
 * human did with the output and how long they had. The automation-bias strand
 * exists because that is a researchable question with decades of results, and
 * leaving it out would let a procedural answer stand in for an empirical one.
 *
 * Nothing here is a live-target or capability guide: every finding is drawn
 * from published journalism, published policy documents, published UN records
 * and peer-reviewed research, all already public and all linked.
 */

import {
  countTier,
  findingsInStrand,
  type Dropped,
  type Finding,
  type PressItem,
  type Tier,
  type TimelineEvent,
} from "./report-types";

export * from "./report-types";

/** Which section of the report a finding belongs to. */
export type Strand = "chain" | "deployed" | "loop" | "vendors" | "law";

export const STRAND_NAME: Record<Strand, string> = {
  chain: "The chain",
  deployed: "In use",
  loop: "The loop",
  vendors: "The vendors",
  law: "The law",
};

export const PUBLISHED = "2026-08-15";

export const FINDINGS: Finding[] = [
  // ── the chain ────────────────────────────────────────────────────────────
  // The spine of this section is that "AI in weapons" is the wrong frame. The
  // machine learning is almost never in the munition. It is upstream, in the
  // finding and fixing of targets, where there is no trigger to guard and no
  // moment anybody would recognise as a decision to fire.
  {
    id: "maven-users",
    strand: "chain",
    claim:
      "The US military's main AI targeting-support system had more than 20,000 users by May 2025.",
    detail:
      "Maven Smart System ingests satellite and drone imagery and other feeds, flags and tracks objects of interest, and presents candidate targets to analysts. It is decision support rather than a weapon: it does not fire, and its output is a list a human works from. The user count is the measure of how normal that support has become.",
    figure: "20,000+ users",
    scope:
      "Maven Smart System specifically, as reported by CSIS and DefenseScoop in 2025. A count of accounts with access, not of strikes, and not of targets accepted. Says nothing about how the output was used in any particular case.",
    tier: "reported",
    source: {
      name: "CSIS — What Is Maven Smart System, and What Does It Do?",
      author: "Center for Strategic and International Studies",
      published: "2025",
      url: "https://www.csis.org/analysis/what-maven-smart-system-and-what-does-it-do",
    },
    chart: {
      kind: "count",
      max: 20000,
      axis: "accounts with access to Maven Smart System, May 2025",
      bars: [{ label: "Active users", value: 20000, unit: "", prefix: "more than " }],
    },
  },
  {
    id: "maven-ceiling",
    strand: "chain",
    claim:
      "The Pentagon raised the spending ceiling on Palantir's Maven software by $795 million in a single decision.",
    detail:
      "The Defense Department announced on 21 May 2025 that it was increasing the ceiling for Maven Smart System software licences by $795 million, taking the total to roughly $1.3 billion through 2029, against a ceiling of $480 million a year earlier. The stated reason was growing demand from the combatant commands.",
    figure: "$480m → $1.3bn",
    scope:
      "A contract ceiling, not money spent — a ceiling is permission to spend, and the two routinely differ. Covers software licences for one system through 2029. Not the Pentagon's total AI budget.",
    tier: "documented",
    source: {
      name: "DefenseScoop",
      author: "DefenseScoop",
      published: "2025-05-23",
      url: "https://defensescoop.com/2025/05/23/dod-palantir-maven-smart-system-contract-increase/",
    },
    chart: {
      kind: "slope",
      max: 1300,
      axis: "Maven Smart System contract ceiling, $ millions",
      bars: [
        { label: "Ceiling, 2024", value: 480, unit: "m", prefix: "$" },
        { label: "Ceiling, 2025", value: 1300, unit: "bn", prefix: "$1.3" },
      ],
    },
  },
  {
    id: "nato-maven",
    strand: "chain",
    claim: "NATO bought the same targeting-support system in 2025.",
    detail:
      "NATO signed a contract with Palantir for Maven Smart System in April 2025 for use by Allied Command Operations. The alliance described it as one of its most significant software acquisitions, and the procurement moved in a matter of months rather than years.",
    figure: null,
    scope:
      "NATO's own acquisition for Allied Command Operations. The contract value was not disclosed at announcement. Says nothing about which member states use it or for what.",
    tier: "documented",
    source: {
      name: "DefenseScoop",
      author: "DefenseScoop",
      published: "2025-04-14",
      url: "https://defensescoop.com/2025/04/14/nato-palantir-maven-smart-system-contract",
    },
  },
  {
    id: "replicator-shortfall",
    strand: "chain",
    claim:
      "The Pentagon's programme to field thousands of autonomous systems in two years appears to have fielded hundreds.",
    detail:
      "Replicator was announced on 28 August 2023 with the goal of fielding multiple thousands of attritable autonomous systems by August 2025. The Congressional Research Service notes that the exact number is classified, and that reporting points to hundreds rather than thousands by the target date. The programme declared its goal met.",
    figure: "thousands promised",
    scope:
      "Replicator 1 only, to its August 2025 deadline. The true figure is classified, so this finding is about the gap between the stated goal and what the CRS could confirm — not a count.",
    tier: "documented",
    source: {
      name: "Congressional Research Service — IF12611",
      author: "Congressional Research Service",
      published: "2025",
      url: "https://www.congress.gov/crs-product/IF12611",
    },
  },

  // ── in use ───────────────────────────────────────────────────────────────
  {
    id: "lavender-scale",
    strand: "deployed",
    claim:
      "An Israeli military system marked as many as 37,000 Palestinians as suspected militants during the early months of the Gaza war.",
    detail:
      "The investigation by Yuval Abraham for +972 Magazine and Local Call, based on interviews with six Israeli intelligence officers with first-hand involvement, described a system called Lavender that scored the population of Gaza for likelihood of militant affiliation and produced target lists at a scale that had no precedent in the army's own practice.",
    figure: "37,000",
    scope:
      "As reported by +972 Magazine and Local Call in April 2024, from six named-anonymous intelligence sources. The Israeli military disputed elements of the account. This is the number of people marked by the system, not the number struck, and not a casualty figure.",
    tier: "reported",
    source: {
      name: "+972 Magazine and Local Call",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
    chart: {
      kind: "count",
      max: 37000,
      axis: "people marked by the system, as reported",
      bars: [{ label: "Marked as suspected militants", value: 37000, unit: "", prefix: "up to " }],
    },
  },
  {
    id: "twenty-seconds",
    strand: "deployed",
    claim:
      "Officers reported spending about 20 seconds on a target before authorising a strike — enough to check that the name was male.",
    detail:
      "Sources told the investigation that human review of a machine-generated target was often a rubber stamp of a few seconds, and that its function was to confirm the target was a man rather than to check the machine's reasoning. The Israeli military did not specifically dispute the 20-second figure, stating that analysts verify targets against the relevant legal definitions.",
    figure: "~20 seconds",
    scope:
      "Reported practice during a specific period of the Gaza war, from the same six sources. A description of what review meant in practice, not a rule or a published procedure.",
    tier: "reported",
    source: {
      name: "+972 Magazine and Local Call",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
    chart: {
      kind: "count",
      max: 20,
      axis: "seconds of human review per machine-generated target, as reported",
      bars: [{ label: "Time spent per target", value: 20, unit: "s", prefix: "about " }],
    },
  },
  {
    id: "error-rate",
    strand: "deployed",
    claim: "The system was understood internally to be wrong about one time in ten.",
    detail:
      "Sources put Lavender's error rate at approximately 10%. The described failure mode is instructive: a phone changing hands — passed to a son, a brother or an unrelated person — would move the marking with it, and there was no supervising mechanism designed to catch that class of mistake before a strike.",
    figure: "~10%",
    scope:
      "An internally understood rate as described by sources to +972 Magazine, not an audited or published figure, and not one the Israeli military has confirmed. It is the reported basis on which strikes proceeded, which is why it is here.",
    tier: "reported",
    source: {
      name: "+972 Magazine and Local Call",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
    chart: {
      kind: "waffle",
      max: 100,
      cells: 100,
      axis: "of every hundred markings, as reported to the investigation",
      bars: [{ label: "Understood to be wrong", value: 10, unit: "%", prefix: "about " }],
    },
  },
  {
    id: "collateral-ratios",
    strand: "deployed",
    claim:
      "Reported pre-authorised civilian tolerances ran from 15–20 people for a junior operative to more than 100 for a senior commander.",
    detail:
      "The investigation reported standing permissions attached to a target's rank, applied to strikes on residential buildings, frequently at night when families were home. A pre-authorised ratio is the part of the process that most resembles a policy decision, and it is set before any individual target exists.",
    figure: "15–20 vs 100+",
    scope:
      "Reported permissions during specific phases of the Gaza war, from six intelligence sources, disputed in part by the Israeli military. Ratios describe what was permitted, not what occurred in any given strike.",
    tier: "reported",
    source: {
      name: "+972 Magazine and Local Call",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
    chart: {
      kind: "dots",
      max: 100,
      axis: "civilian deaths reported as pre-authorised, by target seniority",
      bars: [
        { label: "Junior operative", value: 20, unit: "", prefix: "15–" },
        { label: "Senior commander", value: 100, unit: "", prefix: "more than " },
      ],
    },
  },
  {
    id: "ukraine-terminal",
    strand: "deployed",
    claim:
      "Terminal guidance is being handed to the drone because jamming has made the radio link unreliable.",
    detail:
      "Ukrainian units adopted AI lock-on-target guidance on small strike drones at scale from 2025. The driver is electronic warfare: a machine that can finish the run without a link cannot be jammed off it. Autonomy here is not an ambition, it is a workaround, which is why it spread faster than any policy debate about it.",
    figure: null,
    scope:
      "Ukrainian FPV and strike-drone practice as reported by CSIS and Forbes across 2025–2026. Terminal guidance onto an operator-selected target — not autonomous selection of who to strike. Figures for how widely it is fielded are not public.",
    tier: "reported",
    source: {
      name: "CSIS",
      author: "Center for Strategic and International Studies",
      published: "2025",
      url: "https://www.csis.org/analysis/ukraines-future-vision-and-current-capabilities-waging-ai-enabled-autonomous-warfare",
    },
  },
  {
    id: "saker-autonomous",
    strand: "deployed",
    claim:
      "Ukrainian reporting describes strikes carried out in fully autonomous mode when jamming cut the operator's link.",
    detail:
      "The Saker Scout system identifies targets and thermal signatures and is normally operated with a human selecting the strike. Reporting has described a small number of strikes completed autonomously where interference prevented communication with the operator. This is the narrowest documented instance of the threshold being crossed, and it was crossed by circumstance.",
    figure: null,
    scope:
      "Reported instances on a small scale against military hardware, via Forbes, not confirmed by any government. No published count, no independent verification, and no claim here about frequency.",
    tier: "emergent",
    source: {
      name: "Forbes",
      author: "David Hambling",
      published: "2025-03-05",
      url: "https://www.forbes.com/sites/davidhambling/2025/03/05/ukrainian-fpv-operator-reviews-ai-enabled-lock-on-target-drones/",
    },
  },

  // ── the loop ─────────────────────────────────────────────────────────────
  // The oldest evidence in this report, and the most uncomfortable: the
  // failure mode of human oversight was measured in laboratories decades
  // before anyone applied it to a target list.
  {
    id: "automation-bias",
    strand: "loop",
    claim:
      "People given a highly reliable but imperfect automated aid perform WORSE at monitoring than people given none.",
    detail:
      "Skitka, Mosier and Burdick ran a simulated flight task with and without an automated monitoring aid. Participants with the aid missed events the aid did not flag (errors of omission) and followed the aid's recommendation against their training and against other fully valid indicators in front of them (errors of commission). Automation did not add a check; it replaced one.",
    figure: null,
    scope:
      "A controlled laboratory study of a simulated flight task, published 1999 — not a study of military targeting, and not of any system in this report. It is cited as the mechanism, which is what a scope line is for.",
    tier: "documented",
    source: {
      name: "International Journal of Human-Computer Studies",
      author: "Skitka, Mosier & Burdick",
      published: "1999",
      url: "https://www.sciencedirect.com/science/article/abs/pii/S1071581999902525",
    },
  },
  {
    id: "training-partial",
    strand: "loop",
    claim:
      "Training people about automation bias reduced one kind of error and left the other untouched.",
    detail:
      "Follow-up work found that training focused explicitly on automation bias cut commission errors — doing what the machine said against the evidence — but did not reduce omission errors, the events people simply never noticed because nothing flagged them. The half that training does not fix is the half a target list is made of.",
    figure: null,
    scope:
      "Laboratory studies of automated decision aids, aggregated in the human-factors literature. Generalising from a flight-deck task to an intelligence workflow is an inference, and it is flagged as one here.",
    tier: "documented",
    source: {
      name: "International Journal of Human-Computer Studies",
      author: "Mosier, Skitka et al.",
      published: "2008",
      url: "https://sciencedirect.com/science/article/abs/pii/S1071581908000724",
    },
  },
  {
    id: "directive-review",
    strand: "loop",
    claim:
      "US policy requires senior review of autonomous weapons — and the reviews are not published.",
    detail:
      "DoD Directive 3000.09, updated on 25 January 2023, requires autonomous weapon systems outside defined exemptions to be reviewed by senior officials before development and again before fielding, and establishes a working group to advise that review. Reporting in October 2023 found the department would not say whether any such review had taken place.",
    figure: null,
    scope:
      "US Department of Defense policy only. The directive governs a category defined by the directive itself — decision-support software that produces target lists is generally not an 'autonomous weapon system' under it, which is the gap this report is about.",
    tier: "documented",
    source: {
      name: "DoD Directive 3000.09",
      author: "US Department of Defense",
      published: "2023-01-25",
      url: "https://www.esd.whs.mil/portals/54/documents/dd/issuances/dodd/300009p.pdf",
    },
  },

  // ── the vendors ──────────────────────────────────────────────────────────
  {
    id: "openai-policy",
    strand: "vendors",
    claim:
      "OpenAI deleted 'military and warfare' from its list of prohibited uses in January 2024.",
    detail:
      "Until 10 January 2024 the usage policy explicitly barred activity with a high risk of physical harm including weapons development and 'military and warfare'. The revised policy kept prohibitions on harming people and developing weapons and dropped the categorical phrase. OpenAI said the goal was clarity; the practical effect was to remove a bright line.",
    figure: null,
    scope:
      "A change to published usage policy wording, first reported by The Intercept. A policy is not a contract: this documents what the company permits itself to sell, not what it has sold.",
    tier: "documented",
    source: {
      name: "The Intercept",
      author: "Sam Biddle",
      published: "2024-01-12",
      url: "https://theintercept.com/2024/01/12/open-ai-military-ban-chatgpt/",
    },
  },
  {
    id: "anthropic-palantir",
    strand: "vendors",
    claim:
      "Claude was made available to US defence and intelligence customers through Palantir and AWS in November 2024.",
    detail:
      "The partnership, announced on 7 November 2024, put Anthropic's models into Palantir's platform at Impact Level 6 — the accreditation for classified national-security workloads up to secret. The models are the same ones sold commercially; the accreditation is what changes where they can run.",
    figure: null,
    scope:
      "The announced partnership only. Says what was made available and at what accreditation level, not which agencies use it, for what, or whether any of it touches targeting.",
    tier: "documented",
    source: {
      name: "TechCrunch",
      author: "TechCrunch",
      published: "2024-11-07",
      url: "https://techcrunch.com/2024/11/07/anthropic-teams-up-with-palantir-and-aws-to-sell-its-ai-to-defense-customers/",
    },
  },
  {
    id: "meta-exception",
    strand: "vendors",
    claim:
      "Meta's licence forbids military use of Llama, and Meta made an exception for five governments.",
    detail:
      "In November 2024 Meta announced it was making Llama available to US national-security agencies and contractors, and to counterparts in the United Kingdom, Canada, Australia and New Zealand — the Five Eyes. The acceptable-use policy prohibiting military application stayed in place for everyone else, which makes the prohibition a licensing position rather than a safety one.",
    figure: "5 governments",
    scope:
      "Meta's own announcement, November 2024. An exception to a licence term, not evidence of deployment. Open weights also mean the licence is the only enforcement mechanism there is.",
    tier: "documented",
    source: {
      name: "Meta Newsroom",
      author: "Meta",
      published: "2024-11-04",
      url: "https://about.fb.com/news/2024/11/open-source-ai-america-global-security/",
    },
    chart: {
      kind: "count",
      max: 5,
      axis: "governments exempted from the licence's military prohibition",
      bars: [{ label: "Five Eyes governments", value: 5, unit: "", }],
    },
  },

  // ── the law ──────────────────────────────────────────────────────────────
  {
    id: "unga-2024",
    strand: "law",
    claim:
      "166 states voted for the UN General Assembly resolution on autonomous weapons in December 2024. Three voted against.",
    detail:
      "Resolution 79/62 passed on 2 December 2024 by 166 to 3 with 15 abstentions. Belarus, North Korea and Russia voted against. China, India, Israel and Ukraine were among those abstaining. The resolution set up informal consultations rather than negotiations, which is the distinction that matters.",
    figure: "166 – 3 – 15",
    scope:
      "A UN General Assembly vote, which is not binding and does not open treaty negotiations. It measures declared positions at one moment, not conduct.",
    tier: "documented",
    source: {
      name: "Human Rights Watch",
      author: "Human Rights Watch",
      published: "2024-12-05",
      url: "https://www.hrw.org/news/2024/12/05/killer-robots-un-vote-should-spur-treaty-negotiations",
    },
    chart: {
      kind: "bars",
      max: 166,
      axis: "UN General Assembly, Resolution 79/62, 2 December 2024",
      bars: [
        { label: "In favour", value: 166, unit: "" },
        { label: "Abstained", value: 15, unit: "" },
        { label: "Against", value: 3, unit: "" },
      ],
    },
  },
  {
    id: "unga-2025",
    strand: "law",
    claim:
      "A year later the United States voted against the same resolution, joining Russia, Belarus, North Korea, Burundi and Israel.",
    detail:
      "The 2025 text was adopted by 164 in favour to 6 against, with 7 abstentions. The six were Belarus, Burundi, North Korea, Israel, the Russian Federation and the United States. In 2024 the US had not voted against. The bloc opposing even a non-binding consultation grew, and the country with the largest programme moved into it.",
    figure: "164 – 6 – 7",
    scope:
      "The First Committee recorded vote on A/C.1/80/L.41 as recorded by the UN. A vote against a procedural resolution is not a statement about any particular weapon, and is not read as one here.",
    tier: "documented",
    source: {
      name: "UN Meetings Coverage — GA/12736",
      author: "United Nations",
      published: "2025",
      url: "https://press.un.org/en/2025/ga12736.doc.htm",
    },
    chart: {
      kind: "slope",
      max: 6,
      axis: "states voting against the UNGA autonomous-weapons resolution",
      bars: [
        { label: "2024", value: 3, unit: "" },
        { label: "2025", value: 6, unit: "" },
      ],
    },
  },
  {
    id: "ai-act-exemption",
    strand: "law",
    claim:
      "The EU AI Act does not apply to systems used exclusively for military, defence or national-security purposes.",
    detail:
      "Article 2(3) removes such systems from the Regulation's scope regardless of the type of entity carrying out the activity. The load-bearing word is 'exclusively', and the debate is about who tests it: the exclusion turns on the declared purpose, with no requirement in the Article to demonstrate it. Recital 24 keeps dual-use systems in scope for their civilian uses.",
    figure: null,
    scope:
      "Regulation (EU) 2024/1689, Article 2(3), as published. A statement of legal scope, not of practice or enforcement — the point of the finding is that there is no enforcement to describe.",
    tier: "documented",
    source: {
      name: "EU Artificial Intelligence Act — Article 2",
      author: "European Union",
      published: "2024",
      url: "https://artificialintelligenceact.eu/article/2/",
    },
  },
  {
    id: "nuclear-statement",
    strand: "law",
    claim:
      "The US and China agreed in November 2024 that humans, not AI, should control nuclear weapons — in a statement, not a treaty.",
    detail:
      "Meeting in Lima on 16 November 2024, Biden and Xi affirmed the need to maintain human control over the decision to use nuclear weapons, the first time the two states had said so jointly. It carries no verification, no mechanism and no definition of control, which is a great deal less than it sounds and still more than exists anywhere else.",
    figure: null,
    scope:
      "A White House readout of a bilateral meeting. Not an agreement, not binding, not verifiable, and confined to nuclear use decisions — it says nothing about conventional targeting.",
    tier: "documented",
    source: {
      name: "CNBC, on the White House statement",
      author: "Reuters / CNBC",
      published: "2024-11-17",
      url: "https://www.cnbc.com/2024/11/17/biden-xi-agree-that-humans-not-ai-should-control-nuclear-arms.html",
    },
  },
  {
    id: "no-treaty",
    strand: "law",
    claim:
      "There is still no treaty. The UN Secretary-General asked for one by the end of 2026.",
    detail:
      "The Secretary-General and the President of the ICRC jointly called on states to conclude a legally binding instrument on autonomous weapons by 2026. Discussions at the Convention on Certain Conventional Weapons have run since 2014 and operate by consensus, which means any one state can hold the outcome.",
    figure: "0 treaties",
    scope:
      "As of this report's publication date. Describes the absence of a binding instrument, not the absence of any law — international humanitarian law applies to these systems already; what is missing is anything specific to them.",
    tier: "documented",
    source: {
      name: "Human Rights Watch",
      author: "Human Rights Watch",
      published: "2025-05-21",
      url: "https://www.hrw.org/news/2025/05/21/un-start-talks-treaty-ban-killer-robots",
    },
  },
];

export const TIMELINE: TimelineEvent[] = [
  {
    id: "maven-founded",
    date: "2017-04",
    dateNote: "announcement",
    strand: "release",
    title: "Project Maven established",
    detail:
      "The Pentagon stood up the Algorithmic Warfare Cross-Functional Team to apply machine learning to drone and satellite imagery — the first large programme to put computer vision into the targeting workflow.",
    tier: "documented",
    source: {
      name: "CSIS",
      author: "Center for Strategic and International Studies",
      published: "2025",
      url: "https://www.csis.org/analysis/what-maven-smart-system-and-what-does-it-do",
    },
  },
  {
    id: "skitka",
    date: "1999",
    dateNote: "publication",
    strand: "finding",
    title: "Automation bias measured in the laboratory",
    detail:
      "Skitka, Mosier and Burdick showed that operators with a highly reliable automated aid made both omission and commission errors that operators without one did not — the mechanism, established a generation before it was applied to target lists.",
    tier: "documented",
    source: {
      name: "International Journal of Human-Computer Studies",
      author: "Skitka, Mosier & Burdick",
      published: "1999",
      url: "https://www.sciencedirect.com/science/article/abs/pii/S1071581999902525",
    },
  },
  {
    id: "directive-2023",
    date: "2023-01-25",
    dateNote: "publication",
    strand: "response",
    title: "DoD Directive 3000.09 updated",
    detail:
      "The US updated its decade-old autonomy policy, clarifying which systems need senior review before development and before fielding, and establishing a working group to advise the reviews.",
    tier: "documented",
    source: {
      name: "DoD Directive 3000.09",
      author: "US Department of Defense",
      published: "2023-01-25",
      url: "https://www.esd.whs.mil/portals/54/documents/dd/issuances/dodd/300009p.pdf",
    },
  },
  {
    id: "replicator-announced",
    date: "2023-08-28",
    dateNote: "announcement",
    strand: "release",
    title: "Replicator announced",
    detail:
      "The Deputy Secretary of Defense set a two-year goal: multiple thousands of attritable autonomous systems fielded across all domains by August 2025, explicitly to counter Chinese mass.",
    tier: "documented",
    source: {
      name: "Congressional Research Service — IF12611",
      author: "Congressional Research Service",
      published: "2025",
      url: "https://www.congress.gov/crs-product/IF12611",
    },
  },
  {
    id: "openai-deletes",
    date: "2024-01-10",
    dateNote: "publication",
    strand: "release",
    title: "OpenAI removes the military prohibition",
    detail:
      "The usage policy's explicit ban on 'military and warfare' disappears in a rewrite presented as a clarity exercise. Prohibitions on weapons development and harm to people remain.",
    tier: "documented",
    source: {
      name: "The Intercept",
      author: "Sam Biddle",
      published: "2024-01-12",
      url: "https://theintercept.com/2024/01/12/open-ai-military-ban-chatgpt/",
    },
  },
  {
    id: "lavender-published",
    date: "2024-04-03",
    dateNote: "publication",
    strand: "finding",
    title: "'Lavender' published",
    detail:
      "+972 Magazine and Local Call report a machine-generated target list of up to 37,000 people, a roughly 10% error rate, seconds of human review per target and pre-authorised civilian tolerances by rank. The first detailed public account of AI-assisted targeting at scale in a live war.",
    tier: "reported",
    source: {
      name: "+972 Magazine and Local Call",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
  },
  {
    id: "meta-exception-event",
    date: "2024-11-04",
    dateNote: "announcement",
    strand: "release",
    title: "Meta opens Llama to Five Eyes defence",
    detail:
      "Meta carves an exception into its own acceptable-use policy for US national-security agencies and contractors, and for the UK, Canada, Australia and New Zealand.",
    tier: "documented",
    source: {
      name: "Meta Newsroom",
      author: "Meta",
      published: "2024-11-04",
      url: "https://about.fb.com/news/2024/11/open-source-ai-america-global-security/",
    },
  },
  {
    id: "anthropic-palantir-event",
    date: "2024-11-07",
    dateNote: "announcement",
    strand: "release",
    title: "Claude accredited for classified defence work",
    detail:
      "Anthropic, Palantir and AWS announce Claude's availability to US defence and intelligence customers at Impact Level 6.",
    tier: "documented",
    source: {
      name: "TechCrunch",
      author: "TechCrunch",
      published: "2024-11-07",
      url: "https://techcrunch.com/2024/11/07/anthropic-teams-up-with-palantir-and-aws-to-sell-its-ai-to-defense-customers/",
    },
  },
  {
    id: "lima",
    date: "2024-11-16",
    dateNote: "announcement",
    strand: "response",
    title: "Biden and Xi on nuclear control",
    detail:
      "Meeting in Lima, the two leaders affirm the need to maintain human control over the decision to use nuclear weapons — the first joint statement of its kind, and not a binding one.",
    tier: "documented",
    source: {
      name: "CNBC, on the White House statement",
      author: "Reuters / CNBC",
      published: "2024-11-17",
      url: "https://www.cnbc.com/2024/11/17/biden-xi-agree-that-humans-not-ai-should-control-nuclear-arms.html",
    },
  },
  {
    id: "unga-79-62",
    date: "2024-12-02",
    dateNote: "publication",
    strand: "response",
    title: "UNGA Resolution 79/62 adopted, 166–3",
    detail:
      "The General Assembly votes to hold informal consultations on autonomous weapons. Belarus, North Korea and Russia vote against; China, India, Israel and Ukraine are among fifteen abstentions.",
    tier: "documented",
    source: {
      name: "Human Rights Watch",
      author: "Human Rights Watch",
      published: "2024-12-05",
      url: "https://www.hrw.org/news/2024/12/05/killer-robots-un-vote-should-spur-treaty-negotiations",
    },
  },
  {
    id: "nato-buys",
    date: "2025-04-14",
    dateNote: "announcement",
    strand: "release",
    title: "NATO buys Maven Smart System",
    detail:
      "Allied Command Operations acquires the same targeting-support platform the US uses, in one of the alliance's fastest significant software procurements.",
    tier: "documented",
    source: {
      name: "DefenseScoop",
      author: "DefenseScoop",
      published: "2025-04-14",
      url: "https://defensescoop.com/2025/04/14/nato-palantir-maven-smart-system-contract",
    },
  },
  {
    id: "treaty-call",
    date: "2025-05-21",
    dateNote: "publication",
    strand: "response",
    title: "UN Secretary-General and ICRC call for a treaty by 2026",
    detail:
      "A joint call for states to conclude a legally binding instrument on autonomous weapons systems by the end of 2026, after more than a decade of consensus-bound discussion at the CCW.",
    tier: "documented",
    source: {
      name: "Human Rights Watch",
      author: "Human Rights Watch",
      published: "2025-05-21",
      url: "https://www.hrw.org/news/2025/05/21/un-start-talks-treaty-ban-killer-robots",
    },
  },
  {
    id: "maven-ceiling-event",
    date: "2025-05-21",
    dateNote: "announcement",
    strand: "release",
    title: "Maven's ceiling raised to roughly $1.3bn",
    detail:
      "The Defense Department adds $795 million to the spending limit for Maven software licences through 2029, citing growing demand from the combatant commands.",
    tier: "documented",
    source: {
      name: "DefenseScoop",
      author: "DefenseScoop",
      published: "2025-05-23",
      url: "https://defensescoop.com/2025/05/23/dod-palantir-maven-smart-system-contract-increase/",
    },
  },
  {
    id: "replicator-deadline",
    date: "2025-08",
    dateNote: "publication",
    strand: "finding",
    title: "Replicator's deadline arrives",
    detail:
      "The programme declares its goal met. The Congressional Research Service notes the true number is classified and that reporting points to hundreds rather than thousands of systems fielded.",
    tier: "documented",
    source: {
      name: "USNI News",
      author: "US Naval Institute",
      published: "2025-08-26",
      url: "https://news.usni.org/2025/08/26/report-to-congress-on-defense-departments-replicator-initiative",
    },
  },
  {
    id: "unga-2025-event",
    date: "2025-11",
    dateNote: "publication",
    strand: "response",
    title: "The US votes against, 164–6",
    detail:
      "The First Committee adopts the autonomous-weapons resolution again. The United States joins Belarus, Burundi, North Korea, Israel and Russia in voting no — a bloc of three the year before.",
    tier: "documented",
    source: {
      name: "UN Meetings Coverage — GA/12736",
      author: "United Nations",
      published: "2025",
      url: "https://press.un.org/en/2025/ga12736.doc.htm",
    },
  },
];

export const PRESS: PressItem[] = [
  {
    id: "972-lavender",
    publisher: "+972 Magazine",
    title: "'Lavender': The AI machine directing Israel's bombing spree in Gaza",
    published: "2024-04-03",
    blurb:
      "Yuval Abraham's investigation with Local Call, from six intelligence sources. The primary document for most of the reporting that followed.",
    url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    image: null,
  },
  {
    id: "democracy-now",
    publisher: "Democracy Now!",
    title: "Lavender & Where's Daddy: How Israel Used AI to Form Kill Lists",
    published: "2024-04-05",
    blurb: "An interview with the reporter two days after publication, walking through the method.",
    url: "https://www.democracynow.org/2024/4/5/israel_ai",
    image: null,
  },
  {
    id: "intercept-openai",
    publisher: "The Intercept",
    title: "OpenAI quietly deletes ban on using ChatGPT for 'military and warfare'",
    published: "2024-01-12",
    blurb: "The policy diff that started the vendor strand, caught two days after it shipped.",
    url: "https://theintercept.com/2024/01/12/open-ai-military-ban-chatgpt/",
    image: null,
  },
  {
    id: "defensescoop-maven",
    publisher: "DefenseScoop",
    title: "'Growing demand' sparks DOD to raise Palantir's Maven contract to more than $1B",
    published: "2025-05-23",
    blurb: "The procurement record behind the adoption curve, with the numbers attached.",
    url: "https://defensescoop.com/2025/05/23/dod-palantir-maven-smart-system-contract-increase/",
    image: null,
  },
  {
    id: "csis-maven",
    publisher: "CSIS",
    title: "What Is Maven Smart System, and What Does It Do?",
    published: "2025",
    blurb:
      "The clearest public explanation of what the system actually does, and where a human sits in it.",
    url: "https://www.csis.org/analysis/what-maven-smart-system-and-what-does-it-do",
    image: null,
  },
  {
    id: "hrw-treaty",
    publisher: "Human Rights Watch",
    title: "UN: Start Talks on Treaty to Ban 'Killer Robots'",
    published: "2025-05-21",
    blurb: "The campaign side of the legal record, and a useful index of every vote to date.",
    url: "https://www.hrw.org/news/2025/05/21/un-start-talks-treaty-ban-killer-robots",
    image: null,
  },
];

export const DROPPED: Dropped[] = [
  {
    claim: "That an AI system has autonomously selected and killed a human being",
    reason:
      "This is the claim the subject is usually reduced to, and nobody has evidenced it. The closest documented case — Ukrainian strikes completed in autonomous mode after jamming cut the link — involves a target a human had already selected. Reported, scoped, and not stretched into the bigger claim.",
  },
  {
    claim: "The 2021 UN report on a Kargu-2 'hunting down' a human target in Libya",
    reason:
      "Very widely quoted as the first autonomous kill. The panel's wording does not state that anyone was killed, and the manufacturer disputed the reading. Excluded: the sentence everybody cites will not carry the weight put on it.",
  },
  {
    claim: "That Lavender's 37,000 figure equals 37,000 people killed",
    reason:
      "A frequent misreading of the +972 investigation. The figure is the number of people the system marked. Conflating a list with a casualty count is exactly the error this report exists to avoid.",
  },
  {
    claim: "Specific Israeli casualty attribution to any named system",
    reason:
      "No published source establishes which deaths followed from which system's output. The investigation documents process, not attribution, and the distinction is not ours to collapse.",
  },
  {
    claim: "The share of Ukrainian strikes using AI terminal guidance",
    reason:
      "Several outlets quote percentages. None traces to a Ukrainian government figure or an audited count, and the numbers disagree with each other by large margins. Excluded rather than averaged.",
  },
  {
    claim: "Project Maven's role in specific US strikes in Iraq and Syria",
    reason:
      "Reported in outline in 2024, but the accounts we could reach did not establish what the system contributed versus what analysts did. Left out rather than implied.",
  },
  {
    claim: "That the EU AI Act 'bans' any autonomous weapon",
    reason:
      "It does not reach them at all. Article 2(3) excludes exclusively military, defence and national-security uses from scope, so there is no prohibition to describe.",
  },
  {
    claim: "Total Pentagon AI spending figures",
    reason:
      "Widely circulated totals mix budget lines, ceilings and multi-year contract values that are not comparable. One contract ceiling, clearly labelled as a ceiling, is used instead.",
  },
];

export const findingsIn = (s: Strand) => findingsInStrand(FINDINGS, s);
export const countByTier = (t: Tier) => countTier(FINDINGS, t);
