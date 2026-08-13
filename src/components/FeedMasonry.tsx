"use client";

import Link from "next/link";
import { PostImage } from "@/components/PostImage";
import { YouTubeCard, youtubeId } from "@/components/feed/YouTubeCard";
import { KIND_LABEL, formatPostDate, hasImage, hostOf, type Post } from "@/data/posts";

/**
 * The feed on the homepage: the newest posts in a masonry, videos included and
 * playable in place.
 *
 * CSS columns rather than a grid, because the cards are different heights by
 * nature — a video, a note with a picture, a note without — and columns pack
 * them with no gaps and no measuring. The trade is that reading order runs down
 * each column rather than across, which is the right order here: this is a
 * pile of recent things, not a ranked list.
 */
export function FeedMasonry({ posts, showVisibility = false }: { posts: Post[]; showVisibility?: boolean }) {
  return (
    <section className="border-t border-ink/15">
      <div className="px-4 py-[clamp(48px,7vw,96px)] min-[680px]:px-7">
        <div className="mb-[clamp(24px,3vw,44px)] flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow tick mb-3">Posted as it comes</p>
            <h2 className="text-[clamp(26px,3.6vw,46px)] font-extrabold leading-none tracking-[-0.025em] text-ink">
              Feed
            </h2>
          </div>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
          >
            View all <span className="text-[14px]">→</span>
          </Link>
        </div>

        <div className="[column-gap:16px] [columns:1] min-[560px]:[columns:2] min-[900px]:[columns:3] min-[1200px]:[columns:4] min-[1500px]:[columns:5]">
          {posts.map((p) => {
            const yt = p.kind === "video" ? youtubeId(p.url) : null;
            return (
              <article
                key={p.slug}
                className="mb-4 break-inside-avoid overflow-hidden rounded-[4px] transition-colors hover:border-accent"
                style={{ background: "var(--panel)", border: "var(--border-hairline) solid var(--hairline)" }}
              >
                {yt ? (
                  <YouTubeCard id={yt} title={p.title} />
                ) : hasImage(p) ? (
                  <Link href={`/feed/${p.slug}`} className="group block">
                    <span className="block overflow-hidden border-b border-ink/[0.12]">
                      <PostImage
                        post={p}
                        className="block aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </span>
                  </Link>
                ) : null}

                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span
                      className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                      style={{
                        border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
                        color: "var(--accent-deep)",
                      }}
                    >
                      {KIND_LABEL[p.kind]}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {formatPostDate(p.posted)}
                    </span>
                    {showVisibility && p.visibility === "draft" && (
                      <span
                        className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                        style={{ background: "var(--text)", color: "var(--bg)" }}
                      >
                        Draft
                      </span>
                    )}
                  </div>

                  <Link href={`/feed/${p.slug}`} className="group mt-2 block">
                    <h3 className="text-[15px] font-extrabold leading-[1.28] tracking-[-0.015em] text-ink transition-colors group-hover:text-accent text-balance">
                      {p.title}
                    </h3>
                    <p
                      className="mt-1.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        lineHeight: "1.55",
                        color: "var(--text-body)",
                      }}
                    >
                      {p.dek}
                    </p>
                  </Link>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.13em] text-graphite hover:text-ink"
                    >
                      {hostOf(p.url)} ↗
                    </a>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {p.readMinutes} min
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
