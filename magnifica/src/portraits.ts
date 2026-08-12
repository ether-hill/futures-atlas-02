/**
 * Official portraits — REAL photographs under REAL licences, never generated.
 *
 * A leader appears here only once their photograph has been sourced and its
 * licence checked. Everything in an entry is load-bearing: `credit`, `licence`
 * and `licenceUrl` are rendered on screen wherever the portrait appears,
 * because these licences require attribution to be visible. Cropping is an
 * adaptation, so a cropped file carries its source licence and the credit says
 * so. See magnifica/ASSETS.md before adding to this list.
 *
 * Leaders without an entry fall back to a monogram tile — deliberate-looking
 * rather than a broken image, and a reminder of what is still to source.
 */

export interface Portrait {
  /** file under /magnifica/media/portraits/ */
  file: string;
  alt: string;
  /** author + any modification, shown on screen */
  credit: string;
  licence: string;
  licenceUrl: string;
  sourceUrl: string;
}

export const PORTRAITS: Record<string, Portrait> = {
  "dalai-lama": {
    file: "dalai-lama.jpg",
    alt: "The 14th Dalai Lama photographed in 2012",
    credit: "Christopher Michel, 2012 — cropped",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Dalai_Lama_in_2012.jpg",
  },
};

export const portraitOf = (id: string): Portrait | undefined => PORTRAITS[id];

/** Initials for the fallback tile: first letters of the first two words. */
export function monogram(name: string): string {
  return name
    .replace(/^(His|Her)\s+\w+\s+/i, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
