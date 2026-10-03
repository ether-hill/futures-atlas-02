"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sketchById } from "@/lib/specimens";
import { LIGHT_SETUPS, WINDOW_PARAMS } from "@/lib/specimens/light";
import { progressive, type Job } from "@/lib/specimens/progressive";
import { AbortError, maxFrameSize } from "@/lib/specimens/render";
import { diff, resolve, round, type ParamDef, type Renderer, type Values } from "@/lib/specimens/types";
import type { SpecimenPin } from "@/lib/store";

/**
 * The bench: one sketch, its canvas and every dial it declares.
 *
 * The stage holds still and the panel scrolls beside it, so a dial and the
 * thing it moves are always both in view.
 *
 * Timed sketches play: the lab advances a clock and draws every frame at a
 * resolution that adapts to what the GPU manages, so motion stays smooth and
 * the picture sharpens on a fast card. Paused, a static sketch renders on
 * demand as before: a cheap low-resolution preview the moment anything moves,
 * then the full frame built up tile by tile from the centre.
 *
 * Export never records the screen. PNG and MP4 are rendered offline, frame by
 * frame, at the chosen size and sample count (render.ts, video.ts): the video
 * is the computation, however long each frame takes.
 *
 * The URL always carries the values that differ from the defaults, so the
 * address bar is a link to exactly what is on screen.
 */

const THUMB_SIZE = 480;
/** Live canvas cap on the long side, in device pixels. */
const MAX_LIVE = 1400;
/** What a paused preview pass should cost; its resolution adapts to hit it. */
const PREVIEW_MS = 50;
/** How long things must be still before the full frame starts. */
const IDLE_MS = 180;
/** While playing: the frame time the live resolution steers toward (ms), and
 *  the most pixels it will spend on the long side. Past ~900 device pixels a
 *  moving form gains nothing visible, and every pixel is a full raymarch. */
const PLAY_TARGET_MS = 20, PLAY_MAX_PX = 900;

const RESOLUTIONS = [
  { id: "1080p", label: "1920 × 1080 · HD", w: 1920, h: 1080 },
  { id: "1440p", label: "2560 × 1440 · QHD", w: 2560, h: 1440 },
  { id: "4k", label: "3840 × 2160 · 4K", w: 3840, h: 2160 },
  { id: "sq1080", label: "1080 × 1080 · square", w: 1080, h: 1080 },
  { id: "sq2160", label: "2160 × 2160 · square", w: 2160, h: 2160 },
  { id: "4x5", label: "1080 × 1350 · 4:5", w: 1080, h: 1350 },
  { id: "9x16", label: "1080 × 1920 · vertical", w: 1080, h: 1920 },
  { id: "custom", label: "Custom…", w: 0, h: 0 },
] as const;

/** Bits per pixel per frame. Fine lattices in motion are hard on an encoder,
 *  so even "Good" is generous by streaming standards. */
const QUALITIES = [
  { label: "Good", bpp: 0.1 },
  { label: "High", bpp: 0.18 },
  { label: "Master", bpp: 0.32 },
];

interface ExportSettings {
  res: string;
  cw: number;
  ch: number;
  fps: number;
  /** Seconds, or null for exactly one cycle (a seamless loop). */
  duration: number | null;
  samples: number;
  shutter: number;
  quality: number;
}

const DEFAULT_EXPORT: ExportSettings = {
  res: "1080p",
  cw: 2400,
  ch: 2400,
  fps: 60,
  duration: null,
  samples: 4,
  shutter: 0.5,
  quality: 1,
};

const EXPORT_KEY = "specimens:export";

const label = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";
const chip = (on: boolean) =>
  `border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
    on ? "border-ink bg-ink text-surface" : "border-ink/20 text-ink-70 hover:border-ink hover:text-ink"
  }`;
const field = "w-full border border-ink/20 bg-transparent px-2.5 py-1.5 text-[13px] text-ink";

function fmt(p: ParamDef, v: number): string {
  if (p.kind !== "range") return "";
  const decimals = p.step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(p.step)));
  return v.toFixed(decimals);
}

