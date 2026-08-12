"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PostImage, hasImage } from "@/components/PostImage";
import {
  KIND_LABEL,
  formatPostDate,
  hostOf,
  topicsOf,
  type Post,
  type PostKind,
  type PostTopic,
} from "@/data/posts";

/**
 * The Feed: the same posts as /blog, in a timeline instead of a grid.
 *
 * The LAYOUT is the homage — three columns, a sticky nav rail, a centre column
 * of posts with an avatar gutter, a trends rail. The SKIN is entirely Futures
 * Atlas: core tokens, mono labels, hairline rules, one blue accent. Nothing
 * here is a lifted asset.
 *
 * Note what it does NOT have: like, repost and view counts. Those numbers don't
 * exist for this site, and inventing them would be inventing data. The action
 * row carries real things instead — where it goes, how long it takes to read.
 */

type Tab = "latest" | "canon" | "watch";

const TABS: { id: Tab; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "canon", label: "Canon" },
  { id: "watch", label: "Watch" },
];

export function FeedTimeline({
  items,
  showVisibility = false,
}: {
  items: Post[];
  showVisibility?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("latest");
  const [topic, setTopic] = useState<PostTopic | null>(null);

  const topics = useMemo(() => topicsOf(items), [items]);

  const byTab = items.filter((p) =>
    tab === "canon" ? p.kind === "classic" : tab === "watch" ? p.kind === "video" : true,
  );
  const shown = topic ? byTab.filter((p) => p.topics.includes(topic)) : byTab;

  // "Trending": which sources come up most often in whatever is on screen.
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of shown) counts.set(p.sourceName, (counts.get(p.sourceName) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [shown]);

  return (
    <div className="bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-0">
        {/* ---------- left rail: navigation ---------- */}
        <aside className="sticky top-[var(--fa-nav-h)] hidden w-[228px] shrink-0 self-start px-5 py-8 min-[1000px]:block">
          <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink">Feed</h1>
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            {items.length} posts
          </p>

          <nav className="mt-7 flex flex-col gap-0.5">
            <RailItem label="All" count={items.length} active={topic === null} onClick={() => setTopic(null)} />
            {topics.map((t) => (
              <RailItem
                key={t}
                label={t}
                count={items.filter((p) => p.topics.includes(t)).length}
                active={topic === t}
                onClick={() => setTopic(topic === t ? null : t)}
              />
            ))}
          </nav>

          <Link
            href="/blog"
            className="mt-7 inline-flex items-center gap-2 rounded-[2px] border-[1.5px] border-ink/25 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
          >
            Grid view <span aria-hidden>→</span>
          </Link>
        </aside>

        {/* ---------- centre column: the timeline ---------- */}
        <main className="min-w-0 flex-1 border-ink/[0.14] min-[1000px]:border-x">
          <div className="sticky top-[var(--fa-nav-h)] z-20 border-b border-ink/[0.14] bg-surface/92 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-4 pt-4 min-[1000px]:hidden">
              <h1 className="text-[24px] font-extrabold leading-none tracking-[-0.02em] text-ink">Feed</h1>
              <Link
                href="/blog"
                className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite hover:text-ink"
              >
                Grid view →
              </Link>
            </div>
            <div className="flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="relative flex-1 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
                  style={{ color: tab === t.id ? "var(--text)" : "var(--muted)" }}
                >
                  {t.label}
                  {tab === t.id && (
                    <span
                      className="absolute inset-x-[28%] bottom-0 h-[3px] rounded-t-[2px]"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* topic filter, small screens only — the left rail owns it above 1000px */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] min-[1000px]:hidden [&::-webkit-scrollbar]:hidden">
              <Chip label="All" active={topic === null} onClick={() => setTopic(null)} />
              {topics.map((t) => (
                <Chip key={t} label={t} active={topic === t} onClick={() => setTopic(topic === t ? null : t)} />
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[13px] text-graphite">
              Nothing in the feed under that combination yet.
            </p>
          ) : (
            <ul>
              {shown.map((p) => (
                <FeedItem key={p.slug} post={p} showVisibility={showVisibility} />
              ))}
            </ul>
          )}

          <div className="border-t border-ink/[0.14] px-4 py-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink"
            >
              That&rsquo;s the whole feed — see it as a grid <span aria-hidden>→</span>
            </Link>
          </div>
        </main>

        {/* ---------- right rail: what's in here ---------- */}
        <aside className="sticky top-[var(--fa-nav-h)] hidden w-[300px] shrink-0 self-start px-5 py-8 min-[1240px]:block">
          <div
            className="rounded-[4px]"
            style={{
              background: "var(--panel)",
              border: "var(--border-hairline) solid var(--hairline)",
              padding: "var(--space-5)",
            }}
          >
            <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent-deep">
              About the feed
            </h2>
            <p
              className="mt-3"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body-size)",
                lineHeight: "var(--lh-body)",
                color: "var(--text-body)",
              }}
            >
              The same reading log as the blog, posted as it comes. Every item links
              out to the original — the note is our read, not a substitute.
            </p>
          </div>

          <div
            className="mt-5 rounded-[4px]"
            style={{
              background: "var(--panel)",
              border: "var(--border-hairline) solid var(--hairline)",
              padding: "var(--space-5)",
            }}
          >
            <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent-deep">
              Most cited here
            </h2>
            <ul className="mt-4 flex flex-col gap-3.5">
              {sources.map(([name, n], i) => (
                <li key={name} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block truncate text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
                      {name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
                    {n} {n === 1 ? "post" : "posts"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- one post in the timeline ---------- */

function FeedItem({ post, showVisibility }: { post: Post; showVisibility: boolean }) {
  return (
    <li className="border-b border-ink/[0.14] transition-colors hover:bg-haze/40">
      <article className="flex gap-3 px-4 py-4 min-[520px]:gap-4 min-[520px]:px-5 min-[520px]:py-5">
        <Avatar />

        <div className="min-w-0 flex-1">
          {/* byline */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Futures Atlas</span>
            <VerifiedMark />
            <span className="font-mono text-[11.5px] text-graphite">@futuresatlas</span>
            <span aria-hidden className="font-mono text-[11.5px] text-faint">·</span>
            <span className="font-mono text-[11.5px] text-faint">{formatPostDate(post.posted)}</span>
            {showVisibility && post.visibility === "draft" && (
              <span
                className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                style={{ background: "var(--text)", color: "var(--bg)" }}
              >
                Draft
              </span>
            )}
          </div>

          {/* the post itself */}
          <Link href={`/blog/${post.slug}`} className="group mt-1.5 block">
            <h2 className="text-[clamp(15px,1.5vw,17px)] font-extrabold leading-[1.3] tracking-[-0.015em] text-ink transition-colors group-hover:text-accent text-balance">
              {post.title}
            </h2>
            <p
              className="mt-1.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body-size)",
                lineHeight: "var(--lh-body)",
                color: "var(--text-body)",
              }}
            >
              {post.dek}
            </p>
          </Link>

          {/* the link card — the source's own preview, exactly as any card would show it */}
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-[4px] transition-colors hover:border-accent"
            style={{ border: "var(--border-hairline) solid var(--hairline)" }}
          >
            {hasImage(post) ? (
              <div className="relative aspect-[2/1] overflow-hidden border-b border-ink/[0.12]">
                <PostImage post={post} className="absolute inset-0 h-full w-full object-cover" />
              </div>
            ) : (
              <div className="fa-hatch aspect-[5/1] border-b border-ink/[0.12]" />
            )}
            <div style={{ padding: "var(--space-4)" }}>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
                {hostOf(post.url)}
              </span>
              <span className="mt-1.5 block text-[13.5px] font-extrabold leading-snug tracking-[-0.01em] text-ink">
                {post.sourceName}
              </span>
              {post.whyItMatters && (
                <span
                  className="mt-1.5 line-clamp-2 block"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-body-size)",
                    lineHeight: "var(--lh-body)",
                    color: "var(--text-body)",
                  }}
                >
                  {post.whyItMatters}
                </span>
              )}
            </div>
          </a>

          {/* action row — real destinations and real numbers only, no invented counts */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Action href={`/blog/${post.slug}`} label="Read">
              <path d="M4 4.5h8M4 8h8M4 11.5h5" />
            </Action>
            <Action href={post.url} external label="Source">
              <path d="M6 3h7v7M13 3 5 11M3 7v6h6" />
            </Action>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
              <span
                className="rounded-[2px] px-1.5 py-0.5"
                style={{
                  border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
                  color: "var(--accent-deep)",
                }}
              >
                {KIND_LABEL[post.kind]}
              </span>
              {post.readMinutes} min
            </span>
          </div>
        </div>
      </article>
    </li>
  );
}

/* ---------- small parts ---------- */

function Avatar() {
  return (
    // paper is light in BOTH themes and the mark is ink, so the avatar reads
    // without the invert filter the nav bar needs for its own copy of the mark.
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)] min-[520px]:h-11 min-[520px]:w-11"
      style={{ background: "var(--paper, #f4efe4)" }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fa.svg" alt="" className="h-[18px] w-auto" />
    </span>
  );
}

function VerifiedMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-label="Futures Atlas" role="img">
      <path
        d="M8 1.2 9.7 2.6l2.2-.2.5 2.1 1.8 1.2-1 2 .5 2.1-2.1.6L10.3 12l-2-.9-2 .9L5 10.5l-2.1-.6.5-2.1-1-2 1.8-1.2.5-2.1 2.2.2z"
        fill="var(--accent)"
      />
      <path d="m5.8 8.1 1.5 1.5 3-3.2" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Action({
  href,
  label,
  external = false,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    "group/act inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-accent";
  const icon = (
    <svg
      viewBox="0 0 16 16"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {icon}
      {label}
    </Link>
  );
}

function RailItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-[3px] px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
      style={{
        background: active ? "var(--band)" : "transparent",
        color: active ? "var(--paper, #fff)" : "var(--text-body)",
      }}
    >
      <span className="truncate">{label}</span>
      <span style={{ color: active ? "color-mix(in srgb, var(--paper, #fff) 60%, transparent)" : "var(--faint)" }}>
        {count}
      </span>
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-[2px] border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/70 hover:border-ink/60"
      }`}
    >
      {label}
    </button>
  );
}
