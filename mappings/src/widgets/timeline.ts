import type { Mapping, Rec } from "../types.ts";
import { el, esc, hideTip, showTip } from "../dom.ts";
import { year } from "../types.ts";

export function renderTimeline(body: HTMLElement, m: Mapping, recs: Rec[]) {
  if (!recs.length) {
    body.replaceChildren(el("div", "msg", "No records match the current filters."));
    return;
  }
  const years = recs.map(year);
  const y0 = Math.min(...years);
  const y1 = Math.max(...years);
  const bins = new Map<number, { count: number; sum: number }>();
  for (let y = y0; y <= y1; y++) bins.set(y, { count: 0, sum: 0 });
  for (const r of recs) {
    const b = bins.get(year(r))!;
    b.count++;
    b.sum += r.value ?? 0;
  }
  const metric = (b: { count: number; sum: number }) => (m.timeline.metric === "value" ? b.sum : b.count);
  const max = Math.max(1, ...[...bins.values()].map(metric));

  const tl = el("div", "tl");
  // keep year labels legible when the span is wide
  const labelEvery = y1 - y0 >= 14 ? 4 : y1 - y0 >= 8 ? 2 : 1;
  for (const [y, b] of bins) {
    const col = el("div", "col");
    if (m.timeline.openEndedYear === y) col.classList.add("partial");
    const v = el("div", "v");
    v.style.height = `${Math.round((metric(b) / max) * 140)}px`;
    const n = el("div", "n", b.count ? String(b.count) : "");
    const t = el("div", "t", (y - y0) % labelEvery === 0 ? `'${String(y).slice(2)}` : "");
    col.append(n, v, t);
    col.addEventListener("mousemove", (e) => {
      const sum = b.sum > 0 ? ` · ${m.format(b.sum)}` : "";
      const partial = m.timeline.openEndedYear === y ? "<br>year still incomplete in the data" : "";
      showTip(e.clientX, e.clientY, `<b>${y}</b>${b.count} ${esc(m.recordNoun)}${b.count === 1 ? "" : "s"}${esc(sum)}${partial}`);
    });
    col.addEventListener("mouseleave", hideTip);
    tl.append(col);
  }
  body.replaceChildren(tl);
}
