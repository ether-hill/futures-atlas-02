/**
 * One component per slide type, all driven by the discriminated Slide union.
 * The same Deck object will drive the M1 PPTX/PDF builders — keep every piece
 * of content here sourced from the Deck, never invented in the component.
 */

import type { Deck, Severity, Slide } from "../lib/types";
import { HONESTY_LINE, SLIDE_SLUGS } from "../lib/types";

const SEV_COLOR: Record<Severity, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};
const SEV_TICKS: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

function VerdictStamp({ verdict }: { verdict: string }) {
  return (
    <span className="verdict-stamp">
      Quantum verdict — <b>{verdict}</b>
    </span>
  );
}

function Cover({ s, deck }: { s: Extract<Slide, { type: "cover" }>; deck: Deck }) {
  return (
    <>
      <h2 className="sector-name">{s.sector}</h2>
      <p className="one-liner">{s.one}</p>
      <div className="cover-foot">
        <p className="honesty">{HONESTY_LINE}</p>
        <VerdictStamp verdict={s.verdict} />
      </div>
      <div className="board-foot">
        <span className="wordmark">Signal Reactor</span>
        <span className="board-counter">
          {new Date(deck.generatedAt).toISOString().slice(0, 10)} · prompt v{deck.promptVersion} · {deck.mode}
        </span>
      </div>
    </>
  );
}

function Signal({ s }: { s: Extract<Slide, { type: "signal" }> }) {
  return (
    <>
      <div className="cols">
        <div>
          <h3>The hype</h3>
          <p className="hype-text">{s.hype}</p>
        </div>
        <div>
          <h3>The substance</h3>
          <p className="substance-text">{s.substance}</p>
        </div>
      </div>
      <div className="notes">
        <div className="note-block">
          <span className="kicker">Quantum — {s.verdict}</span>
          <p>{s.qnote}</p>
        </div>
        <div className="note-block note-block--ai">
          <span className="kicker kicker--accent">Where the real disruption lands</span>
          <p>{s.ainote}</p>
        </div>
      </div>
    </>
  );
}

function Horizons({ s }: { s: Extract<Slide, { type: "horizons" }> }) {
  const cols = [
    { range: "Now—2028", text: s.near },
    { range: "2028—2035", text: s.mid },
    { range: "2035+", text: s.far },
  ];
  return (
    <div className="cols">
      {cols.map((c) => (
        <div className="horizon" key={c.range}>
          <div className="range">{c.range}</div>
          <p>{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function Vectors({ s }: { s: Extract<Slide, { type: "vectors" }> }) {
  return (
    <div>
      {s.vectors.map((v) => (
        <div className="vec-row" key={v.area}>
          <div className="vec-area">{v.area}</div>
          <div className="vec-note">{v.note}</div>
          <div className="vec-sev">
            <span className="sev-label" style={{ color: SEV_COLOR[v.severity] }}>
              {v.severity}
            </span>
            <span className="sev-ticks" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <i key={i} style={i < SEV_TICKS[v.severity] ? { background: SEV_COLOR[v.severity] } : undefined} />
              ))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NumberedList({ items, discussion }: { items: string[]; discussion?: boolean }) {
  return (
    <div className={`list-slide${discussion ? " list-slide--discussion" : ""}`}>
      {items.map((t, i) => (
        <div className="item" key={i}>
          <span className="idx">{String(i + 1).padStart(2, "0")}</span>
          <span className="txt">{t}</span>
        </div>
      ))}
    </div>
  );
}

function Assumptions({ s }: { s: Extract<Slide, { type: "assumptions" }> }) {
  return (
    <div>
      {s.items.map((a, i) => (
        <div className="assumption" key={i}>
          <div className="claim">
            {a.claim}
            {a.provenance && <span className="prov-tag">{a.provenance}</span>}
          </div>
          <div className="cond">
            <span className="kicker">True only if</span>
            <p>{a.condition}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Monday({ s }: { s: Extract<Slide, { type: "monday" }> }) {
  return (
    <div className="list-slide slide-monday">
      {s.items.map((t, i) => (
        <div className="item" key={i}>
          <span className="idx">
            <span className="square" aria-hidden="true" />
          </span>
          <span className="txt">{t}</span>
        </div>
      ))}
    </div>
  );
}

export function SlideBoard({ deck, index }: { deck: Deck; index: number }) {
  const slide = deck.slides[index];
  const total = deck.slides.length;
  return (
    <div className={`board slide-${slide.type}`} role="group" aria-roledescription="slide" aria-label={`${SLIDE_SLUGS[slide.type]}, slide ${index + 1} of ${total}`}>
      <div className="board-head">
        <span className="kicker kicker--accent">{SLIDE_SLUGS[slide.type]}</span>
        <span className="board-counter">
          {String(index + 1).padStart(2, "0")} — {String(total).padStart(2, "0")}
        </span>
      </div>
      {/* key forces the entrance animation to re-run per slide */}
      <div className="board-body" key={index}>
        {slide.type === "cover" && <Cover s={slide} deck={deck} />}
        {slide.type === "signal" && <Signal s={slide} />}
        {slide.type === "horizons" && <Horizons s={slide} />}
        {slide.type === "vectors" && <Vectors s={slide} />}
        {slide.type === "considerations" && <NumberedList items={slide.items} />}
        {slide.type === "discussion" && <NumberedList items={slide.items} discussion />}
        {slide.type === "assumptions" && <Assumptions s={slide} />}
        {slide.type === "monday" && <Monday s={slide} />}
      </div>
    </div>
  );
}
