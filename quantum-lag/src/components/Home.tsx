"use client";

import { AXIS_MAX, AXIS_MIN, NOW_YEAR, yearToPercent } from "@/lib/axis";
import type { Mode } from "@/lib/run";

/*
  Home, per frame 1a. The hero rail is the site's spine: the same linear
  1900–2060 line the run is placed on, drawn once at rest.
*/

const RAIL_TICKS = [1920, 1960, 2000, 2040];
const GHOST_YEAR = 2038;

const pct = (year: number) => yearToPercent(year, [AXIS_MIN, AXIS_MAX]);

function Cryo() {
  // Five plate rails of decreasing opacity, one accent rail, one cold stage.
  const plates = [
    { top: "18%", opacity: 0.3 },
    { top: "27%", opacity: 0.24 },
    { top: "38%", opacity: 0.18 },
    { top: "50%", opacity: 0.13 },
    { top: "63%", opacity: 0.09 },
  ];
  return (
    <div className="ql-cryo" aria-hidden="true">
      <div className="ql-cryo__wiring" />
      {plates.map((plate) => (
        <span key={plate.top} className="ql-cryo__plate" style={plate} />
      ))}
      <span
        className="ql-cryo__plate ql-cryo__plate--accent"
        style={{ top: "44%", opacity: 0.5 }}
      />
      <span className="ql-cryo__stage" style={{ top: "70%", left: "34%" }} />
    </div>
  );
}

type Props = {
  /** Which run this route offers. `/` is guided, `/study` is research. */
  mode: Mode;
  total: number;
  /**
   * build-spec §1: a player arriving at `/` never sees the research version and
   * is not asked to choose, so self-selection cannot shape the sample. Set this
   * true to restore the design's two-card chooser instead.
   */
  showChooser?: boolean;
  onStart: (mode: Mode) => void;
  onSkip: () => void;
};

const CARDS: Record<
  Mode,
  { eyebrow: string; title: string; body: string; cta: string }
> = {
  guided: {
    eyebrow: "Guided",
    title: "Answer, then find out",
    body:
      "You see the answer after each claim, with the evidence, the expert estimates and the policy deadlines attached to it. Written to teach.",
    cta: "Test what you know",
  },
  research: {
    eyebrow: "Research",
    title: "Everything first, then the answers",
    body:
      "A sample of two or three claims from each act, with no feedback, so that later answers are not shaped by earlier ones. The full walkthrough follows.",
    cta: "Take it as a study run",
  },
};

export function Home({
  mode,
  total,
  showChooser = false,
  onStart,
  onSkip,
}: Props) {
  const offered: Mode[] = showChooser ? ["guided", "research"] : [mode];
  return (
    <>
      <section
        className="ql-shell ql-hero"
        style={{ position: "relative", zIndex: 1 }}
      >
        <Cryo />
        <div className="ql-glow" aria-hidden="true" />

        <div className="ql-hero__head">
          <span className="ql-label ql-label--wide" />
          <span className="ql-label ql-label--wide">TU Delft</span>
        </div>

        <h1 className="ql-title">
          <span className="ql-title__line">
            <span className="ql-title__ghost" aria-hidden="true">
              Quantum
            </span>
            Quantum
          </span>
          <span className="ql-title__lag">lag</span>
        </h1>

        <p className="ql-lead ql-hero__lede">
          Quantum technology is unusually hard to place in time. Parts of it were
          achieved decades ago and still sound like science fiction. Other parts
          are announced every few months and have not happened at all.
          Governments are already setting legal deadlines around dates that
          nobody can yet predict.
        </p>

        <div className="ql-cta-row" style={{ marginTop: "var(--space-gap-xl)" }}>
          {offered.map((m, i) => (
            <button
              key={m}
              type="button"
              className={`ql-btn ${i === 0 ? "ql-btn--primary" : "ql-btn--ghost"}`}
              onClick={() => onStart(m)}
            >
              {CARDS[m].cta}
            </button>
          ))}
          <span className="ql-hero__note">
            {total} claims. No physics required.
          </span>
        </div>

        <div className="ql-hero__skip">
          <button type="button" className="ql-quiet" onClick={onSkip}>
            Skip to the master timeline
          </button>
        </div>

        <div className="ql-rail">
          <div className="ql-rail__head">
            <span className="ql-label">The rail runs the length of the site</span>
            <span className="ql-label">
              {AXIS_MIN}–{AXIS_MAX}
            </span>
          </div>
          <div className="ql-axis ql-axis--rail" aria-hidden="true">
            <div className="ql-axis__rule" />
            <div
              className="ql-axis__past"
              style={{ width: `${pct(NOW_YEAR)}%` }}
            />
            {RAIL_TICKS.map((year) => (
              <span key={year}>
                <span
                  className="ql-axis__tick"
                  style={{ left: `${pct(year)}%` }}
                />
                <span
                  className="ql-axis__tick-label"
                  style={{ left: `${pct(year)}%` }}
                >
                  {year}
                </span>
              </span>
            ))}
            <span
              className="ql-axis__now"
              style={{ left: `${pct(NOW_YEAR)}%` }}
            />
            <span
              className="ql-axis__now-label"
              style={{ left: `${pct(NOW_YEAR)}%` }}
            >
              Now
            </span>
            <span
              className="ql-axis__marker ql-axis__marker--ghost ql-drift"
              style={{ left: `${pct(GHOST_YEAR)}%`, opacity: 0.55 }}
            />
            <span
              className="ql-axis__readout ql-axis__readout--ghost ql-drift"
              style={{ left: `${pct(GHOST_YEAR)}%` }}
            >
              {GHOST_YEAR}?
            </span>
          </div>
        </div>
      </section>

      <section
        className="ql-shell"
        style={{ paddingBlock: "var(--space-section)" }}
      >
        <div className="ql-rail__head" style={{ marginBottom: "var(--space-5)" }}>
          <span className="ql-label">
            {showChooser ? "Choose how to go through it" : "How it runs"}
          </span>
          <span className="ql-label">
            {showChooser ? "Two modes, one deck" : "One claim, one year"}
          </span>
        </div>

        <div
          className="ql-grid ql-mode-cards"
          style={
            offered.length === 1 ? { gridTemplateColumns: "1fr" } : undefined
          }
        >
          {offered.map((m) => (
            <button
              key={m}
              type="button"
              className="ql-mode-card"
              onClick={() => onStart(m)}
            >
              <span className="ql-label ql-label--accent">
                {CARDS[m].eyebrow}
                {m === "guided" && showChooser ? " · default" : ""}
              </span>
              <h2 className="ql-mode-card__title">{CARDS[m].title}</h2>
              <p className="ql-body">{CARDS[m].body}</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
