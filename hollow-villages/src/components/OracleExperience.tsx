"use client";

import { useEffect, useRef, useState } from "react";
import { letters } from "@/data/letters";
import { HeroSlider } from "./HeroSlider";
import { OracleResponse } from "./OracleResponse";
import { AtmospherePage, AtmosphereHero, type AtmosphereVariant } from "./OracleAtmosphere";

/**
 * The whole Hollow Villages front door.
 *
 *  • mode "hero"  — the full-screen before/after photo hero (the landing).
 *  • mode "oracle"— the "Morning Consultation": a box that looks like you could
 *    write to the oracle. Clicking it enters a real, prewritten letter (free
 *    typing isn't live yet); the oracle's answer rises into a reserved slot
 *    below, then the reading descends through the sections.
 *
 * The dreaming gradient behind it defaults to the full-page wash; `?v=b|c|d`
 * swaps in the hero-only / both / orb placements for comparison.
 */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Types `text` out while `active`. Instant if reduced-motion. */
function useTypewriter(text: string, active: boolean) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown("");
      setDone(false);
      return;
    }
    if (prefersReduced()) {
      setShown(text);
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setShown(text);
        setDone(true);
      }
    }, 20);
    return () => window.clearInterval(id);
  }, [text, active]);
  return [shown, done] as const;
}

const pad = (n: number) => String(n).padStart(2, "0");
const VARIANTS: Record<string, AtmosphereVariant> = { a: "page", b: "hero", c: "both", d: "orb" };

type Mode = "hero" | "oracle";
type Phase = "idle" | "typing" | "ready" | "reading" | "answered";

