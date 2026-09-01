"use client";

import { useCallback, useEffect, useRef } from "react";

type Pt = { t: number; x: number };

/** Piecewise-linear interpolation over ascending points, clamped at the ends. */
function interp(pts: Pt[], v: number, from: keyof Pt, to: keyof Pt): number {
  if (pts.length === 0) return 0;
  if (v <= pts[0][from]) return pts[0][to];
  const last = pts[pts.length - 1];
  if (v >= last[from]) return last[to];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (v >= a[from] && v <= b[from]) {
      const span = b[from] - a[from];
      const f = span === 0 ? 1 : (v - a[from]) / span;
      return a[to] + (b[to] - a[to]) * f;
    }
  }
  return last[to];
}

/**
 * The single clock. A rAF loop reads audio.currentTime (timeupdate is too
 * coarse), lerps it (0.12) so seeks feel smooth, clamps to exact on pause,
 * and writes every CSS custom property the reel's CSS consumes:
 *
 *   --t         smoothed seconds, on the section
 *   --progress  0–1, on the section (drives the waveform clip)
 *   --reel-x    px the track has travelled, on the section
 *   --d         px distance from the playhead hairline, per scene
 *   --active    0/1 "this scene's start has been reached", per scene
 *                (reduced-motion mode crossfades on it)
 *
 * The reel-x mapping is piecewise-linear between scene start times and the
 * x-offset that centres each scene on the hairline, measured from the DOM at
 * mount and on resize — audio time is the only source of truth.
 *
 * The map is exposed both ways: `xAt(t)` for the frame loop and `tAt(x)` so
 * a drag or a trackpad swipe on the reel can be turned back into a seek —
 * the gesture never moves the track itself, it moves the clock.
 */
export function useAudioClock({
  audioRef,
  sectionRef,
  trackRef,
  starts,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  sectionRef: React.RefObject<HTMLElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  starts: number[]; // scene start times, ascending
}) {
  const map = useRef<Pt[]>([]);
  const smooth = useRef(0);

  /** Measure scene centres → the x that puts scene i on the hairline. */
  const measure = useCallback(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const playhead = section.clientWidth * 0.33;
    const pts: Pt[] = [];
    Array.from(track.children).forEach((el, i) => {
      if (i >= starts.length) return;
      const s = el as HTMLElement;
      const centre = s.offsetLeft + s.offsetWidth / 2;
      pts.push({ t: starts[i], x: Math.max(0, centre - playhead) });
    });
    map.current = pts;
  }, [sectionRef, trackRef, starts]);

  const xAt = useCallback((t: number) => interp(map.current, t, "t", "x"), []);
  const tAt = useCallback((x: number) => interp(map.current, x, "x", "t"), []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => ro.disconnect();
  }, [measure, sectionRef]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const audio = audioRef.current;
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!audio || !section || !track) return;

      const cur = audio.currentTime;
      // lerp toward the real clock; exact while paused so pause freezes the reel
      smooth.current = audio.paused ? cur : smooth.current + (cur - smooth.current) * 0.12;
      if (Math.abs(cur - smooth.current) < 0.001) smooth.current = cur;
      const t = smooth.current;

      const x = interp(map.current, t, "t", "x");

      const dur = audio.duration || 0;
      section.style.setProperty("--fade-w", (section.clientWidth * 0.3).toFixed(0));
      section.style.setProperty("--t", t.toFixed(3));
      section.style.setProperty("--progress", dur ? Math.min(1, cur / dur).toFixed(4) : "0");
      section.style.setProperty("--reel-x", x.toFixed(1));

      // per-scene distance from the hairline (+ = still approaching)
      const playhead = section.clientWidth * 0.33;
      Array.from(track.children).forEach((el, i) => {
        const s = el as HTMLElement;
        const centre = s.offsetLeft + s.offsetWidth / 2;
        s.style.setProperty("--d", (centre - x - playhead).toFixed(1));
        const next = i + 1 < starts.length ? starts[i + 1] : Infinity;
        s.style.setProperty("--active", t >= starts[i] && t < next ? "1" : "0");
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef, sectionRef, trackRef, starts]);

  return { remeasure: measure, xAt, tAt };
}
