"use client";

import { ClaimHead } from "./ClaimHead";
import { RevealChart } from "./RevealChart";
import { Story } from "./Story";
import type { Claim } from "@/content/types";
import type { Mode } from "@/lib/run";
import { scoreClaim, type Verdict } from "@/lib/scoring";

/*
  The reveal.

  Everything above the line is the placement screen, unchanged: same head, same
  slot, same fixed scale. Committing the claim moves nothing on screen. The pin
  slides to the record, and the verdict and the story arrive underneath.
*/

type Props = {
  claim: Claim;
  index: number;
  total: number;
  mode: Mode;
  placed: number;
  record: { lag: number; leap: number; inside: number };
  onNext: () => void;
  isLast: boolean;
};

/**
 * A sentence about the gap between the law and the science, computed from the
 * claim's own numbers. Nothing here is asserted that is not arithmetic on the
 * cited dates.
 */
function consequence(claim: Claim): string | null {
  const policy = claim.policy?.[0];
  if (!policy) return null;

  if (claim.status.kind === "expected" && claim.status.range) {
    const [lo, hi] = claim.status.range;
    const mid = Math.round((lo + hi) / 2);
    const toEarliest = lo - policy.year;
    const toMiddle = mid - policy.year;
    if (toEarliest > 0) {
      return `The law is already fixed. The science is not. The deadline falls ${toEarliest} ${toEarliest === 1 ? "year" : "years"} before the earliest date any expert expects this, and ${toMiddle} before the middle of their estimate.`;
    }
    return "The deadline falls inside the window experts give this, which means the law assumes the machine may arrive before the migration is finished.";
  }

  return null;
}

export function Reveal({
  claim,
  index,
  total,
  mode,
  placed,
  record,
  onNext,
  isLast,
}: Props) {
  const verdict: Verdict = scoreClaim(claim, placed);
  const line = consequence(claim);

  return (
    <section className="ql-screen ql-screen--claim">
      <div className="ql-shell ql-screen__body">
        <ClaimHead
          claim={claim}
          index={index}
          total={total}
          mode={mode}
          eyebrow="Where it actually sits"
        />

        {/* Same slot, same offset, same scale. The line does not move. */}
        <div className="ql-line-slot">
          <RevealChart claim={claim} verdict={verdict} />
        </div>

        <div className="ql-verdict">
          <span className="ql-label ql-label--accent">{verdict.label}</span>
          <p className="ql-verdict__sentence">{verdict.sentence}</p>
          {claim.status.kind === "disputed" && claim.status.note && (
            <p className="ql-verdict__note">
              Recorded, but contested: {claim.status.note}.
            </p>
          )}
        </div>

        {/* One sentence, politely, for anyone not seeing the drawing. */}
        <p aria-live="polite" className="ql-sr">
          {verdict.sentence}
        </p>

        <Story claim={claim} lead={line} />

        <div className="ql-footer-row">
          <p className="ql-label">
            Running record · {record.lag} too late · {record.leap} too early ·{" "}
            {record.inside} inside range
          </p>
          <button
            type="button"
            className="ql-btn ql-btn--primary"
            onClick={onNext}
          >
            {isLast ? "See the result" : `Next claim · ${index + 2} of ${total}`}
          </button>
        </div>
      </div>
    </section>
  );
}
