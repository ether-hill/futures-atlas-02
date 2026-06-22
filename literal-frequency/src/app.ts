// Literal Frequency — pick a book from the Source Library, pull its text over the
// API, and read its word frequency four ways: a typographic cloud, an animated
// word nebula, a packed bubble field, and a ranked bar chart. Every view links
// back to the source book on sourcelibrary.org.

import { library, getBook, getText, ApiError, type LibraryItem, type BookMeta } from "./api";
import { wordFrequency, totalWords, type WordCount } from "./wordfreq";

type View = "cloud" | "nebula" | "bubbles" | "bars";
interface VizData {
  meta: BookMeta;
  freq: WordCount[];
  total: number;
  pages: number;
}

const VIEWS: { id: View; label: string }[] = [
  { id: "cloud", label: "Cloud" },
  { id: "nebula", label: "Nebula" },
  { id: "bubbles", label: "Bubbles" },
  { id: "bars", label: "Bars" },
];

const SCAFFOLD = `
<div class="wrap">
  <header class="head">
    <h1 class="title">Literal Frequency</h1>
    <p class="intro">Data visualisations built live from the <a href="https://sourcelibrary.org" target="_blank" rel="noopener">Source Library</a> — the open-access archive of digitised, translated books. It loads a book over the API and reads its word frequency several ways. Every view links back to its source.</p>
  </header>

  <div class="controls">
    <label class="ctl"><span>Book</span><select class="sel-book"></select></label>
    <label class="ctl"><span>Text</span><select class="sel-content">
      <option value="translation">Translation</option>
      <option value="ocr">Original (OCR)</option>
      <option value="both">Both</option>
    </select></label>
    <label class="ctl"><span>Pages</span><input class="sel-pages" type="range" min="10" max="60" step="5" value="30"><b class="pages-val">30</b></label>
    <div class="seg" role="tablist">${VIEWS.map((v) => `<button class="seg-b" data-view="${v.id}">${v.label}</button>`).join("")}</div>
  </div>

  <div class="stage"></div>

  <section class="about">
    <div class="lbl">About</div>
    <p>Word frequency is the "hello world" of data visualisation. The size and colour of each word encode how often it appears across the analysed pages (common stopwords removed). The source text — OCR and first-pass translation — comes straight from the Source Library API; switch books, text source, page range, or visualisation above. Built for the Futures Atlas.</p>
  </section>
</div>`;

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// brand-blue ramp by t∈0..1
const ramp = (t: number): string => `oklch(${(0.55 + 0.4 * t).toFixed(3)} ${(0.08 + 0.1 * t).toFixed(3)} 245)`;
const rampA = (t: number, a: number): string => `oklch(${(0.6 + 0.35 * t).toFixed(3)} ${(0.07 + 0.12 * t).toFixed(3)} 245 / ${a})`;

let stopAnim: (() => void) | null = null;

