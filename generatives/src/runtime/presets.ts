// Per-algorithm presets + the colourways and randomiser that drive the studio's
// Presets dropdown and the Randomise button. Curated presets exist for the four
// headline systems; every other piece gets valid presets generated from its own
// param schema, so the dropdown is always populated and always works.

import type { ParamSchema, ParamSpec, Params } from "../core/piece";
import type { Colors } from "../core/color/theme";
import { makeRng, type RNG } from "../core/rng";

export interface Preset {
  label: string;
  params?: Params;
  meta?: { complexity: number; chaos: number };
  colors?: Colors;
}

// Curated colourways (bg → low → high), reused by presets and the randomiser.
export const COLORWAYS: { name: string; colors: Colors }[] = [
  { name: "Brand Blue", colors: { bg: "#05070d", lo: "#2a3a8f", hi: "#9fe7ff" } },
  { name: "Cyan Circuitry", colors: { bg: "#02060c", lo: "#0b3a6b", hi: "#7df3ff" } },
  { name: "Deep Sea", colors: { bg: "#01030a", lo: "#16246e", hi: "#79c7ff" } },
  { name: "Arctic Lattice", colors: { bg: "#04070a", lo: "#33506e", hi: "#eaf6ff" } },
  { name: "Ultraviolet", colors: { bg: "#060108", lo: "#4a0d6e", hi: "#ff8af0" } },
  { name: "Bioluminescence", colors: { bg: "#01070a", lo: "#0b4a3a", hi: "#9bffd0" } },
  { name: "Magma Veins", colors: { bg: "#0a0206", lo: "#b3164b", hi: "#ffd0a0" } },
  { name: "Ember Filigree", colors: { bg: "#0a0402", lo: "#7a1a00", hi: "#ffd24a" } },
  { name: "Gold Leaf", colors: { bg: "#0a0800", lo: "#5a3d00", hi: "#ffe9a0" } },
  { name: "Rose Quartz", colors: { bg: "#0a0408", lo: "#7a1f55", hi: "#ffc6e6" } },
  { name: "Ink Wash", colors: { bg: "#070707", lo: "#444444", hi: "#f2f2f2" } },
];

const cw = (name: string): Colors => COLORWAYS.find((c) => c.name === name)!.colors;

// Hand-tuned presets for the four headline systems.
const CURATED: Record<string, Preset[]> = {
  physarum: [
    { label: "Reticulum", params: { spawn: "ring", species: 1, displayMode: "palette", sensorDist: 9, sensorAngle: 24, turnSpeed: 30, decay: 0.9, diffuse: 0.25, avoid: 0, intensity: 1.8, speed: 1 }, meta: { complexity: 0.65, chaos: 0.35 }, colors: cw("Cyan Circuitry") },
    { label: "Filaments", params: { spawn: "random", species: 1, displayMode: "palette", sensorDist: 19, sensorAngle: 15, turnSpeed: 17, decay: 0.88, diffuse: 0, avoid: 0, intensity: 2.4, speed: 1 }, meta: { complexity: 0.5, chaos: 0.4 }, colors: cw("Magma Veins") },
    { label: "Soft Bloom", params: { spawn: "center", species: 1, displayMode: "palette", sensorDist: 12, sensorAngle: 31, turnSpeed: 23, decay: 0.94, diffuse: 0.5, avoid: 0, intensity: 1.6, speed: 1 }, meta: { complexity: 0.6, chaos: 0.5 }, colors: cw("Ultraviolet") },
    { label: "Three Species", params: { spawn: "random", species: 3, displayMode: "rgb", sensorDist: 9, sensorAngle: 22, turnSpeed: 28, decay: 0.92, diffuse: 0.4, avoid: 0.5, intensity: 1.6, speed: 1, colR: "#ff2d6b", colG: "#22e0c8", colB: "#ffd23d" }, meta: { complexity: 0.7, chaos: 0.4 }, colors: cw("Ink Wash") },
    { label: "Monochrome Drift", params: { spawn: "random", species: 1, displayMode: "palette", sensorDist: 14, sensorAngle: 20, turnSpeed: 32, decay: 0.89, diffuse: 0, avoid: 0, intensity: 2.2, speed: 1 }, meta: { complexity: 0.5, chaos: 0.4 }, colors: cw("Ink Wash") },
  ],
  boids: [
    { label: "Murmuration", params: { count: 420, speed: 5.5, separation: 1.5, wander: 0.05, directionalPause: 0.1, trail: 0.03 }, meta: { complexity: 0.7, chaos: 0.4 }, colors: cw("Arctic Lattice") },
    { label: "Loose Flock", params: { count: 320, speed: 12, separation: 1.5, wander: 0.55, directionalPause: 0.45, trail: 0.067 }, meta: { complexity: 0.45, chaos: 0.6 }, colors: cw("Deep Sea") },
    { label: "Tight Swarm", params: { count: 620, speed: 8, separation: 2.4, wander: 0.2, directionalPause: 0.35, trail: 0.05 }, meta: { complexity: 0.85, chaos: 0.45 }, colors: cw("Cyan Circuitry") },
    { label: "Restless", params: { count: 260, speed: 15, separation: 1, wander: 0.9, directionalPause: 0.8, trail: 0.04 }, meta: { complexity: 0.6, chaos: 0.8 }, colors: cw("Magma Veins") },
  ],
  "field-dynamics": [
    { label: "Twin Vortices", params: { singularities: 2, speed: 4, fade: 0.02, lineWidth: 1.4 }, meta: { complexity: 0.6, chaos: 0.4 }, colors: cw("Bioluminescence") },
    { label: "Turbines", params: { singularities: 6, speed: 5, fade: 0.015, lineWidth: 1.2 }, meta: { complexity: 0.8, chaos: 0.5 }, colors: cw("Cyan Circuitry") },
    { label: "Slow Drift", params: { singularities: 3, speed: 2, fade: 0.04, lineWidth: 1.8 }, meta: { complexity: 0.5, chaos: 0.3 }, colors: cw("Deep Sea") },
    { label: "Storm", params: { singularities: 8, speed: 7, fade: 0.01, lineWidth: 1 }, meta: { complexity: 0.9, chaos: 0.7 }, colors: cw("Ultraviolet") },
  ],
  "organic-turbulence": [
    { label: "Smoke", params: { speed: 1, fieldScale: 1, evolve: 0.4, trail: 0.06, lineWidth: 1.2 }, meta: { complexity: 0.55, chaos: 0.5 }, colors: cw("Ink Wash") },
    { label: "Currents", params: { speed: 1.6, fieldScale: 0.7, evolve: 0.6, trail: 0.04, lineWidth: 1.4 }, meta: { complexity: 0.7, chaos: 0.6 }, colors: cw("Deep Sea") },
    { label: "Fine Weave", params: { speed: 0.8, fieldScale: 2.2, evolve: 0.3, trail: 0.08, lineWidth: 0.9 }, meta: { complexity: 0.85, chaos: 0.4 }, colors: cw("Bioluminescence") },
    { label: "Gale", params: { speed: 2.4, fieldScale: 1.2, evolve: 0.8, trail: 0.03, lineWidth: 1.1 }, meta: { complexity: 0.6, chaos: 0.8 }, colors: cw("Magma Veins") },
  ],
};

