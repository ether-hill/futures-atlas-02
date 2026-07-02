"use client";

/** Sector picker: curated 16-tile grid + "Other…" free text (brief §11). */

import { useState } from "react";
import { OTHER_PLACEHOLDER, SECTORS } from "../lib/sectors";

export function Picker({
  onGenerate,
  initialSector,
}: {
  onGenerate: (sector: string) => void;
  initialSector?: string;
}) {
  const listed = SECTORS.find((s) => s === initialSector);
  const [selected, setSelected] = useState<string | null>(listed ?? null);
  const [other, setOther] = useState(false);
  const [custom, setCustom] = useState(listed ? "" : (initialSector ?? ""));

  const sector = other || (!selected && custom) ? custom.trim() : (selected ?? "");
  const ready = other ? custom.trim().length >= 2 : !!selected || custom.trim().length >= 2;

  return (
    <>
      <section className="hero">
        <span className="kicker">Signal Reactor · Organizational foresight — quantum + advanced AI</span>
        <h1>
          Deflate the <span className="deflated">hype</span>.
          <br />
          Extrapolate the <span className="signal">signal</span>.
        </h1>
        <p className="lede">
          Name your organization and get an eight-slide foresight briefing you can run a stakeholder
          discussion from — one that tells you plainly when quantum barely matters to you, and where
          the genuine disruption actually lands.
        </p>
        <p className="honesty">
          AI-generated foresight, not verified analysis. Use it to structure a conversation, not to
          make the decision.
        </p>
      </section>

      <section className="picker" aria-label="Choose your organization type">
        <span className="kicker">Choose your organization</span>
        <div className="sector-grid">
          {SECTORS.map((s) => (
            <button
              key={s}
              className="sector-tile"
              aria-pressed={!other && selected === s}
              onClick={() => {
                setSelected(s);
                setOther(false);
              }}
            >
              {s}
            </button>
          ))}
          <button
            className="sector-tile sector-tile--other"
            aria-pressed={other}
            onClick={() => {
              setOther(true);
              setSelected(null);
            }}
          >
            Other…
          </button>
        </div>
        {other && (
          <input
            className="other-input"
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ready) onGenerate(sector);
            }}
            placeholder={OTHER_PLACEHOLDER}
            aria-label="Describe your organization"
          />
        )}
        <div className="generate-row">
          <button className="generate-btn" disabled={!ready} onClick={() => onGenerate(sector)}>
            Generate briefing
          </button>
          <span className="generate-hint">
            {ready ? "≈ 30 seconds · 8 slides" : "pick a sector, or describe yours"}
          </span>
        </div>
      </section>
    </>
  );
}
