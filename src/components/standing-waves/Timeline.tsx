"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lane, Person, Source, Status, TimelineEvent } from "@/data/standing-waves/types";
import { LANE_LABEL, LANE_ORDER, STATUS_LABEL, STATUS_ORDER, SW_BASE } from "@/data/standing-waves/meta";

const ROLE_LABEL = { claim: "Claim", test: "Test", result: "Result" } as const;

/**
 * The chronology. One ordered list, two layouts: a vertical column under
 * 1024px, a horizontal track with a scrubber above it from 1024px. Same
 * elements in both, so a deep link, a filter or a keyboard path works the same
 * way whichever one you are looking at.
 */
export function Timeline({
  events,
  people,
  sources,
  articles,
}: {
  events: TimelineEvent[];
  people: Record<string, Pick<Person, "id" | "name">>;
  sources: Record<string, Source>;
  articles: Record<string, string>; // slug → title
}) {
  const [lanes, setLanes] = useState<Set<Lane>>(new Set());
  const [statuses, setStatuses] = useState<Set<Status>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [pos, setPos] = useState(0);

  const shown = useMemo(
    () => events.filter((e) => (lanes.size === 0 || lanes.has(e.lane)) && (statuses.size === 0 || statuses.has(e.status))),
    [events, lanes, statuses],
  );
  const thread = useMemo(() => events.filter((e) => e.thread === "double-slit"), [events]);
  const presentStatuses = STATUS_ORDER.filter((s) => events.some((e) => e.status === s));

  const toggle = <T,>(set: Set<T>, v: T, put: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    put(next);
  };

  /** Bring an event into view in whichever layout is active, clearing any filter that hides it. */
  const reveal = useCallback(
    (id: string) => {
      const ev = events.find((e) => e.id === id);
      if (!ev) return;
      if ((lanes.size && !lanes.has(ev.lane)) || (statuses.size && !statuses.has(ev.status))) {
        setLanes(new Set());
        setStatuses(new Set());
      }
      setOpen(id);
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "start" });
        el.focus({ preventScroll: true });
      });
    },
    [events, lanes, statuses],
  );

  // #event-id deep links, on load and on hash change.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) reveal(id);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrubber ↔ track. The scrubber is an index over the visible events: time
  // is far too uneven (1680 … 1850 … 2005–2025) for a proportional axis to be
  // anything but a crush at the right-hand end.
  const onTrackScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    setPos(max > 0 ? Math.round((t.scrollLeft / max) * Math.max(0, shown.length - 1)) : 0);
  };
  const onScrub = (i: number) => {
    setPos(i);
    const ev = shown[i];
    const el = ev && document.getElementById(ev.id);
    const t = trackRef.current;
    if (el && t) t.scrollTo({ left: el.offsetLeft - t.offsetLeft, behavior: "auto" });
  };

  return (
    <div>
      {/* ---- the double-slit thread ---- */}
      {thread.length > 0 && (
        <section aria-labelledby="sw-thread-h" className="sw-thread mb-10 pl-5">
          <h2 id="sw-thread-h" className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            The double-slit thread · claim → test → result
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {thread.map((e) => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    history.replaceState(null, "", `#${e.id}`);
                    reveal(e.id);
                  }}
                  className="sw-focus block h-full border border-ink/15 p-3 hover:border-ink"
                  data-lane={e.lane}
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep">
                    {e.threadRole ? ROLE_LABEL[e.threadRole] : ""} · {e.year}
                  </span>
                  <span className="mt-1 block text-[14px] font-semibold leading-snug text-ink">{e.title}</span>
                  <span className="mt-2 inline-flex">
                    <span className="sw-badge" data-status={e.status}>{STATUS_LABEL[e.status]}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---- filters ---- */}
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Lane</legend>
          <div className="flex flex-wrap gap-2">
            {LANE_ORDER.map((l) => (
              <button
                key={l}
                type="button"
                className="sw-chip"
                data-lane={l}
                aria-pressed={lanes.has(l)}
                onClick={() => toggle(lanes, l, setLanes)}
              >
                <span className="sw-dot" aria-hidden="true" />
                {LANE_LABEL[l]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Status</legend>
          <div className="flex flex-wrap gap-2">
            {presentStatuses.map((s) => (
              <button
                key={s}
                type="button"
                className="sw-chip"
                aria-pressed={statuses.has(s)}
                onClick={() => toggle(statuses, s, setStatuses)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            {(lanes.size > 0 || statuses.size > 0) && (
              <button
                type="button"
                className="sw-chip"
                onClick={() => {
                  setLanes(new Set());
                  setStatuses(new Set());
                }}
              >
                Clear
              </button>
            )}
          </div>
        </fieldset>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite" aria-live="polite">
          {shown.length} of {events.length} events
        </p>
      </div>

      {/* ---- scrubber (≥1024px) ---- */}
      {shown.length > 1 && (
        <div className="mt-8 hidden lg:block">
          <label htmlFor="sw-scrub" className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            Scrub · {shown[pos]?.year ?? ""}
          </label>
          <input
            id="sw-scrub"
            type="range"
            className="sw-range"
            min={0}
            max={shown.length - 1}
            value={Math.min(pos, shown.length - 1)}
            onChange={(e) => onScrub(Number(e.target.value))}
            aria-valuetext={shown[pos] ? `${shown[pos]!.year}: ${shown[pos]!.title}` : undefined}
          />
          <div className="flex justify-between font-mono text-[11px] text-graphite" aria-hidden="true">
            <span>{shown[0]?.year}</span>
            <span>{shown[shown.length - 1]?.year}</span>
          </div>
        </div>
      )}

      {/* ---- the events ---- */}
      <ol
        ref={trackRef}
        onScroll={onTrackScroll}
        className="sw-scrub mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5 lg:overflow-x-auto lg:pb-6"
      >
        {shown.map((e) => {
          const i = thread.indexOf(e);
          return (
            <li
              key={e.id}
              id={e.id}
              tabIndex={-1}
              data-lane={e.lane}
              className="sw-event relative flex border border-ink/15 bg-panel lg:w-[340px] lg:flex-none"
            >
              <span className="sw-event__rail w-1 flex-none" aria-hidden="true" />
              <article className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[12px] tracking-[0.06em] text-ink">
                    {e.dateLabel ?? e.year}
                  </span>
                  <span className="sw-badge" data-status={e.status}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
                  <span className="sw-dot" aria-hidden="true" />
                  {LANE_LABEL[e.lane]}
                  {i >= 0 && e.threadRole ? ` · double slit ${i + 1}/${thread.length}: ${ROLE_LABEL[e.threadRole]}` : ""}
                </p>
                <h3 className="text-[17px] font-bold leading-snug text-ink">{e.title}</h3>
                <p className="text-[14.5px] leading-[1.65] text-ink-70">{e.finding}</p>
                <details
                  className="sw-expand"
                  open={open === e.id}
                  onToggle={(ev) => {
                    const isOpen = (ev.currentTarget as HTMLDetailsElement).open;
                    if (isOpen) setOpen(e.id);
                    else if (open === e.id) setOpen(null);
                  }}
                >
                  <summary className="sw-focus inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink">
                    <span className="sw-caret" aria-hidden="true">›</span> Detail and sources
                  </summary>
                  <div className="mt-2 flex flex-col gap-3 text-[13.5px] leading-[1.65] text-ink-70">
                    {e.detail && <p>{e.detail}</p>}
                    {e.people.length > 0 && (
                      <p>
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">People · </span>
                        {e.people.map((pid, k) => (
                          <span key={pid}>
                            {k > 0 ? ", " : ""}
                            <Link className="underline underline-offset-4 hover:text-accent" href={`${SW_BASE}/people/${pid}`}>
                              {people[pid]?.name ?? pid}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    <ul className="flex flex-col gap-2">
                      {e.sourceIds.map((sid) => {
                        const s = sources[sid];
                        if (!s) return null;
                        return (
                          <li key={sid} className="break-words">
                            <a href={s.url} className="underline underline-offset-4 hover:text-accent" rel="noopener">
                              {s.citation}
                            </a>
                            {!s.verified && <span className="ml-1 font-mono text-[10.5px] uppercase text-graphite">(not yet verified)</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {e.relatedArticle && articles[e.relatedArticle] && (
                      <Link
                        href={`${SW_BASE}/read/${e.relatedArticle}`}
                        className="self-start border-b border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink"
                      >
                        Read: {articles[e.relatedArticle]} →
                      </Link>
                    )}
                    <a href={`#${e.id}`} className="self-start font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite hover:text-ink">
                      Link to this event
                    </a>
                  </div>
                </details>
              </article>
            </li>
          );
        })}
      </ol>
      {shown.length === 0 && <p className="mt-6 text-[14px] text-ink-70">Nothing matches those filters.</p>}
    </div>
  );
}
