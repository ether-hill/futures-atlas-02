import type { Mapping, Rec } from "../types.ts";
import { el, esc, hideTip, showTip } from "../dom.ts";
import { year } from "../types.ts";

/**
 * One bar per year. Heights are strictly metric/max — a year with nothing gets
 * no bar at all (never a decorative minimum), and a year whose records are all
 * undisclosed shows its count label with zero height, which the tooltip
 * explains.
 */
export function renderTimeline(body: HTMLElement, m: Mapping, recs: Rec[]) {
  if (!recs.length) {
    body.replaceChildren(el("div", "msg", "No records match the current filters."));
    return;
  }
  const years = recs.map(year);
  const y0 = Math.min(...years);
  const y1 = Math.max(...years);
  const bins = new Map<number, { count: number; sum: number; undisclosed: number }>();
  for (let y = y0; y <= y1; y++) bins.set(y, { count: 0, sum: 0, undisclosed: 0 });
  for (const r of recs) {
    const b = bins.get(year(r))!;
    b.count++;
    if (r.value === null) b.undisclosed++;
    else b.sum += r.value;
  }
  const metric = (b: { count: number; sum: number }) => (m.timeline.metric === "value" ? b.sum : b.count);
  const max = Math.max(1e-9, ...[...bins.values()].map(metric));

  const tl = el("div", "tl");
  const labelEvery = y1 - y0 >= 14 ? 4 : y1 - y0 >= 8 ? 2 : 1;
  for (const [y, b] of bins) {
    const col = el("div", "col");
    if (m.timeline.openEndedYear === y) col.classList.add("partial");
    const v = el("div", "v");
    v.style.height = `${((metric(b) / max) * 140).toFixed(1)}px`;
    const n = el("div", "n", b.count ? String(b.count) : "");
    const t = el("div", "t", (y - y0) % labelEvery === 0 ? `'${String(y).slice(2)}` : "");
    col.append(n, v, t);
    col.addEventListener("mousemove", (e) => {
      const bits = [`${b.count} ${m.recordNoun}${b.count === 1 ? "" : "s"}`];
      if (b.sum > 0) bits.push(m.format(b.sum));
      if (b.undisclosed > 0) bits.push(`${b.undisclosed} with the size undisclosed`);
      if (m.timeline.openEndedYear === y) bits.push("year still incomplete in the data");
      showTip(e.clientX, e.clientY, `<b>${y}</b>${esc(bits.join(" · "))}`);
    });
    col.addEventListener("mouseleave", hideTip);
    tl.append(col);
  }
  body.replaceChildren(tl);
}
