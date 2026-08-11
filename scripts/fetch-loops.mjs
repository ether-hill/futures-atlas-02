#!/usr/bin/env node
/**
 * Hero loop post-processing — the second half of the Higgsfield pipeline in
 * magnifica/ASSETS.md. Generation itself happens through the Higgsfield MCP
 * tools (OAuth, no API key), which hand back result URLs; this script takes
 * those URLs and produces the committed artefacts.
 *
 *   node scripts/fetch-loops.mjs loops.json
 *
 * where loops.json is  { "<scene-id>": "https://…mp4", … }  — scene ids are the
 * keys of SCENES in magnifica/src/scenes.ts plus "home".
 *
 * Each clip is downloaded, stripped of audio and re-encoded to the size budget
 * in ASSETS.md (720p, H.264, CRF 28, faststart). ffmpeg comes from the
 * ffmpeg-static devDependency, so nothing is installed system-wide.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "magnifica/public/media/loops");
const TMP = join(ROOT, "node_modules/.cache/magnifica-loops");
const BUDGET_MB = 6; // ASSETS.md: keep each loop under ~6 MB

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: node scripts/fetch-loops.mjs <manifest.json>");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP, { recursive: true });

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
let failures = 0;

for (const [id, url] of Object.entries(manifest)) {
  const raw = join(TMP, `${id}.raw.mp4`);
  const out = join(OUT_DIR, `${id}.mp4`);
  try {
    process.stdout.write(`${id.padEnd(28)}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    const before = statSync(raw).size;

    execFileSync(
      ffmpeg,
      [
        "-y", "-loglevel", "error",
        "-i", raw,
        "-an",                                  // hero loops are silent; the sound board is the audio
        "-vf", "scale=1280:-2",
        "-c:v", "libx264", "-crf", "28", "-preset", "slow",
        "-pix_fmt", "yuv420p",                  // Safari will not decode yuv444
        "-movflags", "+faststart",
        out,
      ],
      { stdio: "pipe" },
    );

    const after = statSync(out).size;
    const warn = after > BUDGET_MB * 1024 * 1024 ? "  ⚠ over budget" : "";
    console.log(`${mb(before)} MB → ${mb(after)} MB${warn}`);
    rmSync(raw, { force: true });
  } catch (e) {
    failures++;
    console.log(`FAILED — ${e.message}`);
  }
}

console.log(failures ? `\n${failures} failed.` : "\nAll loops written.");
process.exit(failures ? 1 : 0);
