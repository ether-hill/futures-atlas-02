/**
 * Five cards lifted verbatim from Swipe the Future's own deck, for the taster
 * in the feed.
 *
 * They are copied rather than imported: swipe-the-future is a separate app with
 * its own build, and reaching across into its data layer would couple the host
 * to it. The trade is that this list can go stale — if a verdict changes over
 * there, change it here. The full deck is source-checked and always lives at
 * /swipe-the-future; this is a sample, and the card says so.
 *
 * `verdict` follows the game: has the thing already happened, or not yet.
 */

export interface SwipeSample {
  id: string;
  claim: string;
  verdict: "already" | "notyet";
  /** The reveal line the game shows after the swipe. */
  bigLabel: string;
  big: string;
}

export const SWIPE_SAMPLE: SwipeSample[] = [
  {
    id: "h1",
    claim: "Software has been reading cervical smear slides in real clinics.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "1995",
  },
  {
    id: "t6",
    claim: "A car has been sold to the public that needs no human supervision at any point.",
    verdict: "notyet",
    bigLabel: "Closest thing on sale",
    big: "Level 3",
  },
  {
    id: "l1",
    claim: "Lawyers have been fined by courts for citing cases an AI invented.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "2023",
  },
  {
    id: "h7",
    claim:
      "A drug designed by AI has completed late-stage trials and been approved for general prescription.",
    verdict: "notyet",
    bigLabel: "Furthest any has got",
    big: "Phase 2a",
  },
  {
    id: "w1",
    claim: "Screenwriters have gone on strike and won contract limits on studios using AI.",
    verdict: "already",
    bigLabel: "Already real since",
    big: "2023",
  },
];
