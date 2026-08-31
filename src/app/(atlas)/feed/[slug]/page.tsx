import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { KindBadge } from "@/components/PostCard";
import { PostImage } from "@/components/PostImage";
import { YouTubeCard } from "@/components/feed/YouTubeCard";
import { PostCarousel } from "@/components/PostCarousel";
import {
  formatPostDate,
  getPost,
  hasImage,
  hostOf,
  livePosts,
  posts,
  type Post,
  youtubeId,
} from "@/data/posts";
import { getEditor } from "@/lib/editor";
import { renderMarkdown } from "@/lib/markdown";

// Only published posts are prerendered, so an unpublished one never exists
// as HTML in the build output at all. Drafts still resolve for a signed-in
// editor — they're rendered on demand, behind the middleware gate.
export function generateStaticParams() {
  return livePosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found — Futures Atlas" };
  return {
    title: `${post.title} — Futures Atlas`,
    description: post.dek,
    robots: post.visibility === "draft" ? { index: false, follow: false } : undefined,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const isEditor = Boolean(await getEditor());
  // Latest rather than topic-related: the foot of a post is where you go
  // looking for what else has landed, not for more of the same subject.
  const more = (isEditor ? posts : livePosts).filter((p) => p.slug !== slug).slice(0, 10);
  const html = renderMarkdown(post.body);

  return (
    <article className="bg-surface py-[clamp(36px,6vw,88px)]">
      <Container>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> All posts
        </Link>

        {/* header */}
        <header className="mt-[clamp(24px,3.4vw,44px)] max-w-[74ch]">
          <div className="flex flex-wrap items-center gap-3">
            <KindBadge kind={post.kind} />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite">
              {post.topics.join(" · ")}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              {formatPostDate(post.posted)} · {post.readMinutes} min
            </span>
          </div>

          <h1 className="mt-[clamp(16px,2.2vw,28px)] max-w-[22ch] text-[clamp(30px,4.4vw,62px)] font-extrabold leading-[1.0] tracking-[-0.022em] text-ink text-balance">
            {post.title}
          </h1>

          <p
            className="mt-[clamp(14px,1.8vw,22px)] max-w-[56ch]"
            style={{
              fontFamily: "var(--font-serif, var(--font-mono))",
              fontSize: "clamp(17px, 1.7vw, 22px)",
              lineHeight: 1.45,
              color: "var(--text)",
            }}
          >
            {post.dek}
          </p>
        </header>

        {/* A video post gets the player itself, at full width — showing its
            thumbnail and making the reader leave for it was the wrong hero. */}
        {(() => {
          const yt = post.kind === "video" ? youtubeId(post.url) : null;
          if (yt) {
            return (
              <div
                className="mt-[clamp(24px,3.2vw,44px)] overflow-hidden rounded-[3px]"
                style={{ border: "var(--border-hairline) solid var(--hairline)" }}
              >
                <YouTubeCard id={yt} title={post.title} />
              </div>
            );
          }
          return hasImage(post) ? (
            <div
              className="mt-[clamp(24px,3.2vw,44px)] overflow-hidden rounded-[3px]"
              style={{ border: "var(--border-hairline) solid var(--hairline)" }}
            >
              <PostImage post={post} priority className="block aspect-[16/7] w-full object-cover" />
            </div>
          ) : null;
        })()}

        {/* Article left, annotation rail right. Below 1100px the rail simply
            stacks under the prose, which keeps the reading order intact. */}
        <div className="mt-[clamp(26px,3.4vw,48px)] grid gap-x-[clamp(28px,4vw,72px)] gap-y-[clamp(32px,4vw,52px)] min-[1100px]:grid-cols-[minmax(0,68ch)_minmax(260px,340px)]">
          <div className="min-w-0">
            {post.pullQuote && (
              <blockquote
                className="mb-[clamp(26px,3.2vw,44px)] max-w-[52ch]"
                style={{
                  borderLeft: "2px solid var(--accent)",
                  paddingLeft: "clamp(16px, 2vw, 26px)",
                  fontFamily: "var(--font-serif, var(--font-mono))",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 25px)",
                  lineHeight: 1.4,
                  color: "var(--text)",
                }}
              >
                &ldquo;{post.pullQuote}&rdquo;
                <cite className="mt-3 block font-mono text-[10.5px] not-italic uppercase tracking-[0.16em] text-faint">
                  {post.sourceName}
                </cite>
              </blockquote>
            )}

            {/* our write-up */}
            <div className="fa-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <aside className="min-[1100px]:sticky min-[1100px]:top-[calc(var(--fa-nav-h)+28px)] min-[1100px]:self-start">
            {/* the source, stated plainly — the post is commentary, not a replacement */}
            <SourceCard post={post} />

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-[2px] bg-accent px-5 py-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent-deep"
            >
              Read the original <span aria-hidden>↗</span>
            </a>

            {post.whyItMatters && (
              <div
                className="mt-[clamp(20px,2.4vw,28px)] rounded-[3px]"
                style={{
                  background: "var(--panel)",
                  border: "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
                  padding: "clamp(18px, 2.2vw, 26px)",
                }}
              >
                <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent-deep">
                  Why it matters
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
                  {post.whyItMatters}
                </p>
              </div>
            )}
          </aside>
        </div>

      </Container>

      <div className="mt-[clamp(48px,7vw,110px)]">
        <PostCarousel
          posts={more}
          title="Latest posts"
          eyebrow="Just landed"
          showVisibility={isEditor}
        />
      </div>
    </article>
  );
}

function SourceCard({ post }: { post: Post }) {
  return (
    <div
      className="rounded-[3px]"
      style={{
        border: "1px solid color-mix(in srgb, var(--text) 16%, transparent)",
        padding: "clamp(16px, 2vw, 24px)",
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
        <span>The source</span>
        <span aria-hidden>·</span>
        <span>{formatPostDate(post.published)}</span>
        {post.author && (
          <>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </>
        )}
      </div>
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 block break-words text-[13px] leading-[1.5] text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
      >
        {post.sourceName} — {hostOf(post.url)} <span aria-hidden>↗</span>
      </a>
    </div>
  );
}
