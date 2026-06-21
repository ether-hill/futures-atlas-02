// The Piece contract. Every visual is a pure (seed, params, size, time) → frame,
// driven by a declarative param schema (which also feeds the controls) plus the
// two universal knobs complexity & chaos. Dependency-free.

import type { RNG } from "./rng";
import type { NoiseKit } from "./noise";
import type { Palette } from "./color/theme";
import type { RenderSurface } from "./surface";

export type ParamSpec =
  | { type: "number"; min: number; max: number; step?: number; default: number; label?: string }
  | { type: "int"; min: number; max: number; default: number; label?: string }
  | { type: "bool"; default: boolean; label?: string }
  | { type: "select"; options: string[]; default: string; label?: string }
  | { type: "color"; default: string; label?: string };

export type ParamSchema = Record<string, ParamSpec>;
export type ParamValue = number | boolean | string;
export type Params = Record<string, ParamValue>;

export type Backend = "canvas2d" | "webgl2" | "three" | "p5";

export interface Meta {
  complexity: number; // 0..1
  chaos: number; // 0..1
}

export interface Config {
  pieceId: string;
  seed: string;
  params: Params;
  size: { w: number; h: number };
  meta: Meta;
  theme: string;
  /** live colour overrides (bg / low / high); when present they build the palette */
  colors?: { bg: string; lo: string; hi: string };
}

export interface PieceContext {
  surface: RenderSurface;
  width: number; // device pixels
  height: number;
  rng: RNG;
  noise: NoiseKit;
  palette: Palette;
  params: Params;
  meta: Meta;
}

export interface Piece {
  id: string;
  title: string;
  tags: string[];
  backend: Backend;
  schema: ParamSchema;
  /** seamless-loop period in seconds; omit for a continuous (non-looping) piece */
  loopSeconds?: number;

  init(ctx: PieceContext): void | Promise<void>;
  /** advance; `t` is the loop-phase time in seconds (wraps at loopSeconds) */
  update(dt: number, t: number): void;
  render(): void;
  resize(width: number, height: number): void;
  reseed(seed: string): void;
  applyMeta(complexity: number, chaos: number): void;
  dispose(): void;
}

export type PieceFactory = () => Piece;

export function defaultsOf(schema: ParamSchema): Params {
  const out: Params = {};
  for (const k in schema) out[k] = schema[k]!.default;
  return out;
}
