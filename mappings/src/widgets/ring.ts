import type { Mapping, Rec } from "../types.ts";
import { el, esc } from "../dom.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const R = 56;
const CIRC = 2 * Math.PI * R;

/**
 * Concentration ring — the share of the summed DISCLOSED measure held by the
 * top N groups of one dimension. One arc against an empty track: the remainder
 * is track, not a second measured value (we didn't measure "everyone else",
 * we measured a share).
 */
export function renderRing(body: HTMLElement, cap: HTMLElement, m: Mapping, recs: Rec[]) {
  const c = m.concentration;
  const sums = new Map<string, number>();
  let total = 0;
  for (const r of recs) {
    if (r.value === null) continue;
    const k = r.dims[c.dim] ?? "Undisclosed";
    sums.set(k, (sums.get(k) ?? 0) + r.value);
    total += r.value;
  }
  if (!total) {
    body.replaceChildren(el("div", "msg", "No disclosed values match the current filters."));
    cap.textContent = "";
    return;
  }
  // "Undisclosed" is not an owner/company — it never counts as one of the top
  // N groups, though its value stays in the denominator
  const ranked = [...sums.entries()].filter(([k]) => k !== "Undisclosed").sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, c.top);
  if (!top.length || top[0][1] <= 0) {
    body.replaceChildren(
      el("div", "msg", `The ${c.dim} is undisclosed for every matching record, so no share can be computed.`)
    );
    cap.textContent = "";
    return;
  }
  const share = top.reduce((s, [, v]) => s + v, 0) / total;
  const pct = Math.round(share * 100);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 140 140");
  svg.setAttribute("class", "ring");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${pct}% ${c.label}`);
  const track = document.createElementNS(SVG_NS, "circle");
  track.setAttribute("cx", "70");
  track.setAttribute("cy", "70");
  track.setAttribute("r", String(R));
  track.setAttribute("class", "ring-track");
  const arc = document.createElementNS(SVG_NS, "circle");
  arc.setAttribute("cx", "70");
  arc.setAttribute("cy", "70");
  arc.setAttribute("r", String(R));
  arc.setAttribute("class", "ring-arc");
  arc.setAttribute("stroke-dasharray", `${(share * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`);
  arc.setAttribute("transform", "rotate(-90 70 70)");
  const txt = document.createElementNS(SVG_NS, "text");
  txt.setAttribute("x", "70");
  txt.setAttribute("y", "79");
  txt.setAttribute("class", "ring-pct");
  txt.textContent = `${pct}%`;
  svg.append(track, arc, txt);

  const legend = el("div", "ring-legend");
  legend.append(el("p", "ring-label", esc(c.label)));
  for (const [k, v] of top) {
    const row = el("div", "ring-row");
    row.append(el("span", undefined, esc(k)), el("b", undefined, `${Math.round((v / total) * 100)}%`));
    legend.append(row);
  }
  const holder = el("div", "ring-wrap");
  holder.append(svg, legend);
  body.replaceChildren(holder);
  const hidden = recs.filter((r) => r.value === null).length;
  cap.textContent =
    `Share of the ${m.format(total)} summed from disclosed values` +
    (hidden > 0 ? ` (${hidden} records with undisclosed values can't be shared out).` : ".");
}
