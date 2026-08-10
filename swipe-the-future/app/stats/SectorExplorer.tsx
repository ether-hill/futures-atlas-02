"use client";

import { useMemo, useState } from "react";
import { VLABEL } from "../../data/sectors";
import type { CardStat, SectorStat } from "./stats-math";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Below this many swipes a per-card read is noise, so it is left unsaid. */
const MIN_READ = 5;
/** And below this much of a gap, the miss is noise too. */
const OFF = 0.12;

type Sort = "accuracy" | "activity" | "name";

/**
 * Every sector, openable to reveal each of its cards: what the claim was, where
 * the evidence sits, and how the split fell. The ranked table tells you a sector
 * is hard; this tells you which claim made it hard.
 */
export function SectorExplorer({
  sectors, cardsBySector, colours,
}: {
  sectors: SectorStat[];
  cardsBySector: Map<string, CardStat[]>;
  colours: { believe: string; doubt: string; mid: string };
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(sectors[0] ? [sectors[0].id] : []));
  const [sort, setSort] = useState<Sort>("activity");

  const ordered = useMemo(() => {
    const c = [...sectors];
    if (sort === "accuracy") c.sort((a, b) => a.accuracy - b.accuracy);      // hardest first
    else if (sort === "name") c.sort((a, b) => a.name.localeCompare(b.name));
    else c.sort((a, b) => b.n - a.n);
    return c;
  }, [sectors, sort]);

  if (!sectors.length) return null;

  const toggle = (id: string) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="sx-wrap">
      <div className="sx-tools">
        <span className="sx-toolslbl">Order by</span>
        {([["activity", "most played"], ["accuracy", "hardest first"], ["name", "A to Z"]] as const).map(([k, label]) => (
          <button key={k} className={`sx-sort${sort === k ? " on" : ""}`} onClick={() => setSort(k)}>{label}</button>
        ))}
        <button className="sx-sort ghost" onClick={() => setOpen(open.size ? new Set() : new Set(sectors.map((s) => s.id)))}>
          {open.size ? "collapse all" : "expand all"}
        </button>
      </div>

      <div className="st-explorer">
        {ordered.map((s) => {
          const isOpen = open.has(s.id);
          const cards = (cardsBySector.get(s.id) ?? [])
            .filter((c) => c.n > 0)
            .sort((a, b) => b.n - a.n);
          return (
            <div key={s.id} className={`st-sx${isOpen ? " open" : ""}`}>
              <button className="st-sxhead" onClick={() => toggle(s.id)} aria-expanded={isOpen}>
                <span className="st-sxchev" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
                <span className="st-sxname">{s.name}</span>
                {/* Deliberately worded so it cannot be read against the vote
                    split on the rows below. Those are one claim's two shares and
                    total 100; this is a whole sector's accuracy across every
                    answer, and the two used to sit in the same register, which
                    made them look like figures that ought to reconcile. */}
                <span className="st-sxscore">
                  <span className="st-sxbar" aria-hidden="true">
                    <span style={{ width: `${s.accuracy * 100}%` }} />
                  </span>
                  <b>{pct(s.accuracy)}</b> of {s.n} answers correct
                </span>
              </button>

              {isOpen && (
                <div className="st-sxbody">
                  {cards.length ? cards.map((c) => {
                    const off = c.gap > OFF ? colours.believe : c.gap < -OFF ? colours.doubt : colours.mid;
                    return (
                      <div className="st-card" key={c.id}>
                        <p className="st-cclaim">{c.claim}</p>
                        <div className="st-cbar" title={`${pct(c.pReal)} already real, ${pct(1 - c.pReal)} not yet`}>
                          <span className="st-cbtrue" style={{ width: `${c.pReal * 100}%` }} />
                          <span className="st-cbfalse" style={{ width: `${(1 - c.pReal) * 100}%` }} />
                        </div>
                        <div className="st-cmeta">
                          {/* one unit, one denominator: the split of this claim's
                              own swipes, which is why it is written as a pair */}
                          <span className="st-csplit">
                            <b style={{ color: colours.believe }}>{pct(c.pReal)}</b> already real
                            <i>/</i>
                            <b style={{ color: colours.doubt }}>{pct(1 - c.pReal)}</b> not yet
                            <em>of {c.n} swipe{c.n === 1 ? "" : "s"}</em>
                          </span>
                          <span className="st-cverdict">Answer: <b>{VLABEL[c.verdict]}</b></span>
                          {c.n >= MIN_READ && (
                            <span className="st-cgap" style={{ color: off }}>
                              {c.gap > OFF ? "hype trap" : c.gap < -OFF ? "blind spot" : "read right"}
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
    </div>
  );
}
