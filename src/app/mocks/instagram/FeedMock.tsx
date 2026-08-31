"use client";

/**
 * The Instagram preview: the grid of the actual posts, and a carousel you can
 * swipe. Design exploration for the Atlas's social feed — not a scheduler and
 * not an exporter (the composer at /social-composer does the exporting).
 *
 * Three rules hold this page together:
 *  · Every slide is the Swipe the Future card in the game's own markup and CSS
 *    (see Slide.tsx / slide-css.ts). Nothing here is a second design.
 *  · The grid shows the posts that exist and EMPTY SLOTS for the rest. A feed
 *    mock padded with invented posts tells you the feed is fuller than it is.
 *  · No follower, like or view counts anywhere. Those numbers don't exist for
 *    this account and inventing them would be inventing data — the same rule
 *    /feed already runs on.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { POSTS, SLIDE_KINDS, slideCount, type Post } from "./posts";
import { PostSlide, SlideFrame, SlideStyles, RATIOS, type Ratio } from "./Slide";
import { DESIGN_W } from "./slide-css";

const HANDLE = "futuresatlas";
const BIO = "Speculative design studio. Decks, reports and instruments about futures that already arrived.";

const INK = "#17181b";
const INK_2 = "#1d1f23";
const BONE = "#f2ede2";
const MUTED = "#d3ccbe";
const FAINT = "#8b877f";
const OXBLOOD = "#d8694e";
const PAPER = "#f4efe4";
const HAIRLINE = "rgba(242,237,226,.14)";

/**
 * The mock's chrome is set in the site's display sans, and there is no serif
 * anywhere on this page: the slides themselves are system sans (the game's own
 * face), and a Bodoni caption around them read as a different product.
 */
const UI = "var(--font-archivo), system-ui, sans-serif";
const lbl = (size: number, color = FAINT) => ({
  fontFamily: UI,
  fontSize: size,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color,
});

