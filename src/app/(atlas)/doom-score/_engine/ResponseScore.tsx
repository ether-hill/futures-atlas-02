"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DoomAudio } from "./audio";
import { GROUPS, KIND_LABEL_R, OUTCOME, type ResponseAction, type ResponseKind } from "@/data/doom-score/response-types";
import { placeOf } from "@/data/doom-score/response-places";

/**
 * The response, played. A second player beside the first, same grammar:
 *  - Talk is the clicks. Every month of posts, papers, stories and markets is
 *    a burst of geiger clicks, as many and as bright as that month was busy.
 *  - Action is the notes. Every law, rule, pledge or summit plays one note
 *    when the playhead reaches it.
 *  - Pitch is how binding it is: a hearing or a strategy sits low, a law or a
 *    treaty sits high. Higher on the plot, higher the note.
 *  - It took effect: a full note. Only proposed: a short, quiet pluck.
 *    Vetoed or revoked: the note falls.
 *  - Key moments, in orange, are the binding actions that name catastrophic
 *    or existential risk in their own text. They get the riser.
 * Two views (a lane per continent, or a row per kind of action), two cameras
 * (the whole span, or two years following the playhead and pulling back at
 * the end), and a zoom: drag across years, or scroll over the plot.
 */

type Row = Pick<ResponseAction, "id" | "date" | "jurisdiction" | "kind" | "status" | "title" | "namesCatastrophic">;
type Talk = { month: string; count: number };
type View = "continents" | "kinds";
type Camera = "whole" | "follow";

// how binding each kind is, weakest first: this is the pitch
const BIND: ResponseKind[] = ["hearing", "strategy", "declaration", "commitment", "standard", "institute", "bill", "executive", "law", "treaty"];
const pOf = (k: ResponseKind) => (BIND.indexOf(k) / (BIND.length - 1)) * 100;
const MOMENT_KINDS = new Set<ResponseKind>(["law", "treaty", "executive", "institute", "declaration"]);

const START = Date.UTC(2015, 0, 1);
const DAY = 864e5;
const tOf = (d: string) => Date.UTC(+d.slice(0, 4), d.length >= 7 ? +d.slice(5, 7) - 1 : 6, d.length >= 10 ? +d.slice(8, 10) : 15);
const SPEEDS = [
  { label: "45 seconds", s: 45 },
  { label: "1 minute 30", s: 90 },
  { label: "3 minutes", s: 180 },
];
const RISER_LEAD = 1.6;
const WINDOW_MS = 24 * 30.44 * DAY; // the follow camera shows two years
const NOW_AT = 0.72; // with the playhead at 72% of the width
const PULL_MS = 2800; // and pulls back to the whole over this long at the end
const MIN_SPAN = 60 * DAY;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Item = Row & { t: number; lane: number; p: number; out: "effect" | "pending" | "stopped"; moment: boolean };
type Geo = { L: number; R: number; w: number; top: number; plotBottom: number; xOf: (t: number) => number; tAt: (x: number) => number; following: boolean };

