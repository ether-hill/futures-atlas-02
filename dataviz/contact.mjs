// Contact sheet of a piece's PNGs for quick review: node contact.mjs <slug> [filter]
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(join(root, "../package.json"))("sharp");
const [slug, filter = ""] = process.argv.slice(2);
const dir = join(root, "output", slug, "png");
const files = (await readdir(dir)).filter((f) => f.endsWith(".png") && f.includes(filter)).sort();
const H = 900, gap = 20;
const tiles = await Promise.all(files.map(async (f) => {
  const buf = await sharp(join(dir, f)).resize({ height: H }).png().toBuffer();
  return { buf, w: (await sharp(buf).metadata()).width };
}));
const W = tiles.reduce((a, t) => a + t.w + gap, gap);
let x = gap;
const out = join(root, "output", slug, `contact${filter ? "-" + filter : ""}.png`);
await sharp({ create: { width: W, height: H + 2 * gap, channels: 3, background: "#888" } })
  .composite(tiles.map((t) => { const c = { input: t.buf, left: x, top: gap }; x += t.w + gap; return c; }))
  .png().toFile(out);
console.log(out);
