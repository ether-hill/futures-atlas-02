"use client";

import { useRef, useState } from "react";
import { placeOf } from "@/data/doom-score/response-places";
import { GROUPS, KIND_LABEL_R, OUTCOME, type ResponseAction } from "@/data/doom-score/response-types";

/**
 * Who acted, and when. Hover a mark for a small card saying what it is and
 * where; click to pin that card, which carries a link down to the full entry.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: string) => (d.length === 4 ? d : d.length === 7 ? `${MONTHS[+d.slice(5) - 1]} ${d.slice(0, 4)}` : `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`);
const tOf = (d: string) => +d.slice(0, 4) + (d.length >= 7 ? (+d.slice(5, 7) - 1) / 12 : 0.5) + (d.length >= 10 ? (+d.slice(8, 10) - 1) / 365 : d.length === 7 ? 0.04 : 0);
const OUT_COLOUR = { effect: "var(--ds-cat-5)", pending: "var(--muted)", stopped: "var(--ds-cat-2)" } as const;
const STATUS_WORD: Record<string, string> = { "in-force": "In force", passed: "Passed", signed: "Signed", launched: "Launched", held: "Held", proposed: "Proposed", vetoed: "Vetoed", revoked: "Revoked" };

export function ResponseTimeline({ rows }: { rows: ResponseAction[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ r: ResponseAction; x: number; y: number; pinned: boolean } | null>(null);
  const W = 1240, L = 176, R = 20, top = 30;
  const groups = GROUPS.filter((g) => rows.some((r) => g.match(r.jurisdiction)));
  const t0 = 2015, t1 = new Date().getUTCFullYear() + 1;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  // Each row is as tall as its busiest moment, so stacked dots never spill into the next row.
  const stackOf = (g: (typeof groups)[number]) => {
    const placed: number[] = [];
    let most = 0;
    for (const r of rows.filter((r) => g.match(r.jurisdiction)).sort((a, b) => (a.date < b.date ? -1 : 1))) {
      const xx = x(tOf(r.date));
      const k = placed.filter((p) => Math.abs(p - xx) < 9).length;
      placed.push(xx);
      most = Math.max(most, k);
    }
    return Math.max(46, Math.ceil(most / 2) * 20 + 30);
  };
  const heights = groups.map(stackOf);
  const tops = heights.map((_, i) => top + heights.slice(0, i).reduce((a, b) => a + b, 0));
  const H = top + heights.reduce((a, b) => a + b, 0) + 34;
  const years: number[] = [];
  for (let y = t0; y <= t1; y++) years.push(y);
  const place = (e: React.MouseEvent, r: ResponseAction, pinned: boolean) => {
    const box = wrap.current!.getBoundingClientRect();
    setTip({ r, x: e.clientX - box.left, y: e.clientY - box.top, pinned });
  };
  return (
    <div ref={wrap} className="rs-tl" onMouseLeave={() => setTip((t) => (t?.pinned ? t : null))}>
      <svg viewBox={`0 0 ${W} ${H}`} className="ds-svg" role="img" aria-label="Every action on AI risk by who took it and when" onClick={(e) => (e.target as Element).tagName === "svg" && setTip(null)}>
        {years.map((y) => (
          <g key={y}>
            <line x1={x(y)} x2={x(y)} y1={top - 10} y2={H - 30} stroke="var(--text)" strokeOpacity={0.07} />
            {y < t1 ? (
              <text x={x(y + 0.5)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {y}
              </text>
            ) : null}
          </g>
        ))}
        {groups.map((g, gi) => {
          const yc = tops[gi] + heights[gi] / 2;
          const mine = rows.filter((r) => g.match(r.jurisdiction)).sort((a, b) => (a.date < b.date ? -1 : 1));
          const placed: number[] = [];
          return (
            <g key={g.id}>
              <line x1={L} x2={W - R} y1={yc} y2={yc} stroke="var(--text)" strokeOpacity={0.12} />
              <text x={L - 14} y={yc + 4} textAnchor="end" fontSize={12.5} fontWeight={700} fill="var(--text)">
                {g.label}
              </text>
              {mine.map((r) => {
                const xx = x(tOf(r.date));
                const k = placed.filter((p) => Math.abs(p - xx) < 9).length;
                placed.push(xx);
                const yy = yc - (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 10;
                const out = OUTCOME[r.status];
                const col = OUT_COLOUR[out];
                const on = tip?.r.id === r.id;
                return (
                  <g key={r.id} className="rs-dot" onMouseEnter={(e) => (tip?.pinned ? null : place(e, r, false))} onClick={(e) => place(e, r, true)} style={{ cursor: "pointer" }}>
                    <circle cx={xx} cy={yy} r={12} fill="transparent" />
                    {r.namesCatastrophic ? <circle cx={xx} cy={yy} r={9.5} fill="none" stroke="var(--text)" strokeWidth={1.4} /> : null}
                    <circle cx={xx} cy={yy} r={on ? 7 : 5.5} fill={out === "pending" ? "var(--panel)" : col} stroke={on ? "var(--text)" : col} strokeWidth={2} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {tip ? (
        <div className={`rs-pop ${tip.pinned ? "is-pinned" : ""}`} style={{ left: Math.min(tip.x + 14, (wrap.current?.clientWidth ?? 800) - 300), top: tip.y + 14, ["--c" as string]: OUT_COLOUR[OUTCOME[tip.r.status]] }}>
          {tip.pinned ? (
            <button type="button" className="rs-pop-x" onClick={() => setTip(null)} aria-label="Close">
              ×
            </button>
          ) : null}
          <p className="rs-pop-meta">
            <b>{STATUS_WORD[tip.r.status]}</b> {placeOf(tip.r.jurisdiction).join(" ")} · {fmtDate(tip.r.date)}
          </p>
          <p className="rs-pop-title">{tip.r.title}</p>
          <p className="rs-pop-kind">
            {KIND_LABEL_R[tip.r.kind]}
            {tip.r.namesCatastrophic ? " · names catastrophic risk" : ""}
          </p>
          {tip.pinned ? (
            <a href={`#${tip.r.id}`} className="rs-pop-go" onClick={() => setTip(null)}>
              Go to the full entry ↓
            </a>
          ) : (
            <p className="rs-pop-hint">Click to pin</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
