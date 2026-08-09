"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { ProjectCard } from "@/components/ProjectCard";
import { fieldsOf, type Project } from "@/data/projects";

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
  const filtered = active ? items.filter((p) => p.field === active) : items;
  const fields = fieldsOf(items);

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            {filtered.length} {filtered.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <h1 className="mb-[clamp(26px,4vw,46px)] max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Projects
        </h1>

        {/* category filters */}
        <div className="mb-[clamp(28px,4vw,48px)] flex flex-wrap gap-2.5">
          <FilterTag label="All" count={items.length} active={active === null} onClick={() => setActive(null)} />
          {fields.map((f) => (
            <FilterTag
              key={f}
              label={f}
              count={items.filter((p) => p.field === f).length}
              active={active === f}
              onClick={() => setActive(f)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "clamp(24px, 2.2vw, 40px)" }}>
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} showVisibility={showVisibility} />
          ))}
        </div>
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
