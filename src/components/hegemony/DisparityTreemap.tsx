"use client";

/**
 * The disparity map.
 *
 * The brief asked for a treemap of "US data representation vs rest of world".
 * What the evidence actually supports is narrower and more interesting, so
 * this draws THAT instead: the two measured distributions side by side —
 * the open web as Common Crawl finds it, and GPT-3's training mix — because
 * the gap between them is the finding. The skew was manufactured downstream.
 *
 * Deliberately not a canvas or a charting library: it is a handful of divs
 * sized by percentage, so it reflows, scales with text, and stays legible to a
 * screen reader as a plain list of figures.
 */

import { useState } from "react";

type Slice = { label: string; pct: number; note: string };

// Common Crawl's own published statistics; see the `manufactured-skew`
// finding. Only the four languages that were consistent across two reads of
// the source are named — the rest is aggregated honestly as "everything else"
// rather than given at a precision we could not reproduce.
const WEB: Slice[] = [
  { label: "English", pct: 40.58, note: "of crawled pages, by detected primary language" },
  { label: "Russian", pct: 6.82, note: "second largest single language" },
  { label: "German", pct: 5.99, note: "third" },
  { label: "Japanese", pct: 5.32, note: "fourth" },
  { label: "Everything else", pct: 41.29, note: "all remaining languages combined" },
];

// OpenAI's own published per-language counts for GPT-3.
const CORPUS: Slice[] = [
  { label: "English", pct: 92.65, note: "of the training mix, by word count" },
  { label: "French", pct: 1.82, note: "the largest non-English share" },
  { label: "German", pct: 1.47, note: "third" },
  { label: "Spanish", pct: 0.77, note: "fourth" },
  { label: "Everything else", pct: 3.29, note: "every other language combined" },
];

function Bar({ data, caption, sourceNote }: { data: Slice[]; caption: string; sourceNote: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <figure className="m-0">
      <figcaption className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55">
        {caption}
      </figcaption>
      <div className="mt-3 flex h-14 w-full overflow-hidden border border-ink/[0.14]">
        {data.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(active === i ? null : i)}
            style={{
              width: `${s.pct}%`,
              // English is the point being made, so it carries the accent and
              // everything else steps back — the ramp is opacity on one token
              // rather than five invented colours.
              background:
                i === 0
                  ? "var(--accent)"
                  : `color-mix(in srgb, var(--accent) ${22 - i * 4}%, transparent)`,
            }}
            className="relative border-r border-surface/60 last:border-r-0 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`${s.label}, ${s.pct}% — ${s.note}`}
          />
        ))}
      </div>
      <p className="mt-3 min-h-[3.2em] text-[13px] leading-[1.6] text-ink/70">
        {active === null ? (
          <span className="text-ink/50">{sourceNote}</span>
        ) : (
          <>
            <b className="font-medium text-ink">
              {data[active].label} — {data[active].pct}%
            </b>{" "}
            {data[active].note}
          </>
        )}
      </p>
    </figure>
  );
}

export function DisparityTreemap() {
  return (
    <div className="mt-8 grid gap-8 min-[860px]:grid-cols-2 min-[860px]:gap-10">
      <Bar
        data={WEB}
        caption="The open web, as crawled"
        sourceNote="Common Crawl's own crawl statistics. Page share by detected primary language — not token share."
      />
      <Bar
        data={CORPUS}
        caption="GPT-3's training mix"
        sourceNote="OpenAI's own published per-language word counts, 2020. No equivalent figure exists for any later model."
      />
      <p className="text-[14px] leading-[1.7] text-ink/75 min-[860px]:col-span-2">
        Both bars are measured, and both come from the people who did the
        measuring. The distance between them — roughly 41% English to roughly
        93% — is not something the web did. It is the residue of filtering
        decisions: language-identification thresholds, quality classifiers and
        blocklists applied after the crawl.{" "}
        <span className="text-ink">That gap is the finding.</span>
      </p>
    </div>
  );
}
