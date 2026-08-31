import type { Mapping, Rec } from "../types.ts";
import { el, esc } from "../dom.ts";

/** Four stat tiles, each computed directly from the filtered records. */
export function renderTiles(body: HTMLElement, m: Mapping, recs: Rec[]) {
  if (!recs.length) {
    body.replaceChildren(el("div", "msg", "No records match the current filters."));
    return;
  }
  const disclosed = recs.filter((r) => r.value !== null).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const tiles: { n: string; l: string }[] = [];

  if (disclosed.length) {
    const biggest = disclosed[0];
    tiles.push({ n: m.format(biggest.value!), l: `the largest: ${biggest.name}` });
    const median = disclosed[Math.floor(disclosed.length / 2)].value!;
    tiles.push({ n: m.format(median), l: `median ${m.recordNoun} (of ${disclosed.length} disclosed)` });
  }
  const newest = recs.reduce((a, b) => (a.date >= b.date ? a : b));
  tiles.push({ n: newest.date, l: `newest record: ${newest.name}` });
  const undisclosed = recs.length - disclosed.length;
  tiles.push(
    undisclosed > 0
      ? { n: String(undisclosed), l: `records with the size undisclosed` }
      : { n: String(recs.length), l: `records, every one with a disclosed size` }
  );

  const grid = el("div", "tiles");
  for (const t of tiles.slice(0, 4)) {
    const tile = el("div", "tile");
    tile.append(el("div", "tile-n", esc(t.n)), el("div", "tile-l", esc(t.l)));
    grid.append(tile);
  }
  body.replaceChildren(grid);
}
