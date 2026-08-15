"use client";

/**
 * The mark on a finding's card.
 *
 * Everything drawn here is assembled from the finding's own `chart` field, so
 * the label under a mark cannot drift from the mark's length — see the rule on
 * `FindingChart` in `data/hegemony.ts`. This component adds no numbers of its
 * own and completes nothing: a single share is one arc against an empty track,
 * never two segments summing to 100, because the remainder was not measured.
 *
 * ── Why six marks and not one ───────────────────────────────────────────────
 *
 * Not for variety. A row of identical bars flattens genuinely different
 * quantities into one shape and quietly lies about two of them: c4-ratios
 * spans 3.4% down to 0.03%, which on a linear bar is one bar and three blank
 * lines, and 15-of-205 is a count you should be able to sit and count. So the
 * mark follows the data — share → ring, orders of magnitude → dots on a log
 * axis, before-and-after → slope, exact n-of-N → waffle, multiplier → repeated
 * units against a 1× rule, categories → bars.
 *
 * Deliberately not a charting library, for the reasons DisparityTreemap gives:
 * these are divs and inline SVG, so they reflow with the card, scale with the
 * type, inherit the live theme tokens rather than needing them resolved into a
 * canvas, and read to a screen reader as the list of figures they are.
 *
 * The numbers walk up from zero the first time the chart is seen — once, not
 * on every pass, because a number that re-counts every time it scrolls by
 * reads as decoration rather than as a measurement. `prefix` ("up to", "more
 * than") never animates: those are the source's hedges, not part of the
 * arithmetic. Under prefers-reduced-motion the final state renders directly.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { FindingChart, Measure } from "@/data/report-types";

/**
 * The element a chart should count itself against.
 *
 * Inside a rail the cards to the right are on screen vertically but clipped
 * horizontally, so the page viewport is the wrong question to ask. The rail
 * provides its scroller here; outside one this stays null and the observer
 * falls back to the viewport, which is what a plain grid wants.
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

/** The counting number itself. Used by every mark, so they all read alike. */
function Readout({ bar, t, className = "" }: { bar: Measure; t: number; className?: string }) {
  return (
    <span
      className={`font-mono font-bold tabular-nums tracking-tight ${
        bar.baseline ? "text-ink/45" : "text-accent-deep"
      } ${className}`}
    >
      {bar.prefix && <span className="font-normal text-ink/45">{bar.prefix}</span>}
      {format(bar.value * t, decimalsOf(bar.value))}
      {bar.unit}
    </span>
  );
}

/* ── the marks ───────────────────────────────────────────────────────────── */

const fill = (bar: Measure) =>
  bar.baseline ? undefined : ({ background: "var(--accent)" } as const);