export async function boot(root: HTMLElement): Promise<void> {
  root.innerHTML = SCAFFOLD;
  const selBook = root.querySelector<HTMLSelectElement>(".sel-book")!;
  const selContent = root.querySelector<HTMLSelectElement>(".sel-content")!;
  const pages = root.querySelector<HTMLInputElement>(".sel-pages")!;
  const pagesVal = root.querySelector<HTMLElement>(".pages-val")!;
  const stage = root.querySelector<HTMLElement>(".stage")!;
  const segBtns = [...root.querySelectorAll<HTMLButtonElement>(".seg-b")];

  let view: View = "nebula";
  let data: VizData | null = null;
  const syncSeg = (): void => segBtns.forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  syncSeg();

  pages.addEventListener("input", () => (pagesVal.textContent = pages.value));

  // offline/demo fallback (also handy when the API is rate-limiting): ?demo=1
  if (new URLSearchParams(location.search).has("demo")) {
    data = demoData();
    render(stage, data, view);
    segBtns.forEach((b) =>
      b.addEventListener("click", () => {
        view = b.dataset.view as View;
        syncSeg();
        if (data) render(stage, data, view);
      }),
    );
    return;
  }

  segBtns.forEach((b) =>
    b.addEventListener("click", () => {
      view = b.dataset.view as View;
      syncSeg();
      if (data) render(stage, data, view);
    }),
  );

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
    if (stopAnim) (stopAnim(), (stopAnim = null));
    stage.innerHTML = `<div class="msg">Reading <em>${esc(item.title)}</em>…</div>`;
    try {
      const [meta, raw] = await Promise.all([getBook(item.id), getText(item.id, { content, from: 1, to: n })]);
      if (mine !== token) return;
      data = { meta, freq: wordFrequency(raw, 160), total: totalWords(raw), pages: n };
      render(stage, data, view);
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

function demoData(): VizData {
  const words = ("nature spirit light world heaven matter fire water earth soul body motion " +
    "form number harmony circle sphere star sun moon angel divine reason mind virtue art " +
    "proportion measure figure line point image element vapour mineral metal salt sulphur " +
    "principle cause power celestial elemental").split(" ");
  const freq = words.map((word, i) => ({ word, count: Math.round(220 * Math.pow(0.92, i) + 4) }));
  return {
    meta: {
      id: "demo", title: "The History of the Two Worlds", originalTitle: "Utriusque Cosmi Historia",
      author: "Robert Fludd", language: "Latin", year: "1617", pages: 1036, pagesTranslated: 1036,
      thumbnail: "", categories: [], url: "https://sourcelibrary.org",
    },
    freq, total: 8421, pages: 30,
  };
}

function render(stage: HTMLElement, data: VizData, view: View): void {
  if (stopAnim) (stopAnim(), (stopAnim = null));
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
    <div class="vizbox"></div>`;
  const box = stage.querySelector<HTMLElement>(".vizbox")!;
  if (view === "cloud") cloudView(box, freq);
  else if (view === "bars") barsView(box, freq);
  else if (view === "bubbles") bubblesView(box, freq);
  else nebulaView(box, freq);
}

// ── Cloud: typographic, size + colour by frequency ───────────────────────────
function cloudView(box: HTMLElement, freq: WordCount[]): void {
  const max = freq[0]!.count;
  box.className = "vizbox";
  box.innerHTML =
    `<div class="panel cloud">` +
    freq
      .slice(0, 120)
      .map((w) => {
        const t = w.count / max;
        return `<span class="w" style="font-size:${(0.85 + Math.sqrt(t) * 2.7).toFixed(2)}rem;color:${ramp(t)}" title="${esc(w.word)} · ${w.count}">${esc(w.word)}</span>`;
      })
      .join(" ") +
    `</div>`;
}

// ── Bars: ranked horizontal bars ─────────────────────────────────────────────
function barsView(box: HTMLElement, freq: WordCount[]): void {
  const max = freq[0]!.count;
  box.className = "vizbox";
  box.innerHTML =
    `<div class="panel barchart"><div class="lbl">Top terms</div>` +
    freq
      .slice(0, 30)
      .map((w) => {
        const pct = (w.count / max) * 100;
        return `<div class="bar"><span class="bw">${esc(w.word)}</span><span class="bt"><i style="width:${pct.toFixed(1)}%;background:${ramp(w.count / max)}"></i></span><span class="bc">${w.count}</span></div>`;
      })
      .join("") +
    `</div>`;
}

// shared: make a crisp, sized canvas inside the box
function makeCanvas(box: HTMLElement, height: number): { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number; dpr: number } {
  box.className = "vizbox";
  box.innerHTML = `<div class="panel canvaswrap"></div>`;
  const wrap = box.querySelector<HTMLElement>(".canvaswrap")!;
  const cv = document.createElement("canvas");
  wrap.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = wrap.clientWidth || 800;
  const h = height;
  cv.style.width = "100%";
  cv.style.height = `${h}px`;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return { cv, ctx, w, h, dpr };
}

// ── Nebula: words as drifting, glowing nodes (frequency = size + brightness) ──
function nebulaView(box: HTMLElement, freq: WordCount[]): void {
  const { ctx, w, h } = makeCanvas(box, 560);
  const max = freq[0]!.count;
  const N = Math.min(80, freq.length);
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  const cx = w / 2;
  const cy = h / 2;
  const spread = Math.min(w, h) * 0.46;
  const nodes = freq.slice(0, N).map((wd, i) => {
    const t = wd.count / max;
    const rr = Math.sqrt(i / N) * spread; // high-frequency words sit near the centre
    const a = i * GOLD;
    return { word: wd.word, t, count: wd.count, bx: Math.cos(a) * rr, by: Math.sin(a) * rr * 0.62, ph: i * 1.7, _x: 0, _y: 0 };
  });
  let raf = 0;
  let t0 = 0;
  const frame = (now: number): void => {
    if (!t0) t0 = now;
    const time = (now - t0) / 1000;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#05060c";
    ctx.fillRect(0, 0, w, h);
    const rot = time * 0.04;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    // glow pass (additive)
    ctx.globalCompositeOperation = "lighter";
    for (const n of nodes) {
      const wob = 8 + 6 * n.t;
      const dx = n.bx + Math.cos(time * 0.5 + n.ph) * wob;
      const dy = n.by + Math.sin(time * 0.4 + n.ph * 1.3) * wob;
      const x = cx + dx * cos - dy * sin;
      const y = cy + dx * sin + dy * cos;
      n._x = x;
      n._y = y;
      const rad = (8 + Math.sqrt(n.t) * 46) * (0.9 + 0.1 * Math.sin(time + n.ph));
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rampA(n.t, 0.55));
      g.addColorStop(1, rampA(n.t, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // label pass
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const n of nodes) {
      const fs = 11 + Math.sqrt(n.t) * 30;
      ctx.font = `600 ${fs.toFixed(1)}px system-ui, sans-serif`;
      ctx.fillStyle = `oklch(${(0.8 + 0.18 * n.t).toFixed(3)} ${(0.04 + 0.06 * n.t).toFixed(3)} 245 / ${(0.5 + 0.5 * n.t).toFixed(2)})`;
      ctx.fillText(n.word, n._x, n._y);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  stopAnim = () => cancelAnimationFrame(raf);
}

// ── Bubbles: circle-packed field, area ∝ frequency ───────────────────────────
function bubblesView(box: HTMLElement, freq: WordCount[]): void {
  const { ctx, w, h } = makeCanvas(box, 560);
  const max = freq[0]!.count;
  const N = Math.min(44, freq.length);
  const k = Math.min(w, h) * 0.085;
  const nodes = freq.slice(0, N).map((wd, i) => {
    const t = wd.count / max;
    const ang = i * 2.399;
    const rr = 6 + i * 3;
    return { word: wd.word, t, count: wd.count, r: 6 + Math.sqrt(t) * k, x: w / 2 + Math.cos(ang) * rr, y: h / 2 + Math.sin(ang) * rr };
  });
  // relax: pairwise separation + gentle gravity to centre
  for (let it = 0; it < 280; it++) {
    for (let i = 0; i < N; i++) {
      nodes[i]!.x += (w / 2 - nodes[i]!.x) * 0.01;
      nodes[i]!.y += (h / 2 - nodes[i]!.y) * 0.01;
    }
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = a.r + b.r + 2;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
  }
  // fit to canvas
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.r);
    minY = Math.min(minY, n.y - n.r);
    maxX = Math.max(maxX, n.x + n.r);
    maxY = Math.max(maxY, n.y + n.r);
  }
  const pad = 12;
  const sc = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY), 1.4);
  const ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
  const oy = (h - (maxY - minY) * sc) / 2 - minY * sc;

  ctx.fillStyle = "#05060c";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const n of nodes) {
    const x = n.x * sc + ox;
    const y = n.y * sc + oy;
    const r = n.r * sc;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rampA(n.t, 0.9);
    ctx.fill();
    if (r > 13) {
      const fs = Math.min(r * 0.55, 22);
      ctx.font = `600 ${fs.toFixed(1)}px system-ui, sans-serif`;
      ctx.fillStyle = n.t > 0.5 ? "rgba(6,8,14,0.92)" : "rgba(255,255,255,0.92)";
      ctx.fillText(n.word, x, y);
    }
  }
}
