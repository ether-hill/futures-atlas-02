// Renders bumpers to out/, frame by frame, so the timing is exact whatever the
// machine. H.264, yuv420p, 1080x1920, 30fps.
//   node tools/bumpers/render.mjs [ringline coinflip ...] [--bg i:wavefronts] [--still] [--strength 0.45] [--cta "Read more at"]
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { startServer } from "./serve.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpeg = require("ffmpeg-static");

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function opt(name) { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; }
const cta = opt("--cta"), bg = opt("--bg") || "none", strength = opt("--strength");
const si = args.indexOf("--still"); const still = si >= 0; if (still) args.splice(si, 1);
const motions = args.length ? args : ["ringline", "coinflip", "edgeball", "blink", "iris"];
const outDir = join(here, "out");
await mkdir(outDir, { recursive: true });

const server = await startServer(0);
const port = server.address().port;
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

for (const m of motions) {
  const q = new URLSearchParams({ motion: m, render: "1", bg, still: still ? "1" : "0" });
  if (cta) q.set("cta", cta);
  if (strength) q.set("strength", strength);
  await page.goto(`http://127.0.0.1:${port}/tools/bumpers/?${q}`);
  await page.waitForFunction(() => window.BUMPER && window.BUMPER.ready);
  const { FPS, DUR } = await page.evaluate(() => ({ FPS: BUMPER.FPS, DUR: BUMPER.DUR }));
  const tag = [m, bg !== "none" && bg.replace(":", "-"), still && "still", cta && cta.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")].filter(Boolean).join("-");
  const file = join(outDir, `${tag}.mp4`);
  const enc = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", file],
    { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(FPS * DUR);
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate((k) => BUMPER.frame(k), i);
    if (!enc.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise((r) => enc.stdin.once("drain", r));
  }
  enc.stdin.end();
  await new Promise((r, j) => enc.on("close", (c) => (c ? j(new Error("ffmpeg " + c)) : r())));
  console.log("wrote", file);
}
await browser.close();
server.close();
