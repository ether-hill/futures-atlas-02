"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { InterferenceField } from "@/components/InterferenceField";
import {
  CLUSTERS,
  DIGEST_PER_SUBJECT,
  MAX_HELD,
  MAX_PER_SUBJECT,
  SPARK,
  QUERY_GROUPS,
  TEXT_BLOCK,
  TOPICS,
  TOP_PICKS,
  VENUE_BLOCK,
  WINDOW_DAYS,
  topicById,
  topicsOf,
  type ClusterId,
} from "@/data/horizon-scan";
import type { ScanResult, ScannedPaper } from "@/lib/horizon-scan/types";

/**
 * The whole result set is already in the page, so every control here is client
 * side. Same reasoning as the glossary: a round trip per chip press would be
 * slower and worse, and there is nothing private in the data.
 *
 * Two views. Grid is for scanning titles; list is the reading layout, a
 * metadata rail on the left and the paper on the right, one per row. The list
 * is the default because a hundred cards is a wall and a hundred rows is a
 * list of papers.
 */

type Sort = "rank" | "new" | "crossover" | "boldest" | "standing" | "cited";
type View = "list" | "grid";

/**
 * `needs` is what a sort has to have data for to be worth offering. Most cited
 * and Standing both read figures that only journals carry, so on a run where
 * OpenAlex did not answer they were chips that did nothing when pressed. A
 * control with no effect is worse than no control, so they are hidden rather
 * than left there looking broken.
 */
const SORTS: { key: Sort; label: string; hint: string; needs?: (p: ScannedPaper) => boolean }[] = [
  { key: "rank", label: "Best match", hint: "The ranking described under the rules" },
  { key: "new", label: "Newest", hint: "Publication date, newest first" },
  { key: "crossover", label: "Crossover", hint: "Most subjects matched squarely, then rank" },
  { key: "boldest", label: "Boldest", hint: "Reads like a finding rather than a framework" },
  {
    key: "standing",
    label: "Standing",
    hint: "Journal, author and institution citation figures. Read the caveat under the rules",
    needs: (p) => p.standing !== null,
  },
  {
    key: "cited",
    label: "Most cited",
    hint: "Citations so far, which inside the window is not many",
    needs: (p) => (p.citedBy ?? 0) > 0,
  },
];

