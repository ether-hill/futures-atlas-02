"use client";

import { FULL_SPAN, NOW_YEAR, ticksFor, yearToPercent } from "@/lib/axis";
import { directionColour, type Verdict } from "@/lib/scoring";
import type { Claim } from "@/content/types";

/*
  The reveal chart.

  ONE SCALE, ALWAYS: 1900 to 2060, the same line the claim was placed on. It
  never rescales between claims, so twenty reveals read as twenty marks on one
  timeline rather than twenty different graphs, and a marker stays exactly where
  the player left it.

  The drawing carries almost no words. The verdict sentence above it already
  says where the placement went and how far out it was; repeating that on the
  chart said everything twice. What is left is the marks and a key.

  Choreography per the handoff's table: every entrance uses --ease-enter with
  fill-mode both, nothing delayed past 640ms, nothing longer than 520ms.
*/

const STEP = {
  past: 40,
  future: 130,
  field: 155,
  guess: 180,
  ghost: 280,
  travel: 320,
  range: 560,
  law: 610,
  key: 640,
} as const;

function anim(name: string, delay: number, duration = 520) {
  return {
    animationName: `ql-${name}`,
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    animationTimingFunction: "var(--ease-enter)",
    animationFillMode: "both",
  } as const;
}

/** The year the placement is measured against, where one exists. */
export function truthYear(claim: Claim): number | null {
  const { status } = claim;
  if (status.kind === "happened" || status.kind === "disputed") {
    return status.year;
  }
  if (status.range) return Math.round((status.range[0] + status.range[1]) / 2);
  return null;
}

