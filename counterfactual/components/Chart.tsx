"use client";

import { useMemo, useRef, useState } from "react";
import {
  type Figure,
  type Series,
  formatTick,
  formatValue,
  textWidth,
} from "@/lib/figures";

/* The chart surface, sampled from the 2026 AI Index chart PDFs and declared as
   project tokens rather than literals. It deliberately does NOT follow the
   atlas theme: the published reading has to look published, which means white
   paper and pure-black axes whatever the rest of the page is doing. */
const INK = "var(--chart-ink)";
const GRID = "var(--chart-grid)";
const SURFACE = "var(--chart-paper)";
const MUTED = "var(--chart-muted)";

const VB_W = 1008;
/* On a phone the card is about 350 CSS px wide, and a 1008-unit box scaled into
   it renders a 13-unit label at four and a half pixels: not small type, no type.
   The drawing does not change, the box around it does. Font sizes and the
   margins derived from them stay in absolute units, so shrinking the box is
   exactly the same thing as giving the labels more of it. */
const VB_W_COMPACT = 620;

const FS_BASE = { tick: 13, axisTitle: 13, endLabel: 14, legend: 14, annotation: 13, value: 13 };
/* Hero cards are half-width but carry the argument, so their type runs larger
   relative to a shorter plot. */
const FS_HERO: typeof FS_BASE = Object.fromEntries(
  Object.entries(FS_BASE).map(([n, v]) => [n, Math.round(v * 1.3)])
) as typeof FS_BASE;

/* ------------------------------------------------------------------ utilities */

function niceDomain(values: number[], padTop = 1.08): [number, number] {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const raw = max * padTop || 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].find((m) => raw <= mag * m)! * mag;
  return [min < 0 ? min : 0, step];
}

function ticksFrom(domain: [number, number], step: number): number[] {
  const out: number[] = [];
  /* Walk in integer multiples so 0.1 steps don't drift into 0.30000000000000004,
     and never emit a tick past the domain - that would draw outside the plot. */
  const n = Math.floor((domain[1] - domain[0]) / step + 1e-9);
  for (let i = 0; i <= n; i++) out.push(Number((domain[0] + i * step).toPrecision(12)));
  return out;
}

/** Push labels apart so stacked end-labels stay readable, as the source charts do. */
function declutter(items: { y: number; i: number }[], gap: number, top: number, bottom: number) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < gap) sorted[i].y = sorted[i - 1].y + gap;
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].y - bottom : 0;
  if (overflow > 0) for (const s of sorted) s.y -= overflow;
  for (const s of sorted) s.y = Math.max(top, s.y);
  const map = new Map<number, number>();
  for (const s of sorted) map.set(s.i, s.y);
  return map;
}

const hatch = (figureId: string, i: number) => `hatch-${figureId.replace(/\./g, "-")}-${i}`;

function wrapText(str: string, maxChars: number): string[] {
  const words = str.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else line = line ? line + " " + w : w;
  }
  if (line) lines.push(line);
  return lines;
}

/* --------------------------------------------------------------------- legend */

