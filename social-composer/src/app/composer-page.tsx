"use client";

/**
 * ComposerPage — the studio plus the project picker that feeds it.
 *
 * The library used to be hard-wired to one project per route (The Odds here,
 * Village Oracle at /village-oracle), and every other project had to be pulled in
 * by scraping its page, which for canvas-based projects produced text-only cards.
 * Now every project in the atlas has captured screens (see atlas-shots.ts) and one
 * page serves all of them: switching rebuilds the source and remounts the studio,
 * so each project keeps its own selections, drafts and imported frames.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudioApp } from "./studio-app";
import { atlasProjects, atlasSource } from "@/lib/composer/atlas-source";

const LAST_KEY = "social-composer:last-project";

export function ComposerPage({ initialProject }: { initialProject?: string }) {
  const all = atlasProjects();
  const [id, setId] = useState(initialProject ?? all[0]?.id ?? "");

  // ?project=<id> deep-links a library; otherwise reopen whatever was last used.
  useEffect(() => {
    if (initialProject) return;
    const sp = new URLSearchParams(window.location.search);
    const asked = sp.get("project");
    const remembered = (() => { try { return window.localStorage.getItem(LAST_KEY); } catch { return null; } })();
    const pick = [asked, remembered].find((c) => c && all.some((p) => p.id === c));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client restore
    if (pick) setId(pick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore
  }, []);

  const onChange = useCallback((next: string) => {
    setId(next);
    try { window.localStorage.setItem(LAST_KEY, next); } catch { /* */ }
  }, []);

  const project = all.find((p) => p.id === id) ?? all[0];
  const library = useMemo(() => all.map((p) => ({ id: p.id, label: p.title })), [all]);
  // Stable per project: the studio memoises off source.frames identity.
  const source = useMemo(() => atlasSource(id), [id]);

  return (
    <section className="rounded-xl border border-ink/12">
      {project && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/12 px-5 py-3.5 sm:px-7">
          <div className="flex items-baseline gap-3">
            <span className="font-docket text-[9px] uppercase tracking-[0.16em] text-gilt">Library</span>
            <span className="font-display text-[17px] text-ink">{project.title}</span>
          </div>
          <span className="font-docket text-[10px] uppercase tracking-[0.1em] text-ink/45">
            {project.shots.length + project.cards.length} screens · {project.field}
          </span>
        </div>
      )}
      {/* key: a new project is a new library, a new draft store and a clean slate */}
      <StudioApp key={id} source={source} library={library} libraryId={id} onLibraryChange={onChange} />
    </section>
  );
}
