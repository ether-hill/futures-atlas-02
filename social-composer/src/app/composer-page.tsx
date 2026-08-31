"use client";

/**
 * ComposerPage — the studio, for one-offs.
 *
 * By default the library starts EMPTY: uploads and transmutated pages are the
 * material. A stock library of captured Atlas screens loads only when a route
 * asks for one by name (`initialProject`, or a `?project=` deep link kept for
 * existing URLs) — and even then there is no header band or picker; the stock
 * frames are just assets, deletable like any other.
 */

import { useEffect, useMemo, useState } from "react";
import { StudioApp } from "./studio-app";
import { atlasProjects, atlasSource, emptySource } from "@/lib/composer/atlas-source";

export function ComposerPage({ initialProject }: { initialProject?: string }) {
  const all = atlasProjects();
  const [id, setId] = useState(initialProject ?? "");

  // ?project=<id> deep-links a stock library (kept for existing links).
  useEffect(() => {
    if (initialProject) return;
    const asked = new URLSearchParams(window.location.search).get("project");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client restore
    if (asked && all.some((p) => p.id === asked)) setId(asked);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore
  }, []);

  const valid = id && all.some((p) => p.id === id);
  const source = useMemo(() => (valid ? atlasSource(id) : emptySource()), [valid, id]);

  return (
    <section className="rounded-xl border border-ink/12">
      {/* key: a different seed is a different library and draft store */}
      <StudioApp key={valid ? id : "one-off"} source={source} />
    </section>
  );
}
