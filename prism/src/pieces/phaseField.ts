// phaseField — domain coloring of an evolving complex field (phase → hue,
// magnitude → brightness): the explicit bridge to the Quantum Sandbox visual
// language. A sum of plane waves rotates in time; uPhase enters at integer
// multiples so the loop is seamless. complexity = scale, chaos = turbulence.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uWaves;
void main() {
  int N = int(uWaves + 0.5);
  float scl = mix(2.0, 5.0, uComplexity);
  vec2 p = uvAspect() * scl + uSeed * 0.1;
  float turb = uChaos * 2.0 * fbm(p * 0.8 + vec2(cos(uPhase), sin(uPhase)), 4);
  float re = 0.0, im = 0.0;
  for (int i = 0; i < 7; i++) {
    if (i >= N) break;
    float fi = float(i + 1);
    vec2 dir = vec2(cos(fi * 1.7 + uSeed.x), sin(fi * 2.3 + uSeed.y)) * fi;
    float dir2 = (i < 3) ? 1.0 : -1.0;
    float ph = dot(p, dir) + uPhase * dir2 + turb;
    re += cos(ph);
    im += sin(ph);
  }
  float mag = length(vec2(re, im)) / float(N);
  float hue = (atan(im, re) + PI) / TAU;
  vec3 col = pal(hue) * clamp(0.15 + mag * 1.3, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}`;

export const createPhaseField = makeShaderPiece({
  id: "phase-field",
  title: "Phase Field",
  tags: ["quantum", "math"],
  loopSeconds: 14,
  schema: {
    uWaves: { type: "int", min: 2, max: 7, default: 5, label: "waves" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uWaves", Number(p.uWaves)),
});
