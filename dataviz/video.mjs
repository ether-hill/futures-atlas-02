// Export every animated slide of a piece to MP4 (H.264, 30fps, social-ready).
//   node video.mjs <slug> [slideId]
// Writes output/<slug>/video/<format>-<id>.mp4 at the post's native size
// (1080x1350 for Instagram, 1600x900 for X). Each frame is rendered by
// seeking the chart to an exact time, so the video is deterministic.

import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { startServer } from "./serve.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(root, "../package.json"));
const { chromium } = require("playwright");
const ffmpeg = require("ffmpeg-static");

const [slug, only] = process.argv.slice(2).filter((a, i, all) => a !== "--variant" && all[i - 1] !== "--variant");
const variant = process.argv.includes("--variant") ? process.argv[process.argv.indexOf("--variant") + 1] : null;
const vq = variant ? `&v=${variant}` : "";
if (!slug) { console.error("usage: node video.mjs <slug> [slideId]"); process.exit(1); }
const FPS = 30; // the page reports one full seamless loop as __duration (build + hold + rewind)
const SIZES = { ig: [1080, 1350], x: [1600, 900] };

const server = await startServer(0);
const base = `http://localhost:${server.address().port}/output/${slug}/`;
const browser = await chromium.launch({ channel: "chrome", headless: true });

const probe = await browser.newPage();
await probe.goto(base + "?x=1" + vq);
await probe.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
const slides = await probe.$$eval(".frame", (els) => els.map((e) => ({ id: e.dataset.slide, format: e.dataset.format })));
await probe.close();

const outDir = join(root, "output", slug, "video");
await mkdir(outDir, { recursive: true });

for (const { id, format } of slides) {
  if (only && id !== only) continue;
  const [w, h] = SIZES[format];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error(`${format}/${id}:`, e.message); process.exitCode = 1; });
  await page.goto(`${base}?slide=${id}&format=${format}&capture=1${vq}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const duration = await page.evaluate(() => window.__duration);
  if (!duration) { await page.close(); continue; }

  const file = join(outDir, `${format}-${id}${variant ? `-${variant}` : ""}.mp4`);
  const enc = spawn(ffmpeg, [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.round(duration * FPS); // frame N would equal frame 0, so stop one short
  const frame = page.locator(".frame");
  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    await page.evaluate((t) => window.__seek(t), t);
    const png = await frame.screenshot({ type: "png" });
    if (!enc.stdin.write(png)) await new Promise((r) => enc.stdin.once("drain", r));
  }
  enc.stdin.end();
  await new Promise((r) => enc.on("close", r));
  await page.close();
  console.log(`  ${format}-${id}  ${duration.toFixed(1)}s loop, ${frames} frames`);
}

await browser.close();
server.close();
