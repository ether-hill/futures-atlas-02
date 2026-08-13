"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FigureCard, { type Compare } from "@/components/FigureCard";
import InterventionBar from "@/components/InterventionBar";
import type { Figure, FigureMeta } from "@/lib/figures";
import type { Intervention } from "@/lib/interventions";
import { PROJECTION_RULE, projectFigure } from "@/lib/project";
import { applyIntervention } from "@/lib/transform";

export const SERIES = "Manipulate the data";

export type BoardCopy = {
  /** Which of the series this board is. */
  seriesNo: string;
  /** Route slug of the other board, for the switch in the masthead. */
  siblingHref: string;
  siblingLabel: string;
  title: React.ReactNode;
  tagline: React.ReactNode;
  /** One paragraph on where the numbers came from, shown in the colophon. */
  provenance: React.ReactNode;
  /** Placeholder for the input, phrased for this subject. */
  placeholder: string;
  restLabel: string;
  /** How far past the data this board is willing to project. */
  horizon: number;
};

export default function Board({
  figures,
  interventions,
  meta,
  copy,
}: {
  figures: Figure[];
  interventions: Intervention[];
  meta: FigureMeta;
  copy: BoardCopy;
}) {
  const HEROES = figures.filter((f) => f.hero);
  const REST = figures.filter((f) => !f.hero);

  const [base, setBase] = useState<Intervention | null>(null);
  const [from, setFrom] = useState(0);
  const [compare, setCompare] = useState<Compare>("overlay");
  const [showRest, setShowRest] = useState(false);

  /* The year slider edits a copy, so the preset itself stays as authored. */
  const intervention = useMemo<Intervention | null>(
    () => (base ? { ...base, from: from || base.from } : null),
    [base, from]
  );

  const changed = useMemo(() => {
    if (!intervention) return 0;
    return figures.filter(
      (f) => !!applyIntervention(projectFigure(f, copy.horizon)?.figure ?? f, intervention)
    ).length;
  }, [intervention, figures, copy.horizon]);

  function setIntervention(iv: Intervention, at?: number) {
    setBase(iv);
    setFrom(at ?? iv.from);
  }

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <div>
            <p className="series">
              {SERIES}
              <span className="series-no">{copy.seriesNo}</span>
            </p>
            <h1>{copy.title}</h1>
          </div>
          <p className="topline">{copy.tagline}</p>
          <p className="provenance">
            <a href={meta.reportUrl} target="_blank" rel="noreferrer">
              Source
            </a>
            <span className="dot">·</span>
            <a href={meta.dataUrl} target="_blank" rel="noreferrer">
              Data
            </a>
            <span className="dot">·</span>
            <Link className="swap" href={copy.siblingHref}>
              {copy.siblingLabel}
            </Link>
            <Link className="swap" href="/one">
              One figure, told →
            </Link>
          </p>
        </div>
      </header>

      <InterventionBar
        interventions={interventions}
        placeholder={copy.placeholder}
        horizon={copy.horizon}
        active={intervention}
        from={from || intervention?.from || 0}
        onSet={setIntervention}
        onFrom={setFrom}
        onClear={() => {
          setBase(null);
          setFrom(0);
        }}
        compare={compare}
        onCompare={setCompare}
        changed={changed}
        total={figures.length}
      />

      <main className={compare === "split" && intervention ? "board split" : "board"}>
        <div className="shell boardgrid">
          {HEROES.map((f) => (
            <FigureCard
              key={f.id}
              figure={f}
              intervention={intervention}
              compare={compare}
              horizon={copy.horizon}
              hero
            />
          ))}
        </div>
      </main>

      <section className="rest">
        <div className="shell">
          <button
            type="button"
            className="restToggle"
            onClick={() => setShowRest((v) => !v)}
            aria-expanded={showRest}
          >
            {showRest ? "Hide" : "Show"} the other {REST.length} {copy.restLabel}
          </button>
          {showRest && (
            <div className="restgrid">
              {REST.map((f) => (
                <FigureCard
                  key={f.id}
                  figure={f}
                  intervention={intervention}
                  compare={compare}
                  horizon={copy.horizon}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {intervention && (
        <section className="argue">
          <div className="shell">
            <div className="argue-inner">
              <p className="eyebrow">The standard objection</p>
              <blockquote className="argue-claim">{intervention.objection.claim}</blockquote>
              <p className="argue-response">{intervention.objection.response}</p>
              <div className="argue-input">
                <input
                  placeholder="Disagree with any of this…"
                  disabled
                  aria-label="Argue with the counterfactual"
                />
                <button type="button" disabled>
                  Argue
                </button>
              </div>
              <p className="argue-note">
                Arguing back needs a model: your objection has to be able to revise the transforms
                or refuse to, and either way say why. Until then the objection above is authored,
                not generated, and it is the strongest one against this intervention rather than
                the easiest.
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="colophon">
        <div className="shell">
          <div className="colophon-inner">
            <h2>How this works</h2>
            <p>{copy.provenance}</p>
            <p>
              <strong>The counterfactual is not a redrawing either.</strong> An intervention is a
              set of typed, dated transforms over those same series — <code>growthRate</code>,{" "}
              <code>levelShift</code>, <code>cap</code>, <code>freeze</code>, <code>converge</code>{" "}
              — each carrying a start year, a stated reason and a confidence. Nothing generates a
              data point. History is immutable: an intervention dated 2023 cannot reach back into
              2019, which is why every counterfactual is glued to the real reading until the year
              you set. Figures no lever reaches say so, and say which lever was missing.
            </p>
            <p>
              <strong>The projection is the one place numbers are invented.</strong> Every chart
              runs to {copy.horizon}, because an intervention starting next year has nothing to act on
              otherwise. One rule does it, for every figure identically:{" "}
              {PROJECTION_RULE.toLowerCase()} No per-figure tuning, because a hand-tuned
              projection is an argument disguised as a baseline. Everything right of the dashed
              rule is that rule&rsquo;s output rather than Stanford&rsquo;s, which is also why
              the faded line there is labelled <em>as things stand</em> and not{" "}
              <em>as published</em> — past 2025 it is a trend, not a record. An intervention
              dated before 2026 rewrites the published history instead, and carries the change
              through the projection.
            </p>
            <p>
              <strong>Colour follows the entity, never the scenario.</strong> The United States line
              is blue in both readings. What separates them is weight: the published series drops
              to a ghost with its level marked, the counterfactual is drawn solid, and the gap
              between them is filled.
            </p>
            <p className="fineprint">
              Data &copy; Stanford University Institute for Human-Centered AI, {meta.licence}. This
              is an independent reconstruction for analysis, not affiliated with or endorsed by
              Stanford HAI. The interventions are authored speculation and are labelled as such,
              figure by figure.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
