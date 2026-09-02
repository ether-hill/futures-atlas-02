/**
 * Records the marquee stack reel at /mocks/stack-reel.
 *
 * NOTE: the Instagram post "The stack" no longer plays this. It plays the Stack
 * game with its chrome off — `node scripts/record-stack-game.mjs bare` — so
 * re-running this writes stack.webm / stack.jpg and changes nothing in the feed
 * mock. The marquee is kept because it is a different idea, not a worse cut.
 *
 * The sign-in happens in a SEPARATE context whose session is saved and handed to
 * the recording context. Playwright records a context from the moment it is
 * created, so authenticating inside the recorded one put the editor login screen
 * at the head of the video.
 *
 *   node scripts/record-stack.mjs http://localhost:3799
 *
 * Writes public/mocks/instagram/stack.webm and a stack.jpg poster.
 */

import { mkdirSync, existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PW = [
  process.env.PLAYWRIGHT_PATH,
  join(ROOT, "node_modules/playwright/index.mjs"),
  join(process.env.HOME || "", "Documents/atf-2026-app/node_modules/playwright/index.mjs"),
].filter(Boolean).find((p) => existsSync(p));
if (!PW) { console.error("Playwright not found; set PLAYWRIGHT_PATH."); process.exit(1); }
const { chromium } = await import(`file://${PW}`);

const BASE = process.argv[2] || "http://localhost:3799";
const PASSWORD = process.env.MOCK_PASSWORD || "";
const OUT = join(ROOT, "public/mocks/instagram");
const TMP = join(OUT, ".rec-stack");
const SIZE = { width: 430, height: 764 };   // 9:16
const SECONDS = 18;

mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

// 1. Sign in somewhere that is not being filmed.
const auth = await browser.newContext({ viewport: SIZE });
const authPage = await auth.newPage();
await authPage.goto(`${BASE}/mocks/stack-reel`, { waitUntil: "domcontentloaded" });
if (await authPage.locator("input[type=password]").count()) {
  if (!PASSWORD) {
    console.error("Set MOCK_PASSWORD (an editor password) — /mocks is gated.");
    process.exit(1);
  }
  await authPage.fill("input[type=password]", PASSWORD);
  await authPage.press("input[type=password]", "Enter");
  await authPage.waitForLoadState("networkidle");
}
const state = await auth.storageState();
await auth.close();

// 2. Film a context that is already through the door.
const ctx = await browser.newContext({
  viewport: SIZE,
  deviceScaleFactor: 2,
  storageState: state,
  recordVideo: { dir: TMP, size: SIZE },
});
const page = await ctx.newPage();
await page.goto(`${BASE}/mocks/stack-reel`, { waitUntil: "networkidle" });
// Next's dev indicator is not part of the design.
await page.addStyleTag({
  content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}",
}).catch(() => {});
await page.waitForTimeout(SECONDS * 1000);
await page.screenshot({ path: join(OUT, "stack.jpg"), type: "jpeg", quality: 90 });
await ctx.close();                         // the video is only written on close

const file = readdirSync(TMP).find((f) => f.endsWith(".webm"));
if (file) renameSync(join(TMP, file), join(OUT, "stack.webm"));
rmSync(TMP, { recursive: true, force: true });
await browser.close();
console.log(`✓ stack.webm (${SECONDS}s) + stack.jpg`);
