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
  // site-level dots vs country-level placeholders (drawn as one aggregate
  // marker per country — never as stacked fake "sites")
  const precise = located.filter((r) => !r.approx);
  const approx = located.filter((r) => r.approx);
  const groups = new Map<string, { recs: Rec[]; lat: number; lng: number }>();
  for (const r of approx) {
    // group by the record's own stated country (place), never the bucketed
    // country dim — "Other" is not a place on the map
    const k = r.place ?? r.dims.country ?? "?";
    const g = groups.get(k) ?? { recs: [], lat: r.lat!, lng: r.lng! };
    g.recs.push(r);
    groups.set(k, g);
  }

  // one AREA scale for every mark on the map: r ∝ √v with no base offset, a
  // floor only to keep the tiniest disclosed marks findable; undisclosed
  // values render hollow at the floor size so they never claim a magnitude
  const groupSums = [...groups.values()].map((g) => g.recs.reduce((s, r) => s + (r.value ?? 0), 0));
  const vmax = Math.max(1, ...precise.map((r) => r.value ?? 0), ...groupSums);
  const rOf = (v: number) => Math.max(1.4, 13 * Math.sqrt(v / vmax));

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Map of ${m.recordNoun} records`);
  svg.innerHTML = basemap();

  const circle = (cls: string, x: number, y: number, r: number, tip: () => string) => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("class", cls);
    c.setAttribute("cx", x.toFixed(1));
    c.setAttribute("cy", y.toFixed(1));
    c.setAttribute("r", r.toFixed(2));
    c.addEventListener("mousemove", (e) => showTip(e.clientX, e.clientY, tip()));
    c.addEventListener("mouseleave", hideTip);
    svg.appendChild(c);
  };

  for (const [country, g] of groups) {
    const p = projection([g.lng, g.lat]);
    if (!p) continue;
    const sum = g.recs.reduce((s, r) => s + (r.value ?? 0), 0);
    const und = g.recs.filter((r) => r.value === null).length;
    circle("dot approx", p[0], p[1], rOf(sum), () => {
      const bits = [`${g.recs.length} ${m.recordNoun}${g.recs.length === 1 ? "" : "s"}`];
      if (sum > 0) bits.push(`${m.format(sum)} summed`);
      if (und > 0) bits.push(`${und} with the size undisclosed`);
      return `<b>${esc(country)}</b>${esc(bits.join(" · "))}<br>exact sites not disclosed — drawn at the country, not a site`;
    });
  }

  // draw big dots first so small ones stay hoverable on top
  const sorted = [...precise].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  for (const r of sorted) {
    const p = projection([r.lng!, r.lat!]);
    if (!p) continue;
    const nul = r.value === null || r.value <= 0;
    circle(nul ? "dot nul" : "dot", p[0], p[1], nul ? 2.4 : rOf(r.value!), () => {
      const v = r.value === null ? "value not disclosed" : m.format(r.value);
      return `<b>${esc(r.name)}</b>${esc(r.place ?? "")} · ${esc(r.date)}<br><span class="tv">${esc(v)}</span>`;
    });
  }

  body.replaceChildren(svg);
  const missing = recs.length - located.length;
  const hollow = precise.filter((r) => r.value === null || r.value <= 0).length;
  cap.textContent =
    `${precise.length} of ${recs.length} records state a site and are drawn as solid dots. ` +
    (approx.length > 0
      ? `${approx.length} are known only to the country and are pooled into ${groups.size} dashed country marker${groups.size === 1 ? "" : "s"}. `
      : "") +
    (missing > 0 ? `${missing} without any location still count in every figure. ` : "") +
    m.map.dotLegend +
    (hollow > 0 ? ` Hollow dots are records with the size undisclosed.` : "");
  return { locatedCount: located.length };
}

export const mapPanel = () => {
  const panel = el("section", "panel map s3");
  panel.append(el("div", "plbl", "The map"));
  const body = el("div", "pbody");
  const cap = el("div", "map-cap");
  panel.append(body, cap);
  return { panel, body, cap };
};
