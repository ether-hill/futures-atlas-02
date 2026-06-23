"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APPROACHES, PROTECTS, BACKFILLS, HORIZONS, project, fmt,
  type StageId, type Choice, type Approach, type Outcome,
} from "../data/model";

type Choices = { approach?: string; protect?: string; backfill?: string; horizon?: string };

const STAGE_PROMPT: Record<StageId, string> = {
  approach: "January 2025. USAID is on the table. What do you do?",
  protect: "What do you protect from the cuts?",
  backfill: "Does anyone fill the gap?",
  horizon: "Over what horizon do you want to see the toll?",
};
const optionsFor = (s: StageId): Choice[] => (s === "approach" ? APPROACHES : s === "protect" ? PROTECTS : s === "backfill" ? BACKFILLS : HORIZONS);

// Brand: a single blue accent (≈ core --accent oklch(0.64 0.13 245)) on warm ink,
// with paper highlights. No rainbow — the constellation is monochrome-accent; the
// outcome number carries the weight. (Canvas needs literal rgb; these mirror tokens.)
const ACCENT = [120, 170, 250] as const; // --accent (≈ oklch(0.7 0.16 245))
const PAPER = [228, 234, 244] as const; // cool white label/stroke
const BAND = "#05060c"; // canvas field, matches the other tool pages
const TONE = { destroy: ACCENT, reform: ACCENT, mixed: ACCENT, node: ACCENT, dim: [140, 132, 118] } as const;

