/**
 * Dramaturge — the published clips.
 *
 * Clips are photographed on a developer's machine, never in a request: a
 * minute of film is eighteen hundred screenshots and a collection reads a
 * hundred metered leaves, both far past the 120-second ceiling the longest
 * function in this repo uses. What ships is the finished mp4 in public/ and
 * the record below, committed like any other data module.
 */
export type PublishedClip = {
  id: string;
  title: string;
  logline: string;
  /** Path under public/. */
  file: string;
  poster?: string;
  width: number;
  height: number;
  durationMs: number;
  /** Every book a caption in this clip quotes, for the credit line. */
  sources: { title: string; author: string; published: string; url: string }[];
  /** Every quotation spoken on screen, in order, with its citation link. */
  citations: { text: string; attribution: string; citationLink: string }[];
};

import published from "./clips.json";

export const clips: PublishedClip[] = published as PublishedClip[];
