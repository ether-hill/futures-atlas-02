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
import { POSTS, SLIDE_KINDS, slideCount, postId, type Post } from "./posts";
import { useFeedEdits, applyEdits, DEFAULT_CROP, type Crop, type SyncState } from "./useFeedEdits";
import { useSortableGrid } from "./useSortableGrid";
import { PostSlide, SlideFrame, SlideStyles, RATIOS, type Ratio } from "./Slide";
import { DESIGN_W } from "./slide-css";

const HANDLE = "futuresatlas";
const BIO = "Speculative design studio. Decks, reports and instruments about futures that already arrived.";

/* Darker than every slide ground, deliberately: the term field and the swipe
   cards are near-black themselves, and on an equally dark page they had no
   edge. The page is now the darkest thing on it. */
const PAGE = "#08090b";
const INK = "#17181b";
const INK_2 = "#1d1f23";
const BONE = "#f2ede2";
const MUTED = "#d3ccbe";
const FAINT = "#8b877f";
const OXBLOOD = "#d8694e";
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
  // 9:16 first: these go out as reels, and a reel is the tall format.
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [editing, setEditing] = useState(false);
  const {
    edits, sync, stranded, hide, restoreAll, reorder, step, setCrop, resetCrop,
    resetAll, publishStranded, discardStranded,
  } = useFeedEdits();
  const posts = applyEdits(POSTS, postId, edits);
  const ids = posts.map(postId);
  const [open, setOpen] = useState<{ post: number; slide: number } | null>(null);
  const sort = useSortableGrid({ ids, onCommit: reorder, enabled: editing });

  const move = useCallback((d: number) => {
    setOpen((o) => {
      if (!o) return o;
      const last = slideCount(posts[o.post]!) - 1;
      return { ...o, slide: Math.min(last, Math.max(0, o.slide + d)) };
    });
  }, [posts]);

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
    <div style={{ minHeight: "100vh", background: PAGE, color: BONE, fontFamily: UI }}>
      <SlideStyles />
      <Chrome
        ratio={ratio} setRatio={setRatio}
        editing={editing} setEditing={setEditing}
        hiddenCount={edits.hidden.length}
        onRestore={restoreAll} onReset={resetAll}
        sync={sync} stranded={stranded}
        onPublishStranded={publishStranded} onDiscardStranded={discardStranded}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 120px" }}>
        <Profile />
        {/* An Instagram grid: three up, 2px gutters, nothing drawn between the
            tiles. Three posts is one row, which is what a grid with three posts
            looks like — no dashed placeholders standing in for posts that do
            not exist. */}
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {posts.map((p, i) => (
            <Tile
              key={postId(p)}
              post={p}
              ratio={ratio}
              editing={editing}
              crop={edits.crops[postId(p)]}
              first={i === 0}
              last={i === posts.length - 1}
              slotRef={sort.register(i)}
              onDragStart={sort.handle(i)}
              lifted={sort.dragging === i}
              sorting={sort.dragging !== null}
              onOpen={() => setOpen({ post: i, slide: 0 })}
              onMoveLeft={() => step(ids[i]!, -1, ids)}
              onMoveRight={() => step(ids[i]!, 1, ids)}
              onHide={() => hide(postId(p))}
              onCrop={(patch) => setCrop(postId(p), patch)}
              onResetCrop={() => resetCrop(postId(p))}
            />
          ))}
        </div>
      </div>

      {open ? (
        <Viewer
          post={posts[open.post]!}
          crop={edits.crops[postId(posts[open.post]!)]}
          index={open.slide}
          ratio={ratio}
          onMove={move}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

/** "Saved for everyone, by Laura, 4 minutes ago" — in as few words as that. */
function ago(at: number | null): string {
  if (!at) return "";
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

function syncLine(sync: SyncState): string {
  switch (sync.kind) {
    case "loading":
      return "Loading the shared arrangement…";
    case "local":
      // No KV on the Development env, so there is nothing to share with.
      return "This browser only (no shared store here)";
    case "offline":
      return "Saved in this browser — the shared copy could not be reached";
    case "shared": {
      if (!sync.at) return "Shared with everyone signed in";
      const who = sync.by ? sync.by[0]!.toUpperCase() + sync.by.slice(1) : "someone";
      return `Shared · last saved by ${who}, ${ago(sync.at)}`;
    }
  }
}

function Chrome({
  ratio, setRatio, editing, setEditing, hiddenCount, onRestore, onReset,
  sync, stranded, onPublishStranded, onDiscardStranded,
}: {
  ratio: Ratio;
  setRatio: (r: Ratio) => void;
  editing: boolean;
  setEditing: (b: boolean) => void;
  hiddenCount: number;
  onRestore: () => void;
  onReset: () => void;
  sync: SyncState;
  stranded: boolean;
  onPublishStranded: () => void;
  onDiscardStranded: () => void;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(8,9,11,.92)",
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
        {editing
          ? "Drag a tile to move it · arrows do it one step · sliders crop · ✕ deletes"
          : syncLine(sync)}
      </span>
      <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            ...lbl(13, editing ? INK : MUTED),
            background: editing ? "#3b93d5" : "transparent",
            border: `1px solid ${editing ? "#3b93d5" : "rgba(242,237,226,.22)"}`,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {editing ? "Done" : "Edit"}
        </button>
        {editing ? (
          <>
            {hiddenCount ? (
              <button onClick={onRestore} style={ghost}>Restore {hiddenCount}</button>
            ) : null}
            <button onClick={onReset} style={ghost}>Reset all</button>
          </>
        ) : null}
      </div>
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

      {/* This browser is holding an arrangement that is not the shared one —
          it was made before the feed was shared, or somebody else saved over
          it. Say so and let the person decide, rather than quietly picking. */}
      {stranded ? (
        <div
          style={{
            flexBasis: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            paddingTop: 12,
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          <span style={{ fontFamily: UI, fontSize: 14, color: OXBLOOD }}>
            This browser has a different arrangement saved. The one on screen is
            the shared one.
          </span>
          <button onClick={onPublishStranded} style={ghost}>Publish mine to everyone</button>
          <button onClick={onDiscardStranded} style={ghost}>Keep the shared one</button>
        </div>
      ) : null}
    </header>
  );
}

const ghost = {
  ...lbl(13, MUTED),
  background: "transparent",
  border: `1px solid rgba(242,237,226,.22)`,
  padding: "8px 14px",
  cursor: "pointer",
};

function Profile() {
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/*
        The mark fills its circle edge to edge. Instagram crops an avatar to the
        circle rather than sitting a small logo inside one, and the Atlas mark is
        already a disc, so it wants the whole frame.
      */}
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: "50%",
          overflow: "hidden",
          background: INK_2,
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fa.svg"
          alt="Futures Atlas"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", filter: "invert(1)" }}
        />
      </div>
      <div style={{ minWidth: 280, flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>@{HANDLE}</div>
        <div style={{ ...lbl(13, FAINT), marginTop: 8 }}>
          {POSTS.length} posts · Followers not shown
        </div>
        <p style={{ fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: MUTED, margin: "14px 0 0", maxWidth: 560 }}>
          {BIO}
        </p>
        <p style={{ fontFamily: UI, fontSize: 14, lineHeight: 1.5, color: FAINT, margin: "10px 0 0", maxWidth: 560 }}>
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

/**
 * A tile, and in edit mode the controls for it.
 *
 * In edit mode the picture is a drag handle: pick a tile up and drop it where
 * you want it, and the rest of the grid moves out of the way as you go
 * (useSortableGrid.ts, which also explains why this is pointer events and not
 * the browser's own drag-and-drop). The arrow buttons stay for the keyboard.
 *
 * Cropping is sliders, not scroll-to-zoom-and-drag-to-pan. Wheel events fight
 * the page scroll and a drag inside a 120px tile is a guess; a slider you can
 * nudge with an arrow key is not.
 */
function Tile({
  post, ratio, editing, crop, first, last, slotRef, lifted, sorting,
  onDragStart, onOpen, onMoveLeft, onMoveRight, onHide, onCrop, onResetCrop,
}: {
  post: Post;
  ratio: Ratio;
  editing: boolean;
  crop?: Crop;
  first: boolean;
  last: boolean;
  slotRef: (el: HTMLDivElement | null) => void;
  lifted: boolean;
  sorting: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onOpen: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onHide: () => void;
  onCrop: (patch: Partial<Crop>) => void;
  onResetCrop: () => void;
}) {
  const [ref, w] = useWidth<HTMLDivElement>(340);
  const c = crop ?? DEFAULT_CROP;
  const edited = c.zoom !== 1 || c.x !== 0 || c.y !== 0;

  // The sort hook owns `transform` and `transition` on this element and writes
  // them straight to the node, so nothing here may set either.
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      slotRef(el);
    },
    [ref, slotRef],
  );

  return (
    <div
      ref={setRefs}
      style={{
        position: "relative",
        zIndex: lifted ? 5 : 0,
        // A tile in flight should not be the drop target for its own pointer,
        // and the ones sliding underneath should not react to being passed over.
        pointerEvents: sorting && !lifted ? "none" : undefined,
      }}
    >
      <div
        onClick={() => { if (!editing) onOpen(); }}
        onPointerDown={editing ? onDragStart : undefined}
        role={editing ? undefined : "button"}
        aria-label={editing ? undefined : `Open ${post.name}`}
        tabIndex={editing ? -1 : 0}
        onKeyDown={(e) => { if (!editing && (e.key === "Enter" || e.key === " ")) onOpen(); }}
        style={{
          position: "relative",
          boxShadow: lifted
            ? `inset 0 0 0 1px rgba(242,237,226,.45), 0 18px 40px rgba(0,0,0,.55)`
            : `inset 0 0 0 1px rgba(242,237,226,.10)`,
          background: INK_2,
          cursor: editing ? (lifted ? "grabbing" : "grab") : "pointer",
          // Without this a touch drag scrolls the page instead of moving a tile.
          touchAction: editing ? "none" : undefined,
          display: "block",
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        <SlideFrame width={w} ratio={ratio}>
          <PostSlide post={post} index={0} ratio={ratio} crop={crop} />
        </SlideFrame>
        {slideCount(post) > 1 && !editing ? (
          <span
            style={{
              position: "absolute", top: 10, right: 10, width: 18, height: 18,
              border: `2px solid ${BONE}`, borderRadius: 4,
              boxShadow: `-4px 4px 0 -2px ${INK}, -6px 6px 0 -2px ${BONE}`,
              opacity: 0.55,
            }}
          />
        ) : null}
      </div>

      {editing ? (
        <div style={{ background: INK_2, padding: "10px 10px 12px", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={onMoveLeft} disabled={first} style={stepBtn(first)} title="Move earlier">←</button>
            <button onClick={onMoveRight} disabled={last} style={stepBtn(last)} title="Move later">→</button>
            <span style={{ ...lbl(9, FAINT), flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {post.name}
            </span>
            <button onClick={onHide} style={stepBtn(false)} title="Delete">✕</button>
          </div>
          <Slider label="Zoom" value={c.zoom} min={1} max={3} step={0.02}
            onChange={(v) => onCrop({ zoom: v })} />
          <Slider label="X" value={c.x} min={-0.5} max={0.5} step={0.01}
            onChange={(v) => onCrop({ x: v })} />
          <Slider label="Y" value={c.y} min={-0.5} max={0.5} step={0.01}
            onChange={(v) => onCrop({ y: v })} />
          {edited ? (
            <button onClick={onResetCrop} style={{ ...stepBtn(false), width: "100%" }}>
              Reset crop
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const stepBtn = (disabled: boolean) => ({
  ...lbl(11, disabled ? "rgba(242,237,226,.25)" : MUTED),
  background: "transparent",
  border: `1px solid rgba(242,237,226,${disabled ? ".08" : ".22"})`,
  padding: "5px 9px",
  cursor: disabled ? "default" : "pointer",
  lineHeight: 1,
});

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ ...lbl(9, FAINT), width: 34 }}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#3b93d5", height: 16 }}
      />
      <span style={{ ...lbl(9, FAINT), width: 34, textAlign: "right" }}>
        {value.toFixed(2)}
      </span>
    </label>
  );
}

function Viewer({
  post, index, ratio, crop, onMove, onClose,
}: {
  post: Post;
  crop?: Crop;
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
            <PostSlide post={post} index={index} ratio={ratio} live crop={crop} />
          </SlideFrame>
          <Arrow dir={-1} disabled={index === 0} onClick={() => onMove(-1)} />
          <Arrow dir={1} disabled={index === n - 1} onClick={() => onMove(1)} />
        </div>

        {/* One dot per slide of THIS post. It used to map over SLIDE_KINDS,
            which is the deck's three, so a four-slide carousel showed three. */}
        <div style={{ display: "flex", gap: 7, justifyContent: "center", padding: "16px 0", minHeight: 7 }}>
          {(n > 1 ? Array.from({ length: n }) : []).map((_, i) => (
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
          {n === 1
            ? "Single image"
            : `${index + 1} / ${n}${post.kind === "deck" ? ` · ${SLIDE_KINDS[index]}` : ""}`}
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
