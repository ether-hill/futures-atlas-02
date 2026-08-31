import type { Breakdown, Mapping, Rec } from "../types.ts";
import { el, esc } from "../dom.ts";

/**
 * One breakdown panel: the summed measure by dim value, top N + Other.
 *
 * Proportionality rule: every filled bar in a panel is drawn on ONE scale.
 * If any group has a disclosed sum, bars measure sums — and a group whose
 * records are all undisclosed gets an EMPTY track labelled with its count,
 * never a fake length. Only when no group has any disclosed value do the bars
 * fall back to measuring counts (and then every bar measures counts).
 */
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
  if (rest.length) {
    top.push([
      `Other (${rest.length})`,
      rest.reduce((a, [, g]) => ({ count: a.count + g.count, sum: a.sum + g.sum }), { count: 0, sum: 0 }),
    ]);
  }
  if (!top.length) {
    body.replaceChildren(el("div", "msg", "No records match the current filters."));
    return;
  }
  const useSums = top.some(([, g]) => g.sum > 0);
  const max = Math.max(1e-9, ...top.map(([, g]) => (useSums ? g.sum : g.count)));
  body.replaceChildren(
    ...top.map(([k, g]) => {
      const row = el("div", "bar");
      row.append(el("div", "bw", esc(k)));
      const track = el("div", "bt");
      const metric = useSums ? g.sum : g.count;
      if (metric > 0) {
        const fill = el("i");
        requestAnimationFrame(() => {
          fill.style.width = `${(metric / max) * 100}%`;
        });
        track.append(fill);
      } else {
        track.classList.add("empty");
      }
      row.append(track);
      const label =
        useSums && g.sum > 0
          ? m.format(g.sum)
          : `${g.count}×${useSums ? " · undisclosed" : ""}`;
      row.append(el("div", "bc", esc(label)));
      return row;
    })
  );
}
