#!/usr/bin/env node
/**
 * Rewrite every `next/font/google` import in the repo to `next/font/local`,
 * pointed at the woff2 files scripts/fetch-fonts.mjs put in assets/fonts/.
 *
 * A one-shot migration, kept because it documents exactly which weights each
 * app declared before the switch — the mapping below is the audit trail, and
 * re-running it after adding an app is cheaper than doing it by hand.
 */

import { readFile, writeFile } from "node:fs/promises";
import { relative, dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

// Variable families get one file and a weight RANGE; static families get one
// entry per weight. Both are what next/font/local expects.
const SRC = {
  Archivo: [["archivo.woff2", "400 900", "normal"]],
  Bodoni_Moda: [
    ["bodoni-moda-1.woff2", "400 900", "normal"],
    ["bodoni-moda-italic-0.woff2", "400 900", "italic"],
  ],
  JetBrains_Mono: [["jetbrains-mono.woff2", "100 800", "normal"]],
  Figtree: [["figtree.woff2", "300 900", "normal"]],
  Anton: [["anton.woff2", "400", "normal"]],
  Saira_Condensed: [
    ["saira-condensed-0.woff2", "400", "normal"],
    ["saira-condensed-1.woff2", "500", "normal"],
    ["saira-condensed-2.woff2", "600", "normal"],
    ["saira-condensed-3.woff2", "700", "normal"],
  ],
  IBM_Plex_Mono: [
    ["ibm-plex-mono-0.woff2", "300", "normal"],
    ["ibm-plex-mono-1.woff2", "400", "normal"],
    ["ibm-plex-mono-2.woff2", "500", "normal"],
    ["ibm-plex-mono-3.woff2", "600", "normal"],
  ],
};

const FILES = process.argv.slice(2);
if (!FILES.length) {
  console.error("usage: node scripts/localise-fonts.mjs <layout.tsx> [...]");
  process.exit(1);
}

for (const file of FILES) {
  let s = await readFile(file, "utf8");
  if (!s.includes("next/font/google")) {
    console.log(`  – ${file} (already local)`);
    continue;
  }

  // Where assets/fonts sits from this file.
  let rel = relative(dirname(join(ROOT, file)), join(ROOT, "assets/fonts"));
  if (!rel.startsWith(".")) rel = "./" + rel;

  // Which families this file imports, and under what const names.
  const imp = /import\s*\{([^}]+)\}\s*from\s*"next\/font\/google";?\n/.exec(s);
  if (!imp) throw new Error(`${file}: could not parse the font import`);
  const families = imp[1].split(",").map((x) => x.trim()).filter(Boolean);

  s = s.replace(imp[0], `import localFont from "next/font/local";\n`);

  for (const fam of families) {
    const faces = SRC[fam];
    if (!faces) throw new Error(`${file}: no local files mapped for ${fam}`);

    // Match `const x = Family({ ... });` across lines, single- or multi-line.
    const re = new RegExp(`const\\s+(\\w+)\\s*=\\s*${fam}\\(\\{([\\s\\S]*?)\\}\\);`);
    const m = re.exec(s);
    if (!m) throw new Error(`${file}: could not find the ${fam} declaration`);

    const varName = /variable:\s*"([^"]+)"/.exec(m[2])?.[1];
    const src = faces
      .map(
        ([f, w, st]) =>
          `    { path: "${rel}/${f}", weight: "${w}", style: "${st}" },`
      )
      .join("\n");

    s = s.replace(
      m[0],
      `const ${m[1]} = localFont({\n  src: [\n${src}\n  ],\n` +
        (varName ? `  variable: "${varName}",\n` : "") +
        `  display: "swap",\n});`
    );
  }

  await writeFile(file, s);
  console.log(`  ✓ ${file} → ${families.length} families, local`);
}
