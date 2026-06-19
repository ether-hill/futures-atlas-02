// M0 validation system. Not physics — a static domain-coloring viewer for a few
// complex functions (z², 1/z, poles & zeros). It exists to prove the colour
// spine before any simulation: zeros read as dark points all hues spiral into,
// poles as bright points hues spiral out of, and the banded mode shows magnitude
// isolevels. If this looks right, the spine is right.

import type { GenerativeSystem, Params, RenderSurface } from "../harness/GenerativeSystem";
import { deviceSize } from "../harness/GenerativeSystem";
import { makeComplexField } from "../core/math/complex";
import { colorFieldRGBA } from "../core/color/domainColoring";

interface State {
  w: number;
  h: number;
  image: ImageData | null;
  extent: number;
}

const FUNCS = ["z", "z^2", "z^3 - 1", "1/z", "(z^2-1)/(z^2+1)", "sin z"] as const;
type FuncName = (typeof FUNCS)[number];

// complex helpers on bare numbers
const cmul = (ar: number, ai: number, br: number, bi: number): [number, number] => [
  ar * br - ai * bi,
  ar * bi + ai * br,
];
function cdiv(ar: number, ai: number, br: number, bi: number): [number, number] {
  const d = br * br + bi * bi || 1e-12;
  return [(ar * br + ai * bi) / d, (ai * br - ar * bi) / d];
}

function evalFn(name: FuncName, x: number, y: number): [number, number] {
  switch (name) {
    case "z":
      return [x, y];
    case "z^2":
      return [x * x - y * y, 2 * x * y];
    case "z^3 - 1": {
      const [x2, y2] = [x * x - y * y, 2 * x * y];
      const [x3, y3] = cmul(x2, y2, x, y);
      return [x3 - 1, y3];
    }
    case "1/z":
      return cdiv(1, 0, x, y);
    case "(z^2-1)/(z^2+1)": {
      const [x2, y2] = [x * x - y * y, 2 * x * y];
      return cdiv(x2 - 1, y2, x2 + 1, y2);
    }
    case "sin z":
      return [Math.sin(x) * Math.cosh(y), Math.cos(x) * Math.sinh(y)];
  }
}

export const complexViewer: GenerativeSystem<State> = {
  id: "complex-viewer",
  title: "Complex Viewer",
  blurb: "domain coloring of f(z) — the spine, proven",
  backend: "canvas2d",
  schema: {
    func: { type: "select", options: [...FUNCS], default: "z^2", label: "f(z)" },
    extent: { type: "number", min: 0.5, max: 8, step: 0.1, default: 2.4, label: "view ±" },
    lightGain: { type: "number", min: 0.5, max: 20, step: 0.5, default: 6, label: "mag gain" },
    chroma: { type: "number", min: 0.02, max: 0.2, step: 0.005, default: 0.13, label: "chroma" },
    hueOffset: { type: "number", min: 0, max: 360, step: 1, default: 0, label: "hue°" },
    banded: { type: "bool", default: true, label: "mag bands" },
    bands: { type: "int", min: 2, max: 16, default: 7, label: "band count" },
  },

  init(surface: RenderSurface, params: Params): State {
    const { w, h } = deviceSize(surface);
    const extent = Number(params.extent);
    const func = String(params.func) as FuncName;
    const field = makeComplexField(w * h);
    const aspect = w / h;
    // map pixel → complex plane; keep square aspect by scaling x extent
    for (let py = 0; py < h; py++) {
      const im = ((py / (h - 1)) * 2 - 1) * -extent; // +im up
      for (let px = 0; px < w; px++) {
        const re = ((px / (w - 1)) * 2 - 1) * extent * aspect;
        const [vr, vi] = evalFn(func, re, im);
        const k = py * w + px;
        field.re[k] = vr;
        field.im[k] = vi;
      }
    }
    const rgba = colorFieldRGBA(
      field,
      {
        lightGain: Number(params.lightGain),
        chroma: Number(params.chroma),
        hueOffset: Number(params.hueOffset),
        banded: Boolean(params.banded),
        bands: Number(params.bands),
      },
      1, // no max-normalisation: the log compressor handles unbounded |f|
    );
    const image = new ImageData(w, h);
    image.data.set(rgba);
    return { w, h, extent, image };
  },

  step: (state) => state, // static

  render(state, surface) {
    if (surface.kind !== "canvas2d" || !state.image) return;
    surface.ctx.putImageData(state.image, 0, 0);
  },

  isDone: () => true,

  diagnostics: (state) => ({ "view±": state.extent, "Mpx": (state.w * state.h) / 1e6 }),
};
