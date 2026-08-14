"use client";

import { useMemo } from "react";
import { useBox } from "@/lib/use-box";
import type { Figure, Series } from "@/lib/figures";

/**
 * One figure, drawn to be looked at.
 *
 * The board's chart kit exists to reproduce the AI Index exactly, which means
 * pure-black axes, a legend in a box and a gridline every ten units. That is the
 * right answer for a page whose job is fidelity and the wrong one for a page
 * whose job is a single argument. This draws the same numbers as a rising field
 * of light, with the country thresholds it crosses as the only annotation, and
 * the counterfactual cut out of it as a solid shape.
 *
 * Nothing about the data changes. The area is the same series, the thresholds
 * are the ones the AI Index itself prints on the figure, and the counterfactual
 * is the same transform the board applies.
 */

/* The page gives this component whatever height is left over, so the viewBox
   height is measured rather than fixed. Otherwise a short viewport letterboxes
   the chart and a tall one leaves a hole under it.

   The viewBox width is measured too, and that matters more than it sounds. An
   SVG scaled to fit scales its type with it: a 1200-unit box on a 400px phone
   renders every label at a third of its size, which is not small type, it is no
   type. A narrower box on a narrow screen keeps the drawing the same and the
   words readable. The country labels move under the plot at that size, since
   there is no room for a 210-unit gutter beside it. */
const W_WIDE = 1200;
const W_NARROW = 560;
const M_WIDE = { top: 46, right: 210, bottom: 56, left: 74 };
const M_NARROW = { top: 34, right: 26, bottom: 46, left: 54 };
const H_MIN = 300;
const H_MAX = 760;

export type Threshold = { y: number; label: string; short?: string };

