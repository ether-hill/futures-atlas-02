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

import { REEL_POSTS, type ReelPost } from "./fields";

export type { ReelPost };

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
  /**
   * The soft colour behind the card on this post's slides. Keyed to the SECTOR,
   * deliberately not to the verdict: a green glow behind a card that is asking
   * you whether it has happened would answer it for you. All three sit in a
   * cool-to-warm range that reads as neither the green nor the red the game
   * uses for its two answers.
   */
  hue: string;
}

/** A deck post: one card, three slides. */
export interface DeckPost {
  kind: "deck";
  /** Working title for the mock's own chrome. Never rendered on a slide. */
  name: string;
  card: Card;
  caption: string;
  hashtags: string[];
}

/** The feed carries two shapes of post. See fields.ts for the other one. */
export type Post = DeckPost | ReelPost;

const DECK_POSTS: DeckPost[] = [
  {
    kind: "deck",
    name: "Driverless trains, 1981",
    caption:
      "Ask when trains started running with nobody in the cab and most people guess the last ten years.\n\nKobe's Port Island Line opened driverless in 1981. Lille's VAL followed in 1983, running under a city of a million people with unstaffed trains and unstaffed stations. Forty-five years of it, and driverless transport is still filed under things that are coming.\n\nCard 01 of the Transport deck. Swipe for what everyone else answered.",
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
      hue: "#3E93D8",
    },
  },
  {
    kind: "deck",
    name: "Radiologists, still there",
    caption:
      "In 2016 Geoffrey Hinton told people to stop training radiologists. Five years, he said, and the job would be finished.\n\nTen years on, radiology demand has gone up, average US pay is around $571,000, and Hinton has conceded the timing. No health service anywhere has replaced a radiologist with AI. The tools arrived. The replacement did not.\n\nCard 09 of the Health deck. Swipe for what everyone else answered.",
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
      hue: "#8B6FD4",
    },
  },
  {
    kind: "deck",
    name: "Devs 19% slower",
    caption:
      "Every survey says AI makes developers faster. METR ran the trial instead.\n\nExperienced open-source developers, real tasks in their own repositories, randomised with and without AI tools. With the tools they were 19% slower. Asked afterwards, the same developers estimated they had been 20% faster. Thirty-nine points between how fast the work felt and how fast it actually was.\n\nCard 04 of the Work deck. Swipe for what everyone else answered.",
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
      hue: "#D89A4E",
    },
  },
  {
    kind: "deck",
    name: "Lawyers fined, 2023",
    caption:
      "The machine makes up a case. The lawyer files it. The judge looks it up.\n\nCourts have been fining lawyers for citing cases an AI invented since 2023, and the sanctions run from a thousand dollars to more than thirty. It is not a rare embarrassment either: filings carrying fabricated citations went up sevenfold in 2025.\n\nCard 01 of the Law deck. Swipe for what everyone else answered.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#law", "#hallucination", "#speculativedesign"],
    card: {
      id: "l1",
      sector: "Law & justice",
      pos: 1,
      deckSize: 10,
      claim: "Lawyers have been fined by courts for citing cases an AI invented.",
      short: "Lawyers fined for AI citations",
      verdict: "already",
      bigLabel: "Already real since",
      big: "2023",
      lede: "Hundreds of filings have carried fabricated AI citations, up sevenfold in 2025.",
      note: "Sanctions run from $1,000 to more than $30,000.",
      source: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.65, n: 40, sample: true },
      hue: "#4E9E86",
    },
  },
  {
    kind: "deck",
    name: "Automated ports, 1993",
    caption:
      "A container terminal with nobody operating the cranes sounds like a rendering of 2040. Rotterdam opened one in 1993.\n\nECT Delta ran driverless vehicles and automated stacking cranes around the clock, and it has been doing it for thirty-three years. The ports were automated before the cars, before the warehouses, before any of the things we now call the automation debate.\n\nCard 05 of the Transport deck. Swipe for what everyone else answered.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#automation", "#logistics", "#speculativedesign"],
    card: {
      id: "t5",
      sector: "Transport",
      pos: 5,
      deckSize: 10,
      claim: "Container terminals have moved cargo with no human operating the cranes.",
      short: "Automated container terminals",
      verdict: "already",
      bigLabel: "Already real since",
      big: "1993",
      lede: "Rotterdam's ECT Delta opened as the world's first automated container terminal.",
      note: "Driverless vehicles and automated stacking cranes, running around the clock.",
      source: {
        label: "ECT Hutchison Ports, 30 years of the first automated terminal",
        url: "https://www.ect.nl/en/news/fast-forward/30-years-ago-ect-opened-very-first-automated-terminal-world",
      },
      checked: "2026-08-09",
      crowd: { pctReal: 0.59, n: 92, sample: true },
      hue: "#3E93D8",
    },
  },
  {
    kind: "deck",
    name: "No AI drug approved",
    caption:
      "Everyone has read that AI is designing drugs. Ask whether one has actually been approved and prescribed, and the answer is still no.\n\nThe furthest any has got is phase 2a: Insilico's lung-fibrosis drug published positive results in Nature Medicine in 2025, which was a first. Late-stage trials and general prescription are both still ahead of it.\n\nThis is the shape the deck keeps finding. The thing that sounds inevitable has not happened, and the thing that sounds like science fiction shipped decades ago.\n\nCard 07 of the Health deck. Swipe for what everyone else answered.",
    hashtags: ["#futuresatlas", "#swipethefuture", "#drugdiscovery", "#health", "#speculativedesign"],
    card: {
      id: "h7",
      sector: "Health & medicine",
      pos: 7,
      deckSize: 10,
      claim: "A drug designed by AI has completed late-stage trials and been approved for general prescription.",
      short: "AI-designed drug approved",
      verdict: "notyet",
      bigLabel: "Furthest any has got",
      big: "Phase 2a",
      lede: "Insilico's lung-fibrosis drug reached positive phase 2a results in Nature Medicine in 2025, a first.",
      note: "Nothing AI-designed has been approved for general prescription.",
      source: {
        label: "Insilico / Nature Medicine (2025)",
        url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html",
      },
      checked: "2026-08-09",
      crowd: { pctReal: 0.31, n: 45, sample: true },
      hue: "#8B6FD4",
    },
  },
];

