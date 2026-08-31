import type { Mapping, Rec } from "../types.ts";
import { el, esc, hideTip, showTip } from "../dom.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * MPV's time-texture widget, at our data's natural grain: a year × month grid
 * where each cell is bucketed by how many records landed that month
 * (0 / 1 / 2 / 3+ — the same legend MPV uses for days).
 */
export function renderCalendar(body: HTMLElement, cap: HTMLElement, m: Mapping, recs: Rec[]) {
  if (!recs.length) {
    body.replaceChildren(el("div", "msg", "No records match the current filters."));
    cap.textContent = "";
    return;
  }
  const counts = new Map<string, number>(); // "YYYY-MM" -> n
  for (const r of recs) {
    const key = r.date.length >= 7 ? r.date.slice(0, 7) : `${r.date.slice(0, 4)}-01`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const years = [...new Set(recs.map((r) => Number(r.date.slice(0, 4))))].sort();
  const y0 = years[0];
  const y1 = years[years.length - 1];

  const legend = el("div", "cal-legend");
  legend.append(el("span", undefined, "records/month"));
  for (const b of ["0", "1", "2", "3+"]) legend.append(el("i", `cal-cell b${b === "3+" ? 3 : b}`, esc(b)));

  const grid = el("div", "cal");
  const header = el("div", "cal-row");
  header.append(el("b", "cal-y", ""));
  for (const mo of MONTHS) header.append(el("span", "cal-m", mo[0]));
  grid.append(header);

  // last month that actually appears in the data — nothing after it is drawn,
  // so an incomplete trailing year never reads as a run of quiet months
  const lastKey = [...counts.keys()].sort().at(-1)!;

  for (let y = y0; y <= y1; y++) {
    const row = el("div", "cal-row");
    row.append(el("b", "cal-y", String(y)));
    for (let mo = 0; mo < 12; mo++) {
      const key = `${y}-${String(mo + 1).padStart(2, "0")}`;
      if (key > lastKey) {
        row.append(el("i", "cal-cell future"));
        continue;
      }
      const n = counts.get(key) ?? 0;
      const cell = el("i", `cal-cell b${Math.min(n, 3)}`);
      cell.addEventListener("mousemove", (e) =>
        showTip(e.clientX, e.clientY, `<b>${MONTHS[mo]} ${y}</b>${n} ${esc(m.recordNoun)}${n === 1 ? "" : "s"}`)
      );
      cell.addEventListener("mouseleave", hideTip);
      row.append(cell);
    }
    grid.append(row);
  }
  body.replaceChildren(legend, grid);

  // the negative-space stat, over the last 12 months the data actually covers
  const [ly, lm] = lastKey.split("-").map(Number);
  let active = 0;
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(ly, lm - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if ((counts.get(key) ?? 0) > 0) active++;
  }
  cap.textContent = `${active} of the 12 months to ${MONTHS[lm - 1]} ${ly} (the newest month in the data) saw at least one new ${m.recordNoun}.`;
}
