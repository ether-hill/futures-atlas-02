"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPostDate, type Post, type PostTopic } from "@/data/posts";
import type { Project } from "@/data/projects";

/**
 * The two sticky rails either side of the feed.
 *
 * Each rail scrolls inside itself: pinned and taller than the viewport, its
 * lower panels would otherwise sit permanently below the fold and never be
 * reachable — the right rail runs to about 1700px against a 900px window.
 *
 * Everything here is derived from data the site actually holds, or counted for
 * real. There is no "trending" in the analytics sense — this site records no
 * per-post views — so the left rail ranks by how often a topic and a source
 * actually appear in what is on screen, and says that is what it is measuring.
 * The alternative was a leaderboard of invented numbers.
 */

/* ============================ left ============================ */

export function LeftRail({
  items,
  topics,
  topic,
  setTopic,
  sources,
}: {
  items: Post[];
  topics: PostTopic[];
  topic: PostTopic | null;
  setTopic: (t: PostTopic | null) => void;
  sources: [string, number][];
}) {
  const max = sources[0]?.[1] ?? 1;

  return (
    <aside className="sticky top-[calc(var(--fa-nav-h)+100px)] hidden max-h-[calc(100dvh-var(--fa-nav-h)-100px)] w-[236px] shrink-0 self-start overflow-y-auto px-5 py-7 [scrollbar-width:none] min-[1080px]:block [&::-webkit-scrollbar]:hidden">
      <RailHeading>Topics</RailHeading>
      <nav className="mt-3 flex flex-col gap-0.5">
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

      <RailHeading className="mt-8">Most cited here</RailHeading>
      <p className="mt-2 font-mono text-[9.5px] leading-[1.5] text-faint">
        By how often a source appears in what you are looking at — this site keeps
        no view counts.
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {sources.map(([name, n]) => (
          <li key={name}>
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
                {name}
              </span>
              <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-faint">{n}</span>
            </span>
            <span
              aria-hidden
              className="mt-1 block h-[2px] rounded-full"
              style={{
                width: `${Math.max(8, Math.round((n / max) * 100))}%`,
                background: "color-mix(in oklab, var(--accent) 55%, transparent)",
              }}
            />
          </li>
        ))}
      </ul>

      <Link
        href="/blog"
        className="mt-8 inline-flex items-center gap-2 rounded-[2px] border-[1.5px] border-ink/25 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
      >
        Grid view <span aria-hidden>→</span>
      </Link>
    </aside>
  );
}

/* ============================ right ============================ */

export function RightRail({ latest, projects }: { latest: Post[]; projects: Project[] }) {
  return (
    <aside className="sticky top-[calc(var(--fa-nav-h)+100px)] hidden max-h-[calc(100dvh-var(--fa-nav-h)-100px)] w-[312px] shrink-0 self-start overflow-y-auto px-5 py-7 [scrollbar-width:none] min-[1320px]:block [&::-webkit-scrollbar]:hidden">
      <JustIn latest={latest} />
      <ProjectPicks projects={projects} />
      <SignUp />
      <LiveStats />
    </aside>
  );
}

