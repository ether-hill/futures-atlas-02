/**
 * Three posts, one deck card each, three slides each:
 *   1. the front of the card, exactly as it is dealt
 *   2. the reveal, exactly as it flips
 *   3. the stats, in the stats page's own idiom
 *
 * WHERE THE WORDS COME FROM. Every field below is copied verbatim from that
 * card's entry in `swipe-the-future/data/sectors.ts`, which is the deck's single
 * source of truth. Nothing is written for the post. `id` is the real card id, so
 * a slide and its card can be diffed directly.
 *
 * THE THREE CARDS are the deck's strongest: each one is one of the two good
 * surprises the house style asks for (sounds like science fiction and shipped
 * decades ago, or sounds inevitable and flatly has not happened), and between
 * them they cover three sectors and both answers.
 *
 * THE TALLY IS NOT REAL. The v2 deck has no live answers yet — the counter at
 * /api/swipe still holds only v1's card ids (cur-, prog-, doc-…) — so `crowd`
 * carries the SAMPLE numbers the stats page itself falls back to when the tally
 * is empty: `demoCounters()` in `swipe-the-future/app/stats/demo-data.ts`, run
 * for these three ids. Every stats slide carries the stats page's own brass
 * "sample data" bar because of it. When the deck has traffic, replace the
 * numbers and set `sample: false`.
 */

export type Verdict = "notyet" | "already";

export interface Card {
  /** The real card id in sectors.ts. */
  id: string;
  sector: string;
  /** Where the card sits in its ten-card deck, for the dots and the count. */
  pos: number;
  deckSize: number;
  claim: string;
  short: string;
  verdict: Verdict;
  bigLabel?: string;
  big?: string;
  lede: string;
  note: string;
  source: { label: string; url?: string };
  checked: string;
  /** What everyone else answered. See the header: sample, not live. */
  crowd: { pctReal: number; n: number; sample: boolean };
}

export interface Post {
  /** Working title for the mock's own chrome. Never rendered on a slide. */
  name: string;
  card: Card;
  caption: string;
  hashtags: string[];
}

export const POSTS: Post[] = [
  {
    name: "Driverless trains, 1981",
    caption:
      "Card 01 of the Transport deck. It sounds like a thing that is coming. It has been carrying passengers since 1981.\n\nSwipe the Future deals ten cards and asks one question: has this already happened, or has it not happened yet? Five of every ten are each.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#automation", "#transport", "#speculativedesign"],
    card: {
      id: "t1",
      sector: "Transport",
      pos: 1,
      deckSize: 10,
      claim: "Driverless passenger trains have carried the public with no staff on board.",
      short: "Driverless passenger trains",
      verdict: "already",
      bigLabel: "Already real since",
      big: "1981",
      lede: "Kobe's Port Island Line opened driverless, and Lille's VAL followed in 1983.",
      note: "Lille was the first automated network under a major city. Trains and stations are unstaffed.",
      source: { label: "Railway Technology, Lille VAL", url: "https://www.railway-technology.com/projects/lille_val/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.58, n: 24, sample: true },
    },
  },
  {
    name: "Radiologists, still there",
    caption:
      "Card 09 of the Health deck. Nine years after the world was told to stop training radiologists, no health service has replaced one.\n\nEvery not-yet card carries the nearest approach, so a no still teaches you where the boundary actually sits.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#aihype", "#radiology", "#foresight"],
    card: {
      id: "h9",
      sector: "Health & medicine",
      pos: 9,
      deckSize: 10,
      claim: "A national health service has replaced its radiologists with AI.",
      short: "Radiologists replaced by AI",
      verdict: "notyet",
      lede: "Hinton told people to stop training radiologists in 2016.",
      note: "Demand rose over the same decade, pay reached about $571,000, and he has conceded the timing.",
      source: { label: "New Republic / NYT", url: "https://newrepublic.com/article/187203/ai-radiology-geoffrey-hinton-nobel-prediction" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.17, n: 53, sample: true },
    },
  },
  {
    name: "Devs 19% slower",
    caption:
      "Card 04 of the Work deck. A randomised trial, not a survey: experienced developers were measurably slower with AI tools, and were sure they had been faster.\n\nThe question the deck asks is never whether a thing is good. Only whether it has happened.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#futureofwork", "#developerproductivity", "#evidence"],
    card: {
      id: "w4",
      sector: "Work & employment",
      pos: 4,
      deckSize: 10,
      claim: "A randomised trial has found experienced software developers work slower with AI tools than without.",
      short: "Devs slower with AI, trialled",
      verdict: "already",
      bigLabel: "Already real since",
      big: "2025",
      lede: "METR ran a randomised trial: experienced developers were 19% slower with AI tools.",
      note: "They believed they had been 20% faster.",
      source: { label: "METR, July 2025", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.56, n: 25, sample: true },
    },
  },
];

/** The three slides every post is made of, in order. */
export const SLIDE_KINDS = ["card", "reveal", "stats"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];
