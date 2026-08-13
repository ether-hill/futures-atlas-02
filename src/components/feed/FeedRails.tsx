"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TOPIC_ORDER, formatPostDate, type Post, type PostTopic } from "@/data/posts";
import type { Project } from "@/data/projects";

/**
 * The two sticky rails either side of the feed.
 *
 * Each rail scrolls inside itself: pinned and taller than the viewport, its
 * lower panels would otherwise sit permanently below the fold and never be
 * reachable — the right rail runs to about 1700px against a 900px window.
 *
 * Everything here is derived from what the site actually holds. There is no
 * "trending" in the analytics sense — no per-post views are recorded — so
 * "popular" means how often something appears in the posts themselves, and the
 * panel says so. The alternative was a leaderboard of invented numbers.
 */

const STOPWORDS = new Set(
  ("the a an and or but of to in on for with from by at as is are was were be been it its this that these those " +
   "not no than then so if into over under about after before more most less least new now still just what which " +
   "who whom whose how why when where all any some each every other another one two three has have had do does did " +
   "can could will would should may might must not you your we our they their he she his her them us i me my " +
   "up down out off again very much many few first last next own same too also here there while against between " +
   "through during without within across per via vs mostly already yet get got make makes made say says said")
    .split(" "),
);

/**
 * Keywords are the words that actually recur in the titles and standfirsts —
 * counted, not curated. Short words, digits and a stopword list are dropped;
 * everything surviving is a word the feed genuinely keeps using.
 */
function keywordsOf(items: Post[], limit = 14): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of items) {
    const words = `${p.title} ${p.dek}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/);
    const seen = new Set<string>(); // once per post, so one wordy post cannot dominate
    for (const w of words) {
      if (w.length < 4 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
      if (seen.has(w)) continue;
      seen.add(w);
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

/* ============================ left ============================ */

export function LeftRail({
  items,
  topic,
  setTopic,
  media,
  setMedia,
}: {
  items: Post[];
  topic: PostTopic | null;
  setTopic: (t: PostTopic | null) => void;
  media: boolean;
  setMedia: (v: boolean) => void;
}) {
  return (
    <aside className="fa-rail sticky top-5 hidden max-h-[calc(100dvh-44px)] w-[300px] shrink-0 self-start overflow-y-auto px-5 py-6 [scrollbar-width:none] min-[680px]:py-8 min-[1080px]:block [&::-webkit-scrollbar]:hidden">
      <nav className="flex flex-col gap-0.5">
        <RailItem
          label="All posts"
          count={items.length}
          active={topic === null && !media}
          onClick={() => {
            setTopic(null);
            setMedia(false);
          }}
        />
        <RailItem
          label="Media"
          count={items.filter((p) => p.kind === "video").length}
          active={media}
          onClick={() => {
            setTopic(null);
            setMedia(!media);
          }}
        />
        {TOPIC_ORDER.map((t) => (
          <RailItem
            key={t}
            label={t}
            count={items.filter((p) => p.topics.includes(t)).length}
            active={topic === t}
            onClick={() => {
              setMedia(false);
              setTopic(topic === t ? null : t);
            }}
          />
        ))}
      </nav>

      <SignUp />
    </aside>
  );
}

/* ============================ right ============================ */

/**
 * Twitter's right-column behaviour: the rail scrolls away with the page until
 * its last panel is fully in view, then pins there while the feed keeps going.
 *
 * `position: sticky` alone can't do it, because sticky pins at a fixed offset
 * and this offset depends on how tall the rail is. So: when the rail is taller
 * than the viewport, park it at a NEGATIVE top of (viewport − rail height) —
 * the rail scrolls up by exactly its overhang and then stops with its foot on
 * the bottom edge. When it is shorter than the viewport there is no overhang to
 * absorb, so it simply pins near the top like the left rail.
 */
function useStickyFoot<T extends HTMLElement>(gap = 20) {
  const ref = useRef<T>(null);
  const [top, setTop] = useState(gap);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const overhang = el.offsetHeight + gap * 2 - window.innerHeight;
      setTop(overhang > 0 ? gap - overhang : gap);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gap]);

  return { ref, top };
}

export function RightRail({
  latest,
  projects,
  all,
}: {
  latest: Post[];
  projects: Project[];
  all: Post[];
}) {
  const { ref, top } = useStickyFoot<HTMLElement>();
  return (
    <aside
      ref={ref}
      style={{ top }}
      className="fa-rail-b sticky hidden w-[300px] shrink-0 self-start px-5 py-6 min-[680px]:py-8 min-[1320px]:block"
    >
      <JustIn latest={latest} />
      <ProjectPicks projects={projects} />
      <PopularTags all={all} />
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
      <RailHeading>Recent projects</RailHeading>
      <ul className="mt-3 flex flex-col gap-7">
        {projects.map((pr) => (
          <li key={pr.id}>
            <Link href={pr.path ?? pr.url ?? "/projects"} className="group block">
              {pr.image ? (
                <span className="block overflow-hidden rounded-[3px] border border-ink/[0.12]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static asset, no optimiser needed at this size */}
                  <img
                    src={pr.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>
              ) : (
                <span className="fa-hatch block aspect-[16/9] rounded-[3px] border border-ink/[0.12]" />
              )}
              <span className="mt-2 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                {pr.field}
              </span>
              <span className="mt-0.5 block text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
                {pr.title}
              </span>
              {/* no `block` here: line-clamp needs display:-webkit-box, and a
                  display utility alongside it silently cancels the clamp */}
              <span className="mt-1 line-clamp-[7] pb-1 font-mono text-[11px] leading-[1.5] text-graphite">
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
    <Panel className="mt-7">
      <RailHeading>Join us for updates</RailHeading>
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
          {state === "error" && (
            <p className="mt-2 font-mono text-[10px] text-accent-deep">{message}</p>
          )}
        </>
      )}
    </Panel>
  );
}

function PopularTags({ all }: { all: Post[] }) {
  const tags = TOPIC_ORDER.map((t) => [t, all.filter((p) => p.topics.includes(t)).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const keywords = keywordsOf(all);
  const maxTag = tags[0]?.[1] ?? 1;

  return (
    <Panel className="mt-5">
      <RailHeading>Popular tags</RailHeading>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {tags.map(([t, n]) => (
          <li key={t}>
            <span
              className="inline-flex items-baseline gap-1.5 rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{
                // weight by share, so the eye sorts them before the numbers do
                background: `color-mix(in oklab, var(--accent) ${8 + Math.round((n / maxTag) * 18)}%, transparent)`,
                color: "var(--text)",
              }}
            >
              {t}
              <span className="tabular-nums text-faint">{n}</span>
            </span>
          </li>
        ))}
      </ul>

      <RailHeading className="mt-6">Keywords</RailHeading>
      <p className="mt-1.5 font-mono text-[9.5px] leading-[1.5] text-faint">
        Words the feed keeps coming back to, counted across every title and
        standfirst.
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
        {keywords.map(([w, n]) => (
          <li key={w} className="font-mono text-[11px] text-graphite">
            {w}
            <span className="ml-1 text-[9.5px] tabular-nums text-faint">{n}</span>
          </li>
        ))}
      </ul>
    </Panel>
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
