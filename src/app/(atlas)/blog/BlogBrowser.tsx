"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { KIND_LABEL, kindsOf, topicsOf, type Post, type PostKind, type PostTopic } from "@/data/posts";

/**
 * The interactive half of the blog index. It filters whatever list it is
 * handed — deciding what belongs in that list (public vs editor) is the page's
 * job, so a draft never reaches the browser for a visitor who isn't signed in.
 *
 * A full-width four-column grid: same card everywhere (see PostCard), same
 * Container gutters as every other page, no shell max-width.
 */
export function BlogBrowser({
  items,
  showVisibility = false,
}: {
  items: Post[];
  showVisibility?: boolean;
}) {
  const [topic, setTopic] = useState<PostTopic | null>(null);
  const [kind, setKind] = useState<PostKind | null>(null);

  const topics = useMemo(() => topicsOf(items), [items]);
  const kinds = useMemo(() => kindsOf(items), [items]);

  const filtered = items.filter(
    (p) => (!topic || p.topics.includes(topic)) && (!kind || p.kind === kind),
  );

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          </span>
        </div>

        <h1 className="max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Blog
        </h1>
        <p
          className="mt-[clamp(16px,2vw,24px)] max-w-[62ch]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          What we&rsquo;re reading on quantum, advanced AI, and the compute the two of
          them run on — plus the social weather around all of it. Every post links
          out to the original; the note is our read, not a substitute for the source.
        </p>

        {/* filters: topic first, then format */}
        <div className="mt-[clamp(28px,4vw,48px)] flex flex-wrap gap-2.5">
          <FilterTag label="All" count={items.length} active={topic === null} onClick={() => setTopic(null)} />
          {topics.map((t) => (
            <FilterTag
              key={t}
              label={t}
              count={items.filter((p) => p.topics.includes(t)).length}
              active={topic === t}
              onClick={() => setTopic(topic === t ? null : t)}
            />
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Format</span>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(kind === k ? null : k)}
              className={`rounded-[2px] border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
                kind === k
                  ? "border-accent bg-accent text-paper"
                  : "border-ink/20 text-ink/55 hover:border-ink/50 hover:text-ink"
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-[clamp(36px,6vw,72px)] font-mono text-[13px] text-graphite">
            Nothing filed under that combination yet.
          </p>
        ) : (
          <div
            className="mt-[clamp(32px,5vw,60px)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ gap: "clamp(20px, 1.8vw, 32px)" }}
          >
            {filtered.map((p, i) => (
              <Reveal key={p.slug} delay={Math.min(i, 7) * 45} className="h-full">
                <PostCard post={p} index={i} showVisibility={showVisibility} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function FilterTag({
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
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
        // band is dark in BOTH themes, paper always light — same reasoning as
        // the projects filter: ink/paper flip together and went white-on-white.
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/70 hover:border-ink/60"
      }`}
    >
      {label}
      <span className={active ? "text-paper/60" : "text-ink/40"}>{count}</span>
    </button>
  );
}
