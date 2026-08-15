"use client";

/**
 * Releases against findings, on one spine.
 *
 * The side carries meaning: releases sit left, findings and responses right,
 * so the cadence gap is visible without reading a word — models ship in weeks,
 * the research answering them lands in months. On a phone both strands
 * collapse to a single left rail, since two columns of 300px cards is not a
 * timeline, it is a mess.
 *
 * ── What makes the shape argue, rather than just list ───────────────────────
 *
 * Three things, all computed from the events themselves and none of them
 * decoration:
 *
 *  1. **Vertical space is elapsed time.** A fixed row height renders six years
 *     of lopsided cadence as a tidy ladder, which is the one thing this
 *     section is trying to disprove. Gaps are proportional to the days between
 *     consecutive events — clamped at both ends, and SAID to be clamped in the
 *     caption, because an unlabelled distorted axis is its own small lie.
 *  2. **A cadence bar per year**, releases against research. It is a count of
 *     the events below it and nothing else, so it cannot disagree with them.
 *  3. **Strand filtering.** Isolating the releases and watching the spine
 *     empty out is the argument in one gesture. The chips carry the counts.
 *
 * The rail is drawn through MEASURED node positions rather than assumed ones,
 * so it cannot drift out of step with the cards, and it draws in on scroll.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/data/report-types";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(m.matches);
    const h = () => setReduce(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return reduce;
}

type Strand = TimelineEvent["strand"];

const STRAND_LABEL: Record<Strand, string> = {
  release: "Model shipped",
  finding: "Finding published",
  response: "Response",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  if (!m) return y;
  return d ? `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}` : `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Days since epoch. `YYYY-MM` is read as the first of that month, as it is stored. */
function dayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000;
}

/* ── the cadence bar ─────────────────────────────────────────────────────── */

/**
 * Releases against research, per year. Purely a tally of the events on this
 * page — if an event is added below, this moves with it.
 */
