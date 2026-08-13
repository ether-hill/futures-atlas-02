"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SWIPE_CHECKED, SWIPE_SAMPLE, type SwipeSample } from "@/data/feed-swipe";

/**
 * Swipe the Future, playable in the feed — built to be the same round the game
 * deals, not a trailer for it: ten cards keyed five already / five not-yet, the
 * progress dots and counter above the deck, drag or the round ✕ / ✓, then the
 * full reveal with its number, its explanation and its source, advanced by
 * NEXT rather than a timer. A score card closes it.
 *
 * The one thing it does not do is keep score across visits or send anything
 * anywhere; it is a taster, and the link to the real deck sits under it.
 */

const THRESHOLD = 72;
/** Round length, as in the game's "surprise me" deck. */
const DECK = 10;

/**
 * Fisher-Yates, the same shuffle the real deck uses
 * (swipe-the-future/app/Calibration.tsx) — so a round here is dealt exactly
 * the way a round there is, rather than replaying one fixed order.
 */
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}
const PAPER = "#f4f1ea";
const INK = "#19140e";
const DIM = "#6f675c";
const GOOD = "#1d7a4c";
const BAD = "#b8452c";
const LINE = "rgba(25,20,14,.16)";

type Phase = "ask" | "reveal" | "done";

export function SwipeDemoCard() {
  /**
   * Dealt on mount, never during render: Math.random() at render time gives the
   * server and the client different decks and React tears the tree down over
   * the mismatch. The game deals in an effect for the same reason.
   */
  const [deck, setDeck] = useState<SwipeSample[]>([]);
  useEffect(() => {
    setDeck(shuffle(SWIPE_SAMPLE).slice(0, DECK));
  }, []);

  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [answers, setAnswers] = useState<boolean[]>([]); // correct?
  const [dx, setDx] = useState(0);
  const [fling, setFling] = useState(0);
  const startX = useRef<number | null>(null);

  const card: SwipeSample | undefined = deck[i];
  // constant, so the dots and the counter are stable before the deal lands
  const total = Math.min(DECK, SWIPE_SAMPLE.length);
  const [given, setGiven] = useState<"already" | "notyet" | null>(null);
  /** true while the reveal is on its way out through the top */
  const [leaving, setLeaving] = useState(false);
  /**
   * Entry is driven from state rather than a CSS keyframe. A keyframe with
   * fill-mode owns the transform until it is removed, and removing it in the
   * same commit that sets the exit transform leaves the transition with no
   * start value — so the exit snapped instead of easing. One inline transform,
   * transitioned in both directions, interpolates either way.
   */
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (phase !== "reveal") {
      setShown(false);
      return;
    }
    // two frames: one to commit the start value, one to move off it
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase, i]);

  function decide(choice: "already" | "notyet") {
    if (!card || phase !== "ask") return;
    setFling(choice === "already" ? 1 : -1);
    setDx(0);
    setGiven(choice);
    setAnswers((a) => [...a, choice === card.verdict]);
    window.setTimeout(() => {
      setPhase("reveal");
      setFling(0);
    }, 240);
  }

  /** Advance, after letting the reveal leave through the top of the card. */
  function next() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      if (i + 1 >= total) {
        setPhase("done");
        return;
      }
      setI((n) => n + 1);
      setGiven(null);
      setPhase("ask");
    }, 240);
  }

  function restart() {
    setDeck(shuffle(SWIPE_SAMPLE).slice(0, DECK)); // a new round, newly dealt
    setI(0);
    setAnswers([]);
    setGiven(null);
    setPhase("ask");
  }

  const onDown = (e: React.PointerEvent) => {
    if (phase !== "ask" || fling) return;
    startX.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onUp = () => {
    if (startX.current === null) return;
    const d = dx;
    startX.current = null;
    if (d > THRESHOLD) decide("already");
    else if (d < -THRESHOLD) decide("notyet");
    else setDx(0);
  };

  const dragging = startX.current !== null;
  const commit = Math.min(1, Math.abs(dx) / THRESHOLD);
  const right = answers.filter(Boolean).length;

  return (
    <div className="relative flex h-full flex-col justify-center p-5">
      {/* progress: dots + counter, as the game shows it. Rendered on the score
          slide too — hiding it there collapsed the row and jogged the card. */}
      <div className="mb-3 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, n) => (
              <span
                key={n}
                className="block rounded-full transition-all duration-300"
                style={{
                  width: n === i ? 8 : 6,
                  height: n === i ? 8 : 6,
                  background:
                    n < i ? "var(--accent)" : n === i ? "var(--accent)" : "color-mix(in oklab, var(--text) 22%, transparent)",
                  opacity: n <= i ? 1 : 0.65,
                }}
              />
            ))}
          </span>
        <span className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-faint">
          {String(i + 1).padStart(2, "0")} / {total}
        </span>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-[330px] flex-none">
        {phase === "done" ? (
          <Paper>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: DIM }}>
              Your round
            </span>
            <p
              className="mt-3 text-[54px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
              style={{ color: INK }}
            >
              {right}<span style={{ color: DIM }}>/{total}</span>
            </p>
            <p className="mt-4 max-w-[36ch] text-center text-[14px] leading-[1.55]" style={{ color: DIM }}>
              The full deck is source-checked card by card, with sectors to choose from and
              a calibration score at the end.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/swipe-the-future"
                className="rounded-full px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ background: INK, color: PAPER }}
              >
                Play the full deck →
              </Link>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ borderColor: LINE, color: INK }}
              >
                Again
              </button>
            </div>
          </Paper>
        ) : card ? (
          <>
            {[2, 1].map((d) => (deck[i + d] ? <Paper key={`b${d}`} depth={d} /> : null))}

            <Paper
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              style={{
                transform: fling
                  ? `translateX(${fling * 130}%) rotate(${fling * 18}deg)`
                  : `translateX(${dx}px) rotate(${dx / 22}deg)`,
                opacity: fling ? 0 : 1,
                transition: dragging ? "none" : "transform .3s cubic-bezier(.2,.7,.2,1), opacity .3s",
                cursor: phase === "ask" ? "grab" : "default",
                touchAction: "pan-y",
                justifyContent: phase === "reveal" ? "flex-start" : "center",
                alignItems: phase === "reveal" ? "stretch" : "center",
                textAlign: phase === "reveal" ? "left" : "center",
              }}
            >
              {phase === "ask" ? (
                <>
                  {/* names the game on the card face, so a reader meeting this
                      mid-feed knows what they are playing before they swipe */}
                  <span
                    className="px-3 pb-3 text-center font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: DIM }}
                  >
                    Swipe the Future
                  </span>
                  <h3
                    className="px-3 pb-16 text-center text-[clamp(16px,1.25vw,21px)] font-bold leading-[1.3] tracking-[-0.02em] text-balance"
                    style={{ color: INK }}
                  >
                    {card!.claim}
                  </h3>
                  <Stamp side="left" show={dx < -8 ? commit : 0} />
                  <Stamp side="right" show={dx > 8 ? commit : 0} />
                  <Hint side="left" />
                  <Hint side="right" />
                </>
              ) : (
                <div className="h-full w-full overflow-hidden">
                <div
                  className="flex h-full w-full flex-col overflow-y-auto pb-16 pr-1 text-[0.92em] motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:!transition-none"
                  style={{
                    transform: leaving
                      ? "translateY(-112%)"
                      : shown
                        ? "translateY(0)"
                        : "translateY(58%)",
                    opacity: leaving ? 0 : shown ? 1 : 0,
                    transition: "transform .3s cubic-bezier(.2,.7,.2,1), opacity .3s",
                  }}
                >
                  <p className="text-[13px] leading-[1.5]" style={{ color: DIM }}>
                    {card!.claim}
                  </p>
                  <span className="my-4 block h-px w-full" style={{ background: LINE }} />
                  <p
                    className="text-[17px] font-bold leading-none"
                    style={{ color: given === card!.verdict ? GOOD : BAD }}
                  >
                    {given === card!.verdict ? "Correct" : "Not quite"}
                  </p>
                  {/* label and value on one line, at reading size:
                      "Already real since 1995." */}
                  <p className="mt-2 text-[15px] leading-snug" style={{ color: DIM }}>
                    {card!.bigLabel}{" "}
                    <b className="font-extrabold tabular-nums" style={{ color: INK }}>
                      {card!.big}
                    </b>
                    .
                  </p>
                  <p className="mt-3 text-[14.5px] font-bold leading-[1.45]" style={{ color: INK }}>
                    {card!.lede}
                  </p>
                  {card!.note && (
                    <p className="mt-2 text-[13.5px] leading-[1.5]" style={{ color: DIM }}>
                      {card!.note}
                    </p>
                  )}
                  <p className="mt-3 text-[12px] leading-[1.5]" style={{ color: DIM }}>
                    <a
                      href={card!.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                      style={{ color: INK }}
                    >
                      {card!.source.label} ↗
                    </a>{" "}
                    · checked {SWIPE_CHECKED}
                  </p>
                </div>
                </div>
              )}
            </Paper>
          </>
        ) : (
          // one frame, before the effect deals: the stage keeps its aspect box
          // so nothing in the feed grid moves
          <Paper />
        )}
      </div>

      {/* actions sit ON the card, as in the game */}
      {phase !== "done" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-8 [&>*]:pointer-events-auto">
          <span />

          {phase === "ask" ? (
            <div className="flex items-start gap-9">
              <Round label="Not yet" glyph="✕" colour={BAD} onClick={() => decide("notyet")} />
              <Round label="Already real" glyph="✓" colour={GOOD} onClick={() => decide("already")} />
            </div>
          ) : (
            <Round label="Next" glyph="→" colour="var(--accent)" onClick={next} />
          )}

          <span />
        </div>
      )}

      <Link
        href="/swipe-the-future"
        className="mt-4 self-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-graphite transition-colors hover:text-accent"
      >
        Play the full deck →
      </Link>
    </div>
  );
}

