// Literal Frequency — pick a book from the Source Library, pull its text over the
// API, and read its word frequency as a live DASHBOARD: an animated, interactive
// word nebula, a floating bubble field, a typographic cloud and a ranked bar
// chart, all on screen at once and all linked — hover a word anywhere and it
// lights up everywhere. Wide dynamic ranges (size, colour, glow) push the values.

import { library, getBook, getText, ApiError, type LibraryItem, type BookMeta } from "./api";
import { wordFrequency, totalWords, type WordCount } from "./wordfreq";

interface VizData { meta: BookMeta; freq: WordCount[]; total: number; pages: number }

const SCAFFOLD = `
<div class="wrap">
  <header class="head">
    <h1 class="title">Literal Frequency</h1>
    <p class="intro">A live dashboard built from the <a href="https://sourcelibrary.org" target="_blank" rel="noopener">Source Library</a> — the open-access archive of digitised, translated books. It loads a book over the API and reads its word frequency four ways at once, all linked: hover a word and it lights up across every view.</p>
  </header>

  <div class="controls">
    <label class="ctl"><span>Book</span><select class="sel-book"></select></label>
    <label class="ctl"><span>Text</span><select class="sel-content">
      <option value="translation">Translation</option>
      <option value="ocr">Original (OCR)</option>
      <option value="both">Both</option>
    </select></label>
    <label class="ctl"><span>Pages</span><input class="sel-pages" type="range" min="10" max="60" step="5" value="30"><b class="pages-val">30</b></label>
  </div>

  <div class="stage"></div>

  <section class="about">
    <div class="lbl">About</div>
    <p>Word frequency is the "hello world" of data visualisation. Size, colour, glow and motion all encode how often a term appears across the analysed pages (common stopwords removed). The source text — OCR and first-pass translation — comes straight from the Source Library API; switch books, text source, or page range above. Built for the Futures Atlas.</p>
  </section>
</div>`;

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Wide brand-blue ramp: dim/cool at low frequency → bright/saturated at high.
const ramp = (t: number): string => `oklch(${(0.4 + 0.55 * t).toFixed(3)} ${(0.04 + 0.14 * t).toFixed(3)} 245)`;
const rampA = (t: number, a: number): string => `oklch(${(0.45 + 0.5 * t).toFixed(3)} ${(0.05 + 0.14 * t).toFixed(3)} 245 / ${a})`;

// ── shared cross-panel highlight ─────────────────────────────────────────────
let cleanups: (() => void)[] = [];
let hlSubs: ((w: string | null) => void)[] = [];
let highlighted: string | null = null;
const setHighlight = (w: string | null): void => {
  if (w === highlighted) return;
  highlighted = w;
  for (const f of hlSubs) f(w);
};
const teardown = (): void => {
  for (const c of cleanups) c();
  cleanups = [];
  hlSubs = [];
  highlighted = null;
};

export async function boot(root: HTMLElement): Promise<void> {
  root.innerHTML = SCAFFOLD;
  const selBook = root.querySelector<HTMLSelectElement>(".sel-book")!;
  const selContent = root.querySelector<HTMLSelectElement>(".sel-content")!;
  const pages = root.querySelector<HTMLInputElement>(".sel-pages")!;
  const pagesVal = root.querySelector<HTMLElement>(".pages-val")!;
  const stage = root.querySelector<HTMLElement>(".stage")!;
  pages.addEventListener("input", () => (pagesVal.textContent = pages.value));

  if (new URLSearchParams(location.search).has("demo")) {
    render(stage, demoData());
    return;
  }

  stage.innerHTML = `<div class="msg">Loading the library…</div>`;
  let items: LibraryItem[] = [];
  try {
    const all = await library(60);
    items = all.filter((i) => i.id && i.pages > 0 && i.translationPercent >= 15).slice(0, 36);
    if (items.length === 0) items = all.filter((i) => i.id && i.pages > 0).slice(0, 36);
  } catch {
    stage.innerHTML = `<div class="msg err">Could not reach the Source Library API.</div>`;
    return;
  }
  selBook.innerHTML = items.map((b, i) => `<option value="${i}">${esc(b.title)} — ${esc(b.author)}</option>`).join("");

  let token = 0;
  const load = async (): Promise<void> => {
    const item = items[Number(selBook.value)] ?? items[0]!;
    const n = Number(pages.value);
    const content = selContent.value as "translation" | "ocr" | "both";
    const mine = ++token;
    teardown();
    stage.innerHTML = `<div class="msg">Reading <em>${esc(item.title)}</em>…</div>`;
    try {
      const [meta, raw] = await Promise.all([getBook(item.id), getText(item.id, { content, from: 1, to: n })]);
      if (mine !== token) return;
      render(stage, { meta, freq: wordFrequency(raw, 200), total: totalWords(raw), pages: n });
    } catch (e) {
      if (mine !== token) return;
      const limited = e instanceof ApiError && e.status === 429;
      stage.innerHTML = limited
        ? `<div class="msg err">The Source Library API is rate-limiting requests right now. Give it a moment and try again.</div>`
        : `<div class="msg err">Could not load that book's text. Try another book, or fewer pages.</div>`;
    }
  };
  selBook.addEventListener("change", load);
  selContent.addEventListener("change", load);
  pages.addEventListener("change", load);
  await load();
}

