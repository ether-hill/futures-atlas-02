"use client";

import { useCallback, useEffect, useRef } from "react";

const SPEED_FLOOR = 90; // px/s — never slower than this, however sparse the scenes
const SCENE_GAP = 48; // px of clear air between neighbouring scenes at the chosen speed
const EASE_OUT = 2.5; // s — the last stretch of the line decelerates to a stop
const FADE_IN = 1.0; // s — each clip's volume ramps up from silence
const FADE_OUT = 1.4; // s — and down into it

/**
 * The single clock. A rAF loop reads audio.currentTime (timeupdate is too
 * coarse), lerps it (0.12) so seeks feel smooth, clamps to exact on pause,
 * and writes every CSS custom property the reel's CSS consumes:
 *
 *   --t         smoothed seconds, on the section
 *   --progress  0–1, on the section (drives the waveform clip)
 *   --reel-x    px the track has travelled, on the section
 *   --track-w   px, the track's full length, on the section
 *   --x         px, a scene's left edge on the track, per scene
 *   --d         px distance from the playhead, per scene
 *   --active    0/1 "this scene's start has been reached", per scene
 *                (reduced-motion mode crossfades on it)
 *
 * ONE SPEED. The reel moves at a constant px/s for the whole line, and every
 * scene is placed so its centre reaches the playhead exactly at its start
 * time: x = start × speed. The speed is the smallest that keeps neighbouring
 * scenes from overlapping (measured from their widths), never below a floor,
 * so nothing speeds up or slows down between scenes — the motion runs
 * steadily through a clip's tail, through the silence between people, and
 * only decelerates over the final seconds of the line.
 *
 * Time here is GLOBAL: every voice sits on one line, so the clock reads the
 * current clip's time plus `offsetRef` (the seconds of clip before it). While
 * a seek is crossing into another clip, or the line is in the silence between
 * two, `overrideRef` holds the global second instead.
 *
 * The map is exposed both ways: `xAt(t)` for the frame loop and `tAt(x)` so
 * a drag or a wheel on the reel can be turned back into a seek — the gesture
 * never moves the track itself, it moves the clock.
 */
export function useAudioClock({
  audioRef,
  sectionRef,
  trackRef,
  starts,
  end,
  offsetRef,
  overrideRef,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  sectionRef: React.RefObject<HTMLElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  starts: number[]; // GLOBAL scene start times, ascending, one per track child
  end: number; // GLOBAL second the line ends on
  offsetRef: React.RefObject<number>;
  overrideRef: React.RefObject<number | null>;
}) {
  const speed = useRef(SPEED_FLOOR);
  const smooth = useRef(0);

  /** Seconds → travelled px: linear, easing out over the last EASE_OUT seconds. */
  const xAt = useCallback(
    (t: number) => {
      const v = speed.current;
      const e = Math.min(EASE_OUT, end);
      const knee = end - e;
      if (t <= knee || e <= 0) return Math.max(0, t) * v;
      const u = Math.min(1, (t - knee) / e);
      return (knee + e * (u - (u * u) / 2)) * v; // slope 1 at the knee, 0 at the end
    },
    [end],
  );
  /** Travelled px → seconds: the inverse, including the eased tail. */
  const tAt = useCallback(
    (x: number) => {
      const v = speed.current;
      const e = Math.min(EASE_OUT, end);
      const knee = end - e;
      const lin = Math.max(0, x) / v;
      if (lin <= knee || e <= 0) return lin;
      const y = Math.min(0.5, (lin - knee) / e);
      return knee + e * (1 - Math.sqrt(1 - 2 * y));
    },
    [end],
  );

  /** Measure widths → one speed → every scene's left edge, on the near track and its depth mirrors. */
  const measure = useCallback(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const playhead = section.clientWidth * 0.33;
    const widths = Array.from(track.children).map((el) => (el as HTMLElement).offsetWidth);
    let v = SPEED_FLOOR;
    for (let i = 0; i + 1 < starts.length && i + 1 < widths.length; i++) {
      const dt = starts[i + 1] - starts[i];
      if (dt <= 0) continue;
      v = Math.max(v, (widths[i] / 2 + widths[i + 1] / 2 + SCENE_GAP) / dt);
    }
    speed.current = v;
    const tracks = [track, ...Array.from(section.querySelectorAll<HTMLElement>(".ar-track--far"))];
    tracks.forEach((tr) => {
      Array.from(tr.children).forEach((el, i) => {
        if (i >= starts.length) return;
        (el as HTMLElement).style.setProperty("--x", (playhead + starts[i] * v - widths[i] / 2).toFixed(1));
      });
    });
    section.style.setProperty("--track-w", (playhead + end * v + section.clientWidth * 0.5).toFixed(0));
  }, [sectionRef, trackRef, starts, end]);

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

      const cur = overrideRef.current ?? offsetRef.current + audio.currentTime;
      // lerp toward the real clock; exact while paused so pause freezes the reel
      const running = !audio.paused || overrideRef.current !== null;
      smooth.current = running ? smooth.current + (cur - smooth.current) * 0.12 : cur;
      if (Math.abs(cur - smooth.current) < 0.001) smooth.current = cur;
      const t = smooth.current;

      const x = xAt(t);
      const dur = audio.duration || 0;
      section.style.setProperty("--fade-w", (section.clientWidth * 0.3).toFixed(0));
      section.style.setProperty("--t", t.toFixed(3));
      section.style.setProperty("--progress", dur ? Math.min(1, audio.currentTime / dur).toFixed(4) : "0");
      section.style.setProperty("--reel-x", x.toFixed(1));

      // the clip fades in from silence and out into it
      if (!audio.paused && dur) {
        const ct = audio.currentTime;
        audio.volume = Math.max(0, Math.min(1, ct / FADE_IN, (dur - ct) / FADE_OUT));
      }

      // per-scene distance from the playhead (+ = still approaching), on every track
      const v = speed.current;
      const tracks = [track, ...Array.from(section.querySelectorAll<HTMLElement>(".ar-track--far"))];
      tracks.forEach((tr) => {
        Array.from(tr.children).forEach((el, i) => {
          if (i >= starts.length) return;
          const s = el as HTMLElement;
          s.style.setProperty("--d", (starts[i] * v - x).toFixed(1));
          const next = i + 1 < starts.length ? starts[i + 1] : Infinity;
          s.style.setProperty("--active", t >= starts[i] && t < next ? "1" : "0");
        });
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef, sectionRef, trackRef, starts, offsetRef, overrideRef, xAt]);

  return { remeasure: measure, xAt, tAt };
}
