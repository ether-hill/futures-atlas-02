/**
 * Films the term field (/mocks/termfield) as a seamless loop: exactly one full
 * turn of the sphere, rendered frame by frame.
 *
 *   node scripts/record-term-loop.mjs [seconds-per-turn] [base]
 *
 * Writes public/mocks/instagram/term-field.{mp4,webm,jpg} at 1080x1920, 30fps.
 *
 * Not filmed in real time. The page is opened with ?film, which stops the
 * field's own clock and exposes window.__tfTurn(radians); each frame turns it by
 * exactly 2π / frames and takes a screenshot. So the frames are evenly spaced
 * (real-time capture drops and doubles them, which reads as jiggle when you
 * scrub), and the last frame leads straight back into the first.
 *
 * THE JOIN. The angle comes back exactly after a turn, but the labels ease
 * apart where they would overlap, and that easing carries history: it never
 * settles into a cycle, so turn N+1 ends a few pixels from where turn N began.
 * So: one turn unfilmed to settle; a second unfilmed turn, keeping the nudges
 * of its last JOIN frames (those are what lead into the filmed turn's first
 * frame); then the filmed turn, whose last JOIN frames are eased onto those
 * kept nudges (window.__tfTurn's blend). Its last frame is then the frame that
 * precedes its first, and the loop has no seam.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
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

const SECONDS = Number(process.argv[2] || 18);
const BASE = process.argv[3] || "http://localhost:3000";
const FPS = 30;
const FRAMES = Math.round(SECONDS * FPS);
const STEP = (Math.PI * 2) / FRAMES;
const JOIN = 60; // frames, two seconds
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec-term");
const VIEW = { width: 432, height: 768 };

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
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`${BASE}/mocks/termfield?film`, { waitUntil: "domcontentloaded" });
if (await page.locator("input[type=password]").count()) {
  const pw = password();
  if (!pw) { console.error("No editor password: set MOCK_PASSWORD or EDITOR_USERS in .env.local."); process.exit(1); }
  await page.fill("input[type=password]", pw);
  await page.press("input[type=password]", "Enter");
  await page.waitForURL(/termfield/);
}
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}" });
await page.waitForFunction(() => typeof window.__tfTurn === "function", null, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

// Turn one settles the easing. Turn two keeps the nudges of its last JOIN
// frames. Frame i of a turn is drawn by the (i)th call, so the kept set lines
// up index for index with the filmed turn's last JOIN frames.
await page.evaluate(([n, step, join]) => {
  for (let i = 0; i < n; i++) window.__tfTurn(step);
  window.__tfKept = [];
  for (let i = 0; i < n; i++) {
    window.__tfTurn(step);
    if (i >= n - join) window.__tfKept.push(window.__tfNudge());
  }
}, [FRAMES, STEP, JOIN]);

// The filmed turn. The page currently shows the kept turn's last frame, so each
// frame is advanced first, then shot.
for (let i = 0; i < FRAMES; i++) {
  const k = i - (FRAMES - JOIN);
  await page.evaluate(([step, k, join]) => {
    if (k < 0) return window.__tfTurn(step);
    const u = (k + 1) / join;
    const t = u * u * (3 - 2 * u);         // smoothstep, 0 to 1 across the join
    const kept = window.__tfKept[k];
    window.__tfTurn(step, { x: kept.x, y: kept.y, t });
  }, [STEP, k, JOIN]);
  await page.screenshot({ path: join(TMP, `f${String(i).padStart(5, "0")}.png`) });
  if (i % 100 === 0) process.stdout.write(`${i}/${FRAMES} `);
}
await browser.close();

const src = ["-framerate", String(FPS), "-i", join(TMP, "f%05d.png")];
const mp4 = join(OUT, "term-field.mp4");
execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-an",
  "-c:v", "libx264", "-profile:v", "high", "-crf", "16", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-an",
  "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28", "-row-mt", "1", "-pix_fmt", "yuv420p",
  join(OUT, "term-field.webm")]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", join(TMP, "f00000.png"), "-q:v", "3", join(OUT, "term-field.jpg")]);
rmSync(TMP, { recursive: true, force: true });
console.log(`\n✓ term-field.mp4 + .webm + .jpg: one full turn in ${SECONDS}s, ${FRAMES} frames at ${FPS}fps`);
