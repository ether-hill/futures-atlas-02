"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sketchById } from "@/lib/specimens";
import { progressive, type Job } from "@/lib/specimens/progressive";
import { diff, resolve, round, type ParamDef, type Renderer, type Values } from "@/lib/specimens/types";
import type { SpecimenPin } from "@/lib/store";

/**
 * The bench: one sketch, its canvas and every dial it declares.
 *
 * A static sketch renders on demand: a cheap low-resolution preview the moment
 * anything moves, then, once things go still, the full frame built up tile by
 * tile from the centre. A lattice shell can take seconds at full size on an
 * integrated GPU, and a slider that waits for it is unusable. An animated
 * sketch runs a frame loop instead.
 *
 * The URL always carries the values that differ from the defaults, so the
 * address bar is a link to exactly what is on screen.
 */

const EXPORT_SIZE = 2048;
const THUMB_SIZE = 480;
/** Live canvas cap, in device pixels. Past this the cost is all GPU, no gain. */
const MAX_LIVE = 1200;
/** What a preview pass should cost; its resolution adapts to hit it. */
const PREVIEW_MS = 50;
/** How long things must be still before the full frame starts. */
const IDLE_MS = 180;

const label = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";

function fmt(p: ParamDef, v: number): string {
  if (p.kind !== "range") return "";
  const decimals = p.step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(p.step)));
  return v.toFixed(decimals);
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const rendRef = useRef<Renderer | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobRef = useRef<Job | null>(null);
  /** Preview resolution, adapted so a preview pass costs about PREVIEW_MS. */
  const previewScaleRef = useRef(0.25);

  /* ---------- GL lifecycle ---------- */

  /** Size the canvas to its box (only when that changed: resizing clears it). */
  const fit = useCallback(() => {
    const c = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = Math.max(64, Math.min(MAX_LIVE, Math.round((c.clientWidth || 600) * dpr)));
    if (c.width !== s) c.width = c.height = s;
    return s;
  }, []);

  const cancelJob = () => {
    jobRef.current?.cancel();
    jobRef.current = null;
    setProgress(null);
  };

  /** One cheap low-resolution pass, stretched over the canvas. */
  const preview = useCallback(() => {
    const r = rendRef.current;
    if (!r) return;
    const s = fit();
    try {
      r.draw(valuesRef.current, { w: s, h: s, scale: previewScaleRef.current, fast: true });
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, [fit]);

  /** The full-resolution frame, built up tile by tile (see progressive.ts). */
  const refine = useCallback((size?: number) => {
    const gl = glRef.current, r = rendRef.current;
    if (!gl || !r) return Promise.resolve(false);
    jobRef.current?.cancel();
    const s = size ?? fit();
    const t0 = performance.now();
    const job = progressive(gl, r, valuesRef.current, s, s, { onProgress: setProgress });
    jobRef.current = job;
    return job.done.then((ok) => {
      if (jobRef.current === job) {
        jobRef.current = null;
        setProgress(null);
      }
      if (ok && !size) {
        const took = performance.now() - t0;
        setMs(Math.round(took));
        // Size the next previews from this frame. Timing a preview directly
        // would need a readback, which costs more than the preview does.
        previewScaleRef.current = Math.max(0.1, Math.min(0.5, Math.sqrt(PREVIEW_MS / (took * 0.6))));
      }
      return ok;
    });
  }, [fit]);

  /** Static sketches: a preview now, the full frame once things go still. */
  const schedule = useCallback(() => {
    if (sketch.animated) return;
    cancelJob();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(preview);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      if (!draggingRef.current) refine();
    }, IDLE_MS);
  }, [sketch.animated, preview, refine]);

  const startLoop = useCallback(() => {
    const loop = () => {
      const r = rendRef.current;
      if (!r) return;
      const s = fit();
      try {
        r.draw(valuesRef.current, { w: s, h: s });
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [fit]);

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
      setError(String(e instanceof Error ? e.message : e));
      return;
    }
    if (sketch.animated) startLoop();
    else schedule();
    const onResize = () => !sketch.animated && schedule();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      jobRef.current?.cancel();
      if (idleRef.current) clearTimeout(idleRef.current);
      window.removeEventListener("resize", onResize);
      rendRef.current?.dispose();
      rendRef.current = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per sketch
  }, [sketch]);

  useEffect(() => {
    schedule();
  }, [values, schedule]);

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
      // a preset is a form, not a camera: keep looking from where we are
      for (const k of ["yaw", "pitch", "zoom"]) if (k in prev) next[k] = prev[k];
      return next;
    });

  const say = (s: string) => {
    setFlash(s);
    setTimeout(() => setFlash(null), 2200);
  };

  /** Render at `size` into the live canvas, run `fn` on it, put it back.
   *  A static sketch is built up progressively at that size, in view. */
  const atSize = async <T,>(size: number, fn: (c: HTMLCanvasElement) => Promise<T> | T): Promise<T | null> => {
    const c = canvasRef.current!, r = rendRef.current!;
    cancelJob();
    cancelAnimationFrame(rafRef.current);
    if (idleRef.current) clearTimeout(idleRef.current);
    c.width = c.height = size;
    try {
      if (sketch.animated) {
        r.draw(valuesRef.current, { w: size, h: size });
      } else {
        r.draw(valuesRef.current, { w: size, h: size, scale: 0.12, fast: true });
        if (!(await refine(size))) return null; // cancelled by a change
      }
      return await fn(c);
    } finally {
      fit();
      if (sketch.animated) startLoop();
      else schedule();
    }
  };

  const exportPng = async () => {
    setBusy(true);
    try {
      const blob = await atSize(EXPORT_SIZE, (c) => new Promise<Blob | null>((res) => c.toBlob(res, "image/png")));
      if (blob === null) return;
      if (!blob) throw new Error("no image");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${sketch.id}-${Date.now().toString(36)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) {
      say(`Export failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const thumbnail = (): string => {
    const src = canvasRef.current!;
    const t = document.createElement("canvas");
    t.width = t.height = THUMB_SIZE;
    t.getContext("2d")!.drawImage(src, 0, 0, THUMB_SIZE, THUMB_SIZE);
    return t.toDataURL("image/jpeg", 0.86);
  };

  const pin = async () => {
    setBusy(true);
    try {
      // the thumbnail is of the finished frame, not the preview
      if (!sketch.animated && (jobRef.current || idleRef.current)) {
        if (idleRef.current) clearTimeout(idleRef.current);
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

  /* ---------- orbit ---------- */

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sketch.orbit) return;
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

  return (
    <div className="grid gap-8 min-[1000px]:grid-cols-[minmax(0,1fr)_340px]">
      {/* canvas. The plate is black in both themes: it is the specimen's
          photographic ground (the shader draws it), not a theme colour. */}
      <div className="min-w-0">
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,82vh)] bg-[black]">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            className={`block h-full w-full ${sketch.orbit ? "cursor-grab active:cursor-grabbing" : ""}`}
            style={{ touchAction: sketch.orbit ? "none" : "auto" }}
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <pre className="max-h-full overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-[1.6] text-paper/80">{error}</pre>
            </div>
          )}
          {(busy || progress !== null) && (
            <div className="absolute left-3 top-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/70">
              Rendering{progress !== null ? ` ${Math.round(progress * 100)}%` : "…"}
            </div>
          )}
          {flash && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-ink/20 bg-surface px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink">
              {flash}
            </div>
          )}
        </div>
        <p className={`${label} mx-auto mt-3 max-w-[min(100%,82vh)]`}>
          {sketch.orbit ? "Drag to turn · scroll to zoom" : "Grown live · restart to reseed"}
          {ms !== null && !sketch.animated && <> · full frame in {(ms / 1000).toFixed(1)} s</>}
        </p>
      </div>

      {/* panel */}
      <aside className="flex min-w-0 flex-col gap-7">
        <div>
          <p className={label}>Presets</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sketch.presets.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.values)}
                className="border border-ink/20 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-70 transition-colors hover:border-ink hover:text-ink"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {groups.map(([g, ps]) => (
          <fieldset key={g} className="flex flex-col gap-4">
            <legend className={`${label} mb-3`}>{g}</legend>
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
          {sketch.animated && (
            <button className="fa-btn fa-btn--ghost" onClick={() => rendRef.current?.restart?.()}>
              Restart
            </button>
          )}
          <button className="fa-btn fa-btn--ghost" onClick={() => applyPreset({})} disabled={changed === 0}>
            Reset
          </button>
          <button className="fa-btn fa-btn--ghost" onClick={copyLink}>
            Copy link
          </button>
          <button className="fa-btn fa-btn--primary" onClick={exportPng} disabled={busy || !!error}>
            PNG {EXPORT_SIZE}px
          </button>
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
              {pins === null ? "Checking the store…" : "No KV store on this deployment, so nothing can be pinned here. Links and PNGs still work."}
            </p>
          )}
        </div>
      </aside>

      {/* this sketch's pins */}
      {pins && pins.length > 0 && (
        <section className="min-[1000px]:col-span-2">
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

      <p className="min-[1000px]:col-span-2">
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
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
                Math.round(v) === o.value ? "border-ink bg-ink text-surface" : "border-ink/20 text-ink-70 hover:border-ink"
              }`}
            >
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
