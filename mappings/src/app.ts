import { MAPPINGS, bySlug } from "./data/index.ts";
import type { Mapping } from "./types.ts";
import { applyFilters } from "./types.ts";
import { el, esc } from "./dom.ts";
import { observeReveals } from "./reveal.ts";
import { mapPanel, renderMap } from "./widgets/map.ts";
import { renderTimeline } from "./widgets/timeline.ts";
import { renderBars } from "./widgets/bars.ts";
import { renderTable } from "./widgets/table.ts";
import { renderCalendar } from "./widgets/calendar.ts";
import { renderCumulative } from "./widgets/cumulative.ts";
import { renderTiles } from "./widgets/tiles.ts";
import { renderRing } from "./widgets/ring.ts";
import { buildFilterBar, parseFilters, serializeFilters } from "./widgets/filters.ts";

/** "#/compute?country=China" -> { slug, query } */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const qi = h.indexOf("?");
  return qi === -1 ? { slug: h, query: "" } : { slug: h.slice(0, qi), query: h.slice(qi + 1) };
}

export function start(root: HTMLElement) {
  let current = ""; // slug rendered right now — filter-only hash edits don't re-render
  const render = () => {
    const { slug, query } = parseHash();
    const m = bySlug(slug) ?? MAPPINGS[0];
    if (m.slug === current) return;
    current = m.slug;
    document.title = `${m.title} · Mappings · Futures Atlas`;
    root.replaceChildren(...page(m, query));
    observeReveals(root);
  };
  window.addEventListener("hashchange", render);
  render();
}

/** A card: label row (+ optional caption line under the body). */
function card(label: string, span: 1 | 2 | 3, withCap = false) {
  const panel = el("section", `panel s${span}`);
  panel.append(el("div", "plbl", esc(label)));
  const body = el("div", "pbody");
  panel.append(body);
  let cap: HTMLElement | undefined;
  if (withCap) {
    cap = el("div", "pcap");
    panel.append(cap);
  }
  return { panel, body, cap };
}

function page(m: Mapping, query: string): HTMLElement[] {
  const filters = parseFilters(query);

  /* head */
  const head = el("header", "head");
  head.setAttribute("data-reveal", "");
  head.append(
    el("p", "kicker", "Mappings — one evidence site, many datasets"),
    el("h1", "title", esc(m.title)),
    el("p", "intro", esc(m.intro))
  );

  /* the variable: the mapping switcher */
  const switchRow = el("div", "switch-row");
  switchRow.append(el("span", undefined, "Data source"));
  const seg = el("div", "seg");
  for (const opt of MAPPINGS) {
    const b = el("button", `seg-b${opt.slug === m.slug ? " on" : ""}`, esc(opt.title.replace(/^Mapping /, "")));
    b.addEventListener("click", () => {
      location.hash = `#/${opt.slug}`;
    });
    seg.append(b);
  }
  switchRow.append(seg);

  /* headline sentence (recomputed by filters) + freshness strip */
  const headline = el("section", "headline");
  headline.setAttribute("data-reveal", "");
  const hlSentence = el("p", "hl-sentence");
  const hlSub = el("p", "hl-sub");
  const src = m.sources[0];
  const fresh = el(
    "p",
    "freshness",
    `Snapshot of <a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.name)}</a>, ` +
      `retrieved ${esc(src.retrieved)} · ` +
      `<a href="${esc(src.licenseUrl ?? "#")}" target="_blank" rel="noopener noreferrer">${esc(src.license)}</a>` +
      (src.dataUrl
        ? ` · <a href="${esc(src.dataUrl)}" target="_blank" rel="noopener noreferrer">download the full dataset ↗</a>`
        : "")
  );
  headline.append(hlSentence, hlSub, fresh);

  /* board — 3-column card grid */
  const board = el("div", "board");
  const map = mapPanel();
  board.append(map.panel);
  const timeline = card(m.timeline.label, 2);
  const ring = card("Concentration", 1, true);
  const calendar = card(m.calendar.label, 2, true);
  const tiles = card("The numbers", 1);
  const cumulative = card(m.cumulative.label, 2, true);
  const bds = m.breakdowns.map((bd) => card(bd.label, bd.span ?? 1));
  const table = card("Every record", 3);
  board.append(timeline.panel, ring.panel, calendar.panel, tiles.panel, cumulative.panel);
  // breakdown cards flow in after the cumulative curve (spans chosen per
  // mapping so the rows fill)
  board.append(...bds.map((b) => b.panel), table.panel);

  /* methodology */
  const method = el("section", "method");
  method.append(el("div", "lbl", "Where these numbers come from"));
  for (const s of m.sources) {
    const c = el("div", "src-card");
    c.append(
      el(
        "div",
        undefined,
        `<b>${esc(s.name)}</b> — <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a>`
      )
    );
    c.append(
      el(
        "div",
        "src-meta",
        `License: <a href="${esc(s.licenseUrl ?? "#")}" target="_blank" rel="noopener noreferrer">${esc(s.license)}</a> · retrieved ${esc(s.retrieved)}` +
          (s.dataUrl ? ` · <a href="${esc(s.dataUrl)}" target="_blank" rel="noopener noreferrer">raw data ↗</a>` : "")
      )
    );
    const ul = el("ul");
    for (const p of s.method) ul.append(el("li", undefined, esc(p)));
    c.append(ul);
    method.append(c);
  }
  for (const p of m.methodNotes) method.append(el("p", undefined, esc(p)));
  method.append(
    el(
      "p",
      undefined,
      `The anatomy of this page — a headline sentence with the computed number in it, a sticky filter strip that recomputes ` +
        `every graphic at once, a map where one dot is one record, time-texture and trend charts, the row-level table, and ` +
        `this methodology block — is borrowed deliberately from ` +
        `<a href="https://mappingpoliceviolence.org/" target="_blank" rel="noopener noreferrer">Mapping Police Violence</a> ` +
        `(Campaign Zero). Mappings makes that anatomy generic: the data domain is a variable, and each dataset plugs into the same widgets.`
    )
  );

  /* one update: filters -> the URL + every widget (the MPV pattern) */
  const update = () => {
    const q = serializeFilters(filters);
    history.replaceState(null, "", `#/${m.slug}${q ? `?${q}` : ""}`);
    const recs = applyFilters(m.records, filters);
    bar.setCount(recs.length);
    const hl = m.headline(recs);
    hlSentence.innerHTML = esc(hl.sentence).replace("___", `<span class="hl-num">${esc(hl.big)}</span>`);
    hlSub.textContent = hl.sub;
    renderMap(map.body, map.cap, m, recs);
    renderTimeline(timeline.body, m, recs);
    renderRing(ring.body, ring.cap!, m, recs);
    renderCalendar(calendar.body, calendar.cap!, m, recs);
    renderTiles(tiles.body, m, recs);
    renderCumulative(cumulative.body, cumulative.cap!, m, recs);
    m.breakdowns.forEach((bd, i) => renderBars(bds[i].body, m, recs, bd));
    table.panel.querySelector(".plbl")!.innerHTML =
      `Every record` +
      `<span class="pnote">${recs.length} of ${m.records.length} ${esc(m.recordNoun)}s match — each row links to its source</span>`;
    renderTable(table.body, m, recs);
  };

  const bar = buildFilterBar(m, filters, update);
  update();

  const wrap = el("div", "wrap");
  wrap.append(head, switchRow, headline, board, method);
  return [bar.bar, wrap];
}
