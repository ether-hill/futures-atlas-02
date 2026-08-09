"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SECTORS, VLABEL, type Sector } from "../../data/sectors";
import {
  sectorStat, expectedOf, sensitivityLabel, leanLabel,
  type CardStat, type SectorStat,
} from "./stats-math";
import { Reveal, CountUp, useInView } from "./Reveal";
import { SectorExplorer } from "./SectorExplorer";
import { demoCounters } from "./demo-data";

const MIN_N = 3;       // a claim needs this many swipes before it goes on a chart
const MIN_SECTOR = 20; // and a sector this many answers before it's ranked

// Diverging pair, validated for CVD separation against both the dark and light
// surface. Oxblood = the crowd bought something that hasn't happened; blue = it
// doubted something that has. Slate is the neutral midpoint, not a third category.
const C_DOUBT = "#3E93D8";   // blind spot
const C_BELIEVE = "#D8694E"; // hype trap
const C_MID = "#8A96A6";
const COLOURS = { believe: C_BELIEVE, doubt: C_DOUBT, mid: C_MID };

/** Below this the miss is noise, not a finding. */
const OFF = 0.12;

const pct = (x: number) => `${Math.round(x * 100)}%`;
const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

type Tip = { x: number; y: number; title: string; lines: string[] } | null;

