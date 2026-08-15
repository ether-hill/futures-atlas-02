"use client";

/**
 * The report's one rail. Findings, videos and press coverage all use it.
 *
 * A grid of eighteen cards is a scroll nobody finishes; a page of four is a
 * set you can read, with the rest one push away instead of behind a "show
 * more". **Nothing is ever held back** — the header states the full count, so
 * pacing can never be mistaken for selection, which on a report about
 * selective evidence would be its own small failure.
 *
 * Scroll container first, widget second, following PostCarousel: native
 * scroll-snap does the work, so the cards stay real DOM in real order — a
 * screen reader walks all of them, tab moves through them, find-in-page
 * reaches them, and touch gets the platform's own momentum. Arrows and drag
 * are additions for mouse users, never the only way through.
 *
 * It also provides ChartViewport, so a card's numbers count up when you bring
 * it into THIS frame rather than silently while it is still off to the right.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChartViewport } from "./FigureChart";

/**
 * How many cards a page holds at each width. Tailwind needs the class strings
 * whole, so these are literals rather than anything computed: basis is
 * (100% − the gaps the row carries) ÷ cards, which lands the last card in a
 * page flush with the track's edge.
 */
const WIDTHS = {
  // findings — dense, four up
  four:
    "basis-full min-[680px]:basis-[calc(50%-8px)] min-[1024px]:basis-[calc(33.333%-10.67px)] min-[1280px]:basis-[calc(25%-12px)]",
  // video and press — a picture each, so they want the room
  three: "basis-[86%] min-[680px]:basis-[calc(50%-8px)] min-[1100px]:basis-[calc(33.333%-10.67px)]",
} as const;

const TONE = {
  light: {
    meta: "text-ink/50",
    dot: "text-ink/30",
    button: "border-ink/25 text-ink hover:border-ink",
  },
  dark: {
    meta: "text-paper/55",
    dot: "text-paper/30",
    button: "border-paper/30 text-paper hover:border-paper",
  },
} as const;

export function CardRail({
  label,
  count,
  noun,
  tone = "light",
  children,
}: {
  /** Names the scrollable region for a screen reader. */
  label: string;
  /** The FULL number of cards in the rail. Stated, never implied. */
  count: number;
  /** What is being counted — "findings", "broadcasts", "articles". */
  noun: string;
  tone?: keyof typeof TONE;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  // The scroller has to be in state, not just a ref: the charts read it through
  // context, and a ref's .current arriving does not re-render them.
  const [viewport, setViewport] = useState<Element | null>(null);
  const [at, setAt] = useState({ start: true, end: false, page: 1, pages: 1 });
  const t = TONE[tone];

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // 1px of slack: sub-pixel layout means scrollLeft rarely hits the exact end.
    const max = el.scrollWidth - el.clientWidth;
    const pages = Math.max(Math.ceil(el.scrollWidth / el.clientWidth), 1);
    setAt({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft >= max - 1,
      // The page you are ON is the one you can see most of — round, not floor.
      page: max <= 1 ? 1 : Math.min(Math.round(el.scrollLeft / el.clientWidth) + 1, pages),
      pages,
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
          <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${t.meta}`}>
            All {count} {noun}
            <span className={t.dot}> · </span>
            {at.page} of {at.pages}
          </p>
          <div className="flex items-center gap-2">
            <Arrow tone={t.button} dir="prev" disabled={at.start} onClick={() => page(-1)} noun={noun} />
            <Arrow tone={t.button} dir="next" disabled={at.end} onClick={() => page(1)} noun={noun} />
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
          // however long a title runs.
          className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </ChartViewport.Provider>
  );
}

/**
 * One slot in the rail. Separate from CardRail so a caller can keep using its
 * own card component unchanged — the slot owns the width, the card owns itself.
 */
export function RailItem({
  width = "four",
  children,
}: {
  width?: keyof typeof WIDTHS;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 shrink-0 grow-0 snap-start [&>*]:w-full ${WIDTHS[width]}`}
    >
      {children}
    </div>
  );
}

function Arrow({
  dir,
  disabled,
  onClick,
  tone,
  noun,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  tone: string;
  noun: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? `Previous ${noun}` : `More ${noun}`}
      className={`flex h-10 w-10 items-center justify-center rounded-[2px] border-[1.5px] transition-colors disabled:pointer-events-none disabled:opacity-30 ${tone}`}
    >
      <span aria-hidden className="text-[15px] leading-none">
        {dir === "prev" ? "←" : "→"}
      </span>
    </button>
  );
}
