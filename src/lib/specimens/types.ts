/**
 * Specimens — the contract every sketch signs.
 *
 * A sketch is an algorithm plus the dials worth turning on it. The dials are
 * declared, not built: the lab reads `params` and draws the controls, the URL
 * carries any value that is not a default, and a pin stores the same record.
 * So a configuration is always just `Values`, and anything that can be pinned
 * can be reopened, linked or exported exactly.
 */

export type Values = Record<string, number>;

interface ParamBase {
  key: string;
  label: string;
  /** Panel section. Params without one sit under "Form". */
  group?: string;
  /** One line under the control: what it does to the picture. */
  hint?: string;
  /** Carried in the URL and in pins, never drawn as a control (the camera). */
  hidden?: boolean;
}

export type ParamDef =
  | (ParamBase & { kind: "range"; min: number; max: number; step: number; default: number })
  | (ParamBase & { kind: "toggle"; default: 0 | 1 })
  | (ParamBase & { kind: "choice"; options: { value: number; label: string }[]; default: number });

export interface Preset {
  name: string;
  values: Values;
}

/** The target being drawn to. (Orbit and zoom are hidden params, not view.) */
export interface View {
  w: number;
  h: number;
  /** A preview pass while something is moving: sketches may cut corners. */
  fast?: boolean;
  /** Render at this fraction of w×h and stretch it over the canvas. */
  scale?: number;
  /** Draw only this rectangle [x, y, w, h] of the full frame (progressive
   *  rendering). Renderers that cannot tile draw everything. */
  rect?: [number, number, number, number];
}

export interface Renderer {
  /** Honours `view.rect`, so a slow frame can be built up tile by tile. */
  tiles?: boolean;
  /** Draw one frame. For an animated sketch this also advances it. */
  draw(values: Values, view: View): void;
  /** Animated sketches only: start the simulation over from its seed. */
  restart?(): void;
  /** Animated sketches: true once the run has reached its step budget. */
  settled?(): boolean;
  dispose(): void;
}

export interface Source {
  label: string;
  href: string;
}

export interface Sketch {
  id: string;
  title: string;
  /** Caption line: what family of form this is. */
  family: string;
  /** One sentence for the card. */
  blurb: string;
  /** The method in plain words: what the code actually computes. */
  method: string[];
  /** Where the idea comes from. Real, checked links only. */
  sources: Source[];
  params: ParamDef[];
  presets: Preset[];
  /** Drag rotates, wheel zooms (writes the hidden yaw/pitch/zoom params). */
  orbit: boolean;
  /** Runs a frame loop rather than rendering once per change. */
  animated: boolean;
  /** A still for the card: how many frames an animated sketch runs first. */
  stillFrames?: number;
  create(gl: WebGL2RenderingContext): Renderer;
}

export function defaults(s: Sketch): Values {
  return Object.fromEntries(s.params.map((p) => [p.key, p.default]));
}

/** Defaults overlaid with a partial set, unknown keys dropped. */
export function resolve(s: Sketch, partial: Values | undefined): Values {
  const out = defaults(s);
  if (!partial) return out;
  for (const p of s.params) {
    const v = partial[p.key];
    if (typeof v === "number" && Number.isFinite(v)) out[p.key] = v;
  }
  return out;
}

/** Only what differs from the defaults: the URL and the pin record. */
export function diff(s: Sketch, values: Values): Values {
  const out: Values = {};
  for (const p of s.params) {
    const v = values[p.key];
    if (v !== undefined && Math.abs(v - p.default) > 1e-9) out[p.key] = round(v);
  }
  return out;
}

export function round(v: number): number {
  return Math.round(v * 1e5) / 1e5;
}