export function ResponseScore({ rows, talk }: { rows: Row[]; talk: Talk[] }) {
  const END = useMemo(() => {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  }, []);
  const lanes = useMemo(() => GROUPS.filter((g) => rows.some((r) => g.match(r.jurisdiction))), [rows]);
  const items: Item[] = useMemo(
    () =>
      rows
        .filter((r) => tOf(r.date) >= START)
        .map((r) => ({
          ...r,
          t: tOf(r.date),
          lane: lanes.findIndex((g) => g.match(r.jurisdiction)),
          p: pOf(r.kind),
          out: OUTCOME[r.status],
          moment: r.namesCatastrophic && OUTCOME[r.status] === "effect" && MOMENT_KINDS.has(r.kind),
        }))
        .sort((a, b) => a.t - b.t),
    [rows, lanes],
  );
  const kindsPresent = useMemo(() => BIND.filter((k) => items.some((i) => i.kind === k)), [items]);
  const months = useMemo(() => talk.filter((m) => m.month >= "2015").map((m) => ({ ...m, t: Date.UTC(+m.month.slice(0, 4), +m.month.slice(5, 7) - 1, 1) })), [talk]);
  const maxTalk = useMemo(() => Math.max(1, ...months.map((m) => m.count)), [months]);
  const moments = useMemo(() => items.filter((i) => i.moment), [items]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<DoomAudio | null>(null);
  const [playing, setPlaying] = useState(false);
  const [silent, setSilent] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<View>("continents");
  const [camera, setCamera] = useState<Camera>("whole");
  const [zooming, setZooming] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [cursor, setCursor] = useState(0); // 0..1
  const cur = useRef(0);
  const started = useRef(false);
  const endedAt = useRef<number | null>(null);
  const fired = useRef(new Set<string>());
  const hover = useRef<{ x: number; y: number } | null>(null);
  const hit = useRef<Item | null>(null);
  const tok = useRef<Record<string, string>>({});
  const domain = useRef<{ t0: number; t1: number } | null>(null);
  const brush = useRef<{ x0: number; x1: number } | null>(null);
  const geo = useRef<Geo | null>(null);
  const scrubbing = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const zoomingRef = useRef(zooming);
  zoomingRef.current = zooming;

  const span = END - START;
  const uOf = (t: number) => (t - START) / span;

  // theme tokens, re-read when the theme flips
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const o: Record<string, string> = {};
      for (const v of ["--text", "--muted", "--panel", "--bg", "--hairline", "--accent", "--ds-cat-2", "--ds-cat-3", "--ds-cat-5", "--font-heading"]) o[v] = cs.getPropertyValue(v).trim();
      tok.current = o;
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    audio.current?.setMuted(silent);
  }, [silent]);

  const sound = (a: DoomAudio, it: Item) => {
    if (it.out === "effect") a.note(it.p, "dread", { gain: 0.85, dur: 1.6 });
    else if (it.out === "pending") a.note(it.p, "dread", { gain: 0.3, dur: 0.45 });
    else a.note(it.p, "dread", { gain: 0.7, dur: 1.4, glideTo: Math.max(0, it.p - 45) });
  };

  /** Move the playhead without playing what it skips. */
  const seek = (u: number) => {
    const uu = Math.max(0, Math.min(1, u));
    started.current = true;
    cur.current = uu;
    endedAt.current = null;
    fired.current.clear();
    for (const m of months) if (uOf(m.t) < uu) fired.current.add(m.month);
    for (const it of items) if (uOf(it.t) < uu) fired.current.add(it.id), fired.current.add(`r:${it.id}`);
    setCursor(uu);
  };

  // the clock
  useEffect(() => {
    if (!playing) return;
    const a = (audio.current ??= new DoomAudio());
    a.ensure();
    a.setMuted(silent);
    started.current = true;
    endedAt.current = null;
    const secs = SPEEDS[speed].s;
    let last = performance.now();
    let shown = cur.current;
    let raf = 0;
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = scrubbing.current ? cur.current : Math.min(1, cur.current + dt / secs);
      cur.current = next;
      const lat = a.latency();
      const ahead = (s: number) => next + s / secs;
      // talk: each month as a burst of clicks spread across the month
      for (const m of months) {
        const u = uOf(m.t);
        if (u > ahead(lat) || fired.current.has(m.month)) continue;
        fired.current.add(m.month);
        const k = m.count / maxTalk;
        const n = Math.round(Math.sqrt(m.count) * 0.9);
        const monthSecs = (secs * (31 * DAY)) / span;
        for (let i = 0; i < n; i++) a.tick(0.05 + k * 0.1, Math.random() * monthSecs, k);
      }
      // action: one note each
      for (const it of items) {
        const u = uOf(it.t);
        if (it.moment && !fired.current.has(`r:${it.id}`) && u <= ahead(lat + RISER_LEAD)) {
          fired.current.add(`r:${it.id}`);
          a.moment("riser", 0.9);
        }
        if (u > ahead(lat) || fired.current.has(it.id)) continue;
        fired.current.add(it.id);
        sound(a, it);
      }
      if (Math.abs(next - shown) >= 0.002 || next >= 1) {
        shown = next;
        setCursor(next);
      }
      if (next >= 1) {
        endedAt.current = performance.now();
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  // drawing
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const el = canvas.current;
      if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      const c = el.getContext("2d")!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const T = tok.current;
      const font = T["--font-heading"] || "system-ui";
      const byKind = viewRef.current === "kinds";
      const rowsN = byKind ? kindsPresent.length : lanes.length;
      const L = Math.min(150, w * 0.2), R = 16, top = 14, bottom = 26;
      const plotW = w - L - R;
      const talkH = Math.max(60, h * 0.2);
      const laneTop = top + talkH + 18;
      const laneH = (h - laneTop - bottom) / rowsN;
      const u = cur.current;
      const live = started.current;
      const tNow = START + u * span;

      // the camera: whole (or the zoomed domain), or a two-year window that follows the playhead and pulls back at the end
      const dom = domain.current ?? { t0: START, t1: END };
      const xFull = (t: number) => L + ((t - dom.t0) / (dom.t1 - dom.t0)) * plotW;
      const w0 = tNow - WINDOW_MS * NOW_AT;
      const xWin = (t: number) => L + ((t - w0) / WINDOW_MS) * plotW;
      const pull = cameraRef.current === "follow" && live ? (endedAt.current == null ? 0 : ease((performance.now() - endedAt.current) / PULL_MS)) : 1;
      const following = pull < 1;
      const X = (t: number) => (pull >= 1 ? xFull(t) : pull <= 0 ? xWin(t) : xWin(t) + (xFull(t) - xWin(t)) * pull);
      const tAt = (x: number) => (following ? w0 + ((x - L) / plotW) * WINDOW_MS : dom.t0 + ((x - L) / plotW) * (dom.t1 - dom.t0));
      geo.current = { L, R, w, top, plotBottom: h - bottom, xOf: X, tAt, following };
      const dim = (t: number) => (!live || t <= tNow ? 1 : 0.16);
      const visT0 = tAt(L), visT1 = tAt(w - R);

      // time ticks: years, or months when the view is under three years wide
      c.font = `11px ${font}`;
      c.textAlign = "center";
      const narrow = visT1 - visT0 < 3 * 365 * DAY;
      const ticks: { t: number; label: string; major: boolean }[] = [];
      if (narrow) {
        const d0 = new Date(visT0);
        for (let y = d0.getUTCFullYear(), m = d0.getUTCMonth(); ; m++) {
          if (m > 11) (m = 0), y++;
          const t = Date.UTC(y, m, 1);
          if (t > visT1) break;
          ticks.push({ t, label: m === 0 ? String(y) : visT1 - visT0 < 400 * DAY || m % 3 === 0 ? MONTHS[m] : "", major: m === 0 });
        }
      } else {
        for (let y = 2015; y <= new Date(END).getUTCFullYear(); y++) ticks.push({ t: Date.UTC(y, 6, 1), label: String(y), major: false }), ticks.push({ t: Date.UTC(y, 0, 1), label: "", major: true });
      }
      c.save();
      c.beginPath();
      c.rect(L, 0, plotW, h);
      c.clip();
      for (const tk of ticks) {
        const x = X(tk.t);
        if (tk.major || narrow) {
          c.strokeStyle = T["--text"];
          c.globalAlpha = tk.major ? 0.1 : 0.05;
          c.beginPath();
          c.moveTo(x, top);
          c.lineTo(x, h - bottom);
          c.stroke();
        }
        if (tk.label && x > L + 14 && x < w - R - 14) {
          c.globalAlpha = 0.75;
          c.fillStyle = tk.major && narrow ? T["--text"] : T["--muted"];
          c.fillText(tk.label, x, h - 8);
        }
      }
      c.globalAlpha = 1;

      // talk band
      for (let i = 0; i < months.length; i++) {
        const m = months[i];
        const x0 = X(m.t), x1 = X(i + 1 < months.length ? months[i + 1].t : END);
        if (x1 < L || x0 > w - R) continue;
        const bh = Math.sqrt(m.count / maxTalk) * talkH;
        c.globalAlpha = 0.85 * dim(m.t);
        c.fillStyle = T["--ds-cat-3"];
        c.fillRect(x0 + 0.5, top + talkH - bh, Math.max(1, x1 - x0 - 1), bh);
      }
      c.globalAlpha = 1;
      c.restore();

      // row labels and rules
      c.textAlign = "right";
      c.fillStyle = T["--text"];
      c.font = `600 12px ${font}`;
      c.fillText("Talk", L - 12, top + talkH - 4);
      for (let i = 0; i < rowsN; i++) {
        const y0 = laneTop + i * laneH;
        c.strokeStyle = T["--text"];
        c.globalAlpha = 0.1;
        c.beginPath();
        c.moveTo(L, y0 + laneH);
        c.lineTo(w - R, y0 + laneH);
        c.stroke();
        c.globalAlpha = 1;
        c.fillStyle = T["--text"];
        c.font = `600 12px ${font}`;
        // kinds run top to bottom from most binding to least, so up is up
        const label = byKind ? KIND_LABEL_R[kindsPresent[rowsN - 1 - i]] : lanes[i].label;
        c.fillText(label, L - 12, y0 + laneH / 2 + 4);
      }

      // actions
      const r0 = following ? 1.35 : 1;
      let found: Item | null = null;
      const yOf = (it: Item) => {
        if (byKind) {
          const row = rowsN - 1 - kindsPresent.indexOf(it.kind);
          // within a kind's row, spread by continent so a busy month does not stack on one point
          return laneTop + row * laneH + 8 + ((it.lane + 0.5) / lanes.length) * (laneH - 16);
        }
        return laneTop + it.lane * laneH + laneH - 7 - (it.p / 100) * (laneH - 14);
      };
      c.save();
      c.beginPath();
      c.rect(L - 8, 0, plotW + 16, h);
      c.clip();
      const latest = new Map<number, Item>();
      if (following) for (const it of items) if (it.t <= tNow && tNow - it.t < 70 * DAY) latest.set(byKind ? BIND.indexOf(it.kind) : it.lane, it);
      const labelled = new Set([...latest.values()].map((i) => i.id));
      for (const it of items) {
        const x = X(it.t);
        if (x < L - 10 || x > w - R + 10) continue;
        const y = yOf(it);
        const a = dim(it.t);
        const age = (tNow - it.t) / span;
        const just = live && it.t <= tNow && age < 0.012;
        const r = ((it.out === "effect" ? 4 : 3.4) + (just ? 3 * (1 - age / 0.012) : 0)) * r0;
        c.globalAlpha = a;
        if (it.moment) {
          c.strokeStyle = T["--ds-cat-2"];
          c.globalAlpha = a * 0.55;
          c.beginPath();
          c.moveTo(x, laneTop - 6);
          c.lineTo(x, y);
          c.stroke();
          c.globalAlpha = a;
        }
        if (it.out === "effect") {
          c.fillStyle = it.moment ? T["--ds-cat-2"] : T["--ds-cat-5"];
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
        } else if (it.out === "pending") {
          c.strokeStyle = T["--muted"];
          c.lineWidth = 1.3;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.stroke();
        } else {
          c.strokeStyle = T["--muted"];
          c.lineWidth = 1.6;
          const s = 3.5 * r0;
          c.beginPath();
          c.moveTo(x - s, y - s);
          c.lineTo(x + s, y + s);
          c.moveTo(x + s, y - s);
          c.lineTo(x - s, y + s);
          c.stroke();
        }
        c.lineWidth = 1;
        const hv = hover.current;
        if (hv && !zoomingRef.current && Math.hypot(hv.x - x, hv.y - y) < 7 * r0) found = it;
        // while following, name what just sounded
        if (labelled.has(it.id)) {
          c.globalAlpha = Math.max(0, 1 - (tNow - it.t) / (70 * DAY));
          c.fillStyle = T["--text"];
          c.textAlign = "left";
          c.font = `12px ${font}`;
          const t = it.title.length > 44 ? `${it.title.slice(0, 42)}…` : it.title;
          c.fillText(`${placeOf(it.jurisdiction)[0]} ${t}`, x + 8, y - 6);
          c.globalAlpha = 1;
        }
      }
      c.globalAlpha = 1;
      c.restore();
      hit.current = found;

      // zoom brush
      if (brush.current) {
        const { x0, x1 } = brush.current;
        c.fillStyle = T["--accent"] || T["--text"];
        c.globalAlpha = 0.14;
        c.fillRect(Math.min(x0, x1), top, Math.abs(x1 - x0), h - bottom - top);
        c.globalAlpha = 1;
      }

      // playhead
      if (live) {
        const x = X(tNow);
        if (x >= L && x <= w - R) {
          c.strokeStyle = T["--text"];
          c.globalAlpha = 0.8;
          c.beginPath();
          c.moveTo(x, top);
          c.lineTo(x, h - bottom);
          c.stroke();
          c.globalAlpha = 1;
        }
      }

      // hover label
      const hi: Item | null = found;
      if (hi) {
        const x = X(hi.t), y = yOf(hi);
        const [flag, place] = placeOf(hi.jurisdiction);
        const line1 = hi.title.length > 70 ? `${hi.title.slice(0, 68)}…` : hi.title;
        const d = hi.date;
        const date = d.length === 4 ? d : d.length === 7 ? `${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
        const line2 = `${flag} ${place} · ${date} · ${KIND_LABEL_R[hi.kind]} · ${hi.out === "effect" ? "took effect" : hi.out === "pending" ? "proposed" : "vetoed or revoked"}`;
        c.font = `600 12px ${font}`;
        const tw = Math.max(c.measureText(line1).width, c.measureText(line2).width) + 20;
        const bx = Math.min(w - tw - 6, Math.max(6, x + 10)), by = Math.max(6, y - 52);
        c.fillStyle = T["--panel"] || T["--bg"];
        c.strokeStyle = T["--hairline"] || T["--muted"];
        c.fillRect(bx, by, tw, 44);
        c.strokeRect(bx + 0.5, by + 0.5, tw - 1, 43);
        c.textAlign = "left";
        c.fillStyle = T["--text"];
        c.fillText(line1, bx + 10, by + 18);
        c.font = `12px ${font}`;
        c.fillStyle = T["--muted"];
        c.fillText(line2, bx + 10, by + 35);
      }
      el.style.cursor = zoomingRef.current ? "zoom-in" : hi ? "pointer" : scrubbing.current ? "grabbing" : following ? "default" : "ew-resize";
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, lanes, kindsPresent, months, maxTalk, END, span]);

  // pointer: hover, tap a dot to hear it, drag to move the playhead, or brush to zoom
  const local = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = local(e);
    const g = geo.current;
    if (!g) return;
    if (zoomingRef.current) {
      brush.current = { x0: p.x, x1: p.x };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (hit.current) {
      sound((audio.current ??= new DoomAudio()), hit.current);
      return;
    }
    if (g.following || p.x < g.L) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seek(uOf(g.tAt(p.x)));
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = local(e);
    hover.current = p;
    if (brush.current) {
      brush.current.x1 = p.x;
      return;
    }
    const g = geo.current;
    if (scrubbing.current && g) seek(uOf(g.tAt(p.x)));
  };
  const onUp = () => {
    scrubbing.current = false;
    const g = geo.current;
    if (brush.current && g) {
      const { x0, x1 } = brush.current;
      brush.current = null;
      const ta = g.tAt(Math.min(x0, x1)), tb = g.tAt(Math.max(x0, x1));
      const t0 = Math.max(START, ta), t1 = Math.min(END, tb);
      if (t1 - t0 > MIN_SPAN) {
        domain.current = { t0, t1 };
        setZoomed(true);
      }
      setZooming(false);
    }
  };
  // scroll over the plot to zoom at the cursor, once the zoom tool is on or a zoom is set
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const g = geo.current;
      if (!g || g.following || (!zoomingRef.current && !domain.current)) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const at = g.tAt(e.clientX - rect.left);
      const dom = domain.current ?? { t0: START, t1: END };
      const k = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      const t0 = Math.max(START, at - (at - dom.t0) * k), t1 = Math.min(END, at + (dom.t1 - at) * k);
      if (t1 - t0 < MIN_SPAN) return;
      if (t0 <= START && t1 >= END) {
        domain.current = null;
        setZoomed(false);
      } else {
        domain.current = { t0, t1 };
        setZoomed(true);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [END]);
  const resetZoom = () => {
    domain.current = null;
    setZoomed(false);
    setZooming(false);
  };

  const restart = () => {
    seek(0);
    setPlaying(true);
  };
  const ended = cursor >= 1;
  const tNow = START + cursor * span;
  const sofar = useMemo(() => {
    const t = started.current ? tNow : END;
    const said = months.filter((m) => m.t <= t).reduce((a, m) => a + m.count, 0);
    const done = items.filter((i) => i.t <= t);
    return { said, acts: done.length };
  }, [tNow, months, items, END]);
  const passed = moments.filter((m) => !started.current || m.t <= tNow);
  const current = started.current ? passed.at(-1) : null;
  const when = new Date(started.current ? Math.min(tNow, END - 1) : END - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <div className="ds">
      <div className="ds-bar">
        <button className="fa-btn fa-btn--primary ds-play" onClick={() => (ended ? restart() : setPlaying((p) => !p))} aria-label={playing ? "Pause" : "Play"}>
          {ended ? "Play again" : playing ? "Pause" : cursor > 0 ? "Resume" : "Play"}
        </button>
        <button className="fa-btn fa-btn--ghost" onClick={restart} disabled={cursor === 0 && !playing}>
          Restart
        </button>
        <button className={`fa-btn fa-btn--ghost ${zooming ? "is-on" : ""}`} onClick={() => setZooming((z) => !z)} aria-pressed={zooming} title="Then drag across the years you want, or scroll over the plot">
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
            <b>{sofar.said.toLocaleString("en-GB")}</b>
            <span>posts, papers, stories and markets so far</span>
          </div>
          <div>
            <b>{sofar.acts}</b>
            <span>laws, rules and pledges so far</span>
          </div>
          <div>
            <b>{sofar.acts ? `${Math.round(sofar.said / sofar.acts)} to 1` : "–"}</b>
            <span>talk to action</span>
          </div>
        </div>
      </div>
      <div className="ds-options">
        <label className="ds-ctl">
          <span>View</span>
          <select value={view} onChange={(e) => setView(e.target.value as View)}>
            <option value="continents">A lane per continent</option>
            <option value="kinds">A row per kind of action</option>
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
      </div>

      <div className="ds-stage">
        <div className="ds-plot">
          <canvas ref={canvas} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => (hover.current = null)} />
        </div>
        <aside className={`ds-side ${current ? "has-moment" : ""}`} aria-label="Key moments">
          <p className="ds-side-head">Key moments</p>
          {current ? (
            <div className="ds-moment">
              <span className="ds-moment-date">
                {placeOf(current.jurisdiction).join(" ")} · {new Date(current.t).toLocaleDateString("en-GB", { day: current.date.length > 7 ? "numeric" : undefined, month: "long", year: "numeric", timeZone: "UTC" })}
              </span>
              <a href={`/doom-score/response#${current.id}`}>
                <b>{current.title}</b>
              </a>
            </div>
          ) : (
            <p className="ds-side-empty">Binding actions that name catastrophic or existential risk in their own text. They appear here as the playhead reaches them.</p>
          )}
          {passed.length > (current ? 1 : 0) ? (
            <ol className="ds-passed">
              {passed
                .filter((m) => m.id !== current?.id)
                .slice()
                .reverse()
                .map((m) => (
                  <li key={m.id}>
                    <a href={`/doom-score/response#${m.id}`}>
                      <small>
                        {placeOf(m.jurisdiction)[0]} {new Date(m.t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}
                      </small>
                      {m.title}
                    </a>
                  </li>
                ))}
            </ol>
          ) : null}
        </aside>
      </div>

      <div className="ds-legend">
        <span className="ds-legend-item">
          <i className="ds-glyph-bar" /> <b>Talk</b> posts, papers, stories and markets a month, played as clicks
        </span>
        <span className="ds-legend-item">
          <i className="ds-glyph-dot ds-glyph-dot--effect" /> <b>Took effect</b> a full note
        </span>
        <span className="ds-legend-item">
          <i className="ds-glyph-ring" /> <b>Proposed only</b> a quiet pluck
        </span>
        <span className="ds-legend-item">
          <b>×</b> <b>Vetoed or revoked</b> a falling note
        </span>
        <span className="ds-legend-item">
          <i className="ds-glyph-sq" /> <b>Key moment</b> binding, and names catastrophic risk
        </span>
        <span className="ds-hint">
          {view === "kinds" ? "Higher rows are more binding, and sound higher: hearings at the bottom, treaties at the top." : "Higher in a lane means more binding, and a higher note: a hearing sits at the bottom, a treaty at the top."} Hover a dot to see it, tap to hear it, drag to move.
        </span>
      </div>
    </div>
  );
}
