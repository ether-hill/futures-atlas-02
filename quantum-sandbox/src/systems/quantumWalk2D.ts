// Discrete-time quantum walk on a 2D lattice. A position grid tensored with a
// 4-state coin (+x, −x, +y, −y). Each step: apply the coin at every site, then
// shift each coin component one cell in its direction. Interference makes it
// spread BALLISTICALLY (RMS ∝ steps), not diffusively (∝ √steps) like a
// classical walk — the toggleable reference rings make that contrast visible.

import type { GenerativeSystem, Params, RenderSurface, Canvas2DSurface } from "../harness/GenerativeSystem";
import { deviceSize } from "../harness/GenerativeSystem";
import { makeComplexField, type ComplexField } from "../core/math/complex";
import { blitField } from "../harness/blit";

interface State {
  n: number;
  coin: "grover" | "hadamard";
  boundary: "wrap" | "absorb";
  amp: ComplexField[]; // [+x, -x, +y, -y], each n*n
  sum: ComplexField; // position-summed amplitude, reused each render
  steps: number;
  stepsPerFrame: number;
  overlay: boolean;
  lightGain: number;
  banded: boolean;
  bands: number;
}

// Hadamard⊗Hadamard on the 2-qubit coin, rows = [++,+-,-+,--] → directions.
const H4 = [
  [0.5, 0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5, 0.5],
];

function applyCoin(amp: ComplexField[], n: number, coin: "grover" | "hadamard"): void {
  const len = n * n;
  const r = [0, 0, 0, 0];
  const im = [0, 0, 0, 0];
  for (let k = 0; k < len; k++) {
    for (let c = 0; c < 4; c++) {
      r[c] = amp[c].re[k];
      im[c] = amp[c].im[k];
    }
    if (coin === "grover") {
      // G = (2/4)·J − I  →  new_c = ½·(Σ) − old_c
      const sr = 0.5 * (r[0] + r[1] + r[2] + r[3]);
      const si = 0.5 * (im[0] + im[1] + im[2] + im[3]);
      for (let c = 0; c < 4; c++) {
        amp[c].re[k] = sr - r[c];
        amp[c].im[k] = si - im[c];
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let ar = 0;
        let ai = 0;
        for (let d = 0; d < 4; d++) {
          ar += H4[c][d] * r[d];
          ai += H4[c][d] * im[d];
        }
        amp[c].re[k] = ar;
        amp[c].im[k] = ai;
      }
    }
  }
}

function shift(amp: ComplexField[], n: number, boundary: "wrap" | "absorb"): ComplexField[] {
  const len = n * n;
  const out = [makeComplexField(len), makeComplexField(len), makeComplexField(len), makeComplexField(len)];
  // deltas in (dx,dy) for each direction
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let c = 0; c < 4; c++) {
    const dx = dirs[c][0];
    const dy = dirs[c][1];
    const src = amp[c];
    const dst = out[c];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let nx = x + dx;
        let ny = y + dy;
        if (boundary === "wrap") {
          nx = (nx + n) % n;
          ny = (ny + n) % n;
        } else if (nx < 0 || nx >= n || ny < 0 || ny >= n) {
          continue; // absorbed
        }
        const s = y * n + x;
        const d = ny * n + nx;
        dst.re[d] = src.re[s];
        dst.im[d] = src.im[s];
      }
    }
  }
  return out;
}

function rmsRadius(amp: ComplexField[], n: number): { rms: number; norm: number } {
  const c = (n - 1) / 2;
  let m0 = 0;
  let m2 = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const k = y * n + x;
      let p = 0;
      for (let d = 0; d < 4; d++) p += amp[d].re[k] * amp[d].re[k] + amp[d].im[k] * amp[d].im[k];
      m0 += p;
      const dx = x - c;
      const dy = y - c;
      m2 += p * (dx * dx + dy * dy);
    }
  }
  return { rms: m0 > 0 ? Math.sqrt(m2 / m0) : 0, norm: m0 };
}

