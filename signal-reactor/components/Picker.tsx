"use client";

/** Sector picker: curated 16-tile grid + "Other…" free text (brief §11). */

import { useState } from "react";
import { OTHER_PLACEHOLDER, SECTORS } from "../lib/sectors";
import { Reveal } from "./Reveal";

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
      {/* The page's own hero states the proposition; this section used to
          state it again under a second h1, so it is now just the picker. */}
      <section className="picker" aria-label="Choose your organisation type">
        <Reveal>
        <span className="kicker">Choose your organisation</span>
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
            aria-label="Describe your organisation"
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
        </Reveal>
      </section>
    </>
  );
}
