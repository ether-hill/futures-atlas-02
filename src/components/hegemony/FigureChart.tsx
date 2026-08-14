"use client";

/**
 * The mark on a finding's card.
 *
 * Everything drawn here is assembled from the finding's own `chart` field, so
 * the label under a bar cannot drift from the bar's length — see the rule on
 * `FindingChart` in `data/hegemony.ts`. This component adds no numbers of its
 * own and completes nothing: a single share is one bar against an empty track,
 * never two bars summing to 100, because the remainder was not measured.
 *
 * Deliberately not a charting library, for the same reasons DisparityTreemap
 * gives: it is a handful of divs sized by percentage, so it reflows with the
 * card, scales with the type, inherits the live theme tokens rather than
 * needing them resolved into a canvas, and reads to a screen reader as the
 * plain list of figures it is.
 *
 * The numbers walk up from zero the first time the chart is seen — once, not
 * on every pass, because a number that re-counts every time it scrolls by
 * reads as decoration rather than as a measurement. `prefix` ("up to", "more
 * than") never animates: those are the source's hedges, not part of the
 * arithmetic. Under prefers-reduced-motion the final state renders directly.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { FindingChart, Measure } from "@/data/hegemony";

/**
 * The element a chart should count itself against.
 *
 * Inside the carousel the cards to the right are on screen vertically but
 * clipped horizontally, so the page viewport is the wrong question to ask.
 * The carousel provides its scroller here; outside one this stays null and the
 * observer falls back to the viewport, which is what a plain grid wants.
 */
export const ChartViewport = createContext<Element | null>(null);

const WALK_MS = 900;
const STAGGER_MS = 90;

/** Decimals are taken from the value as written, so 0.06 keeps both and 42 keeps none. */
const decimalsOf = (n: number) => {
  const dot = String(n).indexOf(".");
  return dot === -1 ? 0 : String(n).length - dot - 1;
};

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Bar({ bar, max, t }: { bar: Measure; max: number; t: number }) {
  const decimals = decimalsOf(bar.value);
  const shown = bar.value * t;
  // A measured bar always shows; a bar at 0% of the track would read as "no
  // data" rather than as "very nearly none", which is the opposite of the point
  // on findings like c4-ratios.
  const width = Math.max((shown / max) * 100, shown > 0 ? 0.6 : 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] leading-[1.4] text-ink/70">{bar.label}</span>
        <span
          className={`shrink-0 font-mono text-[12px] font-bold tabular-nums tracking-tight ${
            bar.baseline ? "text-ink/45" : "text-accent-deep"
          }`}
        >
          {bar.prefix && <span className="font-normal text-ink/45">{bar.prefix}</span>}
          {format(shown, decimals)}
          {bar.unit}
        </span>
      </div>
      <div className="mt-1.5 h-[6px] w-full bg-ink/[0.09]">
        {/* Baselines are a reference point, not a measurement, so they step back
            to ink. Everything measured carries the accent at full strength: the
            comparison is in the lengths, and ramping the colour would invent a
            hierarchy the evidence does not have. */}
        <div
          className={`h-full ${bar.baseline ? "bg-ink/25" : ""}`}
          style={{ width: `${width}%`, ...(bar.baseline ? {} : { background: "var(--accent)" }) }}
        />
      </div>
    </div>
  );
}

export function FigureChart({ chart }: { chart: FindingChart }) {
  const ref = useRef<HTMLElement | null>(null);
  const root = useContext(ChartViewport);
  const [t, setT] = useState<number[]>(() => chart.bars.map(() => 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const settle = () => setT(chart.bars.map(() => 1));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle();
      return;
    }

    let raf = 0;
    let start = 0;
    const run = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      setT(
        chart.bars.map((_, i) =>
          easeOut(Math.min(Math.max((elapsed - i * STAGGER_MS) / WALK_MS, 0), 1)),
        ),
      );
      if (elapsed < WALK_MS + chart.bars.length * STAGGER_MS) raf = requestAnimationFrame(run);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect(); // once seen, it stays counted
        raf = requestAnimationFrame(run);
      },
      { root, threshold: 0.55 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [chart, root]);

  return (
    <figure ref={ref} className="mt-4 border-t border-ink/[0.14] pt-4">
      <div className="space-y-3">
        {chart.bars.map((b, i) => (
          <Bar key={b.label} bar={b} max={chart.max} t={t[i] ?? 0} />
        ))}
      </div>
      <figcaption className="mt-3 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.12em] text-ink/45">
        {chart.axis}
      </figcaption>
    </figure>
  );
}
