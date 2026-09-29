/**
 * Records the homepage hero on a phone for the Instagram feed (HOME_REEL).
 *
 *   node scripts/record-home.mjs [base] [seconds]
 *   node scripts/record-home.mjs http://localhost:3000 9
 *
 * Writes public/mocks/instagram/atlas-home.{webm,mp4,jpg}.
 *
 * ONLY THE FIELD MOVES. The headline, the line under it and the button are on
 * screen from the first frame to the last. The hero's text normally rises in
 * with the site's Reveal animation, and a reel loops, so every loop replayed
 * the page loading. Two things stop that:
 *  · a style injected before the page's own CSS runs forces [data-reveal]
 *    visible with no animation (reduced motion would do it too, but it also
 *    stops the field, which is the only thing that should move);
 *  · the clip is trimmed to start once the field is drawing and to end before
 *    the field's 11-second reseed, so no load and no reseed is ever filmed.
 *
 * Filmed at a 432x768 phone viewport with deviceScaleFactor 2.5 through
 * Chrome's own screencast, which hands over device pixels: 1080x1920 frames
 * with the type rasterised at reel size. Playwright's recordVideo cannot do
 * this; it films CSS pixels, so a phone viewport comes out 432 wide.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
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
const SECONDS = Number(process.argv[3] || 9);
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec-home");
const VIEW = { width: 432, height: 768 };
const SIZE = { width: 1080, height: 1920 };
/** How long the field gets to draw itself before the clip starts. */
const SETTLE_MS = 1500;

const STILL = `
  [data-reveal], [data-reveal].is-in { opacity: 1 !important; animation: none !important; transform: none !important; }
  nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
`;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu"] });
const ctx = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: 2.5,
  isMobile: true,
  hasTouch: true,
});
await ctx.addInitScript((css) => {
  const add = () => {
    const s = document.createElement("style");
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  };
  if (document.documentElement) add();
  else document.addEventListener("DOMContentLoaded", add);
}, STILL);

const page = await ctx.newPage();
await page.goto(`${BASE}/`, { waitUntil: "load" });
// The field is an iframe whose src is set after hydration. Wait for it to load.
await page.waitForFunction(() => {
  const f = document.querySelector("[data-fa-hero] iframe");
  return f && f.getAttribute("src");
}, null, { timeout: 30000 });
await page.frameLocator("[data-fa-hero] iframe").locator("body").waitFor({ timeout: 30000 });
await page.waitForTimeout(SETTLE_MS);

// Film. The field's 11s reseed timer started when the iframe got its src, so
// SETTLE_MS + SECONDS has to stay under 11 or the reseed ends up in the clip.
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ data: f.data, ts: f.metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: SIZE.width, maxHeight: SIZE.height, everyNthFrame: 1 });
await page.waitForTimeout(SECONDS * 1000 + 300);
await cdp.send("Page.stopScreencast");
await browser.close();

if (frames.length < 10) { console.error(`! only ${frames.length} frames`); process.exit(1); }
// Each frame holds until the next one arrives; the concat list says for how long.
const first = frames[0].ts;
const kept = frames.filter((f) => f.ts - first <= SECONDS);
let list = "";
kept.forEach((f, i) => {
  const name = `f${String(i).padStart(5, "0")}.jpg`;
  writeFileSync(join(TMP, name), Buffer.from(f.data, "base64"));
  const next = kept[i + 1]?.ts ?? first + SECONDS;
  list += `file '${name}'\nduration ${Math.max(0.001, next - f.ts).toFixed(4)}\n`;
});
list += `file 'f${String(kept.length - 1).padStart(5, "0")}.jpg'\n`;
writeFileSync(join(TMP, "list.txt"), list);
const src = ["-f", "concat", "-safe", "0", "-i", join(TMP, "list.txt")];
const fit = `scale=${SIZE.width}:${SIZE.height}:force_original_aspect_ratio=increase,crop=${SIZE.width}:${SIZE.height},fps=30`;

const poster = join(OUT, "atlas-home.jpg");
const webm = join(OUT, "atlas-home.webm");
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", ...src, "-vf", fit,
  "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1", webm,
]);
const mp4 = join(OUT, "atlas-home.mp4");
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", ...src, "-vf", fit,
  "-an", "-c:v", "libx264", "-profile:v", "high", "-crf", "18", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4,
]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-ss", "2", "-i", mp4, "-frames:v", "1", "-q:v", "3", poster]);
rmSync(TMP, { recursive: true, force: true });
const fps = (kept.length / SECONDS).toFixed(1);
console.log(`✓ atlas-home.mp4 + .webm + .jpg (${SECONDS}s, 1080x1920, ${kept.length} frames captured, ~${fps}/s)`);
