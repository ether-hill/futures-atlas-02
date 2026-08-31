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
import { POSTS, SLIDE_KINDS, type Post } from "./posts";
import { SlideBody, SlideFrame, SlideStyles, RATIOS, type Ratio } from "./Slide";
import { DESIGN_W } from "./slide-css";

const HANDLE = "futuresatlas";
const BIO = "Speculative design studio. Decks, reports and instruments about futures that already arrived.";
const EMPTY_SLOTS = 3;

const INK = "#17181b";
const INK_2 = "#1d1f23";
const BONE = "#f2ede2";
const MUTED = "#d3ccbe";
const FAINT = "#8b877f";
const OXBLOOD = "#d8694e";
const HAIRLINE = "rgba(242,237,226,.14)";

/** The mock's own chrome is the site's type, not the slide's. */
const UI = "var(--font-archivo), system-ui, sans-serif";
const SERIF = "var(--font-bodoni), Georgia, serif";
const lbl = (size: number, color = FAINT) => ({
  fontFamily: SERIF,
  fontSize: size,
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color,
});

export default function FeedMock() {
  const [ratio, setRatio] = useState<Ratio>("4:5");
  const [open, setOpen] = useState<{ post: number; slide: number } | null>(null);

  const move = useCallback((d: number) => {
    setOpen((o) =>
      o ? { ...o, slide: Math.min(SLIDE_KINDS.length - 1, Math.max(0, o.slide + d)) } : o,
    );
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
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {POSTS.map((p, i) => (
            <Tile key={p.card.id} post={p} ratio={ratio} onOpen={() => setOpen({ post: i, slide: 0 })} />
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
        borderBottom: `1px solid ${HAIRLINE}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <span style={lbl(15, BONE)}>Instagram preview</span>
      <span style={{ fontFamily: SERIF, fontSize: 14, color: FAINT }}>
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
        {/* The site's mark, inverted for the dark ground exactly as
            atlas-nav.css does it in dark mode. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fa.svg" alt="" aria-hidden="true" style={{ height: 46, width: "auto", filter: "invert(1)" }} />
      </div>
      <div style={{ minWidth: 280, flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>@{HANDLE}</div>
        <div style={{ ...lbl(13, FAINT), marginTop: 8 }}>
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
    <div>
      <button
        ref={ref}
        onClick={onOpen}
        title={post.name}
        style={{
          position: "relative",
          padding: 0,
          border: `1px solid ${HAIRLINE}`,
          background: INK_2,
          cursor: "pointer",
          display: "block",
          width: "100%",
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        <SlideFrame width={w} ratio={ratio}>
          <SlideBody card={post.card} kind="card" ratio={ratio} />
        </SlideFrame>
        {/* The stacked-square glyph Instagram puts on a carousel. */}
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            border: `2px solid ${BONE}`,
            borderRadius: 4,
            boxShadow: `-5px 5px 0 -2px ${INK}, -7px 7px 0 -2px ${BONE}`,
            opacity: 0.9,
          }}
        />
      </button>
      <div style={{ ...lbl(10, FAINT), marginTop: 10, lineHeight: 1.5 }}>
        Card {post.card.id} · {SLIDE_KINDS.length} slides
      </div>
    </div>
  );
}

function EmptySlot({ ratio }: { ratio: Ratio }) {
  return (
    <div
      style={{
        aspectRatio: `1 / ${RATIOS[ratio]}`,
        border: `1px dashed rgba(242,237,226,.16)`,
        display: "grid",
        placeItems: "center",
        ...lbl(11, "rgba(242,237,226,.3)"),
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
  const kind = SLIDE_KINDS[index]!;
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
            <SlideBody card={post.card} kind={kind} ratio={ratio} />
          </SlideFrame>
          <Arrow dir={-1} disabled={index === 0} onClick={() => onMove(-1)} />
          <Arrow dir={1} disabled={index === SLIDE_KINDS.length - 1} onClick={() => onMove(1)} />
        </div>

        <div style={{ display: "flex", gap: 7, justifyContent: "center", padding: "16px 0" }}>
          {SLIDE_KINDS.map((_, i) => (
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
          {index + 1} / {SLIDE_KINDS.length} · {kind}
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
        <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.6, color: MUTED, margin: "16px 0 0", whiteSpace: "pre-line" }}>
          {post.caption}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: OXBLOOD, margin: "16px 0 0", wordSpacing: "0.2em" }}>
          {post.hashtags.join(" ")}
        </p>

        <div style={{ borderTop: `1px solid ${HAIRLINE}`, margin: "22px 0 0", paddingTop: 18 }}>
          <span style={lbl(12, FAINT)}>Slides</span>
          <ol style={{ margin: "12px 0 0", padding: 0, listStyle: "none", fontSize: 13, color: MUTED, lineHeight: 1.9 }}>
            {SLIDE_KINDS.map((k, i) => (
              <li key={k} style={{ display: "flex", gap: 10, opacity: i === index ? 1 : 0.55 }}>
                <span style={{ color: FAINT, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{k === "card" ? "front of the card" : k === "reveal" ? "the reveal" : "the stats"}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ borderTop: `1px solid ${HAIRLINE}`, margin: "20px 0 0", paddingTop: 16 }}>
          <span style={lbl(12, FAINT)}>Source card</span>
          <p style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.6, color: FAINT, margin: "10px 0 0" }}>
            <b style={{ color: MUTED, fontWeight: 400 }}>{post.card.id}</b> in
            swipe-the-future/data/sectors.ts · {post.card.sector} · checked {post.card.checked}.
            {post.card.crowd.sample
              ? " The tally on slides 2 and 3 is the stats page's own sample, not a real one: the v2 deck has no live answers yet."
              : null}
          </p>
        </div>
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
