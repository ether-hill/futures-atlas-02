"use client";

/**
 * A finding, and the thing that makes it citable.
 *
 * ── Order on the card ───────────────────────────────────────────────────────
 *
 * Tier and figure, then THE MARK, then the claim, then the substance, then the
 * scope behind one click. The mark sits at the top because it is the fastest
 * true thing on the card: a reader scanning a rail of twenty findings should
 * get the shape of each one before they get the sentence.
 *
 * **Every card carries something in that slot**, so a rail reads as one system
 * rather than as charts interrupted by prose. There are three states and they
 * are not interchangeable:
 *
 *  1. A `chart` — the finding's numbers, drawn. See FigureChart.
 *  2. No chart but a `figure` — the figure set typographically. Used where the
 *     headline is real but does not decompose into quantities you can draw
 *     ("unanimous", "effective 1 Sept 2025"). Drawing a bar for those would be
 *     inventing a scale.
 *  3. Neither — a plain plate saying so. Qualitative findings exist, and on
 *     several of them the ABSENCE of a number is the finding; dressing that up
 *     as a chart would be the exact move these reports criticise.
 *
 * The scope line and the source live behind one click — not because they are
 * secondary, but because putting them inline on sixty cards makes a wall
 * nobody reads, and burying them in a footnote makes a link nobody follows.
 * One interaction, in place. Scope is rendered FIRST in the open state, above
 * the source: it is the correction these reports exist to make, so it gets the
 * position that says so.
 */

import { useId, useState } from "react";
import { TIER_LABEL, type Finding } from "@/data/report-types";
import { FigureChart } from "./FigureChart";

const tierClass: Record<Finding["tier"], string> = {
  documented: "border-accent/45 text-accent-deep",
  reported: "border-ink/25 text-ink/70",
  emergent: "border-ink/20 text-ink/55",
};

/**
 * The mark slot. Always present, never faked — see the three states above.
 * Given its own inset plate so the eye finds it before the prose.
 */
function Mark({ finding }: { finding: Finding }) {
  return (
    <div className="mt-4 border border-ink/[0.1] bg-ink/[0.035] p-4 min-[680px]:p-[18px]">
      {finding.chart ? (
        <FigureChart chart={finding.chart} />
      ) : finding.figure ? (
        <div>
          <p className="font-mono text-[clamp(19px,1.5vw,24px)] font-bold leading-[1.15] tracking-[-0.02em] text-accent-deep">
            {finding.figure}
          </p>
          <p className="mt-2.5 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.12em] text-ink/45">
            The headline figure, as the source states it
          </p>
        </div>
      ) : (
        <p className="font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-ink/40">
          No figure
          <span className="mt-1.5 block normal-case tracking-[0.06em] text-ink/35">
            This finding is qualitative — nothing here is drawn from it
          </span>
        </p>
      )}
    </div>
  );
}

export function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { source } = finding;

  return (
    <article className="flex flex-col border border-ink/[0.14] bg-surface p-5 min-[680px]:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`inline-block border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tierClass[finding.tier]}`}
        >
          {TIER_LABEL[finding.tier]}
        </span>
      </div>

      <Mark finding={finding} />

      <h3 className="mt-5 text-[17px] font-medium leading-[1.35] tracking-[-0.015em] text-ink">
        {finding.claim}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.7] text-ink/70">{finding.detail}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-auto flex items-center gap-2 self-start pt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55 transition-colors hover:text-accent-deep"
      >
        <span aria-hidden className="text-[13px] leading-none">
          {open ? "−" : "+"}
        </span>
        {open ? "Hide the scope" : "Scope & source"}
      </button>

      {open && (
        <div id={panelId} className="mt-4 border-t border-ink/[0.14] pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
            What this covers
          </p>
          <p className="mt-2 text-[13px] leading-[1.65] text-ink/75">{finding.scope}</p>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
            Source
          </p>
          <p className="mt-2 text-[13px] leading-[1.6] text-ink/75">
            {source.author}
            {" · "}
            <span className="italic">{source.name}</span>
            {" · "}
            {source.published}
          </p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-block break-all font-mono text-[12px] text-accent-deep underline-offset-4 hover:underline"
          >
            {source.url} ↗
          </a>
        </div>
      )}
    </article>
  );
}
