"use client";

/**
 * The bench — one card, one specimen at a time, drawn.
 *
 * ── Why it is not a project card ────────────────────────────────────────────
 *
 * Every other card on the feed is a finished thing pointing outward: a post, a
 * report, somebody else's video, each with a picture and a summary. A card that
 * did the same for projects would be a fifth variation on image-text-link, and
 * it would tell you the one thing you can already get from /projects.
 *
 * So this shows the inside instead. One fragment at a time — a rule we had to
 * write down, a decision that got reversed, a question still open — each with
 * the file or the day it comes from. You cannot see the next one without
 * drawing it. That is the whole interaction, and it is the point: the pile is
 * finite and stated (`n on the bench`), so the withholding is a pace, not a
 * tease. Nothing is hidden behind a signup and nothing loads that you did not
 * ask for.
 *
 * ── The one thing that needed care ──────────────────────────────────────────
 *
 * Per-visit variety without a hydration mismatch. `Math.random()` at mount
 * gives a different first face on the server and the client, and React tears
 * the tree down over it. The seed is therefore computed on the SERVER, sent in
 * the HTML as a prop, and the opening index derived from it — so the card
 * opens somewhere different on each request and both renders agree exactly.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { BENCH, SPECIMEN_LABEL, type SpecimenKind } from "@/data/workbench";

/** One flat deck across every project — the bench, not an index of it. */
const DECK = BENCH.flatMap((p) =>
  p.specimens.map((s) => ({ ...s, project: p.title, field: p.field, href: p.href, state: p.state })),
);

/**
 * Treatment per kind. `rejected` is the one that gets a different texture
 * rather than a different hue: it is the only kind that is a thing that is NOT
 * true of the work any more, and that reads better as a struck rule than as a
 * colour a reader has to learn.
 */
const KIND_STYLE: Record<SpecimenKind, string> = {
  source: "border-accent/50 text-accent-deep",
  rejected: "border-ink/30 text-ink/60 line-through decoration-ink/40",
  open: "border-accent/30 text-ink/75",
  note: "border-ink/20 text-ink/55",
};

export function BenchCard({ seed = 0 }: { seed?: number }) {
  const [drawn, setDrawn] = useState(0);
  // Opening face varies per request; the arithmetic runs identically on both
  // sides because the seed arrived in the HTML.
  const start = useMemo(() => (DECK.length ? Math.abs(seed) % DECK.length : 0), [seed]);
  const i = (start + drawn) % DECK.length;
  const s = DECK[i];

  return (
    <article
      // col-span-full: the feed page lays its cards out in a grid, and a card built
      // to run edge to edge gets squeezed into one narrow column without it — the
      // same span the report card carries, for the same reason.
      className="fa-bench relative col-span-full overflow-hidden rounded-[4px] border border-ink/[0.14] bg-surface"
      aria-roledescription="workbench"
    >
      <div className="relative grid gap-px min-[860px]:grid-cols-[1fr_auto]">
        <div className="p-6 min-[680px]:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              On the bench
            </span>
            <span aria-hidden className="text-ink/25">
              ·
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
              {DECK.length} specimens, {BENCH.length} projects
            </span>
          </div>

          {/* aria-live so drawing announces the new face rather than silently
              swapping it under a screen reader. */}
          <div aria-live="polite" className="mt-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
              {s.project}
              <span className="text-ink/25"> — </span>
              {s.field}
            </p>

            <span
              className={`mt-4 inline-block border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${KIND_STYLE[s.kind]}`}
            >
              {SPECIMEN_LABEL[s.kind]}
            </span>

            {/* key on the index so the fade re-runs for each draw; the whole
                animation is one CSS class and is disabled under
                prefers-reduced-motion by the global rule in globals.css. */}
            <div key={i} className="fa-bench-face mt-4">
              {s.mono ? (
                <p className="border-l-2 border-accent/40 pl-4 text-[clamp(13px,1.15vw,15px)] leading-[1.7] text-ink">
                  {s.body}
                </p>
              ) : (
                <p className="max-w-[62ch] text-[clamp(15px,1.35vw,18px)] leading-[1.6] tracking-[-0.01em] text-ink">
                  {s.body}
                </p>
              )}

              <p className="mt-4 text-[11px] leading-[1.6] text-ink/40">
                <span className="uppercase tracking-[0.12em]">Found in</span>{" "}
                <span className="text-ink/60">{s.at}</span>
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={() => setDrawn((d) => d + 1)}
              className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[18px] py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent-deep"
            >
              Draw another <span aria-hidden className="text-[13px]">→</span>
            </button>

            <span className="font-mono text-[11px] tracking-[0.1em] text-ink/40 tabular-nums">
              {String(i + 1).padStart(2, "0")} / {DECK.length}
            </span>

            {s.href ? (
              <Link
                href={s.href}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep underline-offset-4 hover:underline"
              >
                Open {s.project} ↗
              </Link>
            ) : (
              <span className="font-mono text-[11px] uppercase leading-[1.5] tracking-[0.12em] text-ink/40">
                {s.state}
              </span>
            )}
          </div>
        </div>

        {/* The inventory, at wide widths. A rule alone left a stray line and a
            column of nothing; this states what is actually on the bench, which
            is the honest way to fill the space — and it means the tally of
            reversals is visible without drawing sixteen times. */}
        <div className="hidden border-l border-ink/[0.14] p-6 min-[860px]:block min-[860px]:w-[248px] min-[680px]:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
            The bench
          </p>
          <dl className="mt-4 space-y-2.5">
            {(Object.keys(SPECIMEN_LABEL) as SpecimenKind[]).map((k) => {
              const n = DECK.filter((d) => d.kind === k).length;
              return (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className={`text-[12px] leading-[1.4] ${k === s.kind ? "text-ink" : "text-ink/55"}`}>
                    {SPECIMEN_LABEL[k]}
                  </dt>
                  <dd
                    className={`shrink-0 font-mono text-[12px] font-bold tabular-nums ${
                      k === s.kind ? "text-accent-deep" : "text-ink/35"
                    }`}
                  >
                    {n}
                  </dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-6 border-t border-ink/[0.14] pt-4 font-mono text-[10px] uppercase leading-[1.9] tracking-[0.12em] text-ink/40">
            {BENCH.map((p) => (
              <span key={p.id} className="block">
                {p.title}
                {!p.href && <span className="text-ink/25"> — unpublished</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
    </article>
  );
}
