// OKLCH ⇄ sRGB (Björn Ottosson's oklab). Dependency-free so the core stays
// liftable. Phase coloring lives in OKLCH because its hue circle is
// perceptually even — equal phase steps read as equal colour steps.

export type Rgb = [number, number, number]; // 0..255

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const toGamma = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

export interface Oklch {
  L: number;
  C: number;
  h: number; // degrees
}

export function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function linearSrgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

const D2R = Math.PI / 180;
const inGamut = (rgb: [number, number, number]): boolean =>
  rgb[0] >= -1e-4 && rgb[0] <= 1.0001 && rgb[1] >= -1e-4 && rgb[1] <= 1.0001 && rgb[2] >= -1e-4 && rgb[2] <= 1.0001;

/**
 * OKLCH → sRGB (0..255). Keeps hue fixed and reduces chroma toward gamut (a
 * short bisection) so phase colour stays true rather than clipping channels.
 * This matches `gamutChroma()` in domainColor.frag.
 */
export function oklchToRgb255(L: number, C: number, h: number): Rgb {
  const cosh = Math.cos(h * D2R);
  const sinh = Math.sin(h * D2R);
  let lo = 0;
  let hi = C;
  let lin = oklabToLinearSrgb(L, C * cosh, C * sinh);
  if (!inGamut(lin)) {
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      lin = oklabToLinearSrgb(L, mid * cosh, mid * sinh);
      if (inGamut(lin)) lo = mid;
      else hi = mid;
    }
    lin = oklabToLinearSrgb(L, lo * cosh, lo * sinh);
  }
  return [
    Math.round(clamp01(toGamma(clamp01(lin[0]))) * 255),
    Math.round(clamp01(toGamma(clamp01(lin[1]))) * 255),
    Math.round(clamp01(toGamma(clamp01(lin[2]))) * 255),
  ];
}

export const rgbToCss = ([r, g, b]: Rgb): string => `rgb(${r},${g},${b})`;
export const oklchToCss = (L: number, C: number, h: number): string => rgbToCss(oklchToRgb255(L, C, h));

export function hexToOklch(hex: string): Oklch {
  const s = hex.replace("#", "");
  const r = toLinear(parseInt(s.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(s.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(s.slice(4, 6), 16) / 255);
  const lab = linearSrgbToOklab(r, g, b);
  let h = Math.atan2(lab.b, lab.a) / D2R;
  if (h < 0) h += 360;
  return { L: lab.L, C: Math.hypot(lab.a, lab.b), h };
}