/** Stable per-paper anchor, so the digest at the top can link into the list. */
const anchorOf = (p: ScannedPaper) => `p-${p.id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export function HorizonScanBrowser({ result }: { result: ScanResult | null }) {
  const [cluster, setCluster] = useState<ClusterId | null>(null);
  const [convergentOnly, setConvergentOnly] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("rank");
  const [view, setView] = useState<View>("grid");

  // Hoisted through a memo so the lists below do not see a fresh array
  // identity on every keystroke.
  const papers = useMemo(() => result?.papers ?? [], [result]);


  const counts = useMemo(() => {
    const m = new Map<ClusterId, number>();
    for (const p of papers) for (const c of p.clusters) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [papers]);

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = papers.filter((p) => {
      if (cluster && !p.clusters.includes(cluster)) return false;
      if (convergentOnly && !p.convergent) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        (p.abstract ?? "").toLowerCase().includes(needle) ||
        (p.venue ?? "").toLowerCase().includes(needle) ||
        p.authors.some((a) => a.toLowerCase().includes(needle))
      );
    });
    const chosen = SORTS.find((s) => s.key === sort);
    if (sort === "rank" || (chosen?.needs && !papers.some(chosen.needs))) return list;
    const sorted = [...list];
    if (sort === "new") sorted.sort((a, b) => b.date.localeCompare(a.date) || b.score - a.score);
    if (sort === "crossover")
      sorted.sort((a, b) => b.strongClusters.length - a.strongClusters.length || b.score - a.score);
    if (sort === "boldest") sorted.sort((a, b) => b.spark - a.spark || b.score - a.score);
    if (sort === "standing")
      sorted.sort((a, b) => (b.standing?.score ?? 0) - (a.standing?.score ?? 0) || b.score - a.score);
    if (sort === "cited")
      sorted.sort((a, b) => (b.citedBy ?? 0) - (a.citedBy ?? 0) || b.score - a.score);
    return sorted;
  }, [papers, cluster, convergentOnly, needle, sort]);

  /*
   * The board is the top of whatever you are currently looking at, because the
   * controls now sit above it. Unfiltered it is the same ten the scan chose and
   * fetched figures for; filter to a subject and it becomes the best of that.
   *
   * The per-subject cap only applies when nothing is filtered — asking for
   * Quantum and being handed two Quantum papers would be the cap fighting the
   * request.
   */
  const digest = useMemo(() => {
    const out: ScannedPaper[] = [];
    const perSubject = new Map<ClusterId, number>();
    for (const p of filtered) {
      if (out.length >= TOP_PICKS) break;
      if (cluster === null) {
        const n = (perSubject.get(p.primaryCluster) ?? 0) + 1;
        if (n > DIGEST_PER_SUBJECT) continue;
        perSubject.set(p.primaryCluster, n);
      }
      out.push(p);
    }
    return out;
  }, [filtered, cluster]);

  const rest = useMemo(() => {
    const inDigest = new Set(digest.map((p) => p.id));
    return filtered.filter((p) => !inDigest.has(p.id));
  }, [filtered, digest]);

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <Masthead result={result} showing={papers.length} />

        {result && result.papers.length > 0 && (
          <>
            <Controls
              q={q}
              setQ={setQ}
              sort={sort}
              setSort={setSort}
              view={view}
              setView={setView}
              cluster={cluster}
              setCluster={setCluster}
              counts={counts}
              total={papers.length}
              items={papers}
              convergentOnly={convergentOnly}
              setConvergentOnly={setConvergentOnly}
            />

            {filtered.length === 0 ? (
              <p className="mt-[clamp(40px,6vw,80px)] font-mono text-[13px] text-graphite">
                Nothing in this run matches those filters. The rules below decide what gets
                held; widen one if something you expect keeps missing.
              </p>
            ) : (
              <>
                <Digest papers={digest} filtered={cluster !== null || Boolean(needle)} />

                {rest.length > 0 && (
                  <>
                    <SectionHead
                      label="Everything else"
                      note={`${rest.length} more, the ${digest.length} above excluded`}
                    />
                    {view === "grid" ? (
                      <Board>
                        {rest.map((p) => (
                          <GridCard key={p.id} paper={p} />
                        ))}
                      </Board>
                    ) : (
                      <ol className="mt-[clamp(16px,2vw,28px)] m-0 list-none p-0">
                        {rest.map((p, i) => (
                          <ListRow key={p.id} paper={p} n={i + 1} />
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        <Rules result={result} />
      </Container>
    </div>
  );
}

/* ── header ──────────────────────────────────────────────────────────────── */

/** `showing` is the whole held set, digest included: the line names what the
 *  page is, and the split between the ten and the rest is the page's business,
 *  not the headline's. */
function Masthead({ result, showing }: { result: ScanResult | null; showing: number }) {
  return (
    <header className="relative">
      {/*
        The rain field from /interference, faint, behind the title only. Same
        watermark the projects index uses. Its own mask fades it out before the
        first line of the digest, so nothing below reads through it; the field
        holds still under prefers-reduced-motion.
      */}
      <InterferenceField
        className="pointer-events-none absolute inset-x-0 -top-[clamp(40px,7vw,90px)] fa-scan-field hidden h-[clamp(320px,42vh,480px)] w-full [mask-composite:intersect] [-webkit-mask-composite:source-in] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_22%,#000_46%,transparent_96%),linear-gradient(to_right,transparent_0%,#000_10%,#000_88%,transparent_100%)] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_22%,#000_46%,transparent_96%),linear-gradient(to_right,transparent_0%,#000_10%,#000_88%,transparent_100%)] md:block"
        speed={0.09}
      />

      <div className="relative">
        {/* One line, and it says what the page is. Everything about how the run
            went now lives at the bottom with the rules: it is accounting, and
            accounting does not belong above the thing it accounts for. */}
        <div className="mb-3.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            {result ? `Top ${showing} relevant open research articles` : "run failed"}
          </span>
        </div>

        <h1 className="max-w-[18ch] text-[clamp(36px,5.4vw,80px)] font-extrabold leading-[0.94] tracking-[-0.025em] text-ink text-balance">
          Horizon Scan
        </h1>

        <p
          className="mt-[clamp(14px,1.8vw,22px)] max-w-[54ch]"
          style={{
            fontSize: "var(--text-lead, var(--text-body-size))",
            lineHeight: "1.45",
            color: "var(--text-body)",
          }}
        >
          A collection of the latest and most relevant open research, gathered from OpenAlex
          and arXiv and sorted by rules rather than by anyone&rsquo;s taste. Every paper here
          is free to read.
        </p>
      </div>

      {result === null && (
        <p className="relative mt-8 rounded-[3px] border border-accent/50 p-4 font-mono text-[13px] text-ink">
          Both indexes failed to answer on this run. Nothing is being shown rather than
          something stale: there is no stored copy of a previous run.
        </p>
      )}
    </header>
  );
}

/** "1 Sep 2026, 04:12 UTC" — deterministic on both sides of hydration. */
function runStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * The grid, and there is only one of it: the same one the projects index uses.
 *
 * Separate `.fa-card`s on a gap, each with a 3:2 plate on top and a body under
 * it, rather than the hairline board this had before. Two grid treatments on
 * one site reads as two sites, and the projects page is the house pattern.
 */
function Board({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-[clamp(16px,2vw,28px)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gap: "clamp(24px, 2.2vw, 40px)" }}
    >
      {children}
    </div>
  );
}

/**
 * The thumbnail, and it only exists on the ten at the top.
 *
 * The figure is the paper's own, hot-linked from arXiv's rendering of it, and
 * scientific figures are drawn for white paper with a lot of margin: dropped
 * straight into a 3:2 frame they float in a void, and cropping them to fill it
 * loses the part that carried the point. So the same image does both jobs — a
 * scaled, blurred copy fills the frame and gives the plate a ground taken from
 * the figure itself, and a sharp contained copy sits on top of it. One request,
 * two layers, no cropping.
 *
 * Cards below the ten carry no plate at all. A grid of ninety hatched
 * rectangles is not a picture, it is ninety absences.
 */
function Plate({ paper }: { paper: ScannedPaper }) {
  const [ok, setOk] = useState(true);
  if (!paper.figure || !ok) return null;
  const src = paper.figure.url;
  const isPage = paper.figure.kind === "page";
  const alt = isPage
    ? "The paper's first page"
    : paper.figure.caption
      ? `Figure from the paper: ${paper.figure.caption}`
      : "A figure from the paper";
  return (
    <div
      className="relative aspect-[3/2] overflow-hidden bg-paper"
      style={{ borderBottom: "var(--border-hairline) solid var(--hairline)" }}
    >
      {/* The ground, for a figure only: a scaled, blurred, dimmed copy of the
          same image, so a figure drawn on white does not float in a void. A
          rendered page is already cropped to this frame and fills it, and
          repeating it would only double a data URI that is inlined twice
          already. */}
      {!isPage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl"
        />
      )}
      {/* the picture itself. A figure is contained, whole, because cropping it
          loses the point; a title page is a page, so it is anchored to its top
          edge and allowed to run off the bottom of the frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setOk(false)}
        className={
          isPage
            ? "absolute inset-0 h-full w-full object-cover object-top"
            : "absolute inset-0 h-full w-full object-contain p-[clamp(10px,1.4vw,20px)]"
        }
      />
      <span
        className="absolute bottom-0 right-0 z-[2] font-mono uppercase"
        style={{
          margin: "var(--space-3)",
          fontSize: "var(--text-micro)",
          letterSpacing: "var(--track-label)",
          color: "color-mix(in srgb, #17181b 50%, transparent)",
        }}
      >
        {paper.figure.kind === "page" ? "First page" : "Figure from the paper"}
      </span>
    </div>
  );
}

/** A ruled heading with a note on the right. Same shape everywhere. */
function SectionHead({ label, note }: { label: string; note: string }) {
  return (
    <div className="mt-[clamp(32px,5vw,60px)] mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
        {label}
      </h2>
      <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{note}</span>
    </div>
  );
}

/* ── the digest ──────────────────────────────────────────────────────────── */

/**
 * A board rather than a list: the run's ten best, the first with the room to be
 * read properly and the rest beside it, all linking down into the list.
 *
 * Each one carries the paper's own strongest sentence, pulled out of its
 * abstract by interest.ts. It is extracted and never written, because this page
 * has no editor and a generated summary would be the one thing on it nobody can
 * check against the source.
 *
 * The ten are capped at DIGEST_PER_SUBJECT each so it reads as a spread rather
 * than as whichever subject matched hardest this morning, and it ignores the
 * filters below so it stays the same ten however the list is sliced.
 */
function Digest({ papers, filtered }: { papers: ScannedPaper[]; filtered: boolean }) {
  if (papers.length === 0) return null;
  const [lead, ...rest] = papers;

  return (
    <section aria-labelledby="digest-heading">
      <div className="mt-[clamp(32px,5vw,60px)] mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2
          id="digest-heading"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep"
        >
          Start here
        </h2>
        <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {filtered
            ? `the best ${papers.length} of what you are looking at, opens the paper`
            : `${papers.length}, at most ${DIGEST_PER_SUBJECT} a subject, opens the paper`}
        </span>
      </div>

      <Board>
        <a
          href={lead.url}
          target="_blank"
          rel="noopener noreferrer"
          className="fa-card fa-card--link group sm:col-span-2 lg:col-span-3"
        >
          <div className="flex flex-col min-[720px]:flex-row">
            {lead.figure && (
              <div className="shrink-0 min-[720px]:w-[clamp(240px,32vw,420px)]">
                <Plate paper={lead} />
              </div>
            )}
            <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
              <div
                className="flex items-center justify-between"
                style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
              >
                <span className="fa-card__meta">{paperMeta(lead)}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-label)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--track-label)",
                    color: "var(--muted)",
                  }}
                >
                  {shortDate(lead.date)}
                </span>
              </div>
              <h3
                className="max-w-[34ch] font-extrabold leading-[1.05] tracking-[-0.022em] text-ink transition-colors group-hover:text-accent"
                style={{ fontSize: "clamp(22px, 2.8vw, 38px)" }}
              >
                {lead.title}
              </h3>
              <p className="mt-2.5 text-[12px] leading-[1.6] text-faint">{byline(lead.authors)}</p>
              {(lead.keySentence || lead.abstract) && (
                <p
                  style={{
                    marginTop: "var(--space-4)",
                    maxWidth: "62ch",
                    fontSize: "var(--text-body-size)",
                    lineHeight: "var(--lh-body)",
                    color: "var(--text-body)",
                  }}
                >
                  {lead.keySentence
                    ? `\u201C${lead.keySentence}\u201D`
                    : `${lead.abstract!.slice(0, 280).trimEnd()}\u2026`}
                </p>
              )}
              <div style={{ marginTop: "var(--space-4)" }}>
                <SubjectMarks paper={lead} />
              </div>
              <Cta />
            </div>
          </div>
        </a>

        {rest.map((p, i) => (
          <DigestCard key={p.id} paper={p} n={i + 2} />
        ))}
      </Board>
    </section>
  );
}




/** The subjects a paper actually lands in, as the digest's only ornament. */
function SubjectMarks({ paper, compact = false }: { paper: ScannedPaper; compact?: boolean }) {
  const subjects = paper.strongClusters.length ? paper.strongClusters : paper.clusters.slice(0, 2);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {subjects.map((c) => (
        <span
          key={c}
          className={`rounded-[2px] font-mono uppercase tracking-[0.12em] ${
            compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
          } ${paper.convergent ? "bg-band text-paper" : "border border-ink/25 text-ink/60"}`}
        >
          {clusterChip(c)}
        </span>
      ))}
    </span>
  );
}

/* ── controls ────────────────────────────────────────────────────────────── */

function Controls({
  q,
  setQ,
  sort,
  setSort,
  view,
  setView,
  cluster,
  setCluster,
  counts,
  total,
  items,
  convergentOnly,
  setConvergentOnly,
}: {
  q: string;
  setQ: (v: string) => void;
  sort: Sort;
  setSort: (v: Sort) => void;
  view: View;
  setView: (v: View) => void;
  cluster: ClusterId | null;
  setCluster: (v: ClusterId | null) => void;
  counts: Map<ClusterId, number>;
  total: number;
  items: ScannedPaper[];
  convergentOnly: boolean;
  setConvergentOnly: (v: boolean) => void;
}) {
  return (
    <>
      <div className="mt-[clamp(28px,4vw,44px)] flex flex-wrap items-center gap-3">
        <div className="max-w-[520px] flex-1 basis-[260px]">
          <label htmlFor="scan-search" className="sr-only">
            Search the held papers
          </label>
          {/* 16px minimum: anything smaller makes iOS Safari zoom the page on focus */}
          <input
            id="scan-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, abstracts, authors, journals…"
            className="w-full rounded-[3px] border border-ink/25 bg-transparent px-4 py-3 font-mono text-[16px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Order
        </span>
        {SORTS.filter((s) => !s.needs || items.some(s.needs)).map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            title={s.hint}
            active={sort === s.key}
            onClick={() => setSort(s.key)}
          />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Subject
        </span>
        <Chip label="All" count={total} active={cluster === null} onClick={() => setCluster(null)} />
        {CLUSTERS.map((c) => (
          <Chip
            key={c.id}
            label={c.chip}
            title={c.label}
            count={counts.get(c.id) ?? 0}
            active={cluster === c.id}
            onClick={() => setCluster(cluster === c.id ? null : c.id)}
          />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Only
        </span>
        <Chip
          label="Convergent"
          title="Squarely in two or more subjects"
          count={items.filter((p) => p.convergent).length}
          active={convergentOnly}
          onClick={() => setConvergentOnly(!convergentOnly)}
        />
      </div>

    </>
  );
}

function ViewToggle({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div className="inline-flex shrink-0 gap-1.5" role="group" aria-label="View">
      <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <line x1="1" y1="3" x2="15" y2="3" />
          <line x1="1" y1="8" x2="15" y2="8" />
          <line x1="1" y1="13" x2="15" y2="13" />
        </svg>
      </ViewButton>
      <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Grid view">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="1" y="1" width="5.5" height="5.5" />
          <rect x="9.5" y="1" width="5.5" height="5.5" />
          <rect x="1" y="9.5" width="5.5" height="5.5" />
          <rect x="9.5" y="9.5" width="5.5" height="5.5" />
        </svg>
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid h-[42px] w-[46px] place-items-center rounded-[2px] border transition-colors ${
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/60 hover:border-ink/60"
      }`}
    >
      {children}
    </button>
  );
}