export default function Engine() {
  const [choices, setChoices] = useState<Choices>({});
  const [result, setResult] = useState<Outcome | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const sequence = useMemo<StageId[]>(() => {
    const a = APPROACHES.find((x) => x.id === choices.approach);
    return ["approach", ...(a && !a.skipProtect ? (["protect"] as StageId[]) : []), "backfill", "horizon"];
  }, [choices.approach]);

  const completed = sequence.filter((s) => choices[s]);
  const frontier: StageId | null = sequence.find((s) => !choices[s]) ?? null;
  const frontierOptions = frontier ? optionsFor(frontier) : [];

  const select = useCallback((stage: StageId, id: string) => {
    setChoices((prev) => {
      // selecting an earlier stage truncates later ones
      const order: StageId[] = ["approach", "protect", "backfill", "horizon"];
      const next: Choices = { ...prev, [stage]: id };
      const idx = order.indexOf(stage);
      for (let i = idx + 1; i < order.length; i++) delete next[order[i]!];
      return next;
    });
    setResult(null);
  }, []);

  // compute outcome when the path is complete
  useEffect(() => {
    if (choices.approach && choices.backfill && choices.horizon) {
      const a = APPROACHES.find((x) => x.id === choices.approach)!;
      if (a.skipProtect || choices.protect) {
        setResult(project(choices.approach, choices.protect ?? "none", choices.backfill, choices.horizon));
      }
    }
  }, [choices]);

  const reset = () => { setChoices({}); setResult(null); };

  // ── canvas: nebula + branching constellation ───────────────────────────────
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ choices, sequence, frontierOptions, frontier, hover, done: !!result });
  stateRef.current = { choices, sequence, frontierOptions, frontier, hover, done: !!result };

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let raf = 0, t0 = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const fit = () => { const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(cv);
    // nebula particles
    const N = 90;
    const stars = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.8, ph: i * 1.7, sp: 0.2 + Math.random() * 0.5 }));

    const draw = (now: number) => {
      if (!t0) t0 = now; const time = (now - t0) / 1000;
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BAND; ctx.fillRect(0, 0, W, H);
      // nebula — faint accent dust
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const x = ((s.x + time * 0.004 * s.sp) % 1) * W;
        const y = s.y * H + Math.sin(time * 0.3 + s.ph) * 6;
        const a = 0.04 + 0.04 * (0.5 + 0.5 * Math.sin(time + s.ph));
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 9);
        g.addColorStop(0, `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${a})`); g.addColorStop(1, `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s.r * 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // node positions
      const seq = st.sequence;
      const totalCols = 1 + seq.length + (st.done ? 1 : 0);
      const colX = (c: number) => (totalCols <= 1 ? 0.5 : 0.09 + (c / (totalCols - 1)) * 0.82) * W;
      const spineY = (c: number) => (0.5 + Math.sin(c * 1.25 + 0.4) * 0.13) * H;

      type Node = { x: number; y: number; r: number; label: string; tone: number[]; bright: number; id?: string; stage?: StageId };
      const nodes: Node[] = [];
      nodes.push({ x: colX(0), y: spineY(0), r: 9, label: "USAID · Jan 2025", tone: [...TONE.node], bright: 1 });
      // chosen path
      let col = 1;
      for (const s of seq) {
        const cid = st.choices[s]; if (!cid) break;
        const opt = optionsFor(s).find((o) => o.id === cid)!;
        const tone = s === "approach" ? TONE[(opt as Approach).tone] : TONE.node;
        nodes.push({ x: colX(col), y: spineY(col), r: 13, label: opt.label, tone: [...tone], bright: 1, id: cid, stage: s });
        col++;
      }
      // frontier options (branching cluster) — only if not done
      const frontierNodes: Node[] = [];
      if (st.frontier && !st.done) {
        const opts = st.frontierOptions; const n = opts.length;
        const fx = colX(col);
        const lastY = nodes[nodes.length - 1]!.y;
        opts.forEach((o, i) => {
          const y = (0.5 + (i - (n - 1) / 2) * 0.26) * H;
          const tone = st.frontier === "approach" ? TONE[(o as Approach).tone] : TONE.node;
          const hovered = st.hover === o.id;
          frontierNodes.push({ x: fx, y, r: hovered ? 13 : 10, label: o.label, tone: [...tone], bright: hovered ? 1 : 0.62, id: o.id, stage: st.frontier! });
        });
      }
      // outcome node
      if (st.done) {
        const last = nodes[nodes.length - 1]!;
        const a = APPROACHES.find((x) => x.id === st.choices.approach)!;
        nodes.push({ x: colX(col), y: last.y, r: 18, label: "Outcome", tone: [...TONE[a.tone]], bright: 1 });
      }

      // edges: spine (chosen) with flow, and frontier branches (faint)
      const edge = (a: Node, b: Node, alpha: number, flow: boolean, tone: number[]) => {
        const mx = (a.x + b.x) / 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
        ctx.strokeStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${alpha})`; ctx.lineWidth = flow ? 1.6 : 1; ctx.stroke();
        if (flow) {
          for (let k = 0; k < 3; k++) {
            const tt = ((time * 0.4 + k / 3) % 1);
            const omt = 1 - tt;
            const px = omt * omt * omt * a.x + 3 * omt * omt * tt * mx + 3 * omt * tt * tt * mx + tt * tt * tt * b.x;
            const py = omt * omt * omt * a.y + 3 * omt * omt * tt * a.y + 3 * omt * tt * tt * b.y + tt * tt * tt * b.y;
            ctx.globalCompositeOperation = "lighter";
            const g = ctx.createRadialGradient(px, py, 0, px, py, 5);
            g.addColorStop(0, `rgba(${tone[0]},${tone[1]},${tone[2]},0.9)`); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          }
        }
      };
      for (let i = 1; i < nodes.length; i++) edge(nodes[i - 1]!, nodes[i]!, 0.5, true, nodes[i]!.tone);
      const frontierAnchor = nodes[completedCountSafe(nodes)] ?? nodes[nodes.length - 1]!;
      for (const f of frontierNodes) edge(frontierAnchor, f, st.hover === f.id ? 0.55 : 0.2, st.hover === f.id, f.tone);

      // draw nodes
      const drawNode = (nd: Node) => {
        ctx.globalCompositeOperation = "lighter";
        const pulse = 0.85 + 0.15 * Math.sin(time * 2 + nd.x);
        const rad = nd.r * 2.6 * pulse;
        const g = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, rad);
        g.addColorStop(0, `rgba(${nd.tone[0]},${nd.tone[1]},${nd.tone[2]},${0.5 * nd.bright})`);
        g.addColorStop(1, `rgba(${nd.tone[0]},${nd.tone[1]},${nd.tone[2]},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nd.x, nd.y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${nd.tone[0]},${nd.tone[1]},${nd.tone[2]},${0.9 * nd.bright})`; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${PAPER[0]},${PAPER[1]},${PAPER[2]},${0.7 * nd.bright})`; ctx.stroke();
        // label
        ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = `rgba(${PAPER[0]},${PAPER[1]},${PAPER[2]},${0.55 + 0.4 * nd.bright})`;
        ctx.fillText(nd.label, nd.x, nd.y + nd.r + 6);
      };
      [...nodes, ...frontierNodes].forEach(drawNode);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // count of chosen nodes (root + completed) for frontier anchor index
  function completedCountSafe(nodes: { id?: string }[]) { return nodes.length - 1; }

  return (
    <div className="engine">
      <canvas ref={cvRef} className="constellation" aria-hidden="true" />
      <div className="controls">
        {result ? (
          <div className={`outcome tone-${result.verdict.tone}`} role="status" aria-live="polite">
            <div className="ohead">
              <span className="okick">Modeled outcome — projection, not a body count</span>
              <h3>{result.verdict.title}</h3>
            </div>
            <div className="ometrics">
              <div className="ometric"><span className="n">{result.deaths.central > 0 ? `${fmt(result.deaths.low)}–${fmt(result.deaths.high)}` : "≈0"}</span><span className="k">additional deaths {result.deaths.central > 0 ? `(central ${fmt(result.deaths.central)})` : "modeled"}</span></div>
              <div className="ometric"><span className="n">${result.budgetCutB}B</span><span className="k">withheld · {result.budgetPct.toFixed(2)}% of the federal budget</span></div>
              <div className="ometric"><span className="n">{result.wasteRecoveredM > 0 ? `$${result.wasteRecoveredM}M` : "$0"}</span><span className="k">documented waste actually addressed</span></div>
            </div>
            <p className="obody">{result.verdict.body}</p>
            <div className="ocites">Sources: {result.cites.map((c, i) => (<span key={i}><a href={c.url} target="_blank" rel="noopener noreferrer">{c.label}↗</a>{i < result.cites.length - 1 ? " · " : ""}</span>))}</div>
            <div className="oactions">
              <button className="btn" onClick={reset}>↺ Run another future</button>
              <a className="btn ghost" href="/social-composer?transmutate=https://futures-atlas-02.vercel.app/woodchipper">Make a post →</a>
            </div>
          </div>
        ) : frontier ? (
          <div className="frontier">
            <div className="fprompt"><span className="fstep">{`Step ${completed.length + 1} / ${sequence.length}`}</span><h3>{STAGE_PROMPT[frontier]}</h3></div>
            <div className="fopts">
              {frontierOptions.map((o) => (
                <button key={o.id} className="fopt" onClick={() => select(frontier, o.id)} onMouseEnter={() => setHover(o.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(o.id)} onBlur={() => setHover(null)}>
                  <span className="fl">{o.label}</span>
                  <span className="fs">{o.sub}</span>
                  <span className="fd">{o.detail}{o.cite && <> <a href={o.cite.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{o.cite.label}↗</a></>}</span>
                </button>
              ))}
            </div>
            {completed.length > 0 && <button className="restart" onClick={reset}>↺ Start over</button>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
