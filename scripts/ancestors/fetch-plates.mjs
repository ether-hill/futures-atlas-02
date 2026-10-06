#!/usr/bin/env node
/**
 * Ancestors: harvest the Source Library's own extracted illustrations for every
 * book on the shelf, so the page can show real plates rather than covers alone.
 *
 *   node scripts/ancestors/fetch-plates.mjs            # books not yet cached
 *   node scripts/ancestors/fetch-plates.mjs --all      # refetch everything
 *
 * Raw responses are cached in node_modules/.cache/ancestors-plates/ (one file
 * per book). The library rate limits, so calls are spaced and retried. Nothing
 * is written into the app here: build-plates.mjs reduces the cache to the data
 * file the page imports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = path.join(root, "node_modules/.cache/ancestors-plates");
fs.mkdirSync(cache, { recursive: true });

const shelf = fs.readFileSync(path.join(root, "src/data/library-shelf.ts"), "utf8");
const ids = [...shelf.matchAll(/^\s{4}id: "([0-9a-f]{24})",$/gm)].map((m) => m[1]);
const all = process.argv.includes("--all");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const id of ids) {
  const file = path.join(cache, `${id}.json`);
  if (!all && fs.existsSync(file)) continue;
  let done = false;
  for (let attempt = 0; attempt < 4 && !done; attempt++) {
    try {
      const res = await fetch(`https://sourcelibrary.org/api/gallery?bookId=${id}&limit=60`, {
        signal: AbortSignal.timeout(60_000),
      });
      const text = await res.text();
      const json = JSON.parse(text); // the rate-limit banner is plain text and throws here
      fs.writeFileSync(file, JSON.stringify(json));
      console.log(id, (json.items ?? []).length, "of", json.total ?? "?");
      done = true;
    } catch (err) {
      console.log(id, "retry", attempt + 1, String(err).slice(0, 80));
      await sleep(9000 * (attempt + 1));
    }
  }
  if (!done) console.log(id, "FAILED");
  await sleep(3500);
}
console.log("books on shelf:", ids.length);
