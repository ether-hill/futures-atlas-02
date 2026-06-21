// plasma — iridescent domain-warped flow. Instead of flat summed sinusoids, the
// field is built by warping fbm through itself twice (Iñigo Quílez domain
// warping): q = fbm(p), r = fbm(p + warp·q), f = fbm(p + warp·r). The warp
// magnitude drives an iridescent two-tone palette blend with a ridge sheen, so
// it reads like flowing oil-on-water / aurora rather than a demoscene gradient.
// All motion is circular in uPhase (cos/sin) → seamless loop. Per-seed offset +
// expanded params (+ randomise) give wide variety. complexity = scale/detail,
// chaos = warp turbulence.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uScale, uWarp, uOct, uContrast, uShift, uGlow;
void main() {
  int oct = int(uOct + 0.5);
  float scl = uScale * mix(1.0, 2.2, uComplexity);
  vec2 p = uvAspect() * scl + uSeed * 4.0;
  vec2 drift = vec2(cos(uPhase), sin(uPhase));     // seamless circular motion
  float warp = uWarp * (0.6 + uChaos * 1.4);

  vec2 q = vec2(fbm(p + drift, oct),
                fbm(p + drift.yx + vec2(5.2, 1.3), oct));
  vec2 r = vec2(fbm(p + warp * q + 1.2 * drift + vec2(1.7, 9.2), oct),
                fbm(p + warp * q - 1.2 * drift + vec2(8.3, 2.8), oct));
  float f = fbm(p + warp * r, oct);

  float base = 0.5 + 0.5 * f;
  float t = fract(base * uContrast + 0.28 * length(r) + uShift);
  vec3 col = pal(t);
  // iridescence: blend a phase-shifted palette pull where the warp is strongest
  col = mix(col, pal(fract(t + 0.42)), 0.5 * clamp(length(q), 0.0, 1.0));
  // bright sheen riding the warp ridges
  col += pal(0.96) * pow(clamp(length(r), 0.0, 1.0), 3.0) * uGlow;
  fragColor = vec4(col, 1.0);
}`;

export const createPlasma = makeShaderPiece({
  id: "plasma",
  title: "Plasma Flow",
  tags: ["flow", "math"],
  loopSeconds: 18,
  schema: {
    uScale: { type: "number", min: 0.8, max: 6, step: 0.1, default: 2.4, label: "scale" },
    uWarp: { type: "number", min: 0, max: 3.5, step: 0.05, default: 1.6, label: "warp" },
    uOct: { type: "int", min: 2, max: 7, default: 5, label: "detail" },
    uContrast: { type: "number", min: 0.5, max: 2.5, step: 0.05, default: 1.2, label: "contrast" },
    uShift: { type: "number", min: 0, max: 1, step: 0.01, default: 0, label: "colour shift" },
    uGlow: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.55, label: "glow" },
  },
  frag: FRAG,
  uniforms: (q, p) =>
    q
      .f("uScale", Number(p.uScale))
      .f("uWarp", Number(p.uWarp))
      .f("uOct", Number(p.uOct))
      .f("uContrast", Number(p.uContrast))
      .f("uShift", Number(p.uShift))
      .f("uGlow", Number(p.uGlow)),
});
