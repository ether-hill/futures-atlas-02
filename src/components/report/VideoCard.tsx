"use client";

import { useState } from "react";
import type { Video } from "@/data/report-types";
import { CoverImage } from "./CoverImage";

/**
 * A video, played in place.
 *
 * This is a facade, not an embed: the card ships a still and a button, and the
 * YouTube iframe is only mounted once someone actually presses play. Nine
 * embeds on one page would otherwise mean nine third-party players, their
 * scripts and their cookies loaded for every reader — including the ones who
 * came for the findings and never touch the videos. The still is one image.
 *
 * When it does mount it uses youtube-nocookie.com, and the "Watch on YouTube"
 * link stays on the card either way, so the source is always one click away
 * whether or not you play it here. A reader who would rather not load YouTube
 * at all never has to.
 */
export function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <article className="flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden bg-paper/[0.06]">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${video.title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <CoverImage
              src={video.thumb}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-deep shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110"
            >
              <svg viewBox="0 0 24 24" className="ml-[3px] h-[22px] w-[22px] fill-paper">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep">
        {video.channel} <span className="text-paper/35">·</span>{" "}
        <span className="text-paper/45">{video.published}</span>
      </p>
      <h3 className="mt-2 text-[17px] font-medium leading-[1.35] tracking-[-0.015em] text-paper">
        {video.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.65] text-paper/60">{video.blurb}</p>

      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto self-start pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/45 underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
      >
        Watch on YouTube ↗
      </a>
    </article>
  );
}
