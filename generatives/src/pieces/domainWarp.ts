// domainWarp — fbm domain warping (Quílez-style): noise warped by noise warped
// by noise, flowing like marbled ink / aurora. One GPU draw call; loops via the
// noise sample point circling in noise space. complexity = detail, chaos = warp.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uZoom;
uniform float uGlow;
void main() {
  float det = mix(0.7, 2.2, uComplexity);
  vec2 p = uvAspect() * uZoom * det + uSeed;
  float warp = mix(0.5, 3.0, uChaos);
  vec2 q = vec2(
    fbm(p + vec2(cos(uPhase), sin(uPhase)) * 0.35, 5),
    fbm(p + vec2(5.2, 1.3) + vec2(sin(uPhase), cos(uPhase)) * 0.35, 5));
  vec2 r = vec2(
    fbm(p + warp * q + vec2(1.7, 9.2), 6),
    fbm(p + warp * q + vec2(8.3, 2.8), 6));
  float v = fbm(p + warp * r, 6);
  float t = clamp(v * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = pal(t);
  col *= 0.45 + uGlow * length(r);
  fragColor = vec4(col, 1.0);
}`;

export const createDomainWarp = makeShaderPiece({
  id: "domain-warp",
  title: "Domain Warp",
  tags: ["flow", "nature", "noise"],
  loopSeconds: 18,
  schema: {
    zoom: { type: "number", min: 0.4, max: 3, step: 0.05, default: 1.4, label: "zoom" },
    glow: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.7, label: "glow" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uZoom", Number(p.zoom)).f("uGlow", Number(p.glow)),
});