export default function PowerChart({
  figure,
  cf,
  thresholds,
  interventionLabel,
  dataEndsAt,
}: {
  figure: Figure;
  cf?: Series[] | null;
  thresholds: Threshold[];
  interventionLabel?: string;
  /** Category index after which the series is projection rather than record. */
  dataEndsAt?: number;
}) {
  const cats = figure.categories ?? [];
  const [boxRef, box] = useBox<HTMLDivElement>();

  const narrow = (box?.w ?? 1200) < 700;
  const W = narrow ? W_NARROW : W_WIDE;
  const M = narrow ? M_NARROW : M_WIDE;
  const H = box
    ? Math.round(Math.min(H_MAX, Math.max(H_MIN, (box.h / Math.max(1, box.w)) * W)))
    : 520;

  const geom = useMemo(() => {
    const total = (ss: Series[]) =>
      ss[0].points.map((_, i) => ss.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0));
    const base = total(figure.series);
    const alt = cf ? total(cf) : null;
    const peak = Math.max(...base, ...(alt ?? []), ...thresholds.map((t) => t.y));
    /* Round the axis to a step a person would choose, so the labels read 0/25/
       50/75/100 rather than 0/28/55/83/110. */
    const rough = (peak * 1.08) / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    /* A coarse ladder rounds a 98.6 peak up to a 200 axis and throws away half
       the height. This one has enough rungs to stay close. */
    const step =
      ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 10].find((m) => rough <= mag * m) ?? 10) * mag;
    const top = step * 4;
    const plotW = W - M.left - M.right;
    const plotH = H - M.top - M.bottom;
    const x = (i: number) => M.left + (i / Math.max(1, cats.length - 1)) * plotW;
    const y = (v: number) => M.top + plotH - (v / top) * plotH;
    return { base, alt, top, plotW, plotH, x, y };
  }, [figure, cf, cats.length, thresholds, H, W, M.left, M.right, M.top, M.bottom]);

  const { base, alt, top, plotH, x, y } = geom;

  const line = (vals: number[]) =>
    vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = (vals: number[]) =>
    `${line(vals)} L${x(vals.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;

  /* The moment each threshold is crossed is the story beat worth marking. */
  const crossings = thresholds
    .map((t) => {
      const i = base.findIndex((v) => v >= t.y);
      return i > 0 ? { ...t, i } : null;
    })
    .filter(Boolean) as (Threshold & { i: number })[];

  const yTicks = Array.from({ length: 5 }, (_, i) => Number(((top / 4) * i).toPrecision(6)));

  return (
    <div className="one-chartbox" ref={boxRef}>
      <svg className="one-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={figure.title}>
      <defs>
        {/* Stops come from the stylesheet so the whole figure re-lights with the
            atlas theme instead of assuming a dark page. */}
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--one-glow-1)" stopOpacity="var(--one-glow-o1)" />
          <stop offset="45%" stopColor="var(--one-glow-2)" stopOpacity="var(--one-glow-o2)" />
          <stop offset="100%" stopColor="var(--one-glow-3)" stopOpacity="var(--one-glow-o3)" />
        </linearGradient>
        {/* The difference between the two readings, hatched: it is neither
            reading, it is the gap, and it has to say so in both directions. */}
        <pattern
          id="delta"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={8} height={8} fill="var(--one-delta-bg)" />
          <rect width={2.6} height={8} fill="var(--one-delta-ink)" />
        </pattern>
      </defs>

      {/* the horizon lines you cross on the way up */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={M.left}
            x2={W - M.right}
            y1={y(v)}
            y2={y(v)}
            className="one-grid"
          />
          <text x={M.left - 14} y={y(v) + 5} className="one-ytick">
            {v}
          </text>
        </g>
      ))}
      <text
        transform={`rotate(-90 ${narrow ? 15 : 22} ${M.top + plotH / 2})`}
        x={narrow ? 15 : 22}
        y={M.top + plotH / 2}
        className="one-axis-title"
        textAnchor="middle"
      >
        Gigawatts
      </text>

      {/* What is coming, if nothing changes. */}
      <path d={area(base)} fill="url(#glow)" className="one-shape" />

      {/* The gap between the readings, hatched. Cutting the counterfactual out of
          the glow only worked while it was lower: an intervention that pushes the
          line UP covered the published reading completely and you could not see
          what you were being compared against. A band drawn between the two
          curves reads the same either way. */}
      {alt &&
        (() => {
          const band = `${line(base)} ${[...alt]
            .reverse()
            .map((v, k) => `L${x(alt.length - 1 - k).toFixed(1)},${y(v).toFixed(1)}`)
            .join(" ")} Z`;
          return (
            <>
              {/* A veil first, so the part of the glow you gave up visibly goes
                  out. Hatch alone was legible over the page ground but not over
                  the bright half of the gradient, which is exactly where a
                  downward intervention puts it. */}
              <path d={band} className="one-delta-veil one-shape" />
              <path d={band} fill="url(#delta)" className="one-shape" />
            </>
          );
        })()}

      {/* Both edges, drawn last so neither can be buried by a fill. */}
      <path d={line(base)} fill="none" className="one-base-line one-shape" strokeWidth={2.5} />
      {alt && (
        <path d={line(alt)} fill="none" className="one-cf-line one-shape" strokeWidth={2.5} />
      )}

      {/* The countries it passes. On a phone there is no gutter to write in, so
          the label sits on top of its own line instead of beside it, which means
          two thresholds close together would print on top of each other. When
          the axis is tall enough to crush them, the lower one keeps its line and
          loses its words. */}
      {thresholds.map((t, i) => {
        const prev = thresholds[i - 1];
        const crowded = narrow && prev !== undefined && Math.abs(y(t.y) - y(prev.y)) < 26;
        return (
          <g key={t.label}>
            <line
              x1={M.left}
              x2={W - M.right + (narrow ? 0 : 10)}
              y1={y(t.y)}
              y2={y(t.y)}
              className="one-threshold"
            />
            {!crowded && (
              <text
                x={narrow ? M.left + 6 : W - M.right + 18}
                y={narrow ? y(t.y) - 6 : y(t.y) + 4}
                className="one-threshold-label"
              >
                {narrow ? (t.short ?? t.label) : t.label}
              </text>
            )}
          </g>
        );
      })}
      {/* The dot stays at every size; the quarter it happened in does not. On a
          narrow box the threshold label already sits above the line, and a
          second label there lands on top of it. */}
      {crossings.map((c) => (
        <g key={`x${c.label}`}>
          <circle cx={x(c.i)} cy={y(c.y)} r={narrow ? 3.5 : 4} className="one-cross" />
          {!narrow && (
            <text x={x(c.i)} y={y(c.y) - 14} className="one-cross-label" textAnchor="middle">
              {cats[c.i]}
            </text>
          )}
        </g>
      ))}

      {/* where the record stops and the trend begins */}
      {dataEndsAt !== undefined && dataEndsAt < cats.length - 1 && (
        <g>
          <rect
            x={x(dataEndsAt)}
            y={M.top}
            width={W - M.right - x(dataEndsAt)}
            height={plotH}
            className="one-projected"
          />
          <line x1={x(dataEndsAt)} x2={x(dataEndsAt)} y1={M.top} y2={M.top + plotH} className="one-boundary" />
          <text x={x(dataEndsAt) + 10} y={M.top + 16} className="one-projected-label">
            PROJECTED · NOT DATA
          </text>
        </g>
      )}

      {/* the ends */}
      {(() => {
        /* The end value and a country line can land on the same row: 29.6 GW
           sits nine pixels under "New York State, peak" on a 40 GW axis, and
           they print on top of each other. Nudge the end value clear of the
           nearest threshold rather than the other way round, since the
           threshold labels are a fixed ladder and this one moves. */
        const ey = y(base.at(-1)!);
        const near = thresholds
          .map((t) => y(t.y))
          .reduce((best, ty) => (Math.abs(ty - ey) < Math.abs(best - ey) ? ty : best), Infinity);
        const clash = Math.abs(near - ey) < 18;
        const dy = clash ? (ey > near ? 16 : -14) : 0;
        return (
          <text
            x={narrow ? x(base.length - 1) : x(base.length - 1) + 12}
            y={(narrow ? ey - 10 : ey + 5) + dy}
            textAnchor={narrow ? "end" : "start"}
            className="one-end"
          >
            {base.at(-1)!.toFixed(1)} GW
          </text>
        );
      })()}
      {alt && (
        <text
          x={narrow ? x(alt.length - 1) : x(alt.length - 1) + 12}
          y={narrow ? y(alt.at(-1)!) + 20 : y(alt.at(-1)!) + 5}
          textAnchor={narrow ? "end" : "start"}
          className="one-end one-end-cf"
        >
          {alt.at(-1)!.toFixed(1)} GW
          {interventionLabel && !narrow ? (
            <tspan className="one-end-note"> · {interventionLabel}</tspan>
          ) : null}
        </text>
      )}

      {cats.map((c, i) =>
        /* One label a year, on the fourth quarter. Adding the first quarter too
           printed 2022 twice. */
        c.endsWith("Q4") ? (
          <text key={c} x={x(i)} y={H - M.bottom + (narrow ? 22 : 26)} className="one-xtick" textAnchor="middle">
            {c.slice(0, 4)}
          </text>
        ) : null
      )}
      </svg>
    </div>
  );
}
