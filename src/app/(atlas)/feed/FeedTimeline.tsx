"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PostImage, hasImage } from "@/components/PostImage";
import { YouTubeCard, youtubeId } from "@/components/feed/YouTubeCard";
import { PollCard } from "@/components/feed/PollCard";
import { SwipeDemoCard } from "@/components/feed/SwipeDemoCard";
import { POLLS } from "@/data/polls";
import {
  KIND_LABEL,
  formatPostDate,
  hostOf,
  topicsOf,
  type Post,
  type PostTopic,
} from "@/data/posts";

/**
 * The Feed — full width, mixed card sizes, mixed card kinds.
 *
 * It used to be a single centre column between two rails, which is a fine
 * shape for a timeline and a waste of a wide screen. Now the whole width is
 * the feed: a dense grid where a card's size comes from what it is, so the
 * page has a rhythm instead of a queue. `grid-auto-flow: dense` lets a small
 * card backfill a gap a wide one leaves.
 *
 * Four kinds of card share the grid:
 *   - posts, wide when the source gave us a real image to show;
 *   - videos, which play in place rather than sending you to YouTube;
 *   - reader polls, whose bars are a real tally (see src/data/polls.ts);
 *   - a playable taster of Swipe the Future, linking to the full deck.
 *
 * Still no like, repost or view counts. Those numbers do not exist for this
 * site and inventing them would be inventing data — the same reason the poll
 * says when answers are not being recorded rather than showing a made-up bar.
 */

type Tab = "latest" | "canon" | "watch";

const TABS: { id: Tab; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "canon", label: "Canon" },
  { id: "watch", label: "Watch" },
];

/** Where the interactive cards sit in the run of posts. */
const INTERLEAVE: Record<number, "poll-0" | "swipe" | "poll-1" | "poll-2"> = {
  3: "poll-0",
  7: "swipe",
  12: "poll-1",
  18: "poll-2",
};

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

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of shown) counts.set(p.sourceName, (counts.get(p.sourceName) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [shown]);

  return (
    <div className="bg-surface">
      {/* ---------- full-width sticky bar ---------- */}
      <div className="sticky top-[var(--fa-nav-h)] z-20 border-b border-ink/[0.14] bg-surface/92 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pt-4 min-[680px]:px-7">
          <h1 className="text-[24px] font-extrabold leading-none tracking-[-0.02em] text-ink">Feed</h1>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            {shown.length} of {items.length}
          </span>
          <div className="ml-auto">
            <Link
              href="/blog"
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite hover:text-ink"
            >
              Grid view →
            </Link>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-1 overflow-x-auto px-4 [scrollbar-width:none] min-[680px]:px-7 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="relative shrink-0 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
              style={{ color: tab === t.id ? "var(--text)" : "var(--muted)" }}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-[2px]"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          ))}

          <span className="mx-3 hidden h-5 w-px shrink-0 self-center bg-ink/15 min-[900px]:block" />

          <div className="hidden gap-2 pb-2.5 min-[900px]:flex">
            <Chip label="All" active={topic === null} onClick={() => setTopic(null)} />
            {topics.map((t) => (
              <Chip
                key={t}
                label={t}
                active={topic === t}
                onClick={() => setTopic(topic === t ? null : t)}
              />
            ))}
          </div>
        </div>

        {/* narrow screens get the topics on their own scrolling row */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] min-[900px]:hidden [&::-webkit-scrollbar]:hidden">
          <Chip label="All" active={topic === null} onClick={() => setTopic(null)} />
          {topics.map((t) => (
            <Chip key={t} label={t} active={topic === t} onClick={() => setTopic(topic === t ? null : t)} />
          ))}
        </div>
      </div>

      {/* ---------- the grid ---------- */}
      {shown.length === 0 ? (
        <p className="px-4 py-24 text-center font-mono text-[13px] text-graphite">
          Nothing in the feed under that combination yet.
        </p>
      ) : (
        <div
          className="grid gap-4 px-4 py-6 min-[680px]:px-7 min-[680px]:py-8"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gridAutoFlow: "dense",
            // cards keep their natural height instead of stretching to the
            // tallest in the row, which is what makes it read as a bento
            alignItems: "start",
          }}
        >
          <AboutCard />

          {shown.map((post, i) => {
            const special = INTERLEAVE[i];
            return (
              <FeedCardGroup key={post.slug}>
                <PostCardFeed post={post} showVisibility={showVisibility} />
                {special === "swipe" && (
                  <Cell className="min-[900px]:[grid-row:span_2]">
                    <SwipeDemoCard />
                  </Cell>
                )}
                {special?.startsWith("poll") && (
                  <Cell>
                    <PollCard poll={POLLS[Number(special.split("-")[1]) % POLLS.length]} />
                  </Cell>
                )}
              </FeedCardGroup>
            );
          })}

          <MostCitedCard sources={sources} />
        </div>
      )}

      <div className="border-t border-ink/[0.14] px-4 py-10 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink"
        >
          That&rsquo;s the whole feed — see it as a grid <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

