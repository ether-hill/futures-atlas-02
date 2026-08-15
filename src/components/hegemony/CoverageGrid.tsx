"use client";

import { useState } from "react";
import type { PressItem, Video } from "@/data/hegemony";
import { PressCard } from "@/components/report/PressCard";
import { VideoCard } from "@/components/report/VideoCard";

/**
 * Six, then the rest on request.
 *
 * v1 laid all nine of each out at once, which is two thirds of a screen of
 * grid before the reader has decided they care. Six is two full rows at every
 * breakpoint this grid uses (three columns wide, two on a tablet), so the cut
 * never lands mid-row and the button never appears under a ragged edge.
 *
 * The rest are NOT rendered and hidden — they are not rendered at all until
 * the button is pressed. Hiding them would still cost the thumbnails, which is
 * the entire weight of this section.
 *
 * The count is on the button ("Show 3 more"), because "Load more" tells you
 * nothing about whether it is worth the click, and a reader deciding how much
 * of someone else's reporting to look at deserves the number.
 */

const INITIAL = 6;

export function CoverageGrid(
  props: { kind: "video"; items: Video[] } | { kind: "press"; items: PressItem[] },
) {
  const [expanded, setExpanded] = useState(false);
  const total = props.items.length;
  const shown = expanded ? total : Math.min(INITIAL, total);
  const remaining = total - shown;

  return (
    <>
      <div className="grid gap-x-6 gap-y-10 min-[720px]:grid-cols-2 xl:grid-cols-3">
        {props.kind === "video"
          ? props.items.slice(0, shown).map((v) => <VideoCard key={v.id} video={v} />)
          : props.items.slice(0, shown).map((p) => <PressCard key={p.id} item={p} />)}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-10 w-full border border-paper/20 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/70 transition-colors hover:border-accent hover:text-accent"
        >
          Show {remaining} more {props.kind === "video" ? "videos" : "articles"} +
        </button>
      )}
    </>
  );
}
