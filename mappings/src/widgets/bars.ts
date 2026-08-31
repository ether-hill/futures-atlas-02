import type { Breakdown, Mapping, Rec } from "../types.ts";
import { el, esc } from "../dom.ts";

/** One breakdown panel: summed measure by dim value, top N + Other. */
export function renderBars(body: HTMLElement, m: Mapping, recs: Rec[], bd: Breakdown) {
  const groups = new Map<string, { count: number; sum: number }>();
  for (const r of recs) {
    const k = r.dims[bd.key] ?? "Undisclosed";
    const g = groups.get(k) ?? { count: 0, sum: 0 };
    g.count++;
    g.sum += r.value ?? 0;
    groups.set(k, g);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].sum - a[1].sum || b[1].count - a[1].count);
  const top = sorted.slice(0, bd.top ?? 8);
  const rest = sorted.slice(bd.top ?? 8);
  if (rest.length && !top.some(([k]) => k === "Other")) {
    top.push([
      `Other (${rest.length})`,
      rest.reduce((a, [, g]) => ({ count: a.count + g.count, sum: a.sum + g.sum }), { count: 0, sum: 0 }),
    ]);
  }
  const max = Math.max(1, ...top.map(([, g]) => g.sum || g.count));
  body.replaceChildren(
    ...top.map(([k, g]) => {
      const row = el("div", "bar");
      row.append(el("div", "bw", esc(k)));
      const track = el("div", "bt");
      const fill = el("i");
      requestAnimationFrame(() => {
        fill.style.width = `${Math.max(1.5, ((g.sum || g.count) / max) * 100)}%`;
      });
      track.append(fill);
      row.append(track, el("div", "bc", g.sum > 0 ? esc(m.format(g.sum)) : `${g.count}×`));
      return row;
    })
  );
  if (!top.length) body.replaceChildren(el("div", "msg", "No records match the current filters."));
}
