/**
 * Dramaturge — the published plays.
 *
 * Plays are composed on a developer's machine, not in a request: a harvest
 * reads a hundred leaves and a play is a dozen model calls, both far past any
 * serverless budget. What ships is the finished bundle — the scripts plus
 * exactly the evidence they quote — committed like any other data module.
 *
 * `npm run dramaturge:bundle` writes it, and refuses to if the verbatim check
 * does not pass, so a bundle in this folder is one whose every quotation has
 * been byte-compared against the pool it came from.
 */
import type { Bundle, Play, SourceLine } from "@/lib/dramaturge/types";
import gold from "./gold.json";

export const bundles: Bundle[] = [gold as unknown as Bundle];

/** Every published play, newest bundle first. */
export const plays: Array<{ bundle: Bundle; play: Play }> = bundles.flatMap((bundle) =>
  bundle.plays.map((play) => ({ bundle, play })),
);

export function findPlay(playId: string): { bundle: Bundle; play: Play } | null {
  return plays.find((p) => p.play.id === playId) ?? null;
}

export function lineIndex(bundle: Bundle): Map<string, SourceLine> {
  return new Map(bundle.lines.map((l) => [l.id, l]));
}

/** How many distinct quotations a play speaks, for the listing. */
export function quotedCount(play: Play): number {
  return new Set(play.quoted).size;
}
