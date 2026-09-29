/**
 * Films any page at phone size for a reel, through Chrome's screencast.
 *
 *   node scripts/record-phone.mjs <path> <name> [seconds] [base]
 *   node scripts/record-phone.mjs /mocks/termfield term-field 12 http://localhost:3000
 *
 * Writes public/mocks/instagram/<name>.{mp4,webm,jpg} at 1080x1920.
 *
 * A 432x768 viewport at deviceScaleFactor 2.5, so the page lays out as a phone
 * and the screencast hands over 1080x1920 device pixels (Playwright's
 * recordVideo films CSS pixels and would come out 432 wide). Signs in first,
 * in a context that is not filmed, so gated /mocks pages work. Filming starts
 * SETTLE_MS after load, so nothing loading in ends up in the clip.
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

const [PATH, NAME] = process.argv.slice(2, 4);
if (!PATH || !NAME) { console.error("Usage: record-phone.mjs <path> <name> [seconds] [base]"); process.exit(1); }
const SECONDS = Number(process.argv[4] || 12);
const BASE = process.argv[5] || "http://localhost:3000";
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, `.rec-${NAME}`);
const VIEW = { width: 432, height: 768 };
const SIZE = { width: 1080, height: 1920 };
const SETTLE_MS = 2500;

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

const auth = await browser.newContext({ viewport: VIEW });
const authPage = await auth.newPage();
await authPage.goto(`${BASE}${PATH}`, { waitUntil: "domcontentloaded" });
if (await authPage.locator("input[type=password]").count()) {
  const pw = password();
  if (!pw) { console.error("No editor password: set MOCK_PASSWORD or EDITOR_USERS in .env.local."); process.exit(1); }
  await authPage.fill("input[type=password]", pw);
  await authPage.press("input[type=password]", "Enter");
  await authPage.waitForLoadState("networkidle");
}
const state = await auth.storageState();
await auth.close();

const ctx = await browser.newContext({
  viewport: VIEW, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, storageState: state,
});
await ctx.addInitScript(() => {
  const css = "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}";
  const add = () => { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); };
  if (document.documentElement) add(); else document.addEventListener("DOMContentLoaded", add);
});
const page = await ctx.newPage();
await page.goto(`${BASE}${PATH}`, { waitUntil: "load" });
if (await page.locator("input[type=password]").count()) { console.error("! still on the sign-in page"); process.exit(1); }
await page.waitForTimeout(SETTLE_MS);

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
const vf = `scale=${SIZE.width}:${SIZE.height}:force_original_aspect_ratio=increase,crop=${SIZE.width}:${SIZE.height},fps=30`;

const mp4 = join(OUT, `${NAME}.mp4`);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-vf", vf, "-an",
  "-c:v", "libx264", "-profile:v", "high", "-crf", "18", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...src, "-vf", vf, "-an",
  "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1", join(OUT, `${NAME}.webm`)]);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-ss", "2", "-i", mp4, "-frames:v", "1", "-q:v", "3", join(OUT, `${NAME}.jpg`)]);
rmSync(TMP, { recursive: true, force: true });
console.log(`✓ ${NAME}.mp4 + .webm + .jpg (${SECONDS}s, 1080x1920, ${kept.length} frames)`);
