import type { TimelineEvent } from "@/data/hegemony";
import { Reveal } from "@/components/Reveal";

/**
 * The same twenty-five events, arranged so the page has a pulse.
 *
 * v1's timeline is a strict two-column weave: releases left, findings and
 * responses right, every card the same size. It is precise, and it reads as a
 * ledger — twenty-five identical boxes, and the eye slides off.
 *
 * Here the events are still in date order and still colour-coded by strand,
 * but they are sized by what they are, so scale carries meaning instead of
 * being uniform:
 *
 *   • a model shipping is a beat — small, terse, close to the spine;
 *   • a peer-reviewed finding is the loud thing on the page — set large,
 *     pushed out from the rail, given its own measure;
 *   • a response sits between the two.
 *
 * The indents cycle through a fixed set rather than alternating, so the column
 * never settles into a readable zigzag — that is the variance doing the work.
 * They are literals, not random: the same page has to come back on every
 * render, and Math.random() would mean a server/client mismatch.
 *
 * Each row reveals on scroll through the site's shared Reveal wrapper, which
 * already honours prefers-reduced-motion (globals.css forces [data-reveal]
 * visible). The stagger is capped, or the last rows of a long run sit blank
 * for most of a second after they are already on screen.
 */

const STRAND_LABEL: Record<TimelineEvent["strand"], string> = {
  release: "Model shipped",
  finding: "Finding published",
  response: "Response",
};

/** How loud each kind of event is. */
const SCALE: Record<TimelineEvent["strand"], string> = {
  release: "text-[16px] leading-[1.4] tracking-[-0.01em]",
  response: "text-[clamp(17px,1.9vw,21px)] leading-[1.35] tracking-[-0.015em]",
  finding: "text-[clamp(20px,2.8vw,32px)] leading-[1.2] tracking-[-0.025em]",
};

/** How far each kind sits from the spine, before the per-row cycle. */
const BASE_INDENT: Record<TimelineEvent["strand"], number> = {
  release: 0,
  response: 24,
  finding: 44,
};

/** Broken deliberately — a repeating pattern would read as a zigzag. */
const INDENT_CYCLE = [0, 18, 6, 30, 12, 0, 22];

const MEASURE: Record<TimelineEvent["strand"], string> = {
  release: "max-w-[46ch]",
  response: "max-w-[52ch]",
  finding: "max-w-[38ch]",
};

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!m) return y;
  return d ? `${Number(d)} ${months[Number(m) - 1]} ${y}` : `${months[Number(m) - 1]} ${y}`;
}

export function TimelineV2({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative mt-10 border-l border-ink/[0.16] pl-6 min-[720px]:pl-10">
      {events.map((e, i) => {
        const indent = BASE_INDENT[e.strand] + INDENT_CYCLE[i % INDENT_CYCLE.length];
        const loud = e.strand === "finding";

        // A release is one line — date, title, source, all on the baseline.
        // Thirteen of them stacked as full rows is what turned this section
        // into five thousand pixels of ledger; as beats they take a fifth of
        // that and the asymmetry the section is about becomes visible
        // instead of merely asserted.
        if (!loud) {
          return (
            <Reveal
              as="li"
              key={e.id}
              delay={Math.min(i, 6) * 60}
              className="relative py-[7px]"
            >
              <span
                aria-hidden
                className="absolute -left-6 top-1/2 -ml-[2px] block h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-ink/30 min-[720px]:-left-10"
              />
              <div
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                style={{ marginLeft: `${indent}px` }}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                  {formatDate(e.date)}
                </span>
                <span className={`font-medium text-ink/85 ${SCALE[e.strand]}`}>{e.title}</span>
                <a
                  href={e.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/35 underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
                >
                  {e.source.name} ↗
                </a>
              </div>
            </Reveal>
          );
        }

        return (
          <Reveal
            as="li"
            key={e.id}
            delay={Math.min(i, 6) * 60}
            className="relative py-6 min-[720px]:py-8"
          >
            {/* the node on the spine */}
            <span
              aria-hidden
              className="absolute -left-6 top-[18px] -ml-[4px] block h-[9px] w-[9px] rounded-full bg-accent min-[720px]:-left-10"
            />

            <div style={{ marginLeft: `${indent}px` }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                {formatDate(e.date)}{" "}
                <span className="text-accent-deep">· {STRAND_LABEL[e.strand]}</span>
              </p>

              <h3 className={`mt-2 font-medium text-ink ${SCALE[e.strand]} ${MEASURE[e.strand]}`}>
                {e.title}
              </h3>

              {/* Detail only on the loud ones. Every event carrying a paragraph
                  is exactly what made v1's version a ledger. */}
              <p className="mt-3 max-w-[62ch] text-[14.5px] leading-[1.7] text-ink/70">
                {e.detail}
              </p>

              <a
                href={e.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40 underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
              >
                {e.source.name} ↗
              </a>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