/** The three slides a DECK post is made of, in order. A field post has one. */
export const SLIDE_KINDS = ["card", "reveal", "stats"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

export const slideCount = (p: Post) => (p.kind === "deck" ? SLIDE_KINDS.length : 1);

/**
 * The grid, newest first — and deliberately interleaved.
 *
 * Grouped by kind, the feed read as two accounts stacked: a block of dark
 * moving pieces, then a block of identical bone cards. A grid is looked at as a
 * whole before any single post is, so the mix is the composition. Reels are the
 * majority, so they take two of every three slots and a card lands in the third.
 */
function interleave(reels: Post[], cards: Post[]): Post[] {
  // Spread the cards evenly through the reels rather than dealing a fixed
  // two-then-one. The fixed pattern only held while the counts happened to sit
  // at 2:1; add a card or two and it ran out of reels early and dropped the
  // remaining cards next to each other at the end, which is the exact clumping
  // the mix exists to avoid. This places each card at its proportional slot, so
  // the composition survives any ratio.
  const out: Post[] = [];
  const total = reels.length + cards.length;
  let r = 0, c = 0;
  for (let i = 0; i < total; i++) {
    // Take a card once fewer than its share have been dealt. The +0.5 centres
    // each card in its slot rather than dealing them all at an edge.
    const share = ((i + 1) * cards.length) / total;
    const cardIsDue = cards.length > 0 && c + 0.5 < share;
    if (cardIsDue && c < cards.length) out.push(cards[c++]!);
    else if (r < reels.length) out.push(reels[r++]!);
    else if (c < cards.length) out.push(cards[c++]!);
  }
  return out;
}

export const POSTS: Post[] = interleave(REEL_POSTS, DECK_POSTS);
