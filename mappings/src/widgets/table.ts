import type { Mapping, Rec } from "../types.ts";
import { el, esc } from "../dom.ts";

const PAGE = 14;

/** The record table — the row-level evidence, every row linking out. */
export function renderTable(body: HTMLElement, m: Mapping, recs: Rec[]) {
  let shown = PAGE;
  const draw = () => {
    const scroll = el("div", "tbl-scroll");
    const table = el("table", "recs");
    table.innerHTML =
      `<thead><tr><th>${esc(m.recordNoun)}</th><th>Date</th><th>Where</th><th>Size</th><th>Detail</th><th>Source</th></tr></thead>`;
    const tb = el("tbody");
    for (const r of recs.slice(0, shown)) {
      const tr = el("tr");
      tr.innerHTML =
        `<td class="rn">${esc(r.name)}</td>` +
        `<td class="rd">${esc(r.date)}</td>` +
        `<td>${esc(r.place ?? "—")}</td>` +
        `<td class="rv">${r.value === null ? "undisclosed" : esc(m.format(r.value))}</td>` +
        `<td>${esc(r.note ?? "")}</td>` +
        `<td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">source ↗</a>` : "—"}</td>`;
      tb.append(tr);
    }
    table.append(tb);
    scroll.append(table);
    const kids: HTMLElement[] = [scroll];
    if (recs.length > shown) {
      const more = el("div", "tbl-more");
      const btn = el("button", "btn", `Show all ${recs.length} records`);
      btn.addEventListener("click", () => {
        shown = recs.length;
        draw();
      });
      more.append(btn);
      kids.push(more);
    }
    if (!recs.length) kids.push(el("div", "msg", "No records match the current filters."));
    body.replaceChildren(...kids);
  };
  draw();
}
