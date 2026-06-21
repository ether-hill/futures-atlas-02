// OKLCH ⇄ sRGB (Björn Ottosson's oklab). Interpolation happens in OKLab so
// ramps are perceptually even. Dependency-free.

export type Rgb = [number, number, number]; // 0..255

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const toGamma = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export interface Oklab {
  L: number;
  a: number;
  b: number;
}

export function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
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

const D2R = Math.PI / 180;

export function oklchToOklab(L: number, C: number, h: number): Oklab {
  return { L, a: C * Math.cos(h * D2R), b: C * Math.sin(h * D2R) };
}

export function oklabToRgb(L: number, a: number, b: number): Rgb {
  const lin = oklabToLinear(L, a, b);
  return [
    Math.round(clamp01(toGamma(clamp01(lin[0]))) * 255),
    Math.round(clamp01(toGamma(clamp01(lin[1]))) * 255),
    Math.round(clamp01(toGamma(clamp01(lin[2]))) * 255),
  ];
}

export function oklchToRgb(L: number, C: number, h: number): Rgb {
  const lab = oklchToOklab(L, C, h);
  return oklabToRgb(lab.L, lab.a, lab.b);
}

export const rgbToCss = ([r, g, b]: Rgb): string => `rgb(${r},${g},${b})`;

const unGamma = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

export function hexToRgb(hex: string): Rgb {
  const s = hex.replace("#", "").trim();
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}

/** sRGB hex → OKLab (Ottosson forward transform). */
export function hexToOklab(hex: string): Oklab {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = unGamma(r8 / 255);
  const g = unGamma(g8 / 255);
  const b = unGamma(b8 / 255);
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

/** sRGB hex → OKLCH control point (for building palette stops). */
export function hexToOklch(hex: string): { L: number; C: number; h: number } {
  const { L, a, b } = hexToOklab(hex);
  return { L, C: Math.hypot(a, b), h: Math.atan2(b, a) / D2R };
}
