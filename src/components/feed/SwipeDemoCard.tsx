"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SWIPE_SAMPLE, type SwipeSample } from "@/data/feed-swipe";

/**
 * A playable taster of Swipe the Future, sitting in the feed.
 *
 * Same question the real game asks — has this already happened, or not yet —
 * on five cards taken from its own deck. Drag or use the two buttons; the card
 * flips to the reveal, then the next one comes up. It keeps no score and makes
 * no claim to be the game: the point is to make someone curious enough to open
 * the real one, which is source-checked card by card.
 *
 * Pointer Events rather than mouse/touch pairs, so a trackpad, a finger and a
 * stylus all take the same path, and the buttons keep it usable without a
 * pointer at all.
 */

const THRESHOLD = 70; // px of travel before a drag counts as an answer

export function SwipeDemoCard() {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [revealed, setRevealed] = useState<"already" | "notyet" | null>(null);
  const [right, setRight] = useState(0);
  const startX = useRef<number | null>(null);

  const card: SwipeSample | undefined = SWIPE_SAMPLE[i];
  const done = i >= SWIPE_SAMPLE.length;

  function answer(choice: "already" | "notyet") {
    if (!card || revealed) return;
    setRevealed(choice);
    if (choice === card.verdict) setRight((n) => n + 1);
    setDx(0);
    window.setTimeout(() => {
      setRevealed(null);
      setI((n) => n + 1);
    }, 1500);
  }

  function onDown(e: React.PointerEvent) {
    if (revealed || done) return;
    startX.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
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

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep">
          Try it — Swipe the Future
        </span>
        <span className="font-mono text-[10px] tabular-nums text-faint">
          {Math.min(i + (done ? 0 : 1), SWIPE_SAMPLE.length)}/{SWIPE_SAMPLE.length}
        </span>
      </div>

      <p className="mt-2 font-mono text-[11px] leading-[1.5] text-graphite">
        Has it already happened, or not yet?
      </p>

      <div className="relative mt-4 min-h-[184px] flex-1">
        {done ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Taster complete
            </p>
            <p className="mt-2 text-[28px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-ink">
              {right}/{SWIPE_SAMPLE.length}
            </p>
            <button
              type="button"
              onClick={() => {
                setI(0);
                setRight(0);
              }}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite underline underline-offset-4 hover:text-ink"
            >
              Again
            </button>
          </div>
        ) : (
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="absolute inset-0 flex cursor-grab touch-pan-y select-none flex-col justify-center rounded-[4px] p-4 active:cursor-grabbing"
            style={{
              border: "var(--border-hairline) solid var(--hairline)",
              background: "var(--bg)",
              transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
              transition: startX.current === null ? "transform .28s cubic-bezier(.2,.7,.2,1)" : "none",
            }}
          >
            {revealed ? (
              <div className="text-center">
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: revealed === card.verdict ? "var(--accent)" : "var(--muted)" }}
                >
                  {revealed === card.verdict ? "Correct" : "Not quite"}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {card.bigLabel}
                </p>
                <p className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink">
                  {card.big}
                </p>
              </div>
            ) : (
              <p className="text-[15px] font-extrabold leading-[1.35] tracking-[-0.015em] text-ink text-balance">
                {card.claim}
              </p>
            )}

            {/* which way the drag is going */}
            {!revealed && Math.abs(dx) > 18 && (
              <span
                className="pointer-events-none absolute top-3 font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{
                  color: "var(--accent)",
                  left: dx > 0 ? 14 : "auto",
                  right: dx > 0 ? "auto" : 14,
                }}
              >
                {dx > 0 ? "Already" : "Not yet"}
              </span>
            )}
          </div>
        )}
      </div>

      {!done && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => answer("notyet")}
            disabled={!!revealed}
            className="rounded-[3px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            style={{ borderColor: "var(--hairline)" }}
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={() => answer("already")}
            disabled={!!revealed}
            className="rounded-[3px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            style={{ borderColor: "var(--hairline)" }}
          >
            Already
          </button>
        </div>
      )}

      <Link
        href="/swipe-the-future"
        className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-accent transition-colors hover:text-ink"
      >
        Play the full deck <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
