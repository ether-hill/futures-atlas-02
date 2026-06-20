// cymatics — standing-wave nodal figures (Chladni plates / square-well modes),
// a superposition of sin eigenmodes whose weights rotate so the figure morphs.
// Single-pass shader (no feedback) → cheap. complexity = mode numbers, chaos =
// cross-mode mixing. Bright nodal lines over a tinted field.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uModes;
void main() {
  vec2 uv = vUv;
  int K = int(uModes + 0.5);
  float Nmax = mix(3.0, 9.0, uComplexity);
  float v = 0.0;
  for (int k = 0; k < 7; k++) {
    if (k >= K) break;
    vec2 hh = hash2(uSeed + vec2(float(k) * 3.1, 1.7));
    float n = floor(1.5 + (hh.x * 0.5 + 0.5) * Nmax);
    float m = floor(1.5 + (hh.y * 0.5 + 0.5) * Nmax);
    float w = cos(uPhase + float(k) * 1.7);
    v += w * (sin(n * PI * uv.x) * sin(m * PI * uv.y)
            + uChaos * sin(m * PI * uv.x) * sin(n * PI * uv.y));
  }
  v /= float(K);
  float nodal = 1.0 - smoothstep(0.0, 0.05, abs(v));
  vec3 col = pal(0.5 + 0.45 * v) * (0.45 + 0.55 * abs(v));
  col += pal(0.96) * nodal * 0.7;
  fragColor = vec4(col, 1.0);
}`;

export const createCymatics = makeShaderPiece({
  id: "cymatics",
  title: "Cymatics",
  tags: ["physics", "nature", "quantum"],
  loopSeconds: 16,
  schema: {
    uModes: { type: "int", min: 2, max: 7, default: 4, label: "modes" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uModes", Number(p.uModes)),
});
