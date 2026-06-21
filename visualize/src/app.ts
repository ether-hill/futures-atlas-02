// Visualize — example #1: "Loading and Displaying Data" (after Form+Code). Pick a
// book from the Source Library, pull its text over the API, and draw its word
// frequency as a typographic cloud + a ranked bar chart. Every view links back to
// the source book on sourcelibrary.org.

import { library, getBook, getText, type LibraryItem } from "./api";
import { wordFrequency, totalWords, type WordCount } from "./wordfreq";

const SCAFFOLD = `
<div class="wrap">
  <header class="head">
    <h1 class="title">Visualize</h1>
    <p class="intro">Data visualisations built live from the <a href="https://sourcelibrary.org" target="_blank" rel="noopener">Source Library</a> — the open-access archive of digitised, translated books. This first example loads a book over the API and displays its word frequency, after Form+Code's <em>Loading and Displaying Data</em>. Every view links back to its source.</p>
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
    <div class="lbl">About this example</div>
    <p>Word frequency is the "hello world" of data visualisation. The size and colour of each word encode how often it appears across the analysed pages (common stopwords removed). The source text — OCR and first-pass translation — comes straight from the Source Library API; switch books, text source, or page range above. Built for the Futures Atlas.</p>
  </section>
</div>`;

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// blue ramp (brand) by 0..1 → oklch
const ramp = (t: number): string => `oklch(${(0.55 + 0.4 * t).toFixed(3)} ${(0.08 + 0.1 * t).toFixed(3)} 245)`;

export async function boot(root: HTMLElement): Promise<void> {
  root.innerHTML = SCAFFOLD;
  const selBook = root.querySelector<HTMLSelectElement>(".sel-book")!;
  const selContent = root.querySelector<HTMLSelectElement>(".sel-content")!;
  const pages = root.querySelector<HTMLInputElement>(".sel-pages")!;
  const pagesVal = root.querySelector<HTMLElement>(".pages-val")!;
  const stage = root.querySelector<HTMLElement>(".stage")!;

  pages.addEventListener("input", () => (pagesVal.textContent = pages.value));

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
  selBook.innerHTML = items
    .map((b, i) => `<option value="${i}">${esc(b.title)} — ${esc(b.author)}</option>`)
    .join("");

  let token = 0;
  const load = async (): Promise<void> => {
    const item = items[Number(selBook.value)] ?? items[0]!;
    const n = Number(pages.value);
    const content = selContent.value as "translation" | "ocr" | "both";
    const mine = ++token;
    stage.innerHTML = `<div class="msg">Reading <em>${esc(item.title)}</em>…</div>`;
    try {
      const [meta, raw] = await Promise.all([getBook(item.id), getText(item.id, { content, from: 1, to: n })]);
      if (mine !== token) return; // a newer request superseded this one
      const freq = wordFrequency(raw, 140);
      render(stage, meta, raw, freq, n);
    } catch {
      if (mine === token) stage.innerHTML = `<div class="msg err">Could not load that book's text. Try another, or fewer pages.</div>`;
    }
  };

  selBook.addEventListener("change", load);
  selContent.addEventListener("change", load);
  pages.addEventListener("change", load);
  await load();
}

function render(
  stage: HTMLElement,
  meta: Awaited<ReturnType<typeof getBook>>,
  raw: string,
  freq: WordCount[],
  pagesAnalysed: number,
): void {
  if (freq.length === 0) {
    stage.innerHTML = `<div class="msg">No legible words found in this range — try the OCR text source or more pages.</div>`;
    return;
  }
  const max = freq[0]!.count;
  const total = totalWords(raw);
  const cloud = freq
    .slice(0, 110)
    .map((w) => {
      const t = w.count / max;
      const size = (0.85 + Math.sqrt(t) * 2.6).toFixed(2);
      return `<span class="w" style="font-size:${size}rem;color:${ramp(t)}" title="${esc(w.word)} · ${w.count}">${esc(w.word)}</span>`;
    })
    .join(" ");
  const bars = freq
    .slice(0, 24)
    .map((w) => {
      const pct = (w.count / max) * 100;
      return `<div class="bar"><span class="bw">${esc(w.word)}</span><span class="bt"><i style="width:${pct.toFixed(1)}%;background:${ramp(w.count / max)}"></i></span><span class="bc">${w.count}</span></div>`;
    })
    .join("");

  stage.innerHTML = `
    <div class="bookhead">
      ${meta.thumbnail ? `<img class="cover" src="${esc(meta.thumbnail)}" alt="" loading="lazy">` : ""}
      <div class="bh-meta">
        <h2 class="bh-title">${esc(meta.title)}</h2>
        ${meta.originalTitle && meta.originalTitle !== meta.title ? `<div class="bh-orig">${esc(meta.originalTitle)}</div>` : ""}
        <div class="bh-facts">${[esc(meta.author), meta.year, meta.language].filter(Boolean).join(" · ")}</div>
        <div class="bh-facts dim">${total.toLocaleString()} words across ${pagesAnalysed} pages · ${freq.length} distinct terms shown</div>
        <a class="bh-link" href="${esc(meta.url)}" target="_blank" rel="noopener">Read on Source Library ↗</a>
      </div>
    </div>
    <div class="viz">
      <div class="panel cloud">${cloud}</div>
      <div class="panel barchart"><div class="lbl">Top terms</div>${bars}</div>
    </div>`;
}
