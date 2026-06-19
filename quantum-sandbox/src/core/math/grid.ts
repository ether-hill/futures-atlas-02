// A 2D grid descriptor: dimensions, physical extent, and the FFT wavevector
// grid used by spectral solvers. Sim units default to a unit box per axis.

export interface Grid {
  nx: number;
  ny: number;
  /** physical extent of the box per axis (sim length units) */
  lx: number;
  ly: number;
}

export function makeGrid(nx: number, ny: number, lx = 1, ly = 1): Grid {
  return { nx, ny, lx, ly };
}

/** row-major flat index */
export const idx = (g: Grid, x: number, y: number): number => y * g.nx + x;

/** cell area dx·dy — the measure for ∫|ψ|² dV on this grid */
export const cellArea = (g: Grid): number => (g.lx / g.nx) * (g.ly / g.ny);

/**
 * FFT angular wavenumbers along one axis, in standard FFT bin order
 * (0, 1, …, n/2-1, -n/2, …, -1) scaled by 2π/L. Used to build k² for the
 * kinetic phase in the split-step solver.
 */
export function waveNumbers(n: number, l: number): Float32Array {
  const k = new Float32Array(n);
  const f = (2 * Math.PI) / l;
  const half = n >> 1;
  for (let i = 0; i < n; i++) k[i] = (i < half ? i : i - n) * f;
  return k;
}