/* ---------- parts ---------- */

function Paper({
  children,
  depth = 0,
  style,
  ...rest
}: {
  children?: React.ReactNode;
  depth?: number;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className="absolute inset-0 flex select-none flex-col items-center justify-center rounded-[14px] p-6"
      style={{
        background: PAPER,
        border: `1px solid ${LINE}`,
        boxShadow: depth ? "0 6px 18px -12px rgba(0,0,0,.5)" : "0 20px 48px -24px rgba(0,0,0,.75)",
        transform: depth ? `translate(${depth * 7}px, ${depth * 5}px) scale(${1 - depth * 0.03})` : undefined,
        zIndex: depth ? 10 - depth : 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Hint({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[20px]"
      style={{ [side]: 14, color: "rgba(25,20,14,.22)" }}
    >
      {side === "left" ? "←" : "→"}
    </span>
  );
}

function Stamp({ side, show }: { side: "left" | "right"; show: number }) {
  const yes = side === "right";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-6 grid h-14 w-14 place-items-center rounded-[10px] border-[3px] text-[26px] font-bold"
      style={{
        [side]: 20,
        color: yes ? GOOD : BAD,
        borderColor: yes ? GOOD : BAD,
        transform: `rotate(${yes ? -13 : 13}deg)`,
        opacity: show,
        transition: "opacity .12s linear",
      }}
    >
      {yes ? "✓" : "✕"}
    </span>
  );
}

function Round({
  label,
  glyph,
  colour,
  onClick,
}: {
  label: string;
  glyph: string;
  colour: string;
  onClick: () => void;
}) {
  return (
    <span className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="grid h-[46px] w-[46px] place-items-center rounded-full border-2 bg-[rgba(244,241,234,.9)] text-[20px] leading-none backdrop-blur-sm transition-transform active:scale-95"
        style={{
          color: colour,
          borderColor: `color-mix(in srgb, ${colour} 55%, ${LINE})`,
          background: "rgba(255,255,255,.06)",
        }}
      >
        {glyph}
      </button>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-graphite">{label}</span>
    </span>
  );
}
