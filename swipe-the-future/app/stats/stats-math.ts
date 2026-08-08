// Swipe the Future — the analysis behind the stats page.
//
// Two ideas do the work. The Reality Gap is a calibration plot: for every claim,
// where the evidence sits versus how many people called it true. The per-sector
// numbers are signal detection theory — d′ for how well people separate true
// claims from false ones, and criterion c for which way they lean when unsure.
// Both are standard, both survive a statistician reading them, and both reduce
// to two honest sentences for everyone else.

import { TRUTH, type Verdict } from "../../data/sectors";

export interface CardStat {
  id: string;
  claim: string;
  verdict: Verdict;
  sector: string;
  sectorId: string;
  yes: number;   // said TRUE
  no: number;    // said FALSE
  n: number;
  pTrue: number; // share who said TRUE
  truth: number; // where the evidence sits, 0 → 1
  gap: number;   // pTrue − truth. Positive = crowd is more credulous than the evidence.
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

/** Wilson score interval — honest about small samples in a way p ± 1.96·SE isn't. */
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
  n: number;        // scorable answers (contested claims excluded)
  correct: number;
  accuracy: number;
  lo: number;       // Wilson bounds on accuracy
  hi: number;
  dPrime: number;   // 0 = coin flip, ~1 = decent, 2+ = sharp
  lean: number;     // −c. Positive = leans TRUE, negative = leans FALSE.
  /** False when the deck is all-true or all-false: accuracy is scorable, d′ isn't. */
  measurable: boolean;
  hits: number; falseAlarms: number; signal: number; noise: number;
}

/**
 * Signal detection over one sector's cards.
 *
 * "Signal" is a claim the evidence supports (likely / already real); "noise" is
 * one it contradicts (not true). Contested claims have no right answer, so they
 * sit out of this entirely. The log-linear correction (+0.5 per cell) keeps a
 * perfect or hopeless sector from producing an infinite d′.
 */
export function sectorStat(id: string, name: string, cards: CardStat[]): SectorStat | null {
  const scorable = cards.filter((c) => c.verdict !== "contested");
  if (!scorable.length) return null;

  let hits = 0, signal = 0, falseAlarms = 0, noise = 0;
  for (const c of scorable) {
    if (c.verdict === "unlikely") { falseAlarms += c.yes; noise += c.n; }
    else { hits += c.yes; signal += c.n; }
  }
  const n = signal + noise;
  if (n === 0) return null;

  const correct = hits + (noise - falseAlarms);
  const { lo, hi } = wilson(correct, n);

  // Both a hit rate and a false-alarm rate are needed for d′ — a sector with only
  // true claims (or only false ones) can be scored for accuracy but not for
  // sensitivity, so d′ and lean are reported as 0 and the table shows the n.
  const measurable = signal > 0 && noise > 0;
  const H = measurable ? (hits + 0.5) / (signal + 1) : 0.5;
  const F = measurable ? (falseAlarms + 0.5) / (noise + 1) : 0.5;
  const zH = probit(H), zF = probit(F);

  return {
    id, name, n, correct,
    accuracy: correct / n, lo, hi,
    dPrime: measurable ? zH - zF : 0,
    lean: measurable ? (zH + zF) / 2 : 0, // = −c, so positive reads as "leans true"
    measurable,
    hits, falseAlarms, signal, noise,
  };
}

export const truthOf = (v: Verdict) => TRUTH[v];

/** Plain-English label for a d′, so the number isn't the only thing on offer. */
export function sensitivityLabel(d: number): string {
  if (d >= 1.6) return "sharp";
  if (d >= 0.9) return "good";
  if (d >= 0.4) return "shaky";
  return "coin flip";
}

export function leanLabel(lean: number): string {
  if (lean > 0.35) return "believes it";
  if (lean < -0.35) return "doubts it";
  return "even-handed";
}
