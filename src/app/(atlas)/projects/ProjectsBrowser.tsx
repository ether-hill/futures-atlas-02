"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { InterferenceField } from "@/components/InterferenceField";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { KIND_LABEL, kindsOf, type Project } from "@/data/projects";
import { topicsOf, type Topic } from "@/data/topics";

/** The word in front of each filter row. Two rows of bare chips read as one
 *  long wrapped row, and the second one stops meaning anything. */
const ROW_LABEL =
  "mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite";

// The interactive half of the listing. It filters whatever list it is handed, // deciding what belongs in that list (public vs editor) is the page's job, so a
// draft can never reach the browser for a visitor who isn't signed in.
export function ProjectsBrowser({
  items,
  showVisibility = false,
}: {
  items: Project[];
  showVisibility?: boolean;
}) {
  /*
    Two filters, and they ask different questions: what a project IS (four
    kinds) and what it is ABOUT (the Atlas's shared topics, data/topics.ts).
    They combine with AND, which is the only reading that is not surprising —
    picking Game and then Quantum should narrow, not widen.

    Each row counts against what the OTHER filter has already left, so a chip
    reading 3 means three things you can actually get to. A count taken against
    the unfiltered list would offer combinations that come back empty.
  */
  const [kind, setKind] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);

  const byKind = kind ? items.filter((p) => p.kind === kind) : items;
  const byTopic = topic ? items.filter((p) => p.topics.includes(topic)) : items;
  const filtered = byKind.filter((p) => !topic || p.topics.includes(topic));

  const kinds = kindsOf(byTopic);
  const topics = topicsOf(byKind);

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

        {/* What it is */}
        <Reveal delay={140} className="mb-3 flex flex-wrap items-center gap-2.5">
          <span className={ROW_LABEL}>Kind</span>
          <FilterTag
            label="All"
            count={byTopic.length}
            active={kind === null}
            onClick={() => setKind(null)}
          />
          {kinds.map((k) => (
            <FilterTag
              key={k}
              label={KIND_LABEL[k]}
              count={byTopic.filter((p) => p.kind === k).length}
              active={kind === k}
              onClick={() => setKind(k)}
            />
          ))}
        </Reveal>

        {/* What it is about */}
        <Reveal delay={180} className="mb-[clamp(28px,4vw,48px)] flex flex-wrap items-center gap-2.5">
          <span className={ROW_LABEL}>Subject</span>
          <FilterTag
            label="All"
            count={byKind.length}
            active={topic === null}
            onClick={() => setTopic(null)}
          />
          {topics.map((t) => (
            <FilterTag
              key={t}
              label={t}
              count={byKind.filter((p) => p.topics.includes(t)).length}
              active={topic === t}
              onClick={() => setTopic(t)}
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
