/**
 * Screen recordings of The Odds being played, on a phone, through to the result.
 *
 * One video per player: open the game, choose them, work the mechanic (hold to
 * roll, hold to spin, pick a card), wait for the verdict, hold on it. The whole
 * browser context IS the recording, so the session is kept to exactly the shot.
 *
 * The outcome is NOT forced. Dario's die and Elon's wheel land where they land,
 * which is the honest version of a game about odds — and it means re-running
 * this can produce a survival or an annihilation. Watch what it saved.
 *
 *   node scripts/record-odds.mjs http://localhost:3799
 *
 * Writes public/mocks/instagram/odds-<key>.webm plus a poster frame
 * odds-<key>-play.jpg, which is what the grid tile shows until the post opens.
 */

import { mkdirSync, existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require_ = createRequire(join(ROOT, "package.json"));
const sharp = require_("sharp");

const PW = [
  process.env.PLAYWRIGHT_PATH,
  join(ROOT, "node_modules/playwright/index.mjs"),
  join(process.env.HOME || "", "Documents/atf-2026-app/node_modules/playwright/index.mjs"),
].filter(Boolean).find((p) => existsSync(p));
if (!PW) { console.error("Playwright not found; set PLAYWRIGHT_PATH."); process.exit(1); }
const { chromium } = await import(`file://${PW}`);

const BASE = process.argv[2] || "http://localhost:3799";
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec");
mkdirSync(OUT, { recursive: true });

// /theodds/<slug> IS the player's own page. Recording from the roster and
// clicking through meant the first seconds of every video were the choose-player
// screen, which is not what the post is about.
const PLAYERS = [
  ["dario", "dario-amodei"],
  ["elon", "elon-musk"],
  ["max", "max-tegmark"],
];

// A REAL phone, 430x932. At 432x768 the game's top panel laid itself out for a
// short window — a wide portrait plate with dead space beside it, and the doom
// clip's repeated tubes reading as two of the same person. That is a viewport
// artefact, not the game: on a phone-shaped screen the panel is a single column.
// The post frame is 9:16, so the extra height is cropped by object-fit.
const SIZE = { width: 430, height: 932 };
const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const [key, slug] of PLAYERS) {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  const ctx = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: TMP, size: SIZE },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/theodds/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  // The Atlas shell and the outcome-forcing panel are not part of the game.
  // body padding-top matters as much as the bar itself: the nav reserves space
  // for a bar that is no longer there, and that reserved strip was the black
  // gap along the top of every recording.
  await page.addStyleTag({
    content: `.fa-shell,.fa-share,.fa-foot,.od-forcetest{display:none!important}
              body{padding-top:0!important}`,
  }).catch(() => {});
  await page.waitForTimeout(900);

  const roll = page.locator(".od-roll").first();
  if (await roll.count()) {
    const b = await roll.boundingBox();
    if (b) {
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1400);   // it is a hold, not a click
      await page.mouse.up();
    }
  } else {
    const faces = page.locator(".od-card-face");
    await page.waitForTimeout(1200);
    if (await faces.count()) await faces.nth(3).click({ force: true }).catch(() => {});
  }

  await page.locator(".od-result").first()
    .waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3800);       // hold on the verdict long enough to read it

  const verdict = await page.locator(".od-result").first().innerText().catch(() => "");
  // A poster for the grid: the last frame is the verdict, which is the point.
  await page.screenshot({ path: join(OUT, `odds-${key}-play.jpg`), type: "jpeg", quality: 88 });
  await ctx.close();                     // the video is only written on close

  const file = readdirSync(TMP).find((f) => f.endsWith(".webm"));
  if (file) renameSync(join(TMP, file), join(OUT, `odds-${key}.webm`));
  console.log(`✓ odds-${key}.webm  ${verdict.replace(/\s+/g, " ").slice(0, 48)}`);
}

rmSync(TMP, { recursive: true, force: true });
await browser.close();

// Poster frames get the same treatment as every other thumbnail.
for (const [key] of PLAYERS) {
  const f = join(OUT, `odds-${key}-play.jpg`);
  if (existsSync(f)) {
    const m = await sharp(f).metadata();
    console.log(`  poster odds-${key}-play.jpg ${m.width}x${m.height}`);
  }
}
