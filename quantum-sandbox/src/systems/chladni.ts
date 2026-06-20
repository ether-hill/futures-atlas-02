// Eigenmodes / standing waves of a 2D square membrane — the quantum infinite
// square-well analogy. ψ_{nm} = sin(nπx)sin(mπy); superposing the (n,m) and
// (m,n) partners with a ± sign gives the classic Chladni figures. The field is
// real, so domain coloring shows its sign as two hues and its nodal set as the
// dark zero-crossing lines.

import type { GenerativeSystem, Params, RenderSurface, Canvas2DSurface } from "../harness/GenerativeSystem";
import { deviceSize } from "../harness/GenerativeSystem";
import { makeComplexField, type ComplexField } from "../core/math/complex";
import { blitField, clearSurface } from "../harness/blit";

const G = 360; // sim resolution

interface State {
  field: ComplexField;
  overlay: HTMLCanvasElement; // nodal-line layer at sim res
  display: "nodal" | "density" | "both";
  n: number;
  m: number;
  nodesExpected: number;
  signChanges: number;
  lightGain: number;
}

export const chladni: GenerativeSystem<State> = {
  id: "chladni",
  title: "Chladni Modes",
  blurb: "eigenstates & nodal lines",
  backend: "canvas2d",
  schema: {
    n: { type: "int", min: 1, max: 12, default: 3, label: "n" },
    m: { type: "int", min: 1, max: 12, default: 2, label: "m" },
    form: { type: "select", options: ["sin", "cos"], default: "sin", label: "basis" },
    w1: { type: "number", min: 0, max: 1, step: 0.01, default: 1, label: "weight (n,m)" },
    w2: { type: "number", min: 0, max: 1, step: 0.01, default: 1, label: "weight (m,n)" },
    sign: { type: "select", options: ["+", "-"], default: "+", label: "± partner" },
    display: { type: "select", options: ["nodal", "density", "both"], default: "both", label: "display" },
    lightGain: { type: "number", min: 1, max: 20, step: 0.5, default: 7, label: "mag gain" },
  },

  init(_surface: RenderSurface, params: Params): State {
    const n = Number(params.n) | 0;
    const m = Number(params.m) | 0;
    const w1 = Number(params.w1);
    const w2 = Number(params.w2);
    const sgn = params.sign === "-" ? -1 : 1;
    const cos = params.form === "cos";
    const field = makeComplexField(G * G);
    const basis = (a: number, t: number): number => (cos ? Math.cos(a * Math.PI * t) : Math.sin(a * Math.PI * t));

    let maxAbs = 0;
    for (let yy = 0; yy < G; yy++) {
      const y = yy / (G - 1);
      for (let xx = 0; xx < G; xx++) {
        const x = xx / (G - 1);
        const v = w1 * basis(n, x) * basis(m, y) + sgn * w2 * basis(m, x) * basis(n, y);
        const k = yy * G + xx;
        field.re[k] = v;
        if (Math.abs(v) > maxAbs) maxAbs = v < 0 ? -v : v;
      }
    }

    // nodal overlay: bright where the field changes sign vs right/down neighbour
    const overlay = document.createElement("canvas");
    overlay.width = G;
    overlay.height = G;
    const octx = overlay.getContext("2d")!;
    const img = octx.createImageData(G, G);
    let signChanges = 0;
    for (let yy = 0; yy < G; yy++) {
      for (let xx = 0; xx < G; xx++) {
        const k = yy * G + xx;
        const v = field.re[k];
        const vr = xx + 1 < G ? field.re[k + 1] : v;
        const vd = yy + 1 < G ? field.re[k + G] : v;
        const crossing = v * vr < 0 || v * vd < 0;
        const p = k * 4;
        if (crossing) {
          signChanges++;
          img.data[p] = 240;
          img.data[p + 1] = 244;
          img.data[p + 2] = 255;
          img.data[p + 3] = 255;
        } else {
          img.data[p + 3] = 0;
        }
      }
    }
    octx.putImageData(img, 0, 0);

    return {
      field,
      overlay,
      display: String(params.display) as State["display"],
      n,
      m,
      nodesExpected: Math.max(0, (n - 1) * (m - 1)),
      signChanges,
      lightGain: Number(params.lightGain),
    };
  },

  step: (state) => state, // static eigenmode

  render(state, surface) {
    if (surface.kind !== "canvas2d") return;
    const s2d = surface as Canvas2DSurface;
    if (state.display === "nodal") {
      clearSurface(s2d, "#0a0c11");
    } else {
      blitField(s2d, state.field, G, G, { lightGain: state.lightGain, banded: false });
    }
    if (state.display !== "density") {
      const { w, h } = deviceSize(surface);
      const ctx = s2d.ctx;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(state.overlay, 0, 0, G, G, 0, 0, w, h);
    }
  },

  isDone: () => true,

  diagnostics(state) {
    return { n: state.n, m: state.m, nodesExpected: state.nodesExpected, signChanges: state.signChanges };
  },
};
