import Link from "next/link";
import { PostImage } from "./PostImage";
import { KIND_LABEL, formatPostDate, hasImage, type Post, type PostKind } from "@/data/posts";

/**
 * One post, as a card. Shared by the feed and the carousel, so a change
 * here lands in both. Fully token-driven (futures-atlas-core): structural
 * utilities (grid/flex/aspect/absolute) are layout; every size, space, colour
 * and font references a semantic token.
 */

export function KindBadge({ kind, onPlate = false }: { kind: PostKind; onPlate?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
      style={
        onPlate
          ? { background: "var(--band)", color: "var(--paper, #fff)" }
          : {
              border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              color: "var(--accent-deep)",
            }
      }
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

/** The LIVE / DRAFT flag, only ever rendered for a signed-in editor. */
function VisibilityTag({ post }: { post: Post }) {
  const draft = post.visibility === "draft";
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
      style={{
        background: draft ? "var(--text)" : "var(--accent)",
        color: draft ? "var(--bg)" : "var(--paper, #fff)",
      }}
    >
      {draft ? "Draft" : "Live"}
    </span>
  );
}

export function PostCard({
  post,
  index = 0,
  showVisibility = false,
  /** Carousel cards sit in a horizontal track and need a fixed width. */
  fixedWidth = false,
}: {
  post: Post;
  index?: number;
  showVisibility?: boolean;
  fixedWidth?: boolean;
}) {
  const n = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/feed/${post.slug}`}
      className={`fa-card fa-card--link group h-full ${
        fixedWidth ? "w-[min(78vw,320px)] shrink-0 snap-start" : ""
      }`}
    >
      {/* plate */}
      <div
        className={`relative aspect-[3/2] overflow-hidden ${hasImage(post) ? "" : "fa-hatch flex items-end"}`}
        style={{
          borderBottom: "var(--border-hairline) solid var(--hairline)",
          padding: hasImage(post) ? 0 : "var(--space-5)",
        }}
      >
        {hasImage(post) ? (
          <PostImage
            post={post}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            className="fa-year"
            style={{
              fontSize: "var(--text-stat)",
              lineHeight: 0.8,
              color: "color-mix(in srgb, var(--text) 15%, transparent)",
            }}
          >
            {n}
          </span>
        )}

        <span className="absolute left-0 top-0 z-[2] flex flex-wrap gap-1.5" style={{ margin: "var(--space-4)" }}>
          <KindBadge kind={post.kind} onPlate={hasImage(post)} />
          {showVisibility && <VisibilityTag post={post} />}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
        <div
          className="flex items-center justify-between"
          style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
        >
          <span className="fa-card__meta truncate">{post.topics[0]}</span>
          <span
            className="whitespace-nowrap"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              textTransform: "uppercase",
              letterSpacing: "var(--track-label)",
              color: "var(--muted)",
            }}
          >
            {formatPostDate(post.posted)}
          </span>
        </div>

        <h3 className="fa-card__title text-balance" style={{ fontSize: "var(--text-title-s)" }}>
          {post.title}
        </h3>

        <p
          className="line-clamp-3"
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          {post.dek}
        </p>

        <span
          className="mt-auto flex items-center justify-between"
          style={{
            paddingTop: "var(--space-5)",
            gap: "var(--space-3)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-label)",
            textTransform: "uppercase",
            letterSpacing: "var(--track-label)",
            color: "var(--muted)",
          }}
        >
          <span className="truncate">{post.sourceName}</span>
          <span className="whitespace-nowrap">{post.readMinutes} min</span>
        </span>
      </div>
    </Link>
  );
}
