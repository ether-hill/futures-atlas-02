/**
 * Where Compute Gets Built — the actors.
 *
 * Same two rules as every ecology module (see `ecology-types.ts`): weight is
 * how often a name appears in THIS report's own findings and timeline, never a
 * market position; leadership is a dated snapshot with its own source.
 *
 * Note what the nebula shows here, because it is the report in one picture.
 * The heaviest names are not the companies building the compute — they are the
 * bodies COUNTING it. That is not a quirk of the tally. It is what happens
 * when the only public numbers about an industry come from outside it.
 */

import { FINDINGS, TIMELINE } from "./compute-cities";
import { countMentions, type Leader, type Org } from "./ecology-types";

export * from "./ecology-types";

export const ORGS: Org[] = [
  {
    id: "lbnl",
    name: "Berkeley Lab",
    role: "measurer",
    aliases: ["Berkeley Lab", "Lawrence Berkeley"],
    note: "Runs the annual census of the US interconnection queue — the one place in this report where the constraint is counted rather than forecast.",
  },
  {
    id: "gartner",
    name: "Gartner",
    role: "measurer",
    aliases: ["Gartner"],
    note: "Source of the 40%-by-2027 forecast that reframed the bottleneck from chips to electricity, and that is quoted in the present tense more often than not.",
  },
  {
    id: "oecd",
    name: "OECD",
    role: "measurer",
    aliases: ["OECD"],
    note: "Compiles the venture figures every concentration claim in this area rests on — including the ones that contradict the claims.",
  },
  {
    id: "congress",
    name: "US Congress",
    role: "state",
    aliases: ["Congress", "Congressional Research Service"],
    note: "Approved the Chip Security Act in March 2026, moving export enforcement from the border into the silicon.",
  },
  {
    id: "praxis",
    name: "Praxis",
    role: "lab",
    aliases: ["Praxis"],
    note: "Best funded of the intentional cities at $525m announced, with a named site on a federal military base and nothing built.",
  },
  {
    id: "telosa",
    name: "Telosa",
    role: "lab",
    aliases: ["Telosa"],
    note: "Five million residents by 2050 on the plan, five candidate states, and no land.",
  },
  {
    id: "itana",
    name: "Itana",
    role: "lab",
    aliases: ["Itana"],
    note: "The furthest along of the new zones on its own terms: 50 companies registered, a district inside Alaro City, and power and fibre named as the test.",
  },
  {
    id: "chatham",
    name: "Chatham House",
    role: "measurer",
    aliases: ["Chatham House"],
    note: "The policy record on export controls, and the argument against treating compute access as leverage.",
  },
  {
    id: "bisi",
    name: "BISI",
    role: "measurer",
    aliases: ["BISI", "Bloomsbury Intelligence"],
    note: "Tracks the diversion trade — the evidence that controls bind hard enough to be worth evading at nine figures.",
  },
];

/** This report's own tally. See countMentions — a fact about the page. */
export const mentionsOf = (org: Org) => countMentions(org, FINDINGS, TIMELINE);

export const LEADERS: Leader[] = [
  {
    id: "lore",
    name: "Marc Lore",
    role: "Founder, Telosa",
    org: "telosa",
    note: "Has been choosing between five states since the project was announced, and has declined to give a timeline for choosing. The stated first phase is 50,000 residents by 2030.",
    asOf: "2026-08-16",
    source: {
      name: "Smart Cities Dive",
      author: "Smart Cities Dive",
      published: "2025",
      url: "https://www.smartcitiesdive.com/news/billionaire-smart-cities-update-elon-musk-telosa-utopia/699348/",
    },
  },
  {
    id: "brown-cc",
    name: "Dryden Brown",
    role: "Chief executive and co-founder, Praxis",
    org: "praxis",
    note: "Announced $525m in October 2024 and, in April 2025, named Vandenberg Space Force Base as the site of the first city.",
    asOf: "2026-08-16",
    source: {
      name: "The Block",
      author: "The Block",
      published: "2024-10",
      url: "https://www.theblock.co/post/321268/network-state-project-praxis-secures-525-million-to-build-crypto-friendly-city",
    },
  },
  {
    id: "edu",
    name: "Luqman Edu",
    role: "Chief executive, Itana",
    org: "itana",
    note: "Runs Nigeria's first digital free zone, a district inside Alaro City in the Lagos region, which raised $2m in July 2025 and reported 50 registered companies at the end of that year.",
    asOf: "2026-08-16",
    source: {
      name: "Charter Cities Institute",
      author: "Charter Cities Institute",
      published: "2025",
      url: "https://chartercitiesinstitute.org/podcast/episode-63-luqman-edu-on-itana-nigerias-first-digital-free-zone/",
    },
  },
];
