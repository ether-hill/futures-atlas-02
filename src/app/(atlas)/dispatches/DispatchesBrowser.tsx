"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import {
  KIND_LABEL,
  formatPostDate,
  hostOf,
  kindsOf,
  topicsOf,
  type Post,
  type PostKind,
  type PostTopic,
} from "@/data/posts";

/**
 * The interactive half of the reading log. It filters whatever list it is
 * handed — deciding what belongs in that list (public vs editor) is the page's
 * job, so a draft never reaches the browser for a visitor who isn't signed in.
 *
 * Deliberately a list, not the three-up card grid /projects uses: these are
 * things to read, and a dense editorial column scans far better than plates.
 */
export function DispatchesBrowser({
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
  const [lead, ...rest] = filtered;

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            {filtered.length} {filtered.length === 1 ? "dispatch" : "dispatches"}
          </span>
        </div>

        <h1 className="max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Dispatches
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
          them run on — plus the social weather around all of it. Every dispatch links
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

        {filtered.length === 0 && (
          <p className="mt-[clamp(36px,6vw,72px)] font-mono text-[13px] text-graphite">
            Nothing filed under that combination yet.
          </p>
        )}

        {lead && (
          <div className="mt-[clamp(36px,5vw,64px)]">
            <LeadPost post={lead} showVisibility={showVisibility} />
          </div>
        )}

        {rest.length > 0 && (
          <ul className="mt-[clamp(28px,4vw,52px)] border-t border-ink/[0.14]">
            {rest.map((p, i) => (
              <PostRow key={p.slug} post={p} index={i} showVisibility={showVisibility} />
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}

/* ---------- pieces ---------- */

function LeadPost({ post, showVisibility }: { post: Post; showVisibility: boolean }) {
  return (
    <Reveal>
      <Link
        href={`/dispatches/${post.slug}`}
        className="group block rounded-[3px] border border-ink/[0.16] transition-colors hover:border-accent"
        style={{ padding: "clamp(22px, 3.2vw, 44px)", background: "var(--panel)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <KindBadge kind={post.kind} />
          {showVisibility && <VisibilityFlag post={post} />}
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite">
            {post.topics.join(" · ")}
          </span>
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
            {formatPostDate(post.posted)}
          </span>
        </div>

        <h2 className="mt-[clamp(14px,1.8vw,22px)] max-w-[24ch] text-[clamp(26px,3.4vw,46px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink text-balance">
          {post.title}
        </h2>

        <p
          className="mt-[clamp(12px,1.4vw,18px)] max-w-[60ch]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          {post.dek}
        </p>

        <div className="mt-[clamp(18px,2.4vw,28px)] flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 border-b-[1.5px] border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
            Read the dispatch <span>→</span>
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            {post.sourceName} · {post.readMinutes} min
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function PostRow({ post, index, showVisibility }: { post: Post; index: number; showVisibility: boolean }) {
  return (
    <li className="border-b border-ink/[0.14]">
      <Reveal delay={Math.min(index, 6) * 40}>
        <Link
          href={`/dispatches/${post.slug}`}
          className="group grid gap-x-[clamp(16px,2.4vw,40px)] gap-y-3 py-[clamp(20px,2.6vw,34px)] min-[860px]:grid-cols-[152px_1fr_auto]"
        >
          {/* left rail: date + format */}
          <div className="flex items-center gap-3 min-[860px]:flex-col min-[860px]:items-start min-[860px]:gap-2.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              {formatPostDate(post.posted)}
            </span>
            <KindBadge kind={post.kind} />
            {showVisibility && <VisibilityFlag post={post} />}
          </div>

          {/* middle: the post */}
          <div className="min-w-0">
            <h3 className="max-w-[38ch] text-[clamp(18px,1.8vw,25px)] font-extrabold leading-[1.14] tracking-[-0.018em] text-ink transition-colors group-hover:text-accent text-balance">
              {post.title}
            </h3>
            <p
              className="mt-2.5 max-w-[64ch]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body-size)",
                lineHeight: "var(--lh-body)",
                color: "var(--text-body)",
              }}
            >
              {post.dek}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
              <span>{post.sourceName}</span>
              <span aria-hidden>·</span>
              <span>{hostOf(post.url)}</span>
              <span aria-hidden>·</span>
              <span>{post.topics.join(" / ")}</span>
            </div>
          </div>

          {/* right: read time */}
          <span className="self-start whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite min-[860px]:pt-1">
            {post.readMinutes} min
          </span>
        </Link>
      </Reveal>
    </li>
  );
}

export function KindBadge({ kind }: { kind: PostKind }) {
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
      style={{
        border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
        color: "var(--accent-deep)",
      }}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

function VisibilityFlag({ post }: { post: Post }) {
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
