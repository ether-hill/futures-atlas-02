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
