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

import {
  REEL_POSTS, SHOTS_POSTS, ODDS_POSTS, TERM_POSTS, ODDS_CHOOSER, TEGMARK_POSTS,
  HOME_REEL, UNDERGROUND_REEL, STACK_REEL, BREAK_REEL,
  type ReelPost, type ShotsPost, type OddsPost, type TermPost, type TegmarkPost,
  FIELD_DYNAMICS_REEL, TURBULENCE_POST, SHIFTCOOL_REEL, SOLOCOOL_REEL,
} from "./fields";

export type { ReelPost, ShotsPost, OddsPost, TermPost, TegmarkPost };

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
export type Post = DeckPost | ReelPost | ShotsPost | OddsPost | TermPost | TegmarkPost;

const DECK_POSTS: DeckPost[] = [
  {
    kind: "deck",
    name: "Robot tax · hype trap",
    card: {
      id: "w6", sector: "Work & employment", pos: 6, deckSize: 10,
      claim: "A national government has introduced a tax on companies that replace workers with AI.",
      short: "Tax on replacing workers", verdict: "notyet",
      lede: "South Korea trimmed a tax break for automation investment in 2017, widely miscalled a robot tax.",
      note: "No direct tax exists anywhere, and the European Parliament voted one down.",
      source: { label: "Stephensons, South Korea's robot tax", url: "https://www.stephensons.co.uk/site/news_and_events/uptodatenews/south-korea-introduces-worlds-first-robot-tax" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.54, n: 57, sample: true },
      hue: "#D89A4E",
    },
    caption:
      "Half the room is sure a robot tax exists somewhere. It does not exist anywhere.\n\nSouth Korea trimmed a tax break for automation investment in 2017 and the press called it the world's first robot tax. It was a smaller deduction, not a tax. The European Parliament voted an actual one down.\n\nThis is a hype trap: a policy discussed so often it starts to feel enacted. The discussion is real. The law is not.",
    hashtags: ["#futureofwork", "#policy", "#automation", "#futuresatlas", "#swipethefuture"],
  },
  {
    kind: "deck",
    name: "AI lawyer · hype trap",
    card: {
      id: "l6", sector: "Law & justice", pos: 6, deckSize: 10,
      claim: "An AI system has been granted a licence to practise law.",
      short: "AI licensed to practise law", verdict: "notyet",
      lede: "No jurisdiction has licensed an AI to practise law.",
      note: "The live question runs the other way: whether a chatbot giving legal answers is already the unauthorised practice of law.",
      source: { label: "Thomson Reuters Institute, AI and unauthorized practice of law", url: "https://www.thomsonreuters.com/en-us/posts/government/ai-impacts-unauthorized-practice-of-law/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.56, n: 86, sample: true },
      hue: "#8B6FD4",
    },
    caption:
      "More than half the room thinks some jurisdiction has licensed an AI to practise law. None has.\n\nAnd the real argument is pointing the other way entirely: not whether to admit an AI to the bar, but whether a chatbot answering legal questions is already the unauthorised practice of law. That is a prosecution question, not an admission one.\n\nA good hype trap does not just get the answer wrong. It gets the direction wrong.",
    hashtags: ["#law", "#aigovernance", "#legaltech", "#futuresatlas", "#swipethefuture"],
  },
  {
    kind: "deck",
    name: "Robot deliveries · blind spot",
    card: {
      id: "t4", sector: "Transport", pos: 4, deckSize: 10,
      claim: "More than eight million deliveries have been completed by robots driving themselves along pavements.",
      short: "Eight million robot deliveries", verdict: "already",
      bigLabel: "Already real since", big: "2025",
      lede: "Starship passed eight million autonomous deliveries by April.",
      note: "More than 2,700 robots across 270+ locations.",
      source: { label: "The Robot Report", url: "https://www.therobotreport.com/starship-technologies-surpasses-8m-autonomous-deliveries/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.49, n: 45, sample: true },
      hue: "#3E93D8",
    },
    caption:
      "Eight million. Not a pilot, not a trial. Eight million deliveries already completed by robots driving themselves along pavements.\n\nStarship passed the mark in April 2025, running more than 2,700 robots across over 270 locations.\n\nBarely half the room believes it. That is a blind spot: not a thing that might happen, a thing that has been happening at scale, on ordinary streets, while everyone waited for it to start.",
    hashtags: ["#robotics", "#lastmile", "#automation", "#futuresatlas", "#swipethefuture"],
  },
  {
    kind: "deck",
    name: "Doctors got worse",
    card: {
      id: "h4",
      sector: "Health & medicine",
      pos: 4,
      deckSize: 10,
      claim: "A multi-centre study has found doctors got worse at their own job after months of using AI.",
      short: "Doctors deskilled by AI",
      verdict: "already",
      bigLabel: "Already real since",
      big: "2025",
      lede: "Endoscopists' unassisted adenoma detection fell from 28.4% to 22.4% after routine AI exposure.",
      note: "Published in Lancet Gastroenterology & Hepatology.",
      source: {
        label: "Lancet Gastro & Hep, endoscopist deskilling (2025)",
        url: "https://www.thelancet.com/journals/langas/article/PIIS2468-1253(25)00289-4/abstract",
      },
      checked: "2026-08-09",
      crowd: { pctReal: 0.44, n: 41, sample: true },
      hue: "#8B6FD4",
    },
    caption:
      "Give doctors an AI assistant for a few months, then take it away, and they are worse at the job than before they had it.\n\nA multi-centre study in Lancet Gastroenterology & Hepatology followed endoscopists through routine AI exposure. Their unassisted detection rate fell from 28.4% to 22.4%. Same doctors, same procedure, worse without the tool than they used to be.\n\nThis is not a story about AI being bad at the task. It was good at the task. It is a story about what happens to a skill you stop practising.",
    hashtags: ["#aiinmedicine", "#deskilling", "#evidence", "#futuresatlas", "#swipethefuture"],
  },
  {
    kind: "deck",
    name: "A billion and a half",
    card: {
      id: "l2",
      sector: "Law & justice",
      pos: 2,
      deckSize: 10,
      claim: "An AI company has agreed to pay authors more than a billion dollars for training on their books without permission.",
      short: "Billion-dollar authors settlement",
      verdict: "already",
      bigLabel: "Already real since",
      big: "2025",
      lede: "Anthropic agreed $1.5 billion, the largest copyright class settlement on record.",
      note: "Approved in 2026. About $3,000 a book across roughly 482,000 works.",
      source: {
        label: "Courthouse News Service",
        url: "https://www.courthousenews.com/anthropic-to-pay-1-5-billion-copyright-settlement-to-authors-publishers/",
      },
      checked: "2026-08-09",
      crowd: { pctReal: 0.61, n: 58, sample: true },
      hue: "#3E93D8",
    },
    caption:
      "One and a half billion dollars. The largest copyright class settlement on record, in any medium, ever.\n\nAnthropic agreed it with authors over training on their books without permission. Roughly 482,000 works, about $3,000 a book. Agreed 2025, approved 2026.\n\nThe number is the argument. Whatever you think about whether training is fair use, a company chose to pay that rather than find out in court.",
    hashtags: ["#copyright", "#aiandart", "#publishing", "#futuresatlas", "#swipethefuture"],
  },
  {
    kind: "deck",
    name: "No AI has judged you",
    card: {
      id: "l7",
      sector: "Law & justice",
      pos: 7,
      deckSize: 10,
      claim: "An AI has sat as a judge in a binding court proceeding.",
      short: "AI sat as a judge",
      verdict: "notyet",
      lede: "China runs whole court systems where AI assists the judge and speeds the paperwork.",
      note: "The decision stays with the judge.",
      source: {
        label: "ABA Journal, China's internet courts",
        url: "https://www.abajournal.com/magazine/article/china-all-virtual-specialty-internet-courts",
      },
      checked: "2026-08-09",
      crowd: { pctReal: 0.38, n: 47, sample: true },
      hue: "#D89A4E",
    },
    caption:
      "Everyone assumes this one has happened somewhere. It has not.\n\nChina has run internet courts since 2017 — filing to judgment online, with AI assistants added from 2019. They summarise, they route, they draft. They speed up the paperwork enormously.\n\nThe decision stays with the judge. Every time. No jurisdiction anywhere has let a machine hand down a binding ruling.\n\nThe gap between assisting a court and being one is the whole question, and so far nobody has crossed it.",
    hashtags: ["#aigovernance", "#law", "#justice", "#futuresatlas", "#swipethefuture"],
  },
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
    card: {
      id: "l1", sector: "Law & justice", pos: 1, deckSize: 10,
      claim: "Lawyers have been fined by courts for citing cases an AI invented.",
      short: "Lawyers fined for AI citations", verdict: "already",
      bigLabel: "Already real since", big: "2023",
      lede: "Hundreds of filings have carried fabricated AI citations, up sevenfold in 2025.",
      note: "Sanctions run from $1,000 to more than $30,000.",
      source: { label: "Bloomberg Law · court records", url: "https://news.bloomberglaw.com/" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.65, n: 40, sample: true },
      hue: "#4E9E86",
    },
    caption:
      "The machine makes up a case. The lawyer files it. The judge looks it up.\n\nCourts have been fining lawyers for citing cases an AI invented since 2023, and the sanctions run from a thousand dollars to more than thirty. It is not a rare embarrassment either: filings carrying fabricated citations went up sevenfold in 2025.",
    hashtags: ["#law", "#hallucination", "#futuresatlas", "#swipethefuture", "#speculativedesign"],
  },
  {
    kind: "deck",
    name: "Automated ports, 1993",
    card: {
      id: "t5", sector: "Transport", pos: 5, deckSize: 10,
      claim: "Container terminals have moved cargo with no human operating the cranes.",
      short: "Automated container terminals", verdict: "already",
      bigLabel: "Already real since", big: "1993",
      lede: "Rotterdam's ECT Delta opened as the world's first automated container terminal.",
      note: "Driverless vehicles and automated stacking cranes, running around the clock.",
      source: { label: "ECT Hutchison Ports, 30 years of the first automated terminal", url: "https://www.ect.nl/en/news/fast-forward/30-years-ago-ect-opened-very-first-automated-terminal-world" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.59, n: 92, sample: true },
      hue: "#3E93D8",
    },
    caption:
      "A container terminal with nobody operating the cranes sounds like a rendering of 2040. Rotterdam opened one in 1993.\n\nECT Delta ran driverless vehicles and automated stacking cranes around the clock, and it has been doing it for thirty-three years. The ports were automated before the cars, before the warehouses, before any of the things we now call the automation debate.",
    hashtags: ["#automation", "#logistics", "#futuresatlas", "#swipethefuture", "#speculativedesign"],
  },
  {
    kind: "deck",
    name: "No AI drug approved",
    card: {
      id: "h7", sector: "Health & medicine", pos: 7, deckSize: 10,
      claim: "A drug designed by AI has completed late-stage trials and been approved for general prescription.",
      short: "AI-designed drug approved", verdict: "notyet",
      bigLabel: "Furthest any has got", big: "Phase 2a",
      lede: "Insilico's lung-fibrosis drug reached positive phase 2a results in Nature Medicine in 2025, a first.",
      note: "Nothing AI-designed has been approved for general prescription.",
      source: { label: "Insilico / Nature Medicine (2025)", url: "https://www.prnewswire.com/news-releases/insilico-medicine-announces-nature-medicine-publication-of-phase-iia-results-evaluating-rentosertib-the-novel-tnik-inhibitor-for-idiopathic-pulmonary-fibrosis-ipf-discovered-and-designed-with-a-pioneering-ai-approach-302472070.html" },
      checked: "2026-08-09",
      crowd: { pctReal: 0.31, n: 45, sample: true },
      hue: "#8B6FD4",
    },
    caption:
      "Everyone has read that AI is designing drugs. Ask whether one has actually been approved and prescribed, and the answer is still no.\n\nThe furthest any has got is phase 2a: Insilico's lung-fibrosis drug published positive results in Nature Medicine in 2025, which was a first. Late-stage trials and general prescription are both still ahead of it.",
    hashtags: ["#drugdiscovery", "#health", "#futuresatlas", "#swipethefuture", "#speculativedesign"],
  },
];

/** The three slides a DECK post is made of, in order. A field post has one. */
export const SLIDE_KINDS = ["card", "reveal", "stats"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

/** One stable id per post, whatever shape it is. Used by the editor. */
export const postId = (p: Post) => (p.kind === "deck" ? p.card.id : p.id);

export const slideCount = (p: Post) =>
  p.kind === "deck" ? SLIDE_KINDS.length
    : p.kind === "shots" ? p.shots.length
    : p.kind === "odds" ? 2   // the player, then the play-through
    : p.kind === "tegmark" ? 2   // the card's face, then the card's copy
    : 1;

/**
 * The grid, newest first — and deliberately interleaved.
 *
 * Grouped by kind, the feed read as two accounts stacked: a block of dark
 * moving pieces, then a block of identical bone cards. A fixed one-in-three is
 * no better on a three-wide grid, because every card then lands in the same
 * COLUMN and the mix reads as a stripe down the page.
 *
 * Nor can a fixed run length fix it here. There are roughly two reels per card,
 * so the gap between cards averages a bit over one row, and any constant gap of
 * one row repeats the column. So the cards are placed by COLUMN instead: card i
 * wants column i mod 3, and is dropped at the first free slot of that column at
 * or after where an even spread would have put it. Two cards occasionally end up
 * adjacent, which is what a real feed looks like anyway.
 */
const COLS = 3;

function interleave(reels: Post[], cards: Post[]): Post[] {
  const total = reels.length + cards.length;
  const taken = new Map<number, Post>();
  cards.forEach((card, i) => {
    let at = Math.round((i * total) / cards.length);
    // Walk to the next slot in this card's column that nothing else has.
    while (at < total && (at % COLS !== i % COLS || taken.has(at))) at++;
    if (at >= total) { at = 0; while (taken.has(at)) at++; }
    taken.set(at, card);
  });
  const out: Post[] = [];
  let r = 0;
  for (let i = 0; i < total; i++) out.push(taken.get(i) ?? reels[r++]!);
  return out;
}

/**
 * The site's own reel leads: it is the one post that says what the account is.
 *
 * Tegmark's twelve are appended rather than mixed in. They are one series, in
 * Tegmark's own order, and the whole point of a run of twelve is that it reads
 * as a run: interleaved they would be twelve near-identical tarot faces
 * scattered through the grid with nothing saying they belong together. So the
 * shuffle above applies to the feed as it was, and the deck sits under it,
 * behind the post that introduces the three players it belongs to.
 */
export const POSTS: Post[] = [
  ...interleave(
    [FIELD_DYNAMICS_REEL, SHIFTCOOL_REEL, HOME_REEL, SOLOCOOL_REEL, UNDERGROUND_REEL, STACK_REEL, BREAK_REEL, ...REEL_POSTS],
    [TURBULENCE_POST, ...ODDS_POSTS, ...SHOTS_POSTS, ...TERM_POSTS, ...DECK_POSTS],
  ),
  ODDS_CHOOSER,
  ...TEGMARK_POSTS,
];