export function RevealChart({
  claim,
  verdict,
}: {
  claim: Claim;
  verdict: Verdict;
}) {
  // Fixed. Not derived from the claim, and not from the placement.
  const span = FULL_SPAN;
  const pct = (year: number) => yearToPercent(year, span);

  const nowPct = pct(NOW_YEAR);
  const truth = truthYear(claim);
  const range = claim.status.kind === "expected" ? claim.status.range : null;
  const openEnded = claim.status.kind === "expected" && range === null;

  const guessPct = pct(verdict.placed);
  const truthPct = truth === null ? null : pct(truth);

  const barLeft = truthPct === null ? 0 : Math.min(guessPct, truthPct);
  const barWidth = truthPct === null ? 0 : Math.abs(truthPct - guessPct);
  const showBar = truthPct !== null && barWidth > 0.05;
  // Cream: you thought it was still coming. Blue: you thought it was already done.
  const barDirection = truth !== null && verdict.placed > truth ? "lag" : "leap";

  // Which side each numeral hangs off, so two close pins cannot collide.
  const guessOnLeft = truthPct === null || guessPct <= truthPct;

  /*
    The pin travels. It lands where the player put it, then slides along the
    same line to the year the record gives, leaving a faded mark behind at the
    starting point. The scale is fixed, so the pin genuinely begins at the x it
    occupied on the placement screen: the journey is the answer.

    The slide is a translate on a chart-width wrapper, which is why the offset
    can be a percentage of the chart rather than of the pin.
  */
  const travel = truthPct === null ? 0 : guessPct - truthPct;

  return (
    <>
      <div className="ql-chart">
        {/* the recorded half, with a field of its own */}
        <div
          className="ql-chart__past-field"
          style={{ width: `${nowPct}%`, ...anim("fadeIn", STEP.field, 400) }}
        />
        <div
          className="ql-chart__past"
          style={{ width: `${nowPct}%`, ...anim("growX", STEP.past) }}
        />

        {/* the half that has not happened */}
        <div
          className="ql-chart__future-field"
          style={{
            left: `${nowPct}%`,
            width: `${100 - nowPct}%`,
            ...anim("fadeIn", STEP.field, 400),
          }}
        />
        <div
          className="ql-chart__future"
          style={{
            left: `${nowPct}%`,
            width: `${100 - nowPct}%`,
            ...anim("growX", STEP.future),
          }}
        />

        {/* now is a point on the line, and stays one */}
        <div
          className="ql-chart__now"
          style={{ left: `${nowPct}%`, ...anim("fadeIn", STEP.field, 400) }}
        />
        <div
          className="ql-chart__now-dot"
          style={{ left: `${nowPct}%`, ...anim("fadeIn", STEP.field, 400) }}
        />

        {/* The years live on the axis. There is no second scale row anywhere. */}
        {ticksFor(span).map((year) => (
          <span key={year}>
            <span className="ql-chart__tick" style={{ left: `${pct(year)}%` }} />
            <span
              className="ql-chart__tick-year"
              style={{ left: `${pct(year)}%` }}
            >
              {year}
            </span>
          </span>
        ))}

        {showBar && (
          <div
            className="ql-gap"
            style={{
              left: `${barLeft}%`,
              width: `${barWidth}%`,
              color: directionColour(barDirection),
              ...anim("growX", STEP.travel),
            }}
          />
        )}

        {/* where the player put it, left behind */}
        {truthPct !== null && (
          <div
            className="ql-pin ql-pin--ghost"
            style={{
              left: `${guessPct}%`,
              color: "var(--text)",
              ...anim("fadeGhost", STEP.ghost),
            }}
          >
            <span className="ql-pin__stem" />
            <span className="ql-pin__head" />
            <span className="ql-pin__label ql-pin__label--left">
              <span className="ql-pin__year">{verdict.placed}</span>
            </span>
          </div>
        )}

        {/*
          The travelling pin. It drops at the placement, then slides to the
          record and arrives as the record: hollow cream leaving, filled blue
          landing.
        */}
        <div
          className="ql-pin-travel"
          style={
            {
              "--from": `${travel}%`,
              ...anim("slidePin", STEP.travel),
            } as React.CSSProperties
          }
        >
          <div
            className={`ql-pin ${truthPct === null ? "ql-pin--guess" : "ql-pin--arriving"}`}
            style={{
              left: `${truthPct ?? guessPct}%`,
              color: truthPct === null ? "var(--text)" : "var(--accent-deep)",
              ...anim("dropPin", STEP.guess),
            }}
          >
            <span className="ql-pin__stem" />
            <span
              className="ql-pin__head"
              style={
                truthPct === null ? undefined : anim("arrive", STEP.travel)
              }
            />
            <span
              className="ql-pin__ring"
              style={{ animationDelay: `${STEP.guess}ms` }}
            />
            <span
              className={`ql-pin__label ql-pin__label--${
                guessOnLeft ? "right" : "left"
              }`}
            >
              <span className="ql-pin__year">{truth ?? verdict.placed}</span>
            </span>
          </div>
        </div>

        {/* the expert range, as a bracket hanging off the axis */}
        {range && (
          <div
            className="ql-range"
            style={{
              left: `${pct(range[0])}%`,
              width: `${pct(range[1]) - pct(range[0])}%`,
              ...anim("sweep", STEP.range),
            }}
          >
            <span className="ql-range__dropper ql-range__dropper--lo" />
            <span className="ql-range__dropper ql-range__dropper--hi" />
          </div>
        )}

        {/* no credible date: a dashed bar running off the right edge */}
        {openEnded && (
          <div
            className="ql-range ql-range--open"
            style={{
              left: `${Math.max(nowPct, guessPct)}%`,
              right: "0",
              ...anim("sweep", STEP.range),
            }}
          />
        )}

        {/* deadlines in force regardless of the technology */}
        {(claim.policy ?? []).map((policy) => (
          <div
            key={policy.year}
            className="ql-law"
            style={{
              left: `${pct(policy.year)}%`,
              ...anim("growY", STEP.law, 500),
            }}
          >
            <span className="ql-law__bar" />
            <span className="ql-law__bar" />
          </div>
        ))}
      </div>

      {/* The key does the explaining the chart used to do in sentences. */}
      <div className="ql-chart-key" style={anim("fadeUp", STEP.key)}>
        <span className="ql-chart-key__item">
          <span className="ql-k ql-k--past" />
          Already happened
        </span>
        <span className="ql-chart-key__item">
          <span className="ql-k ql-k--future" />
          Has not
        </span>
        <span className="ql-chart-key__item">
          <span className="ql-k ql-k--you" />
          You
        </span>
        {truth !== null && (
          <span className="ql-chart-key__item">
            <span className="ql-k ql-k--truth" />
            {claim.status.kind === "expected" ? "Expert midpoint" : "The record"}
          </span>
        )}
        {range && (
          <span className="ql-chart-key__item">
            <span className="ql-k ql-k--range" />
            Expert range
          </span>
        )}
        {(claim.policy?.length ?? 0) > 0 && (
          <span className="ql-chart-key__item">
            <span className="ql-k ql-k--law" />
            Written into law
          </span>
        )}
      </div>
    </>
  );
}
