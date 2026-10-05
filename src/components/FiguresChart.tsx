"use client";

import { useRef } from "react";

/**
 * One Futures in Figures chart, at full width. On wider screens it is the live
 * chart (the dataviz page in web mode, synced into public/ by
 * scripts/sync-futures-in-figures.mjs): it plays when scrolled into view and
 * Replay runs it again. The chart is drawn at 1600x820 and scaled, so the
 * frame keeps that ratio. On phones the portrait post is the better fit, so
 * the loop plays instead.
 */
export function FiguresChart({ slug, label }: { slug: string; label: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const replay = () => {
    const w = frame.current?.contentWindow as (Window & { __replay?: () => void }) | null;
    w?.__replay?.();
  };
  return (
    <figure className="m-0">
      <div className="hidden min-[760px]:block">
        <iframe
          ref={frame}
          src={`/futures-in-figures/charts/output/${slug}/index.html?slide=hook&format=web&v=field`}
          title={label}
          loading="lazy"
          className="block w-full border border-hairline"
          style={{ aspectRatio: "1600 / 820" }}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={replay}
            className="border border-hairline px-4 py-2 text-[13px] text-muted transition-colors hover:border-[var(--muted)] hover:text-[var(--text)]"
          >
            Replay
          </button>
        </div>
      </div>
      <video
        className="block w-full border border-hairline min-[760px]:hidden"
        src={`/futures-in-figures/${slug}-portrait.mp4`}
        poster={`/futures-in-figures/${slug}.jpg`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
    </figure>
  );
}