function render(stage: HTMLElement, data: VizData): void {
  teardown();
  const { meta, freq, total, pages } = data;
  if (freq.length === 0) {
    stage.innerHTML = `<div class="msg">No legible words found in this range — try the OCR text source or more pages.</div>`;
    return;
  }
  stage.innerHTML = `
    <div class="bookhead">
      ${meta.thumbnail ? `<img class="cover" src="${esc(meta.thumbnail)}" alt="" loading="lazy">` : ""}
      <div class="bh-meta">
        <h2 class="bh-title">${esc(meta.title)}</h2>
        ${meta.originalTitle && meta.originalTitle !== meta.title ? `<div class="bh-orig">${esc(meta.originalTitle)}</div>` : ""}
        <div class="bh-facts">${[esc(meta.author), meta.year, meta.language].filter(Boolean).join(" · ")}</div>
        <div class="bh-facts dim">${total.toLocaleString()} words across ${pages} pages · top ${freq.length} terms</div>
        <a class="bh-link" href="${esc(meta.url)}" target="_blank" rel="noopener">Read on Source Library ↗</a>
      </div>
    </div>
    <div class="board">
      <div class="panel nebula"><div class="plbl">Word nebula</div><div class="pbody"></div></div>
      <div class="panel bubbles"><div class="plbl">Bubble field</div><div class="pbody"></div></div>
      <div class="panel bars"><div class="plbl">Top terms</div><div class="pbody"></div></div>
      <div class="panel cloud"><div class="plbl">Frequency cloud</div><div class="pbody"></div></div>
    </div>`;
  const body = (cls: string) => stage.querySelector<HTMLElement>(`.panel.${cls} .pbody`)!;
  nebulaPanel(body("nebula"), freq);
  bubblesPanel(body("bubbles"), freq);
  barsPanel(body("bars"), freq);
  cloudPanel(body("cloud"), freq);
}

// shared: crisp sized canvas
function makeCanvas(box: HTMLElement, height: number): { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number } {
  const cv = document.createElement("canvas");
  box.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = box.clientWidth || 600;
  cv.style.width = "100%";
  cv.style.height = `${height}px`;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(height * dpr);
  cv.getContext("2d")!.scale(dpr, dpr);
  return { cv, ctx: cv.getContext("2d")!, w, h: height };
}

// ── Cloud: dramatic size + colour range, hover-linked ────────────────────────
function cloudPanel(box: HTMLElement, freq: WordCount[]): void {
  const max = freq[0]!.count;
  box.innerHTML = freq
    .slice(0, 150)
    .map((w) => {
      const t = w.count / max;
      const size = (0.7 + Math.pow(t, 0.5) * 4.6).toFixed(2);
      return `<span class="w" data-w="${esc(w.word)}" style="font-size:${size}rem;color:${ramp(t)}" title="${esc(w.word)} · ${w.count}">${esc(w.word)}</span>`;
    })
    .join(" ");
  const spans = [...box.querySelectorAll<HTMLElement>(".w")];
  for (const s of spans) {
    s.addEventListener("pointerenter", () => setHighlight(s.dataset.w || null));
    s.addEventListener("pointerleave", () => setHighlight(null));
  }
  hlSubs.push((w) => { box.classList.toggle("has-hl", !!w); for (const s of spans) s.classList.toggle("on", !!w && s.dataset.w === w); });
}

