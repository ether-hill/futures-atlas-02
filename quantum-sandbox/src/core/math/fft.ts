// CPU radix-2 Cooley–Tukey FFT (iterative, in-place) for power-of-two sizes.
// 1D plus 2D via row then column passes. The GPU Stockham path in M2 mirrors
// this API surface so systems are backend-agnostic.
//
// Convention: forward transform uses e^{-i 2π k n / N}; the inverse divides by N.

import type { ComplexField } from "./complex";

export const isPow2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

/** In-place 1D FFT over the first `n` elements of re/im. `inverse` divides by n. */
export function fft1d(re: Float32Array, im: Float32Array, n: number, inverse: boolean): void {
  if (!isPow2(n)) throw new Error(`fft1d: size ${n} is not a power of two`);

  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (sign * 2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }

  if (inverse) {
    const inv = 1 / n;
    for (let i = 0; i < n; i++) {
      re[i] *= inv;
      im[i] *= inv;
    }
  }
}

/** In-place 2D FFT on a row-major nx×ny complex field. */
export function fft2d(f: ComplexField, nx: number, ny: number, inverse: boolean): void {
  if (!isPow2(nx) || !isPow2(ny)) throw new Error(`fft2d: dims ${nx}×${ny} must be powers of two`);
  if (f.length !== nx * ny) throw new Error("fft2d: field length != nx*ny");
  const { re, im } = f;

  // rows: transform each contiguous run in place
  const rowRe = new Float32Array(nx);
  const rowIm = new Float32Array(nx);
  for (let y = 0; y < ny; y++) {
    const off = y * nx;
    rowRe.set(re.subarray(off, off + nx));
    rowIm.set(im.subarray(off, off + nx));
    fft1d(rowRe, rowIm, nx, inverse);
    re.set(rowRe, off);
    im.set(rowIm, off);
  }

  // columns: gather strided column, transform, scatter back
  const colRe = new Float32Array(ny);
  const colIm = new Float32Array(ny);
  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      const k = y * nx + x;
      colRe[y] = re[k];
      colIm[y] = im[k];
    }
    fft1d(colRe, colIm, ny, inverse);
    for (let y = 0; y < ny; y++) {
      const k = y * nx + x;
      re[k] = colRe[y];
      im[k] = colIm[y];
    }
  }
}
