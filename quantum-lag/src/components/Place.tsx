"use client";

import { Axis } from "./Axis";
import { ClaimHead } from "./ClaimHead";
import type { Claim } from "@/content/types";
import type { Mode } from "@/lib/run";

type Props = {
  claim: Claim;
  index: number;
  total: number;
  draft: number | null;
  mode: Mode;
  onDraft: (year: number) => void;
  onCommit: () => void;
};

export function Place({
  claim,
  index,
  total,
  draft,
  mode,
  onDraft,
  onCommit,
}: Props) {
  return (
    <section className="ql-screen ql-screen--claim">
      <div className="ql-shell ql-screen__body">
        <ClaimHead
          claim={claim}
          index={index}
          total={total}
          mode={mode}
          eyebrow="When does this become true?"
        />

        {/* The line sits at a fixed offset, identical to the reveal's. */}
        <div className="ql-line-slot">
          <Axis value={draft} onChange={onDraft} onCommit={onCommit} />
        </div>

        {/* Guided mode shows the reasoning prompt where one is written. It never
            states a date, enforced by test rather than by discipline. It sits
            below the line so it cannot move the line. */}
        {mode === "guided" && claim.prompt && (
          <p className="ql-lead" style={{ marginTop: "var(--space-5)" }}>
            {claim.prompt}
          </p>
        )}

        <div className="ql-footer-row">
          <p className="ql-label">
            {draft === null
              ? "Drag anywhere on the line."
              : "Adjust it, or place it."}
          </p>
          <button
            type="button"
            className="ql-btn ql-btn--primary"
            disabled={draft === null}
            onClick={onCommit}
          >
            Place it
          </button>
        </div>
      </div>
    </section>
  );
}
