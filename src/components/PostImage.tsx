"use client";

import { useState } from "react";
import type { Post } from "@/data/posts";

/**
 * The picture for a post, in priority order:
 *
 *   1. the source's own preview image (`sourceImage`), hot-linked from the
 *      publisher — what a link-preview card anywhere else would show;
 *   2. our commissioned cover art (`image`);
 *   3. the hatched plate, same as an imageless project card.
 *
 * A hot-linked image is outside our control, so step 1 can fail at any time —
 * the publisher pulls it, or blocks hot-linking from our referrer. `onError`
 * demotes to step 2 the moment that happens, which is why this is a client
 * component. Nothing else here needs interactivity.
 */
export function PostImage({
  post,
  className = "",
  /** Decorative in cards (the title is right there); described on a post page. */
  alt = "",
  priority = false,
}: {
  post: Post;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed && post.sourceImage ? post.sourceImage : post.image;

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // don't leak the reader's path back to the publisher on a hot-linked image
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/** True when a post will render something rather than the hatched plate. */
export function hasImage(post: Post): boolean {
  return Boolean(post.sourceImage || post.image);
}