/** The run's accounting, at the foot of the page with the rest of the method.
 *  A feed with no editor owes the reader this, but it is a footnote and it was
 *  sitting above the papers. */
function RunLedger({ result }: { result: ScanResult }) {
  const s = result.stats;
  return (
    <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)] min-[900px]:col-span-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
        What this run did · last run {runStamp(result.ranAt)}
      </h3>
      {s.failed > 0 && (
        <p className="mt-2 text-[11px] leading-[1.7] text-faint">
          {s.failed} of {s.queries} queries did not answer, so this list is short by whatever
          they held.
        </p>
      )}
      <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
        <Stat label="retrieved" value={s.retrieved} />
        <Stat label="duplicates" value={s.duplicates} />
        <Stat label="no rule matched" value={s.offTopic} />
        <Stat label="mention only" value={s.thin} />
        <Stat label="binned" value={s.binned} />
        <Stat label="cleared the bar" value={s.kept} />
        <Stat label="over subject cap" value={s.capped} />
        <Stat label="with standing" value={s.withStanding} />
        <Stat label="with a figure" value={s.withFigure} />
        <Stat label="shown" value={s.shown} />
        <Stat label="queries" value={s.queries} />
      </dl>
      {s.kept > s.shown && (
        <p className="mt-2.5 font-mono text-[11px] leading-[1.7] text-faint">
          {s.kept - s.shown} more cleared the bar than fit on the page. The list stops at{" "}
          {MAX_HELD}, ranked; filter to see further down.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt>{label}</dt>
      <dd className="m-0 font-bold text-ink">{value.toLocaleString("en-GB")}</dd>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
  title,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/70 hover:border-ink/60"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={active ? "text-paper/60" : "text-ink/40"}>{count}</span>
      )}
    </button>
  );
}

