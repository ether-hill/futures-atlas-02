// The system contract — an EXTENSION of frond-algorithm-lab's GenerativeSystem,
// not a replacement. Same pure (surface, params, rng) → State → render model and
// the same declarative ParamSchema that drives both the panel and presets. The
// quantum addition is `diagnostics()`: per-frame physics readouts (norm, energy,
// purity, variance…) surfaced live in the PerfHUD as the correctness check.
//
// Dependency-free: no Vite / Tweakpane / DOM-framework imports here.

import type { RNG } from "../core/math/rng";

export type ParamSpec =
  | { type: "number"; min: number; max: number; step?: number; default: number; hot?: boolean; label?: string }
  | { type: "int"; min: number; max: number; default: number; hot?: boolean; label?: string }
  | { type: "bool"; default: boolean; hot?: boolean; label?: string }
  | { type: "select"; options: string[]; default: string; hot?: boolean; label?: string }
  | { type: "seed"; default: string; label?: string };

export type ParamSchema = Record<string, ParamSpec>;
export type ParamValue = number | boolean | string;
export type Params = Record<string, ParamValue>;

export type Backend = "canvas2d" | "webgl2" | "webgpu" | "three";

export interface Canvas2DSurface {
  kind: "canvas2d";
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** logical (CSS) pixels */
  width: number;
  height: number;
  dpr: number;
}

export interface WebGL2Surface {
  kind: "webgl2";
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  width: number;
  height: number;
  dpr: number;
}

export type RenderSurface = Canvas2DSurface | WebGL2Surface;

/** Device-pixel dimensions of a surface's backing store. */
export const deviceSize = (s: RenderSurface): { w: number; h: number } => ({
  w: Math.max(1, Math.round(s.width * s.dpr)),
  h: Math.max(1, Math.round(s.height * s.dpr)),
});

export interface GenerativeSystem<State = unknown> {
  id: string;
  title: string;
  blurb: string;
  backend: Backend;
  schema: ParamSchema;

  /** Build initial State. Read every param from `params`; randomness via `rng`. */
  init(surface: RenderSurface, params: Params, rng: RNG): State;
  /** Advance the simulation by `dt` seconds. May mutate and/or return State. */
  step(state: State, dt: number): State;
  /** Draw the current State; must scale to the surface's device size. */
  render(state: State, surface: RenderSurface): void;

  /** True once converged/finished, so the harness can stop stepping. */
  isDone?(state: State): boolean;

  /** Live physics readouts for the PerfHUD (norm, energy, purity, variance…). */
  diagnostics?(state: State): Record<string, number>;

  /** Optional custom hi-res export (offscreen render at N× — never an upscale). */
  exportHiRes?(params: Params, rng: RNG, scale: number, baseWidth: number, baseHeight: number): Promise<Blob>;
}

/** Pull default values out of a schema. */
export function defaultsOf(schema: ParamSchema): Params {
  const out: Params = {};
  for (const k in schema) out[k] = schema[k]!.default;
  return out;
}