function JustIn({ latest }: { latest: Post[] }) {
  return (
    <Panel>
      <RailHeading>Just in</RailHeading>
      <ul className="mt-3 flex flex-col">
        {latest.map((p, i) => (
          <li key={p.slug} className={i > 0 ? "border-t border-ink/[0.1] pt-2.5" : ""}>
            <Link href={`/blog/${p.slug}`} className="group block pb-2.5">
              <span className="block font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                {formatPostDate(p.posted)} · {p.sourceName}
              </span>
              <span className="mt-1 block text-[12.5px] font-extrabold leading-[1.32] tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
                {p.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ProjectPicks({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <Panel className="mt-5">
      <RailHeading>From the atlas</RailHeading>
      <ul className="mt-3 flex flex-col gap-3">
        {projects.map((pr) => (
          <li key={pr.id}>
            <Link href={pr.path ?? pr.url ?? "/projects"} className="group block">
              <span className="block font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                {pr.field}
              </span>
              <span className="mt-0.5 block text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
                {pr.title}
              </span>
              <span className="mt-1 line-clamp-2 block font-mono text-[11px] leading-[1.5] text-graphite">
                {pr.tagline}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/projects"
        className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent hover:text-ink"
      >
        All projects →
      </Link>
    </Panel>
  );
}

function SignUp() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const res = await fetch("/api/feed/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (d?.ok) {
        setState("done");
      } else {
        setState("error");
        setMessage(
          d?.code === "bad_email"
            ? "That address doesn't look right."
            : "Sign-up isn't switched on here yet.",
        );
      }
    } catch {
      setState("error");
      setMessage("Couldn't reach the server.");
    }
  }

  return (
    <Panel className="mt-5">
      <RailHeading>Get the dispatches</RailHeading>
      {state === "done" ? (
        <p className="mt-3 font-mono text-[11.5px] leading-[1.55] text-graphite">
          You&rsquo;re on the list. Nothing has been sent yet — this is a list of people
          who asked to be told, not a running newsletter.
        </p>
      ) : (
        <>
          <p className="mt-2 font-mono text-[11px] leading-[1.5] text-graphite">
            Occasional notes when something worth reading lands.
          </p>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
            <label className="sr-only" htmlFor="feed-email">
              Email address
            </label>
            <input
              id="feed-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[3px] px-3 py-2 text-[12.5px] outline-none"
              style={{
                background: "var(--bg)",
                border: "var(--border-hairline) solid var(--hairline)",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-[3px] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              {state === "sending" ? "Adding…" : "Sign up"}
            </button>
          </form>
          <p className="mt-2 font-mono text-[9.5px] leading-[1.5] text-faint">
            We store the address and nothing else. Ask and it comes off.
          </p>
          {state === "error" && (
            <p className="mt-2 font-mono text-[10px] text-accent-deep">{message}</p>
          )}
        </>
      )}
    </Panel>
  );
}

function LiveStats() {
  const [stats, setStats] = useState<{
    configured: boolean;
    views: number | null;
    subscribers: number | null;
  } | null>(null);

  useEffect(() => {
    // Count once per browser session, so this is views rather than renders.
    let counted = false;
    try {
      counted = sessionStorage.getItem("fa-feed-counted") === "1";
    } catch {
      /* private mode — it just counts again */
    }
    let live = true;
    fetch("/api/feed/stats", { method: counted ? "GET" : "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        setStats({ configured: !!d?.configured, views: d?.views ?? null, subscribers: d?.subscribers ?? null });
        try {
          sessionStorage.setItem("fa-feed-counted", "1");
        } catch {
          /* nothing to do */
        }
      })
      .catch(() => live && setStats({ configured: false, views: null, subscribers: null }));
    return () => {
      live = false;
    };
  }, []);

  return (
    <Panel className="mt-5">
      <RailHeading>Live</RailHeading>
      {stats?.configured ? (
        <dl className="mt-3 flex flex-col gap-3">
          <Stat label="Feed views" value={stats.views} />
          <Stat label="On the list" value={stats.subscribers} />
        </dl>
      ) : (
        <p className="mt-3 font-mono text-[10.5px] leading-[1.5] text-faint">
          {stats === null ? "Counting…" : "The counter is off on this deployment."}
        </p>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className="text-[19px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-ink">
        {value === null ? "—" : value.toLocaleString()}
      </dd>
    </div>
  );
}

/* ---------- shared bits ---------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[4px] ${className}`}
      style={{
        background: "var(--panel)",
        border: "var(--border-hairline) solid var(--hairline)",
        padding: "var(--space-5)",
      }}
    >
      {children}
    </div>
  );
}

function RailHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep ${className}`}
    >
      {children}
    </h2>
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
      className="flex items-baseline justify-between gap-3 rounded-[3px] px-2.5 py-2 text-left transition-colors"
      style={{
        background: active ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "transparent",
        color: active ? "var(--accent-deep)" : "var(--text)",
      }}
    >
      <span className="truncate text-[12.5px]">{label}</span>
      <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-faint">{count}</span>
    </button>
  );
}
