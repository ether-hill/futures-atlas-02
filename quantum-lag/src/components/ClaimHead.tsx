"use client";

import type { Claim } from "@/content/types";
import type { Mode } from "@/lib/run";

/*
  Everything above the timeline, shared by the placement screen and the reveal.

  It is one component because it has to render identically on both: the whole
  point of the fixed 1900–2060 scale is that the line does not move when the
  claim is committed, and a line cannot hold still if the block above it changes
  height. Same progress, same meta row, same eyebrow slot, same title at the
  same size and measure.

  Anything that differs between the two screens belongs below the line.
*/

type Props = {
  claim: Claim;
  index: number;
  total: number;
  mode: Mode;
  /** One line, the same height on both screens. */
  eyebrow: string;
};

export function ClaimHead({ claim, index, total, mode, eyebrow }: Props) {
  return (
    <>
      <div className="ql-progress" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`ql-progress__seg ${
              i < index
                ? "ql-progress__seg--done"
                : i === index
                  ? "ql-progress__seg--now"
                  : ""
            }`}
          />
        ))}
      </div>

      <div className="ql-meta-row">
        <span className="ql-label">
          Claim {String(index + 1).padStart(2, "0")} / {total}
        </span>
        <span className="ql-label">
          {mode === "guided" ? "Guided run" : "Study run"}
        </span>
      </div>

      <div className="ql-claim-head">
        <p className="ql-eyebrow">{eyebrow}</p>
        <h1 className="ql-question">{claim.claim}</h1>
      </div>
    </>
  );
}
