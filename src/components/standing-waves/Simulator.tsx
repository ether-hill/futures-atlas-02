"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type * as DishModule from "@/lib/standing-waves/sim/dish";

/**
 * The cymatics simulator (V2, "the dish, in code"), on this site's tokens.
 *
 * Nothing runs until Start. Before that the page holds a poster and this
 * component's own few kilobytes: the physics module (whose Bessel table alone
 * is ~280k evaluations at import) and the WebGL context are created on the
 * click, and torn down on Stop or on leaving the page. Sound is a second,
 * separate choice and is off at start: no audio ever plays unasked.
 */

type Dish = typeof DishModule;

interface Params {
  hz: number;
  hz2: number;
  two: boolean;
  dish: number; // cm
  depth: number; // mm
  pin: number;
  light: string;
}

// The CymaScope cell measured by Sheldrake & Sheldrake (2017): 24.25 mm
// across, ~5.4 mm of water, free contact line. The upstream default.
const DEFAULTS: Params = { hz: 82, hz2: 132, two: false, dish: 1.21, depth: 5.4, pin: 0, light: "blue" };
const DAMPING = 0.018;
const PRESETS = [
  { hz: 66, hz2: 0 },
  { hz: 82, hz2: 0 },
  { hz: 82, hz2: 132 },
  { hz: 102, hz2: 166 },
];

const label = "font-mono text-[11px] uppercase tracking-[0.12em] text-graphite";

