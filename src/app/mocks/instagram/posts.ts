/**
 * Social posts for Swipe the Future, as data.
 *
 * WHERE THE WORDS COME FROM. Every claim, reveal, figure and source on these
 * slides is copied verbatim from `swipe-the-future/data/sectors.ts`, which is
 * the deck's single source of truth. Nothing here is written for the post: if a
 * line needs to change, change the card and copy it across. The `cardId` on each
 * claim/reveal pair says which card it came from, so the two can be diffed.
 *
 * THE ONE THING THAT IS NOT REAL is the tally on the stats slide. The v2 deck
 * has no live answers yet (the tally at /api/swipe still holds v1's card ids),
 * so the rows carry the SAMPLE numbers the stats page itself falls back to —
 * `demoCounters()` in `swipe-the-future/app/stats/demo-data.ts`, run for these
 * card ids. They are marked `sample: true` and every stats slide says so on its
 * face. When the deck has traffic, swap the numbers and drop the marker; do not
 * publish a slide whose tally claims to be a crowd that has not answered.
 */

export type Verdict = "notyet" | "already";

/** Said in the same words as the game's buttons. */
export const VLABEL: Record<Verdict, string> = {
  notyet: "Not yet",
  already: "Already real",
};

export type Slide =
  | { kind: "cover"; kicker: string; title: string; sub: string }
  | { kind: "claim"; cardId: string; sector: string; step: string; claim: string }
  | {
      kind: "reveal";
      cardId: string;
      verdict: Verdict;
      claim: string;
      bigLabel?: string;
      big?: string;
      lede: string;
      note: string;
      source: string;
    }
  | {
      kind: "stats";
      title: string;
      sub: string;
      sample: boolean;
      rows: { short: string; verdict: Verdict; pReal: number; n: number }[];
      footnote: string;
    }
  | { kind: "cta"; title: string; sub: string; url: string };

export interface Post {
  id: string;
  /** Working title, for the mock's own chrome. Never rendered on a slide. */
  name: string;
  caption: string;
  hashtags: string[];
  slides: Slide[];
}

const CTA: Slide = {
  kind: "cta",
  title: "Ten cards. Five have happened.",
  sub: "Play the deck and see where your instincts sit against everyone else's.",
  url: "futures-atlas-02.vercel.app/swipe-the-future",
};

