// Export every slide of a piece to PNG @2x, plus the chart SVG.
//   node render.mjs <slug> [--theme dark]
// Reads output/<slug>/index.html, writes output/<slug>/png/ and output/<slug>/svg/.
// Uses the installed Google Chrome through Playwright (host repo's copy).

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { startServer } from "./serve.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, "../package.json"));
const { chromium } = require("playwright");

const slug = process.argv[2];
if (!slug) { console.error("usage: node render.mjs <slug> [--theme dark]"); process.exit(1); }
const theme = process.argv.includes("--theme") ? process.argv[process.argv.indexOf("--theme") + 1] : "light";
const variant = process.argv.includes("--variant") ? process.argv[process.argv.indexOf("--variant") + 1] : null;
const vq = variant ? `&v=${variant}` : "";
const SIZES = { ig: [1080, 1350], x: [1600, 900] };

const server = await startServer(0);
const base = `http://localhost:${server.address().port}/output/${slug}/`;
const browser = await chromium.launch({ channel: "chrome", headless: true });

// discover slides from the gallery page
const probe = await browser.newPage();
const errors = [];
probe.on("pageerror", (e) => errors.push(e.message));
await probe.goto(base + "?x=1" + (theme === "dark" ? "&theme=dark" : "") + vq);
await probe.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
const slides = await probe.$$eval(".frame", (els) => els.map((e) => ({ id: e.dataset.slide, format: e.dataset.format })));
await probe.close();
if (errors.length) { console.error(errors); process.exit(1); }

const outPng = join(root, "output", slug, "png");
const outSvg = join(root, "output", slug, "svg");
await mkdir(outPng, { recursive: true });
await mkdir(outSvg, { recursive: true });
const suffix = (theme === "dark" ? "-dark" : "") + (variant ? `-${variant}` : "");

for (const { id, format } of slides) {
  const [w, h] = SIZES[format];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => { console.error(`${format}/${id}:`, e.message); process.exitCode = 1; });
  await page.goto(`${base}?slide=${id}&format=${format}&theme=${theme}&capture=1${vq}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const name = `${format}-${id}${suffix}`;
  await page.locator(".frame").screenshot({ path: join(outPng, `${name}@2x.png`) });
  const svg = await page.evaluate(() => {
    const s = document.querySelector(".chart svg");
    if (!s) return null;
    // inline the computed styles the stylesheet would have supplied
    const clone = s.cloneNode(true);
    const src = s.querySelectorAll("*");
    clone.querySelectorAll("*").forEach((n, i) => {
      const cs = getComputedStyle(src[i]);
      for (const p of ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "font-size", "font-weight", "font-family", "paint-order", "stroke-linejoin"]) {
        const v = cs.getPropertyValue(p);
        if (v) n.style.setProperty(p, v);
      }
    });
    const r = s.getBoundingClientRect();
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", r.width);
    clone.setAttribute("height", r.height);
    return clone.outerHTML;
  });
  if (svg) await writeFile(join(outSvg, `${name}.svg`), svg);
  await page.close();
  console.log(`  ${name}`);
}

await browser.close();
server.close();
console.log(`rendered ${slides.length} frames -> output/${slug}/png`);
