"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const map = useRef<{ t: number; x: number }[]>([]);
  const smooth = useRef(0);

  /** Measure scene centres → the x that puts scene i on the hairline. */
  const measure = useCallback(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const playhead = section.clientWidth * 0.33;
    const pts: { t: number; x: number }[] = [];
    Array.from(track.children).forEach((el, i) => {
      if (i >= starts.length) return;
      const s = el as HTMLElement;
      const centre = s.offsetLeft + s.offsetWidth / 2;
      pts.push({ t: starts[i], x: Math.max(0, centre - playhead) });
    });
    map.current = pts;
  }, [sectionRef, trackRef, starts]);

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

      // piecewise-linear t → reel-x
      const pts = map.current;
      let x = 0;
      if (pts.length > 0) {
        if (t <= pts[0].t) x = pts[0].x;
        else if (t >= pts[pts.length - 1].t) x = pts[pts.length - 1].x;
        else {
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b2 = pts[i + 1];
            if (t >= a.t && t <= b2.t) {
              const f = b2.t === a.t ? 1 : (t - a.t) / (b2.t - a.t);
              x = a.x + (b2.x - a.x) * f;
              break;
            }
          }
        }
      }

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

  return { remeasure: measure };
}
