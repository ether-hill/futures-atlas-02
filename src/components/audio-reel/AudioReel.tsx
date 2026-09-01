"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scene } from "./Scene";
import { Waveform } from "./Waveform";
import { useAudioClock } from "./useAudioClock";
import { VARIANTS, type Variant, type Voice } from "./types";

/**
 * Audio-driven horizontal story reel. Audio time is the only source of truth:
 * useAudioClock writes CSS custom properties every frame and audio-reel.css
 * turns them into the track position, per-layer parallax and approach fades.
 * Nothing here animates on scroll, timers, or its own clock.
 *
 * ONE LINE. Every voice sits on a single timeline, one after another: Scott's
 * scenes, then Amara's, and so on. Global time is the current clip's time
 * plus the clips before it, so the reel is one long strip and a seek that
 * lands in another person's stretch swaps the clip underneath. When a clip
 * ends the next starts; the last wraps to the first.
 *
 * The user drives it by hand — the wheel (vertical or horizontal) or a drag
 * on the reel — but the gesture SEEKS THE AUDIO, never moves the track.
 */
const isVariant = (v: string): v is Variant => VARIANTS.some((x) => x.id === v);

/**
 * Depth. Some variants repeat the scene row as extra layers pushed back on the
 * z axis under a real CSS perspective whose origin sits on the playhead: the
 * browser shrinks and slows them, and the vanishing point stays where the
 * scene lands. So the distance shows what has passed and what is coming,
 * small and dim, converging behind the scene that is playing. Editorial (the
 * brief) and Ledger stay flat.
 */
const DEPTH: Record<Variant, number> = { editorial: 0, ledger: 0, cinema: 1, deck: 2, type: 1 };

const DRAG_THRESHOLD = 4; // px before a press becomes a scrub
const TAIL = 6; // seconds assumed after a clip's last scene until its metadata gives the real length