export function OracleExperience({ startInOracle = false }: { startInOracle?: boolean }) {
  const [mode, setMode] = useState<Mode>(startInOracle ? "oracle" : "hero");
  const [phase, setPhase] = useState<Phase>("idle");
  const [sel, setSel] = useState(0);
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(0); // how far through the gated reading (0 = verdict only)
  const [variant, setVariant] = useState<AtmosphereVariant>("page");
  const timer = useRef<number | null>(null);

  const letter = letters[sel];

  // reveal the next section and scroll to it — the reading is button-driven, not free-scroll
  const goTo = (nextStep: number, id: string) => {
    setStep((s) => Math.max(s, nextStep));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
      }, 40);
    }
  };

  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get("v");
      if (v && VARIANTS[v]) setVariant(VARIANTS[v]);
    } catch {}
  }, []);

  // one screen, no scroll while the photo hero is showing
  useEffect(() => {
    if (mode !== "hero") return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [mode]);

  // the shared Futures Atlas footer only appears at the very end of the reading
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("hide-fa-foot", mode === "hero" || step < 5);
    return () => root.classList.remove("hide-fa-foot");
  }, [mode, step]);

  const begin = () => {
    clearTimer();
    setSel((prev) => (count === 0 ? Math.floor(Math.random() * letters.length) : (prev + 1) % letters.length));
    setCount((c) => c + 1);
    setStep(0);
    setPhase("idle");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: count === 0 ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (startInOracle && count === 0) begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterOracle = () => {
    setMode("oracle");
    begin();
  };
  const goHome = () => {
    clearTimer();
    setMode("hero");
    setPhase("idle");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  };

  const writeLetter = () => {
    if (phase === "idle") setPhase("typing");
  };
  const consult = () => {
    clearTimer();
    setPhase("reading");
    timer.current = window.setTimeout(() => setPhase("answered"), prefersReduced() ? 200 : 1100);
  };

  const [letterText, letterDone] = useTypewriter(letter.body, mode === "oracle" && phase === "typing");

  useEffect(() => {
    if (mode === "oracle" && phase === "typing" && letterDone) setPhase("ready");
  }, [mode, phase, letterDone]);

  /* ── HERO (the photo landing) ────────────────────────────────── */
  if (mode === "hero") {
    return (
      <HeroSlider
        beforeImage="/hollow-villages/hero/square-before.jpg"
        afterImage="/hollow-villages/hero/square-after.jpg"
        onConsult={enterOracle}
      />
    );
  }

  /* ── ORACLE (the Morning Consultation) ───────────────────────── */
  const c = letter.correspondent;
  const r = letter.reframe;
  const idle = phase === "idle";
  const typing = phase === "typing";
  const written = phase !== "idle" && phase !== "typing"; // letter finished → reveal the byline
  const answered = phase === "answered";

  return (
    <>
      <AtmospherePage variant={variant} />

      {/* Home — a plain pill, no shadow/blur */}
      <button
        type="button"
        onClick={goHome}
        aria-label="Back to the home hero"
        className="fixed left-[18px] top-[calc(var(--fa-nav-h,64px)+14px)] z-50 inline-flex h-10 items-center gap-2 rounded-full border border-ink/25 bg-surface px-[17px] font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink/50 max-[680px]:left-3"
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3.5 9.5 10 4l6.5 5.5M5 8.5V16h10V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Home
      </button>

      {/* HERO — slide 1: the writable box (raised) + a reserved slot for the answer */}
      <section className="relative overflow-hidden">
        <AtmosphereHero variant={variant} />

        <div className="relative z-10 mx-auto flex h-[calc(100svh-var(--fa-nav-h,64px))] max-w-[1000px] flex-col justify-start overflow-hidden px-[clamp(16px,4vw,44px)] pb-[clamp(18px,2.5vh,36px)] pt-[clamp(48px,7vh,86px)]">
          {/* eyebrow */}
          <div className="mb-[clamp(12px,1.6vw,20px)] flex items-center justify-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-accent-deep">Consult the oracle</span>
            <span className="h-1 w-1 rounded-full bg-ink/35" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite">Consultation {pad(count)}</span>
          </div>

          {/* the letter box — bigger, looks writable */}
          <div
            onClick={writeLetter}
            className={`relative border border-ink bg-panel px-[clamp(22px,3vw,40px)] pb-[clamp(18px,2.4vw,28px)] pt-[clamp(22px,2.6vw,32px)] text-left ${idle ? "cursor-text" : ""}`}
          >
            <span aria-hidden className="absolute left-[30px] top-[-1px] h-[3px] w-10 bg-accent" />
            <div className="mb-4 flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-graphite">Your letter</span>
              <span className="h-px flex-1 bg-ink/15" />
              {written && (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{c.place}</span>
              )}
            </div>

            {idle ? (
              <div className="flex min-h-[clamp(78px,10vh,128px)] items-start">
                <span className="oracle-voice text-[clamp(16.5px,1.7vw,22px)] not-italic leading-[1.55] text-ink/25">
                  <span className="caret-blink inline-block h-[1.05em] w-[2.5px] translate-y-[0.15em] bg-accent align-middle" />
                </span>
              </div>
            ) : (
              <p className="oracle-voice m-0 min-h-[clamp(78px,10vh,128px)] text-[clamp(16.5px,1.7vw,22px)] not-italic leading-[1.55] text-ink">
                <span className="italic">“{typing ? letterText : letter.body}”</span>
                {typing && !letterDone && (
                  <span className="caret-blink ml-0.5 inline-block h-[1em] w-[2.5px] translate-y-[0.12em] bg-accent align-middle" />
                )}
              </p>
            )}

            {written && (
              <div className="mt-[18px] flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/15 pt-4">
                <span
                  className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-[13px] font-extrabold text-accent-deep"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {c.name[0]}
                </span>
                <span className="text-[14px] font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  {c.name}, {c.age}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-graphite">{c.role}</span>
                {phase === "ready" && (
                  <button
                    type="button"
                    onClick={consult}
                    className="ml-auto inline-flex items-center gap-2 rounded-[2px] bg-accent px-6 py-3 font-mono text-[11.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
                  >
                    Consult <span className="text-[13px]">↓</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* reserved answer slot — keeps the box from jumping when the oracle replies */}
          <div className="mt-[clamp(18px,2.4vw,32px)] flex flex-col" style={{ minHeight: "clamp(150px, 20vh, 220px)" }}>
            {phase === "reading" ? (
              <div className="flex items-center justify-center gap-2.5 pt-8">
                {[0, 0.18, 0.36].map((d) => (
                  <span key={d} className="pulse-dot h-[9px] w-[9px] rounded-full bg-accent" style={{ animationDelay: `${d}s` }} />
                ))}
                <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite">
                  Reading your place against the record…
                </span>
              </div>
            ) : answered ? (
              <div data-reveal className="is-in text-center">
                <div className="mb-4 inline-flex items-center gap-2.5">
                  <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-accent-deep">The oracle responds</span>
                </div>
                <p
                  className="mx-auto max-w-[34ch] text-[clamp(22px,2.7vw,42px)] font-extrabold leading-[1.08] tracking-[-0.024em] text-ink text-balance"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {r.thesis}
                </p>
                <div className="mt-[clamp(16px,2.2vw,26px)] flex justify-center">
                  <button
                    type="button"
                    onClick={() => goTo(1, "sec-change")}
                    className="inline-flex items-center gap-3 rounded-[3px] bg-accent px-9 py-[18px] font-mono text-[12.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
                  >
                    Learn what can change <span aria-hidden className="text-[15px]">↓</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <span className="oracle-voice text-[clamp(15px,1.6vw,19px)] italic text-graphite/70">
                  The oracle is listening.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* the descending reading */}
      {answered && (
        <div className="relative z-10">
          <OracleResponse letter={letter} count={count} step={step} goTo={goTo} onAgain={begin} />
        </div>
      )}
    </>
  );
}
