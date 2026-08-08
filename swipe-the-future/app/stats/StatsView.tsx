"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SECTORS, VLABEL, type Sector } from "../../data/sectors";
import {
  sectorStat, truthOf, sensitivityLabel, leanLabel,
  type CardStat, type SectorStat,
} from "./stats-math";

const MIN_N = 5;      // a claim needs this many swipes before it goes on the plot
const MIN_SECTOR = 20; // and a sector this many scorable answers before it's ranked

// Diverging pair, validated for CVD separation against both the dark and light
// surface. Blue = the crowd is more sceptical than the evidence; oxblood = more
// credulous. Slate is the neutral midpoint, not a third category.
const C_DOUBT = "#3E93D8";
const C_BELIEVE = "#D8694E";
const C_MID = "#8A96A6";

const pct = (x: number) => `${Math.round(x * 100)}%`;

type Tip = { x: number; y: number; title: string; lines: string[] } | null;

export default function StatsView() {
  const [counters, setCounters] = useState<Record<string, string> | null>(null);
  const [generated, setGenerated] = useState<Sector[]>([]);
  const [err, setErr] = useState(false);
  const [tip, setTip] = useState<Tip>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/swipe", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/swipe/sector", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([c, g]) => { setCounters(c ?? {}); if (Array.isArray(g?.sectors)) setGenerated(g.sectors); })
      .catch(() => setErr(true));
  }, []);

  const n = (k: string) => Number(counters?.[k] ?? 0);

  const cards: CardStat[] = useMemo(() => {
    if (!counters) return [];
    return [...SECTORS, ...generated].flatMap((s) =>
      s.cards.map((c) => {
        const yes = Number(counters[`c:${c.id}:b`] ?? 0);
        const no = Number(counters[`c:${c.id}:d`] ?? 0);
        const total = yes + no;
        const truth = truthOf(c.verdict);
        const pTrue = total ? yes / total : 0;
        return {
          id: c.id, claim: c.claim, verdict: c.verdict, sector: s.name, sectorId: s.id,
          yes, no, n: total, pTrue, truth, gap: pTrue - truth,
        };
      }),
    );
  }, [counters, generated]);

  const plotted = useMemo(() => cards.filter((c) => c.n >= MIN_N), [cards]);
  const heldBack = cards.filter((c) => c.n > 0 && c.n < MIN_N).length;

  const sectors: SectorStat[] = useMemo(() => {
    const byId = new Map<string, { name: string; cards: CardStat[] }>();
    for (const c of cards) {
      if (!byId.has(c.sectorId)) byId.set(c.sectorId, { name: c.sector, cards: [] });
      byId.get(c.sectorId)!.cards.push(c);
    }
    return [...byId.entries()]
      .map(([id, v]) => sectorStat(id, v.name, v.cards))
      .filter((s): s is SectorStat => s !== null && s.n >= MIN_SECTOR)
      .sort((a, b) => Number(b.measurable) - Number(a.measurable) || b.dPrime - a.dPrime);
  }, [cards]);

  const swipes = n("swipes"), believe = n("believe"), doubt = n("doubt");
  const aligned = n("aligned"), scored = n("scored"), rounds = n("rounds");

  const hypeTraps = [...plotted].filter((c) => c.verdict === "unlikely").sort((a, b) => b.gap - a.gap).slice(0, 5);
  const blindSpots = [...plotted].filter((c) => c.verdict === "already" || c.verdict === "likely").sort((a, b) => a.gap - b.gap).slice(0, 5);

  if (err) return <Shell><p className="st-msg">Couldn&apos;t reach the metrics store.</p></Shell>;
  if (!counters) return <Shell><p className="st-msg">Loading…</p></Shell>;
  if (swipes === 0) return <Shell><p className="st-msg">No swipes recorded yet. Once people start playing, this page fills in.</p></Shell>;

  // ── Reality Gap plot geometry ──────────────────────────────────────────
  // The evidence scale is ordinal — four rungs, not a ruler — so the columns are
  // evenly spaced and the reference line bends through each rung's actual truth
  // value. Dots are jittered inside their column (deterministically, off the card
  // id) because otherwise 128 claims land on four vertical lines.
  const W = 760, H = 480, P = { t: 30, r: 74, b: 58, l: 58 };
  const SLOT: Record<number, number> = { 0: 0, 0.5: 1, 0.8: 2, 1: 3 };
  const px = (u: number) => P.l + u * (W - P.l - P.r);
  const py = (p: number) => H - P.b - p * (H - P.t - P.b);
  const rOf = (k: number) => Math.min(15, 4.5 + Math.sqrt(k) * 1.25);
  const colourOf = (gap: number) => (gap > 0.12 ? C_BELIEVE : gap < -0.12 ? C_DOUBT : C_MID);
  const jitter = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return ((h >>> 0) % 1000) / 1000 - 0.5; // −0.5 … 0.5, stable per claim
  };
  // Columns sit inside [0.07, 0.95] so the leftmost never rides the y-axis labels.
  const slotU = (i: number) => 0.07 + (i / 3) * 0.88;
  const dotX = (c: CardStat) => px(slotU(SLOT[c.truth] ?? 0) + jitter(c.id) * 0.17);

  const showTip = (e: React.MouseEvent, title: string, lines: string[]) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, title, lines });
  };

  return (
    <Shell>
      <div className="st-grid">
        <Tile v={swipes.toLocaleString()} k="swipes" />
        <Tile v={rounds.toLocaleString()} k="rounds finished" />
        <Tile v={pct(swipes ? believe / swipes : 0)} k={`called true · ${pct(swipes ? doubt / swipes : 0)} called false`} />
        <Tile v={pct(scored ? aligned / scored : 0)} k="matched the evidence" />
      </div>

      <section className="st-sec">
        <h2>The Reality Gap</h2>
        <p className="st-lede">
          Every claim, plotted twice over: along the bottom, where the evidence actually puts it.
          Up the side, how many people called it true. If the crowd read the evidence perfectly,
          every dot would sit on the dotted line. Dots above it are things we believe more than the
          evidence warrants. Dots below are things that are already real and we still don&apos;t buy.
        </p>

        <div className="st-plotwrap" ref={plotRef} onMouseLeave={() => setTip(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="st-plot" role="img"
            aria-label="Scatter plot of every claim: evidence strength against the share of players who called it true.">
            {/* grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <g key={`g${p}`}>
                <line x1={P.l} x2={W - P.r} y1={py(p)} y2={py(p)} className="st-grid" />
                <text x={P.l - 10} y={py(p) + 4} className="st-tick end">{pct(p)}</text>
              </g>
            ))}
            {/* where a perfectly calibrated crowd would sit at each rung */}
            <polyline
              className="st-diag" fill="none"
              points={[0, 0.5, 0.8, 1].map((t, i) => `${px(slotU(i))},${py(t)}`).join(" ")}
            />
            <text x={W - P.r} y={py(1) - 20} className="st-diaglbl">a crowd that reads</text>
            <text x={W - P.r} y={py(1) - 8} className="st-diaglbl">the evidence right</text>

            {/* quadrant captions, kept clear of the columns */}
            <text x={P.l + 6} y={P.t + 34} className="st-quad start" fill={C_BELIEVE}>HYPE TRAPS</text>
            <text x={P.l + 6} y={P.t + 49} className="st-quadsub start">not true, widely believed</text>
            <text x={W - P.r} y={py(0.16)} className="st-quad end" fill={C_DOUBT}>BLIND SPOTS</text>
            <text x={W - P.r} y={py(0.16) + 15} className="st-quadsub end">already real, doubted</text>

            {/* dots, biggest first so small ones stay clickable on top */}
            {[...plotted].sort((a, b) => b.n - a.n).map((c) => (
              <circle
                key={c.id} cx={dotX(c)} cy={py(c.pTrue)} r={rOf(c.n)}
                fill={colourOf(c.gap)} fillOpacity={0.82} className="st-dot"
                onMouseMove={(e) => showTip(e, c.claim, [
                  `${c.sector} · ${VLABEL[c.verdict]}`,
                  `${pct(c.pTrue)} called it true · ${c.n} swipes`,
                ])}
              >
                <title>{`${c.claim} — ${pct(c.pTrue)} called it true (${VLABEL[c.verdict]}, ${c.n} swipes)`}</title>
              </circle>
            ))}

            {/* x axis */}
            <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="st-axis" />
            {(["Not true", "Partly true", "Broadly true", "Already real"] as const).map((lbl, i) => (
              <text key={lbl} x={px(slotU(i))} y={H - P.b + 22} className="st-tick mid">{lbl}</text>
            ))}
            <text x={(P.l + W - P.r) / 2} y={H - 12} className="st-axlbl">WHERE THE EVIDENCE SITS →</text>
            <text transform={`translate(16, ${(P.t + H - P.b) / 2}) rotate(-90)`} className="st-axlbl mid">SHARE WHO SAID TRUE →</text>
          </svg>
          {tip && (
            <div className="st-tip" style={{ left: tip.x, top: tip.y }}>
              <b>{tip.title}</b>
              {tip.lines.map((l) => <span key={l}>{l}</span>)}
            </div>
          )}
        </div>
        <p className="st-note">
          Dot size is how many people swiped it. {plotted.length} of {cards.length} claims have enough
          swipes to plot{heldBack > 0 ? `; ${heldBack} more are still under ${MIN_N} and held back` : ""}.
        </p>

        <details className="st-details">
          <summary>See the same data as a table</summary>
          <div className="st-tablewrap">
            <table className="st-table">
              <thead><tr><th>Claim</th><th>Sector</th><th>Evidence</th><th className="num">Said true</th><th className="num">Swipes</th></tr></thead>
              <tbody>
                {[...plotted].sort((a, b) => b.gap - a.gap).map((c) => (
                  <tr key={c.id}>
                    <td>{c.claim}</td><td>{c.sector}</td><td>{VLABEL[c.verdict]}</td>
                    <td className="num">{pct(c.pTrue)}</td><td className="num">{c.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="st-sec">
        <h2>Can people tell true from false?</h2>
        <p className="st-lede">
          Two different things get muddled when someone gets a claim wrong. One is whether they can
          <em> tell the difference</em> between a true claim and a false one at all. The other is which way
          they lean when they can&apos;t. Getting everything wrong in one direction is a lean, not ignorance,
          and it&apos;s fixable in a way that the first thing isn&apos;t. So we measure them separately
          (they&apos;re <em>d′</em> and <em>criterion</em>, if you want the textbook names).
        </p>

        {sectors.length ? (
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
                {sectors.map((s) => (
                  <tr key={s.id}>
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
                          Not measurable here — every claim in this deck lands the same way, so there is
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
      </section>

      <section className="st-sec st-two">
        <div>
          <h3 style={{ color: C_BELIEVE }}>What we fall for</h3>
          <p className="st-sublede">Not true. Believed anyway.</p>
          {hypeTraps.length ? hypeTraps.map((c) => (
            <div className="st-row" key={c.id}>
              <span className="st-rowpct" style={{ color: C_BELIEVE }}>{pct(c.pTrue)}</span>
              <span className="st-rowtxt"><b>{c.claim}</b><span>called true · {c.sector} · {c.n} swipes</span></span>
            </div>
          )) : <p className="st-msg sm">Not enough data yet.</p>}
        </div>
        <div>
          <h3 style={{ color: C_DOUBT }}>What we miss</h3>
          <p className="st-sublede">Already real. Still doubted.</p>
          {blindSpots.length ? blindSpots.map((c) => (
            <div className="st-row" key={c.id}>
              <span className="st-rowpct" style={{ color: C_DOUBT }}>{pct(1 - c.pTrue)}</span>
              <span className="st-rowtxt"><b>{c.claim}</b><span>called false · {c.sector} · {c.n} swipes</span></span>
            </div>
          )) : <p className="st-msg sm">Not enough data yet.</p>}
        </div>
      </section>

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

function Tile({ v, k }: { v: string; k: string }) {
  return <div className="st-tile"><span className="st-tv">{v}</span><span className="st-tk">{k}</span></div>;
}
