"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const W = 1200;
/* The page gives this component whatever height is left over, so the viewBox
   height is measured rather than fixed — otherwise a short viewport letterboxes
   the chart and a tall one leaves a hole under it. */
const M = { top: 46, right: 210, bottom: 56, left: 74 };
const H_MIN = 300;
const H_MAX = 760;

export type Threshold = { y: number; label: string };

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
  const boxRef = useRef<HTMLDivElement>(null);
  const [H, setH] = useState(520);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      setH(Math.round(Math.min(H_MAX, Math.max(H_MIN, (h / w) * W))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  }, [figure, cf, cats.length, thresholds, H]);

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
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#73D9FF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#1C78BA" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#172E5C" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#73D9FF" />
          <stop offset="100%" stopColor="#9CF2F2" />
        </linearGradient>
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
        transform={`rotate(-90 22 ${M.top + plotH / 2})`}
        x={22}
        y={M.top + plotH / 2}
        className="one-axis-title"
        textAnchor="middle"
      >
        Gigawatts
      </text>

      {/* what is coming, if nothing changes */}
      <path d={area(base)} fill="url(#glow)" className="one-shape" />
      <path d={line(base)} fill="none" stroke="url(#edge)" strokeWidth={2.5} className="one-shape" />

      {/* what you chose instead, cut out of it */}
      {alt && (
        <>
          <path d={area(alt)} className="one-cf one-shape" />
          <path d={line(alt)} fill="none" className="one-cf-line one-shape" strokeWidth={2.5} />
        </>
      )}

      {/* the countries it passes */}
      {thresholds.map((t) => (
        <g key={t.label}>
          <line x1={M.left} x2={W - M.right + 10} y1={y(t.y)} y2={y(t.y)} className="one-threshold" />
          <text x={W - M.right + 18} y={y(t.y) + 4} className="one-threshold-label">
            {t.label}
          </text>
        </g>
      ))}
      {crossings.map((c) => (
        <g key={`x${c.label}`}>
          <circle cx={x(c.i)} cy={y(c.y)} r={4} className="one-cross" />
          <text x={x(c.i)} y={y(c.y) - 14} className="one-cross-label" textAnchor="middle">
            {cats[c.i]}
          </text>
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
      <text x={x(base.length - 1) + 12} y={y(base.at(-1)!) + 5} className="one-end">
        {base.at(-1)!.toFixed(1)} GW
      </text>
      {alt && (
        <text x={x(alt.length - 1) + 12} y={y(alt.at(-1)!) + 5} className="one-end one-end-cf">
          {alt.at(-1)!.toFixed(1)} GW
          {interventionLabel ? <tspan className="one-end-note"> · {interventionLabel}</tspan> : null}
        </text>
      )}

      {cats.map((c, i) =>
        /* One label a year, on the fourth quarter. Adding the first quarter too
           printed 2022 twice. */
        c.endsWith("Q4") ? (
          <text key={c} x={x(i)} y={H - M.bottom + 26} className="one-xtick" textAnchor="middle">
            {c.slice(0, 4)}
          </text>
        ) : null
      )}
      </svg>
    </div>
  );
}
