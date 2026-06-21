// plasma — layered sinusoids + a drifting noise term, OKLCH-graded. Classic
// demoscene plasma, modernised. Every temporal term is uPhase (2π-periodic) so
// the loop is seamless. complexity = frequency, chaos = noise turbulence.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uScale;
uniform float uShift;
void main() {
  float scl = uScale * mix(1.0, 2.2, uComplexity);
  vec2 p = uvAspect() * scl;
  float v = 0.0;
  v += sin(p.x * 1.3 + uPhase);
  v += sin(p.y * 1.7 - uPhase);
  v += sin((p.x + p.y) * 0.9 + uPhase);
  v += sin(length(p) * 2.0 - uPhase);
  v += mix(0.0, 3.0, uChaos) * fbm(p * 0.7 + vec2(cos(uPhase), sin(uPhase)), 5);
  float t = fract(0.5 + 0.12 * v + uShift);
  fragColor = vec4(pal(t), 1.0);
}`;

export const createPlasma = makeShaderPiece({
  id: "plasma",
  title: "Plasma",
  tags: ["flow", "math"],
  loopSeconds: 12,
  schema: {
    uScale: { type: "number", min: 1, max: 6, step: 0.1, default: 2.6, label: "scale" },
    uShift: { type: "number", min: 0, max: 1, step: 0.01, default: 0, label: "colour shift" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uScale", Number(p.uScale)).f("uShift", Number(p.uShift)),
});
