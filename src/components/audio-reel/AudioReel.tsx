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
 * lands in another person's stretch swaps the clip underneath. Between two
 * people the line carries GAP seconds of silence — the reel keeps moving at
 * its one speed, nothing plays, and the next name arrives well clear of the
 * last picture. When a clip ends the silence runs, then the next clip plays.
 * After the last clip the reel keeps its speed until the audio has actually
 * stopped, then glides to a halt (GLIDE seconds, easing out).
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
const GAP = 3.5; // seconds of silence between one person and the next
const GLIDE = 2.5; // seconds the reel takes to ease to a halt once the last clip has stopped

export interface Edition {
  href: string;
  label: string;
  current?: boolean;
}

export function AudioReel({
  voices,
  shareHref,
  label = "Voice of",
  editions,
}: {
  voices: Voice[];
  shareHref: string;
  /** The word before the jump list: "Voice of" for people, "On" for issues. */
  label?: string;
  /** The editions of the piece, if there is more than one, as links. */
  editions?: Edition[];
}) {
  const [voiceId, setVoiceId] = useState(voices[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [variant, setVariant] = useState<Variant>("editorial");
  const [showVariants, setShowVariants] = useState(false); // V1 is the piece; ?v= opens the others
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
  const gap = useRef<{ raf: number } | null>(null); // the silence between two people, running
  const drag = useRef({ active: false, moved: false, x0: 0, y0: 0, t0: 0, wasPlaying: false });
  const urlRead = useRef(false);

  /* ---- the line: every voice, back to back ---- */
  const timeline = useMemo(() => {
    let offset = 0;
    return voices.map((voice) => {
      const last = voice.scenes[voice.scenes.length - 1]?.start ?? 0;
      const duration = durations[voice.id] ?? last + TAIL;
      const entry = { voice, offset, duration };
      offset += duration + GAP;
      return entry;
    });
  }, [voices, durations]);
  const total = timeline.length ? timeline[timeline.length - 1].offset + timeline[timeline.length - 1].duration : 0;
  const rest = total + GLIDE / 2; // where the glide leaves the line
  const entry = useMemo(() => timeline.find((e) => e.voice.id === voiceId) ?? timeline[0], [timeline, voiceId]);
  const voice = entry.voice;
  useEffect(() => {
    offsetRef.current = entry.offset;
  }, [entry]);

  const starts = useMemo(
    () => timeline.flatMap((e) => e.voice.scenes.map((s) => e.offset + s.start)),
    [timeline],
  );
  const { remeasure, xAt, tAt } = useAudioClock({ audioRef, sectionRef, trackRef, starts, end: rest, offsetRef, overrideRef });

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
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v") ?? "";
    if (isVariant(v)) setVariant(v);
    if (q.has("v")) setShowVariants(true);
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
  useEffect(() => () => { clearCountdown(); cancelGap(); }, []);

  const cancelGap = () => {
    if (gap.current) cancelAnimationFrame(gap.current.raf);
    gap.current = null;
  };
  /**
   * Move the clock by hand from `from` to `to` over `seconds` of real time
   * (linear unless `ease` is given), then `then`. Used for the silence between
   * two people and for the glide after the last clip.
   */
  const runGap = useCallback((from: number, to: number, then: () => void, seconds = to - from, ease?: (u: number) => number) => {
    cancelGap();
    const ms = Math.max(0, seconds) * 1000;
    const t0 = performance.now();
    const step = (now: number) => {
      const u = ms ? Math.min(1, (now - t0) / ms) : 1;
      overrideRef.current = from + (to - from) * (ease ? ease(u) : u);
      if (u < 1) gap.current = { raf: requestAnimationFrame(step) };
      else {
        gap.current = null;
        then();
      }
    };
    gap.current = { raf: requestAnimationFrame(step) };
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const parked = overrideRef.current;
    if (parked !== null && pendingSeek.current === null && parked >= offsetRef.current + (audio.duration || 0)) {
      return; // resting beyond the last clip: nothing left to play
    }
    if (parked !== null && pendingSeek.current === null && parked < offsetRef.current) {
      // parked in the silence before this clip: cross it first, then play
      setPlaying(true);
      runGap(parked, offsetRef.current, () => {
        overrideRef.current = null;
        audio.play().catch(() => setPlaying(false));
      });
      return;
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [runGap]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      cancelGap(); // the reel parks where it is in the silence
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
      const wasPlaying = !audio.paused || gap.current !== null;
      cancelGap();
      const t = Math.min(Math.max(0, T), rest);
      const target = timeline.find((e) => t < e.offset + e.duration) ?? timeline[timeline.length - 1];
      const rel = t - target.offset; // negative: in the silence before this person; past duration: the glide
      if (target.voice.id === voiceId) {
        if (!audio.duration) {
          pendingSeek.current = rel;
          overrideRef.current = t;
          return;
        }
        audio.currentTime = Math.min(audio.duration, Math.max(0, rel));
        if (rel > audio.duration) {
          overrideRef.current = t; // parked in the glide after the last clip
          audio.pause();
          setPlaying(false);
        } else if (rel < 0) {
          overrideRef.current = t;
          if (wasPlaying) {
            audio.pause();
            runGap(t, target.offset, () => {
              overrideRef.current = null;
              audio.play().catch(() => setPlaying(false));
            });
          }
        } else overrideRef.current = null;
        return;
      }
      overrideRef.current = t;
      pendingSeek.current = rel;
      autoplay.current = wasPlaying;
      audio.pause();
      setVoiceId(target.voice.id);
    },
    [timeline, rest, voiceId, runGap],
  );

  /** The incoming clip's metadata is in: apply the pending seek, release the hold, resume. */
  const onLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDurations((d) => (d[voice.id] === audio.duration ? d : { ...d, [voice.id]: audio.duration }));
    if (pendingSeek.current !== null) {
      const rel = pendingSeek.current;
      pendingSeek.current = null;
      audio.currentTime = Math.min(audio.duration, Math.max(0, rel));
      // a negative seek parks the line in the silence before this clip (play() crosses it);
      // one past the clip parks it in the glide after the last
      overrideRef.current = rel < 0 || rel > audio.duration ? entry.offset + rel : null;
    } else overrideRef.current = null;
    if (autoplay.current) {
      autoplay.current = false;
      play();
    }
  };

  /** The clip ended: the silence runs, then the next person plays. After the last, the glide. */
  const ended = () => {
    const i = timeline.indexOf(entry);
    const next = timeline[i + 1];
    if (!next) {
      // the audio has officially stopped: keep the speed, then ease to a halt
      const from = entry.offset + entry.duration;
      overrideRef.current = from;
      runGap(from, rest, () => setPlaying(false), GLIDE, (u) => 2 * u - u * u); // slope 1 → 0
      return;
    }
    overrideRef.current = entry.offset + entry.duration; // hold here; the next clip loads underneath
    pendingSeek.current = -GAP; // parked at the start of the silence
    autoplay.current = true; // and play() crosses it
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
      if ((delta > 0 && T >= rest - 0.1) || (delta < 0 && T <= 0.01)) return;
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
  }, [xAt, tAt, now, seekGlobal, rest]);

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
          <span className="ar-top__label">{label}</span>
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
          {editions && editions.length > 1 && (
            <nav className="ar-editions" aria-label="Edition">
              {editions.map((e) => (
                <a key={e.href} href={e.href} aria-current={e.current ? "page" : undefined}>
                  {e.label}
                </a>
              ))}
            </nav>
          )}
          {showVariants && (
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
          )}
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
