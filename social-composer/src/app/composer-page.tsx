"use client";

/**
 * ComposerPage — the studio plus the stock library that seeds it.
 *
 * The composer is for one-offs: there is no project picker any more. One stock
 * library loads (the default, or a project named by `initialProject` /
 * `?project=` for the deep-link routes), and from there it's uploads,
 * transmutated pages, and the user's own frames. Every asset — stock included —
 * is deletable, permanently.
 */

import { useEffect, useMemo, useState } from "react";
import { StudioApp } from "./studio-app";
import { atlasProjects, atlasSource } from "@/lib/composer/atlas-source";

export function ComposerPage({ initialProject }: { initialProject?: string }) {
  const all = atlasProjects();
  const [id, setId] = useState(initialProject ?? all[0]?.id ?? "");

  // ?project=<id> deep-links a stock library (kept for existing links).
  useEffect(() => {
    if (initialProject) return;
    const asked = new URLSearchParams(window.location.search).get("project");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client restore
    if (asked && all.some((p) => p.id === asked)) setId(asked);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore
  }, []);

  const project = all.find((p) => p.id === id) ?? all[0];
  // Stable per project: the studio memoises off source.frames identity.
  const source = useMemo(() => atlasSource(id), [id]);

  return (
    <section className="rounded-xl border border-ink/12">
      {project && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/12 px-5 py-3.5 sm:px-7">
          <div className="flex items-baseline gap-3">
            <span className="font-docket text-[9px] uppercase tracking-[0.16em] text-gilt">Stock</span>
            <span className="font-display text-[17px] text-ink">{project.title}</span>
          </div>
          <span className="font-docket text-[10px] uppercase tracking-[0.1em] text-ink/45">
            {project.field}
          </span>
        </div>
      )}
      <StudioApp key={id} source={source} />
    </section>
  );
}
