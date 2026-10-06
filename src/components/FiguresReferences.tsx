import { ACCESSED, REFERENCES, type FigureRef } from "@/data/futures-in-figures-references";

/**
 * The full reference list for one Futures in Figures chart. The data is
 * generated (src/data/futures-in-figures-references.ts) from the Crossref
 * record of each paper and the source details stored with the chart's data,
 * so a citation can't drift from the number it supports. Each entry says what
 * on the chart it supports and where in the source to find it.
 */
const linkCls = "text-accent-deep underline underline-offset-2 break-words";

function Citation({ r }: { r: FigureRef }) {
  const where = [r.volume, r.pages].filter(Boolean).join(", ");
  return (
    <>
      {r.authors} ({r.year}). {r.title}. <i>{r.venue}</i>
      {where ? `, ${where}` : ""}.{" "}
      <a className={linkCls} href={r.url} target="_blank" rel="noopener">
        {r.doi ? `doi:${r.doi}` : r.url.replace(/^https?:\/\//, "")}
      </a>
      {r.openAccess && (
        <>
          {" "}
          (
          <a className={linkCls} href={r.openAccess} target="_blank" rel="noopener">
            free preprint
          </a>
          )
        </>
      )}
      {r.pdf && (
        <>
          {" "}
          (
          <a className={linkCls} href={r.pdf} target="_blank" rel="noopener">
            PDF
          </a>
          )
        </>
      )}
    </>
  );
}

function RefList({ refs, start = 1, verb = "Supports" }: { refs: FigureRef[]; start?: number; verb?: string }) {
  return (
    <ol start={start} className="mt-3 grid list-decimal gap-4 pl-6 marker:text-muted">
      {refs.map((r) => (
        <li key={r.url} className="pl-1">
          <p className="text-[var(--text-body)]">
            <Citation r={r} />
          </p>
          <p className="mt-1 text-[13px] text-muted">
            <span className="text-[var(--text-body)]">{r.type}.</span> {verb}:{" "}
            {r.uses.map((u, i) => (
              <span key={i}>
                {u.what}
                {u.where ? ` (${u.where})` : ""}
                {i < r.uses.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function FiguresReferences({ slug }: { slug: string }) {
  const refs = REFERENCES[slug] ?? [];
  const plotted = refs.filter((r) => r.plotted);
  const consulted = refs.filter((r) => !r.plotted);
  return (
    <details aria-label="Sources" className="group mt-8 border-t border-hairline pt-5 text-[14px] leading-relaxed">
      {/* closed by default: the list is long, and the chart is what the page is for */}
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-[var(--text)] [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="shrink-0 transition-transform duration-200 group-open:rotate-90">
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Sources
        <span className="font-normal text-muted">({refs.length})</span>
      </summary>
      <p className="mt-3 text-muted">
          <a className={linkCls} href={`/futures-in-figures/charts/data/${slug}/METHOD.md`}>
            Method note
          </a>
          {" · "}
          <a className={linkCls} href={`/futures-in-figures/charts/data/${slug}/clean.csv`}>
            Chart data (CSV)
          </a>
          {" · "}All accessed {ACCESSED}
      </p>
      <RefList refs={plotted} />
      {consulted.length > 0 && (
        <>
          <h4 className="mt-6 text-[13px] font-semibold text-muted">Also consulted, not plotted</h4>
          <RefList refs={consulted} start={plotted.length + 1} verb="Checked for" />
        </>
      )}
    </details>
  );
}
