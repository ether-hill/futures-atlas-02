"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PostImage } from "@/components/PostImage";
import { YouTubeCard } from "@/components/feed/YouTubeCard";
import { PollCard } from "@/components/feed/PollCard";
import { SwipeDemoCard } from "@/components/feed/SwipeDemoCard";
import { POLLS } from "@/data/polls";
import { LeftRail, RightRail } from "@/components/feed/FeedRails";
import type { Project } from "@/data/projects";
import {
  KIND_LABEL,
  formatPostDate,
  hasImage,
  hostOf,
  type Post,
  type PostTopic,
  youtubeId,
} from "@/data/posts";
import { FEED_HEADLINES, randomHeadline } from "@/data/feed-headlines";
import { HeadlineCredit } from "@/components/feed/HeadlineCredit";

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
 * How big a card is, and how its picture is cropped.
 *
 * The first version of this gave two columns to every video and one to
 * everything else. With ten videos in the feed that stopped reading as a bento
 * and started reading as a loop: a double-width video, a single beside it, a
 * row of singles, repeat, all the way down. One rule applied uniformly always
 * produces a pattern.
 *
 * So size now varies on two axes and the picture varies with it:
 *
 *   wide   two columns. Videos need it — a 16:9 player at one column is a
 *          postage stamp — and a long read with a picture earns it.
 *   tall   one column, but a portrait crop instead of the 2:1 letterbox. Costs
 *          nothing structurally and is what actually breaks the horizontal
 *          banding, because neighbouring columns stop lining up.
 *   plain  one column, letterbox picture or none.
 *
 * `runIndex` is the card's position in the rendered run, used ONLY to stop
 * several wides landing together — the size still comes from what the post is,
 * not from where it happens to sit.
 */
export type CardShape = "wide" | "tall" | "plain";

export function cardShape(post: Post, runIndex: number): CardShape {
  const isVideo = post.kind === "video" && youtubeId(post.url) !== null;
  // Every third video stays at one column. Ten wide videos in a row of three
  // columns is the loop; letting some sit narrow is what breaks it.
  if (isVideo) return runIndex % 3 === 2 ? "plain" : "wide";
  if (hasImage(post)) {
    if (post.length === "long") return "wide";
    // Alternating crop on the ordinary picture cards. Same column width, but
    // the columns stop agreeing about where a card ends.
    return runIndex % 2 === 0 ? "tall" : "plain";
  }
  return "plain";
}

/** Kept for the lead-slot logic, which only cares whether a card is double-width. */
export function isWideCard(post: Post, runIndex = 0): boolean {
  return cardShape(post, runIndex) === "wide";
}

/** Where the interactive cards sit in the run of posts. */
const INTERLEAVE: Record<number, "poll" | "swipe"> = {
  // The lead video (2 cols) plus a narrow card fill row one, three cards fill
  // row two, so placing the swiper here opens row three.
  4: "swipe",
  8: "poll",
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

  // How far down the list the lead slot may reach for a video. Eight is about
  // one screen of cards: far enough that a video usually still opens the feed,
  // near enough that it can never outrank a genuinely newer story.
  const LEAD_VIDEO_REACH = 8;

  const byKind = media ? items.filter((p) => p.kind === "video") : items;
  const filtered = topic ? byKind.filter((p) => p.topics.includes(topic)) : byKind;

  /**
   * Open on a wide video, then a single-column card: a mixed opening beat, and
   * no two wide cards side by side at the top.
   *
   * The video is only promoted if it is ALREADY near the top by date. Without
   * that bound the rule reached as far down the list as it had to — it was
   * hauling a 1 July video over posts from 11 August, so the page led six weeks
   * stale while "Just in" beside it showed the real newest. A reading log that
   * headlines old news reads as abandoned, which is the one thing the layout
   * must not do. No recent video, no promotion: lead with the newest post and
   * let the video sit wherever its date puts it.
   */
  const shown = useMemo(() => {
    const rest = [...filtered];
    const vi = rest.findIndex((p) => p.kind === "video" && youtubeId(p.url));
    const lead = vi >= 0 && vi < LEAD_VIDEO_REACH ? rest.splice(vi, 1)[0] : undefined;
    // The narrow card exists to sit BESIDE the lead video and stop two wide
    // cards pairing off at the top. With no video promoted there is nothing to
    // sit beside, and pulling one anyway just pushed a second story over the
    // newest for no reason — so in that case the order is simply the dates.
    if (!lead) return rest;
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
          <span className="font-light tracking-[-0.01em] text-graphite">{headline.line}</span>
          <HeadlineCredit headline={headline} />
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
          className="grid grid-cols-1 gap-4 px-4 py-6 min-[560px]:grid-cols-2 min-[1080px]:grid-cols-3 min-[1800px]:grid-cols-4 min-[680px]:px-7 min-[680px]:py-8"
          style={{
            // Column COUNT is set explicitly at breakpoints rather than left to
            // auto-fill. With auto-fill the count fell out of whatever width
            // the rails happened to leave: at a 1600px window the grid had
            // 944px and a 320px minimum, which is TWO columns — so a
            // two-column span was the whole row, and every video and long read
            // became a full-width block. That is what made the page read as a
            // stack. Fixing the counts means "wide" always means wide.
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
                <PostCardFeed post={post} runIndex={i} showVisibility={showVisibility} />
                {special === "swipe" && (
                  <Cell className="min-[1080px]:[grid-column:span_2]">
                    <SwipeDemoCard />
                  </Cell>
                )}
                {special?.startsWith("poll") && (
                  <Cell>
                    <PollCard polls={POLLS} />
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

function PostCardFeed({
  post,
  runIndex,
  showVisibility,
}: {
  post: Post;
  runIndex: number;
  showVisibility: boolean;
}) {
  const yt = post.kind === "video" ? youtubeId(post.url) : null;
  const shape = cardShape(post, runIndex);
  const wide = shape === "wide";

  return (
    <Cell
      as="article"
      className={`flex flex-col transition-colors hover:border-accent ${
        wide ? "min-[1080px]:[grid-column:span_2]" : ""
      }`}
    >
      {yt ? (
        <YouTubeCard id={yt} title={post.title} />
      ) : hasImage(post) ? (
        <Link href={`/feed/${post.slug}`} className="group block">
          <div
            className={`relative overflow-hidden border-b border-ink/[0.12] ${
              shape === "tall" ? "aspect-[4/5]" : "aspect-[2/1]"
            }`}
          >
            <PostImage
              post={post}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      ) : (
        /*
         * No usable picture, so the card sets one instead of leaving a hole.
         *
         * Some publishers ship no og:image at all (arXiv gives its own logo,
         * which is worse than nothing — the same logo on seven cards) and some
         * block the fetch. The old fallback was a 6:1 hatched strip, which read
         * as a card that had failed to load rather than a card of a different
         * kind. This is the same move Magnifica's source rail makes for the
         * three publishers there that print no image: name the publisher, in
         * the house mono, on the hatch.
         */
        <Link
          href={`/feed/${post.slug}`}
          className="group relative block aspect-[2/1] overflow-hidden border-b border-ink/[0.12]"
        >
          <span className="fa-hatch absolute inset-0" aria-hidden />
          <span className="absolute inset-0 flex items-end p-4">
            <span className="font-mono text-[clamp(13px,1.5vw,19px)] uppercase leading-[1.15] tracking-[0.06em] text-ink/75 transition-colors group-hover:text-accent">
              {post.sourceName}
            </span>
          </span>
        </Link>
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

        <Link href={`/feed/${post.slug}`} className="group mt-2.5 block">
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
