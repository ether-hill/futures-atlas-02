/**
 * Bakes the nav mark's roll (atlas-nav.css, .fa-shell__mark.is-rolling) from
 * the logo bench at /logo-animator into public/fa-mark-roll.png.
 *
 * The bench exposes window.faBakeRoll(frames, size, fit): one whole turn of
 * its "Ring rolls" preset, eased in and out so the first and last cells are
 * the resting pose, drawn bare as white ink on a black stage. This script
 * signs in to a running dev server, calls it, calibrates `fit` so the mark
 * in cell 0 is the same size as the flat fa.svg at the same cell size, and
 * turns the luminance into alpha: only the ink is opaque, the core's interior
 * and the stage are transparent, and the fill is white so the CSS can paint
 * it with currentColor.
 *
 *   npm run dev            (port 3801 assumed below; pass another as argv[2])
 *   node scripts/bake-mark-roll.mjs
 *
 * If you change FRAMES, change mask-size (FRAMES × 100%) and steps(FRAMES − 1)
 * in atlas-nav.css to match. Needs playwright (a devDependency) and an editor
 * password in .env.local (EDITOR_USERS), because the bench is gated.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.argv[2] || "3801";
const FRAMES = 48;
const SIZE = 96;
const OUT = path.join(root, "public/fa-mark-roll.png");

const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const users = env.match(/^EDITOR_USERS=(.*)$/m)?.[1].replace(/^["']|["']$/g, "") ?? "";
const password = users.split(",")[0]?.split(":")[1];
if (!password) throw new Error("No editor password in .env.local (EDITOR_USERS)");

/** Bounding box of pixels above `thr` in a single-channel buffer. */
function bbox(data, w, h, thr = 128) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] > thr) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext()).newPage();
await page.goto(`http://localhost:${PORT}/admin/login?next=/logo-animator`);
await page.fill("input[type=password]", password);
await Promise.all([page.waitForNavigation(), page.keyboard.press("Enter")]);
await page.waitForFunction(() => typeof window.faBakeRoll === "function");

const bake = async (fit) => {
  const url = await page.evaluate(([f, s, fit]) => window.faBakeRoll(f, s, fit), [FRAMES, SIZE, fit]);
  return Buffer.from(url.split(",")[1], "base64");
};

// The flat mark at the cell size is the reference for how big the render is.
const flat = await sharp(path.join(root, "public/fa.svg"), { density: 600 })
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha().extractChannel(3).raw().toBuffer();
const ref = bbox(flat, SIZE, SIZE);

let fit = 0.9;
let strip;
for (let pass = 0; pass < 4; pass++) {
  strip = await bake(fit);
  const cell0 = await sharp(strip).extract({ left: 0, top: 0, width: SIZE, height: SIZE }).greyscale().raw().toBuffer();
  const b = bbox(cell0, SIZE, SIZE);
  console.log(`fit ${fit.toFixed(4)}: rest cell ${b.w}×${b.h}, flat mark ${ref.w}×${ref.h}`);
  const ratio = ref.w / b.w;
  if (Math.abs(ratio - 1) < 0.01) break;
  fit *= ratio;
}
await browser.close();

// Luminance → alpha, ink → white.
const w = SIZE * FRAMES;
const lum = await sharp(strip).greyscale().raw().toBuffer();
const rgba = Buffer.alloc(w * SIZE * 4);
for (let i = 0; i < w * SIZE; i++) {
  rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255;
  rgba[i * 4 + 3] = lum[i];
}
await sharp(rgba, { raw: { width: w, height: SIZE, channels: 4 } }).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`wrote ${path.relative(root, OUT)}: ${FRAMES} cells of ${SIZE}px, ${fs.statSync(OUT).size} bytes`);
