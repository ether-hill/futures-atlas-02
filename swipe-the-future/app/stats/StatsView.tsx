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
  const [showAll, setShowAll] = useState(false);
  const [tip, setTip] = useState<Tip>(null);
  const [rocTip, setRocTip] = useState<Tip>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const rocRef = useRef<HTMLDivElement | null>(null);
  const { ref: plotSeenRef, seen: plotSeen } = useInView<HTMLDivElement>();
  const { ref: rocSeenRef, seen: rocSeen } = useInView<HTMLDivElement>();

  // Read once on load. The tallies move as people play, so there is a refresh
  // rather than a poll: nobody needs this page ticking in a background tab.
  const load = useCallback(() => {
    // Sample data fills the page with synthetic tallies so the layout and the
    // patterns can be read on a full deck. It is used when ?demo is set, and as
    // the fallback whenever the real tally is still empty, which is the state
    // the page is in before anyone has played. Either way it is labelled
    // loudly. ?real forces the true (possibly empty) view.
    const q = typeof window !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
    const showSample = () => { setCounters(demoCounters()); setDemo(true); setFetchedAt(new Date()); };
    if (q.has("demo")) { showSample(); return; }

    setLoading(true);
    Promise.all([
      fetch("/api/swipe?v=2", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/swipe/sector", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([c, g]) => {
        if (Array.isArray(g?.sectors)) setGenerated(g.sectors);
        if (!q.has("real") && Number(c?.swipes ?? 0) === 0) { showSample(); setErr(false); return; }
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

  /** The table and the ROC plot only take sectors with enough answers.
   *  Ordered by how much evidence is behind each one, NOT by score: sorting by
   *  d′ reads as a league table, and at a few hundred answers a sector these
   *  accuracies are usually a few points apart with overlapping intervals. */
  const ranked = useMemo(() =>
    allSectors.filter((s) => s.n >= MIN_SECTOR).sort((a, b) => b.n - a.n),
    [allSectors]);

  /** True when every sector's accuracy interval overlaps every other's, i.e.
   *  the differences on show are not differences at all yet. */
  const indistinguishable = useMemo(() => {
    const m = ranked.filter((x) => x.measurable);
    if (m.length < 2) return false;
    return m.every((a) => m.every((b) => a.lo <= b.hi && b.lo <= a.hi));
  }, [ranked]);

  const swipes = n("swipes");

  // The headline used to be one accuracy figure, which collapses the two error
  // types the rest of the page exists to keep apart. These are the signed pair.
  //   CREDULITY  of the things that have NOT happened, how often we said they had
  //   SCEPTICISM of the things that HAVE happened, how often we said they hadn't
  // Net is credulity minus scepticism: positive leans gullible, negative leans
  // in denial, zero means the two mistakes cancel (which is not the same as
  // making neither).
  const rates = (() => {
    let faN = 0, fa = 0, missN = 0, miss = 0;
    for (const c of cards) {
      if (c.n === 0) continue;
      if (c.verdict === "notyet") { faN += c.n; fa += c.real; }
      else { missN += c.n; miss += c.notYet; }
    }
    return {
      credulity: faN ? fa / faN : 0,
      scepticism: missN ? miss / missN : 0,
      net: (faN ? fa / faN : 0) - (missN ? miss / missN : 0),
      any: faN > 0 && missN > 0,
    };
  })();
  const widest = plotted.reduce<CardStat | null>((w, c) => (!w || Math.abs(c.gap) > Math.abs(w.gap) ? c : w), null);

  /** Sorted most-over-believed first, so the chart reads top to bottom as one story. */
  const orderedAll = useMemo(() => [...plotted].sort((a, b) => b.gap - a.gap), [plotted]);
  // Forty labelled rows are unreadable at the width this sits in. The ends are
  // where the finding is, so the default is the ten worst each way and the
  // middle is available on request rather than gone.
  const TOP = 10;
  const trimmed = orderedAll.length > TOP * 2;
  const ordered = showAll || !trimmed
    ? orderedAll
    : [...orderedAll.slice(0, TOP), ...orderedAll.slice(-TOP)];
  const hidden = orderedAll.length - ordered.length;
  const hypeTraps = ordered.filter((c) => c.verdict === "notyet" && c.gap > OFF).slice(0, 5);
  const blindSpots = [...ordered].reverse().filter((c) => c.verdict === "already" && c.gap < -OFF).slice(0, 5);
  const wellRead = plotted.filter((c) => Math.abs(c.gap) <= OFF).length;

  if (err) return <Shell demo={demo}><p className="st-msg">Couldn&apos;t reach the metrics store.</p></Shell>;
  if (!counters) return <Shell demo={demo}><p className="st-msg">Loading…</p></Shell>;
  if (swipes === 0) return <Shell demo={demo}><p className="st-msg">No swipes recorded yet. Once people start playing, this page fills in.</p></Shell>;

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
  // When the middle is elided, the two halves are pushed apart so the "n hidden"
  // marker has somewhere to sit; printed on the join it landed on the labels
  // either side of it.
  const GAP = hidden > 0 ? 26 : 0;
  const GH = GP.t + GP.b + GAP + Math.max(1, ordered.length) * ROW;
  const half = (GW - GP.l - GP.r) / 2;
  // The centre of the PLOT, not of the canvas. Once the label column went in,
  // the two stopped being the same place, and bars kept running left underneath
  // their own labels.
  const mid = GP.l + half;
  // A fixed ±100% domain wastes most of the width, because a crowd is rarely
  // more than 60 points from an answer. The axis takes the widest actual miss,
  // rounded up to a tenth, so the bars use the space they were given. The tick
  // labels carry the scale, so nothing is overstated by the zoom.
  const DOM = Math.max(0.3, Math.min(1, Math.ceil(Math.max(...orderedAll.map((c) => Math.abs(c.gap)), 0.3) * 10) / 10));
  const gx = (g: number) => mid + (g / DOM) * half;
  const rowY = (i: number) => GP.t + i * ROW + ROW / 2 + (hidden > 0 && i >= TOP ? GAP : 0);
  const colourOf = (gap: number) => (gap > OFF ? C_BELIEVE : gap < -OFF ? C_DOUBT : C_MID);

  // ── 03 · sector discrimination, in ROC space ───────────────────────────
  // The plot has a reserved label column on the right. Sectors that score alike
  // sit on top of each other, and names placed next to their own dots turn into
  // one smudge; stacking them in a gutter with leader lines cannot collide no
  // matter how tightly the dots cluster.
  const RW = 640, RH = 520, RP = { t: 46, r: 40, b: 76, l: 68 };
  const rx = (u: number) => RP.l + u * (RW - RP.l - RP.r);
  const ry = (u: number) => RH - RP.b - u * (RH - RP.t - RP.b);
  // Labels sit ON the plot beside their own dot, which is what makes a scatter
  // readable at a glance. Dots that score alike would print their names on top
  // of each other, so each label is placed above its dot and stepped down until
  // it finds a clear slot. Deterministic, so nothing reshuffles between renders.
  const rocPlaced = (() => {
    const taken: { x: number; y: number }[] = [];
    return ranked.filter((s) => s.measurable)
      .map((s, i) => ({ s, i, cx: rx(s.faRate), cy: ry(s.hitRate), r: Math.min(14, 5 + Math.sqrt(s.n) * 0.5) }))
      .sort((a, b) => a.cy - b.cy)
      .map((row) => {
        const right = row.cx < RW * 0.6;
        const lx = right ? row.cx + row.r + 7 : row.cx - row.r - 7;
        let ly = row.cy - row.r - 6;
        while (taken.some((t) => Math.abs(t.x - lx) < 150 && Math.abs(t.y - ly) < 13)) ly -= 13;
        if (ly < RP.t + 10) { ly = row.cy + row.r + 13; while (taken.some((t) => Math.abs(t.x - lx) < 150 && Math.abs(t.y - ly) < 13)) ly += 13; }
        taken.push({ x: lx, y: ly });
        // Only a label that had to move needs a leader; drawing one to every dot
        // just adds lines to a chart that reads fine without them.
        const moved = Math.abs(ly - (row.cy - row.r - 6)) > 3;
        return { ...row, lx, ly, moved, anchor: right ? ("start" as const) : ("end" as const) };
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
    <Shell demo={demo}>
      <Reveal as="div" className="st-grid">
        <Tile n={rates.credulity} k="credulity · said it had happened, it hadn't" isPct tone={C_BELIEVE} />
        <Tile n={rates.scepticism} k="scepticism · said not yet, it already had" isPct tone={C_DOUBT} />
        <Tile
          n={Math.abs(rates.net)}
          k={rates.net > 0.02 ? "net lean toward buying it" : rates.net < -0.02 ? "net lean toward doubting it" : "net lean, the two cancel"}
          isPct
          tone={Math.abs(rates.net) < 0.02 ? C_MID : rates.net > 0 ? C_BELIEVE : C_DOUBT}
        />
        {widest
          ? <Tile n={Math.abs(widest.gap)} k={`widest gap · ${clip(widest.short, 30)}`} isPct tone={C_MID} />
          : <Tile n={swipes} k="swipes" />}
      </Reveal>

      <p className="st-fresh">
        {`${swipes.toLocaleString("en-GB")} swipes. `}
        {demo
          ? "Sample data, generated in your browser."
          : fetchedAt
          ? `Counted at ${fetchedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. The page reads the tally once when it loads, it does not tick along on its own.`
          : "Reading the tally…"}
        <button className="st-refresh" onClick={load} disabled={loading}>{loading ? "refreshing…" : "refresh"}</button>
      </p>

      {/* ── 01 ───────────────────────────────────────────────────────────── */}
      <Reveal className="st-sec">
        <span className="st-kicker">01, the two ways to be wrong</span>
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
          <div className="st-split">
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
                    {rocPlaced.map(({ s, i, cx, cy, r, lx, ly, moved, anchor }) => (
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
                        {moved && <line x1={cx} y1={cy - r - 1} x2={lx + (anchor === "start" ? 2 : -2)} y2={ly + 3} className="st-grid" />}
                        <text x={lx} y={ly} className="st-rlbl" textAnchor={anchor}>{clip(s.name, 24)}</text>
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
            <div className="st-underchart span2">
              <p className="st-note">
                <span className="st-key"><i style={{ background: C_DOUBT }} />leans toward doubting</span>
                <span className="st-key"><i style={{ background: C_MID }} />even-handed</span>
                <span className="st-key"><i style={{ background: C_BELIEVE }} />leans toward buying it</span>
                Bigger dot = more answers behind it.
                {indistinguishable ? " At this sample size every sector's accuracy interval overlaps every other's, so treat their positions as one cluster, not a ranking." : ""}
              </p>
              <div className="st-actions">
                <button className="st-btn" onClick={() => downloadPng(rocRef.current, RW, RH, `sector-discrimination-${today()}.png`)}>Download plot (PNG)</button>
              </div>
            </div>
          </div>
        )}

        {ranked.length ? (
          <div className="st-tablewrap">
            {indistinguishable && (
              <p className="st-note warn">
                These sectors are not yet telling apart from one another: every accuracy interval
                below overlaps every other. The rows are ordered by how many answers are behind them,
                deliberately, so the table is not read as a league table it cannot support.
              </p>
            )}
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
        <span className="st-kicker">04, the whole deck, claim by claim</span>
        <h2>Every claim, worst miss first</h2>
        <p className="st-lede">
          The reference exhibit: the whole deck on one line. <em>The centre is the truth.</em> A bar to
          the right means the room said it had already happened when it had not. A bar to the left
          means the room said not yet about something that has been running for years. Length is how
          far off we were, and a claim nobody missed has no bar at all.
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

                  {[-DOM, -DOM / 2, DOM / 2, DOM].map((g) => (
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
                      const w = (Math.abs(c.gap) / DOM) * half;
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

                  {/* the elided middle, marked rather than silently missing */}
                  {hidden > 0 && (
                    <g>
                      <line
                        x1={GP.l - 8} x2={GW - GP.r} y1={rowY(TOP) - ROW / 2 - GAP / 2} y2={rowY(TOP) - ROW / 2 - GAP / 2}
                        className="st-grid" strokeDasharray="3 4"
                      />
                      <text x={GP.l - 16} y={rowY(TOP) - ROW / 2 - GAP / 2 + 3.5} className="st-rowlbl" textAnchor="end">
                        {hidden} closer calls hidden
                      </text>
                    </g>
                  )}

                  {/* the truth line, drawn over the bars so it always reads */}
                  <line x1={mid} x2={mid} y1={GP.t - 6} y2={GH - GP.b + 6} className="st-zeroline" />

                  <line x1={GP.l} x2={GW - GP.r} y1={GH - GP.b + 6} y2={GH - GP.b + 6} className="st-axis" />
                  {[-DOM, -DOM / 2, 0, DOM / 2, DOM].map((g) => (
                    <text key={`t${g}`} x={gx(g)} y={GH - GP.b + 24} className="st-tick mid">
                      {g === 0 ? "right" : `${Math.round(Math.abs(g) * 100)}% out`}
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
                {trimmed && (
                  <button className="st-btn" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? `Show the ${TOP} worst each way` : `Show all ${orderedAll.length}`}
                  </button>
                )}
                <button className="st-btn" onClick={() => downloadPng(plotRef.current, GW, GH, `reality-gap-${today()}.png`)}>Download map (PNG)</button>
                <button className="st-btn" onClick={downloadCsv}>Download data (CSV)</button>
              </div>
            </div>
          </>
        )}
      </Reveal>

      <p className="st-foot">
        Every figure here is the live tally of anonymous swipes. Nothing about who swiped is recorded.
        <a href="/swipe-the-future"> Back to the deck →</a>
      </p>
    </Shell>
  );
}

function Shell({ children, demo = false }: { children: React.ReactNode; demo?: boolean }) {
  return (
    <main className="st-page">
      {demo && (
        <div className="st-demobar" role="status">
          <b>None of this is real.</b>
          <span>
            Nobody has played this deck yet, so every number on this page is invented, generated in
            your browser so the layout can be read with a full deck behind it.
          </span>
          <a href="/swipe-the-future/stats/?real">Show the real tally</a>
        </div>
      )}
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

function Tile({ n, k, isPct = false, tone }: { n: number; k: string; isPct?: boolean; tone?: string }) {
  return (
    <div className="st-tile">
      <span className="st-tv" style={tone ? { color: tone } : undefined}>
        {isPct
          ? <CountUp to={Math.round(n * 100)} format={(v) => `${v}%`} />
          : <CountUp to={n} />}
      </span>
      <span className="st-tk">{k}</span>
    </div>
  );
}