function duration(s: number): string {
  if (!Number.isFinite(s)) return "…";
  if (s < 90) return `${Math.round(s)} s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
}

export function Lab({ sketchId, initial }: { sketchId: string; initial: Values }) {
  const sketch = sketchById(sketchId)!;
  const [values, setValues] = useState<Values>(() => resolve(sketch, initial));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pins, setPins] = useState<SpecimenPin[] | null>(null);
  const [canPin, setCanPin] = useState(false);
  const [pinTitle, setPinTitle] = useState("");
  const [pinNote, setPinNote] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [playing, setPlaying] = useState(!!sketch.timed);
  const [clock, setClock] = useState(0);
  const [ex, setEx] = useState<ExportSettings>(DEFAULT_EXPORT);
  const [maxSize, setMaxSize] = useState(8192);
  const [job, setJob] = useState<{ frame: number; total: number; perFrame: number; sub: number } | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const rendRef = useRef<Renderer | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const playingRef = useRef(playing);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const emaRef = useRef(16);
  const liveScaleRef = useRef(0.5);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobRef = useRef<Job | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const exportingRef = useRef(false);
  /** Preview resolution, adapted so a preview pass costs about PREVIEW_MS. */
  const previewScaleRef = useRef(0.25);

  /* ---------- export settings (remembered per browser) ---------- */

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(EXPORT_KEY) ?? "null");
      if (saved && typeof saved === "object") setEx((e) => ({ ...e, ...saved }));
    } catch {
      /* private window, blocked storage: defaults are fine */
    }
    setMaxSize(Math.min(8192, maxFrameSize() || 4096));
    // honour reduced motion: open paused
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_KEY, JSON.stringify(ex));
    } catch {
      /* not essential */
    }
  }, [ex]);

  const cycle = sketch.timed && values.cycle ? values.cycle : 20;
  const size = useMemo(() => {
    const r = RESOLUTIONS.find((x) => x.id === ex.res) ?? RESOLUTIONS[0];
    const w = r.id === "custom" ? ex.cw : r.w, h = r.id === "custom" ? ex.ch : r.h;
    const clamp = (n: number) => Math.max(16, Math.min(maxSize, Math.round(n || 0))) & ~1;
    return { w: clamp(w), h: clamp(h) };
  }, [ex.res, ex.cw, ex.ch, maxSize]);
  const aspect = size.w / size.h;
  const seconds = ex.duration ?? cycle;
  const frames = Math.max(1, Math.round(seconds * ex.fps));
  const bitrate = Math.round(Math.max(4e6, Math.min(240e6, size.w * size.h * ex.fps * QUALITIES[ex.quality].bpp)));

  /* ---------- stage: the frame fitted to the space, at the export aspect ---------- */

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      let w = width, h = width / aspect;
      if (h > height) {
        h = height;
        w = h * aspect;
      }
      setBox({ w: Math.floor(w), h: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  /** Size the canvas to its box (only when that changed: resizing clears it). */
  const fit = useCallback((): [number, number] => {
    const c = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = (c.clientWidth || 600) * dpr, h = (c.clientHeight || 600) * dpr;
    const k = Math.min(1, MAX_LIVE / Math.max(w, h));
    w = Math.max(16, Math.round(w * k));
    h = Math.max(16, Math.round(h * k));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    return [w, h];
  }, []);

  /* ---------- drawing ---------- */

  const cancelJob = () => {
    jobRef.current?.cancel();
    jobRef.current = null;
    setProgress(null);
  };
  const clearIdle = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = null;
  };

  const fail = (e: unknown) => setError(String(e instanceof Error ? e.message : e));

  /** One cheap low-resolution pass, stretched over the canvas. */
  const preview = useCallback(() => {
    const r = rendRef.current;
    if (!r) return;
    const [w, h] = fit();
    try {
      r.draw(valuesRef.current, { w, h, scale: previewScaleRef.current, fast: true, time: timeRef.current });
    } catch (e) {
      fail(e);
    }
  }, [fit]);

  /** The full-resolution frame, built up tile by tile (see progressive.ts). */
  const refine = useCallback(() => {
    const gl = glRef.current, r = rendRef.current;
    if (!gl || !r) return Promise.resolve(false);
    jobRef.current?.cancel();
    const [w, h] = fit();
    const t0 = performance.now();
    const job = progressive(gl, r, valuesRef.current, w, h, { onProgress: setProgress, view: { time: timeRef.current } });
    jobRef.current = job;
    return job.done.then((ok) => {
      if (jobRef.current === job) {
        jobRef.current = null;
        setProgress(null);
      }
      if (ok) {
        const took = performance.now() - t0;
        setMs(Math.round(took));
        // Size the next previews from this frame. Timing a preview directly
        // would need a readback, which costs more than the preview does.
        previewScaleRef.current = Math.max(0.1, Math.min(0.5, Math.sqrt(PREVIEW_MS / (took * 0.6))));
        liveScaleRef.current = Math.max(liveScaleRef.current, previewScaleRef.current);
      }
      return ok;
    });
  }, [fit]);

  /** Paused, static sketch: a preview now, the full frame once things go still. */
  const schedule = useCallback(() => {
    if (sketch.animated || playingRef.current || exportingRef.current) return;
    cancelJob();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(preview);
    clearIdle();
    idleRef.current = setTimeout(() => {
      if (!draggingRef.current) refine();
    }, IDLE_MS);
  }, [sketch.animated, preview, refine]);

  /** Paused simulation: show the state as it stands. */
  const drawHeld = useCallback(() => {
    const r = rendRef.current;
    if (!r || exportingRef.current) return;
    const [w, h] = fit();
    try {
      r.draw(valuesRef.current, { w, h, hold: true, time: timeRef.current });
    } catch (e) {
      fail(e);
    }
  }, [fit]);

  /** The play loop. Static sketches draw at an adaptive scale: down when
   *  frames run long, back up when they come in fast. */
  const startLoop = useCallback(() => {
    lastFrameRef.current = 0;
    const loop = (now: number) => {
      const r = rendRef.current;
      if (!r) return;
      const last = lastFrameRef.current;
      lastFrameRef.current = now;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      if (playingRef.current) timeRef.current += dt;
      const [w, h] = fit();
      try {
        if (sketch.animated) {
          r.draw(valuesRef.current, { w, h, hold: !playingRef.current, time: timeRef.current });
        } else {
          // Cost goes with pixel count, so the scale moves by the square root
          // of how far off the frame time is: a slow frame is corrected in
          // two or three frames, not thirty. (A fixed 5% step per frame was
          // the first version, and at 6 fps it took seconds to back off.)
          if (last) emaRef.current = emaRef.current * 0.6 + dt * 1000 * 0.4;
          let s = liveScaleRef.current * Math.max(0.6, Math.min(1.08, Math.sqrt(PLAY_TARGET_MS / emaRef.current)));
          s = Math.max(0.08, Math.min(PLAY_MAX_PX / Math.max(w, h), s));
          liveScaleRef.current = s;
          r.draw(valuesRef.current, { w, h, scale: s, fast: draggingRef.current, play: true, time: timeRef.current });
        }
      } catch (e) {
        fail(e);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [fit, sketch.animated]);

  /** Whatever the live canvas should be doing now. */
  const resume = useCallback(() => {
    if (!rendRef.current || exportingRef.current) return;
    if (playingRef.current) {
      cancelJob();
      clearIdle();
      startLoop();
    } else {
      cancelAnimationFrame(rafRef.current);
      if (sketch.animated) drawHeld();
      else schedule();
    }
  }, [sketch.animated, startLoop, drawHeld, schedule]);

  useEffect(() => {
    const c = canvasRef.current!;
    const gl = c.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) {
      setError("This browser has no WebGL2, which every sketch here needs.");
      return;
    }
    glRef.current = gl;
    try {
      rendRef.current = sketch.create(gl);
    } catch (e) {
      fail(e);
      return;
    }
    resume();
    const onResize = () => !playingRef.current && (sketch.animated ? drawHeld() : schedule());
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      jobRef.current?.cancel();
      abortRef.current?.abort();
      clearIdle();
      window.removeEventListener("resize", onResize);
      rendRef.current?.dispose();
      rendRef.current = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per sketch
  }, [sketch]);

  useEffect(() => {
    playingRef.current = playing;
    resume();
  }, [playing, resume]);

  // a paused frame follows the dials and the frame size
  useEffect(() => {
    if (playingRef.current) return;
    if (sketch.animated) drawHeld();
    else schedule();
  }, [values, box, sketch.animated, drawHeld, schedule]);

  // the clock readout, ten times a second while playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setClock(timeRef.current), 100);
    return () => clearInterval(id);
  }, [playing]);

  // Address bar = what is on screen.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(diff(sketch, values))) q.set(k, String(v));
      const s = q.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
    }, 250);
    return () => clearTimeout(t);
  }, [values, sketch]);

  /* ---------- pins ---------- */

  const loadPins = useCallback(async () => {
    try {
      const r = await fetch("/api/specimens", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { configured: boolean; pins: SpecimenPin[] };
      setCanPin(j.configured);
      setPins(j.pins.filter((p) => p.sketch === sketch.id));
    } catch {
      setCanPin(false);
      setPins([]);
    }
  }, [sketch.id]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  /* ---------- actions ---------- */

  const set = (key: string, v: number) => setValues((prev) => ({ ...prev, [key]: v }));

  const applyPreset = (pv: Values) =>
    setValues((prev) => {
      const next = resolve(sketch, pv);
      // a preset is a form, not a camera, a light or a motion: keep those
      for (const p of sketch.params) {
        if (p.hidden || p.group === "Light" || p.group === "Motion") next[p.key] = prev[p.key];
      }
      return next;
    });

  /** A lighting setup: the window's dials back to default, then the setup. */
  const lightKeys = useMemo(
    () => new Set([...WINDOW_PARAMS.map((p) => p.key), "ground", "rim"].filter((k) => sketch.params.some((p) => p.key === k))),
    [sketch],
  );
  const applySetup = (sv: Values) =>
    setValues((prev) => {
      const next = { ...prev };
      for (const p of sketch.params) if (lightKeys.has(p.key)) next[p.key] = sv[p.key] ?? p.default;
      return next;
    });
  const activeSetup = LIGHT_SETUPS.find((s) =>
    [...lightKeys].every((k) => Math.abs((s.values[k] ?? sketch.params.find((p) => p.key === k)!.default) - values[k]) < 1e-6),
  )?.name;

  const say = (s: string, ms = 2600) => {
    setFlash(s);
    setTimeout(() => setFlash(null), ms);
  };

  /** Stop the live canvas while an export has the GPU; give it back after. */
  const exclusive = async <T,>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    const ac = new AbortController();
    abortRef.current = ac;
    exportingRef.current = true;
    cancelAnimationFrame(rafRef.current);
    cancelJob();
    clearIdle();
    setBusy(true);
    try {
      return await fn(ac.signal);
    } catch (e) {
      if (e instanceof AbortError || ac.signal.aborted) say("Export cancelled");
      else say(`Export failed: ${e instanceof Error ? e.message : e}`, 6000);
      return null;
    } finally {
      abortRef.current = null;
      exportingRef.current = false;
      setBusy(false);
      setJob(null);
      setProgress(null);
      resume();
    }
  };

  const showFrame = (src: HTMLCanvasElement) => {
    const o = overlayRef.current;
    if (!o) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(o.clientWidth * dpr), h = Math.round(o.clientHeight * dpr);
    if (o.width !== w || o.height !== h) {
      o.width = w;
      o.height = h;
    }
    o.getContext("2d")!.drawImage(src, 0, 0, w, h);
  };

  /** A simulation's PNG is its live state, rendered large on the live canvas:
   *  the run so far exists only there. */
  const atSize = async (w: number, h: number): Promise<Blob | null> => {
    const c = canvasRef.current!, r = rendRef.current!;
    c.width = w;
    c.height = h;
    try {
      r.draw(valuesRef.current, { w, h, hold: true });
      return await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
    } finally {
      fit();
    }
  };

  const exportPng = () =>
    exclusive(async (signal) => {
      let blob: Blob | null;
      if (sketch.animated) {
        blob = await atSize(size.w, size.h);
      } else {
        const { renderStillFrame } = await import("@/lib/specimens/video");
        blob = await renderStillFrame(sketch, valuesRef.current, size.w, size.h, timeRef.current, Math.max(ex.samples, 16), signal, setProgress);
      }
      if (!blob) throw new Error("no image");
      download(blob, `${sketch.id}-${size.w}x${size.h}-${Date.now().toString(36)}.png`);
    });

  /** `draft`: half size, one sample, 30 fps, to check the motion in minutes. */
  const exportMp4 = (draft = false) =>
    exclusive(async (signal) => {
      const w = draft ? Math.max(16, Math.round(size.w / 2)) & ~1 : size.w;
      const h = draft ? Math.max(16, Math.round(size.h / 2)) & ~1 : size.h;
      const fps = draft ? 30 : ex.fps;
      const total = Math.max(1, Math.round(seconds * fps));
      const { exportVideo } = await import("@/lib/specimens/video");
      setJob({ frame: 0, total, perFrame: 0, sub: 0 });
      let lastSub = 0;
      const { blob, codec } = await exportVideo(
        sketch,
        { ...valuesRef.current },
        {
          w,
          h,
          fps,
          duration: seconds,
          samples: draft ? 1 : ex.samples,
          shutter: draft ? 0 : ex.shutter,
          bitrate: draft ? Math.max(4e6, w * h * fps * 0.12) : bitrate,
        },
        {
          signal,
          onProgress: (p) => {
            setJob({ frame: p.frame, total: p.total, perFrame: p.perFrame, sub: 0 });
            showFrame(p.canvas);
          },
          onFrameProgress: (f) => {
            const now = performance.now();
            if (now - lastSub > 150) {
              lastSub = now;
              setJob((j) => (j ? { ...j, sub: f } : j));
            }
          },
        },
      );
      download(blob, `${sketch.id}-${draft ? "draft-" : ""}${w}x${h}-${fps}fps-${Date.now().toString(36)}.mp4`);
      say(`Saved · ${(blob.size / 1e6).toFixed(1)} MB · ${codec.toUpperCase()}`, 5000);
    });

  /** A square from the middle of the frame, whatever its shape. */
  const thumbnail = (): string => {
    const src = canvasRef.current!;
    const s = Math.min(src.width, src.height);
    const t = document.createElement("canvas");
    t.width = t.height = THUMB_SIZE;
    t.getContext("2d")!.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, THUMB_SIZE, THUMB_SIZE);
    return t.toDataURL("image/jpeg", 0.86);
  };

  const pin = async () => {
    setBusy(true);
    try {
      // the thumbnail is of a finished frame, not a preview
      if (!sketch.animated) {
        if (playing) setPlaying(false);
        playingRef.current = false;
        cancelAnimationFrame(rafRef.current);
        clearIdle();
        if (!(await refine())) throw new Error("the settings changed while rendering");
      }
      const r = await fetch("/api/specimens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sketch: sketch.id,
          title: pinTitle,
          note: pinNote,
          values: diff(sketch, valuesRef.current),
          thumb: thumbnail(),
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? r.status);
      setPinTitle("");
      setPinNote("");
      say("Pinned to the gallery");
      loadPins();
    } catch (e) {
      say(`Could not pin: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const unpin = async (id: string) => {
    await fetch(`/api/specimens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    loadPins();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      say("Link copied");
    } catch {
      say("Copy the address bar: it holds these settings");
    }
  };

  const scrub = (t: number) => {
    setPlaying(false);
    playingRef.current = false;
    timeRef.current = t;
    setClock(t);
    schedule();
  };

  /* ---------- orbit ---------- */

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sketch.orbit || exportingRef.current) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const x0 = e.clientX, y0 = e.clientY;
    const { yaw: yaw0 = 0, pitch: pitch0 = 0 } = valuesRef.current;
    const w = e.currentTarget.clientWidth;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / w, dy = (ev.clientY - y0) / w;
      let yaw = yaw0 + dx * Math.PI * 1.5;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const pitch = Math.max(-1.55, Math.min(1.55, pitch0 + dy * Math.PI * 1.5));
      setValues((prev) => ({ ...prev, yaw: round(yaw), pitch: round(pitch) }));
    };
    const up = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      schedule();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !sketch.orbit) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setValues((prev) => ({
        ...prev,
        zoom: round(Math.max(0.5, Math.min(3, (prev.zoom ?? 1) * Math.exp(-e.deltaY * 0.0012)))),
      }));
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, [sketch.orbit]);

  /* ---------- panel ---------- */

  const groups = useMemo(() => {
    const m = new Map<string, ParamDef[]>();
    for (const p of sketch.params) {
      if (p.hidden) continue;
      const g = p.group ?? "Form";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(p);
    }
    return [...m.entries()];
  }, [sketch]);

  const changed = Object.keys(diff(sketch, values)).filter((k) => !["yaw", "pitch", "zoom"].includes(k)).length;
  const exporting = job !== null || busy;
  const tInCycle = sketch.timed && !sketch.animated ? ((clock % cycle) + cycle) % cycle : clock;
  const etaLeft = job && job.perFrame ? job.perFrame * (job.total - job.frame) : NaN;
  const pinned = "min-[1000px]:sticky min-[1000px]:top-[calc(var(--fa-nav-h)+16px)] min-[1000px]:h-[calc(100svh-var(--fa-nav-h)-32px)]";

  return (
    <div className="flex flex-col gap-8">
      {/* the two columns get their own box, so the pinned stage lets go of
          the screen where the bench ends instead of riding over the pins */}
      <div className="grid gap-8 min-[1000px]:grid-cols-[minmax(0,1fr)_360px]">
      {/* The stage holds still; the panel beside it scrolls. On a phone the
          stage pins under the nav and the panel scrolls beneath it. The plate
          is black in both themes: it is the specimen's photographic ground
          (the shader draws it), not a theme colour. */}
      <div className={`sticky top-[var(--fa-nav-h)] z-10 -mx-4 flex min-w-0 flex-col bg-surface px-4 pb-3 pt-2 min-[1000px]:mx-0 min-[1000px]:bg-transparent min-[1000px]:p-0 ${pinned}`}>
        <div ref={stageRef} className="relative flex h-[44svh] min-h-0 items-center justify-center min-[1000px]:h-auto min-[1000px]:flex-1">
          <div className="relative bg-[black]" style={box ? { width: box.w, height: box.h } : { width: "100%", aspectRatio: String(aspect) }}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              className={`block h-full w-full ${sketch.orbit ? "cursor-grab active:cursor-grabbing" : ""}`}
              style={{ touchAction: sketch.orbit ? "none" : "auto" }}
            />
            <canvas ref={overlayRef} className={`pointer-events-none absolute inset-0 h-full w-full ${job && job.frame > 0 ? "" : "hidden"}`} />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <pre className="max-h-full overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-[1.6] text-paper/80">{error}</pre>
              </div>
            )}
            {!job && (busy || progress !== null) && (
              <div className="absolute left-3 top-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/70">
                Rendering{progress !== null ? ` ${Math.round(progress * 100)}%` : "…"}
              </div>
            )}
            {job && (
              <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/80">
                <span>
                  Frame {Math.min(job.frame + 1, job.total)} / {job.total}
                  {job.perFrame > 0 && <> · {job.perFrame.toFixed(2)} s a frame · {duration(etaLeft)} left</>}
                </span>
                <button onClick={() => abortRef.current?.abort()} className="pointer-events-auto border border-paper/40 px-2 py-0.5 text-paper hover:border-paper">
                  Cancel
                </button>
              </div>
            )}
            {job && (
              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/15">
                <div className="h-full bg-paper/80" style={{ width: `${((job.frame + job.sub) / job.total) * 100}%` }} />
              </div>
            )}
            {flash && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap border border-ink/20 bg-surface px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink">
                {flash}
              </div>
            )}
          </div>
        </div>

        {/* transport */}
        <div className="mt-3 flex items-center gap-3">
          {sketch.timed && (
            <button className="fa-btn fa-btn--ghost min-w-[84px]" onClick={() => setPlaying((p) => !p)} disabled={exporting} aria-pressed={playing}>
              {playing ? "Pause" : "Play"}
            </button>
          )}
          {sketch.timed && !sketch.animated && (
            <>
              <input
                type="range"
                min={0}
                max={cycle}
                step={0.01}
                value={tInCycle}
                onChange={(e) => scrub(Number(e.target.value))}
                disabled={exporting}
                aria-label="Time in the cycle"
                style={{ accentColor: "var(--accent)" }}
                className="min-w-0 flex-1"
              />
              <span className="w-[92px] shrink-0 text-right font-mono text-[11px] tabular-nums text-graphite">
                {tInCycle.toFixed(1)} / {cycle.toFixed(1)} s
              </span>
            </>
          )}
          {sketch.animated && (
            <button className="fa-btn fa-btn--ghost" onClick={() => rendRef.current?.restart?.()} disabled={exporting}>
              Restart
            </button>
          )}
        </div>
        <p className={`${label} mt-2 hidden min-[1000px]:block`}>
          {sketch.orbit ? "Drag to turn · scroll to zoom" : "Grown live · restart to reseed"}
          {ms !== null && !sketch.animated && !playing && <> · full frame in {(ms / 1000).toFixed(1)} s</>}
          {playing && !sketch.animated && <> · live at reduced resolution; pause for the full frame</>}
        </p>
      </div>

      {/* panel */}
      <aside className={`flex min-w-0 flex-col gap-7 min-[1000px]:overflow-y-auto min-[1000px]:pr-3 ${pinned}`}>
        <div>
          <p className={label}>Presets</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sketch.presets.map((p) => (
              <button key={p.name} onClick={() => applyPreset(p.values)} className={chip(false)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {groups.map(([g, ps]) => (
          <fieldset key={g} className="flex flex-col gap-4">
            <legend className={`${label} mb-3`}>{g}</legend>
            {g === "Light" && lightKeys.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {LIGHT_SETUPS.map((s) => (
                  <button key={s.name} onClick={() => applySetup(s.values)} className={chip(activeSetup === s.name)}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {ps.map((p) => (
              <Control key={p.key} p={p} v={values[p.key]} onChange={(v) => set(p.key, v)} />
            ))}
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-2 border-t border-ink/15 pt-5">
          {values.seed !== undefined && (
            <button className="fa-btn fa-btn--ghost" onClick={() => set("seed", Math.floor(Math.random() * 1000))}>
              New seed
            </button>
          )}
          <button className="fa-btn fa-btn--ghost" onClick={() => applyPreset({})} disabled={changed === 0}>
            Reset form
          </button>
          <button className="fa-btn fa-btn--ghost" onClick={copyLink}>
            Copy link
          </button>
        </div>

        {/* export */}
        <div className="border-t border-ink/15 pt-5">
        <fieldset className="flex flex-col gap-4" disabled={exporting}>
          <legend className={`${label} mb-3`}>Export</legend>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-ink">Frame</span>
            <select className={field} value={ex.res} onChange={(e) => setEx({ ...ex, res: e.target.value })}>
              {RESOLUTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {ex.res === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-faint">Width</span>
                <input type="number" min={16} max={maxSize} step={2} className={field} value={ex.cw} onChange={(e) => setEx({ ...ex, cw: Number(e.target.value) })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-faint">Height</span>
                <input type="number" min={16} max={maxSize} step={2} className={field} value={ex.ch} onChange={(e) => setEx({ ...ex, ch: Number(e.target.value) })} />
              </label>
              <span className="col-span-2 text-[12px] leading-[1.5] text-faint">
                Up to {maxSize}px a side on this GPU. H.264 stops near 4096 wide; past that the file is HEVC or AV1.
              </span>
            </div>
          )}

          {sketch.timed && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] text-ink">Frame rate</span>
                <div className="flex flex-wrap gap-1.5">
                  {[24, 30, 50, 60].map((f) => (
                    <button key={f} type="button" onClick={() => setEx({ ...ex, fps: f })} className={chip(ex.fps === f)}>
                      {f} fps
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3 text-[13px] text-ink">
                  Duration
                  <span className="font-mono text-[11px] tabular-nums text-graphite">
                    {seconds.toFixed(1)} s · {frames} frames
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!sketch.animated && (
                    <>
                      <button type="button" onClick={() => setEx({ ...ex, duration: null })} className={chip(ex.duration === null)}>
                        One loop
                      </button>
                      <button type="button" onClick={() => setEx({ ...ex, duration: cycle * 2 })} className={chip(ex.duration === cycle * 2)}>
                        Two loops
                      </button>
                    </>
                  )}
                  <input
                    type="number"
                    min={0.5}
                    max={600}
                    step={0.5}
                    value={seconds}
                    onChange={(e) => setEx({ ...ex, duration: Math.max(0.5, Math.min(600, Number(e.target.value) || 1)) })}
                    className={`${field} w-[90px]`}
                    aria-label="Duration in seconds"
                  />
                </div>
                <span className="text-[12px] leading-[1.5] text-faint">
                  {sketch.animated
                    ? "From the seed: the video is the run itself, a fixed number of steps a frame."
                    : "One loop is exactly one cycle, so the file plays round without a seam."}
                </span>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-ink">Samples a frame</span>
            <div className="flex flex-wrap gap-1.5">
              {[1, 4, 8, 16, 32, 64].map((n) => (
                <button key={n} type="button" onClick={() => setEx({ ...ex, samples: n })} className={chip(ex.samples === n)}>
                  {n}
                </button>
              ))}
            </div>
            <span className="text-[12px] leading-[1.5] text-faint">
              Each frame is the average of this many renders, offset within the pixel{sketch.timed && !sketch.animated ? " and within the shutter" : ""}. Each doubling doubles the render time; 4 is clean at 1080p, very fine struts may want 8.
            </span>
          </div>

          {sketch.timed && !sketch.animated && (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-ink">Motion blur</span>
                <span className="font-mono text-[11px] tabular-nums text-graphite">{Math.round(ex.shutter * 360)}° shutter</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ex.shutter}
                onChange={(e) => setEx({ ...ex, shutter: Number(e.target.value) })}
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="text-[12px] leading-[1.5] text-faint">180° is film&apos;s own: enough blur that motion reads as continuous, not so much that detail smears.</span>
            </label>
          )}

          {sketch.timed && (
            <div className="flex flex-col gap-2">
              <span className="flex items-baseline justify-between gap-3 text-[13px] text-ink">
                Quality
                <span className="font-mono text-[11px] tabular-nums text-graphite">
                  {Math.round(bitrate / 1e6)} Mb/s · ~{Math.max(1, Math.round((bitrate * seconds) / 8e6))} MB
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUALITIES.map((q, i) => (
                  <button key={q.label} type="button" onClick={() => setEx({ ...ex, quality: i })} className={chip(ex.quality === i)}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {sketch.timed && (
              <button type="button" className="fa-btn fa-btn--primary" onClick={() => exportMp4()} disabled={exporting || !!error}>
                Render MP4
              </button>
            )}
            {sketch.timed && !sketch.animated && (
              <button type="button" className="fa-btn fa-btn--ghost" onClick={() => exportMp4(true)} disabled={exporting || !!error}>
                Quick draft
              </button>
            )}
            <button type="button" className={`fa-btn ${sketch.timed ? "fa-btn--ghost" : "fa-btn--primary"}`} onClick={exportPng} disabled={exporting || !!error}>
              PNG
            </button>
          </div>
          <p className="text-[12px] leading-[1.5] text-faint">
            {size.w} × {size.h}. Rendered frame by frame on this machine, not recorded from the screen, so it takes as long as it takes: the
            first frames give an estimate. Render time goes with pixels × samples × frames, so samples are the cheapest dial to turn down.
            Quick draft is half size, one sample, 30 fps: about thirty times faster, for checking the motion. Keep this tab open; it can be
            in the background.
          </p>
        </fieldset>
        </div>

        <div className="border-t border-ink/15 pt-5">
          <p className={label}>Pin to the gallery</p>
          {canPin ? (
            <div className="mt-3 flex flex-col gap-2">
              <input
                value={pinTitle}
                onChange={(e) => setPinTitle(e.target.value)}
                placeholder="Title"
                maxLength={80}
                className="border border-ink/20 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-faint"
              />
              <textarea
                value={pinNote}
                onChange={(e) => setPinNote(e.target.value)}
                placeholder="Note (optional): what this one is trying"
                maxLength={400}
                rows={2}
                className="border border-ink/20 bg-transparent px-3 py-2 text-[13px] text-ink placeholder:text-faint"
              />
              <button className="fa-btn fa-btn--primary self-start" onClick={pin} disabled={busy || !!error}>
                Pin this
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-[1.7] text-ink-70">
              {pins === null ? "Checking the store…" : "No KV store on this deployment, so nothing can be pinned here. Links and exports still work."}
            </p>
          )}
        </div>
      </aside>
      </div>

      {/* this sketch's pins */}
      {pins && pins.length > 0 && (
        <section>
          <p className={label}>Pinned from this sketch · {pins.length}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {pins.map((p) => (
              <figure key={p.id} className="group relative">
                <button onClick={() => setValues(resolve(sketch, p.values))} className="block w-full" title="Load these settings">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt={p.title} className="aspect-square w-full object-cover" />
                </button>
                <figcaption className="mt-1.5 flex items-start justify-between gap-2">
                  <span className="text-[12.5px] leading-[1.35] text-ink">{p.title}</span>
                  <button
                    onClick={() => unpin(p.id)}
                    className="font-mono text-[10.5px] text-graphite opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                    aria-label={`Unpin ${p.title}`}
                  >
                    ✕
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <p>
        <Link href="/specimens" className={`${label} hover:text-ink`}>← All sketches and the gallery</Link>
      </p>
    </div>
  );
}

function Control({ p, v, onChange }: { p: ParamDef; v: number; onChange: (v: number) => void }) {
  const head = (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-ink">{p.label}</span>
      {p.kind === "range" && <span className="font-mono text-[11px] tabular-nums text-graphite">{fmt(p, v)}</span>}
    </div>
  );
  const hint = p.hint && <span className="text-[12px] leading-[1.5] text-faint">{p.hint}</span>;

  if (p.kind === "toggle") {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[13px] text-ink">{p.label}</span>
          {hint}
        </span>
        <input
          type="checkbox"
          checked={v > 0.5}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          style={{ accentColor: "var(--accent)" }}
          className="h-4 w-4"
        />
      </label>
    );
  }
  if (p.kind === "choice") {
    return (
      <div className="flex flex-col gap-2">
        {head}
        <div className="flex flex-wrap gap-1.5">
          {p.options.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)} className={chip(Math.round(v) === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      {head}
      <input
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--accent)" }}
        className="w-full"
      />
      {hint}
    </label>
  );
}
