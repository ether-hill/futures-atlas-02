import type { Filters, Mapping } from "../types.ts";
import { el, esc } from "../dom.ts";

/**
 * Global filter chips — one row per filterable dimension, values ordered by
 * frequency. One state, every widget recomputes (the MPV pattern).
 */
export function renderFilters(
  host: HTMLElement,
  m: Mapping,
  f: Filters,
  onChange: () => void
) {
  const rows: HTMLElement[] = [];
  for (const dim of m.dims.filter((d) => d.filterable)) {
    const counts = new Map<string, number>();
    for (const r of m.records) {
      const v = r.dims[dim.key] ?? "Undisclosed";
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const values = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
    if (values.length < 2) continue;
    const sel = f.dims.get(dim.key) ?? new Set<string>();
    f.dims.set(dim.key, sel);

    const row = el("div", "frow");
    row.append(el("span", undefined, esc(dim.label)));
    for (const v of values) {
      const chip = el("button", `chip${sel.has(v) ? " on" : ""}`, esc(v));
      chip.addEventListener("click", () => {
        if (sel.has(v)) sel.delete(v);
        else sel.add(v);
        onChange();
      });
      row.append(chip);
    }
    if (sel.size) {
      const clear = el("button", "chip clear", "clear");
      clear.addEventListener("click", () => {
        sel.clear();
        onChange();
      });
      row.append(clear);
    }
    rows.push(row);
  }
  host.replaceChildren(...rows);
}
