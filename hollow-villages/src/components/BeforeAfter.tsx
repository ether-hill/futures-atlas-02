"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  alt: string;
  /** Marks the "after" as a placeholder the owner will replace. */
  afterIsPlaceholder?: boolean;
  /** Small annotation naming the change realised in 2050. */
  callout?: string;
  /** Aspect-ratio utility for the frame (default 4:3). */
  aspectClass?: string;
}

/**
 * Signature element: a draggable reveal holding NOW and 2050 in one frame —
 * the forecasting spine made literal. Same viewpoint, different occupation.
 * Pointer + keyboard accessible.
 */
export function BeforeAfter({
  beforeImage,
  afterImage,
  alt,
  afterIsPlaceholder = false,
  callout,
  aspectClass = "aspect-[4/3]",
}: BeforeAfterProps) {
  const [pos, setPos] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
    if (e.key === "Home") setPos(0);
    if (e.key === "End") setPos(100);
  };

  return (
    <figure
      ref={frameRef}
      className={`group relative ${aspectClass} w-full select-none overflow-hidden rounded-sm border border-ink/15 bg-bone`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* 2050 — the forecast, full frame underneath */}
      <Image
        src={afterImage}
        alt={`${alt} — forecast, 2050`}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      <span className="year pointer-events-none absolute right-3 top-3 rounded-sm bg-amber px-2.5 py-1 text-[0.72rem] font-medium text-paper">
        2050{afterIsPlaceholder && " · placeholder"}
      </span>
      {callout && (
        <span className="pointer-events-none absolute bottom-3 right-3 max-w-[60%] rounded-sm bg-paper/90 px-2.5 py-1 text-right text-[0.7rem] leading-tight text-ink shadow-sm">
          {callout}
        </span>
      )}

      {/* TODAY — clipped to the slider position */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={`${alt} — today`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <span className="year pointer-events-none absolute left-3 top-3 rounded-sm bg-ink/85 px-2.5 py-1 text-[0.72rem] font-medium text-paper">
          TODAY
        </span>
      </div>

      {/* handle — a surveying line + grip */}
      <div
        className="absolute inset-y-0 z-10 flex w-0 items-center justify-center"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute inset-y-0 w-px bg-paper/90" />
        <button
          type="button"
          role="slider"
          tabIndex={0}
          aria-label="Reveal today versus the 2050 forecast"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% revealing the 2050 forecast`}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className="relative flex h-10 w-10 cursor-ew-resize items-center justify-center rounded-full border border-ink/15 bg-paper text-ink shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7 6l-3 4 3 4M13 6l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </figure>
  );
}
