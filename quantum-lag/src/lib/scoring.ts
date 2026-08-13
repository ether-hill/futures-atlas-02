import type { Claim } from "@/content/types";
import { NOW_YEAR } from "./axis";

/*
  Two different comparisons, never mixed (build-spec §6).

  Against a date: displacement is placed − actual. Within five years counts as
  correct; beyond that the sign carries the meaning.

  Against a range: inside counts as correct; below the lower bound is a leap,
  above the upper bound is lag, and at or before the present year is the
  strongest possible leap, since the player believes something unfinished is
  done. A range of `null` is never scored as though a date existed.
*/

export const CORRECT_WITHIN = 5;

export type Direction =
  /** Placed later than the truth: finished work put in the future. */
  | "lag"
  /** Placed earlier than the truth: unfinished work put in the past. */
  | "leap"
  /** Within five years of a date, or inside an expert range. */
  | "correct";

export type Verdict = {
  claimId: string;
  placed: number;
  direction: Direction;
  /** Signed years, against a date. Null when the comparison was to a range. */
  displacement: number | null;
  /** Years past the nearer edge of the range. Null when compared to a date. */
  outsideBy: number | null;
  insideRange: boolean;
  /** The player marked something unfinished as already done. */
  claimedDone: boolean;
  /** The one-line status label above the written verdict. */
  label: string;
  /** The verdict as a single plain sentence, for the live region. */
  sentence: string;
};

function years(n: number): string {
  const v = Math.abs(n);
  return v === 1 ? "one year" : `${v} years`;
}

export function scoreClaim(claim: Claim, placed: number): Verdict {
  const base = {
    claimId: claim.id,
    placed,
    insideRange: false,
    claimedDone: false,
  };

  const { status } = claim;

  // ---- against a date -----------------------------------------------------
  if (status.kind === "happened" || status.kind === "disputed") {
    const actual = status.year;
    const displacement = placed - actual;
    const direction: Direction =
      Math.abs(displacement) <= CORRECT_WITHIN
        ? "correct"
        : displacement > 0
          ? "lag"
          : "leap";

    const label =
      direction === "correct"
        ? "Within five years"
        : direction === "lag"
          ? "Too late"
          : "Too early";

    const sentence =
      direction === "correct"
        ? `It happened in ${actual}. You said ${placed}, within five years.`
        : direction === "lag"
          ? `It happened in ${actual}. You said ${placed}, which is ${years(displacement)} late.`
          : `It happened in ${actual}. You said ${placed}, which is ${years(displacement)} early.`;

    return {
      ...base,
      direction,
      displacement,
      outsideBy: null,
      label,
      sentence,
    };
  }

  // ---- against a range ----------------------------------------------------
  const range = status.range;

  if (range === null) {
    // No credible date. Any future placement is correct; any past placement is
    // a leap. There is no displacement to report, because there is no date.
    const claimedDone = placed <= NOW_YEAR;
    return {
      ...base,
      direction: claimedDone ? "leap" : "correct",
      displacement: null,
      outsideBy: null,
      claimedDone,
      label: claimedDone ? "Already done, you said" : "No credible date",
      sentence: claimedDone
        ? `This has not happened, and no expert offers a date for it. You put it at ${placed}, which is already behind us.`
        : `This has not happened, and no expert offers a date for it. You put it at ${placed}, which is at least in the future.`,
    };
  }

  const [lo, hi] = range;
  const mid = Math.round((lo + hi) / 2);

  if (placed >= lo && placed <= hi) {
    const off = placed - mid;
    return {
      ...base,
      direction: "correct",
      displacement: null,
      outsideBy: 0,
      insideRange: true,
      label: "Inside the expert range",
      sentence:
        off === 0
          ? `You put it at ${placed}, the middle of the window experts give it.`
          : `You put it at ${placed}, ${years(off)} ${off < 0 ? "before" : "after"} the middle of the estimate, but still within the window experts give it.`,
    };
  }

  if (placed < lo) {
    const claimedDone = placed <= NOW_YEAR;
    return {
      ...base,
      direction: "leap",
      displacement: null,
      outsideBy: placed - lo,
      claimedDone,
      label: claimedDone ? "Already done, you said" : "Too early",
      sentence: claimedDone
        ? `This has not happened. You put it at ${placed}, which is already behind us, and ${years(placed - lo)} before the earliest date any expert gives it.`
        : `You put it at ${placed}, ${years(placed - lo)} before the earliest date any expert gives it.`,
    };
  }

  return {
    ...base,
    direction: "lag",
    displacement: null,
    outsideBy: placed - hi,
    label: "Too late",
    sentence: `You put it at ${placed}, ${years(placed - hi)} after the latest date any expert gives it.`,
  };
}

// ---------------------------------------------------------------------------
// Run-level figures
// ---------------------------------------------------------------------------

export type RunSummary = {
  /** Finished milestones the player placed in the future. */
  finishedInFuture: number;
  finishedTotal: number;
  /** Unfinished milestones the player marked as already done. */
  unfinishedClaimedDone: number;
  unfinishedTotal: number;
  /** Median signed displacement across finished milestones, in years. */
  medianDisplacement: number | null;
  insideRange: number;
  rangedTotal: number;
  /** The dominant direction of error across the whole run. */
  dominant: Direction | null;
};

/** Median rather than mean: one wild placement should not decide the headline. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function summarise(
  claims: Claim[],
  placements: Record<string, number>,
): RunSummary {
  let finishedInFuture = 0;
  let finishedTotal = 0;
  let unfinishedClaimedDone = 0;
  let unfinishedTotal = 0;
  let insideRange = 0;
  let rangedTotal = 0;
  let lag = 0;
  let leap = 0;
  const displacements: number[] = [];

  for (const claim of claims) {
    const placed = placements[claim.id];
    if (placed === undefined) continue;
    const verdict = scoreClaim(claim, placed);

    if (claim.status.kind === "expected") {
      unfinishedTotal += 1;
      if (verdict.claimedDone) unfinishedClaimedDone += 1;
      if (claim.status.range) {
        rangedTotal += 1;
        if (verdict.insideRange) insideRange += 1;
      }
    } else {
      finishedTotal += 1;
      // "In the future" is measured against now, not against the true date:
      // the headline is about believing finished work is still coming.
      if (placed > NOW_YEAR) finishedInFuture += 1;
      if (verdict.displacement !== null) displacements.push(verdict.displacement);
    }

    if (verdict.direction === "lag") lag += 1;
    if (verdict.direction === "leap") leap += 1;
  }

  return {
    finishedInFuture,
    finishedTotal,
    unfinishedClaimedDone,
    unfinishedTotal,
    medianDisplacement: median(displacements),
    insideRange,
    rangedTotal,
    dominant: lag === leap ? null : lag > leap ? "lag" : "leap",
  };
}

/**
 * Cream = you thought it was still coming. Blue = you thought it was already
 * done. The two error directions are different mistakes about the world and
 * never share a colour.
 */
export function directionColour(direction: Direction): string {
  return direction === "leap" ? "var(--accent)" : "var(--text)";
}