// ── Bars: animated widths, hover-linked ──────────────────────────────────────
function barsPanel(box: HTMLElement, freq: WordCount[]): void {
  const max = freq[0]!.count;
  box.innerHTML = freq
    .slice(0, 28)
    .map((w) => {
      const t = w.count / max;
      return `<div class="bar" data-w="${esc(w.word)}"><span class="bw">${esc(w.word)}</span><span class="bt"><i style="width:0%;background:${ramp(t)}" data-pct="${(t * 100).toFixed(1)}"></i></span><span class="bc">${w.count}</span></div>`;
    })
    .join("");
  // animate widths in
  requestAnimationFrame(() => box.querySelectorAll<HTMLElement>(".bt i").forEach((el, k) => {
    setTimeout(() => (el.style.width = `${el.dataset.pct}%`), 30 + k * 18);
  }));
  const rows = [...box.querySelectorAll<HTMLElement>(".bar")];
  for (const r of rows) {
    r.addEventListener("pointerenter", () => setHighlight(r.dataset.w || null));
    r.addEventListener("pointerleave", () => setHighlight(null));
  }
  hlSubs.push((w) => { box.classList.toggle("has-hl", !!w); for (const r of rows) r.classList.toggle("on", !!w && r.dataset.w === w); });
}

// ── Nebula: drifting glowing nodes; mouse-repelled; hover-linked ─────────────
function nebulaPanel(box: HTMLElement, freq: WordCount[]): void {
  const { cv, ctx, w, h } = makeCanvas(box, 440);
  const max = freq[0]!.count;
  const N = Math.min(90, freq.length);
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  const cx = w / 2, cy = h / 2;
  const spread = Math.min(w, h) * 0.46;
  type Node = { word: string; t: number; count: number; bx: number; by: number; ph: number; x: number; y: number; r: number };
  const nodes: Node[] = freq.slice(0, N).map((wd, i) => {
    const t = wd.count / max;
    const rr = Math.sqrt(i / N) * spread;
    const a = i * GOLD;
    return { word: wd.word, t, count: wd.count, bx: Math.cos(a) * rr, by: Math.sin(a) * rr * 0.6, ph: i * 1.7, x: cx, y: cy, r: 1 };
  });
  let mx = -1e4, my = -1e4;
  const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; };
  const onLeave = () => { mx = my = -1e4; setHighlight(null); };
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerleave", onLeave);

  let raf = 0, t0 = 0;
  const frame = (now: number): void => {
    if (!t0) t0 = now;
    const time = (now - t0) / 1000;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#05060c";
    ctx.fillRect(0, 0, w, h);
    const rot = time * 0.05, cos = Math.cos(rot), sin = Math.sin(rot);
    let hover: Node | null = null, hoverD = 22 * 22;
    ctx.globalCompositeOperation = "lighter";
    for (const n of nodes) {
      const wob = 9 + 8 * n.t;
      const dx = n.bx + Math.cos(time * 0.5 + n.ph) * wob;
      const dy = n.by + Math.sin(time * 0.4 + n.ph * 1.3) * wob;
      let x = cx + dx * cos - dy * sin;
      let y = cy + dx * sin + dy * cos;
      // mouse repulsion
      const ex = x - mx, ey = y - my, ed2 = ex * ex + ey * ey;
      if (ed2 < 120 * 120) { const ed = Math.sqrt(ed2) || 1; const f = (1 - ed / 120) * 38; x += (ex / ed) * f; y += (ey / ed) * f; }
      n.x = x; n.y = y;
      const md2 = (x - mx) * (x - mx) + (y - my) * (y - my);
      if (md2 < hoverD) { hoverD = md2; hover = n; }
      const on = highlighted === n.word;
      const dim = highlighted && !on ? 0.25 : 1;
      const rad = (8 + Math.sqrt(n.t) * 72) * (0.9 + 0.12 * Math.sin(time + n.ph)) * (on ? 1.5 : 1);
      n.r = rad;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rampA(n.t, (on ? 0.85 : 0.5) * dim));
      g.addColorStop(1, rampA(n.t, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    if (hover) setHighlight(hover.word);
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const n of nodes) {
      const on = highlighted === n.word;
      const dim = highlighted && !on ? 0.25 : 1;
      const fs = (10 + Math.sqrt(n.t) * 40) * (on ? 1.35 : 1);
      ctx.font = `${on ? 700 : 600} ${fs.toFixed(1)}px system-ui, sans-serif`;
      ctx.fillStyle = `oklch(${(0.8 + 0.18 * n.t).toFixed(3)} ${(0.04 + 0.08 * n.t).toFixed(3)} 245 / ${((0.5 + 0.5 * n.t) * dim).toFixed(2)})`;
      ctx.fillText(n.word, n.x, n.y);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  cleanups.push(() => { cancelAnimationFrame(raf); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); });
}

// ── Bubbles: floating circle pack; hover-linked ──────────────────────────────
function bubblesPanel(box: HTMLElement, freq: WordCount[]): void {
  const { cv, ctx, w, h } = makeCanvas(box, 440);
  const max = freq[0]!.count;
  const N = Math.min(40, freq.length);
  const k = Math.min(w, h) * 0.12;
  type B = { word: string; t: number; count: number; r: number; x: number; y: number; ph: number };
  const nodes: B[] = freq.slice(0, N).map((wd, i) => {
    const t = wd.count / max;
    const ang = i * 2.399, rr = 6 + i * 3.2;
    return { word: wd.word, t, count: wd.count, r: 5 + Math.sqrt(t) * k, x: w / 2 + Math.cos(ang) * rr, y: h / 2 + Math.sin(ang) * rr, ph: i * 1.3 };
  });
  for (let it = 0; it < 300; it++) {
    for (let i = 0; i < N; i++) { nodes[i]!.x += (w / 2 - nodes[i]!.x) * 0.012; nodes[i]!.y += (h / 2 - nodes[i]!.y) * 0.012; }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = nodes[i]!, b = nodes[j]!; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.01; const min = a.r + b.r + 2;
      if (d < min) { const p = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * p; a.y -= uy * p; b.x += ux * p; b.y += uy * p; }
    }
  }
  for (const n of nodes) { n.x = Math.max(n.r, Math.min(w - n.r, n.x)); n.y = Math.max(n.r, Math.min(h - n.r, n.y)); }
  let mx = -1e4, my = -1e4;
  const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; };
  const onLeave = () => { mx = my = -1e4; setHighlight(null); };
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerleave", onLeave);
  let raf = 0, t0 = 0;
  const frame = (now: number): void => {
    if (!t0) t0 = now; const time = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#05060c"; ctx.fillRect(0, 0, w, h);
    let hover: B | null = null;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const n of nodes) {
      const fx = Math.cos(time * 0.6 + n.ph) * (2 + n.t * 3);
      const fy = Math.sin(time * 0.5 + n.ph * 1.2) * (2 + n.t * 3);
      const x = n.x + fx, y = n.y + fy;
      const md = (x - mx) * (x - mx) + (y - my) * (y - my);
      if (md < n.r * n.r) hover = n;
      const on = highlighted === n.word;
      const dim = highlighted && !on ? 0.28 : 1;
      const r = n.r * (on ? 1.12 : 1);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rampA(n.t, (on ? 1 : 0.85) * dim);
      ctx.fill();
      if (on) { ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke(); }
      if (r > 13) {
        ctx.font = `600 ${Math.min(r * 0.5, 22).toFixed(1)}px system-ui, sans-serif`;
        ctx.fillStyle = n.t > 0.55 ? `rgba(6,8,14,${dim})` : `rgba(240,245,255,${dim})`;
        ctx.fillText(n.word, x, y);
      }
    }
    if (hover) setHighlight(hover.word);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  cleanups.push(() => { cancelAnimationFrame(raf); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); });
}

function demoData(): VizData {
  const words = ("nature spirit light world heaven matter fire water earth soul body motion form number harmony circle sphere star sun moon angel divine reason mind virtue art proportion measure figure line point image element vapour mineral metal salt sulphur principle cause power celestial elemental quintessence")
    .split(" ");
  const freq = words.map((word, i) => ({ word, count: Math.round(240 * Math.pow(0.9, i) + 3) }));
  return {
    meta: { id: "demo", title: "The History of the Two Worlds", originalTitle: "Utriusque Cosmi Historia", author: "Robert Fludd", language: "Latin", year: "1617", pages: 1036, pagesTranslated: 1036, thumbnail: "", categories: [], url: "https://sourcelibrary.org" },
    freq, total: 9214, pages: 30,
  };
}
