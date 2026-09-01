"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scene } from "./Scene";
import { Waveform } from "./Waveform";
import { useAudioClock } from "./useAudioClock";
import type { Voice } from "./types";

/**
 * Audio-driven horizontal story reel. Audio time is the only source of truth:
 * useAudioClock writes CSS custom properties every frame and audio-reel.css
 * turns them into the track position, per-layer parallax and approach fades.
 * Nothing here animates on scroll, timers, or its own clock.
 */
export function AudioReel({ voices, shareHref }: { voices: Voice[]; shareHref: string }) {
  const [voiceId, setVoiceId] = useState(voices[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const preloaded = useRef<Map<string, HTMLAudioElement>>(new Map());

  const voice = useMemo(() => voices.find((v) => v.id === voiceId) ?? voices[0], [voices, voiceId]);
  const starts = useMemo(() => voice.scenes.map((s) => s.start), [voice]);
  const { remeasure } = useAudioClock({ audioRef, sectionRef, trackRef, starts });

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

  const clearCountdown = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
  };

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
          audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        }
      }, 1000);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing, countdown, started]);

  /** Switching pauses and unloads, swaps scenes + peaks, resets the clock. */
  const switchVoice = (id: string) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    clearCountdown();
    setPlaying(false);
    setStarted(false);
    setVoiceId(id);
    requestAnimationFrame(() => remeasure());
  };

  /** Preload the next voice's audio metadata on hover/focus of the select. */
  const preload = () => {
    voices.forEach((v) => {
      if (v.id === voiceId || preloaded.current.has(v.id)) return;
      const a = new Audio();
      a.preload = "metadata";
      a.src = v.audio;
      preloaded.current.set(v.id, a);
    });
  };

  const ended = () => setPlaying(false);

  return (
    <section ref={sectionRef} className="ar" aria-label="Listen: voices">
      <audio ref={audioRef} src={voice.audio} preload="metadata" onEnded={ended} />

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
        <a className="ar-share" href={shareHref}>
          Share your hope <span aria-hidden="true">→</span>
        </a>
      </header>

      <div className="ar-viewport">
        <div className="ar-hairline" aria-hidden="true" />
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
