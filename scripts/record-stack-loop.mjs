/**
 * Records ONE LAP of the Stack game (/mocks/stack-games/tetris?bare) as a
 * seamless loop, for the Instagram feed.
 *
 *   node scripts/record-stack-loop.mjs [base]
 *
 * Writes public/mocks/instagram/stack-bare.{mp4,webm,jpg}.
 *
 * The game plays a lap that ends on exactly the board it started with (see
 * LAP in Tetris.tsx) and stamps window.__stackLap with the time each lap
 * begins, during a still hold. The clip runs from the middle of one of those
 * holds to the middle of the next, so its last frame and its first frame are
 * the same picture and the reel loops with no visible seam.
 *
 * Filmed through Chrome's screencast rather than Playwright's recordVideo,
 * because the cut has to land on wall-clock times the page reports, and the
 * screencast stamps every frame with one.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec-loop");
const SIZE = { width: 1080, height: 1920 };
/** Where in the 900ms hold at the top of a lap the cut lands. */
const INTO_HOLD = 0.45;

function password() {
  if (process.env.MOCK_PASSWORD) return process.env.MOCK_PASSWORD;
  try {
    const line = readFileSync(join(ROOT, ".env.local"), "utf8")
      .split("\n").find((l) => l.startsWith("EDITOR_USERS="));
    if (!line) return "";
    return line.slice("EDITOR_USERS=".length).replace(/^["']|["']$/g, "").split(",")[0].split(":")[1] || "";
  } catch { return ""; }
}

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

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

const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1, storageState: state });
await ctx.addInitScript(() => {
  const css = "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}";
  const add = () => { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); };
  if (document.documentElement) add(); else document.addEventListener("DOMContentLoaded", add);
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ data: f.data, ts: f.metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await page.goto(`${BASE}/mocks/stack-games/tetris?bare`, { waitUntil: "domcontentloaded" });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: SIZE.width, maxHeight: SIZE.height, everyNthFrame: 1 });

const laps = () => page.evaluate(() => window.__stackLap ?? []);
await page.waitForFunction(() => (window.__stackLap ?? []).length >= 1, null, { timeout: 30000 });
// Film lap one through to the top of lap two.
await page.waitForFunction(() => (window.__stackLap ?? []).length >= 2, null, { timeout: 120000, polling: 100 });
await page.waitForTimeout(700);
await cdp.send("Page.stopScreencast");
const [m1, m2] = await laps();

// Poster: lap two replays lap one exactly, so sample it for the fullest board.
const poster = join(OUT, "stack-bare.jpg");
let best = -1;
const until = Date.now() + (m2 - m1) * 0.95;
while (Date.now() < until) {
  const n = await page.evaluate(() => document.querySelectorAll(".sg-brick").length);
  if (n > best) { best = n; await page.screenshot({ path: poster, type: "jpeg", quality: 90 }); }
  await page.waitForTimeout(300);
}
await browser.close();

const A = m1 / 1000 + 0.9 * INTO_HOLD;
const B = m2 / 1000 + 0.9 * INTO_HOLD;
const i0 = frames.findLastIndex((f) => f.ts <= A);
if (i0 < 0) { console.error("! screencast started after the cut point"); process.exit(1); }
const kept = [{ ...frames[i0], ts: A }, ...frames.filter((f) => f.ts > A && f.ts < B)];
let list = "";
kept.forEach((f, i) => {
  const name = `f${String(i).padStart(5, "0")}.jpg`;
  writeFileSync(join(TMP, name), Buffer.from(f.data, "base64"));
  const next = kept[i + 1]?.ts ?? B;
  list += `file '${name}'\nduration ${Math.max(0.001, next - f.ts).toFixed(4)}\n`;
});
list += `file 'f${String(kept.length - 1).padStart(5, "0")}.jpg'\n`;
writeFileSync(join(TMP, "list.txt"), list);
const src = ["-f", "concat", "-safe", "0", "-i", join(TMP, "list.txt")];
const vf = `scale=${SIZE.width}:${SIZE.height},fps=30`;

execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-vf", vf, "-an",
  "-c:v", "libx264", "-profile:v", "high", "-crf", "20", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(OUT, "stack-bare.mp4")]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-vf", vf, "-an",
  "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1", join(OUT, "stack-bare.webm")]);
rmSync(TMP, { recursive: true, force: true });
console.log(`✓ stack-bare.mp4 + .webm + .jpg: one lap, ${(B - A).toFixed(2)}s, ${kept.length} frames`);
