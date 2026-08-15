"use client";

import { useState } from "react";

/**
 * A hot-linked preview picture, and what happens when it goes away.
 *
 * Every image in the coverage sections belongs to someone else — a YouTube
 * still or a publisher's og:image — and is loaded from their servers rather
 * than copied into this repo. That is the Feed's rule (see PostImage) and it
 * applies here for the same reason: the picture stays theirs.
 *
 * The cost of that is it can vanish without warning: pulled, moved, or
 * hot-link-blocked from our referrer. So the failure is designed rather than
 * left to the browser's broken-image glyph — `onError` swaps in a hatched
 * plate that holds the same 16:9 box, so the grid never reflows and a card
 * with no picture still reads as a card.
 */
export function CoverImage({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden
        className={`h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.07)_0_2px,transparent_2px_7px)] ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      // don't leak the reader's path back to the publisher on a hot-linked image
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