export default function FeedMock() {
  const [ratio, setRatio] = useState<Ratio>("4:5");
  const [open, setOpen] = useState<{ post: number; slide: number } | null>(null);

  const move = useCallback((d: number) => {
    setOpen((o) => {
      if (!o) return o;
      const last = slideCount(POSTS[o.post]!) - 1;
      return { ...o, slide: Math.min(last, Math.max(0, o.slide + d)) };
    });
  }, []);

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
    <div style={{ minHeight: "100vh", background: INK, color: BONE, fontFamily: UI }}>
      <SlideStyles />
      <Chrome ratio={ratio} setRatio={setRatio} />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 120px" }}>
        <Profile />
        {/* An Instagram grid: three up, 2px gutters, nothing drawn between the
            tiles. Three posts is one row, which is what a grid with three posts
            looks like — no dashed placeholders standing in for posts that do
            not exist. */}
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {POSTS.map((p, i) => (
            <Tile key={p.name} post={p} ratio={ratio} onOpen={() => setOpen({ post: i, slide: 0 })} />
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
        borderBottom: `1px solid ${HAIRLINE}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <span style={lbl(15, BONE)}>Instagram preview</span>
      <span style={{ fontFamily: UI, fontSize: 14, color: FAINT }}>
        Every slide is the live Swipe the Future card, in its own markup
      </span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {(Object.keys(RATIOS) as Ratio[]).map((r) => (
          <button
            key={r}
            onClick={() => setRatio(r)}
            style={{
              ...lbl(13, r === ratio ? INK : MUTED),
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
    <div>
      {/*
        The mark at full width, as the header of the page rather than a 116px
        avatar in a circle. Instagram's own avatar is tiny and this is not
        Instagram: it is a page for looking at what the account would look like,
        and the studio's mark is the thing that says whose account it is now
        that no slide carries it.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fa.svg"
        alt="Futures Atlas"
        style={{ display: "block", width: "100%", height: "auto", filter: "invert(1)", opacity: 0.96 }}
      />
      <div
        style={{
          marginTop: 26,
          display: "flex",
          gap: 28,
          alignItems: "baseline",
          flexWrap: "wrap",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 22,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>@{HANDLE}</div>
        <div style={lbl(13, FAINT)}>{POSTS.length} posts · Followers not shown</div>
      </div>
      <p style={{ fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: MUTED, margin: "14px 0 0", maxWidth: 620 }}>
        {BIO}
      </p>
      <p style={{ fontFamily: UI, fontSize: 14, lineHeight: 1.5, color: FAINT, margin: "10px 0 0", maxWidth: 620 }}>
        No like, view or follower counts anywhere on this page. They don&apos;t exist for this
        account yet, and a mock that shows them is a mock of a different account.
      </p>
    </div>
  );
}

/** Measures its own width so the slide scales to the column, whatever it is. */
function useWidth<T extends HTMLElement>(fallback = DESIGN_W) {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Tile({ post, ratio, onOpen }: { post: Post; ratio: Ratio; onOpen: () => void }) {
  const [ref, w] = useWidth<HTMLButtonElement>(340);
  return (
    <button
      ref={ref}
      onClick={onOpen}
      aria-label={`Open ${post.name}`}
      style={{
        position: "relative",
        padding: 0,
        border: 0,
        background: INK_2,
        cursor: "pointer",
        display: "block",
        width: "100%",
        overflow: "hidden",
        lineHeight: 0,
      }}
    >
      <SlideFrame width={w} ratio={ratio}>
        <PostSlide post={post} index={0} ratio={ratio} />
      </SlideFrame>
      {/* The stacked-square glyph Instagram puts on a carousel — only on posts
          that are one. Drawn in ink because the deck tile under it is bone
          paper; the field tiles carry no glyph, so nothing sits on the shader. */}
      {slideCount(post) > 1 ? (
      <span
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 16,
          height: 16,
          border: `2px solid ${INK}`,
          borderRadius: 4,
          boxShadow: `-4px 4px 0 -2px ${PAPER}, -6px 6px 0 -2px ${INK}`,
          opacity: 0.55,
        }}
      />
      ) : null}
    </button>
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
  const n = slideCount(post);
  const drag = useRef<number | null>(null);
  // Sized off the height available, not a fixed width: at 9:16 a fixed-width
  // frame runs off the bottom, and a preview that crops the slide is not one.
  const [w, setW] = useState(400);
  useEffect(() => {
    const fit = () => {
      const byH = ((window.innerHeight - 190) * 1) / RATIOS[ratio];
      setW(Math.max(240, Math.min(430, byH, window.innerWidth - 48)));
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
        background: "rgba(8,9,11,.93)",
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
            <PostSlide post={post} index={index} ratio={ratio} live />
          </SlideFrame>
          <Arrow dir={-1} disabled={index === 0} onClick={() => onMove(-1)} />
          <Arrow dir={1} disabled={index === n - 1} onClick={() => onMove(1)} />
        </div>

        <div style={{ display: "flex", gap: 7, justifyContent: "center", padding: "16px 0", minHeight: 7 }}>
          {(n > 1 ? SLIDE_KINDS : []).map((_, i) => (
            <span
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: i === index ? BONE : "rgba(242,237,226,.28)",
              }}
            />
          ))}
        </div>
        <div style={{ ...lbl(12, FAINT), textAlign: "center" }}>
          {n > 1 ? `${index + 1} / ${n} · ${SLIDE_KINDS[index]}` : "Single image"}
        </div>
      </div>

      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: "100%",
          background: INK_2,
          border: `1px solid ${HAIRLINE}`,
          padding: 26,
          color: BONE,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={lbl(12, FAINT)}>Caption</span>
          <button onClick={onClose} style={{ ...lbl(12, MUTED), background: "none", border: 0, cursor: "pointer" }}>
            Close ✕
          </button>
        </div>
        <p style={{ fontFamily: UI, fontSize: 16, lineHeight: 1.6, color: MUTED, margin: "16px 0 0", whiteSpace: "pre-line" }}>
          {post.caption}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: OXBLOOD, margin: "16px 0 0", wordSpacing: "0.2em" }}>
          {post.hashtags.join(" ")}
        </p>

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