/* A fragment wrapper: grid children must be direct descendants, so a post and
   the card that follows it are siblings rather than nested. */
function FeedCardGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** The shared card shell — one border treatment for every kind. */
function Cell({
  children,
  className = "",
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  return (
    <As
      className={`overflow-hidden rounded-[4px] ${className}`}
      style={{ background: "var(--panel)", border: "var(--border-hairline) solid var(--hairline)" }}
    >
      {children}
    </As>
  );
}

/* ---------- a post ---------- */

function PostCardFeed({ post, showVisibility }: { post: Post; showVisibility: boolean }) {
  const yt = post.kind === "video" ? youtubeId(post.url) : null;
  // Videos earn the width because a 16:9 player needs it. Otherwise only the
  // long reads with a real image go wide — when most cards span two the grid
  // stops reading as a mix and turns back into two columns.
  const wide = Boolean(yt) || (hasImage(post) && post.length === "long");

  return (
    <Cell
      as="article"
      className={`flex flex-col transition-colors hover:border-accent ${
        wide ? "min-[900px]:[grid-column:span_2]" : ""
      }`}
    >
      {yt ? (
        <YouTubeCard id={yt} title={post.title} />
      ) : hasImage(post) ? (
        <Link href={`/blog/${post.slug}`} className="group block">
          <div className="relative aspect-[2/1] overflow-hidden border-b border-ink/[0.12]">
            <PostImage
              post={post}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      ) : (
        <div className="fa-hatch aspect-[6/1] border-b border-ink/[0.12]" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{
              border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              color: "var(--accent-deep)",
            }}
          >
            {KIND_LABEL[post.kind]}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            {formatPostDate(post.posted)}
          </span>
          {showVisibility && post.visibility === "draft" && (
            <span
              className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              Draft
            </span>
          )}
        </div>

        <Link href={`/blog/${post.slug}`} className="group mt-2.5 block">
          <h2
            className={`font-extrabold leading-[1.25] tracking-[-0.018em] text-ink transition-colors group-hover:text-accent text-balance ${
              wide ? "text-[clamp(18px,1.7vw,24px)]" : "text-[16.5px]"
            }`}
          >
            {post.title}
          </h2>
          <p
            className="mt-2"
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

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 font-mono text-[10.5px] uppercase tracking-[0.13em] text-graphite transition-colors hover:text-ink"
          >
            <span className="truncate">{hostOf(post.url)}</span> ↗
          </a>
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            {post.readMinutes} min
          </span>
        </div>
      </div>
    </Cell>
  );
}

/* ---------- standing cards ---------- */

function AboutCard() {
  return (
    <Cell>
      <div className="p-5">
        <h2 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep">
          About the feed
        </h2>
        <p
          className="mt-3 max-w-[62ch]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          The same reading log as the blog, posted as it comes. Every item links out to
          the original — the note is our read, not a substitute. Videos play here;
          polls record real answers, and say so when they cannot.
        </p>
      </div>
    </Cell>
  );
}

function MostCitedCard({ sources }: { sources: [string, number][] }) {
  if (sources.length === 0) return null;
  return (
    <Cell>
      <div className="p-5">
        <h2 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep">
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
                {n}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Cell>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-[2px] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors"
      style={{
        border: `var(--border-hairline) solid ${active ? "var(--accent)" : "var(--hairline)"}`,
        color: active ? "var(--accent-deep)" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}
