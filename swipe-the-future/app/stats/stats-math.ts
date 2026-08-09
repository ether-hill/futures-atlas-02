// Swipe the Future, the analysis behind the stats page.
//
// The question is binary now (already happened, or not yet), which is exactly
// the shape signal detection theory was built for, so the maths got simpler and
// more honest at the same time.
//
// A card whose answer is ALREADY REAL is signal. A card whose answer is NOT YET
// is noise. Saying "already" to signal is a hit; saying it to noise is a false
// alarm. From those two rates you get d′, how sharply someone separates the two,
// and criterion c, which way they lean when they are unsure. Under v1's
// four-step scale these were approximations over an ordinal ladder. Here they
// are the textbook quantities.
//
// Two mistakes, and they are different people:
//   HYPE TRAP  said already, it has not happened  (false alarm)
//   BLIND SPOT said not yet, it happened years ago (miss)

import { EXPECTED, type Verdict } from "../../data/sectors";

export interface CardStat {
  id: string;
  claim: string;
  short: string; // chart-row label, see Card.short
  verdict: Verdict;
  sector: string;
  sectorId: string;
  real: number;   // said ALREADY REAL
  notYet: number; // said NOT YET
  n: number;
  pReal: number;    // share who said ALREADY REAL
  expected: number; // 1 if it happened, 0 if it hasn't
  gap: number;      // pReal − expected. Positive = a hype trap, negative = a blind spot.
}

/**
 * Inverse standard normal CDF (Acklam's rational approximation, |ε| < 1.15e-9).
 * Needed for d′ and criterion; there's no closed form.
 */
export function probit(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q: number, r: number;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

/** Wilson score interval, honest about small samples in a way p ± 1.96·SE isn't. */
export function wilson(successes: number, n: number, z = 1.96): { lo: number; hi: number } {
  if (n === 0) return { lo: 0, hi: 1 };
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denom;
  return { lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}

export interface SectorStat {
  id: string;
  name: string;
  n: number;        // every answer, since every card is scorable now
  correct: number;
  accuracy: number;
  lo: number;       // Wilson bounds on accuracy
  hi: number;
  dPrime: number;   // 0 = coin flip, ~1 = decent, 2+ = sharp
  lean: number;     // −c. Positive = leans ALREADY REAL, negative = leans NOT YET.
  /** False when a deck is all-already or all-not-yet: accuracy still reads, d′ doesn't. */
  measurable: boolean;
  hits: number; falseAlarms: number; signal: number; noise: number;
  /** Rates for the ROC plot: y and x respectively. */
  hitRate: number; faRate: number;
}

/**
 * Signal detection over one sector's cards.
 *
 * Signal is a card that already happened; noise is one that hasn't. A hit is
 * answering ALREADY REAL to signal, a false alarm is answering it to noise.
 * Every card counts, because every card has a right answer.
 *
 * The log-linear correction (+0.5 per cell) keeps a perfect or hopeless sector
 * from producing an infinite d′.
 */
export function sectorStat(id: string, name: string, cards: CardStat[]): SectorStat | null {
  if (!cards.length) return null;

  let hits = 0, signal = 0, falseAlarms = 0, noise = 0;
  for (const c of cards) {
    if (c.verdict === "already") { hits += c.real; signal += c.n; }
    else { falseAlarms += c.real; noise += c.n; }
  }
  const n = signal + noise;
  if (n === 0) return null;

  const correct = hits + (noise - falseAlarms);
  const { lo, hi } = wilson(correct, n);

  // d′ needs both a hit rate and a false-alarm rate. A deck answered on only one
  // side of the key can still be scored for accuracy, so d′ and lean report 0
  // and the page says why rather than printing a number nobody should read.
  const measurable = signal > 0 && noise > 0;
  const H = measurable ? (hits + 0.5) / (signal + 1) : 0.5;
  const F = measurable ? (falseAlarms + 0.5) / (noise + 1) : 0.5;
  const zH = probit(H), zF = probit(F);

  return {
    id, name, n, correct,
    accuracy: correct / n, lo, hi,
    dPrime: measurable ? zH - zF : 0,
    lean: measurable ? (zH + zF) / 2 : 0, // = −c, so positive reads as "leans already real"
    measurable,
    hits, falseAlarms, signal, noise,
    hitRate: signal ? hits / signal : 0,
    faRate: noise ? falseAlarms / noise : 0,
  };
}

export const expectedOf = (v: Verdict) => EXPECTED[v];

/** Plain-English label for a d′, so the number isn't the only thing on offer. */
export function sensitivityLabel(d: number): string {
  if (d >= 1.6) return "sharp";
  if (d >= 0.9) return "good";
  if (d >= 0.4) return "shaky";
  return "coin flip";
}

export function leanLabel(lean: number): string {
  if (lean > 0.35) return "assumes it shipped";
  if (lean < -0.35) return "assumes it hasn't";
  return "even-handed";
}
