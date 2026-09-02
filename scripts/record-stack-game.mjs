/**
 * Records one of the stack games at /mocks/stack-games/<game>.
 *
 *   node scripts/record-stack-game.mjs tetris
 *   node scripts/record-stack-game.mjs bare 24
 *   node scripts/record-stack-game.mjs all 24 http://localhost:3000
 *
 * Writes public/mocks/instagram/stack-<game>.mp4 (H.264, 1080x1920, silent,
 * faststart — what Instagram wants) plus a .jpg poster, taken from the fullest
 * board in the back half of the clip rather than from the last frame. The .webm Playwright produces is
 * kept alongside it.
 *
 * Filmed at 1080x1920 rather than at the 430x764 the stage is authored in:
 * the stage scales itself to the viewport with a CSS transform, so the marks
 * and the type are re-rasterised at the larger size instead of being blown up
 * afterwards. Upscaling a 430-wide recording to reel size looks exactly like
 * what it is.
 *
 * The sign-in happens in a SEPARATE context whose session is handed to the
 * recording context: Playwright records a context from the moment it is
 * created, so authenticating inside the filmed one puts the editor login
 * screen at the head of the video. The password comes from EDITOR_USERS in
 * .env.local unless MOCK_PASSWORD says otherwise.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PW = [
  process.env.PLAYWRIGHT_PATH,
  join(ROOT, "node_modules/playwright/index.mjs"),
  join(process.env.HOME || "", "Documents/atf-2026-app/node_modules/playwright/index.mjs"),
].filter(Boolean).find((p) => existsSync(p));
if (!PW) { console.error("Playwright not found; set PLAYWRIGHT_PATH."); process.exit(1); }
const { chromium } = await import(`file://${PW}`);

/**
 * Targets, and the page each one films. "stack-bare" is the Stack board with
 * every word taken off it — no title, no counter, no family key, no line naming
 * what cleared — which is the cut that goes out as a post: a reel carries its
 * words in the caption, and printing them onto the video as well says the same
 * sentence twice. It is not on the contact sheet, because it is an export of
 * the Stack game rather than a fifth game.
 */
const PAGES = {
  tetris: "tetris",
  cascade: "cascade",
  break: "break",
  merge: "merge",
  bare: "tetris?bare",
  "break-bare": "break?bare",
};
const GAMES = ["tetris", "cascade", "break", "merge"];
const arg = (process.argv[2] || "all").toLowerCase();
const list = arg === "all" ? GAMES : [arg];
if (list.some((g) => !PAGES[g])) {
  console.error(`Unknown target. One of: ${Object.keys(PAGES).join(", ")} — or "all" for the four games.`);
  process.exit(1);
}
const SECONDS = Number(process.argv[3] || 20);
const BASE = process.argv[4] || "http://localhost:3000";
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec-games");
const SIZE = { width: 1080, height: 1920 }; // 9:16, at reel resolution

/** First password in EDITOR_USERS ("laura:pw,mike:pw"). */
function password() {
  if (process.env.MOCK_PASSWORD) return process.env.MOCK_PASSWORD;
  try {
    const line = readFileSync(join(ROOT, ".env.local"), "utf8")
      .split("\n").find((l) => l.startsWith("EDITOR_USERS="));
    if (!line) return "";
    return line.slice("EDITOR_USERS=".length).replace(/^["']|["']$/g, "").split(",")[0].split(":")[1] || "";
  } catch { return ""; }
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

// 1. Sign in somewhere that is not being filmed.
const auth = await browser.newContext({ viewport: SIZE });
const authPage = await auth.newPage();
await authPage.goto(`${BASE}/mocks/stack-games`, { waitUntil: "domcontentloaded" });
if (await authPage.locator("input[type=password]").count()) {
  const pw = password();
  if (!pw) { console.error("No editor password: set MOCK_PASSWORD or EDITOR_USERS in .env.local."); process.exit(1); }
  await authPage.fill("input[type=password]", pw);
  await authPage.press("input[type=password]", "Enter");
  await authPage.waitForLoadState("networkidle");
}
const state = await auth.storageState();
await auth.close();

for (const game of list) {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const ctx = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 2,
    storageState: state,
    recordVideo: { dir: TMP, size: SIZE },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/mocks/stack-games/${PAGES[game]}`, { waitUntil: "networkidle" });
  // Next's dev indicator is not part of the design.
  await page.addStyleTag({
    content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}",
  }).catch(() => {});
  // The poster is the tile in the feed grid, and taking it on the last frame is
  // a lottery: a board that has just cleared three rows is a picture of an empty
  // well. So the back half of the clip is sampled and the fullest board wins.
  const half = Math.round(SECONDS * 1000 * 0.45);
  await page.waitForTimeout(half);
  const poster = join(OUT, `stack-${game}.jpg`);
  let best = -1;
  const until = Date.now() + (SECONDS * 1000 - half);
  while (Date.now() < until) {
    const bricks = await page.evaluate(() => document.querySelectorAll(".sg-brick").length);
    if (bricks > best) {
      best = bricks;
      await page.screenshot({ path: poster, type: "jpeg", quality: 90 });
    }
    await page.waitForTimeout(450);
  }
  await ctx.close();                       // the video is only written on close

  const file = readdirSync(TMP).find((f) => f.endsWith(".webm"));
  if (!file) { console.error(`! no video came out for ${game}`); continue; }
  const webm = join(OUT, `stack-${game}.webm`);
  renameSync(join(TMP, file), webm);
  rmSync(TMP, { recursive: true, force: true });

  // Instagram will not take the webm. H.264 High, even dimensions, no audio
  // track at all, moov atom at the front so it starts without buffering.
  const mp4 = join(OUT, `stack-${game}.mp4`);
  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error",
    "-i", webm,
    "-an",
    "-r", "30",
    "-c:v", "libx264", "-profile:v", "high", "-crf", "20", "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    mp4,
  ]);
  console.log(`✓ stack-${game}.mp4 (${SECONDS}s, 1080x1920) + .webm + .jpg`);
}

await browser.close();
