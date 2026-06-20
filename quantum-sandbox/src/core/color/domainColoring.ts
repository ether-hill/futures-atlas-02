// THE SPINE. Complex amplitude → colour, the one mapping every amplitude-bearing
// system renders through:
//   • hue       ← arg(z), laid on the OKLCH hue circle (perceptually even steps)
//   • lightness ← |z| via L = f(log(1 + k·|z|)), optionally banded (contour rings
//                  on magnitude isolevels)
//   • chroma    ← near-constant, reduced toward gamut (see oklch.ts)
//
// A system that shows only |ψ|² and throws phase away is a bug, not a style.
//
// These constants are SHARED with shaders/domainColor.frag — keep the two in
// lockstep so CPU (Canvas2D/p5) and GPU (WebGL2) renders match.

import type { ComplexField } from "../math/complex";
import { oklchToRgb255 } from "./oklch";

export interface DomainColorOptions {
  /** OKLCH chroma held ~constant across the field */
  chroma: number;
  /** min/max OKLCH lightness the magnitude ramp spans */
  lMin: number;
  lMax: number;
  /** gain k inside L = f(log(1 + k·|z|)) — controls magnitude contrast */
  lightGain: number;
  /** rotate the whole hue wheel (degrees), e.g. to align a phase reference */
  hueOffset: number;
  /** draw contour rings on magnitude isolevels */
  banded: boolean;
  /** number of magnitude bands across the ramp when `banded` */
  bands: number;
}

/** Defaults — these exact numbers are duplicated in domainColor.frag. */
export const DC_DEFAULTS: DomainColorOptions = {
  chroma: 0.13,
  lMin: 0.12,
  lMax: 0.97,
  lightGain: 6,
  hueOffset: 0,
  banded: false,
  bands: 7,
};

const TAU = Math.PI * 2;

/** Magnitude → lightness in [lMin, lMax], saturating via a log compressor. */
function magToLightness(mag: number, o: DomainColorOptions): number {
  const t = Math.log(1 + o.lightGain * mag);
  let s = t / (1 + t); // → [0,1)
  if (o.banded) {
    // darken thin rings at each isolevel boundary to read magnitude contours
    const f = s * o.bands;
    const edge = Math.abs(f - Math.round(f)); // 0 at a band boundary
    const ring = Math.min(1, edge / 0.06); // 0 on the line, 1 away from it
    s *= 0.55 + 0.45 * ring;
  }
  return o.lMin + (o.lMax - o.lMin) * s;
}

/** phase (radians, any range) → OKLCH hue in degrees */
function phaseToHue(arg: number, o: DomainColorOptions): number {
  let h = ((arg + Math.PI) / TAU) * 360 + o.hueOffset;
  h %= 360;
  if (h < 0) h += 360;
  return h;
}

/** Single complex sample → [r,g,b] 0..255. */
export function colorSample(re: number, im: number, opts: Partial<DomainColorOptions> = {}): [number, number, number] {
  const o = { ...DC_DEFAULTS, ...opts };
  const mag = Math.hypot(re, im);
  const arg = Math.atan2(im, re);
  return oklchToRgb255(magToLightness(mag, o), o.chroma, phaseToHue(arg, o));
}

// ── colour LUT ────────────────────────────────────────────────────────────────
// The gamut-safe OKLCH→sRGB conversion runs a per-sample chroma bisection, which
// is far too slow to do per pixel every frame. Since chroma is held constant, we
// precompute a [hue 0..359] × [lightness 0..255] → RGB table once per chroma and
// index it per pixel. Memoised so animation frames reuse the same table.
const HUE_BINS = 360;
const L_BINS = 256;
const lutCache = new Map<number, Uint8Array>();

function getLUT(chroma: number): Uint8Array {
  const key = Math.round(chroma * 1000);
  const cached = lutCache.get(key);
  if (cached) return cached;
  const lut = new Uint8Array(HUE_BINS * L_BINS * 3);
  for (let h = 0; h < HUE_BINS; h++) {
    for (let li = 0; li < L_BINS; li++) {
      const rgb = oklchToRgb255(li / (L_BINS - 1), chroma, h);
      const p = (h * L_BINS + li) * 3;
      lut[p] = rgb[0];
      lut[p + 1] = rgb[1];
      lut[p + 2] = rgb[2];
    }
  }
  if (lutCache.size > 24) lutCache.clear();
  lutCache.set(key, lut);
  return lut;
}

/**
 * Render a complex field to a fresh RGBA buffer (row-major, length 4·field).
 * `maxMag` (default: field max) normalises magnitude so the ramp uses its full
 * range; pass a fixed value to keep brightness stable across animation frames.
 * Uses the precomputed colour LUT — fast enough for per-frame GPU-less rendering.
 */
export function colorFieldRGBA(
  field: ComplexField,
  opts: Partial<DomainColorOptions> = {},
  maxMag?: number,
): Uint8ClampedArray {
  const o = { ...DC_DEFAULTS, ...opts };
  const { re, im, length } = field;
  const lut = getLUT(o.chroma);

  let norm = maxMag ?? 0;
  if (maxMag === undefined) {
    for (let k = 0; k < length; k++) {
      const m = re[k] * re[k] + im[k] * im[k];
      if (m > norm) norm = m;
    }
    norm = Math.sqrt(norm) || 1;
  }
  const inv = norm > 0 ? 1 / norm : 1;
  const lScale = L_BINS - 1;

  const out = new Uint8ClampedArray(length * 4);
  for (let k = 0; k < length; k++) {
    const r = re[k];
    const i = im[k];
    const L = magToLightness(Math.hypot(r, i) * inv, o);
    let li = (L * lScale + 0.5) | 0;
    if (li < 0) li = 0;
    else if (li >= L_BINS) li = L_BINS - 1;
    let hb = (phaseToHue(Math.atan2(i, r), o) | 0) % HUE_BINS;
    if (hb < 0) hb += HUE_BINS;
    const s = (hb * L_BINS + li) * 3;
    const p = k * 4;
    out[p] = lut[s];
    out[p + 1] = lut[s + 1];
    out[p + 2] = lut[s + 2];
    out[p + 3] = 255;
  }
  return out;
}
