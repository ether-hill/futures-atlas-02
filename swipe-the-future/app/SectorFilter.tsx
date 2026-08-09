"use client";

import { useMemo } from "react";
import { SECTOR_DECKS, WILDCARD_DECKS, type Sector } from "../data/sectors";

/**
 * Deck choice as a search-and-filter control rather than a page section.
 *
 * One field does both jobs: type to narrow the chips, and if nothing matches
 * what you typed, the same box offers to go and research it. That keeps the
 * whole thing small enough to sit beside the card on one screen.
 */
export function SectorFilter({
  current, generated, query, gen,
  onPick, onQuery, onRequest,
}: {
  current: string;
  generated: Sector[];
  query: string;
  gen: { state: "idle" | "loading" | "error"; msg?: string };
  onPick: (s: Sector | null) => void;
  onQuery: (v: string) => void;
  onRequest: () => void;
}) {
  const all = useMemo(
    () => [...generated, ...SECTOR_DECKS, ...WILDCARD_DECKS],
    [generated],
  );

  const q = query.trim().toLowerCase();
  const hits = useMemo(
    () => (q ? all.filter((s) => `${s.name} ${s.blurb}`.toLowerCase().includes(q)) : all),
    [all, q],
  );

  const canBuild = q.length >= 3 && hits.length === 0;

  return (
    <div className="sf">
      <div className="sf-field">
        <svg className="sf-icon" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          id="sf-q"
          className="sf-input"
          value={query}
          placeholder="Filter sectors, or name a new one"
          aria-label="Filter decks, or name a sector to build"
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canBuild) onRequest(); }}
          disabled={gen.state === "loading"}
          maxLength={40}
        />
        {query && (
          <button className="sf-clear" onClick={() => onQuery("")} aria-label="Clear">✕</button>
        )}
      </div>

      {canBuild && (
        <button className="sf-build" onClick={onRequest} disabled={gen.state === "loading"}>
          {gen.state === "loading"
            ? <><span className="spin" aria-hidden="true" /> Researching {query.trim()}…</>
            : <>No deck for “{query.trim()}”. Build one →</>}
        </button>
      )}
      {gen.state === "loading" && <p className="sf-note">Searching for sourced claims. Two or three minutes.</p>}
      {gen.state === "error" && <p className="sf-note err">{gen.msg}</p>}

      <div className="sf-chips">
        {!q && (
          <button className={`sf-chip${current === "mixed" ? " on" : ""}`} onClick={() => onPick(null)}>
            Surprise me
          </button>
        )}
        {hits.map((s) => (
          <button
            key={s.id}
            className={`sf-chip${current === s.id ? " on" : ""}${s.kind === "wildcard" ? " wild" : ""}`}
            onClick={() => onPick(s)}
            title={s.blurb}
          >
            {s.name}
            {s.kind === "generated" && !s.approved && <i className="sf-dot" title="AI-drafted" />}
          </button>
        ))}
        {q && hits.length > 0 && (
          <span className="sf-count">{hits.length} match{hits.length === 1 ? "" : "es"}</span>
        )}
      </div>
    </div>
  );
}
