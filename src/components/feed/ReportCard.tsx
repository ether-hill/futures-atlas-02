import Link from "next/link";
import { MosaicWall } from "@/components/report/MosaicWall";
import { formatPostDate } from "@/data/posts";
import { REPORTS, type ReportEntry } from "@/data/reports";

/**
 * The feed's card for a deep-dive report of our own.
 *
 * Deliberately NOT a Post. Every entry in posts.ts is commentary on someone
 * else's work and always shows the canonical `url` — that contract is the
 * feed's whole promise, and squeezing our own reporting into it would make
 * the Atlas the source of a link it also wrote. So the report gets a distinct
 * card that says what it is and spans the grid.
 *
 * Each card carries its own report's masthead wall, from the same MosaicWall
 * the hero mounts — so the card in the feed is a small piece of the page it
 * opens, and the two cannot drift apart. Every report harvests a checked image
 * set for this; a report without one has not finished its coverage section.
 *
 * The card is dark in both themes (the surrounding cards flip): a
 * scrim over photographs only works one way round, and these are the cards on
 * the feed that are whole reports.
 */

/** Every report, newest first. The feed renders the set. */
export function ReportCards() {
  return (
    <>
      {REPORTS.map((r) => (
        <ReportCard key={r.slug} report={r} />
      ))}
    </>
  );
}

export function ReportCard({ report = REPORTS[0] }: { report?: ReportEntry }) {
  return (
    <article // Two columns, not the full width. Full-bleed made three reports read as
      // three mastheads stacked down the page; at two they sit in the grid's
      // rhythm and the feed reads as a feed again.
      className="fa-reportcard relative isolate overflow-hidden border border-accent/40 bg-band min-[560px]:[grid-column:span_2]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Four rows is plenty behind a card this short, and the wall is the
            same one that report's hero uses. */}
        <MosaicWall tiles={report.tiles} perColumn={4} eagerRows={0} />
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.34)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.78)_60%,rgba(0,0,0,0.62)_100%)] min-[900px]:bg-[radial-gradient(96%_130%_at_-8%_45%,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.9)_34%,rgba(0,0,0,0.66)_56%,rgba(0,0,0,0.2)_80%,rgba(0,0,0,0)_94%)]" />
      </div>

      <Link href={report.href} className="group relative block p-6 min-[680px]:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="border border-accent/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] fa-rc-accent">
            Report
          </span>
          {/* The date, in place of the old "Atlas original · long read" —
              same position, and it actually tells you something. */}
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] fa-rc-dim">
            Published {formatPostDate(report.published)}
          </span>
        </div>

        <h2 className="mt-5 max-w-[16ch] text-[clamp(28px,4.2vw,52px)] font-medium leading-[1.02] tracking-[-0.035em] transition-colors">
          {report.title}
        </h2>

        <p className="mt-5 max-w-[54ch] text-[15px] leading-[1.7] fa-rc-body">{report.dek}</p>

        <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] fa-rc-accent">
          Read the report →
        </p>
      </Link>
    </article>
  );
}
