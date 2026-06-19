// Complex arithmetic on typed arrays, stored re/im split (struct-of-arrays) for
// cache-friendly field math. A ComplexField is the canonical amplitude carrier;
// the domain-coloring spine reads magnitude + phase straight off it.

export interface ComplexField {
  re: Float32Array;
  im: Float32Array;
  /** element count (re.length === im.length === length) */
  length: number;
}

export function makeComplexField(length: number): ComplexField {
  return { re: new Float32Array(length), im: new Float32Array(length), length };
}

/** Wrap existing arrays (must be equal length). */
export function asComplexField(re: Float32Array, im: Float32Array): ComplexField {
  if (re.length !== im.length) throw new Error("complex: re/im length mismatch");
  return { re, im, length: re.length };
}

// ── scalar complex ops (z = a + bi) ──────────────────────────────────────────
export const cMag = (re: number, im: number): number => Math.hypot(re, im);
export const cMag2 = (re: number, im: number): number => re * re + im * im;
export const cArg = (re: number, im: number): number => Math.atan2(im, re);

/** (a+bi)(c+di) → [re, im] */
export function cMul(ar: number, ai: number, br: number, bi: number): [number, number] {
  return [ar * br - ai * bi, ar * bi + ai * br];
}

/** e^{iθ} → [cosθ, sinθ] */
export function cExp(theta: number): [number, number] {
  return [Math.cos(theta), Math.sin(theta)];
}

// ── field-level ops ───────────────────────────────────────────────────────────

/** Multiply field in place by a per-element phase factor e^{iθ(k)}. */
export function applyPhase(f: ComplexField, theta: (k: number) => number): void {
  const { re, im, length } = f;
  for (let k = 0; k < length; k++) {
    const c = Math.cos(theta(k));
    const s = Math.sin(theta(k));
    const r = re[k];
    const i = im[k];
    re[k] = r * c - i * s;
    im[k] = r * s + i * c;
  }
}

/** L2 norm squared: Σ|ψ_k|². With a cell measure dV gives ∫|ψ|² dV. */
export function norm2(f: ComplexField, dV = 1): number {
  const { re, im, length } = f;
  let s = 0;
  for (let k = 0; k < length; k++) s += re[k] * re[k] + im[k] * im[k];
  return s * dV;
}

/** Scale every element by a real factor (in place). */
export function scale(f: ComplexField, factor: number): void {
  const { re, im, length } = f;
  for (let k = 0; k < length; k++) {
    re[k] *= factor;
    im[k] *= factor;
  }
}

/** Renormalise so ∫|ψ|² dV = 1. No-op if the field is empty. */
export function normalize(f: ComplexField, dV = 1): void {
  const n = norm2(f, dV);
  if (n > 0) scale(f, 1 / Math.sqrt(n));
}

/** Copy src into dst (must be equal length). */
export function copyInto(dst: ComplexField, src: ComplexField): void {
  dst.re.set(src.re);
  dst.im.set(src.im);
}