function Slider(props: {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={props.id} className={`${label} flex justify-between gap-3`}>
        <span>{props.name}</span>
        <span className="text-ink">{props.fmt(props.value)}</span>
      </label>
      <input
        id={props.id}
        type="range"
        className="sw-range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        aria-valuetext={props.fmt(props.value)}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Simulator({ poster }: { poster: ReactNode }) {
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [P, setP] = useState<Params>(DEFAULTS);
  const [reading, setReading] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ P, dish: null as Dish | null, sel: null as ReturnType<Dish["selectModes"]> | null, modesB: [] as DishModule.Mode[], ampA: 1, ampB: 1 });
  const audio = useRef<{ ctx: AudioContext; master: GainNode; a: OscillatorNode; b: OscillatorNode; ga: GainNode; gb: GainNode } | null>(null);

  // Recompute the figure whenever a physical parameter moves.
  const rebuild = useCallback((p: Params) => {
    const L = live.current;
    L.P = p;
    const d = L.dish;
    if (!d) return;
    L.sel = d.selectModes(p.hz, p.dish / 100, p.depth / 1000, DAMPING, p.pin, 1);
    L.modesB = p.two ? d.selectModes(p.hz2, p.dish / 100, p.depth / 1000, DAMPING, p.pin, 2).modes : [];
    L.ampA = d.slopeNormaliser(L.sel.modes);
    L.ampB = d.slopeNormaliser(L.modesB);
    const ld = L.sel.lead;
    const lambda = (d.TAU / d.dispersionK((d.TAU * p.hz) / 2, p.depth / 1000)) * 1000;
    setReading(
      ld
        ? `${ld.m === 0 ? "Rings" : `${2 * ld.m}-fold figure`} (dish mode m ${ld.m}, n ${ld.n}) · wavelength ${lambda.toFixed(1)} mm`
        : `No stable figure at this setting · wavelength ${lambda.toFixed(1)} mm`,
    );
  }, []);

  const set = (patch: Partial<Params>) => {
    const next = { ...live.current.P, ...patch };
    setP(next);
    rebuild(next);
  };

  // ---- the run: import, context, loop. Only after Start. ----
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let disposed = false;
    let visible = true;
    let io: IntersectionObserver | null = null;
    let gl: WebGL2RenderingContext | null = null;
    (async () => {
      let d: Dish;
      try {
        d = await import("@/lib/standing-waves/sim/dish");
      } catch {
        setFailed("The simulator could not load.");
        return;
      }
      if (disposed || !canvas.current || !stage.current) return;
      live.current.dish = d;
      rebuild(live.current.P);
      gl = canvas.current.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false });
      if (!gl) {
        setFailed("This browser does not offer WebGL2, which the simulator needs.");
        return;
      }
      const renderer = d.createRenderer(gl);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t0 = performance.now();
      const ripples = [0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0];
      let ri = 0;
      const cv = canvas.current;
      const st = stage.current;
      cv.onpointerdown = (e) => {
        const r = cv.getBoundingClientRect();
        const dpr = cv.width / r.width;
        const rad = renderer.radius(cv.width, cv.height);
        const x = ((e.clientX - r.left) * dpr - cv.width / 2) / rad;
        const y = -((e.clientY - r.top) * dpr - cv.height / 2) / rad;
        if (x * x + y * y > 1) return;
        ripples.splice(ri * 4, 4, x, y, (performance.now() - t0) / 1000, 0.9);
        ri = (ri + 1) % 4;
      };
      io = new IntersectionObserver((es) => (visible = es[0]?.isIntersecting ?? true), { threshold: 0.01 });
      io.observe(st);
      const frame = () => {
        if (disposed) return;
        raf = requestAnimationFrame(frame);
        if (!visible) return;
        const L = live.current;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.round(st.clientWidth * dpr), h = Math.round(st.clientHeight * dpr);
        if (cv.width !== w || cv.height !== h) {
          cv.width = w;
          cv.height = h;
        }
        // Reduced motion: the figure holds still (t frozen) but stays live to the dials.
        const t = reduce ? 0 : (performance.now() - t0) / 1000;
        renderer.frame(w, h, t, {
          modesA: L.sel?.modes ?? [],
          modesB: L.modesB,
          ampA: L.ampA,
          ampB: L.ampB,
          mixB: L.P.two ? 0.45 : 0,
          ratioB: L.P.hz2 / L.P.hz,
          drive: 0.6,
          strobe: 0.5,
          chaos: 0.15,
          spin: 0.015,
          trails: reduce ? 0.6 : 0.85,
          hue: d.PALETTES[L.P.light]!.hue,
          ripples,
        });
      };
      raf = requestAnimationFrame(frame);
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
      // Drop the context so the GPU is released, not just idle. Held in the
      // closure: by the time this runs on Stop, the canvas ref is already null.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [running, rebuild]);

  // ---- sound: its own switch, never on by default ----
  useEffect(() => {
    if (!sound || !running) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 3;
    master.connect(comp);
    comp.connect(ctx.destination);
    const a = ctx.createOscillator(), b = ctx.createOscillator();
    const ga = ctx.createGain(), gb = ctx.createGain();
    a.connect(ga); ga.connect(master); b.connect(gb); gb.connect(master);
    a.start(); b.start();
    audio.current = { ctx, master, a, b, ga, gb };
    master.gain.setTargetAtTime(0.35, ctx.currentTime, 0.08);
    return () => {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setTimeout(() => void ctx.close(), 200);
      audio.current = null;
    };
  }, [sound, running]);

  useEffect(() => {
    const au = audio.current;
    if (!au) return;
    const t = au.ctx.currentTime;
    au.a.frequency.setTargetAtTime(P.hz, t, 0.02);
    au.b.frequency.setTargetAtTime(P.hz2, t, 0.02);
    au.ga.gain.setTargetAtTime(P.two ? 0.78 : 1, t, 0.03);
    au.gb.gain.setTargetAtTime(P.two ? 0.45 : 0, t, 0.03);
  }, [P, sound]);

  const fmtHz = (v: number) => `${v.toFixed(1)} Hz`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* black in both themes: the dish's own ground, drawn by the shader */}
      <div ref={stage} className="relative mx-auto aspect-square w-full max-w-[80vh] overflow-hidden bg-[black]">
        {running && !failed ? (
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label={`Simulated dish of water. ${reading}`} role="img" />
        ) : (
          <div className="absolute inset-0">{poster}</div>
        )}
        {!running && (
          <div className="absolute inset-0 flex items-end justify-start p-4">
            <button
              type="button"
              onClick={() => {
                setFailed(null);
                setRunning(true);
              }}
              className="sw-focus min-h-[44px] bg-paper px-5 font-mono text-[12px] uppercase tracking-[0.14em] text-[black]"
            >
              Start the simulator
            </button>
          </div>
        )}
        {failed && <p className="absolute inset-x-4 top-4 bg-paper p-3 text-[13px] text-[black]">{failed}</p>}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {running && (
            <button type="button" className="sw-chip" onClick={() => { setSound(false); setRunning(false); }}>
              Stop
            </button>
          )}
          <button type="button" className="sw-chip" aria-pressed={sound} disabled={!running} onClick={() => setSound((s) => !s)}>
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>
        <p className="text-[13.5px] leading-[1.6] text-ink" aria-live="polite">
          {running ? reading || "Loading…" : "Press start. Nothing is computed until you do."}
        </p>

        <fieldset disabled={!running} className="flex flex-col gap-4 disabled:opacity-60">
          <legend className={`${label} mb-2`}>Key frequencies</legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((pr) => {
              const on = Math.abs(P.hz - pr.hz) < 0.05 && (pr.hz2 ? P.two && Math.abs(P.hz2 - pr.hz2) < 0.05 : !P.two);
              return (
                <button
                  key={`${pr.hz}-${pr.hz2}`}
                  type="button"
                  className="sw-chip"
                  aria-pressed={on}
                  onClick={() => set({ hz: pr.hz, two: pr.hz2 > 0, hz2: pr.hz2 || P.hz2 })}
                >
                  {pr.hz}
                  {pr.hz2 ? ` + ${pr.hz2}` : ""} Hz
                </button>
              );
            })}
          </div>
          <Slider id="sw-sim-hz" name="Frequency" min={20} max={200} step={0.1} value={P.hz} fmt={fmtHz} onChange={(v) => set({ hz: v })} />
          <Slider id="sw-sim-dish" name="Dish radius" min={0.5} max={8} step={0.01} value={P.dish} fmt={(v) => `${v.toFixed(2)} cm`} onChange={(v) => set({ dish: v })} />
          <Slider id="sw-sim-depth" name="Water depth" min={2} max={20} step={0.1} value={P.depth} fmt={(v) => `${v.toFixed(1)} mm`} onChange={(v) => set({ depth: v })} />
          <Slider id="sw-sim-pin" name="Water's edge: slides → sticks" min={0} max={1} step={0.01} value={P.pin} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set({ pin: v })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="sw-chip" aria-pressed={P.two} onClick={() => set({ two: !P.two })}>
              Second tone
            </button>
          </div>
          {P.two && (
            <Slider id="sw-sim-hz2" name="Second frequency" min={20} max={300} step={0.1} value={P.hz2} fmt={fmtHz} onChange={(v) => set({ hz2: v })} />
          )}
          <div>
            <p className={`${label} mb-2`}>Light</p>
            <div className="flex flex-wrap gap-2">
              {["blue", "gold", "white"].map((c) => (
                <button key={c} type="button" className="sw-chip" aria-pressed={P.light === c} onClick={() => set({ light: c })}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="sw-chip self-start" onClick={() => set(DEFAULTS)}>
            Reset
          </button>
        </fieldset>
      </div>
    </div>
  );
}
