/**
 * Still thumbnails for the moving posts on /mocks/instagram.
 *
 * A grid of live embeds is a grid of running WebGL contexts, and it is not what
 * Instagram does either: a video sits still until you open it. So each reel post
 * gets one still, grabbed from its OWN embed after `thumbAt` seconds — the
 * moment is chosen per piece, because these are not all interesting at t=0 (the
 * accumulating one has no stripes yet, and the cat state has no fringes except
 * at the crossing).
 *
 * Run against a dev server that is already up:
 *   node scripts/capture-instagram-thumbs.mjs http://localhost:3421
 *
 * Writes public/mocks/instagram/<id>.jpg. Re-run when a piece or its colour
 * changes; the captions and the tiles both assume these exist.
 *
 * Needs Playwright driving REAL Chrome — plain headless Chrome falls back to
 * software WebGL, which renders these far softer and darker than a GPU does.
 * Playwright is not a dependency of this repo (it would pull a browser download
 * into every install for one script), so it is resolved from wherever it is
 * already installed; pass PLAYWRIGHT_PATH to point at another copy.
 */

import { mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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
const OUT = join(ROOT, "public/mocks/instagram");
const BASE = process.argv[2] || "http://localhost:3000";
const PASSWORD = process.env.MOCK_PASSWORD || "";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
// 9:16 at phone width. Two reasons: it is the ratio the feed defaults to, so a
// still is not cover-cropped on the sides to fit; and a phone viewport makes the
// wide app layouts (Actually Hard Questions especially) reflow to one column
// rather than being a desktop page squeezed into a portrait frame.
const ctx = await browser.newContext({
  viewport: { width: 432, height: 768 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

// Sign in first: the reel list and /mocks/termfield are both behind the gate.
// The sub-app embeds under /interference and /generatives are public.
await page.goto(`${BASE}/mocks/instagram`, { waitUntil: "domcontentloaded" });
if (await page.locator("input[type=password]").count()) {
  if (!PASSWORD) {
    console.error("Set MOCK_PASSWORD (an editor password) — /mocks is gated.");
    process.exit(1);
  }
  await page.fill("input[type=password]", PASSWORD);
  await page.press("input[type=password]", "Enter");
  await page.waitForLoadState("networkidle");
}

// The list comes from the page's own module, never a copy kept here.
const REEL_POSTS = await page.evaluate(async (base) => {
  const r = await fetch(`${base}/mocks/instagram/reels.json`);
  return r.json();
}, BASE);

for (const post of REEL_POSTS) {
  const url = `${BASE}${post.embed}`;
  // about:blank FIRST, always. The Generatives embeds differ from each other
  // only in the URL hash, and navigating between two such URLs is a
  // same-document navigation: the page never re-runs, so every piece after the
  // first silently captured the first piece still on screen.
  await page.goto("about:blank");
  await page.goto(url, { waitUntil: "networkidle" });
  // App chrome — screen switchers, session doors, join and reference lines —
  // means nothing outside the app and reads as clutter in a feed.
  if (post.hide) {
    await page.addStyleTag({ content: `${post.hide} { display: none !important; }` });
  }
  // Some chrome has no stable class to aim at — the back link and the
  // "REPORT · PUBLISHED …" line are utility-class soup. Match on their text.
  if (post.css) await page.addStyleTag({ content: post.css }).catch(() => {});
  if (post.hideText?.length) {
    await page.evaluate((needles) => {
      for (const el of document.querySelectorAll("a,p,span,div,nav,button")) {
        const t = (el.textContent || "").trim().toUpperCase();
        if (t.length < 80 && needles.some((n) => t.includes(n))) {
          (el).style.setProperty("display", "none", "important");
        }
      }
    }, post.hideText.map((n) => n.toUpperCase()));
  }
  if (post.scrollToText) {
    const node = page.getByText(post.scrollToText, { exact: false }).first();
    await node.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
    await page.evaluate(() => window.scrollBy(0, -60));
    await page.waitForTimeout(700);
  }
  if (post.scrollTo) {
    await page.evaluate((n) => window.scrollBy(0, window.innerHeight * n), post.scrollTo);
  }
  await page.waitForTimeout(post.thumbAt * 1000);
  const file = join(OUT, `${post.id}.jpg`);

  if (post.el) {
    // A finding card is its own object; screenshot the element and pad it out to
    // the post ratio, rather than framing a viewport around it and hoping. Its
    // figures count up when it scrolls into view, so it has to be seen first.
    const node = page.locator(post.el).nth(post.elIndex ?? 0);
    await node.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2600);
    const raw = `${file}.el.png`;
    await node.screenshot({ path: raw });
    const m = await sharp(raw).metadata();
    const target = Math.round(m.width * 16 / 9);
    const pad = Math.max(0, target - m.height);
    const bg = await sharp(raw).extract({ left: 2, top: 2, width: 1, height: 1 })
      .raw().toBuffer();
    await sharp(raw)
      .extend({
        top: Math.floor(pad / 2), bottom: Math.ceil(pad / 2),
        background: { r: bg[0], g: bg[1], b: bg[2] },
      })
      .jpeg({ quality: 88 }).toFile(file);
    rmSync(raw, { force: true });
  } else {
    await page.screenshot({ path: file, type: "jpeg", quality: 82 });
  }
  console.log(`✓ ${post.id}.jpg  (${post.thumbAt}s)`);
}

await browser.close();
console.log(`\nWrote ${REEL_POSTS.length} thumbnails to public/mocks/instagram/`);
