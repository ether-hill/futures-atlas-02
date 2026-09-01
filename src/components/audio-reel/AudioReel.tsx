"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scene } from "./Scene";
import { Waveform } from "./Waveform";
import { useAudioClock } from "./useAudioClock";
import { SCHEMES, VARIANTS, type Scheme, type Variant, type Voice } from "./types";

/**
 * Audio-driven horizontal story reel. Audio time is the only source of truth:
 * useAudioClock writes CSS custom properties every frame and audio-reel.css
 * turns them into the track position, per-layer parallax and approach fades.
 * Nothing here animates on scroll, timers, or its own clock.
 *
 * The user can also drive the reel by hand — a drag or a horizontal trackpad
 * swipe on the reel — but that gesture SEEKS THE AUDIO, never moves the
 * track: the clock stays the single source of truth and the reel follows it.
 *
 * Voices play one after another: when a clip ends the next voice loads,
 * shows "Up next" for a beat and plays, wrapping back to the first.
 */
const isVariant = (v: string): v is Variant => VARIANTS.some((x) => x.id === v);
const isScheme = (s: string): s is Scheme => (SCHEMES as readonly string[]).includes(s);

const DRAG_THRESHOLD = 4; // px before a press becomes a scrub
const UP_NEXT_MS = 1100; // how long "Up next" holds before the next clip plays

