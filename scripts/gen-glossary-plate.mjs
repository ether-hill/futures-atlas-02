/**
 * The Glossary's card image: a plate BUILT for the card, not a screengrab.
 *
 * The screengrab it replaces had two problems the card could not fix. Its
 * bottom row was sliced through the middle of a card, because a page does not
 * end where a 3:2 frame does; and it showed a dozen terms, which understates a
 * glossary of three hundred.
 *
 * So the plate is composed. Seven columns by eleven rows, seventy-seven terms,
 * every row whole and the frame exactly 3:2 so the card plate crops nothing.
 * Terms are dealt round-robin across the six domains, so the spread reads as
 * the range of the thing rather than as one subject, and only terms short
 * enough to sit on one line at this cell width are eligible.
 *
 * Run: node scripts/gen-glossary-plate.mjs
 * Writes: public/projects/glossary.jpg
 *
 * Rendered in real Chrome rather than drawn with sharp, so the plate is set in
 * the site's own faces (Archivo + IBM Plex Mono, from Google Fonts) instead of
 * whatever librsvg happens to fall back to.
 */
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(join(ROOT, "package.json"))("sharp");

const PW_CANDIDATES = [
  process.env.PLAYWRIGHT_PATH,
  join(ROOT, "node_modules/playwright/index.mjs"),
  join(process.env.HOME || "", "Documents/atf-2026-app/node_modules/playwright/index.mjs"),
].filter(Boolean);
const pwPath = PW_CANDIDATES.find((p) => existsSync(p));
if (!pwPath) {
  console.error(
    "Playwright not found. Install it, or set PLAYWRIGHT_PATH to an existing\n" +
      "playwright/index.mjs. Looked in:\n  " + PW_CANDIDATES.join("\n  "),
  );
  process.exit(1);
}
const { chromium } = await import(`file://${pwPath}`);

const { GLOSSARY } = await import(join(ROOT, "src/data/glossary.ts"));

const W = 1500;
const H = 1000;
const COLS = 7;
const ROWS = 11;
/** Longer than this and the term wraps past two lines in a cell this size. */
const MAX_TERM = 17;

const DOMAINS = ["AI", "Quantum", "Compute", "Safety & policy", "Futures", "Society"];
/** "Safety & policy" is the only one too long for the label slot. */
const SHORT = { "Safety & policy": "Safety" };

const pools = new Map(
  DOMAINS.map((d) => [
    d,
    GLOSSARY.filter((e) => e.domain === d && e.term.length <= MAX_TERM).map((e) => e.term),
  ]),
);

const picked = [];
for (let i = 0; picked.length < COLS * ROWS && i < 4000; i++) {
  const domain = DOMAINS[i % DOMAINS.length];
  const term = pools.get(domain)[Math.floor(i / DOMAINS.length)];
  if (term) picked.push({ term, domain });
}
if (picked.length < COLS * ROWS) {
  console.error(`Only ${picked.length} eligible terms, need ${COLS * ROWS}.`);
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const cells = picked
  .map(
    (p) =>
      `<div class="c"><span class="t">${esc(p.term)}</span>` +
      `<span class="d">${esc(SHORT[p.domain] ?? p.domain)}</span></div>`,
  )
  .join("");

// Literal colours: this is an image being drawn, not a component being styled,
// the same documented exception the hero scrims take (see CLAUDE.md).
const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{background:#101114;font-family:Archivo,system-ui,sans-serif}
  .g{display:grid;grid-template-columns:repeat(${COLS},1fr);grid-template-rows:repeat(${ROWS},1fr);
     gap:1px;background:rgba(242,237,226,.11);width:${W}px;height:${H}px}
  .c{background:#17181b;padding:12px 14px;display:flex;flex-direction:column;
     justify-content:center;gap:6px;overflow:hidden}
  .t{color:#f2ede2;font-weight:700;font-size:15.5px;line-height:1.16;letter-spacing:-.01em;
     display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .d{color:#5aa6e8;font-family:"IBM Plex Mono",monospace;font-size:9px;letter-spacing:.14em;
     text-transform:uppercase}
</style>
<div class="g">${cells}</div>`;

const tmp = join(ROOT, ".glossary-plate.html");
writeFileSync(tmp, html);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (
  await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
).newPage();
await page.goto(`file://${tmp}`, { waitUntil: "networkidle" });
// The webfonts land after networkidle reports; without this the plate renders
// in the fallback face.
await page.waitForFunction(() => document.fonts.ready.then(() => true));
await page.waitForTimeout(600);
const shot = await page.screenshot();
await browser.close();
unlinkSync(tmp);

const out = join(ROOT, "public/projects/glossary.jpg");
const buf = await sharp(shot).resize({ width: W }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
writeFileSync(out, buf);
console.log(
  `→ glossary plate: ${picked.length} of ${GLOSSARY.length} terms, ${COLS}×${ROWS}, ` +
    `${W}×${H}, ${(buf.length / 1024).toFixed(0)}KB`,
);
