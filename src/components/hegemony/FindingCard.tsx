"use client";

/**
 * A finding, and the thing that makes it citable.
 *
 * The card shows claim, figure and tier. The SCOPE and the source live behind
 * one click — not because they are secondary, but because putting them inline
 * on 57 cards makes a wall nobody reads, and burying them in a footnote at the
 * foot of the page makes a link nobody follows. One interaction, in place.
 *
 * The scope line is rendered FIRST in the open state, above the source. It is
 * the correction this report exists to make, so it gets the position that says
 * so.
 */

import { useId, useState } from "react";
import type { Finding } from "@/data/hegemony";
import { TIER_LABEL } from "@/data/hegemony";

const tierClass: Record<Finding["tier"], string> = {
  documented: "border-accent/45 text-accent-deep",
  reported: "border-ink/25 text-ink/70",
  emergent: "border-ink/20 text-ink/55",
};

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
        {finding.figure && (
          <span className="font-mono text-[15px] font-bold tracking-tight text-accent-deep">
            {finding.figure}
          </span>
        )}
      </div>

      <h3 className="mt-4 text-[17px] font-medium leading-[1.35] tracking-[-0.015em] text-ink">
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
