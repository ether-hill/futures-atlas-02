import type { Claim } from "@/content/types";

/*
  The axis is linear from 1900 to 2060 and is never warped.

  A warped axis biases where people place things and makes the results
  uninterpretable, which defeats the point of the instrument. The compression of
  recent decades is a real feature of the subject; resolution comes from zoom.
*/

export const AXIS_MIN = 1900;
export const AXIS_MAX = 2060;

/** Pinned rather than read from the clock, so server and client agree. */
export const NOW_YEAR = 2026;

export type Span = readonly [number, number];

export const FULL_SPAN: Span = [AXIS_MIN, AXIS_MAX];

export function clampYear(year: number, span: Span = FULL_SPAN): number {
  return Math.min(span[1], Math.max(span[0], Math.round(year)));
}

/** Position of a year within a span, as a 0–1 fraction. Not clamped. */
export function yearToFraction(year: number, span: Span): number {
  return (year - span[0]) / (span[1] - span[0]);
}

export function yearToPercent(year: number, span: Span): number {
  return yearToFraction(year, span) * 100;
}

export function fractionToYear(fraction: number, span: Span): number {
  return span[0] + fraction * (span[1] - span[0]);
}

/** Tick step that keeps a span to roughly five to nine labelled years. */
export function tickStep(span: Span): number {
  const width = span[1] - span[0];
  if (width <= 20) return 5;
  if (width <= 60) return 10;
  if (width <= 120) return 20;
  return 40;
}

export function ticksFor(span: Span): number[] {
  const step = tickStep(span);
  const first = Math.ceil(span[0] / step) * step;
  const out: number[] = [];
  for (let y = first; y <= span[1]; y += step) out.push(y);
  return out;
}

/** Every year on the chart that has to be visible for a claim's reveal. */
export function pointsOfInterest(claim: Claim, placement: number): number[] {
  const pts: number[] = [placement];
  const { status } = claim;
  if (status.kind === "happened") pts.push(status.year);
  if (status.kind === "disputed") pts.push(status.year);
  if (status.kind === "expected" && status.range) {
    pts.push(status.range[0], status.range[1]);
  }
  for (const p of claim.policy ?? []) pts.push(p.year);
  return pts;
}

/**
 * The reveal chart's window. Chosen so the action occupies roughly the middle
 * third, then snapped out to whole decades.
 *
 * This is display zoom on an answer already committed, so unlike the placement
 * axis it cannot bias anything.
 */
export function revealWindow(claim: Claim, placement: number): Span {
  const pts = pointsOfInterest(claim, placement);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const mid = (lo + hi) / 2;

  const action = Math.max(hi - lo, 1);
  const width = Math.min(Math.max(action * 3, 40), 160);

  let start = Math.floor((mid - width / 2) / 10) * 10;
  let end = Math.ceil((mid + width / 2) / 10) * 10;

  // Nothing beyond the present has happened, and the dashed half of the axis is
  // what says so, so keep "now" in view whenever the claim reaches near it.
  if (hi >= NOW_YEAR - 20 && end < NOW_YEAR + 10) end = NOW_YEAR + 10;
  if (lo <= NOW_YEAR + 20 && start > NOW_YEAR - 10) start = NOW_YEAR - 10;

  start = Math.max(AXIS_MIN, Math.floor(start / 10) * 10);
  end = Math.min(AXIS_MAX, Math.ceil(end / 10) * 10);
  if (end - start < 40) end = Math.min(AXIS_MAX, start + 40);
  if (end - start < 40) start = Math.max(AXIS_MIN, end - 40);

  return [start, end];
}
