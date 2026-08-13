"use client";

import { Axis } from "./Axis";

/*
  The opening question, before the deck proper. It teaches the axis and makes the
  point of the whole instrument in one move: four dates are defensible, and which
  one you pick depends on what you think "invented" means.

  Every date, label and link below was resolved through Crossref and checked
  against the returned title.
*/

const DEFENSIBLE: {
  year: number;
  label: string;
  source: string;
  url: string;
}[] = [
  {
    year: 1981,
    label:
      "Feynman argues that simulating quantum physics properly will take a quantum machine to do it.",
    source: "Feynman, Int. J. Theor. Phys. 21 (1982).",
    url: "https://doi.org/10.1007/bf02650179",
  },
  {
    year: 1985,
    label: "Deutsch writes down what that machine would be.",
    source: "Deutsch, Proc. R. Soc. Lond. A 400 (1985).",
    url: "https://doi.org/10.1098/rspa.1985.0070",
  },
  {
    year: 1994,
    label:
      "Shor gives it a job worth doing, and the job is breaking public-key encryption.",
    source: "Shor, Proc. 35th FOCS (1994).",
    url: "https://doi.org/10.1109/sfcs.1994.365700",
  },
  {
    year: 1998,
    label: "One runs at last. Two qubits, in a tube of liquid, at room temperature.",
    source: "Chuang, Gershenfeld and Kubinec, Phys. Rev. Lett. 80 (1998).",
    url: "https://doi.org/10.1103/physrevlett.80.3408",
  },
];

type Props = {
  placed: number | null;
  revealed: boolean;
  onDraft: (year: number) => void;
  onCommit: () => void;
  onContinue: () => void;
};

export function Opening({
  placed,
  revealed,
  onDraft,
  onCommit,
  onContinue,
}: Props) {
  return (
    <section className="ql-screen">
      <div className="ql-shell ql-screen__body">
        <p className="ql-eyebrow">Before we start</p>
        <h1 className="ql-question" style={{ maxWidth: "24ch" }}>
          In what year was the quantum computer invented?
        </h1>

        {revealed ? (
          <div style={{ marginTop: "var(--space-section)" }}>
            <div className="ql-verdict">
              <span className="ql-label ql-label--accent">
                Four defensible dates
              </span>
              <p className="ql-verdict__sentence">
                You said <strong>{placed}</strong>. Four dates are defensible
                here, and specialists use all four, depending on what they take
                the word invented to mean.
              </p>
            </div>

            <div
              className="ql-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                marginTop: "var(--space-gap-xl)",
              }}
            >
              {DEFENSIBLE.map(({ year, label, source, url }) => (
                <div key={year} style={{ padding: "var(--space-card-l)" }}>
                  <span
                    className="ql-year"
                    style={{
                      fontSize: "var(--text-year-l)",
                      color:
                        placed !== null && Math.abs(placed - year) <= 2
                          ? "var(--accent)"
                          : "var(--text)",
                      display: "block",
                    }}
                  >
                    {year}
                  </span>
                  <p className="ql-opening__label">{label}</p>
                  <p className="ql-opening__source">
                    <a
                      className="ql-ref"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source}
                      <span className="ql-ref__mark" aria-hidden="true" />
                      <span className="ql-sr"> (opens in a new tab)</span>
                    </a>
                  </p>
                </div>
              ))}
            </div>

            <div className="ql-footer-row">
              <p className="ql-label">
                The rest of the deck works the same way. One claim, one year.
              </p>
              <button
                type="button"
                className="ql-btn ql-btn--primary"
                onClick={onContinue}
              >
                Begin the run
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ql-place__line">
              <Axis value={placed} onChange={onDraft} onCommit={onCommit} />
            </div>
            <div className="ql-footer-row">
              <p className="ql-label">
                {placed === null
                  ? "Drag anywhere on the line."
                  : "Adjust it, or place it."}
              </p>
              <button
                type="button"
                className="ql-btn ql-btn--primary"
                disabled={placed === null}
                onClick={onCommit}
              >
                Place it
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