export function AudioReel({ voices, shareHref }: { voices: Voice[]; shareHref: string }) {
  const [voiceId, setVoiceId] = useState(voices[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [variant, setVariant] = useState<Variant>("editorial");
  const [durations, setDurations] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0); // seconds of clip before the current one
  const overrideRef = useRef<number | null>(null); // global second held while a clip swaps in
  const pendingSeek = useRef<number | null>(null); // seconds into the incoming clip
  const autoplay = useRef(false); // play as soon as the incoming clip can
  const drag = useRef({ active: false, moved: false, x0: 0, y0: 0, t0: 0, wasPlaying: false });
  const urlRead = useRef(false);

  /* ---- the line: every voice, back to back ---- */
  const timeline = useMemo(() => {
    let offset = 0;
    return voices.map((voice) => {
      const last = voice.scenes[voice.scenes.length - 1]?.start ?? 0;
      const duration = durations[voice.id] ?? last + TAIL;
      const entry = { voice, offset, duration };
      offset += duration;
      return entry;
    });
  }, [voices, durations]);
  const total = timeline.length ? timeline[timeline.length - 1].offset + timeline[timeline.length - 1].duration : 0;
  const entry = useMemo(() => timeline.find((e) => e.voice.id === voiceId) ?? timeline[0], [timeline, voiceId]);
  const voice = entry.voice;
  useEffect(() => {
    offsetRef.current = entry.offset;
  }, [entry]);

  const starts = useMemo(
    () => timeline.flatMap((e) => e.voice.scenes.map((s) => e.offset + s.start)),
    [timeline],
  );
  const { remeasure, xAt, tAt } = useAudioClock({ audioRef, sectionRef, trackRef, starts, offsetRef, overrideRef });

  /** Global second right now. */
  const now = useCallback(() => overrideRef.current ?? offsetRef.current + (audioRef.current?.currentTime ?? 0), []);

  /* every clip's length, from metadata only (cheap), so the line has true proportions */
  useEffect(() => {
    const subs = voices.map((v) => {
      const a = new Audio();
      a.preload = "metadata";
      const on = () => setDurations((d) => (d[v.id] === a.duration ? d : { ...d, [v.id]: a.duration }));
      a.addEventListener("loadedmetadata", on);
      a.src = v.audio;
      return () => a.removeEventListener("loadedmetadata", on);
    });
    return () => subs.forEach((off) => off());
  }, [voices]);

  /* the atlas shell bar sits above us in flow: subtract our own document
     offset so the section truly ends at the viewport bottom */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const set = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.setProperty("--ar-top", `${Math.max(0, Math.round(top))}px`);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  /* reduced motion: flag the section; CSS switches to crossfade-in-place */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => sectionRef.current?.setAttribute("data-rm", mq.matches ? "1" : "0");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* the variant is linkable: ?v=cinema. Light/dark is the site's own toggle
     (html.dark) — the reel has no switch of its own. */
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v") ?? "";
    if (isVariant(v)) setVariant(v);
    urlRead.current = true;
  }, []);
  useEffect(() => {
    if (!urlRead.current) return;
    const url = new URL(window.location.href);
    if (variant === "editorial") url.searchParams.delete("v");
    else url.searchParams.set("v", variant);
    window.history.replaceState(null, "", url);
    remeasure(); // a variant changes scene widths, so the t→x map moves
  }, [variant, remeasure]);

  const clearCountdown = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
  };
  useEffect(() => () => clearCountdown(), []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (countdown !== null) return; // countdown already running
    if (!started) {
      // "Audio starts in 3" — then play. The press is the user gesture.
      let n = 3;
      setCountdown(n);
      countdownTimer.current = setInterval(() => {
        n -= 1;
        if (n > 0) setCountdown(n);
        else {
          clearCountdown();
          setStarted(true);
          play();
        }
      }, 1000);
    } else {
      play();
    }
  }, [playing, countdown, started, play]);

  /**
   * Seek the LINE to global second T. Inside the current clip that is one
   * currentTime; in another person's stretch the clip swaps: the reel holds
   * at T (overrideRef) until the new metadata lands, then the pending seek
   * applies and playback resumes if it was running.
   */
  const seekGlobal = useCallback(
    (T: number) => {
      const audio = audioRef.current;
      if (!audio || !timeline.length) return;
      const t = Math.min(Math.max(0, T), Math.max(0, total - 0.05));
      const target = timeline.find((e) => t < e.offset + e.duration) ?? timeline[timeline.length - 1];
      if (target.voice.id === voiceId) {
        if (audio.duration) audio.currentTime = Math.min(audio.duration, t - target.offset);
        else pendingSeek.current = t - target.offset;
        return;
      }
      overrideRef.current = t;
      pendingSeek.current = t - target.offset;
      autoplay.current = !audio.paused;
      audio.pause();
      setVoiceId(target.voice.id);
    },
    [timeline, total, voiceId],
  );

  /** The incoming clip's metadata is in: apply the pending seek, release the hold, resume. */
  const onLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDurations((d) => (d[voice.id] === audio.duration ? d : { ...d, [voice.id]: audio.duration }));
    if (pendingSeek.current !== null) {
      audio.currentTime = Math.min(audio.duration, Math.max(0, pendingSeek.current));
      pendingSeek.current = null;
    }
    overrideRef.current = null;
    if (autoplay.current) {
      autoplay.current = false;
      play();
    }
  };

  /** The clip ended: the next person begins where this one stops. The last wraps to the first. */
  const ended = () => {
    const i = timeline.indexOf(entry);
    const next = timeline[(i + 1) % timeline.length];
    if (!next || timeline.length < 2) {
      setPlaying(false);
      return;
    }
    overrideRef.current = next.offset;
    pendingSeek.current = 0;
    autoplay.current = true;
    setVoiceId(next.voice.id);
  };

  /* ---- hand-driving the line: drag / wheel → seek ---- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const audio = audioRef.current;
    if (!audio) return;
    drag.current = { active: true, moved: false, x0: e.clientX, y0: e.clientY, t0: now(), wasPlaying: !audio.paused };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      sectionRef.current?.setAttribute("data-drag", "1");
      if (d.wasPlaying) audioRef.current?.pause(); // the reel is exact while paused, so it snaps to the hand
    }
    // dragging left (or up) pulls later scenes toward the playhead: x grows as dx/dy fall
    seekGlobal(tAt(xAt(d.t0) - dx - dy));
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    sectionRef.current?.removeAttribute("data-drag");
    if (d.moved) {
      setStarted(true); // the hand has engaged: no countdown on the next play
      if (d.wasPlaying) {
        if (overrideRef.current !== null) autoplay.current = true; // a clip is still swapping in
        else play();
      }
    } else if (countdown === null) {
      togglePlay(); // a plain press on the reel is play/pause
    }
  };

  /* the wheel drives the line — scrolling down moves it on, up brings it back;
     horizontal deltas count too. At either end of the line the wheel goes back
     to the page, so the rest of the site stays reachable. Native listener
     because React registers wheel as passive. */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let acc = 0;
    let raf = 0;
    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY + e.deltaX;
      const T = now();
      if ((delta > 0 && T >= total - 0.1) || (delta < 0 && T <= 0.01)) return;
      e.preventDefault();
      acc += delta;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const dx = acc;
        acc = 0;
        seekGlobal(tAt(xAt(now()) + dx));
        setStarted(true);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [xAt, tAt, now, seekGlobal, total]);

  const scenesOf = (prefix: string) =>
    timeline.flatMap((e) =>
      e.voice.scenes.map((s, i) => <Scene key={`${prefix}${e.voice.id}-${i}`} scene={s} playing={playing} />),
    );

  return (
    <section ref={sectionRef} className="ar" data-variant={variant} aria-label="Listen: voices">
      <audio
        ref={audioRef}
        src={voice.audio}
        preload="metadata"
        onEnded={ended}
        onLoadedMetadata={onLoadedMetadata}
      />
      <div className="ar-rule" aria-hidden="true" />

      <header className="ar-top">
        <div className="ar-top__voice">
          <span className="ar-top__label">Voice of</span>
          <select
            className="ar-select"
            value={voice.id}
            aria-label="Jump to a voice"
            onChange={(e) => {
              const target = timeline.find((x) => x.voice.id === e.target.value);
              if (target) seekGlobal(target.offset);
            }}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}, {v.role}
              </option>
            ))}
          </select>
        </div>

        <div className="ar-top__mid">
          <div className="ar-switch" role="group" aria-label="Design variant">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={v.id === variant ? "on" : undefined}
                aria-pressed={v.id === variant}
                title={v.name}
                onClick={() => setVariant(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <a className="ar-share" href={shareHref}>
          Share your hope <span aria-hidden="true">→</span>
        </a>
      </header>

      <div
        ref={viewportRef}
        className="ar-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {Array.from({ length: DEPTH[variant] }, (_, n) => (
          <div key={n} className={`ar-track ar-track--far ar-track--far-${n + 1}`} aria-hidden="true">
            {scenesOf(`far${n}-`)}
          </div>
        ))}
        <div ref={trackRef} className="ar-track ar-track--near">
          {scenesOf("")}
        </div>
        {countdown !== null && (
          <div className="ar-countdown" role="status">
            Audio starts in {countdown}
          </div>
        )}
      </div>

      <footer className="ar-bottom">
        <Waveform peaksUrl={voice.peaks} audioRef={audioRef} onTogglePlay={togglePlay} />
        <button
          type="button"
          className="ar-play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M8 4l12 8-12 8z" fill="currentColor" />
            </svg>
          )}
        </button>
      </footer>

      {/* hidden transcript: every voice's quotes, in order */}
      <div className="ar-transcript">
        <h2>Transcript of on-screen quotes</h2>
        {timeline.map((e) => (
          <section key={e.voice.id}>
            <h3>{e.voice.name}</h3>
            <ol>
              {e.voice.scenes
                .filter((s) => s.type === "quote")
                .map((s, i) => (
                  <li key={i}>{s.type === "quote" ? s.text : null}</li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