export const POSTS: Post[] = [
  {
    id: "older-than-you-think",
    name: "Older than you think",
    caption:
      "Three futures that sound like they are coming. All three have been running since before most of the people arguing about them were born.\n\nSwipe the Future is a ten-card deck with one question: has this already happened, or has it not happened yet? Half of every deck is each.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#automation", "#designresearch", "#speculativedesign"],
    slides: [
      {
        kind: "cover",
        kicker: "Swipe the Future · 01",
        title: "Already real since 1981.",
        sub: "Three futures that arrived before the debate about them did.",
      },
      {
        kind: "claim",
        cardId: "t1",
        sector: "Transport",
        step: "01",
        claim: "Driverless passenger trains have carried the public with no staff on board.",
      },
      {
        kind: "reveal",
        cardId: "t1",
        verdict: "already",
        claim: "Driverless passenger trains have carried the public with no staff on board.",
        bigLabel: "Already real since",
        big: "1981",
        lede: "Kobe's Port Island Line opened driverless, and Lille's VAL followed in 1983.",
        note: "Lille was the first automated network under a major city. Trains and stations are unstaffed.",
        source: "Railway Technology, Lille VAL",
      },
      {
        kind: "claim",
        cardId: "t5",
        sector: "Transport",
        step: "02",
        claim: "Container terminals have moved cargo with no human operating the cranes.",
      },
      {
        kind: "reveal",
        cardId: "t5",
        verdict: "already",
        claim: "Container terminals have moved cargo with no human operating the cranes.",
        bigLabel: "Already real since",
        big: "1993",
        lede: "Rotterdam's ECT Delta opened as the world's first automated container terminal.",
        note: "Driverless vehicles and automated stacking cranes, running around the clock.",
        source: "ECT Hutchison Ports, 30 years of the first automated terminal",
      },
      {
        kind: "claim",
        cardId: "h1",
        sector: "Health & medicine",
        step: "03",
        claim: "Software has been reading cervical smear slides in real clinics.",
      },
      {
        kind: "reveal",
        cardId: "h1",
        verdict: "already",
        claim: "Software has been reading cervical smear slides in real clinics.",
        bigLabel: "Already real since",
        big: "1995",
        lede: "PAPNET won FDA premarket approval for rescreening Pap smears.",
        note: "Generally counted as the first AI-enabled medical device anywhere.",
        source: "FDA premarket approval, PAPNET (1995)",
      },
      {
        kind: "stats",
        title: "What everyone else answered.",
        sub: "Share of players who said ALREADY REAL. All three had happened.",
        sample: true,
        rows: [
          { short: "Driverless passenger trains", verdict: "already", pReal: 0.58, n: 24 },
          { short: "Automated container terminals", verdict: "already", pReal: 0.59, n: 92 },
          { short: "Software reading smear slides", verdict: "already", pReal: 0.77, n: 66 },
        ],
        footnote:
          "A gap to the left is a blind spot: something that shipped decades ago, doubted anyway.",
      },
      CTA,
    ],
  },

  {
    id: "sounds-inevitable",
    name: "Sounds inevitable. Hasn't happened.",
    caption:
      "The other half of the deck. Three futures that feel settled, argued over, planned around, and have flatly not happened.\n\nEvery card carries the nearest approach, so a no still teaches you where the boundary actually sits.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#aihype", "#foresight", "#speculativedesign"],
    slides: [
      {
        kind: "cover",
        kicker: "Swipe the Future · 02",
        title: "Sounds inevitable. Hasn't happened.",
        sub: "Three futures you have probably already argued about.",
      },
      {
        kind: "claim",
        cardId: "h9",
        sector: "Health & medicine",
        step: "01",
        claim: "A national health service has replaced its radiologists with AI.",
      },
      {
        kind: "reveal",
        cardId: "h9",
        verdict: "notyet",
        claim: "A national health service has replaced its radiologists with AI.",
        lede: "Hinton told people to stop training radiologists in 2016.",
        note: "Demand rose over the same decade, pay reached about $571,000, and he has conceded the timing.",
        source: "New Republic / NYT",
      },
      {
        kind: "claim",
        cardId: "t7",
        sector: "Transport",
        step: "02",
        claim: "Cargo ships have crossed an ocean with no crew on board.",
      },
      {
        kind: "reveal",
        cardId: "t7",
        verdict: "notyet",
        claim: "Cargo ships have crossed an ocean with no crew on board.",
        bigLabel: "Closest crossing",
        big: "2022",
        lede: "The uncrewed Mayflower, a small research vessel, crossed the Atlantic.",
        note: "It was towed the last 25 miles. No cargo ship has crossed without a crew.",
        source: "Maritime Executive, Mayflower crossing",
      },
      {
        kind: "claim",
        cardId: "w6",
        sector: "Work & employment",
        step: "03",
        claim: "A national government has introduced a tax on companies that replace workers with AI.",
      },
      {
        kind: "reveal",
        cardId: "w6",
        verdict: "notyet",
        claim: "A national government has introduced a tax on companies that replace workers with AI.",
        lede: "South Korea trimmed a tax break for automation investment in 2017, widely miscalled a robot tax.",
        note: "No direct tax exists anywhere, and the European Parliament voted one down.",
        source: "Stephensons, South Korea's robot tax",
      },
      {
        kind: "stats",
        title: "What everyone else answered.",
        sub: "Share who said ALREADY REAL. None of the three has happened.",
        sample: true,
        rows: [
          { short: "Radiologists replaced by AI", verdict: "notyet", pReal: 0.17, n: 53 },
          { short: "Crewless cargo ship crossing", verdict: "notyet", pReal: 0.15, n: 55 },
          { short: "Tax on replacing workers", verdict: "notyet", pReal: 0.54, n: 57 },
        ],
        footnote:
          "A gap to the right is a hype trap: the room bought something that has not happened.",
      },
      CTA,
    ],
  },

  {
    id: "what-ai-did-to-work",
    name: "What AI has done to work",
    caption:
      "Three cards from the Work deck. Two of them happened years ago. One is the thing everybody assumes is already in the contracts, and it is not.\n\nThe question is never whether it is good. It is whether it has happened.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#futureofwork", "#algorithmicmanagement", "#labour"],
    slides: [
      {
        kind: "cover",
        kicker: "Swipe the Future · 03",
        title: "What AI has done to work.",
        sub: "Two of these three are already in the record. One isn't.",
      },
      {
        kind: "claim",
        cardId: "w4",
        sector: "Work & employment",
        step: "01",
        claim: "A randomised trial has found experienced software developers work slower with AI tools than without.",
      },
      {
        kind: "reveal",
        cardId: "w4",
        verdict: "already",
        claim: "A randomised trial has found experienced software developers work slower with AI tools than without.",
        bigLabel: "Already real since",
        big: "2025",
        lede: "METR ran a randomised trial: experienced developers were 19% slower with AI tools.",
        note: "They believed they had been 20% faster.",
        source: "METR, July 2025",
      },
      {
        kind: "claim",
        cardId: "w2",
        sector: "Work & employment",
        step: "02",
        claim: "Workers have been dismissed by an automated system, with no manager involved in the decision.",
      },
      {
        kind: "reveal",
        cardId: "w2",
        verdict: "already",
        claim: "Workers have been dismissed by an automated system, with no manager involved in the decision.",
        bigLabel: "Already real since",
        big: "2019",
        lede: "Documents showed Amazon's system generating warnings and terminations from productivity metrics with no supervisor input.",
        note: "Roughly 300 people at one site. Amazon says managers can override.",
        source: "MIT Technology Review",
      },
      {
        kind: "claim",
        cardId: "w10",
        sector: "Work & employment",
        step: "03",
        claim: "A trade union has won an agreement banning AI from a job category outright.",
      },
      {
        kind: "reveal",
        cardId: "w10",
        verdict: "notyet",
        claim: "A trade union has won an agreement banning AI from a job category outright.",
        lede: "The agreements that exist require bargaining before deployment and restrict named uses.",
        note: "They constrain, and they protect against AI-driven layoffs. They do not ban.",
        source: "Partnership on AI, three union agreements",
      },
      {
        kind: "stats",
        title: "What everyone else answered.",
        sub: "Share who said ALREADY REAL. The first two happened; the third has not.",
        sample: true,
        rows: [
          { short: "Devs slower with AI, trialled", verdict: "already", pReal: 0.56, n: 25 },
          { short: "Fired by an algorithm", verdict: "already", pReal: 0.79, n: 62 },
          { short: "Union ban on AI in a job", verdict: "notyet", pReal: 0.53, n: 90 },
        ],
        footnote:
          "The full stats page splits every player into hype traps and blind spots, sector by sector.",
      },
      CTA,
    ],
  },
];
