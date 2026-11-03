"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Mention } from "@/data/doom-score/types";
import { DoomAudio, type MomentSound } from "./audio";
import { NOW, START, parseDate, tFromU, u as uOf, yearTicks } from "./axis";
import { degrees, pForDegree, type ScaleName } from "./scale";

/**
 * The home hero. One picture of the conversation since 2009:
 *
 *  - Grains. Every post, paper, news article, prediction-market question and
 *    broadcast about extinction from AI that the project's searches found is
 *    one grain, laid down month by month in strata by kind.
 *  - Dots. Every number somebody gave for the chance that AI ends humanity,
 *    at its value, in ink. Each is a note when played.
 *  - Flags. The chronicle's turning points along the top; the current one is
 *    shown in the right-hand panel with its picture.
 *
 * Two layouts (one pile, or a lane per kind) and two cameras (the whole span,
 * or a window that follows the playhead and pulls back to the whole at the
 * end), so the same data can be read four ways.
 */

export type Moment = { id: string; date: string; title: string; blurb: string; thumb: { src: string; w: number; h: number } | null; href: string; outlet?: string };
/** One month of talk, counts by kind: forum, paper, news, market, broadcast. */
export type PileMonth = { month: string; counts: [number, number, number, number, number]; dated?: [number, number][] };
/** counts: forum, paper, news, market, (unused fifth slot kept for the data shape). */
/** [kind, day of month] for each item whose date is known; the rest of the count is spread evenly across the month. */

/** Four kinds of grain. Orange (cat-2) is kept for the key moments, so nothing here uses it. */
const KINDS = [
  { label: "forum posts and comments", short: "Forum posts", v: "--ds-cat-5" },
  { label: "academic papers", short: "Papers", v: "--ds-cat-4" },
  { label: "news articles", short: "News", v: "--ds-cat-3" },
  { label: "prediction markets", short: "Markets", v: "--ds-cat-1" },
] as const;

type Row = Mention & { t: number; u: number; pitch: number | null };
type Mo = Moment & { t: number; u: number; short: string; row: number; left?: boolean; bare?: boolean };
type Grain = { t: number; f: number; k: number; m: number; real: boolean };
type View = "pile" | "lanes";
type Camera = "whole" | "follow";

/** What the hero's opening says at each step, said while that layer comes in. */
const INTRO: Record<number, string> = {
  2: "Each square is one thing said. Each dot is someone's guess at the chance AI ends humanity.",
  3: "Flags mark key moments. Higher guesses play higher notes.",
};

/** How long each step of the opening holds before the next: time to read the line and see the layer come in. */
const STEP_MS: Record<number, number> = { 1: 900, 2: 6500, 3: 7000 };

const SPEEDS: { label: string; seconds: number }[] = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "4 min", seconds: 240 },
];

