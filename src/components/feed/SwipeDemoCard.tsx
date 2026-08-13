"use client";

import { useRef, useState } from "react";
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
const PAPER = "#f4f1ea";
const INK = "#19140e";
const DIM = "#6f675c";
const GOOD = "#1d7a4c";
const BAD = "#b8452c";
const LINE = "rgba(25,20,14,.16)";

type Phase = "ask" | "reveal" | "done";

export function SwipeDemoCard() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [answers, setAnswers] = useState<boolean[]>([]); // correct?
  const [dx, setDx] = useState(0);
  const [fling, setFling] = useState(0);
  const startX = useRef<number | null>(null);

  const card: SwipeSample | undefined = SWIPE_SAMPLE[i];
  const total = SWIPE_SAMPLE.length;
  const [given, setGiven] = useState<"already" | "notyet" | null>(null);

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

  function next() {
    if (i + 1 >= total) {
      setPhase("done");
      return;
    }
    setI((n) => n + 1);
    setGiven(null);
    setPhase("ask");
  }

  function back() {
    if (phase === "reveal") {
      setPhase("ask");
      setAnswers((a) => a.slice(0, -1));
      setGiven(null);
      return;
    }
    if (i === 0) return;
    setI((n) => n - 1);
    setAnswers((a) => a.slice(0, -1));
    setGiven(null);
    setPhase("ask");
  }

  function restart() {
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
      {/* progress: dots + counter, as the game shows it */}
      {phase !== "done" && (
        <div className="mb-3 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5" aria-hidden>
            {SWIPE_SAMPLE.map((c, n) => (
              <span
                key={c.id}
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
      )}

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
        ) : (
          <>
            {[2, 1].map((d) => (SWIPE_SAMPLE[i + d] ? <Paper key={`b${d}`} depth={d} /> : null))}

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
                <div className="flex h-full w-full flex-col overflow-y-auto pb-16 pr-1 text-[0.92em]">
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
                  <p className="mt-1.5 text-[15px] leading-tight" style={{ color: DIM }}>
                    {card!.bigLabel}
                  </p>
                  <p
                    className="mt-1 text-[clamp(34px,3.4vw,52px)] font-extrabold leading-none tracking-[-0.035em]"
                    style={{ color: INK }}
                  >
                    {card!.big}
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
              )}
            </Paper>
          </>
        )}
      </div>

      {/* actions sit ON the card, as in the game */}
      {phase !== "done" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-8 [&>*]:pointer-events-auto">
          <button
            type="button"
            onClick={back}
            disabled={i === 0 && phase === "ask"}
            className="justify-self-start font-mono text-[10px] uppercase tracking-[0.16em] text-graphite transition-opacity hover:text-ink disabled:opacity-0"
          >
            ‹ Back
          </button>

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
