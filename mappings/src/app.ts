import { MAPPINGS, bySlug } from "./data/index.ts";
import type { Filters, Mapping } from "./types.ts";
import { applyFilters } from "./types.ts";
import { el, esc } from "./dom.ts";
import { observeReveals } from "./reveal.ts";
import { mapPanel, renderMap } from "./widgets/map.ts";
import { renderTimeline } from "./widgets/timeline.ts";
import { renderBars } from "./widgets/bars.ts";
import { renderTable } from "./widgets/table.ts";
import { renderFilters } from "./widgets/filters.ts";

export function start(root: HTMLElement) {
  const render = () => {
    const slug = location.hash.replace(/^#\/?/, "");
    const m = bySlug(slug) ?? MAPPINGS[0];
    document.title = `${m.title} · Mappings · Futures Atlas`;
    root.replaceChildren(page(m));
    observeReveals(root);
  };
  window.addEventListener("hashchange", render);
  render();
}

function page(m: Mapping): HTMLElement {
  const wrap = el("div", "wrap");
  const filters: Filters = { dims: new Map() };

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

  /* filters */
  const filterHost = el("div", "filters");

  /* board */
  const board = el("div", "board");
  const map = mapPanel();
  board.append(map.panel);

  const tlPanel = el("section", "panel wide");
  const tlLbl = el("div", "plbl", esc(m.timeline.label));
  const tlBody = el("div", "pbody");
  tlPanel.append(tlLbl, tlBody);
  board.append(tlPanel);

  const bdBodies = m.breakdowns.map((bd) => {
    const p = el("section", "panel");
    p.append(el("div", "plbl", esc(bd.label)));
    const b = el("div", "pbody");
    p.append(b);
    board.append(p);
    return b;
  });

  const tblPanel = el("section", "panel wide");
  const tblLbl = el("div", "plbl");
  const tblBody = el("div", "pbody");
  tblPanel.append(tblLbl, tblBody);
  board.append(tblPanel);

  /* methodology */
  const method = el("section", "method");
  method.append(el("div", "lbl", "Where these numbers come from"));
  for (const s of m.sources) {
    const card = el("div", "src-card");
    card.append(
      el(
        "div",
        undefined,
        `<b>${esc(s.name)}</b> — <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a>`
      )
    );
    const meta = el(
      "div",
      "src-meta",
      `License: <a href="${esc(s.licenseUrl ?? "#")}" target="_blank" rel="noopener noreferrer">${esc(s.license)}</a> · retrieved ${esc(s.retrieved)}` +
        (s.dataUrl ? ` · <a href="${esc(s.dataUrl)}" target="_blank" rel="noopener noreferrer">raw data ↗</a>` : "")
    );
    card.append(meta);
    const ul = el("ul");
    for (const p of s.method) ul.append(el("li", undefined, esc(p)));
    card.append(ul);
    method.append(card);
  }
  for (const p of m.methodNotes) method.append(el("p", undefined, esc(p)));
  method.append(
    el(
      "p",
      undefined,
      `The anatomy of this page — a headline sentence with the computed number in it, a map where one dot is one record, ` +
        `trend and breakdown charts driven by one shared set of filters, the row-level table, and this methodology block — ` +
        `is borrowed deliberately from <a href="https://mappingpoliceviolence.org/" target="_blank" rel="noopener noreferrer">Mapping Police Violence</a> ` +
        `(Campaign Zero). Mappings makes that anatomy generic: the data domain is a variable, and each dataset plugs into the same widgets.`
    )
  );

  /* one update: filters -> every widget (the MPV pattern) */
  const update = () => {
    const recs = applyFilters(m.records, filters);
    const hl = m.headline(recs);
    hlSentence.innerHTML = esc(hl.sentence).replace("___", `<span class="hl-num">${esc(hl.big)}</span>`);
    hlSub.textContent = hl.sub;
    renderFilters(filterHost, m, filters, update);
    renderMap(map.body, map.cap, m, recs);
    renderTimeline(tlBody, m, recs);
    m.breakdowns.forEach((bd, i) => renderBars(bdBodies[i], m, recs, bd));
    tblLbl.innerHTML =
      `Every record` +
      `<span class="pnote">${recs.length} of ${m.records.length} ${esc(m.recordNoun)}s match — each row links to its source</span>`;
    renderTable(tblBody, m, recs);
  };
  update();

  wrap.append(head, switchRow, headline, filterHost, board, method);
  return wrap;
}
