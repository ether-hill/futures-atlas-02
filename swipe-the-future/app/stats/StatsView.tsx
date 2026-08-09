"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SECTORS, VLABEL, type Sector } from "../../data/sectors";
import {
  sectorStat, expectedOf, rungOf, sensitivityLabel, leanLabel,
  type CardStat, type SectorStat,
} from "./stats-math";
import { Reveal, CountUp, useInView } from "./Reveal";
import { SectorExplorer } from "./SectorExplorer";

const MIN_N = 3;       // a claim needs this many swipes before it goes on the plot
const MIN_SECTOR = 20; // and a sector this many scorable answers before it's ranked

// Diverging pair, validated for CVD separation against both the dark and light
// surface. Blue = the crowd is more sceptical than the evidence; oxblood = more
// credulous. Slate is the neutral midpoint, not a third category.
const C_DOUBT = "#3E93D8";
const C_BELIEVE = "#D8694E";
const C_MID = "#8A96A6";
const COLOURS = { believe: C_BELIEVE, doubt: C_DOUBT, mid: C_MID };

const pct = (x: number) => `${Math.round(x * 100)}%`;

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
  const [tip, setTip] = useState<Tip>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const { ref: plotSeenRef, seen: plotSeen } = useInView<HTMLDivElement>();

  // Read once on load. The tallies move as people play, so there is a refresh
  // rather than a poll: nobody needs this page ticking in a background tab.
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/swipe", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/swipe/sector", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([c, g]) => {
        setCounters(c ?? {});
        if (Array.isArray(g?.sectors)) setGenerated(g.sectors);
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
        const yes = Number(counters[`c:${c.id}:b`] ?? 0);
        const no = Number(counters[`c:${c.id}:d`] ?? 0);
        const total = yes + no;
        const expected = expectedOf(c.verdict);
        const pTrue = total ? yes / total : 0;
        return {
          id: c.id, claim: c.claim, verdict: c.verdict, sector: s.name, sectorId: s.id,
          yes, no, n: total, pTrue, expected, rung: rungOf(c.verdict), gap: pTrue - expected,
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

  /** Every sector with any traffic, the explorer shows all of these. */
  const allSectors: SectorStat[] = useMemo(() =>
    [...cardsBySector.entries()]
      .map(([id, cs]) => sectorStat(id, names.get(id) ?? id, cs))
      .filter((s): s is SectorStat => s !== null && s.n > 0)
      .sort((a, b) => b.n - a.n),
    [cardsBySector, names]);

  /** The ranked table only shows sectors with enough answers to rank honestly. */
  const ranked = useMemo(() =>
    allSectors.filter((s) => s.n >= MIN_SECTOR)
      .sort((a, b) => Number(b.measurable) - Number(a.measurable) || b.dPrime - a.dPrime),
    [allSectors]);

  const swipes = n("swipes"), believe = n("believe"), doubt = n("doubt");
  const aligned = n("aligned"), scored = n("scored"), rounds = n("rounds");

  const hypeTraps = [...plotted].filter((c) => c.verdict === "unlikely" && c.gap > 0.12).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const blindSpots = [...plotted].filter((c) => (c.verdict === "already" || c.verdict === "likely") && c.gap < -0.12).sort((a, b) => a.gap - b.gap).slice(0, 5);

  if (err) return <Shell><p className="st-msg">Couldn&apos;t reach the metrics store.</p></Shell>;
  if (!counters) return <Shell><p className="st-msg">Loading…</p></Shell>;
  if (swipes === 0) return <Shell><p className="st-msg">No swipes recorded yet. Once people start playing, this page fills in.</p></Shell>;

  // ── Reality Gap plot geometry ──────────────────────────────────────────
  // The evidence scale is ordinal, four rungs, not a ruler, so the columns are
  // evenly spaced and the reference line bends through each rung's actual truth
  // value. Dots are jittered inside their column (deterministically, off the card
  // id) because otherwise every claim lands on four vertical lines.
  const W = 780, H = 560, P = { t: 46, r: 74, b: 116, l: 62 };
  const px = (u: number) => P.l + u * (W - P.l - P.r);
  const py = (p: number) => H - P.b - p * (H - P.t - P.b);
  const rOf = (k: number) => Math.min(15, 4.5 + Math.sqrt(k) * 1.25);
  const colourOf = (gap: number) => (gap > 0.12 ? C_BELIEVE : gap < -0.12 ? C_DOUBT : C_MID);
  const jitter = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return ((h >>> 0) % 1000) / 1000 - 0.5; // −0.5 … 0.5, stable per claim
  };
  const slotU = (i: number) => 0.07 + (i / 3) * 0.88;
  const dotX = (c: CardStat) => px(slotU(c.rung) + jitter(c.id) * 0.17);

  /** Rasterise the chart. The SVG leans on stylesheet rules, so the clone gets an
   *  inline <style> and an opaque ground, otherwise the PNG comes out bare. */
  const downloadPng = () => {
    const svg = plotRef.current?.querySelector("svg");
    if (!svg) return;
    const css = getComputedStyle(document.documentElement);
    const ink2 = css.getPropertyValue("--ink-2").trim() || "#1d1f23";
    const bone = css.getPropertyValue("--bone").trim() || "#f2ede2";
    const faint = css.getPropertyValue("--faint").trim() || "#8b877f";
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // the live SVG sizes itself from CSS; without explicit attributes the
    // rasteriser falls back to a default box and the PNG comes out tiny
    clone.setAttribute("width", String(W));
    clone.setAttribute("height", String(H));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      text { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
      .st-grid { stroke: ${faint}; stroke-opacity: .18; stroke-width: 1; }
      .st-axis { stroke: ${faint}; stroke-opacity: .5; stroke-width: 1; }
      .st-diag { stroke: ${faint}; stroke-opacity: .6; stroke-width: 1.5; stroke-dasharray: 5 5; fill: none; }
      .st-tick { fill: ${faint}; font-size: 10px; }
      .st-tick.end { text-anchor: end; } .st-tick.mid { text-anchor: middle; }
      .st-axlbl { fill: ${faint}; font-size: 10px; letter-spacing: .14em; }
      .st-axlbl.mid { text-anchor: middle; }
      .st-quad { font-size: 10.5px; font-weight: 700; letter-spacing: .14em; }
      .st-quadsub { fill: ${faint}; font-family: system-ui, sans-serif; font-size: 10.5px; }
      .st-quad.end, .st-quadsub.end { text-anchor: end; }
      .st-quad.start, .st-quadsub.start { text-anchor: start; }
      .st-dot { stroke: ${ink2}; stroke-width: 2; fill-opacity: .82; }
      .st-legend { fill: ${bone}; font-family: system-ui, sans-serif; font-size: 11px; }
      .st-legend.dim { fill: ${faint}; }
    `;
    clone.insertBefore(style, clone.firstChild);
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", String(W)); bg.setAttribute("height", String(H)); bg.setAttribute("fill", ink2);
    clone.insertBefore(bg, style.nextSibling);

    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = W * scale; canvas.height = H * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((out) => {
        if (!out) return;
        save(out, `reality-gap-${new Date().toISOString().slice(0, 10)}.png`);
      }, "image/png");
    };
    img.src = url;
  };

  /** One row per claim, so the numbers can be checked outside this page. */
  const downloadCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["claim", "sector", "evidence", "expected_share_true", "said_true", "said_false", "pct_said_true", "swipes", "gap"],
      ...[...cards].sort((a, b) => b.n - a.n).map((c) => [
        c.claim, c.sector, VLABEL[c.verdict], c.expected, c.yes, c.no,
        c.n ? (c.pTrue).toFixed(4) : "", c.n, c.n ? c.gap.toFixed(4) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    save(new Blob([csv], { type: "text/csv;charset=utf-8" }), `swipe-the-future-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const showTip = (e: React.MouseEvent, title: string, lines: string[]) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, title, lines });
  };

  return (
    <Shell>
      <Reveal as="div" className="st-grid">
        <Tile n={swipes} k="swipes" />
        <Tile n={rounds} k="rounds finished" />
        <Tile n={swipes ? believe / swipes : 0} k={`called true · ${pct(swipes ? doubt / swipes : 0)} called false`} isPct />
        <Tile n={scored ? aligned / scored : 0} k="matched the evidence" isPct />
      </Reveal>

      <p className="st-fresh">
        {fetchedAt
          ? `Counted at ${fetchedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. The page reads the tally once when it loads, it does not tick along on its own.`
          : "Reading the tally…"}
        <button className="st-refresh" onClick={load} disabled={loading}>{loading ? "refreshing…" : "refresh"}</button>
      </p>

      <Reveal className="st-sec">
        <span className="st-kicker">01, the whole deck at once</span>
        <h2>The Reality Gap</h2>
        <p className="st-lede">
          Every dot is one claim. <em>Left to right</em> is how true it actually is, according to its
          source: false at one end, already happened at the other. <em>Bottom to top</em> is how many
          people swiped TRUE on it. So each dot says two things at once: how true a claim is, and how
          many of us bought it. The dashed line is where a crowd that read the evidence perfectly
          would sit. Above it we believed more than the claim deserves; below it, less.
        </p>

        {plotted.length === 0 ? (
          <div className="st-plotwrap empty">
            <p className="st-msg sm">
              No claim has {MIN_N} swipes yet, so there is nothing honest to plot. The chart appears
              as soon as the deck has been played enough, {seen} of {cards.length} claims have been
              seen at least once so far.
            </p>
          </div>
        ) : (
          <>
            <div className="st-plotwrap" ref={plotRef} onMouseLeave={() => setTip(null)}>
              <div ref={plotSeenRef}>
                <svg viewBox={`0 0 ${W} ${H}`} className="st-plot" role="img"
                  aria-label="Scatter plot of every claim: evidence strength against the share of players who called it true.">
                  {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <g key={`g${p}`}>
                      <line x1={P.l} x2={W - P.r} y1={py(p)} y2={py(p)} className="st-grid" />
                      <line x1={P.l - 5} x2={P.l} y1={py(p)} y2={py(p)} className="st-axis" />
                      <text x={P.l - 11} y={py(p) + 4} className="st-tick end">{pct(p)}</text>
                    </g>
                  ))}
                  <line x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} className="st-axis" />
                  <text x={P.l} y={P.t - 16} className="st-axlbl">SHARE WHO CALLED IT TRUE</text>
                  <polyline
                    className="st-diag" fill="none"
                    points={[0, 0.5, 1, 1].map((v, i) => `${px(slotU(i))},${py(v)}`).join(" ")}
                  />
                  <text x={P.l + 6} y={P.t + 34} className="st-quad start" fill={C_BELIEVE}>HYPE TRAPS</text>
                  <text x={P.l + 6} y={P.t + 49} className="st-quadsub start">not true, widely believed</text>
                  <text x={W - P.r} y={py(0.16)} className="st-quad end" fill={C_DOUBT}>BLIND SPOTS</text>
                  <text x={W - P.r} y={py(0.16) + 15} className="st-quadsub end">already real, doubted</text>

                  <g className={`st-dots${plotSeen ? " in" : ""}`}>
                    {[...plotted].sort((a, b) => b.n - a.n).map((c, i) => (
                      <circle
                        key={c.id} cx={dotX(c)} cy={py(c.pTrue)} r={rOf(c.n)}
                        fill={colourOf(c.gap)} className="st-dot"
                        style={{ animationDelay: `${Math.min(i * 22, 900)}ms` }}
                        onMouseMove={(e) => showTip(e, c.claim, [
                          `${c.sector} · ${VLABEL[c.verdict]}`,
                          `${pct(c.pTrue)} called it true · ${c.n} swipes`,
                        ])}
                      >
                        <title>{`${c.claim}, ${pct(c.pTrue)} called it true (${VLABEL[c.verdict]}, ${c.n} swipes)`}</title>
                      </circle>
                    ))}
                  </g>

                  <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="st-axis" />
                  {(["False", "Kinda", "True", "Already real"] as const).map((lbl, i) => (
                    <g key={lbl}>
                      <line x1={px(slotU(i))} x2={px(slotU(i))} y1={H - P.b} y2={H - P.b + 5} className="st-axis" />
                      <text x={px(slotU(i))} y={H - P.b + 21} className="st-tick mid">{lbl}</text>
                    </g>
                  ))}
                  <text x={(P.l + W - P.r) / 2} y={H - P.b + 42} className="st-axlbl mid">WHAT THE EVIDENCE SAYS</text>

                  {/* legend, inside the SVG so the exported PNG stands alone */}
                  <g transform={`translate(${P.l}, ${H - 46})`}>
                    <circle cx={6} cy={-4} r={6} fill={C_BELIEVE} fillOpacity={0.82} />
                    <text x={18} y={0} className="st-legend">over-believed</text>
                    <circle cx={126} cy={-4} r={6} fill={C_MID} fillOpacity={0.82} />
                    <text x={138} y={0} className="st-legend">read about right</text>
                    <circle cx={266} cy={-4} r={6} fill={C_DOUBT} fillOpacity={0.82} />
                    <text x={278} y={0} className="st-legend">under-believed</text>
                    <line x1={400} x2={432} y1={-4} y2={-4} className="st-diag" />
                    <text x={440} y={0} className="st-legend dim">a perfectly calibrated crowd</text>
                    <circle cx={6} cy={17} r={3.5} fill={C_MID} fillOpacity={0.5} />
                    <circle cx={22} cy={17} r={7} fill={C_MID} fillOpacity={0.5} />
                    <text x={36} y={21} className="st-legend dim">bigger dot = more people swiped it</text>
                  </g>
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
                {plotted.length} of {cards.length} claims have enough swipes to plot
                {heldBack > 0 ? `, ${heldBack} more are still under ${MIN_N} and held back` : ""}.
              </p>
              <div className="st-actions">
                <button className="st-btn" onClick={downloadPng}>Download map (PNG)</button>
                <button className="st-btn" onClick={downloadCsv}>Download data (CSV)</button>
              </div>
            </div>
          </>
        )}
      </Reveal>

      <Reveal className="st-sec">
        <span className="st-kicker">02, sector by sector, claim by claim</span>
        <h2>Where each sector stands</h2>
        <p className="st-lede">
          Open a sector to see every claim in it and how the room split. The bar under each claim is
          the vote: blue for the share who called it true, red for the share who called it false.
        </p>
        <SectorExplorer sectors={allSectors} cardsBySector={cardsBySector} colours={COLOURS} />
      </Reveal>

      <Reveal className="st-sec">
        <span className="st-kicker">03, the underlying skill</span>
        <h2>Can people tell true from false?</h2>
        <p className="st-lede">
          Two different things get muddled when someone gets a claim wrong. One is whether they can
          <em> tell the difference</em> between a true claim and a false one at all. The other is which way
          they lean when they can&apos;t. Getting everything wrong in one direction is a lean, not ignorance,
          and it&apos;s fixable in a way that the first thing isn&apos;t. So we measure them separately
          (they&apos;re <em>d′</em> and <em>criterion</em>, if you want the textbook names).
        </p>

        {ranked.length ? (
          <div className="st-tablewrap">
            <table className="st-table st-sectors">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th>Can tell true from false<span className="st-scale"><i>coin flip</i><i>sharp</i></span></th>
                  <th>When unsure, the crowd…<span className="st-scale"><i>doubts it</i><i>believes it</i></span></th>
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
                          Not measurable here, every claim in this deck lands the same way, so there is
                          nothing to tell apart. Accuracy still counts.
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
          <p className="st-msg sm">No sector has {MIN_SECTOR} scorable answers yet. This table fills in as people play.</p>
        )}
        <p className="st-note">
          d′ of 0 means a coin flip; around 1 is a real signal; 2 and up is sharp. The lean bar runs from
          &ldquo;doubts it&rdquo; on the left to &ldquo;believes it&rdquo; on the right. Contested claims are left out of both
          (there&apos;s no right answer to score). The small range under each accuracy is a 95% confidence
          interval, so a sector with 22 answers doesn&apos;t get to look as certain as one with 2,000.
        </p>
      </Reveal>

      <Reveal className="st-sec">
        <span className="st-kicker">04, the two ways to be wrong</span>
        <h2>Hype traps and blind spots</h2>
        <div className="st-two">
          <div>
            <h3 style={{ color: C_BELIEVE }}>Hype traps</h3>
            <p className="st-sublede">Not true. Believed anyway.</p>
            <p className="st-para">
              A hype trap is a claim the evidence does not support that people believe regardless.
              They are what a good story leaves behind: a confident launch demo, a number quoted
              away from the caveat that came with it, a product name that promises more than the
              product does. They cluster where the marketing is loudest and the checking is hardest,
              which is why so many of them are about the things being sold hardest right now. They
              are the expensive kind of wrong, because budgets, hiring and policy get set on them.
            </p>
            {hypeTraps.length ? hypeTraps.map((c, i) => (
              <div className="st-row" key={c.id} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="st-rowpct" style={{ color: C_BELIEVE }}>{pct(c.pTrue)}</span>
                <span className="st-rowtxt"><b>{c.claim}</b><span>called true · {c.sector} · {c.n} swipes</span></span>
              </div>
            )) : <p className="st-msg sm">Nothing here yet. Either nobody has been caught by one, or not enough people have played.</p>}
          </div>
          <div>
            <h3 style={{ color: C_DOUBT }}>Blind spots</h3>
            <p className="st-sublede">Already real. Still doubted.</p>
            <p className="st-para">
              A blind spot is the mirror image: something that has already happened and that people
              still will not have. These are quieter, because nothing markets the ordinary Tuesday on
              which a thing quietly started working, and because a capability that arrives without a
              launch event tends to arrive without anyone updating. They are arguably the more
              costly of the two: while you are waiting for a future to show up, somebody else is
              already using it.
            </p>
            {blindSpots.length ? blindSpots.map((c, i) => (
              <div className="st-row" key={c.id} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="st-rowpct" style={{ color: C_DOUBT }}>{pct(1 - c.pTrue)}</span>
                <span className="st-rowtxt"><b>{c.claim}</b><span>called false · {c.sector} · {c.n} swipes</span></span>
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
        <h1>What everyone <em>actually</em> believes.</h1>
        <p className="st-intro">
          Every swipe on Swipe the Future is one person&apos;s gut, checked against a sourced claim.
          Enough of them together stop being a game and start being a measurement: which futures the
          public over-believes, which ones have already arrived without anyone noticing, and which
          sectors people can read at all.
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
