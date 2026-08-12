"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PostImage, hasImage } from "@/components/PostImage";
import { YouTubeCard, youtubeId } from "@/components/feed/YouTubeCard";
import { PollCard } from "@/components/feed/PollCard";
import { SwipeDemoCard } from "@/components/feed/SwipeDemoCard";
import { POLLS } from "@/data/polls";
import { LeftRail, RightRail } from "@/components/feed/FeedRails";
import type { Project } from "@/data/projects";
import {
  KIND_LABEL,
  formatPostDate,
  hostOf,
  type Post,
  type PostTopic,
} from "@/data/posts";
import { FEED_HEADLINES, randomHeadline } from "@/data/feed-headlines";

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

/**
 * Which posts earn two columns. Videos do, because a 16:9 player needs the
 * width; otherwise only a long read with a real image. Letting anything with
 * an image go wide put 24 of 40 cards on two columns, at which point four
 * columns collapse back into two and the mix is gone.
 */
export function isWideCard(post: Post): boolean {
  if (post.kind === "video" && youtubeId(post.url)) return true;
  return hasImage(post) && post.length === "long";
}

/** Where the interactive cards sit in the run of posts. */
const INTERLEAVE: Record<number, "poll-0" | "swipe" | "poll-1" | "poll-2"> = {
  // The lead video (2 cols) plus a narrow card fill row one, three cards fill
  // row two, so placing the swiper here opens row three.
  4: "swipe",
  8: "poll-0",
  14: "poll-1",
  20: "poll-2",
};

export function FeedTimeline({
  items,
  projects = [],
  showVisibility = false,
}: {
  items: Post[];
  projects?: Project[];
  showVisibility?: boolean;
}) {
  const [topic, setTopic] = useState<PostTopic | null>(null);
  const [media, setMedia] = useState(false);
  // Picked after mount: choosing on the server too would hydrate a different
  // line than it rendered.
  const [headline, setHeadline] = useState(FEED_HEADLINES[0]);
  useEffect(() => setHeadline(randomHeadline()), []);

  const byKind = media ? items.filter((p) => p.kind === "video") : items;
  const filtered = topic ? byKind.filter((p) => p.topics.includes(topic)) : byKind;

  /**
   * Open on a wide video, then a single-column card. Pulling both forward gives
   * every filtered view the same opening beat instead of whatever happened to
   * be newest — and stops two wide cards landing side by side at the top, which
   * reads as a two-column page rather than a mixed one.
   */
  const shown = useMemo(() => {
    const rest = [...filtered];
    const vi = rest.findIndex((p) => p.kind === "video" && youtubeId(p.url));
    const lead = vi >= 0 ? rest.splice(vi, 1)[0] : undefined;
    const ni = rest.findIndex((p) => !isWideCard(p));
    const narrow = ni >= 0 ? rest.splice(ni, 1)[0] : undefined;
    return [lead, narrow, ...rest].filter((p): p is Post => Boolean(p));
  }, [filtered]);

  return (
    <div className="fa-feed bg-surface">
      {/* A masthead, not a bar: it scrolls away like any other page's heading,
          which lets the master nav keep its normal hide-on-scroll behaviour. */}
      <header className="px-4 pb-1 pt-8 min-[680px]:px-7 min-[680px]:pt-10">
        <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[clamp(24px,2.7vw,38px)] leading-none text-ink text-balance">
          <span className="font-extrabold tracking-[-0.02em]">FEED</span>
          <span aria-hidden className="font-light text-faint">&mdash;</span>
          <span className="font-light tracking-[-0.01em] text-graphite">{headline}</span>
        </h1>
      </header>

      {/* ---------- rails + grid ---------- */}
      <div className="flex w-full items-start">
        <LeftRail
          items={items}
          topic={topic}
          setTopic={setTopic}
          media={media}
          setMedia={setMedia}
        />

        <main className="min-w-0 flex-1">
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
          {shown.map((post, i) => {
            const special = INTERLEAVE[i];
            return (
              <FeedCardGroup key={post.slug}>
                <PostCardFeed post={post} showVisibility={showVisibility} />
                {special === "swipe" && (
                  <Cell className="min-[900px]:[grid-column:span_2]">
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

        </div>
      )}
        </main>

        <RightRail latest={items.slice(0, 5)} projects={projects} all={items} />
      </div>

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
  const wide = isWideCard(post);

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