export function AudioReel({
  voices,
  shareHref,
  continuous = true,
}: {
  voices: Voice[];
  shareHref: string;
  /** Play the voices back to back, looping. Default on. */
  continuous?: boolean;
}) {
  const [voiceId, setVoiceId] = useState(voices[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [upNext, setUpNext] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [variant, setVariant] = useState<Variant>("editorial");
  const [scheme, setScheme] = useState<Scheme>("auto");

  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const upNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloaded = useRef<Map<string, HTMLAudioElement>>(new Map());
  const autoplayNext = useRef(false);
  const drag = useRef({ active: false, moved: false, x0: 0, t0: 0, wasPlaying: false });
  const urlRead = useRef(false);

  const voice = useMemo(() => voices.find((v) => v.id === voiceId) ?? voices[0], [voices, voiceId]);
  const starts = useMemo(() => voice.scenes.map((s) => s.start), [voice]);
  const { remeasure, xAt, tAt } = useAudioClock({ audioRef, sectionRef, trackRef, starts });

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

  /* variant + scheme are linkable: ?v=cinema&scheme=dark */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v") ?? "";
    const s = q.get("scheme") ?? "";
    if (isVariant(v)) setVariant(v);
    if (isScheme(s)) setScheme(s);
    urlRead.current = true;
  }, []);
  useEffect(() => {
    if (!urlRead.current) return;
    const url = new URL(window.location.href);
    if (variant === "editorial") url.searchParams.delete("v");
    else url.searchParams.set("v", variant);
    if (scheme === "auto") url.searchParams.delete("scheme");
    else url.searchParams.set("scheme", scheme);
    window.history.replaceState(null, "", url);
    remeasure(); // a variant changes scene widths, so the t→x map moves
  }, [variant, scheme, remeasure]);

  const clearCountdown = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
  };
  const clearUpNext = () => {
    if (upNextTimer.current) clearTimeout(upNextTimer.current);
    upNextTimer.current = null;
    autoplayNext.current = false;
    setUpNext(null);
  };

  /** Preload every other voice's audio metadata (hover/focus of the select, and on first play). */
  const preload = useCallback(() => {
    voices.forEach((v) => {
      if (v.id === voiceId || preloaded.current.has(v.id)) return;
      const a = new Audio();
      a.preload = "metadata";
      a.src = v.audio;
      preloaded.current.set(v.id, a);
    });
  }, [voices, voiceId]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        preload();
      })
      .catch(() => setPlaying(false));
  }, [preload]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (countdown !== null || upNext !== null) return; // a lead-in is already running
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
  }, [playing, countdown, upNext, started, play]);

  /** Switching pauses and unloads, swaps scenes + peaks, resets the clock. */
  const switchVoice = (id: string, keepStarted = false) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    clearCountdown();
    clearUpNext();
    setPlaying(false);
    setStarted(keepStarted);
    setVoiceId(id);
  };

  /** Continuous play: the clip ended, so line up the next voice and go. */
  const ended = () => {
    setPlaying(false);
    if (!continuous || voices.length < 2) return;
    const i = voices.findIndex((v) => v.id === voice.id);
    const next = voices[(i + 1) % voices.length];
    switchVoice(next.id, true);
    autoplayNext.current = true;
    setUpNext(next.name);
  };
  const canPlay = () => {
    if (!autoplayNext.current) return;
    autoplayNext.current = false;
    upNextTimer.current = setTimeout(() => {
      upNextTimer.current = null;
      setUpNext(null);
      play();
    }, UP_NEXT_MS);
  };

  /* ---- hand-driving the reel: drag / swipe → seek ---- */
  const seekTo = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return; // metadata not in yet: nothing to seek
    audio.currentTime = Math.min(audio.duration, Math.max(0, t));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const audio = audioRef.current;
    if (!audio) return;
    drag.current = { active: true, moved: false, x0: e.clientX, t0: audio.currentTime, wasPlaying: !audio.paused };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x0;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      sectionRef.current?.setAttribute("data-drag", "1");
      if (d.wasPlaying) audioRef.current?.pause(); // the reel is exact while paused, so it snaps to the hand
    }
    // dragging left pulls later scenes toward the hairline: x grows as dx falls
    seekTo(tAt(xAt(d.t0) - dx));
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    sectionRef.current?.removeAttribute("data-drag");
    if (d.moved) {
      setStarted(true); // the hand has engaged: no countdown on the next play
      if (d.wasPlaying) play();
    } else if (countdown === null && upNext === null) {
      togglePlay(); // a plain press on the reel is play/pause
    }
  };

  /* horizontal wheel / trackpad swipe seeks; vertical is left to the page.
     Native listener because React registers wheel as passive. */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let acc = 0;
    let raf = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      acc += e.deltaX;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const dx = acc;
        acc = 0;
        audio.currentTime = Math.min(audio.duration, Math.max(0, tAt(xAt(audio.currentTime) + dx)));
        setStarted(true);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [xAt, tAt]);

  useEffect(() => () => { clearCountdown(); clearUpNext(); }, []);

  return (
    <section
      ref={sectionRef}
      className="ar"
      data-variant={variant}
      data-scheme={scheme}
      aria-label="Listen: voices"
    >
      <audio ref={audioRef} src={voice.audio} preload="metadata" onEnded={ended} onCanPlay={canPlay} />
      <div className="ar-rule" aria-hidden="true" />

      <header className="ar-top">
        <div className="ar-top__voice">
          <span className="ar-top__label">Voice of</span>
          <select
            className="ar-select"
            value={voice.id}
            aria-label="Choose a voice"
            onChange={(e) => switchVoice(e.target.value)}
            onMouseEnter={preload}
            onFocus={preload}
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
          <div className="ar-switch" role="group" aria-label="Colour scheme">
            {SCHEMES.map((s) => (
              <button
                key={s}
                type="button"
                className={s === scheme ? "on" : undefined}
                aria-pressed={s === scheme}
                onClick={() => setScheme(s)}
              >
                {s}
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
        <div ref={trackRef} className="ar-track">
          {voice.scenes.map((s, i) => (
            <Scene key={`${voice.id}-${i}`} scene={s} playing={playing} />
          ))}
        </div>
        {countdown !== null && (
          <div className="ar-countdown" role="status">
            Audio starts in {countdown}
          </div>
        )}
        {upNext !== null && (
          <div className="ar-countdown ar-countdown--next" role="status">
            <span className="ar-countdown__label">Up next</span>
            {upNext}
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

      {/* hidden transcript: the quotes, in order */}
      <div className="ar-transcript">
        <h2>Transcript of on-screen quotes</h2>
        <ol>
          {voice.scenes
            .filter((s) => s.type === "quote")
            .map((s, i) => (
              <li key={i}>{s.type === "quote" ? s.text : null}</li>
            ))}
        </ol>
      </div>
    </section>
  );
}
