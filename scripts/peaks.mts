/**
 * Waveform peaks generator: mp3 → 240 normalised peaks (0–1) → <name>.peaks.json
 * next to the source file. Runs on Node's native type stripping (Node 23+):
 *
 *   npm run peaks -- public/audio-reel/scott.mp3 [more.mp3 …]
 *   npm run peaks            # no args: every audio file referenced by a voice
 *
 * Uses the repo's ffmpeg-static binary: decode to raw mono 16-bit PCM at 8kHz,
 * bucket into 240 windows, take the max |sample| per window, normalise to the
 * loudest window. Commit the output; the client never decodes audio.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const FFMPEG: string = require("ffmpeg-static");
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const BUCKETS = 240;

function peaksFor(mp3: string): void {
  const t0 = Date.now();
  const pcm = execFileSync(
    FFMPEG,
    ["-i", mp3, "-f", "s16le", "-ac", "1", "-ar", "8000", "-v", "error", "pipe:1"],
    { maxBuffer: 1 << 28 },
  );
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  const win = Math.max(1, Math.floor(samples.length / BUCKETS));
  const raw: number[] = [];
  for (let b = 0; b < BUCKETS; b++) {
    let max = 0;
    for (let i = b * win, end = Math.min(samples.length, (b + 1) * win); i < end; i++) {
      const v = Math.abs(samples[i]);
      if (v > max) max = v;
    }
    raw.push(max);
  }
  const top = Math.max(1, ...raw);
  const peaks = raw.map((v) => Number((v / top).toFixed(3)));
  const out = mp3.replace(/\.[a-z0-9]+$/i, ".peaks.json");
  writeFileSync(out, JSON.stringify(peaks));
  console.log(`✓ ${basename(out)} (${BUCKETS} peaks, ${Date.now() - t0}ms)`);
}

let files = process.argv.slice(2);
if (files.length === 0) {
  // every audio file referenced by a voice JSON
  const dir = join(ROOT, "src/content/voices");
  files = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")).audio as string)
    .filter(Boolean)
    .map((a) => join(ROOT, "public", a));
}
files.forEach((f) => peaksFor(resolve(f)));
