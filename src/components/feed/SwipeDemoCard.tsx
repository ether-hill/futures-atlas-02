"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SWIPE_SAMPLE, type SwipeSample } from "@/data/feed-swipe";

/**
 * A playable taster of Swipe the Future, built to look like the game rather
 * than like a feed card about the game: the same stacked deck, the same round
 * ✕ / ✓ with their labels, the same drag-with-rotate and the corner stamps
 * that fade in as you commit, the same fling off the edge.
 *
 * Deliberately chrome-free — no heading, no instructions. The cards are the
 * interface, and anyone who has seen the real thing recognises it immediately.
 * The claims are five taken from its own deck (see data/feed-swipe.ts).
 *
 * Pointer Events throughout, so trackpad, finger and stylus take one path, and
 * the buttons keep it playable with no pointer at all.
 */

const THRESHOLD = 72; // px of travel before a release counts as an answer
const CARD_BG = "#f4f1ea"; // the game's paper, not the feed's panel
const INK = "#19140e";
const GOOD = "#1d7a4c";
const BAD = "#b8452c";

export function SwipeDemoCard() {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [fling, setFling] = useState(0); // -1 | 0 | 1
  const [revealed, setRevealed] = useState<"already" | "notyet" | null>(null);
  const [right, setRight] = useState(0);
  const startX = useRef<number | null>(null);

  const card: SwipeSample | undefined = SWIPE_SAMPLE[i];
  const done = i >= SWIPE_SAMPLE.length;

  function answer(choice: "already" | "notyet") {
    if (!card || revealed) return;
    setFling(choice === "already" ? 1 : -1);
    setDx(0);
    if (choice === card.verdict) setRight((n) => n + 1);
    window.setTimeout(() => setRevealed(choice), 260);
    window.setTimeout(() => {
      setRevealed(null);
      setFling(0);
      setI((n) => n + 1);
    }, 1700);
  }

  function onDown(e: React.PointerEvent) {
    if (revealed || done || fling) return;
    startX.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  }
  function onUp() {
    if (startX.current === null) return;
    const d = dx;
    startX.current = null;
    if (d > THRESHOLD) answer("already");
    else if (d < -THRESHOLD) answer("notyet");
    else setDx(0);
  }

  const dragging = startX.current !== null;
  const commit = Math.min(1, Math.abs(dx) / THRESHOLD);

  return (
    <div className="relative flex h-full min-h-[430px] flex-col p-5">
      {/* ---------- the deck ---------- */}
      <div className="relative flex-1">
        {done ? (
          <Face>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#8a8175" }}>
              Taster complete
            </p>
            <p
              className="mt-2 text-[40px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
              style={{ color: INK }}
            >
              {right}/{SWIPE_SAMPLE.length}
            </p>
            <button
              type="button"
              onClick={() => {
                setI(0);
                setRight(0);
              }}
              className="mt-5 rounded-full border-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ borderColor: "rgba(25,20,14,.25)", color: INK }}
            >
              Again
            </button>
          </Face>
        ) : (
          <>
            {/* two backs, so it reads as a deck */}
            {[2, 1].map((d) =>
              SWIPE_SAMPLE[i + d] ? (
                <Face key={`b${d}`} depth={d} />
              ) : null,
            )}

            <Face
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              style={{
                transform: fling
                  ? `translateX(${fling * 130}%) rotate(${fling * 18}deg)`
                  : `translateX(${dx}px) rotate(${dx / 22}deg)`,
                opacity: fling ? 0 : 1,
                transition: dragging ? "none" : "transform .32s cubic-bezier(.2,.7,.2,1), opacity .32s",
                cursor: "grab",
                touchAction: "pan-y",
              }}
            >
              {revealed ? (
                <>
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: revealed === card.verdict ? GOOD : BAD }}
                  >
                    {revealed === card.verdict ? "Correct" : "Not quite"}
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "#8a8175" }}>
                    {card.bigLabel}
                  </p>
                  <p
                    className="mt-1 text-[38px] font-extrabold leading-none tracking-[-0.03em]"
                    style={{ color: INK }}
                  >
                    {card.big}
                  </p>
                </>
              ) : (
                <>
                  <h3
                    className="px-2 text-center text-[clamp(17px,1.5vw,22px)] font-semibold leading-[1.34] tracking-[-0.02em] text-balance"
                    style={{ color: INK }}
                  >
                    {card.claim}
                  </h3>

                  {/* corner stamps, fading in with the drag */}
                  <Stamp side="left" show={dx < -8 ? commit : 0} />
                  <Stamp side="right" show={dx > 8 ? commit : 0} />

                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
                    style={{ color: "rgba(25,20,14,.25)" }}
                  >
                    ←
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px]"
                    style={{ color: "rgba(25,20,14,.25)" }}
                  >
                    →
                  </span>
                </>
              )}
            </Face>
          </>
        )}
      </div>

      {/* ---------- the two round actions ---------- */}
      {!done && (
        <div className="mt-4 flex items-start justify-center gap-10">
          <Action
            label="Not yet"
            glyph="✕"
            colour={BAD}
            disabled={!!revealed || !!fling}
            onClick={() => answer("notyet")}
          />
          <Action
            label="Already real"
            glyph="✓"
            colour={GOOD}
            disabled={!!revealed || !!fling}
            onClick={() => answer("already")}
          />
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

function Face({
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
      className="absolute inset-0 flex select-none flex-col items-center justify-center rounded-[10px] px-5"
      style={{
        background: CARD_BG,
        border: "1px solid rgba(25,20,14,.14)",
        boxShadow: depth ? "0 6px 18px -12px rgba(0,0,0,.5)" : "0 18px 44px -22px rgba(0,0,0,.7)",
        // the backs peek out below, exactly as the game stacks them
        transform: depth ? `translateY(${depth * 9}px) scale(${1 - depth * 0.035})` : undefined,
        zIndex: depth ? 10 - depth : 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stamp({ side, show }: { side: "left" | "right"; show: number }) {
  const yes = side === "right";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-5 grid h-12 w-12 place-items-center rounded-[8px] border-[3px] text-[24px] font-bold"
      style={{
        [side]: 18,
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

function Action({
  label,
  glyph,
  colour,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  colour: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <span className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="grid h-[52px] w-[52px] place-items-center rounded-full border-2 text-[22px] leading-none transition-transform disabled:opacity-40"
        style={{
          color: colour,
          borderColor: `color-mix(in srgb, ${colour} 55%, rgba(25,20,14,.2))`,
          background: "rgba(255,255,255,.06)",
        }}
      >
        {glyph}
      </button>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-graphite">{label}</span>
    </span>
  );
}
