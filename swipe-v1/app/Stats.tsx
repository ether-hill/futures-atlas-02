"use client";

import { useEffect, useState } from "react";
import { ROLES } from "../data/roles";

const ALL = ROLES.flatMap((r) => r.cards.map((c) => ({ id: c.id, claim: c.claim, verdict: c.verdict, cat: r.name })));

export default function Stats({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/swipe", { cache: "no-store" }).then((r) => r.json()).then(setData).catch(() => setErr(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const n = (k: string) => Number(data?.[k] ?? 0);
  const swipes = n("swipes"), believe = n("believe"), doubt = n("doubt");
  const aligned = n("aligned"), scored = n("scored"), rounds = n("rounds");
  const pct = (x: number, of: number) => (of > 0 ? Math.round((x / of) * 100) : 0);

  const cards = ALL.map((c) => {
    const b = n(`c:${c.id}:b`), d = n(`c:${c.id}:d`), total = b + d;
    const wrong = c.verdict === "contested" ? 0 : c.verdict === "unlikely" ? b : d;
    return { ...c, b, d, total, wrongPct: total ? wrong / total : 0 };
  });
  const fooled = cards.filter((c) => c.total >= 3 && c.verdict !== "contested").sort((a, b) => b.wrongPct - a.wrongPct).slice(0, 6);
  const believed = cards.filter((c) => c.total >= 3).sort((a, b) => b.b / b.total - a.b / a.total).slice(0, 5);

  const empty = !err && swipes === 0;

  return (
    <div className="stats-lb" onClick={onClose} role="dialog" aria-modal="true" aria-label="Swipe metrics">
      <div className="stats-panel" onClick={(e) => e.stopPropagation()}>
        <header className="stats-head">
          <span className="kicker">Swipe the Future · live metrics</span>
          <button className="stats-x" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {err ? (
          <p className="stats-msg">Couldn&apos;t reach the metrics store.</p>
        ) : !data ? (
          <p className="stats-msg">Loading…</p>
        ) : empty ? (
          <p className="stats-msg">No swipes recorded yet. (If this stays empty in production, the KV store isn&apos;t configured.)</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat"><span className="sv">{swipes.toLocaleString()}</span><span className="sk">swipes</span></div>
              <div className="stat"><span className="sv">{rounds.toLocaleString()}</span><span className="sk">rounds completed</span></div>
              <div className="stat"><span className="sv">{pct(believe, swipes)}%</span><span className="sk">believe vs {pct(doubt, swipes)}% doubt</span></div>
              <div className="stat"><span className="sv">{pct(aligned, scored)}%</span><span className="sk">matched the evidence</span></div>
            </div>

            <div className="stats-sec">
              <div className="stats-lbl">Most-fooled claims — where the crowd most disagreed with the evidence</div>
              {fooled.length ? fooled.map((c) => (
                <div className="stats-row" key={c.id}>
                  <span className="sr-pct">{Math.round(c.wrongPct * 100)}%</span>
                  <span className="sr-txt"><b>{c.claim}</b> <span>· {c.cat} · {c.total} swipes</span></span>
                </div>
              )) : <p className="stats-msg sm">Not enough data yet.</p>}
            </div>

            <div className="stats-sec">
              <div className="stats-lbl">Most-believed claims</div>
              {believed.length ? believed.map((c) => (
                <div className="stats-row" key={c.id}>
                  <span className="sr-pct">{pct(c.b, c.total)}%</span>
                  <span className="sr-txt"><b>{c.claim}</b> <span>· {c.cat}</span></span>
                </div>
              )) : <p className="stats-msg sm">Not enough data yet.</p>}
            </div>
          </>
        )}
        <div className="stats-foot">Press Esc to close</div>
      </div>
    </div>
  );
}
