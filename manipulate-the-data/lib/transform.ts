/**
 * The counterfactual engine.
 *
 * The rule this file exists to enforce: nothing here, and nothing upstream of
 * here, ever writes a data point. An intervention is a set of typed, dated
 * transforms over the published series, and this module applies them
 * deterministically. Same intervention, same year, same chart, every time.
 *
 * Two consequences fall out of that, and they are the point:
 *   - History is immutable. An intervention dated 2023 cannot touch 2019.
 *   - Every changed figure carries a stated reason and a confidence, because a
 *     transform that cannot be justified in a sentence should not be applied.
 */

import type { Figure, Series } from "@/lib/figures";
import type { Effect, Intervention } from "@/lib/interventions";

export type AppliedEffect = Effect & { from: number };

export type Counterfactual = {
  series: Series[];
  effects: AppliedEffect[];
  /** Headline change at the end of the series, for the card badge. */
  headline: { label: string; before: number; after: number; ratio: number } | null;
};

/* ------------------------------------------------------------------- x → year */

/** Every chart kind stores x differently; this is the one place that knows how. */
function yearOf(figure: Figure, x: number): number | null {
  if (figure.xAxis.type === "year") return x;
  if (figure.xAxis.type === "category") {
    const c = figure.categories?.[x];
    if (!c) return null;
    const y = Number(c.slice(0, 4));
    return Number.isFinite(y) ? y + (c.includes("Q") ? (Number(c.slice(5)) - 1) / 4 : 0) : null;
  }
  /* Ranked bars have no time axis - an effect either applies to the whole
     figure or not at all. Signalled with -Infinity so `year >= from` is true. */
  return -Infinity;
}

/* ----------------------------------------------------------------------- ops */

type Ctx = { from: number; cumulative: boolean; clampMax: number | null };

function transformSeries(points: [number, number][], years: (number | null)[], e: Effect, ctx: Ctx) {
  const out = points.map((p) => [p[0], p[1]] as [number, number]);
  const active = (i: number) => years[i] !== null && (years[i] as number) >= ctx.from;
  const firstActive = out.findIndex((_, i) => active(i));
  if (firstActive === -1) return out;

  const ramp = e.rampYears ?? 1;
  const since = (i: number) =>
    years[i] === -Infinity ? 1 : Math.min(1, ((years[i] as number) - ctx.from + 1) / Math.max(ramp, 0.001));

  switch (e.op) {
    case "freeze": {
      const held = out[Math.max(firstActive - 1, 0)][1];
      for (let i = firstActive; i < out.length; i++) out[i][1] = held;
      break;
    }
    case "cap": {
      for (let i = firstActive; i < out.length; i++) out[i][1] = Math.min(out[i][1], e.magnitude);
      break;
    }
    case "levelShift": {
      for (let i = firstActive; i < out.length; i++)
        out[i][1] = out[i][1] * (1 + e.magnitude * since(i));
      break;
    }
    case "converge": {
      for (let i = firstActive; i < out.length; i++)
        out[i][1] = out[i][1] + (e.magnitude - out[i][1]) * since(i);
      break;
    }
    case "growthRate": {
      /* Damp (or amplify) year-on-year change from the intervention date, carrying
         the modified level forward. On a cumulative series the increments are what
         get damped - you cannot un-build a data center that already exists. */
      for (let i = Math.max(firstActive, 1); i < out.length; i++) {
        const prevActual = points[i - 1][1];
        const actual = points[i][1];
        const prevCf = out[i - 1][1];
        const delta = actual - prevActual;
        if (ctx.cumulative || prevActual === 0) {
          out[i][1] = prevCf + delta * e.magnitude;
        } else {
          const g = actual / prevActual - 1;
          out[i][1] = prevCf * (1 + g * e.magnitude);
        }
        /* An intervention has a direction. Damping the trajectory must never lift
           a series above what actually happened just because the real year was a
           decline, and amplifying it must never push one below. Without this, the
           2023 investment dip reads as a moratorium *raising* investment. */
        if (e.magnitude < 1) out[i][1] = Math.min(out[i][1], actual);
        else if (e.magnitude > 1) out[i][1] = Math.max(out[i][1], actual);
      }
      break;
    }
  }

  for (const p of out) {
    if (p[1] < 0) p[1] = 0;
    if (ctx.clampMax !== null && p[1] > ctx.clampMax) p[1] = ctx.clampMax;
  }
  return out;
}

/* ------------------------------------------------------------------- entry */

export function applyIntervention(figure: Figure, iv: Intervention | null): Counterfactual | null {
  if (!iv) return null;
  const effects = iv.effects.filter((e) => e.figureId === figure.id);
  if (!effects.length) return null;

  /* Percentages and human-relative scores have a ceiling that a multiplier
     must not walk through. */
  const pct = figure.yAxis.format?.startsWith("pct") || figure.xAxis.format?.startsWith("pct");
  const clampMax = pct ? (figure.yAxis.domain?.[1] ?? figure.xAxis.domain?.[1] ?? 1) : null;

  const applied: AppliedEffect[] = [];
  const series = figure.series.map((s) => {
    const mine = effects.filter((e) => !e.series || e.series.includes(s.key));
    if (!mine.length) return { ...s, points: s.points.map((p) => [p[0], p[1]] as [number, number]) };
    let points = s.points.map((p) => [p[0], p[1]] as [number, number]);
    const years = points.map((p) => yearOf(figure, p[0]));
    for (const e of mine) {
      const from = iv.from + (e.lag ?? 0);
      points = transformSeries(points, years, e, {
        from,
        cumulative: !!figure.cumulative,
        clampMax,
      });
      if (!applied.some((a) => a.rationale === e.rationale)) applied.push({ ...e, from });
    }
    return { ...s, points };
  });

  /* Headline: the biggest series at the end of the range, before vs after. */
  const idx = figure.series
    .map((s, i) => ({ i, v: s.points.at(-1)?.[1] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]?.i;
  let headline: Counterfactual["headline"] = null;
  if (idx !== undefined) {
    const before =
      figure.kind === "stackedBar"
        ? figure.series.reduce((n, s) => n + (s.points.at(-1)?.[1] ?? 0), 0)
        : figure.series[idx].points.at(-1)![1];
    const after =
      figure.kind === "stackedBar"
        ? series.reduce((n, s) => n + (s.points.at(-1)?.[1] ?? 0), 0)
        : series[idx].points.at(-1)![1];
    headline = {
      label: figure.kind === "stackedBar" ? "total" : figure.series[idx].label,
      before,
      after,
      ratio: before === 0 ? 0 : after / before,
    };
  }

  return { series, effects: applied, headline };
}

/**
 * Whether a counterfactual actually shows up on the chart. A lever can reach a
 * figure and still land after the last year drawn, which is not the same thing
 * as moving it; counting those as moved inflates every tally on the page.
 */
export function movesVisibly(cf: Counterfactual | null): boolean {
  if (!cf?.headline) return false;
  return cf.headline.after === 0 || Math.abs(Math.round((cf.headline.ratio - 1) * 100)) >= 1;
}

/** Figures this intervention deliberately leaves alone, and the reason why. */
export function untouchedReason(figure: Figure, iv: Intervention): string {
  const overlap = figure.levers.filter((l) => iv.levers.includes(l));
  if (overlap.length)
    return `Shares the ${overlap.join(", ")} lever, but the effect is too indirect to model as a transform. Left as published.`;
  return `No lever in this intervention (${iv.levers.join(", ")}) reaches what drives this figure (${figure.levers.join(", ")}).`;
}