function Cadence({ events, onPick }: { events: TimelineEvent[]; onPick: (year: string) => void }) {
  const years = useMemo(() => {
    const acc = new Map<string, { shipped: number; research: number }>();
    for (const e of events) {
      const y = e.date.slice(0, 4);
      const row = acc.get(y) ?? { shipped: 0, research: 0 };
      if (e.strand === "release") row.shipped++;
      else row.research++;
      acc.set(y, row);
    }
    return [...acc.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const tallest = Math.max(...years.map(([, r]) => Math.max(r.shipped, r.research)), 1);

  return (
    <figure className="m-0 border border-ink/[0.14] bg-surface p-5 min-[680px]:p-6">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55">
          Cadence, by year
        </span>
        <span className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="h-2 w-2 bg-ink/45" /> Shipped
          </span>
          <span className="flex items-center gap-1.5">
            <i aria-hidden className="h-2 w-2" style={{ background: "var(--accent)" }} /> Research &amp; response
          </span>
        </span>
      </figcaption>

      <div className="mt-5 flex items-end gap-2 min-[680px]:gap-3">
        {years.map(([year, r]) => (
          <button
            key={year}
            type="button"
            onClick={() => onPick(year)}
            className="group flex flex-1 flex-col items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Jump to ${year}: ${r.shipped} shipped, ${r.research} research and responses`}
          >
            <span className="flex h-[74px] w-full items-end justify-center gap-1">
              <i
                aria-hidden
                className="w-1/2 bg-ink/45 transition-[height] duration-500"
                style={{ height: `${(r.shipped / tallest) * 100}%` }}
              />
              <i
                aria-hidden
                className="w-1/2 transition-[height] duration-500"
                style={{ height: `${(r.research / tallest) * 100}%`, background: "var(--accent)" }}
              />
            </span>
            <span className="font-mono text-[10px] tracking-[0.08em] text-ink/45 group-hover:text-accent-deep">
              {year}
            </span>
          </button>
        ))}
      </div>
    </figure>
  );
}

/* ── the spine ───────────────────────────────────────────────────────────── */

/** Elapsed days become vertical space, within bounds that keep it readable. */
const GAP_MIN = 26;
const GAP_MAX = 132;
const GAP_PER_DAY = 0.42;
/** Clear air a year marker needs above the node it labels. */
const YEAR_ROOM = 22;

export function FeedbackTimeline({ events }: { events: TimelineEvent[] }) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const railRef = useRef<SVGLineElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [railX, setRailX] = useState(0);
  const [only, setOnly] = useState<Strand | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());

  const counts = useMemo(() => {
    const c: Record<Strand, number> = { release: 0, finding: 0, response: 0 };
    for (const e of events) c[e.strand]++;
    return c;
  }, [events]);

  const shown = useMemo(
    () => (only ? events.filter((e) => e.strand === only) : events),
    [events, only],
  );

  // Measure where the nodes actually landed, and put the rail through them.
  useLayoutEffect(() => {
    const measure = () => {
      const box = boxRef.current;
      if (!box) return;
      const b = box.getBoundingClientRect();
      const first = nodeRefs.current.find(Boolean);
      if (first) {
        const r = first.getBoundingClientRect();
        setRailX(r.left + r.width / 2 - b.left);
      }
      setDims({ w: b.width, h: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    // Re-measure once webfonts settle — card heights move every node.
    const t = window.setTimeout(measure, 350);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [shown.length]);

  // The rail draws in as the section passes through the viewport.
  useEffect(() => {
    const line = railRef.current;
    if (!line) return;
    if (reduce) {
      line.style.strokeDashoffset = "0";
      return;
    }
    let raf = 0;
    const update = () => {
      const box = boxRef.current;
      if (!box || !line) return;
      const r = box.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.7)));
      line.style.strokeDasharray = String(dims.h);
      line.style.strokeDashoffset = String(dims.h * (1 - prog));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduce, dims.h]);

  // Each entry rises once as it arrives. Once revealed it stays revealed —
  // re-animating on the way back up reads as a glitch, not as a flourish.
  useEffect(() => {
    if (reduce) {
      setSeen(new Set(events.map((e) => e.id)));
      return;
    }
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(
      (entries) => {
        const arrived = entries.filter((e) => e.isIntersecting).map((e) => (e.target as HTMLElement).dataset.ev!);
        if (arrived.length) setSeen((prev) => new Set([...prev, ...arrived]));
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    box.querySelectorAll("[data-ev]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduce, shown, events]);

  const jumpToYear = (year: string) => {
    const target = shown.find((e) => e.date.startsWith(year)) ?? events.find((e) => e.date.startsWith(year));
    if (!target) return;
    boxRef.current
      ?.querySelector(`[data-ev="${target.id}"]`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  const chip = (value: Strand | null, label: string, n: number) => (
    <button
      key={label}
      type="button"
      onClick={() => setOnly(value)}
      aria-pressed={only === value}
      className={`rounded-[2px] border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
        only === value
          ? "border-accent bg-accent/10 text-accent-deep"
          : "border-ink/20 text-ink/60 hover:border-ink/45 hover:text-ink"
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{n}</span>
    </button>
  );

  return (
    <div className="mt-9">
      <Cadence events={events} onPick={jumpToYear} />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {chip(null, "All", events.length)}
        {chip("release", STRAND_LABEL.release, counts.release)}
        {chip("finding", STRAND_LABEL.finding, counts.finding)}
        {chip("response", STRAND_LABEL.response, counts.response)}
      </div>

      <div ref={boxRef} className="relative mt-8">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          width={dims.w || undefined}
          height={dims.h || undefined}
        >
          <line x1={railX} y1={0} x2={railX} y2={dims.h} stroke="var(--ink)" strokeOpacity={0.14} strokeWidth={1} />
          <line ref={railRef} x1={railX} y1={0} x2={railX} y2={dims.h} stroke="var(--accent)" strokeWidth={2} />
        </svg>

        <ol className="relative m-0 list-none p-0">
          {shown.map((e, i) => {
            const isRelease = e.strand === "release";
            const prev = shown[i - 1];
            const elapsed = prev ? dayOf(e.date) - dayOf(prev.date) : 0;
            const year = e.date.slice(0, 4);
            const newYear = !prev || prev.date.slice(0, 4) !== year;
            // A year marker needs clear air above the node it precedes, so the
            // first entry — which has no elapsed gap to sit in — is given some.
            const gap = prev
              ? Math.min(Math.max(elapsed * GAP_PER_DAY, GAP_MIN), GAP_MAX)
              : YEAR_ROOM;
            const revealed = seen.has(e.id) || reduce;

            return (
              <li
                key={e.id}
                data-ev={e.id}
                className="relative"
                style={{ paddingTop: gap, paddingBottom: 8 }}
              >
                {newYear && (
                  <span
                    aria-hidden
                    className="absolute left-0 -translate-x-1/2 bg-surface px-1 font-mono text-[10px] font-bold tracking-[0.14em] text-ink/35 min-[900px]:left-1/2"
                    style={{ top: Math.max(gap - YEAR_ROOM, 0) }}
                  >
                    {year}
                  </span>
                )}
                <span
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  aria-hidden
                  /* Both strands pin their node to the SAME x — the centre of
                     the row — rather than to their own card's inner edge. The
                     cards are 46% each side, so anchoring to the card edges put
                     the two strands 8% apart. The rail is measured from these. */
                  className={`absolute left-0 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-surface transition-all duration-500 min-[900px]:left-1/2 ${
                    isRelease ? "bg-ink/45" : e.strand === "response" ? "bg-surface" : "bg-accent"
                  } ${revealed ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  style={{
                    top: gap + 6,
                    // A response is the same colour as a finding but hollow: it
                    // is an answer to the evidence, not a new piece of it.
                    boxShadow: e.strand === "response" ? "inset 0 0 0 2px var(--accent)" : undefined,
                  }}
                />
                <div
                  className={`pl-9 transition-all duration-700 min-[900px]:pl-0 ${
                    revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  } ${
                    isRelease
                      ? "min-[900px]:w-[46%] min-[900px]:pr-10 min-[900px]:text-right"
                      : "min-[900px]:ml-auto min-[900px]:w-[46%] min-[900px]:pl-10"
                  }`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    {formatDate(e.date)} · {STRAND_LABEL[e.strand]}
                  </p>
                  <h3 className="mt-2 text-[17px] font-medium leading-[1.3] tracking-[-0.015em] text-ink">
                    {e.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-[1.65] text-ink/70">{e.detail}</p>
                  <p className="mt-2 font-mono text-[11px] text-ink/45">
                    <span className="uppercase tracking-[0.1em]">{e.dateNote}</span>
                    {" · "}
                    <a
                      href={e.source.url}
                      target="_blank"
                      rel="noopener"
                      className="text-accent-deep underline-offset-4 hover:underline"
                    >
                      {e.source.name} ↗
                    </a>
                  </p>
                  {prev && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/30">
                      {elapsed === 0 ? "Same day" : `${Math.round(elapsed)} days later`}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-ink/40">
        Vertical space is elapsed time, clamped between {GAP_MIN}px and {GAP_MAX}px so the long
        gaps stay readable. Dates given as <span className="normal-case">YYYY-MM</span> are placed
        on the first of the month, as they are stored.
      </p>
    </div>
  );
}
