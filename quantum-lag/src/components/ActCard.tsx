"use client";

import type { ActMeta } from "@/content/types";

const NUMERAL = ["", "One", "Two", "Three", "Four"] as const;

type Props = {
  act: ActMeta;
  /** Shown at the end of the previous act, handing over to this one. */
  handover?: string;
  onContinue: () => void;
};

export function ActCard({ act, handover, onContinue }: Props) {
  return (
    <section className="ql-screen">
      <div className="ql-shell ql-screen__body">
        <div className="ql-act">
          {handover && <p className="ql-act__handover">{handover}</p>}

          <span className="ql-label ql-label--wide">Act {NUMERAL[act.act]}</span>
          <h1 className="ql-act__title">{act.title}</h1>
          <p className="ql-act__premise">{act.premise}</p>

          <div className="ql-cta-row" style={{ marginTop: "var(--space-5)" }}>
            <button
              type="button"
              className="ql-btn ql-btn--primary"
              onClick={onContinue}
              autoFocus
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
