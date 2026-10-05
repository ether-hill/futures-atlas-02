#!/usr/bin/env node
/**
 * Copy the Futures in Figures charts from dataviz/ into
 * public/futures-in-figures/charts/, so /futures-in-figures can show them live.
 *
 *   node scripts/sync-futures-in-figures.mjs
 *
 * The site page embeds each chart's own page in web mode
 * (charts/output/<slug>/index.html?slide=hook&format=web&v=field): the same
 * code and the same cleaned data that make the posts. Folder layout is kept,
 * because the chart pages load ../../templates and ../../data relatively.
 * Only what the charts load at runtime is copied, never raw sources.
 * Run it after changing a chart, then commit the result.
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "dataviz");
const OUT = join(ROOT, "public/futures-in-figures/charts");
const PIECES = ["q-day", "qubits-vs-quality", "training-compute"];
const DATA = {
  "q-day": ["clean.csv"],
  "qubits-vs-quality": ["clean.csv"],
  "training-compute": ["clean.csv", "clean-frontier.csv"],
};

rmSync(OUT, { recursive: true, force: true });
const copy = (rel) => {
  mkdirSync(dirname(join(OUT, rel)), { recursive: true });
  cpSync(join(SRC, rel), join(OUT, rel));
};
for (const f of ["frame.js", "frame.css", "site-art.js", "variants.js"]) copy(`templates/${f}`);
for (const f of ["d3.min.js", "fa.svg"]) copy(`vendor/${f}`);
copy("fonts/Archivo-VF.ttf"); // frame.css declares it; the site theme itself uses system sans
for (const p of PIECES) {
  copy(`output/${p}/index.html`);
  for (const f of DATA[p]) copy(`data/${p}/${f}`);
}
console.log(`→ ${PIECES.length} charts synced to public/futures-in-figures/charts/`);
