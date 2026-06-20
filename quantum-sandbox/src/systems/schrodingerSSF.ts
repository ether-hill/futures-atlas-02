// THE headline. The 2D time-dependent Schrödinger equation, in real time, via
// the split-step Fourier (Strang) method:
//   ψ ← e^{−iV dt/2} · IFFT[ e^{−ik² dt/2} · FFT[ e^{−iV dt/2} ψ ] ]
// Potentials in real space, kinetic phase in Fourier space. Sim units ℏ=m=1.
// Ships double-slit (interference) and tunnelling (partial transmission). The
// `decoherence` knob is the M2 modifier: it dephases the field so coherent
// fringes wash into incoherent haze (a phenomenological pure-state proxy for
// off-diagonal decay — not a full density-matrix evolution).

import type { GenerativeSystem, Params, RenderSurface, Canvas2DSurface } from "../harness/GenerativeSystem";
import { deviceSize } from "../harness/GenerativeSystem";
import type { RNG } from "../core/math/rng";
import { makeComplexField, norm2, scale, type ComplexField } from "../core/math/complex";
import { makeGrid, cellArea, waveNumbers, type Grid } from "../core/math/grid";
import { fft2d } from "../core/math/fft";
import { blitField } from "../harness/blit";

const L = 40; // physical box length per axis (sim units)

interface State {
  grid: Grid;
  nx: number;
  psi: ComplexField;
  V: Float32Array;
  k2: Float32Array;
  mask: Float32Array | null;
  wallOverlay: HTMLCanvasElement | null;
  dt: number;
  stepsPerFrame: number;
  gamma: number;
  rng: RNG;
  t: number;
  coherence: number;
  lightGain: number;
}

function rotateByField(psi: ComplexField, theta: Float32Array | ((k: number) => number)): void {
  const { re, im, length } = psi;
  const fn = typeof theta === "function" ? theta : (k: number) => theta[k];
  for (let k = 0; k < length; k++) {
    const t = fn(k);
    const c = Math.cos(t);
    const s = Math.sin(t);
    const r = re[k];
    const i = im[k];
    re[k] = r * c - i * s;
    im[k] = r * s + i * c;
  }
}

function buildPotential(nx: number, dx: number, preset: string, E0: number): Float32Array {
  const V = new Float32Array(nx * nx);
  const block = 400;
  const xOf = (i: number) => (i - nx / 2) * dx;
  const wallHalf = 0.5; // wall half-thickness (units)
  const slitSep = 7; // centre-to-centre (units)
  const slitHalf = 1.1; // slit half-height (units)
  const omega = 0.5;
  for (let j = 0; j < nx; j++) {
    const y = (j - nx / 2) * dx;
    for (let i = 0; i < nx; i++) {
      const x = xOf(i);
      const k = j * nx + i;
      let v = 0;
      switch (preset) {
        case "double-slit":
          if (Math.abs(x) < wallHalf) {
            const inSlit = Math.abs(Math.abs(y) - slitSep / 2) < slitHalf;
            v = inSlit ? 0 : block;
          }
          break;
        case "barrier":
          if (Math.abs(x) < wallHalf * 1.6) v = block;
          break;
        case "tunnelling":
          if (Math.abs(x) < 0.35) v = E0 * 1.15; // thin, comparable to packet energy
          break;
        case "harmonic":
          v = 0.5 * omega * omega * (x * x + y * y);
          break;
        default: // free
          v = 0;
      }
      V[k] = v;
    }
  }
  return V;
}

