/**
 * Extending the published series past where the data stops.
 *
 * This file does something the rest of the project refuses to do: it makes up
 * numbers. That is a real cost, and it is worth being blunt about why it is
 * paid and how it is contained.
 *
 * The reason: an intervention you take *now* has nothing to act on if the chart
 * ends in 2025. "Stop building data centres" is a claim about the future, and a
 * chart with no future can only answer it as counterfactual history.
 *
 * The containment, in order of importance:
 *   1. One rule, applied to every figure identically. No per-figure hand-tuning,
 *      because a hand-tuned projection is an argument disguised as a baseline.
 *   2. The rule is stated on the page, not buried here.
 *   3. Projected points are drawn inside a shaded region behind a marked
 *      boundary, so no projected value is ever mistaken for a published one.
 *   4. Growth is damped hard. Extrapolating a 50%-a-year trend flat for five
 *      years produces a number nobody believes, and an unbelievable baseline
 *      makes the counterfactual unbelievable too.
 *
 * The rule: take the compound growth rate over the last four observations, then
 * decay that rate by 25% per year. Clamp to the figure's own axis ceiling where
 * it has one, because a percentage cannot exceed its maximum however the trend
 * looks.
 */

import type { Figure, Series } from "@/lib/figures";

export const HORIZON = 2030;
/** Fraction of last year's growth rate that carries into the next. */
export const DECAY = 0.75;
/** Observations used to estimate the trend. */
const WINDOW = 4;
/** Hardest annual growth any projection may start from. A quarterly series that
 *  grew 19% last quarter annualises to ~96%, and compounding that for five years
 *  produces a baseline nobody believes and that drowns out the intervention. */
const MAX_ANNUAL = 0.5;

export const PROJECTION_RULE =
  "Compound growth over the last four observations, capped at 50% a year and decayed 25% a year after that. Bounded measures grow logistically, so they compound normally while they are small and flatten as they approach their ceiling.";

const QUARTER = /^(\d{4})Q([1-4])$/;

type Step = { perYear: number; label: (i: number) => string; year: (i: number) => number };

/** Figures carry their time axis in three different shapes; this normalises them. */
function stepping(figure: Figure): Step | null {
  const cats = figure.categories;
  if (cats?.length) {
    const last = cats[cats.length - 1];
    const q = QUARTER.exec(last);
    if (q) {
      const y0 = Number(q[1]);
      const i0 = (y0 * 4 + Number(q[2]) - 1) as number;
      return {
        perYear: 4,
        label: (i) => `${Math.floor((i0 + i) / 4)}Q${((i0 + i) % 4) + 1}`,
        year: (i) => Math.floor((i0 + i) / 4),
      };
    }
    const y = Number(last);
    if (Number.isFinite(y)) {
      return { perYear: 1, label: (i) => String(y + i), year: (i) => y + i };
    }
    return null;
  }
  if (figure.xAxis.type === "year") {
    const last = Math.max(...figure.series.flatMap((s) => s.points.map((p) => p[0])));
    if (!Number.isInteger(last)) return null; // decimal-date scatters don't extend
    return { perYear: 1, label: (i) => String(last + i), year: (i) => last + i };
  }
  return null;
}

export function canProject(figure: Figure): boolean {
  if (figure.kind === "scatter" || figure.kind === "hbar" || figure.kind === "groupedHBar")
    return false;
  return stepping(figure) !== null;
}

/** Compound growth per step over the trailing window, with guards against a single wild jump. */
function trend(points: [number, number][], perYear: number): number {
  const tail = points.slice(-WINDOW).filter((p) => Number.isFinite(p[1]));
  if (tail.length < 2) return 0;
  const first = tail[0][1];
  const last = tail[tail.length - 1][1];
  /* Span in steps, not in observations. A series with two points six years
     apart grows at the sixth root of the ratio, not the ratio. */
  const span = Math.max(1, tail[tail.length - 1][0] - tail[0][0]);
  if (first <= 0 || last <= 0) {
    /* Additive fallback for series that pass through zero. */
    const per = (last - first) / span;
    return per === 0 ? 0 : per / Math.max(Math.abs(last), 1);
  }
  const g = Math.pow(last / first, 1 / span) - 1;
  const annual = Math.pow(1 + g, perYear) - 1;
  const capped = Math.max(-0.4, Math.min(MAX_ANNUAL, annual));
  return Math.pow(1 + capped, 1 / perYear) - 1;
}

export type Projection = { figure: Figure; fromX: number; firstYear: number };

/**
 * Returns the figure with its series extended to `horizon`, plus the x value
 * where the invented part begins.
 */
export function projectFigure(figure: Figure, horizon: number = HORIZON): Projection | null {
  const step = stepping(figure);
  if (!step || !canProject(figure)) return null;

  const startYear = step.year(0);
  const steps = Math.max(0, (horizon - startYear) * step.perYear);
  if (steps === 0) return null;

  const perStepDecay = Math.pow(DECAY, 1 / step.perYear);
  /* The ceiling is the real one, not the axis the published chart happened to
     use. Figure 4.3.1 is drawn to 90% because that is where the data ended; a
     projection clamped there would flatline immediately and hide the
     intervention entirely. */
  const ceiling = figure.yAxis.format?.startsWith("pct")
    ? Math.max(1, figure.yAxis.domain?.[1] ?? 1)
    : null;

  const isCategory = !!figure.categories?.length;
  /* The last x, not the number of points. A sparse series — two observations
     placed at 2019 and 2025 on a seven-category axis — has two points and six
     as its last index, and using the count appended the projection on top of
     its own data. */
  const lastIndex = isCategory
    ? figure.categories!.length - 1
    : figure.series[0].points.length - 1;
  const fromX = isCategory ? lastIndex + 0.5 : step.year(0) + 0.5;

  const series: Series[] = figure.series.map((s) => {
    let g = trend(s.points, step.perYear);
    const pts = [...s.points];
    let v = pts[pts.length - 1][1];
    for (let i = 1; i <= steps; i++) {
      g *= perStepDecay;
      /* Bounded measures grow logistically. Closing the gap to the ceiling at
         the growth rate was wrong in both directions: it stalled a series that
         was already near its bound, and it launched a 1.4% share toward 100%
         because the gap it was closing was almost the whole axis. The logistic
         step compounds normally while v is small and flattens as v nears the
         ceiling, which is the one behaviour that is right at both ends. */
      v = ceiling !== null ? v + g * v * (1 - v / ceiling) : v * (1 + g);
      if (ceiling !== null) v = Math.min(v, ceiling);
      if (v < 0) v = 0;
      const x = isCategory ? lastIndex + i : step.year(i);
      pts.push([x, Number(v.toFixed(6))]);
    }
    return { ...s, points: pts };
  });

  const categories = figure.categories
    ? [...figure.categories, ...Array.from({ length: steps }, (_, i) => step.label(i + 1))]
    : undefined;

  return {
    figure: {
      ...figure,
      series,
      categories,
      /* The published domain no longer holds; let the chart size itself. */
      xAxis: { ...figure.xAxis, domain: undefined },
      /* The published domain and tick step no longer fit; let the chart size
         itself around both readings. */
      yAxis: { ...figure.yAxis, domain: undefined, tickStep: undefined },
      projection: { fromX, label: "Projected · not data" },
    },
    fromX,
    firstYear: step.year(1),
  };
}