const PAD = { l: 58, r: 64, t: 92, b: 44 };
const LABEL_ROWS = 5;
const ROW_H = 14;
const PILE = 0.7;
const WINDOW_MS = 24 * 30.44 * 864e5; // the follow camera shows two years, the playhead at 72% of the width
const NOW_AT = 0.72;
const MONTH_MS = 30.44 * 864e5;
const ZOOM_MS = 2800;
/** Pile height on a square-root scale: linear would let one record month flatten thirty years. Said on the axis. */
const pileH = (count: number, max: number) => Math.sqrt(count / max);
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const num = (m: Mention) => m.p ?? (m.pLow != null && m.pHigh != null ? (m.pLow + m.pHigh) / 2 : (m.pLow ?? m.pHigh ?? null));
const fmtP = (m: Mention) => (m.p != null ? `${m.p}%` : m.pLow != null && m.pHigh != null ? `${m.pLow}–${m.pHigh}%` : m.pLow != null ? `≥ ${m.pLow}%` : m.pHigh != null ? `≤ ${m.pHigh}%` : "");
const shortWho = (w: string) => {
  const s = w.replace(/\s*\(.*\)$/, "");
  const parts = s.split(/\s+/);
  const person = parts.length <= 3 && /^[A-Z]\S*$/.test(parts[0]) && !/survey|participants|Institute|community|researchers|signatories/i.test(s);
  return person ? parts[parts.length - 1] : s.length > 28 ? `${s.slice(0, 26)}…` : s;
};
const shortTitle = (t: string) => {
  const cut = t.split(/[:;]|, (?=[A-Za-z])/)[0].trim();
  return cut.length > 26 ? `${cut.slice(0, 24).replace(/\s+\S*$/, "")}…` : cut;
};
const rnd = (seed: number) => {
  let x = (seed * 9301 + 49297) % 233280;
  return () => (x = (x * 9301 + 49297) % 233280) / 233280;
};
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtMonth = (k: string) => `${MONTHS_SHORT[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
const fmtDay = (t: number, dayToo: boolean) => new Date(t).toLocaleDateString("en-GB", { day: dayToo ? "numeric" : undefined, month: "short", year: "numeric", timeZone: "UTC" });

/**
 * With `hero`, the score opens as a bare picture of the whole span (one pile, no
 * labels) under a big title and play button. Play expands it to the full
 * screen, eases the pile apart into a lane per source as the labels come in,
 * pulls the camera in to follow the playhead, then starts. Escape goes back.
 */
export function DoomScore({ mentions, pile, moments, hero }: { mentions: Mention[]; pile: PileMonth[]; moments: Moment[]; hero?: { title: string; lead: string } }) {
  const rows = useMemo<Row[]>(
    () =>
      mentions
        .map((m) => ({ ...m, t: parseDate(m.date), u: uOf(parseDate(m.date)), pitch: num(m) }))
        .filter((r) => r.t >= START && r.t <= NOW)
        .sort((a, b) => a.t - b.t),
    [mentions],
  );
  const months = useMemo(
    () =>
      pile
        .map((p) => ({ ...p, t: Date.UTC(+p.month.slice(0, 4), +p.month.slice(5) - 1, 1), total: p.counts.slice(0, KINDS.length).reduce((a, b) => a + b, 0) }))
        .filter((p) => p.t >= START)
        .map((p) => ({ ...p, u: uOf(p.t), tEnd: Math.min(NOW, Date.UTC(+p.month.slice(0, 4), +p.month.slice(5), 1)) }))
        .sort((a, b) => a.t - b.t),
    [pile],
  );
  const maxMonth = useMemo(() => Math.max(1, ...months.map((m) => m.total)), [months]);
  const maxKind = useMemo(() => KINDS.map((_, k) => Math.max(1, ...months.map((m) => m.counts[k]))), [months]);
  const totalSaid = useMemo(() => months.reduce((a, m) => a + m.total, 0), [months]);
  const peak = useMemo(() => months.reduce((b, m) => (m.total > b.total ? m : b), months[0]), [months]);
  /**
   * Where a grain sits means something. Left to right is time: an item we have
   * a date for sits on its day; the rest of a month's count is spread evenly
   * across the month. Bottom to top is the count: within a month the grains
   * are packed in order, by kind in strata (forum at the floor, then papers,
   * news, markets, TV), so the height of each stratum is that kind's share.
   */
  const grains = useMemo<Grain[]>(() => {
    const out: Grain[] = [];
    months.forEach((m, i) => {
      const span = m.tEnd - m.t;
      const dayMs = 864e5;
      const days = Math.max(1, Math.round(span / dayMs));
      let idx = 0;
      m.counts.forEach((c, k) => {
        if (k >= KINDS.length) return;
        const real = (m.dated ?? []).filter(([kk]) => kk === k).map(([, d]) => d);
        const rest = Math.max(0, c - real.length);
        const ts: { t: number; real: boolean }[] = [];
        for (const d of real) ts.push({ t: m.t + (Math.min(days, Math.max(1, d)) - 0.5) * dayMs, real: true });
        for (let j = 0; j < rest; j++) ts.push({ t: m.t + ((j + 0.5) / rest) * span, real: false });
        ts.sort((a, b) => a.t - b.t);
        for (const g of ts) out.push({ t: g.t, f: 0, k, m: i, real: g.real });
        idx += ts.length;
      });
    });
    return out;
  }, [months]);
  /** For each month, where its grains start and end in the grains array. */
  const monthRange = useMemo(() => {
    const r: [number, number][] = months.map(() => [0, 0]);
    let i = 0;
    while (i < grains.length) {
      const m = grains[i].m;
      const start = i;
      while (i < grains.length && grains[i].m === m) i++;
      r[m] = [start, i];
    }
    return r;
  }, [grains, months]);
  const mos = useMemo<Mo[]>(
    () =>
      moments
        .map((m) => ({ ...m, t: parseDate(m.date), u: uOf(parseDate(m.date)), short: shortTitle(m.title), row: 0 }))
        .filter((m) => m.t >= START && m.t <= NOW)
        .sort((a, b) => a.t - b.t),
    [moments],
  );

  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<DoomAudio | null>(null);
  const uRef = useRef(0);
  const flashes = useRef<Map<string, number>>(new Map());
  const lastFrame = useRef<number | null>(null);
  const colors = useRef<Record<string, string>>({});
  const hover = useRef<Row | null>(null);
  const hoverMonth = useRef<number | null>(null);
  const hoverMo = useRef<Mo | null>(null);
  const endedAt = useRef<number | null>(null);
  /** False until play or a scrub: before that the whole picture is shown at full strength. */
  const started = useRef(false);
  const risen = useRef<Set<string>>(new Set());
  const captionRef = useRef<{ text: string; at: number } | null>(null);

  const [playing, setPlaying] = useState(false);
  const [scale] = useState<ScaleName>("dread");
  const [speed, setSpeed] = useState(1);
  const [silent, setSilent] = useState(false);
  const [view, setView] = useState<View>("pile");
  const [camera, setCamera] = useState<Camera>("whole");
  const momentSound: MomentSound = "riser"; // a turning point rises in
  const momentRef = useRef(momentSound);
  momentRef.current = momentSound;
  const [zooming, setZooming] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const domain = useRef<{ t0: number; t1: number } | null>(null);
  const brush = useRef<{ x0: number; x1: number } | null>(null);
  const [cursor, setCursor] = useState(0);
  const [stats, setStats] = useState({ n: 0, median: null as number | null, said: 0 });
  const [card, setCard] = useState<Mo | null>(null);
  const passed = useMemo(() => mos.filter((m) => m.u <= cursor).reverse(), [mos, cursor]);
  const current = card ?? passed[0] ?? null;
  const [ended, setEnded] = useState(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const silentRef = useRef(silent);
  silentRef.current = silent;
  const viewRef = useRef(view);
  viewRef.current = view;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const isHero = !!hero;
  const heroRef = useRef(isHero);
  heroRef.current = isHero;
  const [phase, setPhase] = useState<"rest" | "open">("rest");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  /** Hero only, eased towards their targets each frame: d, the labels (0 none, 1 all); lane, one pile (0) to a lane per source (1); zoom, following (0) to the whole span (1); f, how far the unplayed part has dimmed. */
  const blend = useRef({ m: isHero ? 0 : 1, lane: 0, ax: isHero ? 0 : 1, mo: isHero ? 0 : 1, ph: isHero ? 0 : 1, zoom: 1, f: 0, at: 0 });
  /** Hero only: the opening, one thing at a time. 0 rest, 1 full screen, 2 the lanes and the numbers, 3 the turning points and the camera, 4 playing. */
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  stepRef.current = step;
  /** The last frame's geometry, for the pointer. */
  const geo = useRef({ L: PAD.l, plotW: 1, top: PAD.t, following: false, xOf: (t: number) => t, Ydot: (p: number) => p, tNow: START });
  const timers = useRef<number[]>([]);
  const heroBox = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  /** Hero only: when the picture first drew, for its build-up on load. */
  const loadAt = useRef<number | null>(null);
  const zoomingRef = useRef(zooming);
  zoomingRef.current = zooming;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const currentRef = useRef<Mo | null>(current);
  currentRef.current = current;

  const readColors = useCallback(() => {
    const el = canvas.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const c: Record<string, string> = {};
    for (const v of ["--text", "--muted", "--faint", "--accent", "--bg", "--panel", "--ds-cat-1", "--ds-cat-2", "--ds-cat-3", "--ds-cat-4", "--ds-cat-5", "--hairline"]) c[v] = cs.getPropertyValue(v).trim() || "#888";
    colors.current = c;
  }, []);
  useEffect(() => {
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => mo.disconnect();
  }, [readColors]);

  const recount = useCallback(
    (upTo: number) => {
      const seen = rows.filter((r) => r.u <= upTo);
      const ps = seen.map((r) => r.pitch).filter((p): p is number => p != null).sort((a, b) => a - b);
      let said = 0;
      for (const m of months) if (m.u <= upTo) said += m.total;
      setStats({ n: seen.length, median: ps.length ? ps[Math.floor(ps.length / 2)] : null, said });
    },
    [rows, months],
  );

  /** Sound a number. `flashAt` lets the sweep start the sound early and time the ring to when it is heard. */
  const play = useCallback((r: Row, viaClick = false, flashAt = performance.now()) => {
    const a = (audio.current ??= new DoomAudio());
    flashes.current.set(r.id, flashAt);
    if (r.pitch == null) return a.tick(0.2);
    const dur = r.type === "book" || r.type === "paper" ? 1.8 : r.type === "forum" ? 0.7 : 1.1;
    const glide = r.pLow != null && r.pHigh != null && r.pLow !== r.pHigh ? r.pHigh : undefined;
    a.note(glide != null ? r.pLow! : r.pitch, scaleRef.current, { gain: viaClick ? 1.1 : 0.8, dur, glideTo: glide });
  }, []);

  useEffect(() => {
    audio.current?.setMuted(silent);
  }, [silent]);

  /** Drop every sound scheduled for the old timing, and let the turning points still ahead rise again. */
  const resync = useCallback(() => {
    audio.current?.cancelPending();
    risen.current = new Set(mos.filter((m) => m.u <= uRef.current).map((m) => m.id));
  }, [mos]);

  // ----- the sweep -----
  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      audio.current?.stopDrone();
      return;
    }
    const a = (audio.current ??= new DoomAudio());
    resync();
    a.setMuted(silentRef.current);
    a.startDrone();
    started.current = true;
    let raf = 0;
    const seconds = SPEEDS[speed].seconds;
    const step = (now: number) => {
      const dt = lastFrame.current == null ? 0 : (now - lastFrame.current) / 1000;
      lastFrame.current = now;
      const u0 = uRef.current;
      const u1 = Math.min(1, u0 + dt / seconds);
      if (u1 > u0) {
        // sounds are started early by the audio output's own delay, so they are heard as the playhead crosses the mark
        const lead = Math.min(0.35, a.latency() + 0.012);
        const leadU = lead / seconds;
        for (const r of rows) if (r.u > u0 + leadU && r.u <= u1 + leadU) play(r, false, now + lead * 1000);
        if (momentRef.current === "riser") {
          // the riser starts 1.6 s out and its hit lands on the moment as heard (the output's delay taken off);
          // a moment nearer than that when play starts, like the first one in 2009, gets a shorter rise, still on time
          for (const m of mos) {
            if (m.u <= u0 || risen.current.has(m.id)) continue;
            const toCrest = (m.u - u1) * seconds - lead;
            if (toCrest <= 1.6) {
              risen.current.add(m.id);
              a.moment("riser", 1, toCrest);
            }
          }
        }
        for (const m of mos)
          if (m.u > u0 + leadU && m.u <= u1 + leadU) {
            if (momentRef.current !== "riser") a.moment(momentRef.current);
            setTimeout(() => {
              setCard(null);
              captionRef.current = { text: `${fmtDay(m.t, m.date.length > 7)} · ${m.title}`, at: performance.now() };
            }, lead * 1000);
          }
        {
          for (let i = 0; i < months.length; i++) {
            const m = months[i];
            if (m.u > u0 && m.u <= u1 && m.total > 0) {
              const next = months[i + 1]?.u ?? 1;
              const span = (next - m.u) * seconds;
              // clicks per month on a square-root scale, like the pile: 1 for a lone item, about 50 for the busiest month,
              // louder and brighter as the month fills, scattered unevenly across the month so it reads as rain, not a metronome
              const k = pileH(m.total, maxMonth);
              const n = Math.max(1, Math.min(50, Math.round(k * 50)));
              const g = 0.03 + k * 0.17;
              const r = rnd(i + 7);
              for (let j = 0; j < n; j++) a.tick(g, span * ((j + r() * 0.9) / n), 0.3 + k * 0.7);
            }
          }
        }
        uRef.current = u1;
        setCursor(u1);
        recount(u1);
        let recent = 0;
        for (const f of flashes.current.values()) if (now - f < 2500) recent++;
        a.setDroneIntensity(0.1 + Math.pow(u1, 1.6) * 0.65 + Math.min(0.3, recent * 0.06));
      }
      if (u1 >= 1) {
        setPlaying(false);
        setEnded(true);
        endedAt.current = now;
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      resync();
    };
  }, [playing, speed, rows, months, mos, maxMonth, play, recount, resync]);

  // ----- drawing -----
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d")!;
    let raf = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth, h = el.clientHeight;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const c = colors.current;
      const now = performance.now();
      const sc = scaleRef.current;
      const uNow = uRef.current;
      const tNow = tFromU(uNow);
      const b = blend.current;
      if (heroRef.current) {
        const dt = b.at ? Math.min(0.1, (now - b.at) / 1000) : 0;
        const ease = (key: "m" | "lane" | "ax" | "mo" | "ph" | "zoom" | "f", target: number, tau: number) => {
          b[key] += (target - b[key]) * (1 - Math.exp(-dt / tau));
          if (Math.abs(target - b[key]) < 0.002) b[key] = target;
        };
        const st = stepRef.current;
        const back = st === 0; // going back to rest is quicker than coming in
        ease("m", st >= 2 ? 1 : 0, back ? 0.3 : 0.5);
        ease("lane", viewRef.current === "lanes" ? 1 : 0, back ? 0.3 : 0.5);
        ease("ax", st >= 2 ? 1 : 0, back ? 0.2 : 0.7);
        ease("mo", st >= 3 ? 1 : 0, back ? 0.2 : 0.4);
        ease("ph", st >= 3 ? 1 : 0, back ? 0.2 : 0.3);
        ease("zoom", cameraRef.current === "follow" && endedAt.current == null ? 0 : 1, endedAt.current != null ? 0.7 : stepRef.current > 0 ? 0.6 : 0.3);
        ease("f", started.current ? 1 : 0, 0.5);
      } else {
        b.m = b.ax = b.mo = b.ph = 1;
        b.lane = viewRef.current === "lanes" ? 1 : 0;
        b.f = started.current ? 1 : 0;
      }
      b.at = now;
      const M = b.m, AX = b.ax, LK = b.lane;
      // on load the pile grows up out of the floor, a wave from 2009 to now, and the numbers follow it in
      if (heroRef.current && loadAt.current == null) loadAt.current = now;
      const since = heroRef.current && loadAt.current != null ? now - loadAt.current : Infinity;
      const grow = (p: number) => (since > 4000 ? 1 : ease((since - 250 - p * 1300) / 900));
      const arrive = (p: number) => (since > 4000 ? 1 : ease((since - 1100 - p * 1300) / 700));
      const lanes = LK > 0.5;
      const mix = (a: number, z: number, k: number) => a + (z - a) * k;
      // at rest the picture runs edge to edge under the title; the margins come in with M, then each layer of labels in turn
      // on a phone the lane names sit inside their lanes, so the plot keeps its width
      const narrow = w < 640;
      const PT = mix(h * 0.3, PAD.t, M), PR = mix(0, narrow ? 34 : PAD.r, M);
      const L = mix(0, mix(narrow ? 44 : PAD.l, narrow ? 44 : 118, LK), M);
      const plotW = w - L - PR;
      const plotH = h - PT - mix(0, PAD.b, M);
      const floor = PT + plotH;
      const cur = currentRef.current;
      /** 1 once played; the unplayed part fades to a fifth as play begins. */
      const isPast = (t: number) => (t <= tNow ? 1 : 1 - b.f);
      const pv = (past: number, a: number, z: number) => z + (a - z) * past;
      let layer = 1;
      const ga = (a: number) => (ctx.globalAlpha = a * layer);
      const setLayer = (v: number) => ((layer = v), (ctx.globalAlpha = v));

      // ----- the camera: the whole span, or a two-year window with the playhead at 72%, pulling back to the whole at the end
      const dom = domain.current;
      const xFull = dom ? (t: number) => L + ((t - dom.t0) / (dom.t1 - dom.t0)) * plotW : (t: number) => L + uOf(t) * plotW;
      const xWin = (t: number) => L + ((t - (tNow - WINDOW_MS * NOW_AT)) / WINDOW_MS) * plotW;
      const zoom = heroRef.current ? b.zoom : cameraRef.current === "follow" ? (endedAt.current == null ? 0 : ease((now - endedAt.current) / ZOOM_MS)) : 1;
      const following = heroRef.current ? zoom < 1 : cameraRef.current === "follow" && zoom < 1;
      const xOf = (t: number) => (zoom >= 1 ? xFull(t) : zoom <= 0 ? xWin(t) : xWin(t) + (xFull(t) - xWin(t)) * zoom);
      const visible = (t: number) => {
        const x = xOf(t);
        return x >= L - 4 && x <= w - PR + 4;
      };

      // ----- lane geometry (lanes view): the numbers across the top, then a band per kind
      const numH = plotH * mix(1, 0.36, LK);
      const laneH = (plotH - numH) / KINDS.length;
      const laneTop = (k: number) => PT + numH + k * laneH;
      const Y = (p: number) => PT + (1 - p / 100) * (numH - 12 * LK) + 6 * LK;
      // one pile snaps each number to a step of the scale it is played on; the lanes place it at its value
      const degs = degrees(sc);
      const snapP = (p: number) => pForDegree(Math.round((Math.max(0, Math.min(100, p)) / 100) * (degs.length - 1)), sc);
      const Ydot = (p: number) => Y(mix(snapP(p), p, LK));
      geo.current = { L, plotW, top: PT, following, xOf, Ydot, tNow };

      // ----- grid and axes
      ctx.font = `500 11px var(--font-heading), system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      setLayer(AX * (1 - LK));
      if (LK < 1) {
        degs.forEach((semi, i) => {
          const y = Y(pForDegree(i, sc));
          ctx.strokeStyle = c["--text"];
          ga(semi % 12 === 0 ? 0.16 : 0.05);
          ctx.beginPath();
          ctx.moveTo(L, y);
          ctx.lineTo(w - PR, y);
          ctx.stroke();
        });
        ga(1);
      }
      for (const p of [0, 25, 50, 75, 100]) {
        setLayer(AX * (p % 50 === 0 ? 1 : 1 - LK));
        const y = Y(p);
        ctx.strokeStyle = c["--text"];
        ga(0.35);
        ctx.beginPath();
        ctx.moveTo(L - 4, y);
        ctx.lineTo(L, y);
        ctx.stroke();
        ga(1);
        ctx.fillStyle = c["--muted"];
        ctx.textAlign = "right";
        ctx.fillText(`${p}%`, L - 8, y);
      }
      setLayer(LK);
      if (LK > 0) {
        ctx.textAlign = "left";
        ctx.font = `700 12px var(--font-heading), system-ui, sans-serif`;
        ctx.fillStyle = c["--text"];
        ga(AX);
        if (!narrow) ctx.fillText("Numbers given", 8, PT + 10);
        ga(1);
        KINDS.forEach((k, i) => {
          const y0 = laneTop(i);
          ctx.strokeStyle = c["--text"];
          ga(0.14);
          ctx.beginPath();
          ctx.moveTo(8, y0);
          ctx.lineTo(w - 8, y0);
          ctx.stroke();
          ga(1);
          ctx.fillStyle = c[k.v];
          const [lx, ly] = narrow ? [L + 4, y0 + 12] : [8, y0 + laneH / 2];
          ctx.fillRect(lx, ly - 4, 8, 8);
          ctx.fillStyle = c["--text"];
          ctx.font = `700 12px var(--font-heading), system-ui, sans-serif`;
          if (narrow) ctx.font = `700 11px var(--font-heading), system-ui, sans-serif`;
          ctx.fillText(k.short, lx + 14, ly);
          let so = 0;
          for (const m of months) if (m.u <= uNow) so += m.counts[i];
          ctx.textAlign = "right";
          ctx.font = `800 15px var(--font-heading), system-ui, sans-serif`;
          ga(b.ph); // the running count means nothing until the playhead is in
          if (narrow) ctx.font = `800 12px var(--font-heading), system-ui, sans-serif`;
          ctx.fillText(so.toLocaleString("en-GB"), w - (narrow ? 4 : 10), ly);
          ga(1);
          ctx.textAlign = "left";
        });
      }

      // ----- time ticks: years on the whole span, months when following
      setLayer(AX);
      ctx.font = `600 11px var(--font-year), "Arial Narrow", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      if (!following && !dom) {
        let lastLabelX = -Infinity;
        for (const t of yearTicks()) {
          const x = xOf(t);
          if (x < L || x > w - PR) continue;
          ctx.strokeStyle = c["--text"];
          ga(0.08);
          ctx.beginPath();
          ctx.moveTo(x, PT);
          ctx.lineTo(x, floor + 4);
          ctx.stroke();
          ga(1);
          if (x - lastLabelX > 34) {
            ctx.fillStyle = c["--muted"];
            ctx.fillText(String(new Date(t).getUTCFullYear()), x, floor + 8);
            lastLabelX = x;
          }
        }
      } else {
        const t0 = following ? tNow - WINDOW_MS * NOW_AT : dom!.t0, t1 = following ? tNow + WINDOW_MS * (1 - NOW_AT) : dom!.t1;
        const d = new Date(t0);
        let y = d.getUTCFullYear(), m = d.getUTCMonth();
        const monthPx = plotW / ((t1 - t0) / (30.44 * 864e5));
        const every = monthPx > 70 ? 1 : monthPx > 30 ? 3 : 12;
        while (Date.UTC(y, m, 1) <= t1) {
          const t = Date.UTC(y, m, 1);
          const x = xOf(t);
          if (x >= L && x <= w - PR) {
            ctx.strokeStyle = c["--text"];
            ga(m === 0 ? 0.18 : 0.06);
            ctx.beginPath();
            ctx.moveTo(x, PT);
            ctx.lineTo(x, floor + (m === 0 ? 6 : 3));
            ctx.stroke();
            ga(1);
            if (m % every === 0) {
              ctx.fillStyle = m === 0 ? c["--text"] : c["--muted"];
              ctx.fillText(m === 0 ? String(y) : MONTHS_SHORT[m], x, floor + 8);
            }
          }
          m++;
          if (m > 11) (m = 0), y++;
        }
      }

      // ----- grains: each month is a set of columns, one per day where there is room, and the
      // grains stack up inside their column in order of kind, so a busy day is a taller spike and
      // the month's tallest columns reach the height the scale gives it
      setLayer(1);
      const gs = following ? 3 : 2.2;
      // a lane per source: every grain in a lane is the same size and the same step, the largest that
      // lets the lane's busiest month fit, so a column twice as tall is twice as many things said
      const laneCols = (px: number, sq: number) => Math.max(1, Math.min(31, Math.floor(px / sq)));
      const laneS = KINDS.map(() => 0);
      // a whole month's width, so this month, still under way (and past the axis's end), does not shrink every grain
      const fullPx = (i: number): number => {
        const mo = months[i];
        if (mo.t + MONTH_MS > NOW && i > 0) return fullPx(i - 1);
        return Math.max(1, xOf(mo.t + MONTH_MS) - xOf(mo.t));
      };
      if (LK > 0) {
        const room = Math.max(4, laneH - 8);
        const px = months.map((_, i) => fullPx(i));
        KINDS.forEach((_, k) => {
          let lo = 0.8, hi = 12;
          for (let it = 0; it < 16; it++) {
            const sq = (lo + hi) / 2;
            const fits = months.every((mo, i) => !mo.counts[k] || Math.ceil(mo.counts[k] / laneCols(px[i], sq)) * sq <= room);
            if (fits) lo = sq;
            else hi = sq;
          }
          laneS[k] = lo;
        });
      }
      // while the camera follows, the plot's edges are soft: grains and dots fade out over the last 40 px, never vanish a month at a time
      const EDGE = 40;
      // the fade goes as the camera pulls back at the end, so the last month is never left looking unplayed
      const edge = (x: number) => (following ? mix(Math.max(0, Math.min(1, (x - L) / EDGE, (w - PR - x) / EDGE)), 1, zoom) : 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L, 0, w - L - PR, h);
      ctx.clip();
      for (let mi = 0; mi < months.length; mi++) {
        const mo = months[mi];
        if (!mo.total) continue;
        const x0 = xOf(mo.t), x1 = xOf(mo.tEnd);
        const gw = grow((x0 - L) / Math.max(1, plotW));
        if (gw <= 0) continue;
        if (x1 < L - 4 || x0 > w - PR + 4) continue;
        const monthPx = Math.max(1, x1 - x0);
        // columns: as many as the month's grains can fill as squares of one size, at most one per day
        const hgtPile = pileH(mo.total, maxMonth) * PILE * plotH;
        const cell = Math.max(gs + 0.6, Math.sqrt((monthPx * Math.max(hgtPile, gs)) / mo.total));
        const cols = Math.max(1, Math.min(31, Math.floor(monthPx / cell)));
        const colW = monthPx / cols;
        // a grain grows with the zoom: as wide as its column allows and as tall as its share of the month's height, between 1.6 and 10 px
        const unitFor = (hgt: number, count: number) => hgt / Math.max(1, count / cols);
        const sizeFor = (unit: number) => Math.max(1.6, Math.min(24, Math.min(colW * 0.85, unit)));
        const stackPile = new Array<number>(cols).fill(0);
        const stackLane = KINDS.map(() => new Array<number>(31).fill(0));
        const nthOfKind = KINDS.map(() => 0);
        // the unit height: the average column reaches the month's scaled height
        const unitPile = unitFor(hgtPile, mo.total);
        const szPile = sizeFor(unitPile);
        const [a0, a1] = monthRange[mi];
        for (let gi = a0; gi < a1; gi++) {
          const gr = grains[gi];
          const col = Math.min(cols - 1, Math.max(0, Math.floor(((gr.t - mo.t) / (mo.tEnd - mo.t)) * cols)));
          let x = x0 + (col + 0.5) * colW;
          let y: number;
          // grains step up by their size, or by the month's unit when that is smaller, so a crowded
          // month overlaps its grains rather than growing past the height the scale gives it
          let sz = szPile;
          y = floor - (stackPile[col] + 0.5) * Math.min(szPile, unitPile);
          stackPile[col]++;
          if (LK > 0) {
            // in time order, an equal share of the month's grains per column
            const sq = laneS[gr.k], n = mo.counts[gr.k];
            const fw = fullPx(mi);
            const cl = laneCols(fw, sq);
            const cL = Math.min(cl - 1, Math.floor((nthOfKind[gr.k]++ * cl) / n));
            // this month, still under way, keeps the full month's columns but squeezes them into the days so far,
            // so nothing sits past the end of the record
            const xL = x0 + (cL + 0.5) * (fw / cl) * Math.min(1, monthPx / fw);
            const yL = laneTop(gr.k) + laneH - 3 - (stackLane[gr.k][cL]++ + 0.5) * sq;
            x = mix(x, xL, LK);
            sz = mix(sz, sq, LK);
            y = mix(y, yL, LK);
          }
          if (gw < 1) y = floor - (floor - y) * gw;
          if (y < PT) continue;
          const past = isPast(gr.t);
          ctx.fillStyle = c[KINDS[gr.k].v];
          const e = edge(x);
          if (e <= 0) continue;
          ga(pv(past, 0.9, 0.2) * Math.min(1, gw * 1.5) * e);
          const d = sz > 3 ? 0.8 : 0.1; // a hairline of ground between grains once they are big enough to see
          ctx.fillRect(x - sz / 2 + d / 2, y - sz / 2 + d / 2, sz - d, sz - d);
        }
      }
      ga(1);

      ctx.restore();

      // ----- pile scale on the right and the axis title (pile view)
      setLayer(AX * (1 - LK));
      if (LK < 1) {
        const x = w - PR + 6;
        ctx.strokeStyle = c["--text"];
        ga(0.3);
        ctx.beginPath();
        ctx.moveTo(x, floor);
        ctx.lineTo(x, floor - PILE * plotH);
        ctx.stroke();
        ga(1);
        ctx.font = `500 11px var(--font-heading), system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = c["--muted"];
        for (const v of [0, 10, 50, 100, 250, Math.round(maxMonth)]) {
          if (v > maxMonth) continue;
          const y = floor - pileH(v, maxMonth) * PILE * plotH;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 4, y);
          ctx.stroke();
          ctx.fillText(v.toLocaleString("en-GB"), x + 8, y);
        }
        ctx.save();
        ctx.translate(w - 10, floor - (PILE * plotH) / 2);
        ctx.rotate(Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText("posts, papers, stories and markets a month (square-root scale)", 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(14, (PT + floor) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `600 11px var(--font-heading), system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = c["--muted"];
        ctx.fillText("Chance that AI ends humanity, as given", 0, 0);
        ctx.restore();
      }

      // ----- key moments: labels in rows along the top, a hairline down once passed
      setLayer(b.mo);
      ctx.font = `600 10.5px var(--font-heading), system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = c["--ds-cat-2"];
      ctx.fillText("KEY MOMENTS", L, 12);
      {
        ctx.font = `500 10.5px var(--font-heading), system-ui, sans-serif`;
        const taken: [number, number][][] = Array.from({ length: LABEL_ROWS }, () => []);
        const free = (row: number, a: number, b: number) => taken[row].every(([p, q]) => b < p - 4 || a > q + 4);
        for (const m of [...mos].reverse()) {
          if (!visible(m.t)) {
            m.row = -1;
            continue;
          }
          const x = xOf(m.t);
          const tw = ctx.measureText(m.short).width + 12;
          const right: [number, number] = [x, x + tw];
          const left: [number, number] = [x - tw, x];
          const canRight = right[1] <= w - PR;
          const canLeft = left[0] >= L;
          const nearEnd = x > w - PR - plotW * 0.3;
          const order = nearEnd ? [canLeft ? ["l", left] : null, canRight ? ["r", right] : null] : [canRight ? ["r", right] : null, canLeft ? ["l", left] : null];
          let placed = false;
          m.bare = false;
          for (const [side, span] of order.filter(Boolean) as ["r" | "l", [number, number]][]) {
            for (let row = 0; row < LABEL_ROWS && !placed; row++) {
              if (free(row, span[0], span[1])) {
                m.row = row;
                m.left = side === "l";
                taken[row].push(span);
                placed = true;
              }
            }
            if (placed) break;
          }
          if (!placed) {
            // no room for the words: keep the square and the line, show the words on hover or when it is the current moment
            const sq: [number, number] = [x - 4, x + 4];
            let row = 0;
            for (let r2 = 0; r2 < LABEL_ROWS; r2++) if (free(r2, sq[0], sq[1])) { row = r2; break; }
            m.row = row;
            m.left = !canRight;
            m.bare = true;
            taken[row].push(sq);
          }
        }
      }
      const MO = c["--ds-cat-2"]; // the moments' colour, shared with the panel border
      for (const m of mos) {
        if (m.row < 0) continue;
        const x = xOf(m.t);
        const past = isPast(m.t);
        const hot = hoverMo.current?.id === m.id || cur?.id === m.id;
        const ly = 26 + m.row * ROW_H;
        ctx.strokeStyle = MO;
        ga(hot ? 0.95 : pv(past, 0.55, 0.2));
        ctx.lineWidth = hot ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, ly + 6);
        ctx.lineTo(x, floor);
        ctx.stroke();
        ctx.lineWidth = 1;
        ga(1);
        ctx.fillStyle = MO;
        ga(hot ? 1 : pv(past, 1, 0.5));
        const sq = hot ? 7 : 5;
        ctx.fillRect(x - sq / 2, ly - sq / 2, sq, sq);
        ctx.fillStyle = past > 0.5 || hot ? c["--text"] : c["--muted"];
        if (!m.bare || hot) {
          ctx.font = `${hot ? 700 : 500} 10.5px var(--font-heading), system-ui, sans-serif`;
          const tw = ctx.measureText(m.short).width;
          const tx = m.left ? x - 7 - tw : x + 7;
          if (m.bare) {
            ctx.fillStyle = c["--panel"];
            ctx.fillRect(tx - 4, ly - 8, tw + 8, 16);
            ctx.fillStyle = c["--text"];
          }
          ctx.fillText(m.short, tx, ly);
        }
        ga(1);
      }

      // ----- the numbers, in ink; a label beside each as it sounds. At rest they are faint and breathe slowly.
      // at rest, no number sits on the title's words: those under them wait until the margins come in
      const under: [number, number, number, number][] = [];
      if (heroRef.current && M < 1 && cover.current) {
        const er = el.getBoundingClientRect();
        for (const ch of Array.from(cover.current.children)) {
          const cr = ch.getBoundingClientRect();
          under.push([cr.left - er.left - 14, cr.top - er.top - 14, cr.right - er.left + 14, cr.bottom - er.top + 14]);
        }
      }
      for (const r of rows) {
        if (!visible(r.t)) continue;
        const x = xOf(r.t);
        const yy = r.pitch == null ? floor : Ydot(r.pitch);
        const hidden = under.some(([l, t, rr, bb]) => x > l && x < rr && ((yy > t && yy < bb) || (r.pLow != null && r.pHigh != null && Math.min(Y(r.pLow), Y(r.pHigh)) < bb && Math.max(Y(r.pLow), Y(r.pHigh)) > t)));
        setLayer((AX >= 1 ? 1 : mix(0.4 + 0.2 * Math.sin(now / 1400 + r.u * 37), 1, AX)) * (hidden ? M : 1) * arrive((x - L) / Math.max(1, plotW)) * edge(x));
        const past = isPast(r.t);
        const fl = flashes.current.get(r.id);
        const age = fl == null ? Infinity : (now - fl) / 1000;
        if (r.pitch == null) {
          ctx.strokeStyle = c["--text"];
          ga(pv(past, 0.5, 0.18));
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, Y(0) + 2);
          ctx.lineTo(x, Y(0) - 8);
          ctx.stroke();
          ctx.lineWidth = 1;
          ga(1);
          continue;
        }
        const y = Ydot(r.pitch);
        if (r.pLow != null && r.pHigh != null && r.pLow !== r.pHigh) {
          ctx.strokeStyle = c["--text"];
          ga(pv(past, 0.45, 0.15));
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, Y(r.pLow));
          ctx.lineTo(x, Y(r.pHigh));
          ctx.stroke();
          ctx.lineWidth = 1;
          ga(1);
        }
        if (age >= 0 && age < 1.6) {
          ctx.strokeStyle = c["--accent"];
          ga((1 - age / 1.6) * 0.8);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 8 + age * 30, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
          ga(1);
        }
        const rad = hover.current?.id === r.id ? 7.5 : following ? 6.5 : 5.5;
        ctx.beginPath();
        ctx.arc(x, y, rad + 2, 0, Math.PI * 2);
        ctx.fillStyle = c["--panel"];
        ga(pv(past, 0.95, 0.6));
        ctx.fill();
        ga(1);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        if (r.verified) {
          ctx.fillStyle = age >= 0 && age < 1.6 ? c["--accent"] : c["--text"];
          ga(pv(past, 1, 0.3));
          ctx.fill();
        } else {
          ctx.strokeStyle = age >= 0 && age < 1.6 ? c["--accent"] : c["--text"];
          ga(pv(past, 1, 0.3));
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        ga(1);
        if (false) {
          const label = `${shortWho(r.who)} ${fmtP(r)}`;
          ctx.font = `700 12px var(--font-heading), system-ui, sans-serif`;
          ctx.textBaseline = "middle";
          const tw = ctx.measureText(label).width;
          const leftSide = x + 12 + tw > w - PR;
          const tx = leftSide ? x - 12 - tw : x + 12;
          ga(hover.current?.id === r.id ? 1 : age < 4.5 ? Math.min(1, (4.5 - age) / 1.2) : 0.75);
          ctx.fillStyle = c["--panel"];
          ctx.fillRect(tx - 5, y - 10, tw + 10, 20);
          ctx.fillStyle = c["--text"];
          ctx.textAlign = "left";
          ctx.fillText(label, tx, y);
          ga(1);
        }
      }

      // ----- the name labels, on top of every dot
      setLayer(AX);
      for (const r of rows) {
        if (r.pitch == null || !visible(r.t)) continue;
        const fl = flashes.current.get(r.id);
        const age = fl == null ? Infinity : (now - fl) / 1000;
        const past = isPast(r.t);
        const show = (age >= 0 && age < 4.5) || hover.current?.id === r.id || (following && past > 0.5 && (age < 30 || zoom === 0));
        if (!show) continue;
        const x = xOf(r.t);
        const y = Ydot(r.pitch);
        const label = `${shortWho(r.who)} ${fmtP(r)}`;
        ctx.font = `700 12px var(--font-heading), system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        const tw = ctx.measureText(label).width;
        const leftSide = x + 12 + tw > w - PR;
        const tx = leftSide ? x - 12 - tw : x + 12;
        ga(hover.current?.id === r.id ? 1 : age < 4.5 ? Math.min(1, (4.5 - age) / 1.2) : 0.75);
        ctx.fillStyle = c["--panel"];
        ctx.fillRect(tx - 5, y - 10, tw + 10, 20);
        ctx.fillStyle = c["--text"];
        ctx.textAlign = "left";
        ctx.fillText(label, tx, y);
        ga(1);
      }

      // ----- the zoom brush while dragging
      setLayer(b.ph);
      if (brush.current) {
        const { x0, x1 } = brush.current;
        ctx.fillStyle = c["--accent"];
        ga(0.12);
        ctx.fillRect(Math.min(x0, x1), PT, Math.abs(x1 - x0), plotH);
        ga(1);
      }

      // ----- playhead
      const px = xOf(tNow);
      ctx.strokeStyle = c["--accent"];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, PT - 6);
      ctx.lineTo(px, floor + 6);
      ctx.stroke();
      ctx.lineWidth = 1;

      // ----- the narration line: the latest turning point, written along the bottom
      const cap = captionRef.current;
      if (cap) {
        const age = (now - cap.at) / 1000;
        const alpha = age < 0.3 ? age / 0.3 : age > 7 ? Math.max(0, 1 - (age - 7) / 1) : 1;
        if (alpha > 0) {
          ctx.font = `700 13px var(--font-heading), system-ui, sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          const tw = ctx.measureText(cap.text).width;
          ga(alpha);
          ctx.fillStyle = c["--panel"];
          ctx.fillRect(L, h - 22, tw + 14, 20);
          ctx.fillStyle = c["--text"];
          ctx.fillText(cap.text, L + 7, h - 8);
          ga(1);
        }
      }

      // ----- hovered month, on top of everything
      if (hoverMonth.current != null && !following) {
        const m = months[hoverMonth.current];
        const x0 = xOf(m.t), x1 = xOf(m.tEnd);
        ctx.fillStyle = c["--text"];
        ga(0.06);
        ctx.fillRect(x0, PT, Math.max(2, x1 - x0), plotH);
        ga(1);
        const lines = [`${fmtMonth(m.month)}: ${m.total.toLocaleString("en-GB")} posts, papers, stories and markets`, ...KINDS.map((k, i) => (m.counts[i] ? `${m.counts[i].toLocaleString("en-GB")} ${k.label}` : "")).filter(Boolean)];
        ctx.font = `500 11.5px var(--font-heading), system-ui, sans-serif`;
        const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const bx = Math.min(Math.max(x0 + 10, L), w - PR - tw - 20);
        const by = Math.max(PT, (lanes ? PT + numH : floor - pileH(m.total, maxMonth) * PILE * plotH) - lines.length * 15 - 14);
        ctx.fillStyle = c["--panel"];
        ga(0.95);
        ctx.fillRect(bx - 8, by - 6, tw + 16, lines.length * 15 + 10);
        ga(1);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((l, i) => {
          ctx.fillStyle = i === 0 ? c["--text"] : c["--muted"];
          ctx.fillText(l, bx, by + i * 15);
        });
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rows, months, grains, monthRange, mos, maxMonth, maxKind]);

  // ----- pointer -----
  const locate = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const el = canvas.current!;
    const rect = el.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const { L, plotW, top, following: follow, xOf, Ydot, tNow } = geo.current;
    const dom = domain.current;
    const tAt = follow ? tNow - WINDOW_MS * NOW_AT + ((x - L) / plotW) * WINDOW_MS : dom ? dom.t0 + ((x - L) / plotW) * (dom.t1 - dom.t0) : tFromU(Math.max(0, Math.min(1, (x - L) / plotW)));
    const uu = Math.max(0, Math.min(1, uOf(tAt)));
    let row: Row | null = null, bd = 11;
    for (const r of rows) {
      if (r.pitch == null) continue;
      const d = Math.hypot(xOf(r.t) - x, Ydot(r.pitch) - y);
      if (d < bd) (bd = d), (row = r);
    }
    let mo: Mo | null = null;
    if (y < top) {
      let md = 60;
      for (const m of mos) {
        if (m.row < 0) continue;
        const d = Math.abs(26 + m.row * ROW_H - y) < 7 ? Math.abs(xOf(m.t) - x) : Infinity;
        if (d < md) (md = d), (mo = m);
      }
    }
    let month: number | null = null;
    if (!row && y > top && !follow) {
      for (let i = 0; i < months.length; i++) {
        if (tAt >= months[i].t && tAt < months[i].tEnd) {
          month = months[i].total ? i : null;
          break;
        }
      }
    }
    return { row, mo, month, uu, follow, x, tAt };
  };
  const dragging = useRef(false);
  const onDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const { row, mo, uu, follow, x } = locate(ev);
    if (zoomingRef.current) {
      hoverMonth.current = null;
      hover.current = null;
      brush.current = { x0: x, x1: x };
      (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
      return;
    }
    if (row) return play(row, true);
    if (mo) return setCard(mo);
    if (follow) return;
    dragging.current = true;
    started.current = true;
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    uRef.current = uu;
    resync();
    setCursor(uu);
    setEnded(false);
    endedAt.current = null;
    recount(uu);
  };
  const onMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const { row, mo, month, uu, follow, x } = locate(ev);
    if (brush.current) {
      brush.current.x1 = x;
      return;
    }
    hover.current = row;
    hoverMo.current = mo;
    hoverMonth.current = month;
    canvas.current!.style.cursor = zoomingRef.current ? "zoom-in" : row || mo ? "pointer" : dragging.current ? "grabbing" : follow ? "default" : "crosshair";
    if (dragging.current && !follow) {
      uRef.current = uu;
      resync();
      setCursor(uu);
      recount(uu);
    }
  };
  const onUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    if (brush.current) {
      const { x0 } = brush.current;
      const { tAt: tb } = locate(ev);
      const { L, plotW } = geo.current;
      const dom = domain.current;
      const ta = dom ? dom.t0 + ((x0 - L) / plotW) * (dom.t1 - dom.t0) : tFromU(Math.max(0, Math.min(1, (x0 - L) / plotW)));
      brush.current = null;
      const t0 = Math.max(START, Math.min(ta, tb)), t1 = Math.min(NOW, Math.max(ta, tb));
      if (t1 - t0 > 45 * 864e5) {
        domain.current = { t0, t1 };
        setZoomed(true);
      }
      setZooming(false);
    }
  };
  // scroll to zoom at the cursor while the zoom tool is on
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!zoomingRef.current && !domain.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const { L, plotW } = geo.current;
      const f = Math.max(0, Math.min(1, (e.clientX - rect.left - L) / plotW));
      const dom = domain.current ?? { t0: START, t1: NOW };
      const at = dom.t0 + f * (dom.t1 - dom.t0);
      const k = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      let t0 = at - (at - dom.t0) * k, t1 = at + (dom.t1 - at) * k;
      t0 = Math.max(START, t0);
      t1 = Math.min(NOW, t1);
      if (t1 - t0 < 45 * 864e5) return;
      if (t0 <= START && t1 >= NOW) {
        domain.current = null;
        setZoomed(false);
      } else {
        domain.current = { t0, t1 };
        setZoomed(true);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const resetZoom = () => {
    domain.current = null;
    setZoomed(false);
    setZooming(false);
  };

  const restart = () => {
    started.current = true;
    risen.current.clear();
    uRef.current = 0;
    setCursor(0);
    setCard(null);
    setEnded(false);
    endedAt.current = null;
    captionRef.current = null;
    flashes.current.clear();
    recount(0);
    setPlaying(true);
  };
  // ----- the hero: play opens the score to the full screen, Escape or Close puts it back
  const openHero = () => {
    const a = (audio.current ??= new DoomAudio());
    a.setMuted(silentRef.current);
    a.ensure(); // sound can only be started from a click, so wake it now for the play that follows
    timers.current.forEach(clearTimeout);
    risen.current.clear();
    flashes.current.clear();
    captionRef.current = null;
    uRef.current = 0;
    setCursor(0);
    setCard(null);
    setEnded(false);
    endedAt.current = null;
    recount(0);
    setPhase("open");
    setStep(1);
    timers.current = [window.setTimeout(() => goTo(2), STEP_MS[1])];
  };
  /** One step of the opening; each waits long enough to read its line, or Next moves on at once. */
  const goTo = (n: number) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (n >= 2) setView("lanes");
    // the whole record stays at full strength through the tour; the unplayed part dims as the camera goes in
    const inCamera = () => ((started.current = true), setCamera("follow"));
    if (n >= 4) inCamera();
    setStep(n);
    if (n >= 4) return setPlaying(true);
    timers.current = [window.setTimeout(() => goTo(n + 1), STEP_MS[n])];
    // the flags are seen across the whole span first, then the camera goes in to 2009
    if (n === 3) timers.current.push(window.setTimeout(inCamera, 2600));
  };
  const skipIntro = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setView("lanes");
    setCamera("follow");
    started.current = true;
    setStep(4);
    setPlaying(true);
  };
  const closeHero = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
    setPhase("rest");
    setStep(0);
    setView("pile");
    setCamera("whole");
    started.current = false;
    uRef.current = 0;
    setCursor(0);
    setCard(null);
    setEnded(false);
    endedAt.current = null;
    captionRef.current = null;
    domain.current = null;
    setZoomed(false);
    setZooming(false);
    recount(0);
  };
  // the frame leaves the page and grows to fill the screen, then goes back to its place
  useLayoutEffect(() => {
    const box = heroBox.current, fr = frame.current;
    if (!box || !fr) return;
    const r = box.getBoundingClientRect();
    const at = { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` };
    if (phase === "open") {
      Object.assign(fr.style, { position: "fixed", zIndex: "10001", ...at });
      void fr.offsetHeight;
      Object.assign(fr.style, { top: "0px", left: "0px", width: "100vw", height: "100svh" });
      document.documentElement.style.overflow = "hidden";
      document.documentElement.classList.add("ds-focus");
      return;
    }
    if (fr.style.position !== "fixed") return;
    Object.assign(fr.style, at);
    document.documentElement.style.overflow = "";
    document.documentElement.classList.remove("ds-focus");
    const id = window.setTimeout(() => fr.removeAttribute("style"), 750);
    return () => clearTimeout(id);
  }, [phase]);
  const closeRef = useRef(closeHero);
  closeRef.current = closeHero;
  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
      document.documentElement.classList.remove("ds-focus");
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const when = new Date(tFromU(cursor)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

  const body = (
    <div ref={frame} className={`ds ${isHero ? "ds--hero" : ""} ${isHero && phase === "open" ? "is-open" : ""} ${isHero && step >= 3 ? "is-moments" : ""} ${isHero && step >= 4 ? "is-playing" : ""}`}>
      {isHero && step >= 1 && step < 4 ? (
        <div className="ds-intro" aria-live="polite">
          <p key={step}>{INTRO[step] ?? ""}</p>
          {step >= 2 ? (
            <button type="button" className="fa-btn fa-btn--ghost" onClick={() => goTo(step + 1)}>
              {step === 3 ? "Play" : "Next"}
            </button>
          ) : null}
          <button type="button" className="fa-btn fa-btn--ghost" onClick={skipIntro}>
            Skip
          </button>
        </div>
      ) : null}
      <div className="ds-bar">
        <button className="fa-btn fa-btn--primary ds-play" onClick={() => (ended ? restart() : setPlaying((p) => !p))} aria-label={playing ? "Pause" : "Play"}>
          {ended ? "Play again" : playing ? "Pause" : cursor > 0 ? "Resume" : "Play"}
        </button>
        <button className="fa-btn fa-btn--ghost" onClick={restart} disabled={cursor === 0 && !playing}>
          Restart
        </button>
        <button className={`fa-btn fa-btn--ghost ds-zoom ${zooming ? "is-on" : ""}`} onClick={() => setZooming((z) => !z)} aria-pressed={zooming} title="Then drag across the years you want, or scroll over the plot">
          {zooming ? "Drag to zoom…" : "Zoom"}
        </button>
        {zoomed ? (
          <button className="fa-btn fa-btn--ghost" onClick={resetZoom}>
            Whole span
          </button>
        ) : null}
        <button className={`fa-btn fa-btn--ghost ds-mute ${silent ? "is-on" : ""}`} onClick={() => setSilent((s) => !s)} aria-pressed={silent}>
          {silent ? "Sound off" : "Sound on"}
        </button>
        <div className="ds-stats">
          <div>
            <b>{when}</b>
            <span>at the playhead</span>
          </div>
          <div>
            <b>{stats.said.toLocaleString("en-GB")}</b>
            <span>posts, papers, stories and markets so far</span>
          </div>
          <div>
            <b>{stats.n}</b>
            <span>numbers given so far</span>
          </div>
          <div>
            <b>{stats.median == null ? "–" : `${Math.round(stats.median)}%`}</b>
            <span>median of them</span>
          </div>
        </div>
        {isHero ? (
          <button className="fa-btn fa-btn--ghost ds-exit" onClick={closeHero} title="Or press Escape">
            Close
          </button>
        ) : null}
      </div>
      <div className="ds-options">
        <label className="ds-ctl">
          <span>View</span>
          <select value={view} onChange={(e) => setView(e.target.value as View)}>
            <option value="pile">One pile</option>
            <option value="lanes">A lane per source</option>
          </select>
        </label>
        <label className="ds-ctl">
          <span>Camera</span>
          <select value={camera} onChange={(e) => setCamera(e.target.value as Camera)}>
            <option value="whole">Whole span</option>
            <option value="follow">Follow, then pull back</option>
          </select>
        </label>
        <label className="ds-ctl">
          <span>Length</span>
          <select value={speed} onChange={(e) => setSpeed(+e.target.value)}>
            {SPEEDS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {isHero ? <span className="ds-hint">Dots are numbers given, at their value; hollow when unverified. Tap one to hear it.</span> : null}
      </div>

      <div className="ds-stage">
        <div className="ds-plot">
          <canvas
            ref={canvas}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={() => ((hover.current = null), (hoverMo.current = null), (hoverMonth.current = null))}
          />
        </div>
        <aside className={`ds-side ${current ? "has-moment" : ""}`} aria-label="Key moments">
          <p className="ds-side-head">Key moments</p>
          {current ? (
            <div className="ds-moment" key={current.id}>
              {/* a frame of fixed height, so a picture loading, or a moment without one, never moves the list below */}
              <div className="ds-moment-pic">
                {current.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.thumb.src} width={current.thumb.w} height={current.thumb.h} alt="" onLoad={(e) => e.currentTarget.classList.add("is-loaded")} />
                ) : null}
              </div>
              <span className="ds-moment-date">{new Date(current.t).toLocaleDateString("en-GB", { day: current.date.length > 7 ? "numeric" : undefined, month: "long", year: "numeric", timeZone: "UTC" })}</span>
              {current.href ? (
                <a href={current.href}>
                <b>{current.title}</b>
              </a>
              ) : (
                <span className="ds-moment-title">
                <b>{current.title}</b>
              </span>
              )}
            </div>
          ) : (
            <p className="ds-side-empty">The turning points appear here as the playhead reaches them: ChatGPT, the pause letter, Hinton leaving Google, the Nobel Prize, the resignation letters.</p>
          )}
          {passed.length > 1 ? (
            <ol className="ds-passed">
              {passed
                .filter((m) => m.id !== current?.id)
                .map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => setCard(m)}>
                      <small>{new Date(m.t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</small>
                      {m.title}
                    </button>
                  </li>
                ))}
            </ol>
          ) : null}
        </aside>
      </div>

      {isHero ? (
        <div ref={cover} className="ds-cover" aria-hidden={phase === "open"}>
          <h1>{hero!.title}</h1>
          <p>{hero!.lead}</p>
          <button type="button" className="fa-btn fa-btn--primary ds-bigplay" onClick={openHero} tabIndex={phase === "open" ? -1 : 0}>
            <span aria-hidden="true">▶</span> Play
          </button>
          <small>{SPEEDS[speed].label}, with sound</small>
        </div>
      ) : (
      <div className="ds-legend">
        <span className="ds-legend-item">
          <i className="ds-glyph-grain" /> <b>Grains</b> one thing said, stacked by month:
        </span>
        {KINDS.map((k) => (
          <span key={k.short} className="ds-chip ds-chip--static" style={{ ["--c" as string]: `var(${k.v})` }}>
            <i />
            {k.label}
          </span>
        ))}
        <span className="ds-legend-item">
          <i className="ds-glyph-sq" /> <b>Flags</b> turning points
        </span>
        <span className="ds-legend-item">
          <i className="ds-glyph-dot" /> <b>Dots</b> a number given, at its value; hollow when unverified
        </span>
        <span className="ds-hint">Hover a month. Tap a dot to hear it. Drag to move.</span>
      </div>
      )}
    </div>
  );
  return isHero ? (
    <div ref={heroBox} className="ds-hero">
      {body}
    </div>
  ) : (
    body
  );
}