export default function StatsView() {
  const [counters, setCounters] = useState<Record<string, string> | null>(null);
  const [generated, setGenerated] = useState<Sector[]>([]);
  const [err, setErr] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [tip, setTip] = useState<Tip>(null);
  const [rocTip, setRocTip] = useState<Tip>(null);
  const [spreadTip, setSpreadTip] = useState<Tip>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const rocRef = useRef<HTMLDivElement | null>(null);
  const spreadRef = useRef<HTMLDivElement | null>(null);
  const { ref: plotSeenRef, seen: plotSeen } = useInView<HTMLDivElement>();
  const { ref: rocSeenRef, seen: rocSeen } = useInView<HTMLDivElement>();
  const { ref: spreadSeenRef } = useInView<HTMLDivElement>();

  // Read once on load. The tallies move as people play, so there is a refresh
  // rather than a poll: nobody needs this page ticking in a background tab.
  const load = useCallback(() => {
    // Sample data fills the page with synthetic tallies so the layout and the
    // patterns can be read on a full deck. It is used when ?demo is set, and as
    // the fallback whenever the real tally is still empty, which is the state
    // the page is in before anyone has played. Either way it is labelled
    // loudly. ?real forces the true (possibly empty) view.
    const q = typeof window !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
    const useDemo = () => { setCounters(demoCounters()); setDemo(true); setFetchedAt(new Date()); };
    if (q.has("demo")) { useDemo(); return; }

    setLoading(true);
    Promise.all([
      fetch("/api/swipe?v=2", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/swipe/sector", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([c, g]) => {
        if (Array.isArray(g?.sectors)) setGenerated(g.sectors);
        if (!q.has("real") && Number(c?.swipes ?? 0) === 0) { useDemo(); setErr(false); return; }
        setCounters(c ?? {});
        setDemo(false);
        setFetchedAt(new Date());
        setErr(false);
      })
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const n = (k: string) => Number(counters?.[k] ?? 0);

  const cards: CardStat[] = useMemo(() => {
    if (!counters) return [];
    return [...SECTORS, ...generated].flatMap((s) =>
      s.cards.map((c) => {
        const real = Number(counters[`c:${c.id}:r`] ?? 0);
        const notYet = Number(counters[`c:${c.id}:n`] ?? 0);
        const total = real + notYet;
        const expected = expectedOf(c.verdict);
        const pReal = total ? real / total : 0;
        return {
          id: c.id, claim: c.claim, short: c.short ?? c.claim, verdict: c.verdict, sector: s.name, sectorId: s.id,
          real, notYet, n: total, pReal, expected, gap: pReal - expected,
        };
      }),
    );
  }, [counters, generated]);

  const plotted = useMemo(() => cards.filter((c) => c.n >= MIN_N), [cards]);
  const heldBack = cards.filter((c) => c.n > 0 && c.n < MIN_N).length;
  const seen = cards.filter((c) => c.n > 0).length;

  const cardsBySector = useMemo(() => {
    const m = new Map<string, CardStat[]>();
    for (const c of cards) {
      if (!m.has(c.sectorId)) m.set(c.sectorId, []);
      m.get(c.sectorId)!.push(c);
    }
    return m;
  }, [cards]);

  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cards) m.set(c.sectorId, c.sector);
    return m;
  }, [cards]);

  /** Every sector with any traffic; the explorer shows all of these. */
  const allSectors: SectorStat[] = useMemo(() =>
    [...cardsBySector.entries()]
      .map(([id, cs]) => sectorStat(id, names.get(id) ?? id, cs))
      .filter((s): s is SectorStat => s !== null && s.n > 0)
      .sort((a, b) => b.n - a.n),
    [cardsBySector, names]);

  /** The ranked table and the ROC plot only take sectors with enough answers. */
  const ranked = useMemo(() =>
    allSectors.filter((s) => s.n >= MIN_SECTOR)
      .sort((a, b) => Number(b.measurable) - Number(a.measurable) || b.dPrime - a.dPrime),
    [allSectors]);

  const swipes = n("swipes"), saidReal = n("real"), saidNotYet = n("notyet");
  const aligned = n("aligned"), rounds = n("rounds");

  /** Sorted most-over-believed first, so the chart reads top to bottom as one story. */
  const ordered = useMemo(() => [...plotted].sort((a, b) => b.gap - a.gap), [plotted]);
  const hypeTraps = ordered.filter((c) => c.verdict === "notyet" && c.gap > OFF).slice(0, 5);
  const blindSpots = [...ordered].reverse().filter((c) => c.verdict === "already" && c.gap < -OFF).slice(0, 5);
  const wellRead = plotted.filter((c) => Math.abs(c.gap) <= OFF).length;

  if (err) return <Shell><p className="st-msg">Couldn&apos;t reach the metrics store.</p></Shell>;
  if (!counters) return <Shell><p className="st-msg">Loading…</p></Shell>;
  if (swipes === 0) return <Shell><p className="st-msg">No swipes recorded yet. Once people start playing, this page fills in.</p></Shell>;

  // ── 01 · the miss chart ────────────────────────────────────────────────
  // One row per claim, a bar from the centre line. The answer is binary, so
  // "how true is it" is not an axis any more, it is which side of zero a claim
  // sits on. Length is how far the room was from the answer; direction is which
  // of the two mistakes it made.
  // A row is anonymous without its name, and hover is not a label: the chart
  // has to read on a printed page and in the exported PNG too. So the left
  // quarter is a reserved column for the short form of each claim.
  const ROW = 15, GW = 1000;
  const GP = { t: 58, r: 24, b: 62, l: 272 };
  const GH = GP.t + GP.b + Math.max(1, ordered.length) * ROW;
  const mid = GW / 2;
  const half = (GW - GP.l - GP.r) / 2;
  const gx = (g: number) => mid + g * half;
  const rowY = (i: number) => GP.t + i * ROW + ROW / 2;
  const colourOf = (gap: number) => (gap > OFF ? C_BELIEVE : gap < -OFF ? C_DOUBT : C_MID);

  // ── 02b · the same misses, grouped by sector ──────────────────────────
  // Section 01 sorts every claim into one global ranking, which answers "what
  // did we get worst" but loses "who owns it". One row per sector, with that
  // sector's claims scattered either side of the truth line, answers the second
  // question: how far a sector's misses spread, and which way they lean.
  const SW = 900, SROW = 62;
  const SP = { t: 56, r: 112, b: 42, l: 168 };
  const spreadSectors = allSectors.filter((sec) => (cardsBySector.get(sec.id) ?? []).some((c) => c.n >= MIN_N));
  const SH = SP.t + SP.b + Math.max(1, spreadSectors.length) * SROW;
  const smid = SP.l + (SW - SP.l - SP.r) / 2;
  const shalf = (SW - SP.l - SP.r) / 2;
  const sx = (g: number) => smid + g * shalf;
  const srowY = (i: number) => SP.t + i * SROW + SROW / 2;
  /** Deterministic vertical nudge, so claims at the same gap don't stack up. */
  const nudge = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return (((h >>> 0) % 1000) / 1000 - 0.5) * (SROW - 26);
  };

  // ── 03 · sector discrimination, in ROC space ───────────────────────────
  // The plot has a reserved label column on the right. Sectors that score alike
  // sit on top of each other, and names placed next to their own dots turn into
  // one smudge; stacking them in a gutter with leader lines cannot collide no
  // matter how tightly the dots cluster.
  const RW = 820, RH = 520, RP = { t: 40, r: 232, b: 76, l: 68 };
  const rx = (u: number) => RP.l + u * (RW - RP.l - RP.r);
  const ry = (u: number) => RH - RP.b - u * (RH - RP.t - RP.b);
  const LABEL_X = RW - RP.r + 26;

  const rocPlaced = (() => {
    const rows = ranked.filter((s) => s.measurable)
      .map((s, i) => ({
        s, i,
        cx: rx(s.faRate), cy: ry(s.hitRate),
        r: Math.min(14, 5 + Math.sqrt(s.n) * 0.5),
      }))
      .sort((a, b) => a.cy - b.cy); // top of the plot first, so leaders don't cross
    let last = -Infinity;
    return rows.map((row) => {
      const ly = Math.max(row.cy, last + 17, RP.t + 8);
      last = ly;
      return { ...row, ly };
    });
  })();

  /** Rasterise a chart. The SVG leans on stylesheet rules, so the clone gets an
   *  inline <style> and an opaque ground, otherwise the PNG comes out bare. */
  const downloadPng = (
    host: HTMLDivElement | null, w: number, h: number, filename: string,
  ) => {
    const svg = host?.querySelector("svg");
    if (!svg) return;
    const css = getComputedStyle(document.documentElement);
    const ink2 = css.getPropertyValue("--ink-2").trim() || "#1d1f23";
    const bone = css.getPropertyValue("--bone").trim() || "#f2ede2";
    const faint = css.getPropertyValue("--faint").trim() || "#8b877f";
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // the live SVG sizes itself from CSS; without explicit attributes the
    // rasteriser falls back to a default box and the PNG comes out tiny
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      text { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
      .st-grid { stroke: ${faint}; stroke-opacity: .18; stroke-width: 1; }
      .st-axis { stroke: ${faint}; stroke-opacity: .5; stroke-width: 1; }
      .st-zeroline { stroke: ${faint}; stroke-opacity: .65; stroke-width: 1.5; }
      .st-diag { stroke: ${faint}; stroke-opacity: .6; stroke-width: 1.5; stroke-dasharray: 5 5; fill: none; }
      .st-tick { fill: ${faint}; font-size: 10px; }
      .st-tick.end { text-anchor: end; } .st-tick.mid { text-anchor: middle; }
      .st-axlbl { fill: ${faint}; font-size: 10px; letter-spacing: .14em; }
      .st-axlbl.mid { text-anchor: middle; } .st-axlbl.end { text-anchor: end; }
      .st-quad { font-size: 10.5px; font-weight: 700; letter-spacing: .14em; }
      .st-quadsub { fill: ${faint}; font-family: system-ui, sans-serif; font-size: 10.5px; }
      .st-quad.end, .st-quadsub.end { text-anchor: end; }
      .st-quad.start, .st-quadsub.start { text-anchor: start; }
      .st-bar2 { fill-opacity: .85; }
      .st-dot { stroke: ${ink2}; stroke-width: 2; fill-opacity: .82; }
      .st-rlbl { fill: ${bone}; font-family: system-ui, sans-serif; font-size: 10px; }
      .st-legend { fill: ${bone}; font-family: system-ui, sans-serif; font-size: 11px; }
      .st-legend.dim { fill: ${faint}; }
    `;
    clone.insertBefore(style, clone.firstChild);
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", String(w)); bg.setAttribute("height", String(h)); bg.setAttribute("fill", ink2);
    clone.insertBefore(bg, style.nextSibling);

    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((out) => { if (out) save(out, filename); }, "image/png");
    };
    img.src = url;
  };

  const today = () => new Date().toISOString().slice(0, 10);

  /** One row per claim, so the numbers can be checked outside this page. */
  const downloadCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["claim", "sector", "answer", "expected_share_already", "said_already", "said_not_yet", "pct_said_already", "swipes", "gap"],
      ...[...cards].sort((a, b) => b.n - a.n).map((c) => [
        c.claim, c.sector, VLABEL[c.verdict], c.expected, c.real, c.notYet,
        c.n ? c.pReal.toFixed(4) : "", c.n, c.n ? c.gap.toFixed(4) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    save(new Blob([csv], { type: "text/csv;charset=utf-8" }), `swipe-the-future-${today()}.csv`);
  };

  const tipAt = (
    e: React.MouseEvent, host: HTMLDivElement | null,
    set: (t: Tip) => void, title: string, lines: string[],
  ) => {
    const box = host?.getBoundingClientRect();
    if (!box) return;
    set({ x: e.clientX - box.left, y: e.clientY - box.top, title, lines });
  };

  return (
    <Shell>
      <Reveal as="div" className="st-grid">
        <Tile n={swipes} k="swipes" />
        <Tile n={rounds} k="rounds finished" />
        <Tile n={swipes ? saidReal / swipes : 0} k={`said already real · ${pct(swipes ? saidNotYet / swipes : 0)} said not yet`} isPct />
        <Tile n={swipes ? aligned / swipes : 0} k="got it right" isPct />
      </Reveal>

      {demo && (
        <p className="st-demo">
          <b>Sample data.</b> Nobody has played this deck yet, so these are invented numbers, shown
          so the page can be read with a full deck behind it. Nothing here is a real answer.
          <a href="/swipe-the-future/stats/?real">See the real tally</a>
        </p>
      )}

      <p className="st-fresh">
        {demo
          ? "Sample data, generated in your browser."
          : fetchedAt
          ? `Counted at ${fetchedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. The page reads the tally once when it loads, it does not tick along on its own.`
          : "Reading the tally…"}
        <button className="st-refresh" onClick={load} disabled={loading}>{loading ? "refreshing…" : "refresh"}</button>
      </p>

      {/* ── 01 ───────────────────────────────────────────────────────────── */}
      <Reveal className="st-sec">
        <span className="st-kicker">01, every claim, ranked by how wrong we were</span>
        <h2>The Reality Gap</h2>
        <p className="st-lede">
          Each card has one right answer: it happened, or it hasn&apos;t. So every claim can be placed
          on a single line. <em>The centre is the truth.</em> A bar to the right means the room said it
          had already happened when it had not. A bar to the left means the room said not yet about
          something that has been running for years. Length is how far off we were, and a claim
          nobody missed has no bar at all.
        </p>

        {plotted.length === 0 ? (
          <div className="st-plotwrap empty">
            <p className="st-msg sm">
              No claim has {MIN_N} swipes yet, so there is nothing honest to chart. It appears as soon
              as the deck has been played enough. {seen} of {cards.length} claims have been seen at
              least once so far.
            </p>
          </div>
        ) : (
          <>
            <div className="st-plotwrap" ref={plotRef} onMouseLeave={() => setTip(null)}>
              <div ref={plotSeenRef}>
                <svg viewBox={`0 0 ${GW} ${GH}`} className="st-plot" role="img"
                  aria-label="Every claim as a bar from a centre line: right means the crowd thought it had already happened when it had not, left means it doubted something already real.">
                  {/* quadrant headers */}
                  <text x={mid - 14} y={GP.t - 30} className="st-quad end" fill={C_DOUBT}>BLIND SPOTS</text>
                  <text x={mid - 14} y={GP.t - 16} className="st-quadsub end">already real, we said not yet</text>
                  <text x={mid + 14} y={GP.t - 30} className="st-quad start" fill={C_BELIEVE}>HYPE TRAPS</text>
                  <text x={mid + 14} y={GP.t - 16} className="st-quadsub start">hasn&apos;t happened, we said it had</text>

                  {[-1, -0.5, 0.5, 1].map((g) => (
                    <line key={`g${g}`} x1={gx(g)} x2={gx(g)} y1={GP.t - 6} y2={GH - GP.b + 6} className="st-grid" />
                  ))}

                  {/* the name of every row, not just the extremes */}
                  {ordered.map((c, i) => (
                    <text key={`l${c.id}`} x={GP.l - 16} y={rowY(i) + 3.5} className="st-rowlbl" textAnchor="end">
                      {clip(c.short, 34)}
                    </text>
                  ))}

                  <g className={`st-bars${plotSeen ? " in" : ""}`}>
                    {ordered.map((c, i) => {
                      const y = rowY(i);
                      const w = Math.abs(c.gap) * half;
                      const x = c.gap >= 0 ? mid : mid - w;
                      return (
                        <g key={c.id} style={{ animationDelay: `${Math.min(i * 14, 700)}ms` }}>
                          <rect
                            x={x} y={y - ROW / 2 + 1.5} width={Math.max(w, 1.5)} height={ROW - 3} rx={2}
                            fill={colourOf(c.gap)} className={`st-bar2${c.gap < 0 ? " neg" : ""}`}
                            onMouseMove={(e) => tipAt(e, plotRef.current, setTip, c.claim, [
                              `${c.sector} · answer: ${VLABEL[c.verdict]}`,
                              `${pct(c.pReal)} said already real · ${c.n} swipes`,
                              c.gap > OFF ? "Hype trap: bought a thing that hasn't happened"
                                : c.gap < -OFF ? "Blind spot: doubted a thing that has"
                                : "Read about right",
                            ])}
                          >
                            <title>{`${c.claim}, ${pct(c.pReal)} said already real (answer: ${VLABEL[c.verdict]}, ${c.n} swipes)`}</title>
                          </rect>
                        </g>
                      );
                    })}
                  </g>

                  {/* the truth line, drawn over the bars so it always reads */}
                  <line x1={mid} x2={mid} y1={GP.t - 6} y2={GH - GP.b + 6} className="st-zeroline" />

                  <line x1={GP.l} x2={GW - GP.r} y1={GH - GP.b + 6} y2={GH - GP.b + 6} className="st-axis" />
                  {[-1, -0.5, 0, 0.5, 1].map((g) => (
                    <text key={`t${g}`} x={gx(g)} y={GH - GP.b + 24} className="st-tick mid">
                      {g === 0 ? "right" : `${Math.abs(g) * 100}% out`}
                    </text>
                  ))}
                  <text x={mid} y={GH - 22} className="st-axlbl mid">HOW FAR THE ROOM SAT FROM THE ANSWER</text>
                </svg>
              </div>
              {tip && (
                <div className="st-tip" style={{ left: tip.x, top: tip.y }}>
                  <b>{tip.title}</b>
                  {tip.lines.map((l) => <span key={l}>{l}</span>)}
                </div>
              )}
            </div>
            <div className="st-underchart">
              <p className="st-note">
                {plotted.length} of {cards.length} claims have enough swipes to chart
                {heldBack > 0 ? `, ${heldBack} more are still under ${MIN_N} and held back` : ""}.
                {wellRead > 0 ? ` ${wellRead} of them the room read about right.` : ""}
              </p>
              <div className="st-actions">
                <button className="st-btn" onClick={() => downloadPng(plotRef.current, GW, GH, `reality-gap-${today()}.png`)}>Download map (PNG)</button>
                <button className="st-btn" onClick={downloadCsv}>Download data (CSV)</button>
              </div>
            </div>
          </>
        )}
      </Reveal>

      {/* ── 02 ───────────────────────────────────────────────────────────── */}
      <Reveal className="st-sec">
        <span className="st-kicker">02, sector by sector, claim by claim</span>
        <h2>Where each sector stands</h2>
        <p className="st-lede">
          Open a sector to see every claim in it and how the room split. The bar under each claim is
          the vote: green for the share who said it had already happened, red for the share who said
          not yet.
        </p>
        <SectorExplorer sectors={allSectors} cardsBySector={cardsBySector} colours={COLOURS} />
      </Reveal>

      {/* ── 02b ──────────────────────────────────────────────────────────── */}
      {spreadSectors.length > 0 && (
        <Reveal className="st-sec">
          <span className="st-kicker">02b, the same misses, by sector</span>
          <h2>Which way each sector leans</h2>
          <p className="st-lede">
            Every claim is either a hype trap or a blind spot, never both, so a sector fits on one
            line with its claims spread either side of the truth. A row bunched on the right is a
            sector we buy too easily. A row bunched on the left is one we keep underestimating. A row
            spread across both is a sector nobody has a clock on at all.
          </p>
          <div className="st-plotwrap" ref={spreadRef} onMouseLeave={() => setSpreadTip(null)}>
            <div ref={spreadSeenRef}>
              <svg viewBox={`0 0 ${SW} ${SH}`} className="st-plot" role="img"
                aria-label="One row per sector, with each of its claims placed by how far the crowd sat from the answer.">
                <text x={sx(-0.55)} y={SP.t - 26} className="st-quad mid" fill={C_DOUBT}>← BLIND SPOTS</text>
                <text x={smid} y={SP.t - 26} className="st-quadsub mid">accurate</text>
                <text x={sx(0.55)} y={SP.t - 26} className="st-quad mid" fill={C_BELIEVE}>HYPE TRAPS →</text>

                {spreadSectors.map((sec, i) => {
                  const cs = (cardsBySector.get(sec.id) ?? []).filter((c) => c.n >= MIN_N);
                  return (
                    <g key={sec.id} style={{ animationDelay: `${Math.min(i * 70, 700)}ms` }}>
                      <line x1={SP.l - 8} x2={SW - SP.r} y1={srowY(i) + SROW / 2 - 1} y2={srowY(i) + SROW / 2 - 1} className="st-grid" />
                      <text x={SP.l - 24} y={srowY(i) + 4} className="st-rowlbl" textAnchor="end">{clip(sec.name, 22)}</text>
                      <line x1={smid} x2={smid} y1={srowY(i) - SROW / 2 + 6} y2={srowY(i) + SROW / 2 - 6} className="st-zeroline" />
                      {cs.map((c) => (
                        <circle
                          key={c.id} cx={sx(Math.max(-1, Math.min(1, c.gap)))} cy={srowY(i) + nudge(c.id)}
                          r={Math.min(11, 4.5 + Math.sqrt(c.n) * 0.55)}
                          fill={colourOf(c.gap)} className="st-dot"
                          onMouseMove={(e) => tipAt(e, spreadRef.current, setSpreadTip, c.claim, [
                            `${c.sector} · answer: ${VLABEL[c.verdict]}`,
                            `${pct(c.pReal)} said already real · ${c.n} swipes`,
                          ])}
                        >
                          <title>{`${c.claim}, ${pct(c.pReal)} said already real`}</title>
                        </circle>
                      ))}
                      <text x={SW - SP.r + 20} y={srowY(i) + 4} className="st-rowlbl">{pct(sec.accuracy)} right</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {spreadTip && (
              <div className="st-tip" style={{ left: spreadTip.x, top: spreadTip.y }}>
                <b>{spreadTip.title}</b>
                {spreadTip.lines.map((l) => <span key={l}>{l}</span>)}
              </div>
            )}
          </div>
          <div className="st-underchart">
            <p className="st-note">Bigger dot = more swipes behind that claim. Only claims with {MIN_N} or more are shown.</p>
            <div className="st-actions">
              <button className="st-btn" onClick={() => downloadPng(spreadRef.current, SW, SH, `sector-spread-${today()}.png`)}>Download plot (PNG)</button>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── 03 ───────────────────────────────────────────────────────────── */}
      <Reveal className="st-sec">
        <span className="st-kicker">03, the underlying skill</span>
        <h2>Can people tell what shipped from what didn&apos;t?</h2>
        <p className="st-lede">
          Two different things get muddled when someone gets a claim wrong. One is whether they can
          <em> tell the difference</em> at all between a thing that happened and a thing that hasn&apos;t.
          The other is which way they lean when they can&apos;t tell. Guessing in one direction is a
          lean, not ignorance, and it is fixable in a way the first thing isn&apos;t. So they are
          measured separately: they are <em>d′</em> and <em>criterion</em>, if you want the textbook names.
        </p>

        {ranked.filter((s) => s.measurable).length >= 2 && (
          <>
            <p className="st-lede sm">
              The plot below is the standard way to show both at once. Across is how often a sector
              said &ldquo;already real&rdquo; about something that has <em>not</em> happened. Up is how often
              it said &ldquo;already real&rdquo; about something that <em>has</em>. On the dashed line the two
              rates are equal, which is what pure guessing looks like: the further above the line a
              sector sits, the more it is genuinely telling them apart. Sliding along the line, up and
              right, is a crowd that says &ldquo;already real&rdquo; more often about everything.
            </p>
            <div className="st-plotwrap roc" ref={rocRef} onMouseLeave={() => setRocTip(null)}>
              <div ref={rocSeenRef}>
                <svg viewBox={`0 0 ${RW} ${RH}`} className="st-plot" role="img"
                  aria-label="Each sector plotted by how often it spotted things that had happened against how often it wrongly claimed things had happened.">
                  {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <g key={`rg${p}`}>
                      <line x1={rx(0)} x2={rx(1)} y1={ry(p)} y2={ry(p)} className="st-grid" />
                      <line x1={rx(p)} x2={rx(p)} y1={ry(0)} y2={ry(1)} className="st-grid" />
                      <text x={RP.l - 10} y={ry(p) + 4} className="st-tick end">{pct(p)}</text>
                      <text x={rx(p)} y={RH - RP.b + 18} className="st-tick mid">{pct(p)}</text>
                    </g>
                  ))}
                  <line x1={rx(0)} x2={rx(0)} y1={ry(0)} y2={ry(1)} className="st-axis" />
                  <line x1={rx(0)} x2={rx(1)} y1={ry(0)} y2={ry(0)} className="st-axis" />
                  <line x1={rx(0)} x2={rx(1)} y1={ry(0)} y2={ry(1)} className="st-diag" />

                  <text x={RP.l} y={RP.t - 14} className="st-axlbl">SPOTTED WHAT HAD HAPPENED</text>
                  <text x={(rx(0) + rx(1)) / 2} y={RH - 22} className="st-axlbl mid">WRONGLY CALLED IT ALREADY REAL</text>
                  <text x={rx(0.80)} y={ry(0.76)} className="st-quadsub start">guessing</text>

                  {/* What each corner means, in words. A reader who has never met
                      an ROC curve can still place a dot without decoding the axes. */}
                  <text x={rx(0.03)} y={ry(0.97)} className="st-quadsub start" fill={C_MID}>reads both right</text>
                  {/* both of these sit on the diagonal at the corner, so they are
                      pulled off it rather than printed through the dashes */}
                  <text x={rx(0.96)} y={ry(0.90)} className="st-quadsub end" fill={C_BELIEVE}>says already to everything</text>
                  <text x={rx(0.06)} y={ry(0.02)} className="st-quadsub start" fill={C_DOUBT}>says not yet to everything</text>

                  <g className={`st-dots${rocSeen ? " in" : ""}`}>
                    {rocPlaced.map(({ s, i, cx, cy, r, ly }) => (
                      <g key={s.id} style={{ animationDelay: `${Math.min(i * 60, 700)}ms` }}>
                        <circle
                          cx={cx} cy={cy} r={r}
                          fill={s.lean > 0.35 ? C_BELIEVE : s.lean < -0.35 ? C_DOUBT : C_MID}
                          className="st-dot"
                          onMouseMove={(e) => tipAt(e, rocRef.current, setRocTip, s.name, [
                            `spotted ${pct(s.hitRate)} of what had happened`,
                            `wrongly claimed ${pct(s.faRate)} of what hadn't`,
                            `d′ ${s.dPrime.toFixed(2)} · ${sensitivityLabel(s.dPrime)} · ${s.n} answers`,
                          ])}
                        >
                          <title>{`${s.name}: hit rate ${pct(s.hitRate)}, false-alarm rate ${pct(s.faRate)}, d′ ${s.dPrime.toFixed(2)}`}</title>
                        </circle>
                        {/* leader line from the dot out to its row in the gutter */}
                        <line x1={cx + r + 2} y1={cy} x2={LABEL_X - 6} y2={ly - 3} className="st-grid" />
                        <text x={LABEL_X} y={ly} className="st-rlbl">{clip(s.name, 24)}</text>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>
              {rocTip && (
                <div className="st-tip" style={{ left: rocTip.x, top: rocTip.y }}>
                  <b>{rocTip.title}</b>
                  {rocTip.lines.map((l) => <span key={l}>{l}</span>)}
                </div>
              )}
            </div>
            <div className="st-underchart">
              <p className="st-note">Bigger dot = more answers behind it.</p>
              <div className="st-actions">
                <button className="st-btn" onClick={() => downloadPng(rocRef.current, RW, RH, `sector-discrimination-${today()}.png`)}>Download plot (PNG)</button>
              </div>
            </div>
          </>
        )}

        {ranked.length ? (
          <div className="st-tablewrap">
            <table className="st-table st-sectors">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th>Can tell shipped from not<span className="st-scale"><i>coin flip</i><i>sharp</i></span></th>
                  <th>When unsure, the crowd…<span className="st-scale"><i>says not yet</i><i>says already</i></span></th>
                  <th className="num">Got it right</th>
                  <th className="num">n</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s, i) => (
                  <tr key={s.id} style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }} className="st-trow">
                    <td className="st-secname">{s.name}</td>
                    {s.measurable ? (
                      <>
                        <td>
                          <div className="st-bar" title={`d′ ${s.dPrime.toFixed(2)}`}>
                            <span className="st-barfill" style={{ width: `${Math.min(100, (s.dPrime / 3) * 100)}%`, background: C_DOUBT }} />
                          </div>
                          <span className="st-barlbl">{sensitivityLabel(s.dPrime)} · d′ {s.dPrime.toFixed(2)}</span>
                        </td>
                        <td>
                          <div className="st-diverge" title={`criterion ${(-s.lean).toFixed(2)}`}>
                            <span className="st-zero" />
                            <span
                              className="st-divfill"
                              style={{
                                left: s.lean >= 0 ? "50%" : `${50 - Math.min(50, (Math.abs(s.lean) / 1.5) * 50)}%`,
                                width: `${Math.min(50, (Math.abs(s.lean) / 1.5) * 50)}%`,
                                background: s.lean >= 0 ? C_BELIEVE : C_DOUBT,
                              }}
                            />
                          </div>
                          <span className="st-barlbl">{leanLabel(s.lean)}</span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={2}>
                        <span className="st-barlbl na">
                          Not measurable here: every answer in this deck has landed on one side of the
                          key, so there is nothing to tell apart yet. Accuracy still counts.
                        </span>
                      </td>
                    )}
                    <td className="num">
                      {pct(s.accuracy)}
                      <span className="st-ci">{pct(s.lo)}–{pct(s.hi)}</span>
                    </td>
                    <td className="num">{s.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="st-msg sm">No sector has {MIN_SECTOR} answers yet. This table fills in as people play.</p>
        )}
        <p className="st-note">
          d′ of 0 means a coin flip; around 1 is a real signal; 2 and up is sharp. The lean bar runs
          from &ldquo;says not yet&rdquo; on the left to &ldquo;says already&rdquo; on the right. Every card counts
          in both, because every card has a right answer. The small range under each accuracy is a 95%
          confidence interval, so a sector with 22 answers doesn&apos;t get to look as certain as one
          with 2,000.
        </p>
      </Reveal>

      {/* ── 04 ───────────────────────────────────────────────────────────── */}
      <Reveal className="st-sec">
        <span className="st-kicker">04, the two ways to be wrong</span>
        <h2>Hype traps and blind spots</h2>
        <div className="st-two">
          <div>
            <h3 style={{ color: C_BELIEVE }}>Hype traps</h3>
            <p className="st-sublede">Hasn&apos;t happened. We said it had.</p>
            <p className="st-para">
              A hype trap is something that was announced, demonstrated, promised or proposed, and
              filed in memory as done. They are what a good story leaves behind: a confident launch
              demo, a number quoted away from the caveat that came with it, a bill that was tabled
              and never passed. They cluster where the marketing is loudest and the checking is
              hardest. They are the expensive kind of wrong, because budgets, hiring and policy get
              set on them.
            </p>
            {hypeTraps.length ? hypeTraps.map((c, i) => (
              <div className="st-row" key={c.id} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="st-rowpct" style={{ color: C_BELIEVE }}>{pct(c.pReal)}</span>
                <span className="st-rowtxt"><b>{c.claim}</b><span>said already real · {c.sector} · {c.n} swipes</span></span>
              </div>
            )) : <p className="st-msg sm">Nothing here yet. Either nobody has been caught by one, or not enough people have played.</p>}
          </div>
          <div>
            <h3 style={{ color: C_DOUBT }}>Blind spots</h3>
            <p className="st-sublede">Already real. We said not yet.</p>
            <p className="st-para">
              A blind spot is the mirror image: something that has been working for years and that
              people still will not have. These are quieter, because nothing markets the ordinary
              Tuesday on which a thing quietly started working, and a capability that arrives without
              a launch event tends to arrive without anyone updating. Several of them here are
              decades old. They are arguably the more costly of the two: while you are waiting for a
              future to show up, somebody else is already using it.
            </p>
            {blindSpots.length ? blindSpots.map((c, i) => (
              <div className="st-row" key={c.id} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="st-rowpct" style={{ color: C_DOUBT }}>{pct(1 - c.pReal)}</span>
                <span className="st-rowtxt"><b>{c.claim}</b><span>said not yet · {c.sector} · {c.n} swipes</span></span>
              </div>
            )) : <p className="st-msg sm">Nothing here yet. Either we are reading these right, or not enough people have played.</p>}
          </div>
        </div>
      </Reveal>

      <p className="st-foot">
        Every figure here is the live tally of anonymous swipes. Nothing about who swiped is recorded.
        <a href="/swipe-the-future"> Back to the deck →</a>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="st-page">
      <header className="st-head">
        <span className="eyebrow">Futures Atlas · № 01 · Calibration</span>
        <h1>What everyone <em>actually</em> thinks has happened.</h1>
        <p className="st-intro">
          Every swipe on Swipe the Future is one person&apos;s guess at whether a thing has already
          happened, checked against a sourced answer. Enough of them together stop being a game and
          start being a measurement: which futures we buy before they arrive, which ones arrived
          without us noticing, and which sectors people can read at all.
        </p>
      </header>
      {children}
    </main>
  );
}

function Tile({ n, k, isPct = false }: { n: number; k: string; isPct?: boolean }) {
  return (
    <div className="st-tile">
      <span className="st-tv">
        {isPct
          ? <CountUp to={Math.round(n * 100)} format={(v) => `${v}%`} />
          : <CountUp to={n} />}
      </span>
      <span className="st-tk">{k}</span>
    </div>
  );
}
