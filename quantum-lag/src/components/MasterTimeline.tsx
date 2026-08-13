"use client";

import type { Claim } from "@/content/types";
import { asset } from "@/lib/asset";
import { NOW_YEAR } from "@/lib/axis";
import { directionColour, scoreClaim, summarise } from "@/lib/scoring";
import { truthYear } from "./RevealChart";

/*
  The master timeline, and the end of the run.

  It used to be one packed axis with every label fighting for a lane, followed
  by a separate results screen of headline figures. Both are gone. The timeline
  is now the walk back through the deck, one claim at a time at reading size:
  the year, the claim, the photograph, and what the player said about it.

  The result is the first thing on it rather than a screen of its own. Three
  figures and a sentence, then straight into the record.
*/

function headline(dominant: "lag" | "leap" | "correct" | null): string {
  if (dominant === "lag") {
    return "You put finished work in the future more often than the reverse.";
  }
  if (dominant === "leap") {
    return "You put unfinished work in the past more often than the reverse.";
  }
  return "Your errors ran evenly in both directions.";
}

/** Where a claim sits when the timeline is read top to bottom. */
function sortYear(claim: Claim): number {
  if (claim.status.kind !== "expected") return claim.status.year;
  const { range } = claim.status;
  return range ? Math.round((range[0] + range[1]) / 2) : NOW_YEAR + 30;
}

function yearLabel(claim: Claim): string {
  if (claim.status.kind !== "expected") return String(claim.status.year);
  const { range } = claim.status;
  return range ? `${range[0]}–${range[1]}` : "No date";
}

/** What the player said about this one, in a few words. */
function reading(claim: Claim, placed: number | undefined) {
  if (placed === undefined) return null;
  const truth = truthYear(claim);
  const verdict = scoreClaim(claim, placed);
  const colour = directionColour(verdict.direction);

  if (truth === null) return { text: `You said ${placed}`, colour };
  if (verdict.direction === "correct") {
    return { text: `You said ${placed}, within range`, colour };
  }
  const gap = Math.abs(placed - truth);
  return {
    text: `You said ${placed}, ${gap} ${gap === 1 ? "year" : "years"} ${
      verdict.direction === "lag" ? "late" : "early"
    }`,
    colour,
  };
}

type Props = {
  claims: Claim[];
  placements: Record<string, number>;
  onBack: () => void;
  onRestart: () => void;
};

export function MasterTimeline({
  claims,
  placements,
  onBack,
  onRestart,
}: Props) {
  const summary = summarise(claims, placements);
  const hasRun = Object.keys(placements).length > 0;
  const ordered = [...claims].sort((a, b) => sortYear(a) - sortYear(b));

  return (
    <section className="ql-screen ql-screen--reveal">
      <div className="ql-shell">
        <p className="ql-eyebrow">
          {hasRun ? "The record, and how you read it" : "The record"}
        </p>

        {hasRun ? (
          <>
            <h1 className="ql-headline" style={{ maxWidth: "22ch" }}>
              {headline(summary.dominant)}
            </h1>
            <div
              className="ql-figure-row"
              style={{ marginTop: "var(--story-lead)" }}
            >
              <Figure
                value={summary.finishedInFuture}
                of={summary.finishedTotal}
                label="finished milestones you put in the future"
              />
              <Figure
                value={summary.unfinishedClaimedDone}
                of={summary.unfinishedTotal}
                label="unfinished ones you marked as done"
                accent
              />
              <Figure
                value={
                  summary.medianDisplacement === null
                    ? "––"
                    : `${summary.medianDisplacement > 0 ? "+" : ""}${summary.medianDisplacement}y`
                }
                label="median displacement"
              />
            </div>
          </>
        ) : (
          <h1 className="ql-headline" style={{ maxWidth: "22ch" }}>
            Twenty claims, in the order they actually happened.
          </h1>
        )}
      </div>

      {/* the walk back through the deck */}
      <div className="ql-tl">
        {ordered.map((claim, i) => {
          const placed = placements[claim.id];
          const read = reading(claim, placed);
          const expected = claim.status.kind === "expected";

          return (
            <article
              className={`ql-tl__row ${i % 2 ? "ql-tl__row--flip" : ""}`}
              key={claim.id}
            >
              <div className="ql-tl__media">
                {claim.image ? (
                  <div className="ql-tl__frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="ql-tl__img"
                      src={asset(claim.image.src)}
                      alt={claim.image.alt}
                      width={claim.image.width}
                      height={claim.image.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div
                    className="ql-tl__frame ql-tl__frame--empty"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="ql-tl__text" data-rise>
                <span
                  className={`ql-tl__year ${expected ? "ql-tl__year--ahead" : ""}`}
                >
                  {yearLabel(claim)}
                </span>
                <h2 className="ql-tl__title">{claim.claim}</h2>
                <p className="ql-tl__hook">{claim.hook}</p>
                {read && (
                  <p className="ql-tl__reading" style={{ color: read.colour }}>
                    {read.text}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="ql-shell">
        <div
          className="ql-grid"
          style={{
            marginTop: "var(--space-section)",
            gridTemplateColumns: "1fr",
          }}
        >
          <div style={{ padding: "var(--space-card-l)" }}>
            <span className="ql-label ql-label--accent">
              About the expected dates
            </span>
            <p
              className="ql-body"
              style={{ marginTop: "var(--space-3)", maxWidth: "70ch" }}
            >
              The ranges here come from expert surveys and manufacturer roadmaps,
              and those two sources disagree with each other by roughly a decade:
              IBM&rsquo;s roadmap puts a reliable machine at 2029 while
              independent specialists cluster in the late 2030s. The estimate for
              breaking today&rsquo;s encryption has moved by years within the
              last five, as the size of machine thought necessary fell from
              around a billion components to under a million. It will move again.
            </p>
          </div>
        </div>

        <div className="ql-footer-row">
          <div className="ql-cta-row">
            <button
              type="button"
              className="ql-btn ql-btn--ghost"
              onClick={onBack}
            >
              Back
            </button>
            {hasRun && (
              <button
                type="button"
                className="ql-btn ql-btn--primary"
                onClick={onRestart}
              >
                Start again
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Figure({
  value,
  of,
  label,
  accent,
}: {
  value: number | string;
  of?: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <span
        className="ql-figure__value"
        style={{ color: accent ? "var(--accent)" : "var(--text)" }}
      >
        {value}
        {of !== undefined && <span className="ql-figure__of"> / {of}</span>}
      </span>
      <span className="ql-figure__label">{label}</span>
    </div>
  );
}