/* ── card pieces, shared with the projects grid's shape ─────────────────── */

/** The left half of a card's meta row: where it appeared, and whether anyone
 *  checked it. The date goes on the right, as it does on a project card. */
function paperMeta(paper: ScannedPaper): string {
  const bits = [paper.venue ?? "Unlisted venue"];
  if (paper.source === "arxiv" && paper.reviewed) bits.push("via arXiv");
  if (!paper.reviewed) bits.push("not peer reviewed");
  return bits.join(" · ");
}

/** The underlined call to action a project card ends on. */
function Cta({ label = "Open the paper" }: { label?: string }) {
  return (
    <span
      className="self-start"
      style={{
        marginTop: "var(--space-6)",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        borderBottom: "var(--border-emphasis) solid var(--text)",
        paddingBottom: "2px",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
        color: "var(--text)",
      }}
    >
      {label}
      <span>↗</span>
    </span>
  );
}

/** One of the nine under the lead. Whole card is the link. */
function DigestCard({ paper, n }: { paper: ScannedPaper; n: number }) {
  return (
    <a
      href={paper.url}
      target="_blank"
      rel="noopener noreferrer"
      className="fa-card fa-card--link group"
    >
      <Plate paper={paper} />
      <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
        <div
          className="flex items-center justify-between"
          style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
        >
          <span className="fa-card__meta">{paperMeta(paper)}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              textTransform: "uppercase",
              letterSpacing: "var(--track-label)",
              color: "var(--muted)",
            }}
          >
            {shortDate(paper.date)}
          </span>
        </div>
        <h3 className="fa-card__title transition-colors group-hover:text-accent">
          {!paper.figure && (
            <span
              aria-hidden
              className="mr-2.5 font-mono tabular-nums"
              style={{ color: "color-mix(in srgb, var(--text) 22%, transparent)" }}
            >
              {String(n).padStart(2, "0")}
            </span>
          )}
          {paper.title}
        </h3>
        <p className="mt-2 text-[11px] leading-[1.6] text-faint">{byline(paper.authors)}</p>
        {paper.keySentence && (
          <p
            style={{
              marginTop: "var(--space-3)",
              maxWidth: "52ch",
              fontSize: "var(--text-body-size)",
              lineHeight: "var(--lh-body)",
              color: "var(--text-body)",
            }}
          >
            &ldquo;{paper.keySentence}&rdquo;
          </p>
        )}
        <div style={{ marginTop: "var(--space-4)" }}>
          <SubjectMarks paper={paper} compact />
        </div>
        <Cta />
      </div>
    </a>
  );
}