function Bars({ chart, t }: { chart: FindingChart; t: number[] }) {
  return (
    <div className="space-y-3">
      {chart.bars.map((b, i) => {
        const shown = b.value * (t[i] ?? 0);
        return (
          <div key={b.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] leading-[1.4] text-ink/70">{b.label}</span>
              <Readout bar={b} t={t[i] ?? 0} className="shrink-0 text-[12px]" />
            </div>
            <div className="mt-1.5 h-[6px] w-full bg-ink/[0.09]">
              <div
                className={`h-full ${b.baseline ? "bg-ink/25" : ""}`}
                // A measured bar always shows: 0% of the track would read as
                // "no data" rather than as "very nearly none".
                style={{ width: `${Math.max((shown / chart.max) * 100, shown > 0 ? 0.6 : 0)}%`, ...fill(b) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A number with no denominator: 37,000 people marked, 20 seconds of review.
 *
 * There is no whole for these to be a share OF, so there is no track and no
 * arc — a ring drawn at 100% every time reads as "all of it" and means
 * nothing. The figure counts up and stands by itself.
 */
function Count({ chart, t }: { chart: FindingChart; t: number[] }) {
  const b = chart.bars[0];
  return (
    <div>
      <Readout bar={b} t={t[0] ?? 0} className="block text-[34px] leading-none" />
      <p className="mt-2.5 text-[12.5px] leading-[1.45] text-ink/70">{b.label}</p>
    </div>
  );
}

/**
 * A share of a stated whole. One arc; the rest of the ring is the empty track.
 *
 * Drawn as an explicit arc path rather than a dash-offset circle: `<circle>`
 * starts at three o'clock and its sweep direction is the renderer's business,
 * so the dash trick filled the wrong half. A path states where it starts
 * (twelve) and which way it goes (sweep 1, clockwise), and cannot be read the
 * other way round.
 */
function Ring({ chart, t }: { chart: FindingChart; t: number[] }) {
  const b = chart.bars[0];
  const p = (b.value * (t[0] ?? 0)) / chart.max;
  const R = 42;
  // A full turn would close the arc onto its own start and vanish; stop a
  // hair short so 100% still draws as a ring.
  const a = Math.min(p, 0.9999) * 2 * Math.PI;
  const arc = `M 50 ${50 - R} A ${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${
    50 + R * Math.sin(a)
  } ${50 - R * Math.cos(a)}`;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-[86px] w-[86px] shrink-0" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--ink)" strokeOpacity="0.12" strokeWidth="9" />
        {p > 0 && <path d={arc} fill="none" stroke="var(--accent)" strokeWidth="9" />}
      </svg>
      <div className="min-w-0">
        <Readout bar={b} t={t[0] ?? 0} className="text-[26px] leading-none" />
        <p className="mt-2 text-[12px] leading-[1.4] text-ink/70">{b.label}</p>
      </div>
    </div>
  );
}

/**
 * An exact count out of an exact denominator, drawn so you can count it.
 * Only used where the finding states both numbers, so every cell is real.
 */
function Waffle({ chart, t }: { chart: FindingChart; t: number[] }) {
  const b = chart.bars[0];
  const cells = chart.cells ?? chart.max;
  const filled = Math.round((b.value * (t[0] ?? 0) * cells) / chart.max);
  const cols = Math.ceil(Math.sqrt(cells * 2.2));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] leading-[1.4] text-ink/70">{b.label}</span>
        <Readout bar={b} t={t[0] ?? 0} className="shrink-0 text-[13px]" />
      </div>
      <div
        className="mt-2.5 grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className={`aspect-square ${i < filled ? "" : "bg-ink/[0.11]"}`}
            style={i < filled ? { background: "var(--accent)" } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/** Before and after, as the one shape that shows a change rather than two values. */
function Slope({ chart, t }: { chart: FindingChart; t: number[] }) {
  const n = chart.bars.length;
  const H = 74;
  // Inset, so the end points are not half-clipped by the card's edge.
  const pts = chart.bars.map((b, i) => ({
    x: n === 1 ? 50 : 6 + (i / (n - 1)) * 88,
    y: H - (b.value / chart.max) * H,
  }));
  const drawn = Math.min(...chart.bars.map((_, i) => t[i] ?? 0));

  return (
    <div>
      {/* The line is drawn in a non-uniformly scaled SVG, which is fine for a
          stroke and fatal for a circle — the points would render as ellipses.
          So the points are HTML on top, positioned in the same coordinates. */}
      <div className="relative h-[74px] w-full">
        <svg
          viewBox={`0 0 100 ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="300"
            strokeDashoffset={300 * (1 - drawn)}
          />
        </svg>
        {pts.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${(p.y / H) * 100}%`,
              background: "var(--accent)",
              opacity: t[i] ?? 0,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {chart.bars.map((b, i) => (
          <div
            key={b.label}
            className={`min-w-0 ${i === 0 ? "text-left" : i === n - 1 ? "text-right" : "text-center"}`}
          >
            <Readout bar={b} t={t[i] ?? 0} className="block text-[13px]" />
            <span className="mt-1 block text-[11px] leading-[1.35] text-ink/60">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A multiplier, as repeated units against the 1× rule it is a multiple of. */
function Multiple({ chart, t }: { chart: FindingChart; t: number[] }) {
  return (
    <div className="space-y-3">
      {chart.bars.map((b, i) => {
        const shown = b.value * (t[i] ?? 0);
        return (
          <div key={b.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] leading-[1.4] text-ink/70">{b.label}</span>
              <Readout bar={b} t={t[i] ?? 0} className="shrink-0 text-[12px]" />
            </div>
            <div className="mt-1.5 flex h-[10px] gap-[2px]" aria-hidden>
              {Array.from({ length: Math.round(chart.max) }, (_, u) => (
                <span
                  key={u}
                  className={`h-full flex-1 ${u < Math.round(shown) ? "" : "bg-ink/[0.09]"}`}
                  style={u < Math.round(shown) ? { background: "var(--accent)" } : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Three orders of magnitude, on a log axis.
 *
 * The alternative is a linear bar, where 3.4% is a stub and 0.03% is a blank
 * line — which reads as missing data instead of as the finding. The axis is
 * labelled as log on screen, because an unlabelled log scale is its own lie.
 */
function Dots({ chart, t }: { chart: FindingChart; t: number[] }) {
  const values = chart.bars.map((b) => b.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values, chart.max);
  const span = Math.log10(hi) - Math.log10(lo);
  const at = (v: number) => (span <= 0 ? 100 : ((Math.log10(v) - Math.log10(lo)) / span) * 100);

  return (
    <div>
      <div className="space-y-2.5">
        {chart.bars.map((b, i) => {
          const tt = t[i] ?? 0;
          return (
            <div key={b.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] leading-[1.4] text-ink/70">{b.label}</span>
                <Readout bar={b} t={tt} className="shrink-0 text-[12px]" />
              </div>
              <div className="relative mt-1.5 h-[9px]" aria-hidden>
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink/[0.14]" />
                <span
                  className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${at(b.value)}%`, background: "var(--accent)", opacity: tt }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/35">
        Log scale — each step is ten times the last
      </p>
    </div>
  );
}

const MARKS = {
  bars: Bars,
  ring: Ring,
  waffle: Waffle,
  slope: Slope,
  multiple: Multiple,
  dots: Dots,
  count: Count,
};

/* ── the walk ────────────────────────────────────────────────────────────── */

export function FigureChart({ chart }: { chart: FindingChart }) {
  const ref = useRef<HTMLElement | null>(null);
  const root = useContext(ChartViewport);
  const [t, setT] = useState<number[]>(() => chart.bars.map(() => 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(chart.bars.map(() => 1));
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

  const Mark = MARKS[chart.kind];

  return (
    <figure ref={ref} className="mt-4 border-t border-ink/[0.14] pt-4">
      <Mark chart={chart} t={t} />
      <figcaption className="mt-3 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.12em] text-ink/45">
        {chart.axis}
      </figcaption>
    </figure>
  );
}
