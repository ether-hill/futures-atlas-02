/**
 * The sketch registry. Add a sketch here or it does not exist: the index, the
 * lab route and the pin API all read this list.
 *
 * To add one: write a file in ./sketches. A signed-distance form is a
 * `raymarchSketch({ ..., glsl })` that defines `map()`, `BOUND` and `SHADE_R`
 * (see raymarch.ts); anything else implements `Sketch.create()` directly, as
 * reaction-diffusion.ts does. Every param becomes a control and a `u_<key>`
 * uniform without further wiring.
 */
import type { Sketch } from "./types";
import { radiolarian } from "./sketches/radiolarian";
import { gyroid } from "./sketches/gyroid";
import { reactionDiffusion } from "./sketches/reaction-diffusion";

export const SKETCHES: Sketch[] = [radiolarian, gyroid, reactionDiffusion];

export function sketchById(id: string): Sketch | undefined {
  return SKETCHES.find((s) => s.id === id);
}
