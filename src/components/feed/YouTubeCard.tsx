"use client";

import { useState } from "react";

/**
 * A YouTube post that plays in place.
 *
 * Deliberately a facade until clicked: embedding the real iframe up front
 * would load YouTube's player — and set its cookies — on every visit to the
 * feed, for every video card, whether or not anyone watches. The poster comes
 * from YouTube's own thumbnail CDN, and only a click swaps in the player.
 * `youtube-nocookie` and `rel=0` keep the after-state as quiet as it can be.
 */

export function YouTubeCard({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden bg-black"
      aria-label={`Play video: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own CDN, hot-linked like any link preview */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
      />
      <span
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.55))" }}
      />
      <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
        <span
          aria-hidden
          className="ml-[3px] block h-0 w-0"
          style={{
            borderLeft: "15px solid rgba(255,255,255,.95)",
            borderTop: "9px solid transparent",
            borderBottom: "9px solid transparent",
          }}
        />
      </span>
      <span className="absolute bottom-3 left-3 rounded-[2px] bg-black/65 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
        Watch here
      </span>
    </button>
  );
}
