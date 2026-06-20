// Grover's amplitude amplification, watched as a landscape. N = 2ⁿ amplitudes
// start uniform; each iteration flips the marked amplitude's sign (oracle) then
// inverts all about the mean (diffusion). The marked cell pumps up while its
// sign-flip shows as a HUE flip — phase made visible, not just magnitude. Being
// unitary, it overshoots and oscillates if you keep iterating past the optimum.

import type { GenerativeSystem, Params, RenderSurface, Canvas2DSurface } from "../harness/GenerativeSystem";
import { makeComplexField, type ComplexField } from "../core/math/complex";
import { blitField } from "../harness/blit";

interface State {
  n: number;
  N: number;
  marked: number;
  amp: Float64Array; // real amplitudes
  cols: number;
  rows: number;
  grid: ComplexField; // display field (rows*cols)
  iter: number;
  optIter: number;
  frames: number;
  framesPerIter: number;
  lightGain: number;
  banded: boolean;
}

function groverStep(a: Float64Array, marked: number): void {
  a[marked] = -a[marked]; // oracle
  let mean = 0;
  for (let i = 0; i < a.length; i++) mean += a[i];
  mean /= a.length;
  for (let i = 0; i < a.length; i++) a[i] = 2 * mean - a[i]; // diffusion
}

export const groverLandscape: GenerativeSystem<State> = {
  id: "grover-landscape",
  title: "Grover Landscape",
  blurb: "amplitude amplification rhythm",
  backend: "canvas2d",
  schema: {
    n: { type: "int", min: 4, max: 14, default: 9, label: "qubits n" },
    marked: { type: "int", min: 0, max: 16383, default: 0, label: "marked idx" },
    framesPerIter: { type: "int", min: 1, max: 30, default: 6, hot: true, label: "frames/iter" },
    lightGain: { type: "number", min: 1, max: 20, step: 0.5, default: 8, hot: true, label: "mag gain" },
    banded: { type: "bool", default: true, hot: true, label: "mag bands" },
  },

  init(_surface: RenderSurface, params: Params): State {
    const n = Number(params.n) | 0;
    const N = 1 << n;
    const marked = Math.max(0, Math.min(N - 1, Number(params.marked) | 0));
    const amp = new Float64Array(N);
    amp.fill(1 / Math.sqrt(N)); // uniform start
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N / cols);
    return {
      n,
      N,
      marked,
      amp,
      cols,
      rows,
      grid: makeComplexField(cols * rows),
      iter: 0,
      optIter: Math.floor((Math.PI / 4) * Math.sqrt(N)),
      frames: 0,
      framesPerIter: Number(params.framesPerIter) | 0,
      lightGain: Number(params.lightGain),
      banded: Boolean(params.banded),
    };
  },

  step(state) {
    state.frames++;
    if (state.frames >= state.framesPerIter) {
      state.frames = 0;
      groverStep(state.amp, state.marked);
      state.iter++;
    }
    return state;
  },

  render(state, surface) {
    if (surface.kind !== "canvas2d") return;
    const { amp, N, grid, cols, rows } = state;
    let maxAbs = 0;
    for (let i = 0; i < N; i++) {
      grid.re[i] = amp[i];
      grid.im[i] = 0;
      const a = amp[i] < 0 ? -amp[i] : amp[i];
      if (a > maxAbs) maxAbs = a;
    }
    for (let i = N; i < cols * rows; i++) grid.re[i] = 0; // pad
    blitField(surface as Canvas2DSurface, grid, cols, rows, { lightGain: state.lightGain, banded: state.banded }, maxAbs || 1);
  },

  isDone: () => false,

  diagnostics(state) {
    let norm = 0;
    for (let i = 0; i < state.N; i++) norm += state.amp[i] * state.amp[i];
    return {
      norm,
      pSuccess: state.amp[state.marked] * state.amp[state.marked],
      iter: state.iter,
      optIter: state.optIter,
    };
  },
};
