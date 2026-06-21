// The two universal knobs. complexity = detail / count / octaves; chaos =
// turbulence / divergence / randomness. Both 0..1; every piece maps them onto
// its own ranges via these helpers so the whole gallery speaks one language.

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** map t∈[0,1] onto [a,b] */
export const range = (t: number, a: number, b: number): number => lerp(a, b, clamp01(t));

/** map t∈[0,1] onto an integer count [a,b] */
export const count = (t: number, a: number, b: number): number => Math.round(range(t, a, b));

/** exponential map for things that feel right on a log scale (e.g. counts) */
export const expRange = (t: number, a: number, b: number): number =>
  a * Math.pow(b / a, clamp01(t));
