"use client";

/**
 * Releases against findings, on one spine.
 *
 * Adapted from AI Rapture's reports/timeline-zigzag, with its two useful ideas
 * kept and its decoration dropped: the rail is drawn through MEASURED node
 * positions rather than assumed ones (so it can never drift out of step with
 * the cards), and it draws in on scroll. What is not kept is the alternating
 * left/right weave — here the side carries meaning. Releases sit left,
 * findings and responses right, so the reader can see the cadence gap without
 * reading a word: models ship in weeks, the research answering them lands in
 * months.
 *
 * On a phone both strands collapse to a single left rail, since two columns of
 * 300px cards is not a timeline, it is a mess.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TimelineEvent } from "@/data/hegemony";

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

const STRAND_LABEL: Record<TimelineEvent["strand"], string> = {
  release: "Model shipped",
  finding: "Finding published",
  response: "Response",
};

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!m) return y;
  return d ? `${Number(d)} ${months[Number(m) - 1]} ${y}` : `${months[Number(m) - 1]} ${y}`;
}

export function FeedbackTimeline({ events }: { events: TimelineEvent[] }) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const railRef = useRef<SVGLineElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [railX, setRailX] = useState(0);

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
  }, [events.length]);

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

  return (
    <div ref={boxRef} className="relative mt-10">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={dims.w || undefined}
        height={dims.h || undefined}
      >
        <line x1={railX} y1={0} x2={railX} y2={dims.h} stroke="var(--ink)" strokeOpacity={0.14} strokeWidth={1} />
        <line
          ref={railRef}
          x1={railX}
          y1={0}
          x2={railX}
          y2={dims.h}
          stroke="var(--accent)"
          strokeWidth={2}
        />
      </svg>

      <ol className="relative m-0 list-none p-0">
        {events.map((e, i) => {
          const isRelease = e.strand === "release";
          return (
            /* The ROW is full width so the node can sit on the container's
               centre line; the card inside it takes the side and the width.
               Anchoring the node to the card instead put the two strands 8%
               apart, because 46%-wide cards meet the middle from opposite
               directions. */
            <li key={e.id} className="relative pb-9 min-[900px]:pb-10">
              <span
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                aria-hidden
                /* Both strands pin their node to the SAME x — the centre of the
                   row — rather than to their own card's inner edge. The cards
                   are 46% each side, so anchoring to the card edges put the
                   two strands 8% apart and dropped the right-hand node onto
                   its own date line. The rail is measured from these, so it
                   follows whatever this resolves to. */
                className={`absolute left-0 top-[6px] z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-surface ${
                  isRelease ? "bg-ink/45" : "bg-accent"
                } min-[900px]:left-1/2`}
              />
              <div
                className={`pl-9 min-[900px]:pl-0 ${
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
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
