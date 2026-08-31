"use client";

/**
 * The Instagram preview: a grid you can click into, and a carousel you can
 * swipe. Design exploration for the Atlas's social feed — not a scheduler and
 * not an exporter (the composer at /social-composer does the exporting).
 *
 * Two honesty rules hold this page together:
 *  · The grid shows the posts that exist and EMPTY SLOTS for the rest. A feed
 *    mock padded with invented posts tells you the feed is fuller than it is.
 *  · There are no follower, like or view counts anywhere. Those numbers don't
 *    exist for this account and inventing them would be inventing data — the
 *    same rule /feed already runs on.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { POSTS, type Post } from "./posts";
import {
  SlideBody, SlideFrame, RATIOS, type Ratio,
  INK, INK_2, BONE, MUTED, FAINT, CARD_LINE, OXBLOOD, label, DISPLAY, SERIF,
} from "./Slide";

const HANDLE = "futuresatlas";
const BIO = "Speculative design studio. Decks, reports and instruments about futures that already arrived.";
const EMPTY_SLOTS = 3;

export default function FeedMock() {
  const [ratio, setRatio] = useState<Ratio>("4:5");
  const [open, setOpen] = useState<{ post: number; slide: number } | null>(null);

  const move = useCallback(
    (d: number) => {
      setOpen((o) => {
        if (!o) return o;
        const post = POSTS[o.post]!;
        return { ...o, slide: Math.min(post.slides.length - 1, Math.max(0, o.slide + d)) };
      });
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, move]);

  return (
    <div style={{ minHeight: "100vh", background: INK, color: BONE, fontFamily: DISPLAY }}>
      <Chrome ratio={ratio} setRatio={setRatio} />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 120px" }}>
        <Profile />

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {POSTS.map((p, i) => (
            <Tile key={p.id} post={p} ratio={ratio} onOpen={() => setOpen({ post: i, slide: 0 })} />
          ))}
          {Array.from({ length: EMPTY_SLOTS }, (_, i) => (
            <EmptySlot key={i} ratio={ratio} />
          ))}
        </div>
      </div>

      {open ? (
        <Viewer
          post={POSTS[open.post]!}
          index={open.slide}
          ratio={ratio}
          onMove={move}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function Chrome({ ratio, setRatio }: { ratio: Ratio; setRatio: (r: Ratio) => void }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(23,24,27,.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid rgba(242,237,226,.13)`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <span style={label(15, BONE)}>Instagram preview</span>
      <span style={{ fontFamily: SERIF, fontSize: 14, color: FAINT }}>
        Layout exploration · not an account, not a scheduler
      </span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {(Object.keys(RATIOS) as Ratio[]).map((r) => (
          <button
            key={r}
            onClick={() => setRatio(r)}
            style={{
              ...label(13, r === ratio ? INK : MUTED),
              background: r === ratio ? BONE : "transparent",
              border: `1px solid ${r === ratio ? BONE : "rgba(242,237,226,.22)"}`,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </header>
  );
}

function Profile() {
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div
        style={{
          width: 116,
          height: 116,
          borderRadius: "50%",
          border: `1px solid rgba(242,237,226,.22)`,
          background: INK_2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg viewBox="6 10 88 56" width={58} fill="none" stroke={BONE} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
          <path d="M12 60 L16.4 39.3 L31 21.9 L50 16 L69 21.9 L83.6 39.3 L88 60 Z" />
          <path d="M41.6 56.8 L21.5 49.2" /><path d="M43.6 53.7 L27 37.5" />
          <path d="M46.3 51.8 L35.9 29.1" /><path d="M50 51 L50 25" />
          <path d="M53.7 51.8 L64.1 29.1" /><path d="M56.4 53.7 L73 37.5" />
          <path d="M58.4 56.8 L78.5 49.2" /><path d="M41 60 A9 9 0 0 1 59 60" />
        </svg>
      </div>
      <div style={{ minWidth: 280, flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>@{HANDLE}</div>
        <div style={{ ...label(13, FAINT), marginTop: 8 }}>
          {POSTS.length} posts · Followers not shown
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.5, color: MUTED, margin: "14px 0 0", maxWidth: 560 }}>
          {BIO}
        </p>
        <p style={{ fontFamily: SERIF, fontSize: 14, lineHeight: 1.5, color: FAINT, margin: "10px 0 0", maxWidth: 560 }}>
          No like, view or follower counts anywhere on this page. They don&apos;t exist for this
          account yet, and a mock that shows them is a mock of a different account.
        </p>
      </div>
    </div>
  );
}

function Tile({ post, ratio, onOpen }: { post: Post; ratio: Ratio; onOpen: () => void }) {
  const [w, setW] = useState(340);
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <button
        ref={ref}
        onClick={onOpen}
        title={post.name}
        style={{
          position: "relative",
          padding: 0,
          // Dark slides on a dark ground need a hairline or the grid dissolves —
          // and where the tiles stop is half of what a feed mock is FOR.
          border: `1px solid rgba(242,237,226,.18)`,
          background: INK_2,
          cursor: "pointer",
          display: "block",
          width: "100%",
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        <SlideFrame width={w} ratio={ratio}>
          <SlideBody slide={post.slides[0]!} ratio={ratio} />
        </SlideFrame>
        {/* The stacked-square glyph Instagram puts on a carousel. Nothing else
            is overlaid: the cover already uses all four corners, and a chip on
            top of the kicker is a chip on top of the design being reviewed. */}
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            border: `2px solid ${BONE}`,
            borderRadius: 4,
            boxShadow: `-5px 5px 0 -2px ${INK}, -7px 7px 0 -2px ${BONE}`,
            opacity: 0.9,
          }}
        />
      </button>
      {/* The mock's own caption, outside the slide, so it can name the post
          without drawing on it. */}
      <div style={{ ...label(10, FAINT), marginTop: 10, lineHeight: 1.5 }}>
        {post.name} · {post.slides.length} slides
      </div>
    </div>
  );
}

