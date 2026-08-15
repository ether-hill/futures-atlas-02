/**
 * Sovereign by Contract — the actors.
 *
 * Same two rules as every ecology module (see `ecology-types.ts`): weight is
 * how often a name appears in THIS report's own findings and timeline, not a
 * market position; leadership is a dated snapshot with its own source.
 *
 * One rule specific to this report. Several of these organisations are states,
 * courts and tribunals rather than companies, and they are here because the
 * argument is about the relationship between the two. A private city and the
 * country it sits inside belong on the same map, or the map is just a pitch
 * deck.
 */

import { FINDINGS, TIMELINE } from "./startup-cities";
import { countMentions, type Leader, type Org } from "./ecology-types";

export * from "./ecology-types";

export const ORGS: Org[] = [
  {
    id: "prospera",
    name: "Próspera",
    role: "lab",
    aliases: ["Próspera", "Prospera"],
    note: "The furthest-advanced project: a legal framework, a regulator, residency sold as a product, and an $10.6bn claim against its host country.",
  },
  {
    id: "honduras",
    name: "Honduras",
    role: "state",
    aliases: ["Honduras", "Honduran"],
    note: "Created the zones in 2013, repealed them unanimously in 2022, voided the decrees in 2024, and left the arbitration forum in between. None of it has closed the case.",
  },
  {
    id: "praxis",
    name: "Praxis",
    role: "lab",
    aliases: ["Praxis"],
    note: "Best funded of the network-state projects at $525m announced, and the one whose first named site is a US Space Force base.",
  },
  {
    id: "california-forever",
    name: "California Forever",
    role: "lab",
    aliases: ["California Forever"],
    note: "The same idea with the sovereignty removed: 50,000 acres, a proposed city for 400,000, and a county planning process instead of a treaty.",
  },
  {
    id: "icsid",
    name: "ICSID",
    role: "state",
    aliases: ["ICSID"],
    note: "The World Bank tribunal where the claim sits. Leaving it does not extinguish a registered case, which is the whole leverage of the model.",
  },
  {
    id: "state-dept",
    name: "US State Department",
    role: "state",
    aliases: ["Department of State", "State Department"],
    note: "Reports to Congress on American investment in the zone — recognition of a kind, arriving through a channel the movement's literature did not predict.",
  },
  {
    id: "pronomos",
    name: "Pronomos Capital",
    role: "capital",
    aliases: ["Pronomos"],
    note: "The fund that exists to back charter cities, and the thread connecting Próspera to Praxis on the same cap table.",
  },
  {
    id: "argentina",
    name: "Argentina",
    role: "state",
    aliases: ["Argentina", "Argentine"],
    note: "The first national government in this report to adopt the thesis at scale — thirty-year stability locks, and a draft bill for corporations with no human owners.",
  },
  {
    id: "unctad",
    name: "UNCTAD",
    role: "measurer",
    aliases: ["UNCTAD"],
    note: "Maintains the public record of investor-state disputes, which is how the arbitration can be reported without relying on either party's summary.",
  },
];

/** This report's own tally. See countMentions — a fact about the page. */
export const mentionsOf = (org: Org) => countMentions(org, FINDINGS, TIMELINE);

export const LEADERS: Leader[] = [
  {
    id: "srinivasan",
    name: "Balaji Srinivasan",
    role: "Author, The Network State",
    org: "praxis",
    note: "Wrote the 2022 book that supplies the movement's definition and its target — crowdfunded territory and, eventually, diplomatic recognition.",
    asOf: "2026-08-15",
    source: {
      name: "The Network State",
      author: "Balaji Srinivasan",
      published: "2022",
      url: "https://thenetworkstate.com/",
    },
  },
  {
    id: "brown",
    name: "Dryden Brown",
    role: "Chief executive and co-founder, Praxis",
    org: "praxis",
    note: "Announced $525m in October 2024 and, in April 2025, named Vandenberg Space Force Base as the site of the first city.",
    asOf: "2026-08-15",
    source: {
      name: "The Block",
      author: "The Block",
      published: "2024-10",
      url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    },
  },
  {
    id: "sramek",
    name: "Jan Sramek",
    role: "Founder and chief executive, California Forever",
    org: "california-forever",
    note: "Assembled roughly 50,000 acres through a shell company from 2017, pulled the ballot measure in July 2024, and said the project would return in 2026.",
    asOf: "2026-08-15",
    source: {
      name: "NBC Bay Area",
      author: "NBC Bay Area",
      published: "2024-07-22",
      url: "https://www.nbcbayarea.com/news/local/north-bay/california-forever-solano-county-ballot-measure-pulled/3599985/",
    },
  },
  {
    id: "thiel",
    name: "Peter Thiel",
    role: "Investor; co-founder, Palantir and PayPal",
    org: "pronomos",
    note: "Backer of Praxis through Pronomos Capital, and reported in 2026 to be living in Buenos Aires and meeting Argentina's president. No figure for capital committed to Argentina has been published.",
    asOf: "2026-08-15",
    source: {
      name: "New Lines Magazine",
      author: "New Lines Magazine",
      published: "2026",
      url: "https://newlinesmag.com/argument/what-is-peter-thiel-up-to-in-argentina/",
    },
  },
  {
    id: "milei",
    name: "Javier Milei",
    role: "President of Argentina",
    org: "argentina",
    note: "Sent Congress a draft bill recognising corporations with no human owners, held in tokens on a blockchain, alongside a thirty-year investment stability regime.",
    asOf: "2026-08-15",
    source: {
      name: "Buenos Aires Herald",
      author: "Buenos Aires Herald",
      published: "2026",
      url: "https://buenosairesherald.com/business/tech/mileis-proposal-to-allow-non-human-corporations-run-by-ai-causes-concern-in-argentina",
    },
  },
];
