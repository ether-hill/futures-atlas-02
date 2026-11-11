"use client";

import { useMemo, useState } from "react";
import { placeOf } from "@/data/doom-score/response-places";
import { GROUPS, KIND_LABEL_R, OUTCOME, type ResponseAction, type ResponseKind } from "@/data/doom-score/response-types";

/**
 * The response record as a browsable list: search, filter by place, outcome,
 * kind and whether the text names catastrophic risk, and sort. The contents
 * rail follows whatever is showing. The charts above are passed in as children
 * and always show the whole record.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: string) => (d.length === 4 ? d : d.length === 7 ? `${MONTHS[+d.slice(5) - 1]} ${d.slice(0, 4)}` : `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`);
const OUT_COLOUR = { effect: "var(--ds-cat-5)", pending: "var(--muted)", stopped: "var(--ds-cat-2)" } as const;
const OUT_NAME = { effect: "Took effect", pending: "Proposed only", stopped: "Vetoed or revoked" } as const;
const STATUS_WORD: Record<string, string> = { "in-force": "In force", passed: "Passed", signed: "Signed", launched: "Launched", held: "Held", proposed: "Proposed", vetoed: "Vetoed", revoked: "Revoked" };
type Sort = "new" | "old" | "place";

export function ResponseBrowser({ rows, children }: { rows: ResponseAction[]; children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [outcome, setOutcome] = useState<"all" | "effect" | "pending" | "stopped">("all");
  const [kind, setKind] = useState<"all" | ResponseKind>("all");
  const [names, setNames] = useState(false);
  const [sort, setSort] = useState<Sort>("new");

  const kinds = useMemo(() => [...new Set(rows.map((r) => r.kind))].sort((a, b) => KIND_LABEL_R[a].localeCompare(KIND_LABEL_R[b])), [rows]);
  const groups = useMemo(() => GROUPS.filter((g) => rows.some((r) => g.match(r.jurisdiction))), [rows]);
  // every place on the record, alphabetically, under its continent
  const places = useMemo(
    () =>
      groups.map((g) => ({
        g,
        list: [...new Set(rows.filter((r) => g.match(r.jurisdiction)).map((r) => r.jurisdiction))]
          .map((j) => ({ j, name: placeOf(j)[1], n: rows.filter((r) => r.jurisdiction === j).length }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    [groups, rows],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const g = GROUPS.find((x) => x.id === group);
    const one = group.startsWith("c:") ? group.slice(2) : null;
    const out = rows.filter(
      (r) =>
        (one ? r.jurisdiction === one : !g || g.match(r.jurisdiction)) &&
        (outcome === "all" || OUTCOME[r.status] === outcome) &&
        (kind === "all" || r.kind === kind) &&
        (!names || r.namesCatastrophic) &&
        (!needle || [r.title, r.summary, r.actor, r.quote, r.outlet, placeOf(r.jurisdiction)[1]].some((t) => t.toLowerCase().includes(needle))),
    );
    return out.sort((a, b) => (sort === "old" ? (a.date < b.date ? -1 : 1) : sort === "place" ? placeOf(a.jurisdiction)[1].localeCompare(placeOf(b.jurisdiction)[1]) || (a.date < b.date ? 1 : -1) : a.date < b.date ? 1 : -1));
  }, [rows, q, group, outcome, kind, names, sort]);

  // sections follow the sort: years, or places
  const sections = useMemo(() => {
    const key = (r: ResponseAction) => (sort === "place" ? placeOf(r.jurisdiction)[1] : r.date.slice(0, 4));
    const map = new Map<string, ResponseAction[]>();
    for (const r of shown) map.set(key(r), [...(map.get(key(r)) ?? []), r]);
    return [...map.entries()];
  }, [shown, sort]);
  const anchor = (k: string) => `s-${k.replace(/\W+/g, "-").toLowerCase()}`;
  const filtered = q || group !== "all" || outcome !== "all" || kind !== "all" || names;
  const reset = () => {
    setQ("");
    setGroup("all");
    setOutcome("all");
    setKind("all");
    setNames(false);
  };

  return (
    <div className="rs-layout">
      <nav className="rs-toc" aria-label="Contents">
        <p className="ch-toc-head">
          Contents <small>{shown.length === rows.length ? `${rows.length} actions` : `${shown.length} of ${rows.length} actions`}</small>
        </p>
        <ol>
          <li>
            <a href="#who-acted">
              <b>Who acted, and when</b>
            </a>
          </li>
          <li>
            <a href="#the-record">
              <b>The record</b>
            </a>
          </li>
          {sections.map(([k, list]) => (
            <li key={k} className="rs-toc-sub">
              <a href={`#${anchor(k)}`}>
                <b>{k}</b>
                <small>
                  {list.length} action{list.length === 1 ? "" : "s"}
                </small>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="rs-main">
        {children}
        <div id="the-record" className="rs-anchor" />
        <div className="rs-filters" role="search">
          <input className="ds-search" type="search" placeholder="Search titles, summaries, quotes, places" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the record" />
          <label className="ds-ctl">
            <span>Where</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="all">Everywhere</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}, all
                </option>
              ))}
              {places
                .filter((p) => p.list.length > 1)
                .map((p) => (
                  <optgroup key={p.g.id} label={p.g.label}>
                    {p.list.map((c) => (
                      <option key={c.j} value={`c:${c.j}`}>
                        {`${c.name} (${c.n})`}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </label>
          <label className="ds-ctl">
            <span>Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as "all" | ResponseKind)}>
              <option value="all">All kinds</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL_R[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="ds-ctl">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
              <option value="place">By place</option>
            </select>
          </label>
          <div className="rs-chips">
            {(["all", "effect", "pending", "stopped"] as const).map((o) => (
              <button key={o} type="button" className={`rs-chip ${outcome === o ? "is-on" : ""}`} style={{ ["--c" as string]: o === "all" ? "var(--text)" : OUT_COLOUR[o] }} onClick={() => setOutcome(o)} aria-pressed={outcome === o}>
                {o === "all" ? "Any outcome" : OUT_NAME[o]}
                <small>{o === "all" ? rows.length : rows.filter((r) => OUTCOME[r.status] === o).length}</small>
              </button>
            ))}
            <button type="button" className={`rs-chip rs-chip--ring ${names ? "is-on" : ""}`} style={{ ["--c" as string]: "var(--text)" }} onClick={() => setNames((v) => !v)} aria-pressed={names}>
              Names catastrophic risk
              <small>{rows.filter((r) => r.namesCatastrophic).length}</small>
            </button>
          </div>
          <p className="rs-count">
            {shown.length === rows.length ? `All ${rows.length} actions` : `${shown.length} of ${rows.length} actions`}
            {filtered ? (
              <button type="button" onClick={reset}>
                Clear filters
              </button>
            ) : null}
          </p>
        </div>
        <section className="rs-list">
          {sections.map(([k, list]) => (
            <div key={k} id={anchor(k)} className="rs-year">
              <h2>{k}</h2>
              <ol>
                {list.map((r) => {
                  const out = OUTCOME[r.status];
                  return (
                    <li key={r.id} id={r.id} className={`rs-item rs-item--${out}`} style={{ ["--c" as string]: OUT_COLOUR[out] }}>
                      <time>{fmtDate(r.date)}</time>
                      <article className="rs-card">
                        <p className="rs-tags">
                          <span className={`rs-status rs-status--${out}`}>{STATUS_WORD[r.status] ?? r.status}</span>
                          <span className="rs-place">
                            <span aria-hidden="true">{placeOf(r.jurisdiction)[0]}</span> {placeOf(r.jurisdiction)[1]}
                          </span>
                          <span className="rs-kind">{KIND_LABEL_R[r.kind]}</span>
                          {r.namesCatastrophic ? <span className="rs-names">Names catastrophic risk</span> : null}
                        </p>
                        <h3>{r.title}</h3>
                        <p className="rs-actor">{r.actor}</p>
                        <p className="rs-summary">{r.summary}</p>
                        {r.quote ? (
                          <blockquote className="rs-quote">
                            <span>In its own words</span>“{r.quote}”
                          </blockquote>
                        ) : null}
                        <a className="rs-read" href={r.url} target="_blank" rel="noreferrer">
                          Read the full text <span aria-hidden="true">↗</span>
                          <small>
                            {r.outlet}
                            {r.verified ? "" : " · not yet read in its own text"}
                          </small>
                        </a>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          {!shown.length ? <p className="ds-panel-empty">Nothing matches. Try fewer filters.</p> : null}
        </section>
      </div>
    </div>
  );
}
