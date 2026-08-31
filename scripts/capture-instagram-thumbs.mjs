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

import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
// 4:5 at half the export size: sharp enough for a grid tile, small on disk.
const ctx = await browser.newContext({
  viewport: { width: 540, height: 675 },
  deviceScaleFactor: 2,
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
  await page.waitForTimeout(post.thumbAt * 1000);
  const file = join(OUT, `${post.id}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 82 });
  console.log(`✓ ${post.id}.jpg  (${post.thumbAt}s)`);
}

await browser.close();
console.log(`\nWrote ${REEL_POSTS.length} thumbnails to public/mocks/instagram/`);