function Legend({
  figure,
  entries,
  x,
  y,
  anchor,
}: {
  figure: Figure;
  entries: Series[];
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}) {
  const FS = FS_BASE;
  const cols = figure.legend?.columns ?? 1;
  const shape = figure.legend?.shape ?? "square";
  const rows = Math.ceil(entries.length / cols);
  const rowH = 22;
  const lineH = 17;
  /* Rows grow for wrapped labels, so a two-line entry can't sit on the next one. */
  const heights = entries.map((e) => Math.max(rowH, e.label.split("\n").length * lineH + 5));
  const offsets: number[] = [];
  for (let c = 0; c < cols; c++) {
    let acc = 0;
    for (let r = 0; r < rows; r++) {
      const i = cols === 1 ? r : c * rows + r;
      if (i < entries.length) {
        offsets[i] = acc;
        acc += heights[i];
      }
    }
  }
  const colW =
    Math.max(
      ...entries.map((e) =>
        Math.max(...e.label.split("\n").map((l) => textWidth(l, FS.legend)))
      )
    ) + 46;
  const boxW = colW * cols + 8;
  const boxH =
    Math.max(
      ...Array.from({ length: cols }, (_, c) =>
        entries.reduce((s, _e, i) => {
          const inCol = cols === 1 ? true : Math.floor(i / rows) === c;
          return inCol ? s + heights[i] : s;
        }, 0)
      )
    ) + 12;
  const left = anchor === "start" ? x : anchor === "middle" ? x - boxW / 2 : x - boxW;

  return (
    <g>
      <rect x={left} y={y} width={boxW} height={boxH} fill={SURFACE} stroke={INK} strokeWidth={1} />
      {entries.map((e, i) => {
        const col = cols === 1 ? 0 : Math.floor(i / rows);
        const cx = left + 12 + col * colW;
        const cy = y + 12 + offsets[i];
        const lines = e.label.split("\n");
        return (
          <g key={e.key}>
            {shape === "dot" ? (
              <circle cx={cx + 7} cy={cy + 3} r={6.5} fill={e.color} />
            ) : shape === "line" ? (
              <line
                x1={cx}
                y1={cy + 3}
                x2={cx + 24}
                y2={cy + 3}
                stroke={e.color}
                strokeWidth={3.5}
                strokeDasharray={e.dashed ? "3 4" : undefined}
                strokeLinecap="round"
              />
            ) : (
              <rect x={cx} y={cy - 5} width={16} height={16} fill={e.color} />
            )}
            {lines.map((l, li) => (
              <text
                key={li}
                x={cx + (shape === "line" ? 32 : 24)}
                y={cy + 8 + li * lineH}
                fontSize={FS.legend}
                fill={INK}
              >
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ cartesian charts */

type HoverRow = { color: string; label: string; value: string; was?: string };
type HoverState = { x: number; y: number; rows: HoverRow[]; title: string };
type Hover = HoverState | null;

function CartesianChart({
  figure,
  cf,
  hero,
  compact,
  forceDomain,
}: {
  figure: Figure;
  cf?: Series[] | null;
  hero?: boolean;
  compact?: boolean;
  forceDomain?: [number, number];
}) {
  const VB = compact ? VB_W_COMPACT : VB_W;
  const [hover, setHover] = useState<Hover>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const FS = hero ? FS_HERO : FS_BASE;

  /* The reading layer is always mounted, whether or not an intervention is
     active, so its marks transition between the two readings in CSS rather than
     being torn down and rebuilt. */
  const drawn = cf ?? figure.series;

  const isCategory = figure.xAxis.type === "category";
  const stacked = figure.kind === "stackedBar";
  const logY = figure.yAxis.scale === "log";

  const geom = useMemo(() => {
    /* The axis has to hold both readings, or the comparison lies about itself. */
    const all = [...figure.series, ...(cf ?? [])].flatMap((s) => s.points);

    /* ---- y domain + ticks */
    let yTicks: number[];
    let yDomain: [number, number];
    if (logY) {
      yTicks = figure.yAxis.ticks!;
      yDomain = [Math.log10(yTicks[0]), Math.log10(yTicks[yTicks.length - 1])];
    } else {
      const stackTotalsOf = (ss: Series[]) =>
        ss[0].points.map((_, i) => ss.reduce((s, ser) => s + (ser.points[i]?.[1] ?? 0), 0));
      const totals = stacked
        ? [...stackTotalsOf(figure.series), ...(cf ? stackTotalsOf(cf) : [])]
        : all.map((p) => p[1]);
      yDomain = forceDomain ?? figure.yAxis.domain ?? niceDomain(totals);
      const step = figure.yAxis.tickStep ?? (yDomain[1] - yDomain[0]) / 5;
      /* A counterfactual that overshoots the published axis gets more axis rather
         than a clipped line. Same tick step, so the two readings stay comparable. */
      const peak = Math.max(...totals);
      /* A percentage axis has no business reaching 200% because the nice-number
         rounding said so. */
      if (figure.yAxis.format?.startsWith("pct") && peak <= 1 && yDomain[1] > 1)
        yDomain = [yDomain[0], 1];
      while (peak > yDomain[1]) yDomain = [yDomain[0], yDomain[1] + step];
      yTicks = ticksFrom(yDomain, step);
    }

    /* ---- x domain + ticks */
    const cats = figure.categories ?? [];
    let xTicks: number[];
    let xDomain: [number, number];
    if (isCategory) {
      xDomain = [-0.5, cats.length - 0.5];
      /* Sixteen rotated quarter labels under a half-width card is noise. */
      const every = hero && cats.length > 10 ? 4 : 1;
      xTicks = cats.map((_c, i) => i).filter((i) => (cats.length - 1 - i) % every === 0);
    } else {
      const xs = all.map((p) => p[0]);
      xDomain = figure.xAxis.domain ?? [Math.floor(Math.min(...xs)), Math.ceil(Math.max(...xs))];
      const step = figure.xAxis.tickStep ?? 1;
      xTicks = ticksFrom([Math.ceil(xDomain[0]), Math.floor(xDomain[1])], step);
      if (hero && xTicks.length > 9) {
        const every = Math.ceil(xTicks.length / 8);
        xTicks = xTicks.filter((_t, i) => (xTicks.length - 1 - i) % every === 0);
      }
    }

    /* ---- margins, sized to the text they must hold */
    const yTickLabels = (figure.yAxis.tickLabels ?? yTicks.map((t) => formatTick(t, figure.yAxis))) as string[];
    /* The board has no room for a sentence of axis title. */
    const yTitle = (hero && figure.yAxis.shortLabel) || figure.yAxis.label;
    const mLeft =
      (yTitle ? FS.axisTitle + 16 : 4) +
      Math.max(...yTickLabels.map((t) => textWidth(t, FS.tick))) +
      12;

    const fmt = figure.valueFormat ?? "trim2";
    const leadSeries = cf ?? figure.series;
    const endText = (ss: Series[], i: number) => {
      const v = ss[i].points.at(-1)![1];
      const base = figure.endLabelValueOnly
        ? formatValue(v, fmt)
        : `${formatValue(v, fmt)}, ${ss[i].label}`;
      if (!cf) return base;
      const was = figure.series[i]?.points.at(-1)?.[1];
      const now = cf[i]?.points.at(-1)?.[1];
      if (was === undefined || now === undefined || was === 0) return base;
      const pct = now === 0 ? -100 : Math.max(-99, Math.round((now / was - 1) * 100));
      return Math.abs(pct) < 1 ? base : `${base}  (${pct > 0 ? "+" : ""}${pct}%)`;
    };
    /* Sized against the settled reading so the plot doesn't breathe mid-morph. */
    const endTexts = figure.endLabels ? leadSeries.map((_s, i) => endText(leadSeries, i)) : [];
    const scatterLabelPad = figure.kind === "scatter" && figure.series.some((s) => s.pointLabels) ? 24 : 0;
    const mRight = figure.endLabels
      ? Math.max(...endTexts.map((t) => textWidth(t, FS.endLabel))) + 22
      : Math.max(16, scatterLabelPad);

    const legendBelow = figure.legend?.position === "below";
    const legendH = legendBelow
      ? 46 + Math.ceil(figure.series.length / (figure.legend?.columns ?? 1)) * 22
      : 0;
    const mTop = 20;
    const rotated = figure.xAxis.rotate ? 62 : 0;
    const mBottom = 28 + rotated + (figure.xAxis.label ? 28 : 0) + legendH;

    const plotH = compact
      ? hero
        ? 170
        : 300
      : hero
        ? 132
        : figure.kind === "scatter"
          ? 470
          : 440;
    const height = mTop + plotH + mBottom;
    /* Margins are text and text does not shrink, so on a narrow box they can
       add up to more than the box. Clamping the plot instead would push the
       drawing out past the viewBox, and an SVG with overflow visible paints it
       right across the card. So the box grows to hold what has to fit, and the
       chart simply renders a little smaller inside the same card. */
    const minPlot = compact ? 190 : 260;
    const vbW = Math.max(VB, mLeft + mRight + minPlot);
    const plotW = vbW - mLeft - mRight;

    /* Rounded so server and client serialise identically - full float precision
       stringifies differently in Node and the browser and trips hydration. */
    const px = (n: number) => Math.round(n * 100) / 100;
    const xOf = (v: number) => px(mLeft + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW);
    const yOf = (v: number) => {
      const t = logY ? Math.log10(Math.max(v, Number.MIN_VALUE)) : v;
      return px(mTop + plotH - ((t - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH);
    };

    const band = isCategory ? plotW / cats.length : 0;

    return {
      mLeft, mRight, mTop, mBottom, plotW, plotH, height, vbW,
      xDomain, yDomain, xTicks, yTicks, yTickLabels, xOf, yOf, band, cats, endTexts, endText, legendBelow, legendH, fmt, yTitle,
    };
  }, [figure, cf, isCategory, stacked, logY, hero, compact, forceDomain, FS, VB]);

  const {
    mLeft, mTop, plotW, plotH, height, vbW, yDomain, xTicks, yTicks, yTickLabels, xOf, yOf, band,
    cats, endText, legendBelow, legendH, fmt, yTitle,
  } = geom;

  const plotRight = mLeft + plotW;
  const plotBottom = mTop + plotH;

  /* When a counterfactual is showing, it becomes the reading: labels, totals and
     end values describe it, and the published series drops back to a ghost. */
  const lead = drawn;
  const ghosted = !!cf;

  /* ---- end-label placement */
  const endLabelY = figure.endLabels
    ? declutter(
        lead.map((s, i) => ({ y: yOf(s.points.at(-1)![1]), i })),
        19,
        mTop + 6,
        plotBottom
      )
    : new Map<number, number>();

  /* ---- stacked totals */
  const stackTotals = stacked
    ? lead[0].points.map((_, i) => lead.reduce((s, ser) => s + (ser.points[i]?.[1] ?? 0), 0))
    : [];

  const legendEntries = (figure.legendOrder
    ? figure.legendOrder.map((k) => figure.series.find((s) => s.key === k)!)
    : figure.series
  ).filter(Boolean);

  /* A mark the intervention did not move should not be drawn twice. Unchanged
     points stay solid and get no counterfactual twin, so what you see doubled is
     exactly what the transform touched. */
  const moved = (si: number, pi: number) =>
    !!cf && Math.abs((cf[si]?.points[pi]?.[1] ?? 0) - (figure.series[si]?.points[pi]?.[1] ?? 0)) > 1e-9;
  const anyMoved = !!cf && figure.series.some((s, si) => s.points.some((_p, pi) => moved(si, pi)));

  /* ---- marks
     Colour always follows the entity, never the scenario: the United States line
     stays blue in both readings. What separates them is stroke and fill:
     dashed lines and hatched bars for the thing that did not happen. */
  function renderMarks(series: Series[], variant: "actual" | "ghost" | "counterfactual") {
    const ghost = variant === "ghost";
    const isCf = variant === "counterfactual";
    /* The key must not encode the variant. The reading layer switches between
       "actual" and "counterfactual" in place, and a changed key would remount the
       element, which is exactly what kills the CSS transition. */
    const k = ghost ? "g" : "r";
    const bw = band * 0.62;

    if (figure.kind === "line")
      return series.map((s) => (
        <path
          key={`${k}${s.key}`}
          d={s.points
            .map((p, i) => `${i ? "L" : "M"}${xOf(p[0]).toFixed(2)},${yOf(p[1]).toFixed(2)}`)
            .join(" ")}
          style={{
            d: `path("${s.points
              .map((p, i) => `${i ? "L" : "M"}${xOf(p[0]).toFixed(2)},${yOf(p[1]).toFixed(2)}`)
              .join(" ")}")`,
          }}
          fill="none"
          stroke={s.color}
          strokeWidth={ghost ? 2 : hero ? 4 : 3.2}
          strokeDasharray={s.dashed ? "1 6" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={ghost ? 0.3 : 1}
          className="mark"
        />
      ));

    if (figure.kind === "bar")
      return series.map((s) =>
        s.points.map((p) => (
            <rect
              key={`${k}${s.key}${p[0]}`}
              x={mLeft + band * (p[0] + 0.5) - bw / 2}
              width={bw}
              style={{ y: `${yOf(p[1])}px`, height: `${Math.max(0, plotBottom - yOf(p[1]))}px` }}
              className="mark"
              fill={s.color}
              opacity={ghost ? 0.2 : 1}
            />
        ))
      );

    if (figure.kind === "stackedBar")
      return cats.map((_, i) => {
        /* A stack is one mark: if any segment moved, the whole bar is the
           counterfactual, otherwise none of it is. Skipping single segments
           would punch holes in the stack. */
        let acc = 0;
        return series.map((s) => {
          const v = s.points[i]?.[1] ?? 0;
          const y0 = yOf(acc);
          acc += v;
          const y1 = yOf(acc);
          return (
            <rect
              key={`${k}${s.key}${i}`}
              x={mLeft + band * (i + 0.5) - bw / 2}
              width={bw}
              style={{ y: `${y1}px`, height: `${Math.max(0, y0 - y1)}px` }}
              className="mark"
              fill={s.color}
              opacity={ghost ? 0.2 : 1}
            />
          );
        });
      });

    if (figure.kind === "scatter")
      return series.map((s) =>
        s.points.map((p, i) => (
            <circle
              key={`${k}${s.key}${i}`}
              r={isCf ? 5 : 4.6}
              style={{ cx: `${xOf(p[0])}px`, cy: `${yOf(p[1])}px` }}
              fill={s.color}
              className="mark"
              stroke={isCf ? INK : SURFACE}
              strokeWidth={isCf ? 1.2 : 0.75}
              opacity={ghost ? 0.18 : 1}
            />
        ))
      );

    return null;
  }

  /* ---- hover */
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * vbW;
    const vy = ((e.clientY - r.top) / r.height) * height;
    if (vx < mLeft - 4 || vx > plotRight + 4 || vy < mTop || vy > plotBottom) {
      setHover(null);
      return;
    }
    if (figure.kind === "scatter") {
      let best: { d: number; s: Series; p: [number, number] } | null = null;
      for (const s of figure.series)
        for (const p of s.points) {
          const d = (xOf(p[0]) - vx) ** 2 + (yOf(p[1]) - vy) ** 2;
          if (!best || d < best.d) best = { d, s, p };
        }
      if (!best || best.d > 900) return setHover(null);
      const pl = best.s.pointLabels?.[best.s.points.indexOf(best.p)];
      setHover({
        x: xOf(best.p[0]),
        y: yOf(best.p[1]),
        title: pl ?? `${Math.floor(best.p[0])}`,
        rows: [{ color: best.s.color, label: best.s.label, value: formatValue(best.p[1], fmt) }],
      });
      return;
    }
    /* nearest x index */
    const idx = isCategory
      ? Math.min(cats.length - 1, Math.max(0, Math.round((vx - mLeft - band / 2) / band)))
      : (() => {
          let bi = 0;
          let bd = Infinity;
          figure.series[0].points.forEach((p, i) => {
            const d = Math.abs(xOf(p[0]) - vx);
            if (d < bd) { bd = d; bi = i; }
          });
          return bi;
        })();
    const xv = isCategory ? idx : figure.series[0].points[idx][0];
    const at = (ss: Series[] | null | undefined, si: number) =>
      ss?.[si]?.points.find((q) => q[0] === (isCategory ? idx : xv));
    const rows = figure.series
      .map((s, si) => {
        const p = at(figure.series, si);
        if (!p) return null;
        const q = at(cf, si);
        return {
          color: s.color,
          label: s.label.replace(/\n/g, " "),
          value: q ? formatValue(q[1], fmt) : formatValue(p[1], fmt),
          was: q ? formatValue(p[1], fmt) : undefined,
        };
      })
      .filter(Boolean) as HoverRow[];
    if (!rows.length) return setHover(null);
    setHover({
      x: isCategory ? mLeft + band * (idx + 0.5) : xOf(xv),
      y: vy,
      title: isCategory ? cats[idx] : String(Math.round(xv)),
      rows,
    });
  }

  return (
    <div className="chart" style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${height}`}
        role="img"
        aria-label={figure.title}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* gridlines */}
        {yTicks.map((t) => (
          <line key={`gy${t}`} x1={mLeft} x2={plotRight} y1={yOf(logY ? t : t)} y2={yOf(logY ? t : t)} stroke={GRID} strokeWidth={1} />
        ))}
        {xTicks.map((t) => (
          <line
            key={`gx${t}`}
            x1={isCategory ? mLeft + band * (t + 0.5) : xOf(t)}
            x2={isCategory ? mLeft + band * (t + 0.5) : xOf(t)}
            y1={mTop}
            y2={plotBottom}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}

        {/* Where the published data stops. Everything right of this rule is the
            projection rule's output, not Stanford's. */}
        {figure.projection &&
          (() => {
            const bx = isCategory
              ? mLeft + band * (figure.projection.fromX + 0.5)
              : xOf(figure.projection.fromX);
            return (
              <g>
                <rect
                  x={bx}
                  y={mTop}
                  width={Math.max(0, plotRight - bx)}
                  height={plotH}
                  fill={INK}
                  opacity={0.035}
                />
                <line x1={bx} x2={bx} y1={mTop} y2={plotBottom} stroke={INK} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                {(() => {
                  /* The label starts at the boundary and runs right, which is
                     fine until the projected half is narrower than the words.
                     Then it hangs off the chart, so it flips and hangs back
                     inside instead. */
                  const label = figure.projection.label.toUpperCase();
                  const w = textWidth(label, FS.annotation) * 1.18;
                  const flip = bx + 7 + w > plotRight;
                  return (
                    <text
                      x={flip ? plotRight - 6 : bx + 7}
                      textAnchor={flip ? "end" : "start"}
                      /* Lines crowd the top of a saturating chart; bars crowd
                         the bottom. Put the marker wherever the marks are not. */
                      y={figure.kind === "line" ? plotBottom - 6 : mTop + FS.annotation + 2}
                      fontSize={FS.annotation}
                      fill={MUTED}
                      letterSpacing="0.08em"
                    >
                      {label}
                    </text>
                  );
                })()}
              </g>
            );
          })()}

        {/* reference lines */}
        {/* Reference lines stop earning their space once the axis dwarfs them:
            three "≈ 19 GW" markers stacked in the bottom eighth of a 100 GW
            chart are noise, not context. */}
        {figure.annotations
          ?.filter((a) => a.y >= yDomain[1] * 0.12)
          .map((a) => (
          <g key={a.label}>
            <line
              x1={mLeft}
              x2={plotRight}
              y1={yOf(a.y)}
              y2={yOf(a.y)}
              stroke={MUTED}
              strokeWidth={2}
              strokeDasharray="9 7"
            />
            <text
              x={mLeft + 10}
              y={yOf(a.y) - 8}
              fontSize={FS.annotation}
              fill={MUTED}
            >
              {a.label}
            </text>
          </g>
        ))}

        {/* The gap between the two readings, filled. This is the comparison,
            two lines alone are far too easy to read past. */}
        {figure.kind === "line" &&
          figure.series.map((s, i) => {
            const a = s.points;
            const b = drawn[i]?.points;
            if (!b || a.length !== b.length) return null;
            const fwd = a.map((p, j) => `${j ? "L" : "M"}${xOf(p[0])},${yOf(p[1])}`).join(" ");
            const back = [...b].reverse().map((p) => `L${xOf(p[0])},${yOf(p[1])}`).join(" ");
            return (
              <path
                key={`band${s.key}`}
                className="mark"
                d={`${fwd} ${back} Z`}
                style={{ d: `path("${fwd} ${back} Z")` }}
                fill={s.color}
                opacity={anyMoved ? 0.16 : 0}
              />
            );
          })}

        {/* The published reading sits underneath as a ghost; the layer on top is
            whichever reading is current, and it is never unmounted. */}
        {ghosted && renderMarks(figure.series, "ghost")}
        {renderMarks(drawn, cf ? "counterfactual" : "actual")}

        {/* Where the published reading actually was, drawn last so it reads on top
            of a counterfactual bar whether the bar shrank or grew. */}
        {cf && (figure.kind === "bar" || stacked) &&
          cats.map((_c, i) => {
            const was = stacked
              ? figure.series.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0)
              : figure.series[0].points[i]?.[1];
            const now = stacked
              ? drawn.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0)
              : drawn[0].points[i]?.[1];
            if (was === undefined || now === undefined || Math.abs(was - now) < 1e-9) return null;
            const bw = band * 0.62;
            return (
              <line
                key={`wl${i}`}
                x1={mLeft + band * (i + 0.5) - bw / 2 - 2}
                x2={mLeft + band * (i + 0.5) + bw / 2 + 2}
                y1={yOf(was)}
                y2={yOf(was)}
                stroke={INK}
                strokeWidth={1.6}
                opacity={0.55}
              />
            );
          })}

        {/* scatter point annotations */}
        {figure.series.map((s) =>
          s.pointLabels?.map((l, i) => {
            if (!l) return null;
            const pos = s.pointLabelPos?.[i] ?? { anchor: "end" as const, dx: -9, dy: -9 };
            return (
              <text
                key={`pl${i}`}
                x={xOf(s.points[i][0]) + pos.dx}
                y={yOf(s.points[i][1]) + pos.dy}
                fontSize={FS.value + 1}
                fill={INK}
                textAnchor={pos.anchor}
              >
                {l}
              </text>
            );
          })
        )}

        {/* value labels */}
        {figure.labelLast &&
          lead.map((s) => {
            const p = s.points.at(-1)!;
            return (
              <g key={`ll${s.key}`} className="mark" style={{ transform: `translateY(${yOf(p[1]) - 10}px)` }}>
                <text
                  x={mLeft + band * (p[0] + 0.5)}
                  fontSize={FS.value + 1}
                  fill={s.color}
                  textAnchor="middle"
                >
                  {formatValue(p[1], fmt)}
                </text>
              </g>
            );
          })}

        {stacked && (
          <>
            {figure.showTotals &&
              stackTotals.map((t, i) => (hero && i !== stackTotals.length - 1 ? null : (
                <g key={`t${i}`} className="mark" style={{ transform: `translateY(${yOf(t) - 9}px)` }}>
                  <text
                    x={mLeft + band * (i + 0.5)}
                    fontSize={FS.value}
                    fill={INK}
                    textAnchor="middle"
                  >
                    {formatValue(t, fmt)}
                  </text>
                </g>
              )))}
            {!hero && cats.map((_, i) => {
              let acc = 0;
              return lead.map((s) => {
                const v = s.points[i]?.[1] ?? 0;
                const y0 = yOf(acc);
                acc += v;
                const y1 = yOf(acc);
                if (y0 - y1 < 15) return null;
                /* white on the dark fills, ink on the pale ones - as in the original */
                const pale = ["#EAADFF", "#73D9FF", "#9CF2F2"].includes(s.color);
                return (
                  <text
                    key={`sv${s.key}${i}`}
                    x={mLeft + band * (i + 0.5)}
                    y={(y0 + y1) / 2 + 4}
                    fontSize={band < 55 ? 10 : FS.value - 1}
                    fill={pale ? INK : SURFACE}
                    textAnchor="middle"
                  >
                    {formatValue(v, fmt)}
                  </text>
                );
              });
            })}
          </>
        )}

        {/* end labels */}
        {figure.endLabels &&
          lead.map((s, i) => (
            <g
              key={`el${s.key}`}
              className="mark"
              style={{ transform: `translateY(${(endLabelY.get(i) ?? yOf(s.points.at(-1)![1])) + 5}px)` }}
            >
              <text x={plotRight + 10} fontSize={FS.endLabel} fill={s.color}>
                {endText(lead, i)}
              </text>
            </g>
          ))}

        {/* axes */}
        <line x1={mLeft} x2={mLeft} y1={mTop} y2={plotBottom} stroke={INK} strokeWidth={1.5} />
        <line x1={mLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke={INK} strokeWidth={1.5} />

        {yTicks.map((t, i) => (
          <text key={`yt${t}`} x={mLeft - 10} y={yOf(t) + 5} fontSize={FS.tick} fill={INK} textAnchor="end">
            {yTickLabels[i]}
          </text>
        ))}

        {xTicks.map((t) => {
          const cx = isCategory ? mLeft + band * (t + 0.5) : xOf(t);
          const label = isCategory ? cats[t] : formatTick(t, figure.xAxis);
          return figure.xAxis.rotate ? (
            <text
              key={`xt${t}`}
              x={cx}
              y={plotBottom + 16}
              fontSize={FS.tick}
              fill={INK}
              textAnchor="end"
              transform={`rotate(${figure.xAxis.rotate} ${cx} ${plotBottom + 16})`}
            >
              {label}
            </text>
          ) : (
            <text key={`xt${t}`} x={cx} y={plotBottom + 22} fontSize={FS.tick} fill={INK} textAnchor="middle">
              {label}
            </text>
          );
        })}

        {yTitle && (
          <text
            transform={`rotate(-90 2 ${mTop + plotH / 2})`}
            x={2}
            y={mTop + plotH / 2}
            /* A long title is scaled down rather than allowed to overrun the plot. */
            fontSize={Math.min(FS.axisTitle, (plotH - 8) / (yTitle.length * 0.56))}
            fill={INK}
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {yTitle}
          </text>
        )}
        {figure.xAxis.label && (
          <text
            x={mLeft + plotW / 2}
            y={height - legendH - 6}
            fontSize={FS.axisTitle}
            fill={INK}
            textAnchor="middle"
          >
            {figure.xAxis.label}
          </text>
        )}

        {/* legend */}
        {figure.legend?.position === "top-left" && !hero && (
          <Legend figure={figure} entries={legendEntries} x={mLeft + 14} y={mTop + 8} anchor="start" />
        )}
        {figure.legend?.position === "top-right" && !hero && (
          <Legend figure={figure} entries={legendEntries} x={plotRight - 4} y={mTop + 4} anchor="end" />
        )}
        {figure.legend?.position === "top" && !hero && (
          <Legend figure={figure} entries={legendEntries} x={mLeft + 22} y={mTop + 2} anchor="start" />
        )}
        {legendBelow && !hero && (
          <Legend
            figure={figure}
            entries={legendEntries}
            x={mLeft + plotW / 2}
            y={plotBottom + 56}
            anchor="middle"
          />
        )}

        {/* hover crosshair */}
        {hover && figure.kind !== "scatter" && (
          <line x1={hover.x} x2={hover.x} y1={mTop} y2={plotBottom} stroke={INK} strokeWidth={1} opacity={0.35} />
        )}
        {hover && figure.kind === "scatter" && (
          <circle cx={hover.x} cy={hover.y} r={8} fill="none" stroke={INK} strokeWidth={1.5} />
        )}
      </svg>

      {hover && (
        <Tooltip hover={hover} vbW={vbW} vbH={height} />
      )}
    </div>
  );
}

/* --------------------------------------------------------- horizontal bar charts */

function HorizontalChart({
  figure,
  cf,
  compact,
}: {
  figure: Figure;
  cf?: Series[] | null;
  compact?: boolean;
}) {
  const VB = compact ? VB_W_COMPACT : VB_W;
  const [hover, setHover] = useState<Hover>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const FS = FS_BASE;
  const cats = figure.categories!;
  const grouped = figure.kind === "groupedHBar";
  const fmt = figure.valueFormat ?? "pct0";

  const maxChars = grouped ? 34 : 22;
  const wrapped = cats.map((c) => wrapText(c, maxChars));
  const lineH = 20;
  const rowH = grouped ? Math.max(58, Math.max(...wrapped.map((w) => w.length)) * lineH + 18) : 40;

  const mLeft = Math.max(...wrapped.flat().map((l) => textWidth(l, FS.tick))) + 20;
  const mRight = 70;
  const mTop = 14;
  const mBottom = 56;
  const minPlot = compact ? 170 : 240;
  const vbW = Math.max(VB, mLeft + mRight + minPlot);
  const plotW = vbW - mLeft - mRight;
  const plotH = rowH * cats.length;
  const height = mTop + plotH + mBottom + (figure.legend?.position === "bottom-right" ? 0 : 0);

  const domain = (figure.xAxis.domain ?? [0, 1]) as [number, number];
  const xOf = (v: number) =>
    Math.round((mLeft + ((v - domain[0]) / (domain[1] - domain[0])) * plotW) * 100) / 100;
  const xTicks = ticksFrom(domain, figure.xAxis.tickStep ?? 0.1);
  const plotBottom = mTop + plotH;

  const barH = grouped ? Math.min(13, (rowH - 16) / figure.series.length) : 12;

  return (
    <div className="chart" style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${height}`}
        role="img"
        aria-label={figure.title}
        onPointerLeave={() => setHover(null)}
      >
        {cf && (
          <defs>
            {figure.series.map((s, i) => (
              <pattern
                key={i}
                id={hatch(figure.id, i)}
                width={7}
                height={7}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width={7} height={7} fill={SURFACE} />
                <rect width={3.6} height={7} fill={s.color} />
              </pattern>
            ))}
          </defs>
        )}
        {xTicks.map((t) => (
          <line key={t} x1={xOf(t)} x2={xOf(t)} y1={mTop} y2={plotBottom} stroke={GRID} strokeWidth={1} />
        ))}

        {cats.map((c, ci) => {
          const rowTop = mTop + ci * rowH;
          const groupH = figure.series.filter((s) => s.points.some((p) => p[0] === ci)).length * (barH + 2);
          const startY = rowTop + (rowH - groupH) / 2;
          let k = 0;
          return (
            <g key={c}>
              {figure.series.map((s, si) => {
                const p = s.points.find((q) => q[0] === ci);
                if (!p) return null;
                const cq = cf?.[si]?.points.find((r) => r[0] === ci);
                const q = cq && Math.abs(cq[1] - p[1]) > 1e-9 ? cq : undefined;
                const y = grouped ? startY + k++ * (barH + 2) : rowTop + (rowH - barH) / 2;
                const shown = q ?? p;
                return (
                  <g
                    key={s.key}
                    onPointerEnter={() =>
                      setHover({
                        x: xOf(shown[1]),
                        y: y + barH / 2,
                        title: c,
                        rows: [
                          { color: s.color, label: s.label, value: formatValue(shown[1], fmt) },
                          ...(q ? [{ color: "var(--hairline)", label: "as published", value: formatValue(p[1], fmt) }] : []),
                        ],
                      })
                    }
                  >
                    <rect
                      x={mLeft}
                      y={y}
                      width={Math.max(0, xOf(p[1]) - mLeft)}
                      height={barH}
                      fill={s.color}
                      opacity={q ? 0.22 : 1}
                    />
                    {q && (
                      <rect
                        x={mLeft}
                        y={y}
                        width={Math.max(0, xOf(q[1]) - mLeft)}
                        height={barH}
                        fill={`url(#${hatch(figure.id, si)})`}
                        stroke={s.color}
                        strokeWidth={1.2}
                      />
                    )}
                    {figure.labelAll && (
                      <text x={xOf(shown[1]) + 6} y={y + barH - 1} fontSize={FS.value + 1} fill={s.color}>
                        {formatValue(shown[1], fmt)}
                      </text>
                    )}
                  </g>
                );
              })}
              {wrapped[ci].map((l, li) => (
                <text
                  key={li}
                  x={mLeft - 10}
                  y={rowTop + rowH / 2 - ((wrapped[ci].length - 1) * lineH) / 2 + li * lineH + 5}
                  fontSize={FS.tick}
                  fill={INK}
                  textAnchor="end"
                >
                  {l}
                </text>
              ))}
            </g>
          );
        })}

        <line x1={mLeft} x2={mLeft} y1={mTop} y2={plotBottom} stroke={INK} strokeWidth={1.5} />
        <line x1={mLeft} x2={mLeft + plotW} y1={plotBottom} y2={plotBottom} stroke={INK} strokeWidth={1.5} />

        {xTicks.map((t) => (
          <text key={`x${t}`} x={xOf(t)} y={plotBottom + 22} fontSize={FS.tick} fill={INK} textAnchor="middle">
            {formatTick(t, figure.xAxis)}
          </text>
        ))}
        {figure.xAxis.label && (
          <text x={mLeft + plotW / 2} y={height - 12} fontSize={FS.axisTitle} fill={INK} textAnchor="middle">
            {figure.xAxis.label}
          </text>
        )}

        {figure.legend?.position === "bottom-right" && (
          <Legend
            figure={figure}
            entries={figure.series}
            x={mLeft + plotW - 4}
            y={plotBottom - 26 - figure.series.length * 22}
            anchor="end"
          />
        )}
      </svg>
      {hover && <Tooltip hover={hover} vbW={vbW} vbH={height} />}
    </div>
  );
}

/* -------------------------------------------------------------------- tooltip */

function Tooltip({ hover, vbW, vbH }: { hover: HoverState; vbW: number; vbH: number }) {
  const left = (hover.x / vbW) * 100;
  const top = (hover.y / vbH) * 100;
  const flip = left > 60;
  return (
    <div
      className="tooltip"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
      }}
    >
      <div className="tooltip-title">{hover.title}</div>
      {hover.rows.map((r, i) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-swatch" style={{ background: r.color }} />
          <span className="tooltip-label">{r.label}</span>
          {r.was && <span className="tooltip-was">{r.was}</span>}
          <span className="tooltip-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------- entry */

export default function Chart({
  figure,
  cf,
  hero,
  compact,
  forceDomain,
}: {
  figure: Figure;
  cf?: Series[] | null;
  hero?: boolean;
  /** The card is phone-width, so the drawing gets a smaller box to fill. */
  compact?: boolean;
  forceDomain?: [number, number];
}) {
  return figure.kind === "hbar" || figure.kind === "groupedHBar" ? (
    <HorizontalChart figure={figure} cf={cf} compact={compact} />
  ) : (
    <CartesianChart figure={figure} cf={cf} hero={hero} compact={compact} forceDomain={forceDomain} />
  );
}
