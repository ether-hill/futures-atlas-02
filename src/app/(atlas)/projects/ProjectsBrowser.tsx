"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { InterferenceField } from "@/components/InterferenceField";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { KIND_LABEL, kindsOf, type Project } from "@/data/projects";

// The interactive half of the listing. It filters whatever list it is handed, // deciding what belongs in that list (public vs editor) is the page's job, so a
// draft can never reach the browser for a visitor who isn't signed in.
export function ProjectsBrowser({
  items,
  showVisibility = false,
}: {
  items: Project[];
  showVisibility?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = active ? items.filter((p) => p.kind === active) : items;
  const kinds = kindsOf(items);

  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-surface py-[clamp(48px,8vw,110px)]">
      {/* A band of rain behind the title and the filters, faded out by the time
          the first row of cards arrives. It is a watermark, not a hero: the
          cards are the page, and anything still visible behind them would be
          competing with twenty-odd thumbnails at once. */}
      <InterferenceField
        className="fa-projects-field pointer-events-none absolute inset-x-0 top-0 hidden h-[clamp(400px,54vh,640px)] w-full md:block"
        speed={0.11}
      />
      <Container className="relative">
        {/* The one leader style (.eyebrow in globals.css): blue, uppercase, no
            rule. Was a hand-built variant with a hairline across the column. */}
        <Reveal>
          <p className="eyebrow mb-5">Everything we&rsquo;ve built</p>
        </Reveal>
        <Reveal delay={70}>
          <h1 className="mb-[clamp(26px,4vw,46px)] max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
            Projects
          </h1>
        </Reveal>

        {/* category filters */}
        <Reveal delay={140} className="mb-[clamp(28px,4vw,48px)] flex flex-wrap gap-2.5">
          <FilterTag label="All" count={items.length} active={active === null} onClick={() => setActive(null)} />
          {kinds.map((k) => (
            <FilterTag
              key={k}
              label={KIND_LABEL[k]}
              count={items.filter((p) => p.kind === k).length}
              active={active === k}
              onClick={() => setActive(k)}
            />
          ))}
        </Reveal>

        {/*
          The grid reveals too, and last.

          ProjectCard has no entrance of its own, so the cards painted at full
          opacity on the first frame while the eyebrow, the title and the filter
          row were still at opacity 0 waiting out their stagger. The page
          assembled backwards: twenty thumbnails, and a moment later the heading
          that introduces them.

          One Reveal around the whole grid rather than one per card: the cards
          arrive together, it costs a single observer instead of twenty, and
          nothing lags behind when you scroll — the grid has already revealed by
          the time anything below the fold matters.
        */}
        <Reveal
          delay={210}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "clamp(24px, 2.2vw, 40px)" }}
        >
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} showVisibility={showVisibility} />
          ))}
        </Reveal>
      </Container>
    </div>
  );
}

function FilterTag({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
        // band is dark in BOTH themes, paper always light, ink/paper flip
        // together in dark mode and went white-on-white here
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/70 hover:border-ink/60"
      }`}
    >
      {label}
      <span className={active ? "text-paper/60" : "text-ink/40"}>{count}</span>
    </button>
  );
}
