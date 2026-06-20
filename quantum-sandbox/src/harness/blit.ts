// Shared Canvas2D render helper: colour a complex field through the domain-
// coloring spine and scale it to fill the surface. Systems simulate on a sim
// grid (gw×gh) smaller than the canvas; this blits it up crisply. Keeps every
// amplitude system rendering phase through the one shared utility.

import type { Canvas2DSurface } from "./GenerativeSystem";
import { deviceSize } from "./GenerativeSystem";
import type { ComplexField } from "../core/math/complex";
import { colorFieldRGBA, type DomainColorOptions } from "../core/color/domainColoring";

let scratch: HTMLCanvasElement | null = null;

/** Colour `field` (gw×gh) and draw it scaled to the full surface. */
export function blitField(
  surface: Canvas2DSurface,
  field: ComplexField,
  gw: number,
  gh: number,
  opts: Partial<DomainColorOptions> = {},
  maxMag?: number,
  smooth = false,
): void {
  const rgba = colorFieldRGBA(field, opts, maxMag);
  if (!scratch) scratch = document.createElement("canvas");
  scratch.width = gw;
  scratch.height = gh;
  const sctx = scratch.getContext("2d")!;
  const img = new ImageData(gw, gh);
  img.data.set(rgba);
  sctx.putImageData(img, 0, 0);

  const { w, h } = deviceSize(surface);
  const ctx = surface.ctx;
  ctx.imageSmoothingEnabled = smooth;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(scratch, 0, 0, gw, gh, 0, 0, w, h);
}

/** Paint the whole surface a flat colour (device pixels). */
export function clearSurface(surface: Canvas2DSurface, css = "#0b0d12"): void {
  const { w, h } = deviceSize(surface);
  surface.ctx.fillStyle = css;
  surface.ctx.fillRect(0, 0, w, h);
}