function makeWallOverlay(V: Float32Array, nx: number): HTMLCanvasElement | null {
  let any = false;
  const c = document.createElement("canvas");
  c.width = nx;
  c.height = nx;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(nx, nx);
  for (let k = 0; k < nx * nx; k++) {
    const p = k * 4;
    if (V[k] > 1) {
      any = true;
      img.data[p] = 210;
      img.data[p + 1] = 220;
      img.data[p + 2] = 235;
      img.data[p + 3] = 70;
    } else {
      img.data[p + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return any ? c : null;
}

export const schrodingerSSF: GenerativeSystem<State> = {
  id: "schrodinger-ssf",
  title: "Schrödinger SSF",
  blurb: "split-step Fourier · double-slit, tunnelling",
  backend: "canvas2d",
  schema: {
    gridSize: { type: "select", options: ["64", "128", "256"], default: "128", label: "grid" },
    potential: {
      type: "select",
      options: ["free", "double-slit", "barrier", "harmonic", "tunnelling"],
      default: "double-slit",
      label: "potential",
    },
    dt: { type: "number", min: 0.001, max: 0.02, step: 0.001, default: 0.005, hot: true, label: "dt" },
    k0x: { type: "number", min: -8, max: 8, step: 0.5, default: 4, label: "k₀x" },
    k0y: { type: "number", min: -8, max: 8, step: 0.5, default: 0, label: "k₀y" },
    sigma: { type: "number", min: 0.8, max: 5, step: 0.1, default: 2, label: "width σ" },
    absorbing: { type: "bool", default: true, label: "absorb edges" },
    decoherence: { type: "number", min: 0, max: 1, step: 0.01, default: 0, hot: true, label: "decoherence γ" },
    stepsPerFrame: { type: "int", min: 1, max: 3, default: 1, hot: true, label: "steps/frame" },
    lightGain: { type: "number", min: 1, max: 30, step: 0.5, default: 12, hot: true, label: "mag gain" },
  },

  init(_surface: RenderSurface, params: Params, rng: RNG): State {
    const nx = Number(params.gridSize) | 0;
    const dx = L / nx;
    const grid = makeGrid(nx, nx, L, L);
    const preset = String(params.potential);
    const k0x = Number(params.k0x);
    const k0y = Number(params.k0y);
    const sigma = Number(params.sigma);
    const E0 = 0.5 * (k0x * k0x + k0y * k0y);

    // initial Gaussian wavepacket
    const psi = makeComplexField(nx * nx);
    const x0 = preset === "harmonic" ? -L * 0.18 : preset === "free" ? -L * 0.1 : -L * 0.28;
    const y0 = 0;
    for (let j = 0; j < nx; j++) {
      const y = (j - nx / 2) * dx;
      for (let i = 0; i < nx; i++) {
        const x = (i - nx / 2) * dx;
        const k = j * nx + i;
        const g = Math.exp(-((x - x0) * (x - x0) + (y - y0) * (y - y0)) / (2 * sigma * sigma));
        const ph = k0x * x + k0y * y;
        psi.re[k] = g * Math.cos(ph);
        psi.im[k] = g * Math.sin(ph);
      }
    }
    const dV = cellArea(grid);
    scale(psi, 1 / Math.sqrt(norm2(psi, dV)));

    // k² grid
    const kx = waveNumbers(nx, L);
    const ky = waveNumbers(nx, L);
    const k2 = new Float32Array(nx * nx);
    for (let j = 0; j < nx; j++) {
      for (let i = 0; i < nx; i++) k2[j * nx + i] = kx[i] * kx[i] + ky[j] * ky[j];
    }

    // absorbing mask: cos² taper over the outer ~10% of each axis
    let mask: Float32Array | null = null;
    if (params.absorbing) {
      mask = new Float32Array(nx * nx);
      const edge = Math.max(2, Math.floor(nx * 0.1));
      const ramp = (i: number): number => {
        let d = Math.min(i, nx - 1 - i);
        if (d >= edge) return 1;
        const t = d / edge;
        const c = Math.cos((1 - t) * Math.PI * 0.5);
        return c * c;
      };
      for (let j = 0; j < nx; j++) for (let i = 0; i < nx; i++) mask[j * nx + i] = ramp(i) * ramp(j);
    }

    const V = buildPotential(nx, dx, preset, E0);
    return {
      grid,
      nx,
      psi,
      V,
      k2,
      mask,
      wallOverlay: makeWallOverlay(V, nx),
      dt: Number(params.dt),
      stepsPerFrame: Number(params.stepsPerFrame) | 0,
      gamma: Number(params.decoherence),
      rng,
      t: 0,
      coherence: 1,
      lightGain: Number(params.lightGain),
    };
  },

  step(state) {
    const { psi, V, k2, mask, nx, dt, gamma, rng } = state;
    const len = nx * nx;
    for (let s = 0; s < state.stepsPerFrame; s++) {
      rotateByField(psi, (k) => -V[k] * dt * 0.5); // ½ potential
      fft2d(psi, nx, nx, false);
      rotateByField(psi, (k) => -k2[k] * dt * 0.5); // kinetic
      fft2d(psi, nx, nx, true);
      rotateByField(psi, (k) => -V[k] * dt * 0.5); // ½ potential
      if (mask) for (let k = 0; k < len; k++) {
        psi.re[k] *= mask[k];
        psi.im[k] *= mask[k];
      }
      if (gamma > 0) {
        rotateByField(psi, () => gamma * 0.35 * rng.gaussian()); // dephasing
        state.coherence *= Math.exp(-gamma * dt);
      }
      state.t += dt;
    }
    return state;
  },

  render(state, surface) {
    if (surface.kind !== "canvas2d") return;
    const s2d = surface as Canvas2DSurface;
    blitField(s2d, state.psi, state.nx, state.nx, { lightGain: state.lightGain, banded: false });
    if (state.wallOverlay) {
      const { w, h } = deviceSize(surface);
      s2d.ctx.imageSmoothingEnabled = true;
      s2d.ctx.drawImage(state.wallOverlay, 0, 0, state.nx, state.nx, 0, 0, w, h);
    }
  },

  isDone: () => false,

  diagnostics(state) {
    return {
      norm: norm2(state.psi, cellArea(state.grid)),
      purity: state.coherence,
      t: state.t,
    };
  },
};
