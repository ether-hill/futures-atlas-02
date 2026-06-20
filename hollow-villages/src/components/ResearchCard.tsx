"use client";

import { useState } from "react";
import { VideoEmbed, youTubeId, type ResearchType } from "futures-atlas-core";
import { categoryLabels, type ResearchEntry } from "@/data/research";

const tint: Record<ResearchEntry["category"], string> = {
  "the-crisis": "from-[#1d3340] to-[#13242d]",
  "what-worked": "from-[#2f4d35] to-[#1c3122]",
  "the-mechanisms": "from-[#173a52] to-[#0f2734]",
  "go-deeper": "from-[#3a3320] to-[#241f12]",
};

const typeTag: Record<ResearchType, string> = {
  news: "News",
  research: "Research",
  video: "Video",
  resource: "Resource",
};

export function ResearchCard({ entry, type }: { entry: ResearchEntry; type?: ResearchType }) {
  // Owner drops a real screengrab at the thumbnail path; until then (or on
  // error) we show a designed source-plate so the grid never breaks.
  const [imgOk, setImgOk] = useState(true);
  const vid = type === "video" ? youTubeId(entry.url) : null;

  const badge = type ? (
    <span className="absolute left-0 top-0 z-10 bg-accent px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-paper">
      {typeTag[type]}
    </span>
  ) : null;

  return (
    <article
      id={entry.id}
      className="group flex scroll-mt-24 flex-col overflow-hidden rounded-sm border border-ink/15 bg-bone transition-colors hover:border-ink/35"
    >
      {vid ? (
        <div className="relative">
          {badge}
          <VideoEmbed id={vid} title={entry.title} thumbnail={imgOk ? entry.thumbnail : undefined} credit={entry.thumbnailCredit} />
        </div>
      ) : (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus-visible:outline-none"
          aria-label={`${entry.title} — opens ${entry.source} in a new tab`}
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-line">
            {badge}
            {imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.thumbnail}
                alt={`${entry.source}: ${entry.title}`}
                loading="lazy"
                onError={() => setImgOk(false)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div
                className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${tint[entry.category]} p-4`}
              >
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-paper/55">
                  {categoryLabels[entry.category]}
                </span>
                <span className="font-mono text-sm leading-tight text-paper/90">
                  {entry.source}
                  {entry.year ? <span className="text-paper/50"> · {entry.year}</span> : null}
                </span>
              </div>
            )}
            {imgOk && entry.thumbnailCredit && (
              <span className="absolute bottom-0 right-0 max-w-full truncate bg-[#1a1712]/65 px-1.5 py-0.5 font-mono text-[0.55rem] text-paper/85">
                {entry.thumbnailCredit}
              </span>
            )}
          </div>
        </a>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="eyebrow tick">
          {entry.source}
          {entry.year ? ` · ${entry.year}` : ""}
        </p>
        <h3 className="text-[1.05rem] font-medium leading-snug tracking-tight text-ink">
          {entry.title}
        </h3>
        <p className="text-sm leading-relaxed text-graphite">{entry.summary}</p>
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm text-blueprint-deep underline-offset-4 hover:underline"
        >
          {type === "video" ? "Watch on YouTube" : "Read the source"}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 11L11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </article>
  );
}
