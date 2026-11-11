"use client";

import { useEffect, useRef, useState } from "react";

export type TableSpec = { cols: string[]; rows: (string | number | null)[][] };

/**
 * A dashboard card: title, one-line caption, the chart, and two controls that
 * every chart on the page carries: Table (the same data as rows, so nothing is
 * reachable only by hover or colour) and Download PNG.
 */
export function Panel({
  title,
  caption,
  span = 12,
  children,
  table,
  onDownload,
  aside,
}: {
  title: string;
  caption?: string;
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  children: React.ReactNode;
  table?: TableSpec;
  onDownload?: () => void;
  aside?: React.ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  // the caption's first sentence is the caption; anything after it is method and folds away
  const split = caption ? caption.match(/^([\s\S]*?[.!?])(?:\s+([\s\S]*))?$/) : null;
  const lead = split ? split[1] : caption;
  const more = split?.[2];
  // draw on arrival: the panel gets is-in once it has scrolled into view
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((x) => x.isIntersecting)) setSeen(true);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  // when the panel arrives, every mark gets a delay from its own left edge, so the data sweeps in left to right
  useEffect(() => {
    const el = ref.current;
    if (!el || !seen) return;
    const box = el.getBoundingClientRect();
    const marks = el.querySelectorAll<SVGGraphicsElement | HTMLElement>(".ds-svg circle, .ds-svg rect, .ds-svg path, .ds-svg polyline, .ds-person, .ds-ranked li");
    marks.forEach((m) => {
      const r = m.getBoundingClientRect();
      const f = box.width ? Math.max(0, Math.min(1, (r.left - box.left) / box.width)) : 0;
      const g = box.height ? Math.max(0, Math.min(1, (r.top - box.top) / box.height)) : 0;
      m.style.animationDelay = `${Math.round(f * 900 + g * 250)}ms`;
    });
  }, [seen]);
  return (
    <section ref={ref} className={`ds-panel ${seen ? "is-in" : ""}`} style={{ gridColumn: `span ${span}` }}>
      <header className="ds-panel-head">
        <div>
          <h2 className="ds-panel-title">{title}</h2>
          {lead ? <p className="ds-panel-caption">{lead}</p> : null}
        </div>
        {aside ? <div className="ds-panel-tools">{aside}</div> : null}
      </header>
      {asTable && table ? (
        <div className="ds-tablewrap ds-panel-table">
          <table className="ds-table ds-table--dense">
            <thead>
              <tr>
                {table.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j}>{v == null ? "" : typeof v === "number" ? v.toLocaleString("en-GB") : v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
      {more || table || onDownload ? (
        <footer className="ds-panel-foot">
          {more ? (
            <details className="ds-panel-more">
              <summary>How this is counted</summary>
              <p>{more}</p>
            </details>
          ) : (
            <span />
          )}
          <span className="ds-panel-tools">
            {table ? (
              <button type="button" className={`ds-tool ${asTable ? "is-on" : ""}`} onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                Table
              </button>
            ) : null}
            {onDownload ? (
              <button type="button" className="ds-tool" onClick={onDownload} disabled={asTable}>
                PNG
              </button>
            ) : null}
          </span>
        </footer>
      ) : null}
    </section>
  );
}
