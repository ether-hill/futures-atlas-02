"use client";

import { useEffect, useRef, useState } from "react";
import { letters } from "@/data/letters";
import { getFuturePair } from "@/data/futures";
import { research } from "@/data/research";
import { Citations } from "./Citation";
import { BeforeAfter } from "./BeforeAfter";
import { ResearchCard } from "./ResearchCard";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Types `text` out while `active`. Instant if reduced-motion. */
function useTypewriter(text: string, active: boolean, speed = 16) {
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
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, active, speed]);
  return [shown, done] as const;
}

type Phase = "intro" | "writing" | "reading" | "offer" | "vision";

const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

export function LettersConsole() {
  const [sel, setSel] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(0); // how many consultations run
  const timer = useRef<number | null>(null);

  const letter = letters[sel];
  const reply = letter.reply;
  const pair = getFuturePair(reply.futurePairId);

  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => () => clearTimer(), []);

  const begin = () => {
    clearTimer();
    // First consultation starts at a random position (so different visitors begin
    // in a different place); every "Consult again" then advances through the
    // letters in order, cycling so you see them all before any repeat.
    setSel((prev) =>
      count === 0 ? Math.floor(Math.random() * letters.length) : (prev + 1) % letters.length,
    );
    setCount((c) => c + 1);
    setPhase("writing");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [letterText, letterDone] = useTypewriter(letter.body, phase === "writing", 13);
  const [openingText, openingDone] = useTypewriter(reply.opening, phase === "offer", 18);

  // letter written -> oracle reads -> offer
  useEffect(() => {
    if (phase === "writing" && letterDone) {
      timer.current = window.setTimeout(() => setPhase("reading"), prefersReduced() ? 50 : 500);
    }
  }, [phase, letterDone]);
  useEffect(() => {
    if (phase === "reading") {
      timer.current = window.setTimeout(() => setPhase("offer"), prefersReduced() ? 150 : 1500);
    }
  }, [phase]);

  const seeVision = () => {
    clearTimer();
    setPhase("vision");
  };

  // build the oracle's vision-offer line from the forecast's levers
  const parts = (pair?.callout ?? "").split("·").map((s) => s.trim()).filter(Boolean);
  const visionOffer =
    parts.length >= 2
      ? `I have a vision of your village in 2050 — when ${lower(parts[0])} and ${lower(parts[1])} arrive. Do you want to see it?`
      : `I have a vision of your village in 2050 — when ${lower(parts[0] || "the plan")} is in place. Do you want to see it?`;

  const showLetter = phase !== "intro";
  const showResponse = phase === "offer" || phase === "vision";
  // tiers persist from offer (once the pronouncement is typed) through vision —
  // openingDone resets when the typewriter goes inactive, so don't rely on it alone.
  const showTiers = (phase === "offer" && openingDone) || phase === "vision";
  const initial = letter.correspondent.name[0];

  // related research resolved from the reply's ids, in order
  const related = reply.researchIds
    .map((id) => research.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  /* ---------- intro ---------- */
  if (phase === "intro") {
    return (
      <div className="relative w-full overflow-hidden border border-ink bg-panel px-[clamp(24px,6vw,96px)] py-[clamp(48px,9vw,120px)] text-center">
        <div className="plan-grid absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-[620px]">
          <span className="mb-7 inline-flex h-[64px] w-[64px] items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-2xl text-accent-deep">
            ◆
          </span>
          <h2 className="mx-auto max-w-[20ch] text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink text-balance">
            The oracle is ready.
          </h2>
          <p className="mx-auto mb-10 mt-5 max-w-[48ch] font-mono text-[13.5px] leading-[1.8] text-ink-70">
            Every consultation begins with a real letter, drawn from the record
            at random. Start, and the oracle will read the place, answer at every
            scale, and show you that village in 2050.
          </p>
          <button
            onClick={begin}
            className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-9 py-4 font-mono text-[13px] uppercase tracking-[0.1em] text-paper shadow-[0_10px_30px_-8px_rgba(33,30,24,0.4)] transition-colors hover:bg-accent-deep"
          >
            Begin the consultation <span className="text-[15px]">→</span>
          </button>
        </div>
      </div>
    );
  }

  /* ---------- consultation (fills the full container) ---------- */
  return (
    <div className="flex w-full flex-col gap-[clamp(40px,6vw,72px)]">
      {/* the letter — a received document, generous and wide */}
      {showLetter && (
        <div className="relative border border-ink bg-panel p-[clamp(28px,5vw,64px)]">
          <span aria-hidden className="absolute -left-px -top-px h-5 w-5 border-l-2 border-t-2 border-accent" />
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
              {phase === "writing" ? "A letter arrives" : "Letter received"}
            </span>
            <span className="h-px min-w-5 flex-1 bg-ink/20" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">
              {letter.correspondent.place}
            </span>
          </div>
          <p className="oracle-voice max-w-[40ch] text-[clamp(20px,2.6vw,32px)] not-italic leading-[1.4] text-ink">
            <span className="italic">“{phase === "writing" ? letterText : letter.body}”</span>
            {phase === "writing" && !letterDone && (
              <span className="caret-blink ml-0.5 inline-block w-[2px] align-middle text-accent">▍</span>
            )}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-sm font-extrabold text-accent-deep"
              style={{ fontFamily: "var(--font-archivo)" }}
            >
              {initial}
            </span>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-ink" style={{ fontFamily: "var(--font-archivo)" }}>
                {letter.correspondent.name}, {letter.correspondent.age}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-graphite">
                {letter.correspondent.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* reading */}
      {phase === "reading" && (
        <div className="flex items-center gap-3.5 border border-accent bg-accent-soft px-7 py-6">
          <span className="flex gap-1.5">
            {[0, 0.18, 0.36].map((d) => (
              <span key={d} className="pulse-dot h-[9px] w-[9px] rounded-full bg-accent-deep" style={{ animationDelay: `${d}s` }} />
            ))}
          </span>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-accent-deep">
            The oracle is reading the record…
          </span>
        </div>
      )}

      {/* oracle responds — pronouncement -> four tiers -> (offer) -> By 2050 climax */}
      {showResponse && (
        <div className="flex flex-col gap-[clamp(40px,6vw,72px)]">
          {/* the oracle pronounces: no box, left accent rule, upright editorial serif */}
          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-[7px] w-[7px] bg-accent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">The oracle responds</span>
            </div>
            <p
              className="max-w-[30ch] border-l-[3px] border-accent pl-6 text-[clamp(24px,3.4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink"
              style={{ fontFamily: "var(--font-archivo)" }}
            >
              {phase === "offer" ? openingText : reply.opening}
              {phase === "offer" && !openingDone && (
                <span className="caret-blink ml-0.5 inline-block w-[2px] align-middle text-accent">▍</span>
              )}
            </p>
          </div>

          {/* start here — one thing the writer can do now */}
          {showTiers && (
            <div data-reveal className="is-in flex flex-col gap-[clamp(28px,4vw,48px)]">
              <div className="flex max-w-[64ch] flex-col gap-2.5 border-l-[3px] border-accent/50 pl-6">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
                  Start here · what you can do
                </span>
                <p className="text-[clamp(15px,1.6vw,19px)] leading-[1.62] text-ink">{reply.personal}</p>
              </div>

              {/* distinct solutions — each a different lever */}
              <div>
                <p className="annot mb-5 normal-case tracking-[0.14em]">
                  What could change here · {reply.solutions.length} ways
                </p>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {reply.solutions.map((s, i) => (
                    <div key={i} className="flex flex-col gap-3 border border-ink bg-panel p-[clamp(20px,2.4vw,28px)]">
                      <span className="year text-[clamp(20px,2vw,26px)] leading-none text-accent-deep">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h4
                        className="text-[clamp(17px,1.7vw,21px)] font-extrabold leading-[1.14] tracking-[-0.01em] text-ink"
                        style={{ fontFamily: "var(--font-archivo)" }}
                      >
                        {s.title}
                      </h4>
                      <p className="font-mono text-[12px] leading-[1.7] text-ink-70">{s.body}</p>
                      {s.researchIds && s.researchIds.length > 0 && (
                        <div className="mt-1">
                          <Citations ids={s.researchIds} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* offer — the vision question + button */}
          {phase === "offer" && openingDone && (
            <div data-reveal className="is-in flex flex-col items-start gap-6 border-t border-ink/15 pt-8">
              <p
                className="max-w-[48ch] text-[clamp(18px,2.1vw,26px)] font-medium leading-[1.34] text-accent-deep"
                style={{ fontFamily: "var(--font-archivo)" }}
              >
                {visionOffer}
              </p>
              <button
                onClick={seeVision}
                className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-8 py-4 font-mono text-[13px] uppercase tracking-[0.1em] text-paper shadow-[0_10px_30px_-8px_rgba(33,30,24,0.4)] transition-colors hover:bg-accent-deep"
              >
                See the vision <span className="text-[15px]">→</span>
              </button>
            </div>
          )}

          {/* By 2050: the climax — the single 2px accent border, image beside the vision */}
          {phase === "vision" && (
            <>
              <div data-reveal className="is-in border-2 border-accent bg-panel" style={{ animationDelay: "60ms" }}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-accent px-[clamp(18px,3vw,28px)] py-5">
                  <span className="year text-[clamp(24px,3vw,38px)] leading-none text-accent-deep">By 2050</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">Drag the line</span>
                </div>
                <div className="grid gap-px bg-ink/15 lg:grid-cols-[1.2fr_1fr]">
                  {pair && (
                    <div className="bg-panel p-[clamp(16px,2.5vw,28px)]">
                      <BeforeAfter
                        beforeImage={pair.beforeImage}
                        afterImage={pair.afterImage}
                        afterIsPlaceholder={pair.afterIsPlaceholder}
                        callout={pair.callout}
                        alt={`${letter.correspondent.name}'s village`}
                      />
                      <p className="annot mt-3 px-1 normal-case tracking-normal text-graphite">
                        Today: {pair.realPlaceCaption ?? "a real rural place"}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col justify-center gap-4 bg-panel p-[clamp(24px,4vw,48px)]">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
                      The forecast
                    </span>
                    <p
                      className="text-[clamp(20px,2.4vw,30px)] font-medium leading-[1.32] text-ink"
                      style={{ fontFamily: "var(--font-archivo)" }}
                    >
                      {reply.vision2050}
                    </p>
                  </div>
                </div>
              </div>

              {/* related research — the same cards as /research */}
              {related.length > 0 && (
                <div data-reveal className="is-in">
                  <div className="mb-6 flex flex-wrap items-baseline gap-4 border-b border-ink/15 pb-3">
                    <h3 className="text-[clamp(18px,2vw,26px)] font-extrabold tracking-[-0.01em] text-ink">
                      Where this has happened
                    </h3>
                    <span className="annot">{related.length} sources</span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {related.map((entry) => (
                      <ResearchCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={begin}
                className="inline-flex items-center gap-2.5 self-start rounded-[2px] border-[1.5px] border-ink/30 px-[20px] py-3.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink hover:bg-ink/[0.04]"
              >
                ↺ Consult again
              </button>
            </>
          )}
        </div>
      )}

      {count > 0 && (
        <p className="annot text-graphite/70">Consultation {String(count).padStart(2, "0")}</p>
      )}
    </div>
  );
}
