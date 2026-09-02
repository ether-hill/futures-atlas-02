"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "./Container";
import { PostCard } from "./PostCard";
import type { Post } from "@/data/posts";

/**
 * A horizontal rail of post cards. Used on the homepage and at the foot of a
 * post ("More posts").
 *
 * It is a scroll container first and a widget second: native scroll-snap does
 * the work, so touch and trackpad swipe behave exactly as the platform expects
 * and it degrades to a plain scrollable row without JS. The arrows are an
 * addition for mouse users, and they hide themselves when there is nothing to
 * scroll to.
 */
export function PostCarousel({
  posts,
  title,
  eyebrow,
  href = "/feed",
  hrefLabel = "All posts",
  showVisibility = false,
}: {
  posts: Post[];
  title: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
  showVisibility?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // 1px of slack: sub-pixel layout means scrollLeft rarely hits the exact end.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
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
    // scroll by a viewport-width of cards, less one card so context carries over
    const step = Math.max(el.clientWidth - 320, 280);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  /**
   * Drag to scroll, on top of the native behaviour rather than instead of it.
   * Snap is disabled for the duration of a drag — with snap-mandatory on, every
   * pointer move fights the snap and the rail stutters instead of following the
   * hand. It comes back on release, so the row still settles onto a card.
   */
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  if (posts.length === 0) return null;
  const scrollable = !atStart || !atEnd;

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
    <section className="border-t border-ink/15 bg-surface py-[clamp(58px,9vw,130px)]">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}
            <h2 className="max-w-[22ch] text-[clamp(28px,4.2vw,60px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {scrollable && (
              <div className="hidden items-center gap-2 min-[900px]:flex">
                <ArrowButton dir="prev" disabled={atStart} onClick={() => page(-1)} />
                <ArrowButton dir="next" disabled={atEnd} onClick={() => page(1)} />
              </div>
            )}
            <Link
              href={href}
              className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
            >
              {hrefLabel} <span className="text-[14px]">→</span>
            </Link>
          </div>
        </div>
      </Container>

      {/* The track breaks out of the Container so cards can run to the screen
          edge, but its first card still lines up with the Container gutter. */}
      <div
        ref={track}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        style={{
          scrollSnapType: dragging ? "none" : undefined,
          cursor: scrollable ? (dragging ? "grabbing" : "grab") : undefined,
          scrollBehavior: dragging ? "auto" : undefined,
        }}
        // items-stretch is explicit: cards in a rail must share one bottom edge
        // however long a title runs.
        // scroll-px must mirror px, or snapping scrolls the gutter away and the
        // first card sits flush to the screen edge instead of on the margin.
        className="mt-[clamp(28px,4vw,52px)] flex snap-x snap-mandatory items-stretch gap-[clamp(16px,1.6vw,28px)] overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4 [scrollbar-width:none] min-[680px]:scroll-px-7 min-[680px]:px-7 [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((p, i) => (
          <PostCard key={p.slug} post={p} index={i} showVisibility={showVisibility} fixedWidth />
        ))}
      </div>
    </section>
  );
}

function ArrowButton({
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
      aria-label={dir === "prev" ? "Previous posts" : "More posts"}
      className="flex h-11 w-11 items-center justify-center rounded-[2px] border-[1.5px] border-ink/25 text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
    >
      <span aria-hidden className="text-[15px] leading-none">
        {dir === "prev" ? "←" : "→"}
      </span>
    </button>
  );
}