function EmptySlot({ ratio }: { ratio: Ratio }) {
  return (
    <div
      style={{
        aspectRatio: `1080 / ${RATIOS[ratio]}`,
        border: `1px dashed rgba(242,237,226,.16)`,
        display: "grid",
        placeItems: "center",
        ...label(11, "rgba(242,237,226,.3)"),
      }}
    >
      Empty slot
    </div>
  );
}

function Viewer({
  post, index, ratio, onMove, onClose,
}: {
  post: Post;
  index: number;
  ratio: Ratio;
  onMove: (d: number) => void;
  onClose: () => void;
}) {
  const slide = post.slides[index]!;
  const drag = useRef<number | null>(null);
  // 4:5 is the tallest usable feed crop, so the frame is sized off the height
  // available rather than a fixed width: the whole slide has to be on screen or
  // the preview is lying about what fits.
  const [w, setW] = useState(400);
  useEffect(() => {
    const fit = () => {
      const maxH = window.innerHeight - 190;
      const byH = (maxH * 1080) / RATIOS[ratio];
      setW(Math.max(260, Math.min(440, byH, window.innerWidth - 48)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ratio]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(8,9,11,.92)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 40,
        padding: "56px 24px",
        overflowY: "auto",
        flexWrap: "wrap",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
        <div
          onPointerDown={(e) => { drag.current = e.clientX; }}
          onPointerUp={(e) => {
            if (drag.current === null) return;
            const dx = e.clientX - drag.current;
            drag.current = null;
            if (Math.abs(dx) > 40) onMove(dx < 0 ? 1 : -1);
          }}
          style={{ position: "relative", background: INK_2, touchAction: "pan-y", cursor: "grab" }}
        >
          <SlideFrame width={w} ratio={ratio}>
            <SlideBody slide={slide} ratio={ratio} />
          </SlideFrame>
          <Arrow dir={-1} disabled={index === 0} onClick={() => onMove(-1)} />
          <Arrow dir={1} disabled={index === post.slides.length - 1} onClick={() => onMove(1)} />
        </div>

        <div style={{ display: "flex", gap: 7, justifyContent: "center", padding: "16px 0" }}>
          {post.slides.map((_, i) => (
            <span
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: i === index ? BONE : "rgba(242,237,226,.28)",
              }}
            />
          ))}
        </div>
        <div style={{ ...label(12, FAINT), textAlign: "center" }}>
          {index + 1} / {post.slides.length} · {slide.kind}
        </div>
      </div>

      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: "100%",
          background: INK_2,
          border: `1px solid rgba(242,237,226,.13)`,
          padding: 26,
          color: BONE,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={label(12, FAINT)}>Caption</span>
          <button
            onClick={onClose}
            style={{ ...label(12, MUTED), background: "none", border: 0, cursor: "pointer" }}
          >
            Close ✕
          </button>
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.6, color: MUTED, margin: "16px 0 0", whiteSpace: "pre-line" }}>
          {post.caption}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: OXBLOOD, margin: "16px 0 0", wordSpacing: "0.2em" }}>
          {post.hashtags.join(" ")}
        </p>

        <div style={{ borderTop: `1px solid rgba(242,237,226,.13)`, margin: "22px 0 0", paddingTop: 18 }}>
          <span style={label(12, FAINT)}>Slides</span>
          <ol style={{ margin: "12px 0 0", padding: 0, listStyle: "none", fontSize: 13, color: MUTED, lineHeight: 1.9 }}>
            {post.slides.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 10, opacity: i === index ? 1 : 0.55 }}>
                <span style={{ color: FAINT, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  {s.kind === "claim" || s.kind === "reveal"
                    ? `${s.kind} · card ${s.cardId}`
                    : s.kind}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {post.slides.some((s) => s.kind === "stats" && s.sample) ? (
          <p style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.6, color: FAINT, marginTop: 20, borderTop: `1px solid ${CARD_LINE}33`, paddingTop: 14 }}>
            The results slide carries the stats page&apos;s own sample tally, not a real one: the v2
            deck has no live answers yet. Swap the numbers before this post goes out.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function Arrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  if (disabled) return null;
  return (
    <button
      onClick={onClick}
      aria-label={dir === 1 ? "Next slide" : "Previous slide"}
      style={{
        position: "absolute",
        top: "50%",
        [dir === 1 ? "right" : "left"]: -18,
        transform: "translateY(-50%)",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `1px solid rgba(242,237,226,.3)`,
        background: "rgba(23,24,27,.9)",
        color: BONE,
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {dir === 1 ? "›" : "‹"}
    </button>
  );
}
