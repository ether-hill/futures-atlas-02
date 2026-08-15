/**
 * The AI Kill Chain — the industry and institutional layer.
 *
 * Same two rules as every ecology module (see `ecology-types.ts`): weight is
 * how often a name appears in THIS report's own findings and timeline, not a
 * market position; and leadership is a dated snapshot with its own source,
 * because it moves.
 *
 * One rule specific to this report. A vendor appearing here is **not** an
 * accusation. Palantir builds decision-support software; OpenAI changed a
 * usage policy; Meta wrote a licence exception. What each of them is
 * documented as having done is on its card, and nothing on this page connects
 * any company to any strike, because no public source does.
 */

import { FINDINGS, TIMELINE } from "./killchain";
import { countMentions, type Leader, type Org } from "./ecology-types";

export * from "./ecology-types";

export const ORGS: Org[] = [
  {
    id: "palantir",
    name: "Palantir",
    role: "lab",
    aliases: ["Palantir"],
    note: "Builds Maven Smart System, the targeting-support platform whose US contract ceiling reached roughly $1.3bn and which NATO bought in 2025. Decision support: it produces candidates, not effects.",
  },
  {
    id: "openai",
    name: "OpenAI",
    role: "lab",
    logo: "openai",
    aliases: ["OpenAI"],
    note: "Deleted 'military and warfare' from its prohibited-uses list in January 2024, keeping bans on weapons development and harm to people.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    role: "lab",
    logo: "anthropic",
    aliases: ["Anthropic"],
    note: "Made Claude available to US defence and intelligence customers at Impact Level 6 through Palantir and AWS, in November 2024.",
  },
  {
    id: "meta",
    name: "Meta",
    role: "lab",
    logo: "meta",
    aliases: ["Meta"],
    note: "Kept a licence prohibition on military use of Llama and wrote an exception into it for the five Five Eyes governments.",
  },
  {
    id: "dod",
    name: "US Department of Defense",
    role: "state",
    aliases: ["Department of Defense", "Defense Department", "Pentagon", "DoD"],
    note: "Author of Directive 3000.09, buyer of Maven, and owner of Replicator. Also the state that moved from abstaining to voting against the UN resolution.",
  },
  {
    id: "nato",
    name: "NATO",
    role: "state",
    aliases: ["NATO"],
    note: "Acquired Maven Smart System for Allied Command Operations in April 2025 — the same targeting-support layer, on a second continent.",
  },
  {
    id: "un",
    name: "United Nations",
    role: "state",
    aliases: ["United Nations", "General Assembly", "Secretary-General", "UN"],
    note: "Two General Assembly votes, no negotiating mandate. The Secretary-General has asked for a binding instrument by the end of 2026.",
  },
  {
    id: "hrw",
    name: "Human Rights Watch",
    role: "measurer",
    aliases: ["Human Rights Watch"],
    note: "Keeps the running record of the votes and the state positions behind them — the source most of the legal strand rests on.",
  },
  {
    id: "crs",
    name: "Congressional Research Service",
    role: "measurer",
    aliases: ["Congressional Research Service"],
    note: "The reason the Replicator finding is a finding: it published what could and could not be confirmed against the programme's own claim.",
  },
  {
    id: "972",
    name: "+972 Magazine",
    role: "measurer",
    aliases: ["972 Magazine", "Local Call"],
    note: "With Local Call, published the Lavender investigation — the only detailed public account of machine-generated targeting at scale in a live war.",
  },
  {
    id: "csis",
    name: "CSIS",
    role: "measurer",
    aliases: ["CSIS", "Center for Strategic and International Studies"],
    note: "Published the clearest public description of what Maven Smart System does and where a human sits in the workflow.",
  },
];

/** This report's own tally. See countMentions — a fact about the page. */
export const mentionsOf = (org: Org) => countMentions(org, FINDINGS, TIMELINE);

export const LEADERS: Leader[] = [
  {
    id: "karp",
    name: "Alex Karp",
    role: "Chief executive and co-founder, Palantir",
    org: "palantir",
    note: "Runs the company whose software carries the largest documented AI targeting-support contract in this report, and the one NATO bought.",
    asOf: "2026-08-15",
    source: {
      name: "World Economic Forum",
      author: "World Economic Forum",
      published: "2026",
      url: "https://www.weforum.org/meetings/world-economic-forum-annual-meeting-2026/sessions/conversation-with-alex-karp-ceo-and-co-founder-palantir-technologies/",
    },
  },
  {
    id: "altman-kc",
    name: "Sam Altman",
    role: "Chief executive, OpenAI",
    org: "openai",
    note: "Led OpenAI through the January 2024 rewrite that removed the categorical prohibition on military and warfare uses.",
    asOf: "2026-08-15",
    source: {
      name: "Bloomberg",
      author: "Bloomberg News",
      published: "2026-07-29",
      url: "https://www.bloomberg.com/news/articles/2026-07-29/openai-ceo-sam-altman-discusses-next-ai-model-with-us-lawmakers",
    },
  },
  {
    id: "amodei-kc",
    name: "Dario Amodei",
    role: "Chief executive and co-founder, Anthropic",
    org: "anthropic",
    note: "Led Anthropic into the November 2024 partnership placing Claude in classified US defence and intelligence environments.",
    asOf: "2026-08-15",
    source: {
      name: "CNBC",
      author: "CNBC",
      published: "2026-07-27",
      url: "https://www.cnbc.com/2026/07/27/anthropic-ceo-dario-amodei-isnt-advocating-open-weight-model-ban.html",
    },
  },
  {
    id: "abraham",
    name: "Yuval Abraham",
    role: "Reporter, +972 Magazine and Local Call",
    org: "972",
    note: "Wrote the Lavender investigation from interviews with six Israeli intelligence officers. Most of what the public knows about machine-assisted targeting at scale comes from this reporting.",
    asOf: "2026-08-15",
    source: {
      name: "+972 Magazine",
      author: "Yuval Abraham",
      published: "2024-04-03",
      url: "https://www.972mag.com/lavender-ai-israeli-army-gaza/",
    },
  },
];
