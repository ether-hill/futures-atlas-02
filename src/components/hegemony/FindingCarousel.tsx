"use client";

/**
 * A strand's findings, as a rail rather than a wall.
 *
 * Eighteen cards in a grid is a scroll nobody finishes; four at a time is a set
 * you can actually read, with the rest one push away instead of behind a "show
 * more". **Every finding in the strand is loaded** — the rail paces them, it
 * never shows fewer, which on a report about selective evidence would be its
 * own small failure. The count in the header says how many there are, so the
 * pacing cannot be mistaken for the total.
 *
 * Built on PostCarousel's pattern deliberately — scroll container first, widget
 * second. Native scroll-snap does the work, so the cards stay real DOM in real
 * order: a screen reader walks all eighteen, tab moves through them,
 * find-in-page reaches them, and touch gets the platform's own momentum. The
 * arrows and the drag are additions for mouse users, not the only way through.
 *
 * The one thing this rail has that PostCarousel does not: it provides
 * ChartViewport, so each card's numbers count up when you bring it into THIS
 * frame rather than silently while it is still off to the right.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { findingsIn, type Strand } from "@/data/hegemony";
import { ChartViewport } from "./FigureChart";
import { FindingCard } from "./FindingCard";

export function FindingCarousel({ strand, label }: { strand: Strand; label: string }) {
  const findings = findingsIn(strand);
  const track = useRef<HTMLDivElement>(null);
  // The scroller has to be in state, not just a ref: the charts read it through
  // context, and a ref's .current arriving does not re-render them.
  const [viewport, setViewport] = useState<Element | null>(null);
  const [at, setAt] = useState({ start: true, end: false, page: 1, pages: 1 });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // 1px of slack: sub-pixel layout means scrollLeft rarely hits the exact end.
    const max = el.scrollWidth - el.clientWidth;
    setAt({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft >= max - 1,
      // The page you are ON is the one you can see most of — round, not floor.
      page: max <= 1 ? 1 : Math.min(Math.round(el.scrollLeft / el.clientWidth) + 1, Math.ceil(el.scrollWidth / el.clientWidth)),
      pages: Math.max(Math.ceil(el.scrollWidth / el.clientWidth), 1),
    });
  }, []);

  useEffect(() => {
    setViewport(track.current);
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({
      left: dir * el.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  /**
   * Drag to scroll, on top of the native behaviour rather than instead of it.
   * Snap is off for the duration: with snap-mandatory on, every pointer move
   * fights the snap and the rail stutters instead of following the hand.
   */
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = track.current;
    if (!el || e.pointerType === "touch") return; // touch already scrolls natively
    drag.current = { x: e.clientX, left: el.scrollLeft };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = track.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
  };

  return (
    <ChartViewport.Provider value={viewport}>
      <div className="mt-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
            All {findings.length} findings
            <span className="text-ink/30"> · </span>
            {at.page} of {at.pages}
          </p>
          <div className="flex items-center gap-2">
            <Arrow dir="prev" disabled={at.start} onClick={() => page(-1)} />
            <Arrow dir="next" disabled={at.end} onClick={() => page(1)} />
          </div>
        </div>

        {/* tabIndex on the scroller itself: any region that scrolls has to be
            reachable by keyboard, and the arrows are not a substitute. */}
        <div
          ref={track}
          onScroll={measure}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          tabIndex={0}
          role="group"
          aria-label={label}
          style={{
            scrollSnapType: dragging ? "none" : undefined,
            cursor: dragging ? "grabbing" : undefined,
            scrollBehavior: dragging ? "auto" : undefined,
          }}
          // items-stretch is explicit: cards in a rail share one bottom edge
          // however long a claim runs.
          className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden"
        >
          {findings.map((f) => (
            <div
              key={f.id}
              // Four up at desktop, stepping down with the viewport. basis is
              // (100% − the gaps this row carries) ÷ cards, so the last card in
              // a page ends flush with the track.
              className="flex min-w-0 shrink-0 grow-0 basis-full snap-start [&>article]:w-full min-[680px]:basis-[calc(50%-8px)] min-[1024px]:basis-[calc(33.333%-10.67px)] min-[1280px]:basis-[calc(25%-12px)]"
            >
              <FindingCard finding={f} />
            </div>
          ))}
        </div>
      </div>
    </ChartViewport.Provider>
  );
}

function Arrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous findings" : "More findings"}
      className="flex h-10 w-10 items-center justify-center rounded-[2px] border-[1.5px] border-ink/25 text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
    >
      <span aria-hidden className="text-[15px] leading-none">
        {dir === "prev" ? "←" : "→"}
      </span>
    </button>
  );
}
