"use client";

import { SECTOR_DECKS, WILDCARD_DECKS, type Sector } from "../data/sectors";

/**
 * Sector selection as its own section, well below the deck.
 *
 * It used to be the first thing you met, sitting inside the card stack, which
 * meant the page opened on a menu instead of on a claim. The deck now deals you
 * a card straight away; this is where you come to change what you are being
 * dealt, and it is laid out as a wide grid rather than a scrolling list.
 */
export function SectorPicker({
  current, generated, custom, gen,
  onPick, onCustom, onRequest,
}: {
  current: string;
  generated: Sector[];
  custom: string;
  gen: { state: "idle" | "loading" | "error"; msg?: string };
  onPick: (s: Sector | null) => void;
  onCustom: (v: string) => void;
  onRequest: () => void;
}) {
  const tile = (s: Sector) => (
    <button
      key={s.id}
      className={`sp-tile${current === s.id ? " on" : ""}`}
      onClick={() => onPick(s)}
    >
      <span className="sp-name">
        {s.name}
        {s.kind === "generated" && !s.approved && <span className="sp-badge">AI-drafted</span>}
      </span>
      <span className="sp-blurb">{s.blurb}</span>
      <span className="sp-count">{s.cards.length} claims</span>
    </button>
  );

  return (
    <section className="sp" id="sectors">
      <div className="sp-inner">
        <span className="eyebrow">Change the deck</span>
        <h2>Pick a sector.</h2>
        <p className="sp-lede">
          Every deck is the same game with a different set of claims. Or name a sector nobody has
          covered yet and we will research one for you, sources and all.
        </p>

        <div className="sp-ask">
          <input
            className="sp-input"
            value={custom}
            placeholder="Name a sector — shipping, archaeology, social work…"
            onChange={(e) => onCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onRequest(); }}
            disabled={gen.state === "loading"}
            maxLength={40}
            aria-label="Name a sector to build"
          />
          <button
            className="sp-go"
            onClick={onRequest}
            disabled={custom.trim().length < 3 || gen.state === "loading"}
          >
            {gen.state === "loading" ? <><span className="spin" aria-hidden="true" /> Researching…</> : "Build it →"}
          </button>
        </div>
        {gen.state === "loading" && (
          <p className="sp-note">Claude is searching for sourced claims. This takes two or three minutes.</p>
        )}
        {gen.state === "error" && <p className="sp-note err">{gen.msg}</p>}

        <button className={`sp-tile wide${current === "mixed" ? " on" : ""}`} onClick={() => onPick(null)}>
          <span className="sp-name">Surprise me</span>
          <span className="sp-blurb">Ten claims pulled from every sector at once</span>
        </button>

        {generated.length > 0 && (
          <>
            <h3 className="sp-group">Added by visitors</h3>
            <div className="sp-grid">{generated.map(tile)}</div>
          </>
        )}

        <h3 className="sp-group">Sectors</h3>
        <div className="sp-grid">{SECTOR_DECKS.map(tile)}</div>

        <h3 className="sp-group">Wildcards</h3>
        <p className="sp-groupnote">Not a line of work. A way of being wrong.</p>
        <div className="sp-grid">{WILDCARD_DECKS.map(tile)}</div>
      </div>
    </section>
  );
}
