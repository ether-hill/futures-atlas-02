import type { Filters, Mapping } from "../types.ts";
import { YEAR_KEY, year } from "../types.ts";
import { el, esc } from "../dom.ts";

/**
 * The sticky filter bar — MPV's "Filter view:" strip. One dropdown per
 * filterable dimension plus a year dropdown, a live match count, and
 * "Copy link to view": the selection is serialised into the URL hash, so a
 * copied link reopens exactly this view.
 *
 * Built on the design system's `.fa-subnav` (sticky under the master bar,
 * which stays pinned on pages that carry one).
 */
export function buildFilterBar(m: Mapping, f: Filters, onChange: () => void) {
  const bar = el("div", "fa-subnav m-bar");
  bar.append(el("span", "m-bar-title", "Filter view:"));

  const plural = (s: string) =>
    s.endsWith("y") ? `${s.slice(0, -1)}ies` : s.endsWith("s") || s.endsWith("x") ? `${s}es` : `${s}s`;

  const dropdown = (key: string, label: string, values: string[]) => {
    const sel = f.dims.get(key) ?? new Set<string>();
    f.dims.set(key, sel);
    const box = el("label", "m-drop");
    box.append(el("span", undefined, esc(label)));
    const select = el("select");
    const all = el("option", undefined, `all ${plural(label.toLowerCase())}`);
    all.value = "";
    select.append(all);
    for (const v of values) {
      const o = el("option", undefined, esc(v));
      o.value = v;
      if (sel.has(v)) o.selected = true;
      select.append(o);
    }
    select.addEventListener("change", () => {
      sel.clear();
      if (select.value) sel.add(select.value);
      onChange();
    });
    box.append(select);
    return box;
  };

  // year first, like MPV
  const years = [...new Set(m.records.map((r) => String(year(r))))].sort().reverse();
  if (years.length > 1) bar.append(dropdown(YEAR_KEY, "Year", years));

  for (const dim of m.dims.filter((d) => d.filterable)) {
    const counts = new Map<string, number>();
    for (const r of m.records) {
      const v = r.dims[dim.key] ?? "Undisclosed";
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const values = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
    if (values.length > 1) bar.append(dropdown(dim.key, dim.label, values));
  }

  const count = el("span", "m-bar-count");
  const copy = el("button", "m-bar-copy", "⧉ Copy link to view");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = "✓ Link copied";
    } catch {
      copy.textContent = location.href; // clipboard blocked: show it instead
    }
    setTimeout(() => (copy.textContent = "⧉ Copy link to view"), 1600);
  });
  const right = el("div", "m-bar-right");
  right.append(count, copy);
  bar.append(right);

  return {
    bar,
    setCount(matched: number) {
      count.textContent = matched === m.records.length ? `all ${matched} records` : `${matched} of ${m.records.length} records`;
    },
  };
}

/** filters -> "country=China&__year=2025" (only non-empty selections). */
export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  for (const [k, sel] of f.dims) if (sel.size) p.set(k, [...sel][0]);
  return p.toString();
}

export function parseFilters(query: string): Filters {
  const f: Filters = { dims: new Map() };
  for (const [k, v] of new URLSearchParams(query)) f.dims.set(k, new Set(v ? [v] : []));
  return f;
}
