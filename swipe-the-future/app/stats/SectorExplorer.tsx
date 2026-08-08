"use client";

import { useState } from "react";
import { VLABEL } from "../../data/sectors";
import type { CardStat, SectorStat } from "./stats-math";
import { sensitivityLabel, leanLabel } from "./stats-math";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Below this many swipes a per-card read is noise, so it is left unsaid. */
const MIN_READ = 5;

/**
 * Every sector, openable to reveal each of its cards: what the claim was, where
 * the evidence sits, and how the split fell. This is the level the ranked table
 * can't show — the ranking tells you a sector is hard, this tells you which
 * claim made it hard.
 */
export function SectorExplorer({
  sectors, cardsBySector, colours,
}: {
  sectors: SectorStat[];
  cardsBySector: Map<string, CardStat[]>;
  colours: { believe: string; doubt: string; mid: string };
}) {
  const [open, setOpen] = useState<string | null>(sectors[0]?.id ?? null);

  if (!sectors.length) return null;

  return (
    <div className="st-explorer">
      {sectors.map((s) => {
        const isOpen = open === s.id;
        const cards = (cardsBySector.get(s.id) ?? [])
          .filter((c) => c.n > 0)
          .sort((a, b) => b.n - a.n);
        return (
          <div key={s.id} className={`st-sx${isOpen ? " open" : ""}`}>
            <button className="st-sxhead" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
              <span className="st-sxname">{s.name}</span>
              <span className="st-sxmeta">
                {s.measurable
                  ? `${sensitivityLabel(s.dPrime)} · ${leanLabel(s.lean)}`
                  : "accuracy only"}
              </span>
              <span className="st-sxacc">{pct(s.accuracy)}<i>right</i></span>
              <span className="st-sxn">{s.n}<i>answers</i></span>
              <span className="st-sxchev" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
            </button>

            {isOpen && (
              <div className="st-sxbody">
                {cards.length ? cards.map((c) => {
                  const off = c.gap > 0.12 ? colours.believe : c.gap < -0.12 ? colours.doubt : colours.mid;
                  return (
                    <div className="st-card" key={c.id}>
                      <p className="st-cclaim">{c.claim}</p>
                      <div className="st-cbar" title={`${pct(c.pTrue)} true · ${pct(1 - c.pTrue)} false`}>
                        <span className="st-cbtrue" style={{ width: `${c.pTrue * 100}%` }} />
                        <span className="st-cbfalse" style={{ width: `${(1 - c.pTrue) * 100}%` }} />
                      </div>
                      <div className="st-cmeta">
                        <span><b>{pct(c.pTrue)}</b> said true</span>
                        <span><b>{pct(1 - c.pTrue)}</b> said false</span>
                        <span className="st-cverdict">Evidence: {VLABEL[c.verdict]}</span>
                        <span className="st-cn">{c.n} swipe{c.n === 1 ? "" : "s"}</span>
                        {/* A verdict on two swipes is noise, so the read only
                            appears once there is enough of a sample to mean it. */}
                        {c.verdict !== "contested" && c.n >= MIN_READ && (
                          <span className="st-cgap" style={{ color: off }}>
                            {c.gap > 0.12 ? "over-believed" : c.gap < -0.12 ? "under-believed" : "well read"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : <p className="st-msg sm">Nobody has swiped this sector yet.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
