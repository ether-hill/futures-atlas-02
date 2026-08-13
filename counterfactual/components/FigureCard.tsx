"use client";

import { useMemo, useState } from "react";
import Chart from "@/components/Chart";
import { type Figure, formatValue } from "@/lib/figures";
import type { Intervention } from "@/lib/interventions";
import { canProject, projectFigure } from "@/lib/project";
import { applyIntervention, untouchedReason } from "@/lib/transform";

export type Compare = "overlay" | "split";

/** Series names written for a full-page figure are too long for a board key. */
const short = (label: string) => {
  const one = label.replace(/\n/g, " ").replace(/\s*\([^)]*\)\s*$/, "");
  return one.length > 26 ? `${one.slice(0, 25)}…` : one;
};

const CONF_LABEL: Record<string, string> = {
  "well-evidenced": "Well evidenced",
  arguable: "Arguable",
  speculative: "Speculative",
};

export default function FigureCard({
  figure,
  intervention,
  compare = "overlay",
  horizon,
  hero = false,
}: {
  figure: Figure;
  intervention: Intervention | null;
  compare?: Compare;
  horizon?: number;
  hero?: boolean;
}) {
  const [showData, setShowData] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  /* At rest the chart is exactly the published data and stops where the data
     stops. A projection nobody asked for is just an unsourced number sitting on
     a sourced chart. The timeline extends only once there is an intervention
     that needs a future to land in. Where it lands is the intervention's own
     business: a 2020 date rewrites history and carries the change forward, a
     2027 date only touches the projection. */
  const extended = useMemo(
    () => (intervention ? projectFigure(figure, horizon)?.figure ?? figure : figure),
    [figure, horizon, intervention]
  );
  const cf = useMemo(() => applyIntervention(extended, intervention), [extended, intervention]);
  /* A figure the intervention never reaches keeps the published timeline. Growing
     it a future that nothing acts on invites the reader to hunt for a change
     that was never going to be there. */
  const base = cf ? extended : figure;
  const projected = !!cf;
  const projectedFigure = canProject(figure);
  const tall = figure.kind === "hbar" || figure.kind === "groupedHBar";
  const fmt = figure.valueFormat ?? "trim2";

  /* −100% has to mean zero. A 99.5% fall rounds to −100 and reads as elimination,
     which is a different claim from what the transform actually made. */
  const delta = cf?.headline
    ? cf.headline.after === 0
      ? -100
      : Math.max(-99, Math.round((cf.headline.ratio - 1) * 100))
    : null;
  const bigChange = delta !== null && Math.abs(delta) >= 1;
  /* Reached by a lever and still flat. Common once an objection pushes the start
     date out past the horizon, and it needs its own sentence: silence here reads
     as a bug, and calling it unmoved would be a lie about which lever exists. */
  const tooLate = !!cf && !bigChange;
  const effectFrom = cf?.effects.length ? Math.min(...cf.effects.map((e) => e.from)) : null;

  /* Split view puts the two readings on one shared scale, or the comparison is
     between two different rulers and means nothing. */
  const splitDomain = useMemo<[number, number] | undefined>(() => {
    if (compare !== "split" || !cf || base.yAxis.scale === "log") return undefined;
    const tot = (ss: Figure["series"]) =>
      base.kind === "stackedBar"
        ? ss[0].points.map((_, i) => ss.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0))
        : ss.flatMap((s) => s.points.map((p) => p[1]));
    const peak = Math.max(...tot(base.series), ...tot(cf.series));
    const step = base.yAxis.tickStep ?? peak / 5;
    let top = base.yAxis.domain?.[1] ?? step * 5;
    while (peak > top) top += step;
    return [base.yAxis.domain?.[0] ?? 0, top];
  }, [compare, cf, base]);

  const showSplit = compare === "split" && !!cf;

  return (
    <figure
      className={[
        "figure",
        hero ? "hero" : "",
        tall ? "tall" : "",
        showSplit ? "split" : "",
        cf ? "changed" : intervention ? "untouched" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id={`fig-${figure.id}`}
    >
      <header className="figure-head">
        <h3 className="figure-title">{figure.title}</h3>
        <p className="figure-source">
          Source: {figure.source}
          {figure.chartNote ? ` | ${figure.chartNote}` : ""}
        </p>
      </header>

      {/* An unmoved figure is a finding, not a failure. It gets the same slot,
          the same scale and the same shape of statement as a moved one: a
          dimmed card with a small tag underneath read as "this is broken". */}
      {intervention && !cf && (
        <p className="figure-delta figure-delta--flat">
          <span className="delta-num">0%</span>
          <span className="delta-what">
            <span className="delta-pair">
              <b>Unmoved</b>
            </span>
            {!projectedFigure && intervention.from > 2025
              ? "no time axis to extend"
              : "no lever in this intervention reaches it"}
          </span>
        </p>
      )}

      {tooLate && (
        <p className="figure-delta figure-delta--flat">
          <span className="delta-num">0%</span>
          <span className="delta-what">
            <span className="delta-pair">
              <b>Too late to show</b>
            </span>
            {effectFrom !== null && horizon !== undefined && effectFrom > horizon
              ? `the lever lands in ${effectFrom}, past the end of this chart`
              : "a lever reaches it, and moves it by under one percent"}
          </span>
        </p>
      )}

      {cf && bigChange && (
        <p className="figure-delta">
          <span className="delta-num">
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
          <span className="delta-what">
            <span className="delta-pair">
              <s>{formatValue(cf.headline!.before, fmt)}</s>
              <em>→</em>
              <b>{formatValue(cf.headline!.after, fmt)}</b>
            </span>
            {cf.headline!.label}, {base.categories?.at(-1) ?? horizon ?? "latest year"}
            {projected && <span className="delta-proj"> · both projected</span>}
          </span>
        </p>
      )}

      {showSplit ? (
        <div className="splitwrap">
          <div className="splitpane">
            <p className="splitlabel">As things stand</p>
            <Chart figure={base} hero={hero} forceDomain={splitDomain} />
          </div>
          <div className="splitpane cfpane">
            <p className="splitlabel">
              {intervention?.short}
              {intervention ? `, from ${intervention.from}` : ""}
            </p>
            <Chart figure={{ ...base, series: cf!.series }} hero={hero} forceDomain={splitDomain} />
          </div>
        </div>
      ) : (
        <Chart figure={base} cf={cf?.series} hero={hero} />
      )}

      {/* Hero charts carry their series key in HTML rather than a box inside the
          plot, since at this size an in-chart legend always lands on the data. */}
      {/* One key row. Series identity and reading identity are different jobs but
          two stacked legends cost more height than they are worth on the board. */}
      {(cf || (hero && base.series.length > 1)) && !showSplit && (
        <div className="cf-key serieskey">
          {hero &&
            base.series.length > 1 &&
            base.series.map((s) => (
              <span key={s.key} className="cf-key-item" title={s.label.replace(/\n/g, " ")}>
                <svg width="11" height="11" aria-hidden>
                  <rect width="11" height="11" fill={s.color} />
                </svg>
                {short(s.label)}
              </span>
            ))}
          {cf && (
            <>
              <span className="cf-key-item dim">
                <svg width="22" height="9" aria-hidden>
                  <rect x="0" y="2" width="22" height="6" fill={base.series[0].color} opacity="0.24" />
                </svg>
                As things stand
              </span>
              <span className="cf-key-item">
                <svg width="22" height="9" aria-hidden>
                  <rect x="0" y="2" width="22" height="6" fill={base.series[0].color} />
                </svg>
                {intervention?.short}
              </span>
            </>
          )}
        </div>
      )}

      {cf && (
        <button
          type="button"
          className={showWhy ? "whybtn on" : "whybtn"}
          onClick={() => setShowWhy((v) => !v)}
          aria-expanded={showWhy}
        >
          {showWhy ? "Hide the reasoning" : "Why this changed"}
          <span className="whybtn-n">{cf.effects.length}</span>
        </button>
      )}

      <figcaption className="figure-foot">
        <span className="figure-ref">
          Figure {figure.id}
          <span className="dot">·</span>
          {figure.chapter.n}. {figure.chapter.name}
          <span className="dot">·</span>
          p.{figure.reportPage}
        </span>
        <span className="figure-actions">
          <button type="button" onClick={() => setShowData((v) => !v)} aria-expanded={showData}>
            {showData ? "Hide data" : "Data"}
          </button>
          {figure.csvUrl && (
            <a href={figure.csvUrl} target="_blank" rel="noreferrer">
              Source CSV
            </a>
          )}
        </span>
      </figcaption>

      {!cf && intervention ? (
        <p className="figure-untouched">
          {!projectedFigure && intervention.from > 2025
            ? `This figure has no continuous time axis, so it stops where the published data stops. An intervention dated ${intervention.from} has nothing here to act on.`
            : untouchedReason(figure, intervention)}
        </p>
      ) : (
        !hero && <p className="figure-takeaway">{figure.takeaway}</p>
      )}

      {cf && showWhy && (
        <ol className="why">
          {cf.effects.map((e, i) => (
            <li key={i} className="why-item">
              <div className="why-head">
                <code className="why-op">
                  {e.op}
                  {e.op === "freeze" ? "" : ` ${e.magnitude}`}
                </code>
                <span className="why-from">from {e.from}</span>
                {e.series && <span className="why-scope">{e.series.join(", ")}</span>}
                <span className={`why-conf c-${e.confidence}`}>{CONF_LABEL[e.confidence]}</span>
              </div>
              <p>{e.rationale}</p>
            </li>
          ))}
        </ol>
      )}

      {showData && <DataTable figure={base} cfSeries={cf?.series} />}
    </figure>
  );
}

function DataTable({ figure, cfSeries }: { figure: Figure; cfSeries?: Figure["series"] }) {
  const fmt = figure.valueFormat ?? "trim2";
  const cats = figure.categories;
  const xs = cats
    ? cats.map((c, i) => ({ key: i, label: c }))
    : [...new Set(figure.series.flatMap((s) => s.points.map((p) => p[0])))]
        .sort((a, b) => a - b)
        .map((x) => ({ key: x, label: Number.isInteger(x) ? String(x) : x.toFixed(2) }));

  /* Scatter clouds are too long to tabulate row-per-point; summarise per series. */
  if (figure.kind === "scatter") {
    return (
      <div className="datatable-wrap">
        <table className="datatable">
          <thead>
            <tr>
              <th>Series</th>
              <th>n</th>
              <th>x range</th>
              <th>min</th>
              <th>max</th>
              {cfSeries && <th>max, counterfactual</th>}
            </tr>
          </thead>
          <tbody>
            {figure.series.map((s, si) => {
              const ys = s.points.map((p) => p[1]);
              const xr = s.points.map((p) => p[0]);
              return (
                <tr key={s.key}>
                  <th scope="row">
                    <span className="sw" style={{ background: s.color }} /> {s.label}
                  </th>
                  <td>{s.points.length}</td>
                  <td>
                    {Math.min(...xr).toFixed(1)}–{Math.max(...xr).toFixed(1)}
                  </td>
                  <td>{Math.min(...ys).toPrecision(3)}</td>
                  <td>{Math.max(...ys).toPrecision(3)}</td>
                  {cfSeries && (
                    <td className="cfcell">
                      {Math.max(...cfSeries[si].points.map((p) => p[1])).toPrecision(3)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="datatable-wrap">
      <table className="datatable">
        <thead>
          <tr>
            <th>
              {figure.xAxis.label ??
                (figure.kind === "groupedHBar" || figure.kind === "hbar" ? "Category" : "Year")}
            </th>
            {figure.series.map((s) => (
              <th key={s.key}>
                <span className="sw" style={{ background: s.color }} />
                {short(s.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((x) => (
            <tr key={x.key}>
              <th scope="row">{x.label}</th>
              {figure.series.map((s, si) => {
                const p = s.points.find((q) => q[0] === x.key);
                const q = cfSeries?.[si]?.points.find((r) => r[0] === x.key);
                if (!p) return <td key={s.key}>—</td>;
                return (
                  <td key={s.key}>
                    {q && q[1] !== p[1] ? (
                      <>
                        <span className="was">{formatValue(p[1], fmt)}</span>
                        <span className="cfcell">{formatValue(q[1], fmt)}</span>
                      </>
                    ) : (
                      formatValue(p[1], fmt)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
