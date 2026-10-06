// Grid of hook stills: rows = pieces, columns = variants. node variants-sheet.mjs [ig|x]
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(join(root, "../package.json"))("sharp");
const fmt = process.argv[2] ?? "ig";
const pieces = ["q-day", "qubits-vs-quality", "training-compute"], vs = ["field", "interf", "band", "ember"];
const W = fmt === "ig" ? 540 : 800, gap = 24;
const tiles = [];
for (const [r, p] of pieces.entries()) for (const [c, v] of vs.entries()) {
  const buf = await sharp(join(root, "output", p, "png", `${fmt}-hook-${v}@2x.png`)).resize({ width: W }).png().toBuffer();
  tiles.push({ buf, r, c, h: (await sharp(buf).metadata()).height });
}
const H = tiles[0].h;
const out = join(root, "output", `variants-${fmt}.png`);
await sharp({ create: { width: vs.length * (W + gap) + gap, height: pieces.length * (H + gap) + gap, channels: 3, background: "#777" } })
  .composite(tiles.map((t) => ({ input: t.buf, left: gap + t.c * (W + gap), top: gap + t.r * (H + gap) }))).png().toFile(out);
console.log(out);