export const quantumWalk2D: GenerativeSystem<State> = {
  id: "quantum-walk-2d",
  title: "Quantum Walk 2D",
  blurb: "ballistic spread by interference",
  backend: "canvas2d",
  schema: {
    gridSize: { type: "int", min: 48, max: 192, default: 96, label: "grid N" },
    coin: { type: "select", options: ["grover", "hadamard"], default: "grover", label: "coin" },
    stepsPerFrame: { type: "int", min: 1, max: 4, default: 1, hot: true, label: "steps/frame" },
    boundary: { type: "select", options: ["wrap", "absorb"], default: "wrap", label: "boundary" },
    classicalOverlay: { type: "bool", default: true, hot: true, label: "compare classical" },
    lightGain: { type: "number", min: 1, max: 20, step: 0.5, default: 9, hot: true, label: "mag gain" },
    banded: { type: "bool", default: false, hot: true, label: "mag bands" },
    bands: { type: "int", min: 2, max: 16, default: 7, hot: true, label: "band count" },
  },

  init(_surface: RenderSurface, params: Params): State {
    const n = Number(params.gridSize) | 0;
    const len = n * n;
    const amp = [makeComplexField(len), makeComplexField(len), makeComplexField(len), makeComplexField(len)];
    const c0 = ((n >> 1) * n + (n >> 1)) | 0;
    // symmetric coin state (1, 1, i, i)/2 → norm 1, symmetric distribution
    amp[0].re[c0] = 0.5;
    amp[1].re[c0] = 0.5;
    amp[2].im[c0] = 0.5;
    amp[3].im[c0] = 0.5;
    return {
      n,
      coin: String(params.coin) as "grover" | "hadamard",
      boundary: String(params.boundary) as "wrap" | "absorb",
      amp,
      sum: makeComplexField(len),
      steps: 0,
      stepsPerFrame: Number(params.stepsPerFrame) | 0,
      overlay: Boolean(params.classicalOverlay),
      lightGain: Number(params.lightGain),
      banded: Boolean(params.banded),
      bands: Number(params.bands) | 0,
    };
  },

  step(state) {
    for (let s = 0; s < state.stepsPerFrame; s++) {
      applyCoin(state.amp, state.n, state.coin);
      state.amp = shift(state.amp, state.n, state.boundary);
      state.steps++;
    }
    return state;
  },

  render(state, surface) {
    if (surface.kind !== "canvas2d") return;
    const { n, amp, sum } = state;
    const len = n * n;
    for (let k = 0; k < len; k++) {
      sum.re[k] = amp[0].re[k] + amp[1].re[k] + amp[2].re[k] + amp[3].re[k];
      sum.im[k] = amp[0].im[k] + amp[1].im[k] + amp[2].im[k] + amp[3].im[k];
    }
    blitField(surface as Canvas2DSurface, sum, n, n, {
      lightGain: state.lightGain,
      banded: state.banded,
      bands: state.bands,
    });
    if (state.overlay) {
      const { rms } = rmsRadius(amp, n);
      const classical = Math.sqrt(state.steps); // diffusive reference (cells)
      const { w, h } = deviceSize(surface);
      const ctx = (surface as Canvas2DSurface).ctx;
      const sx = w / n;
      const sy = h / n;
      const cx = w / 2;
      const cy = h / 2;
      const ring = (rad: number, css: string, label: string) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad * sx, rad * sy, 0, 0, Math.PI * 2);
        ctx.strokeStyle = css;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = css;
        ctx.font = `${Math.round(12 * (w / 600))}px ui-monospace, monospace`;
        ctx.fillText(label, cx + rad * sx + 4, cy);
      };
      ring(rms, "rgba(255,255,255,0.85)", "quantum");
      ring(classical, "rgba(255,255,255,0.4)", "classical");
    }
  },

  isDone: () => false,

  diagnostics(state) {
    const { rms, norm } = rmsRadius(state.amp, state.n);
    return { norm, rmsQuantum: rms, rmsClassical: Math.sqrt(state.steps), steps: state.steps };
  },
};