/* ── shared card parts ───────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const clusterChip = (id: ClusterId) => CLUSTERS.find((c) => c.id === id)?.chip ?? id;

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  if (!m) return String(y);
  return `${d ? `${d} ` : ""}${MONTHS[m - 1]} ${y}`;
}

function byline(authors: string[]): string {
  if (authors.length === 0) return "No byline in the index";
  if (authors.length <= 3) return authors.join(", ");
  return `${authors.slice(0, 3).join(", ")} and ${authors.length - 3} more`;
}

/**
 * The paper in one line, then the whole abstract behind it.
 *
 * The line is the paper's own strongest sentence, extracted by interest.ts,
 * never written: a generated summary would be the one thing on this page that
 * cannot be checked against its source. Where nothing scores, the abstract is
 * simply clipped as before.
 */
function Summary({
  keySentence,
  abstract,
  clip,
}: {
  keySentence?: string;
  abstract?: string;
  clip: number;
}) {
  const [open, setOpen] = useState(false);
  if (!abstract) return null;
  const clipped = abstract.length > clip ? `${abstract.slice(0, clip).trimEnd()}…` : abstract;

  return (
    <>
      {keySentence && !open && (
        <p
          style={{
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          &ldquo;{keySentence}&rdquo;
        </p>
      )}
      {(!keySentence || open) && (
        <p
          style={{
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          {open ? abstract : clipped}
        </p>
      )}
      {(keySentence || abstract.length > clip) && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite underline underline-offset-4 transition-colors hover:text-accent"
        >
          {open ? "Less" : keySentence ? "Whole abstract" : "More"}
        </button>
      )}
    </>
  );
}

/** Why this one is here. The page has no editor, so every entry carries its own
 *  justification: which rules fired, and on which words. A topic the paper is
 *  actually about is marked; a topic it only mentions is dimmed. */
function Why({ paper }: { paper: ScannedPaper }) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {paper.topics.map((id) => {
          const t = topicById(id);
          if (!t) return null;
          const solid = paper.solidTopics.includes(id);
          return (
            <span
              key={id}
              title={solid ? "In the title, or more than once" : "Mentioned once"}
              className={`rounded-[2px] border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${
                solid ? "border-ink/35 text-ink/80" : "border-ink/15 text-ink/45"
              }`}
            >
              {t.label}
            </span>
          );
        })}
      </div>
      {paper.hits.length > 0 && (
        <p className="mt-2 text-[10px] leading-[1.6] text-faint">
          matched on {paper.hits.map((h) => `“${h}”`).join(", ")}
        </p>
      )}
      {(paper.claims.length > 0 || paper.drags.length > 0) && (
        <p className="mt-1 text-[10px] leading-[1.6] text-faint">
          {paper.claims.length > 0 && (
            <span className="text-accent-deep">
              claims {paper.claims.map((c) => `“${c}”`).join(", ")}
            </span>
          )}
          {paper.claims.length > 0 && paper.drags.length > 0 && " · "}
          {paper.drags.length > 0 && (
            <span>reads as {paper.drags.map((d) => `“${d}”`).join(", ")}</span>
          )}
        </p>
      )}
    </>
  );
}

/**
 * The reputation figures, printed rather than folded into the score. All three
 * are citation counts in costume, so they are shown as what they are and the
 * caveat sits under the rules. Nothing renders when the index knows nothing,
 * which is every arXiv record.
 */
function StandingLine({ paper }: { paper: ScannedPaper }) {
  const st = paper.standing;
  if (!st) return null;
  const bits: string[] = [];
  if (st.venueCitedness != null) bits.push(`journal cited ${st.venueCitedness.toFixed(1)}× per paper`);
  if (st.authorH != null) bits.push(`author h-index ${st.authorH}`);
  if (st.instCitedness != null && st.instName) bits.push(st.instName);
  if (bits.length === 0) return null;
  return (
    <p
      className="mt-2 font-mono text-[9px] uppercase leading-[1.7] tracking-[0.12em] text-faint"
      title="Two-year mean citations for the journal, the higher h-index of the first and last author, and the best-cited institution on the byline. Attention, not quality — see the rules."
    >
      standing · {bits.join(" · ")}
    </p>
  );
}

function Links({ paper }: { paper: ScannedPaper }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em]">
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-deep underline underline-offset-4"
      >
        Open ↗
      </a>
      {paper.pdfUrl && (
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-graphite underline underline-offset-4 transition-colors hover:text-accent"
        >
          PDF ↗
        </a>
      )}
      {paper.doi && (
        <a
          href={`https://doi.org/${paper.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-graphite underline underline-offset-4 transition-colors hover:text-accent"
        >
          DOI ↗
        </a>
      )}
    </div>
  );
}

/**
 * The subjects a paper lands in. A crossover paper simply shows two of them
 * filled in, which is the fact itself; the word "convergent" on top of that was
 * a label on a label. The idea still drives the ranking, the Crossover sort and
 * the Convergent filter.
 */
function Marks({ paper }: { paper: ScannedPaper }) {
  const subjects = paper.strongClusters.length ? paper.strongClusters : paper.clusters.slice(0, 1);
  if (subjects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((c) => (
        <span
          key={c}
          className={`rounded-[2px] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
            paper.convergent ? "bg-band text-paper" : "border border-ink/25 text-ink/60"
          }`}
        >
          {clusterChip(c)}
        </span>
      ))}
    </div>
  );
}

/** `stacked` is for the list rail, which is narrow enough that a single
 *  slash-separated line wraps and leaves a slash dangling at the end of it. */
function Meta({ paper, stacked = false }: { paper: ScannedPaper; stacked?: boolean }) {
  const rest = [
    paper.source === "arxiv" && paper.reviewed ? "via arXiv" : null,
    shortDate(paper.date),
    paper.reviewed ? null : "not peer reviewed",
    (paper.citedBy ?? 0) > 0 ? `${paper.citedBy} cited` : null,
  ].filter(Boolean) as string[];

  if (stacked) {
    return (
      <div className="font-mono text-[10px] uppercase leading-[1.7] tracking-[0.14em] text-graphite">
        <span className="block text-accent-deep">{paper.venue ?? "Unlisted venue"}</span>
        <span className="block">{rest.join(" · ")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
      <span className="text-accent-deep">{paper.venue ?? "Unlisted venue"}</span>
      {rest.map((r) => (
        <span key={r} className="flex items-center gap-x-2">
          <span aria-hidden className="text-ink/25">/</span>
          <span>{r}</span>
        </span>
      ))}
    </div>
  );
}

/* ── list view ───────────────────────────────────────────────────────────── */

/**
 * The reading layout, borrowed from the myxo research list: one row per paper,
 * a rail down the left where that page puts a thumbnail, the paper itself on
 * the right. There is nothing to photograph here, so the rail carries the
 * metadata instead, which is what you are actually scanning down.
 */
function ListRow({ paper, n }: { paper: ScannedPaper; n: number }) {
  return (
    <li
      id={anchorOf(paper)}
      style={{ scrollMarginTop: "calc(var(--fa-nav-h) + 24px)" }}
      className="border-b border-ink/[0.14] py-[clamp(20px,2.6vw,34px)] first:border-t first:border-ink/[0.14]"
    >
      {/* myxo's research list puts a thumbnail in the left third. There is
          nothing to photograph here, so the rail is metadata and can be much
          narrower than a picture would need. */}
      <div className="grid grid-cols-1 gap-x-[clamp(20px,3vw,44px)] gap-y-3 min-[760px]:grid-cols-[minmax(150px,215px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[clamp(20px,2.4vw,30px)] font-bold leading-none tabular-nums text-ink/15">
            {String(n).padStart(2, "0")}
          </span>
          <Meta paper={paper} stacked />
          <Marks paper={paper} />
        </div>

        <div className="min-w-0">
          <h3 className="max-w-[46ch] text-[clamp(17px,1.9vw,23px)] font-extrabold leading-[1.15] tracking-[-0.018em] text-ink">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/20 underline-offset-[5px] transition-colors hover:text-accent hover:decoration-accent"
            >
              {paper.title}
            </a>
          </h3>
          <p className="mt-1.5 text-[12px] leading-[1.5] text-faint">{byline(paper.authors)}</p>
          <div className="mt-3 max-w-[80ch]">
            <Summary keySentence={paper.keySentence} abstract={paper.abstract} clip={420} />
          </div>
          <div className="mt-4">
            <Why paper={paper} />
            <StandingLine paper={paper} />
          </div>
          <div className="mt-3">
            <Links paper={paper} />
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── grid view ───────────────────────────────────────────────────────────── */

/**
 * A card in "Everything else". Same shape as a digest card and as a project
 * card; it just carries the working-out too, which is the page's whole promise.
 *
 * Not a link as a whole, unlike a digest card: this one keeps its own Open /
 * PDF / DOI row and an anchor cannot hold anchors. The title is the link and
 * the border lights on hover, so it still behaves like one.
 */
function GridCard({ paper }: { paper: ScannedPaper }) {
  return (
    <article
      id={anchorOf(paper)}
      style={{ scrollMarginTop: "calc(var(--fa-nav-h) + 24px)" }}
      className="fa-card group transition-colors hover:border-accent"
    >
      <Plate paper={paper} />
      <div className="flex flex-1 flex-col" style={{ padding: "var(--space-card)" }}>
        <div
          className="flex items-center justify-between"
          style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}
        >
          <span className="fa-card__meta">{paperMeta(paper)}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              textTransform: "uppercase",
              letterSpacing: "var(--track-label)",
              color: "var(--muted)",
            }}
          >
            {shortDate(paper.date)}
            {(paper.citedBy ?? 0) > 0 && ` · ${paper.citedBy} cited`}
          </span>
        </div>

        <h3 className="fa-card__title">
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-ink/20 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
          >
            {paper.title}
          </a>
        </h3>
        <p className="mt-2 text-[11px] leading-[1.6] text-faint">{byline(paper.authors)}</p>

        <div style={{ marginTop: "var(--space-3)" }}>
          <Summary keySentence={paper.keySentence} abstract={paper.abstract} clip={300} />
        </div>

        <div className="mt-auto" style={{ paddingTop: "var(--space-5)" }}>
          <Why paper={paper} />
          <StandingLine paper={paper} />
          <div style={{ marginTop: "var(--space-3)" }}>
            <Links paper={paper} />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── the rules, published ────────────────────────────────────────────────── */

function Rules({ result }: { result: ScanResult | null }) {
  return (
    <section id="rules" className="mt-[clamp(56px,9vw,120px)]">
      <h2 className="flex items-center gap-4 border-t border-ink/[0.14] py-4 font-mono text-[22px] font-bold uppercase leading-none tracking-[0.18em] text-accent-deep">
        The rules
        <span aria-hidden className="h-px flex-1 bg-ink/[0.12]" />
      </h2>

      <p
        className="max-w-[64ch]"
        style={{
          fontSize: "var(--text-body-size)",
          lineHeight: "var(--lh-body)",
          color: "var(--text-body)",
        }}
      >
        Each topic below does two jobs. Its probes are what gets asked of the indexes, which
        is deliberately wide. Its terms are what gets accepted: a record is held only if its
        own title or abstract contains one of them, whichever query found it. So a paper
        retrieved by a quantum probe can be held, and tagged, by a power topic it also
        matches, and that is where the crossover comes from.
      </p>
      <p
        className="mt-4 max-w-[64ch]"
        style={{
          fontSize: "var(--text-body-size)",
          lineHeight: "var(--lh-body)",
          color: "var(--text-body)",
        }}
      >
        One term once in the middle of an abstract is a mention rather than a subject, and
        holding on one of those is what made the first build of this page enormous and dull.
        So a topic counts as solid only when its words are in the title or turn up more than
        once, and a paper needs one solid topic, or two mentioned ones, to be held at all.
        Beside each paper the solid topics are marked and the mentions are dimmed.
      </p>

      {/* items-start, or opening one panel stretches its closed neighbour to match */}
      <div className="mt-[clamp(24px,3vw,40px)] grid grid-cols-1 items-start gap-[clamp(14px,1.6vw,22px)] min-[900px]:grid-cols-2">
        {CLUSTERS.map((c) => (
          <details
            key={c.id}
            className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)] [&[open]]:border-ink/30"
          >
            <summary className="cursor-pointer list-none">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[clamp(15px,1.5vw,18px)] font-extrabold tracking-[-0.015em] text-ink">
                  {c.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
                  {topicsOf(c.id).length} topics
                </span>
              </span>
              <span
                className="mt-1.5 block"
                style={{
                  fontSize: "var(--text-body-size)",
                  lineHeight: "var(--lh-body)",
                  color: "var(--text-body)",
                }}
              >
                {c.why}
              </span>
              <span className="mt-1.5 block text-[11px] leading-[1.6] text-faint">
                Feeds {c.feeds.join(", ")}.
                {c.arxivCats ? ` arXiv: ${c.arxivCats.join(", ")}.` : " Journals only."}
              </span>
            </summary>

            <dl className="mt-3.5 border-t border-ink/[0.1] pt-3.5">
              {topicsOf(c.id).map((t) => (
                <div key={t.id} className="mb-3 last:mb-0">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
                    {t.label}
                  </dt>
                  <dd className="m-0 mt-1 text-[11px] leading-[1.7] text-faint">
                    {t.terms.join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>

      <div className="mt-[clamp(24px,3vw,40px)] grid grid-cols-1 items-start gap-[clamp(14px,1.6vw,22px)] min-[900px]:grid-cols-2">
        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            What the query already excludes
          </h3>
          <ul className="mt-2 list-none p-0 text-[11px] leading-[1.8] text-faint">
            <li>Anything not open access. Every link has to go somewhere readable.</li>
            <li>
              Anything not typed as an article: datasets, errata, editorials, peer review
              reports, and the deposit shells that carry a DOI without a paper behind it.
            </li>
            <li>
              Journals outside OpenAlex&rsquo;s curated core set. Without that filter a
              date-sorted query is mostly self-deposits and pay-to-publish titles, because
              those are what get stamped fastest.
            </li>
            <li>Issue dates in the future, which journals hand out months ahead.</li>
            <li>Anything older than {WINDOW_DAYS} days, or not in English.</li>
            <li>
              arXiv is the exception to the core-set rule and gets its own pass, because that
              is where this field publishes first. Those entries say preprint.
            </li>
          </ul>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            The bin
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            Applied after a rule matches, because the terms are broad enough to drag in a
            neighbouring field. &ldquo;Automation bias&rdquo; matches a radiology study,
            &ldquo;quantum computing&rdquo; matches a drug discovery paper. Neither is wrong,
            both are somebody else&rsquo;s radar.
          </p>
          <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
            venue contains
          </p>
          <p className="mt-1 text-[11px] leading-[1.7] text-faint">{VENUE_BLOCK.join(" · ")}</p>
          <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
            text contains
          </p>
          <p className="mt-1 text-[11px] leading-[1.7] text-faint">{TEXT_BLOCK.join(" · ")}</p>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            How the order is decided
          </h3>
          <ul className="mt-2 list-none p-0 text-[11px] leading-[1.8] text-faint">
            <li>Fresh beats old, on a straight slide across the {WINDOW_DAYS}-day window.</li>
            <li>Several topics beats one.</li>
            <li>
              Several subjects beats several topics, counting only subjects matched in the
              title or more than once. That is the convergence weighting, and the second half
              of it is there because the first run put a semiconductor packaging paper at the
              top for saying &ldquo;quantum computing&rdquo; once.
            </li>
            <li>A match in the title beats one buried in an abstract.</li>
            <li>
              Standing gets a small one, worth less than freshness or crossover, and only
              upwards. See the panel beside this one for what it is and what it is not.
            </li>
            <li>
              A paper that reads like a finding beats one that reads like a framework, by
              about as much as freshness is worth. See the panel below.
            </li>
            <li>
              Citations barely count. Little published inside {WINDOW_DAYS} days has any yet,
              and weighting them would just rank the oldest thing here first. They are there
              as a sort of their own instead.
            </li>
          </ul>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Journals, arXiv, and what &ldquo;not peer reviewed&rdquo; means
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            Entries come from two places. A <strong className="font-normal text-graphite">journal
            or conference</strong> name means the work was submitted to that publication and read
            by other researchers in the field before it appeared: slow, and the closest thing
            research has to a check.
          </p>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            <strong className="font-normal text-graphite">arXiv</strong> is a free archive where
            researchers post work the day they finish it, with nobody standing between them and
            publication. Most of AI, quantum and physics appears there months before a journal
            gets to it, which is exactly why it is on this page — and why those entries say{" "}
            <strong className="font-normal text-graphite">not peer reviewed</strong>. It is not a
            mark against the work. It means the only person who has checked it is the author.
            Where a preprint has since been published, the entry shows the journal instead and
            says <em>via arXiv</em>.
          </p>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            Where the ten at the top have a figure in them, it is the paper&rsquo;s own first
            figure, hot-linked from arXiv&rsquo;s rendering of the paper and never copied here.
            Journal figures sit behind publisher pages with no shape in common, so those entries
            have no picture.
          </p>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Finding or framework
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            A keyword net cannot tell a result from a scaffold, and academia produces far
            more scaffolds. So a third rule reads the paper&rsquo;s own wording. Phrases
            like <em>we find</em>, <em>for the first time</em>, <em>contrary to</em> say
            there is a finding inside. Phrases like <em>towards a</em>,{" "}
            <em>conceptual framework</em>, <em>systematic review</em> say there is not, and
            they count double in a title, because a title is a promise.
          </p>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            It is a heuristic about wording and not a judgement about worth: a careful
            review is a good paper and a bad thing to open a page with. Nothing is ever
            dropped for it, the phrases that fired are printed under each entry, and{" "}
            <strong className="font-normal text-graphite">Boldest</strong> sorts by it.
          </p>
          <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
            counts for
          </p>
          <p className="mt-1 text-[11px] leading-[1.7] text-faint">
            {SPARK.claim.slice(0, 16).join(" · ")} …
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
            counts against
          </p>
          <p className="mt-1 text-[11px] leading-[1.7] text-faint">
            {SPARK.dull.join(" · ")}
          </p>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            No subject may take the page
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            Quantum has the most distinctive vocabulary of the nine, so it matches hardest,
            and left alone it took about a third of the list on its own. The page reads as a
            quantum feed with other things in it, which is not what a horizon scan is for.
          </p>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            So no subject takes more than {MAX_PER_SUBJECT} of the {MAX_HELD}, and the ten
            at the top take at most {DIGEST_PER_SUBJECT} each. Papers over the cap are
            pushed behind the rest rather than dropped, so nothing is hidden and the count
            is in the ledger. The cap is on the subject a paper lands in hardest, so a
            crossover paper is counted once.
          </p>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Standing, and why it is only a nudge
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            Three figures come back with each paper: the journal&rsquo;s mean citations per
            paper over two years, the higher h-index of the first and last author, and the
            best-cited institution on the byline. They are printed on the entry and rolled
            into a single 0-1 number that can move a paper up the order by about as much as
            being two months fresher would.
          </p>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            All three are citation counts wearing a hat. They track attention, and attention
            is handed out unevenly: to established groups, well-funded departments,
            English-language venues, and fields that cite quickly. A first paper from a small
            department is not worse than a Nature Communications paper from a large one, it
            is less cited, which is a different fact. So it is a nudge and never a filter,
            missing figures count as neutral rather than zero, and there is a sort that puts
            standing first for when that is genuinely the question. arXiv preprints carry no
            identifiers of this kind at all and are ranked on the rules alone.
          </p>
        </div>

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Why once a day, and why {QUERY_GROUPS.length} calls
          </h3>
          <p className="mt-2 text-[11px] leading-[1.7] text-faint">
            OpenAlex meters a caller without a key on credits rather than requests: a
            thousand a day, a flat ten for a search however many rows come back. So the cost
            is entirely in the number of queries and not at all in their size. The{" "}
            {TOPICS.length} topics are paired into {QUERY_GROUPS.length} calls of fifty rows
            each, plus one per arXiv subject, and the whole run is cached for a day. Pairs rather than one call per
            subject, because climate futures publishes something like forty times what rural
            futures does and a merged date sort of the two is just climate. The standing
            lookups are filters by id rather than searches, which cost one credit apiece, so
            they are close to free and can cover every held paper.
          </p>
        </div>

        {result && <RunLedger result={result} />}

        <div className="rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)] min-[900px]:col-span-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            What this is not
          </h3>
          <p className="mt-2 max-w-[70ch] text-[11px] leading-[1.7] text-faint">
            It is not a reading list, a literature review, or a claim that these are the best
            papers in these fields. It is what a keyword net caught this week, with the net
            printed underneath it. Nobody has read these before they appeared here. The{" "}
            <Link
              href="/feed"
              className="text-graphite underline decoration-ink/25 underline-offset-4 transition-colors hover:text-accent"
            >
              feed
            </Link>{" "}
            is the opposite: things somebody actually read and had something to say about.
          </p>
          <p className="mt-2.5 max-w-[70ch] text-[11px] leading-[1.7] text-faint">
            Sources: OpenAlex and arXiv, both queried without a key.
          </p>
        </div>
      </div>
    </section>
  );
}
