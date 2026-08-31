import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import worldTopo from "world-atlas/countries-110m.json";
import type { Mapping, Rec } from "../types.ts";
import { el, esc, hideTip, showTip } from "../dom.ts";

const W = 960;
const H = 470;

// Build the basemap once; only the dots re-render on filter changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = worldTopo as any;
const countries = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry>;
const projection = geoNaturalEarth1().fitExtent(
  [
    [8, 2],
    [W - 8, H - 6],
  ],
  countries
);
const path = geoPath(projection);
let basePaths: string | null = null;
function basemap(): string {
  if (!basePaths) {
    basePaths = countries.features
      .map((f) => `<path class="geo" d="${path(f) ?? ""}"></path>`)
      .join("");
  }
  return basePaths;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function renderMap(body: HTMLElement, cap: HTMLElement, m: Mapping, recs: Rec[]) {
  const located = recs.filter((r) => r.lat !== undefined && r.lng !== undefined);

  // dot area ~ value; records with no reported value get the minimum dot
  const vals = located.map((r) => r.value ?? 0);
  const vmax = Math.max(1, ...vals);
  const rOf = (v: number | null) => (v === null || v <= 0 ? 2.2 : 2.2 + 11 * Math.sqrt(v / vmax));

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Map of ${m.recordNoun} records`);
  svg.innerHTML = basemap();

  // draw big dots first so small ones stay hoverable on top
  const sorted = [...located].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  for (const r of sorted) {
    const p = projection([r.lng!, r.lat!]);
    if (!p) continue;
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("class", "dot");
    c.setAttribute("cx", p[0].toFixed(1));
    c.setAttribute("cy", p[1].toFixed(1));
    c.setAttribute("r", rOf(r.value).toFixed(2));
    c.addEventListener("mousemove", (e) => {
      const v = r.value === null ? "value not disclosed" : m.format(r.value);
      showTip(
        e.clientX,
        e.clientY,
        `<b>${esc(r.name)}</b>${esc(r.place ?? "")} · ${esc(r.date)}<br><span class="tv">${esc(v)}</span>`
      );
    });
    c.addEventListener("mouseleave", hideTip);
    svg.appendChild(c);
  }

  body.replaceChildren(svg);
  const missing = recs.length - located.length;
  cap.textContent =
    `${located.length} of ${recs.length} records have a location and are drawn. ` +
    (missing > 0 ? `${missing} without coordinates still count in every figure. ` : "") +
    m.map.dotLegend;
  return { locatedCount: located.length };
}

export const mapPanel = () => {
  const panel = el("section", "panel map wide");
  panel.append(el("div", "plbl", "The map"));
  const body = el("div", "pbody");
  const cap = el("div", "map-cap");
  panel.append(body, cap);
  return { panel, body, cap };
};
