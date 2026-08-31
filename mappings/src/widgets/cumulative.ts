import type { Mapping, Rec } from "../types.ts";
import { el, esc, hideTip, showTip } from "../dom.ts";

const W = 640;
const H = 240;
const PAD = { l: 8, r: 8, t: 14, b: 22 };
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Cumulative disclosed value over time — a step curve from the first record's
 * month to the last. Records with no disclosed value add nothing and the
 * caption counts them, so the curve never claims more than the data does.
 */
export function renderCumulative(body: HTMLElement, cap: HTMLElement, m: Mapping, recs: Rec[]) {
  const dated = recs.filter((r) => r.value !== null);
  if (!dated.length) {
    body.replaceChildren(el("div", "msg", "No records with disclosed values match the current filters."));
    cap.textContent = "";
    return;
  }
  const monthOf = (r: Rec) => (r.date.length >= 7 ? r.date.slice(0, 7) : `${r.date.slice(0, 4)}-01`);
  const byMonth = new Map<string, number>();
  for (const r of dated) byMonth.set(monthOf(r), (byMonth.get(monthOf(r)) ?? 0) + (r.value ?? 0));
  const keys = [...byMonth.keys()].sort();
  const [fy, fm] = keys[0].split("-").map(Number);
  const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
  const nMonths = (ly - fy) * 12 + (lm - fm) + 1;

  // cumulative series, one point per month across the whole span
  const pts: { key: string; y: number; mLabel: number; cum: number }[] = [];
  let cum = 0;
  for (let i = 0; i < nMonths; i++) {
    const d = new Date(Date.UTC(fy, fm - 1 + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    cum += byMonth.get(key) ?? 0;
    pts.push({ key, y: d.getUTCFullYear(), mLabel: d.getUTCMonth(), cum });
  }
  const total = cum;

  const x = (i: number) => PAD.l + (i / Math.max(1, nMonths - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / total) * (H - PAD.t - PAD.b);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "cum");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", m.cumulative.label);

  // gridlines at exact quarters of the total, labelled with the real values
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const gy = y(total * f);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(PAD.l));
    line.setAttribute("x2", String(W - PAD.r));
    line.setAttribute("y1", gy.toFixed(1));
    line.setAttribute("y2", gy.toFixed(1));
    line.setAttribute("class", "cum-grid");
    svg.appendChild(line);
    const lbl = document.createElementNS(SVG_NS, "text");
    lbl.setAttribute("x", String(PAD.l + 2));
    lbl.setAttribute("y", (gy - 4).toFixed(1));
    lbl.setAttribute("class", "cum-glbl");
    lbl.textContent = m.format(total * f);
    svg.appendChild(lbl);
  }
  // year ticks on the x axis
  for (let i = 0; i < nMonths; i++) {
    if (pts[i].mLabel !== 0) continue;
    const tx = x(i);
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", tx.toFixed(1));
    t.setAttribute("y", String(H - 6));
    t.setAttribute("class", "cum-xlbl");
    t.textContent = `'${String(pts[i].y).slice(2)}`;
    svg.appendChild(t);
  }

  const path = document.createElementNS(SVG_NS, "path");
  // step-after: the total only moves in the month a record lands
  let d = `M ${x(0).toFixed(1)} ${y(pts[0].cum).toFixed(1)}`;
  for (let i = 1; i < nMonths; i++) {
    d += ` H ${x(i).toFixed(1)} V ${y(pts[i].cum).toFixed(1)}`;
  }
  path.setAttribute("d", d);
  path.setAttribute("class", "cum-line");
  svg.appendChild(path);

  const end = document.createElementNS(SVG_NS, "circle");
  end.setAttribute("cx", x(nMonths - 1).toFixed(1));
  end.setAttribute("cy", y(total).toFixed(1));
  end.setAttribute("r", "4");
  end.setAttribute("class", "cum-end");
  svg.appendChild(end);

  // hover: nearest month readout
  const hover = document.createElementNS(SVG_NS, "rect");
  hover.setAttribute("x", "0");
  hover.setAttribute("y", "0");
  hover.setAttribute("width", String(W));
  hover.setAttribute("height", String(H));
  hover.setAttribute("fill", "transparent");
  hover.addEventListener("mousemove", (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (nMonths - 1));
    const p = pts[Math.max(0, Math.min(nMonths - 1, i))];
    showTip(e.clientX, e.clientY, `<b>${p.key}</b><span class="tv">${esc(m.format(p.cum))}</span> cumulative`);
  });
  hover.addEventListener("mouseleave", hideTip);
  svg.appendChild(hover);

  body.replaceChildren(svg);
  const hidden = recs.length - dated.length;
  cap.textContent =
    `Reaches ${m.format(total)} across ${dated.length} records with disclosed values` +
    (hidden > 0 ? `; ${hidden} records with undisclosed values add nothing to this curve.` : ".");
}
