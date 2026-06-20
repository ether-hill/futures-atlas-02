"use client";

import Link from "next/link";
import { useRef } from "react";
import { research } from "@/data/research";
import { Container } from "./Container";
import { ResearchCard } from "./ResearchCard";

// A curated selection of the most relevant entries — the same cards shown in
// full on /research. Order = what leads the story on the home page.
const featuredIds = [
  "ostana-first-baby",
  "empty-spain-overview",
  "euronews-digital-nomad-villages",
  "oecd-shrinking-smartly",
  "pnrr-borghi-fund",
  "albinen-newcomer-payments",
];

export function HomeResearchPreview() {
  const row = useRef<HTMLDivElement>(null);
  const featured = featuredIds
    .map((id) => research.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const scroll = (dir: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * Math.max(320, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <Container>
      <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent brightness-[1.4]">02 — Research</span>
        <span className="h-px min-w-10 flex-1 bg-paper/20" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">A selection · see all on the research page</span>
      </div>
      <div className="mb-[clamp(30px,5vw,56px)] flex flex-wrap items-end justify-between gap-6">
        <h2 className="max-w-[18ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-paper text-balance">
          What the oracle reads.
        </h2>
        <div className="flex items-center gap-2.5">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-paper/40 text-lg text-paper transition-colors hover:border-paper hover:bg-paper/10">←</button>
          <button onClick={() => scroll(1)} aria-label="Next" className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-paper/40 text-lg text-paper transition-colors hover:border-paper hover:bg-paper/10">→</button>
        </div>
      </div>

      <div
        ref={row}
        role="region"
        aria-label="Selected research"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 [scrollbar-width:thin]"
      >
        {featured.map((entry) => (
          <div key={entry.id} className="w-[340px] shrink-0 snap-start">
            <ResearchCard entry={entry} />
          </div>
        ))}
      </div>

      <div className="mt-[18px] flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper/50">
          ⇆ Drag or use the arrows · {research.length} sources in full
        </span>
        <Link href="/research" className="inline-flex items-center gap-2.5 rounded-[2px] bg-surface px-5 py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:bg-accent hover:text-paper">
          See all research <span className="text-[14px]">→</span>
        </Link>
      </div>
    </Container>
  );
}