const snap = (v: number, min: number, step: number): number => {
  const s = step > 0 ? step : 0.01;
  const out = min + Math.round((v - min) / s) * s;
  return Math.round(out * 1e6) / 1e6;
};

function randomValue(spec: ParamSpec, rng: RNG): number | boolean | string {
  if (spec.type === "number") return snap(rng.range(spec.min, spec.max), spec.min, spec.step ?? 0.01);
  if (spec.type === "int") return rng.int(spec.min, spec.max);
  if (spec.type === "bool") return rng.next() < 0.5;
  if (spec.type === "color") return "#" + rng.int(0, 0xffffff).toString(16).padStart(6, "0");
  return spec.options[rng.int(0, spec.options.length - 1)]!; // select
}

/** A full set of random (but valid) params for a schema. */
export function randomParams(schema: ParamSchema, rng: RNG): Params {
  const out: Params = {};
  for (const k of Object.keys(schema)) out[k] = randomValue(schema[k]!, rng);
  return out;
}

/** Presets for a piece: curated when we have them, otherwise generated from the
 *  schema (deterministic, so the same piece always offers the same menu). */
export function presetsFor(id: string, schema: ParamSchema): Preset[] {
  if (CURATED[id]) return CURATED[id]!;
  const out: Preset[] = [];
  const N = 5;
  for (let i = 0; i < N; i++) {
    const rng = makeRng(`${id}#preset#${i}`);
    out.push({
      label: COLORWAYS[(i + 1) % COLORWAYS.length]!.name,
      params: randomParams(schema, rng),
      meta: { complexity: snap(rng.range(0.35, 0.85), 0, 0.01), chaos: snap(rng.range(0.3, 0.8), 0, 0.01) },
      colors: COLORWAYS[(i + 1) % COLORWAYS.length]!.colors,
    });
  }
  return out;
}

/** A "really switch it up" patch for the Randomise button: fresh params, meta and
 *  colourway, driven by the given (already-reseeded) RNG. */
export function randomPatch(schema: ParamSchema, rng: RNG): Required<Pick<Preset, "params" | "meta" | "colors">> {
  return {
    params: randomParams(schema, rng),
    meta: { complexity: snap(rng.range(0.3, 0.9), 0, 0.01), chaos: snap(rng.range(0.25, 0.9), 0, 0.01) },
    colors: COLORWAYS[rng.int(0, COLORWAYS.length - 1)]!.colors,
  };
}
