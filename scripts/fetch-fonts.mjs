#!/usr/bin/env node
/**
 * Pull every Google font this repo uses down to woff2, ONCE, into assets/fonts/.
 *
 * This is not a build step and must never become one — that is the whole point.
 * `next/font/google` fetches at build time, so every deploy depended on Google
 * answering while it ran, and `build-subapps.sh` fires a dozen-plus builds that
 * each hit it. One timeout took down a deploy on 13 Aug 2026 with a wall of
 * module-not-found errors that named a stylesheet nobody wrote.
 *
 * Run by hand when a family or weight changes:
 *     node scripts/fetch-fonts.mjs
 * then commit what lands in assets/fonts/. The layouts read those files through
 * next/font/local, which touches nothing but the disk.
 *
 * Only the `latin` subset is kept. Google's CSS serves one @font-face block per
 * subset with a unicode-range on each; we take the block whose comment says
 * latin, because pulling every subset would quadruple the bytes for glyphs no
 * page here sets.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = new URL("../assets/fonts/", import.meta.url);

// A modern desktop UA, or Google serves ttf instead of woff2.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** [filename stem, css2 family spec] — variable axes where the family has them. */
const FAMILIES = [
  ["archivo", "Archivo:wght@400..900"],
  ["bodoni-moda", "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900"],
  ["jetbrains-mono", "JetBrains+Mono:wght@100..800"],
  ["figtree", "Figtree:wght@300..900"],
  // Static families — Google has no variable cut, so each weight is a file.
  ["saira-condensed", "Saira+Condensed:wght@400;500;600;700"],
  ["ibm-plex-mono", "IBM+Plex+Mono:wght@300;400;500;600"],
  ["anton", "Anton"],
];

async function css(spec) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${spec} → HTTP ${r.status}`);
  return r.text();
}

/**
 * Split the stylesheet into blocks and keep only latin ones. Google prefixes
 * each block with a `/* latin *\/`-style comment, which is the only reliable
 * marker — the unicode-ranges themselves overlap between subsets.
 */
function latinFaces(sheet) {
  const out = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(sheet))) {
    if (m[1] !== "latin") continue;
    const body = m[2];
    const url = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    if (!url) continue;
    out.push({
      url,
      weight: /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? "400",
      style: /font-style:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? "normal",
    });
  }
  return out;
}

await mkdir(OUT, { recursive: true });
const manifest = [];

for (const [stem, spec] of FAMILIES) {
  const faces = latinFaces(await css(spec));
  if (!faces.length) throw new Error(`${spec}: no latin @font-face found`);
  let i = 0;
  for (const f of faces) {
    // One latin face per (weight, style). Static families give several.
    const suffix = faces.length === 1 ? "" : `-${f.style === "italic" ? "italic-" : ""}${String(i)}`;
    const name = `${stem}${suffix}.woff2`;
    const bin = await fetch(f.url, { headers: { "User-Agent": UA } });
    if (!bin.ok) throw new Error(`${name} → HTTP ${bin.status}`);
    await writeFile(new URL(name, OUT), Buffer.from(await bin.arrayBuffer()));
    manifest.push({ file: name, weight: f.weight, style: f.style });
    console.log(`  ✓ ${name}  weight ${f.weight}  ${f.style}`);
    i++;
  }
}

await writeFile(new URL("manifest.json", OUT), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${manifest.length} files in assets/fonts/ — commit them.`);
