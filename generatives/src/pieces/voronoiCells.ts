// voronoiCells — animated Worley/Voronoi cellular field with glowing edges.
// Cell seeds orbit on sine paths (period 2π → seamless). complexity = density,
// chaos = seed wander.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uDensity;
uniform float uEdge;
void main() {
  float dens = uDensity * mix(0.6, 1.8, uComplexity) * 6.0;
  vec2 p = uvAspect() * dens;
  vec2 ip = floor(p), fp = fract(p);
  float d1 = 9.0, d2 = 9.0;
  vec2 idBest = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 hh = hash2(ip + g);
      vec2 o = 0.5 + 0.5 * sin(uPhase + TAU * hh + uChaos * 3.0 * hh.yx);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; idBest = ip + g; }
      else if (d < d2) { d2 = d; }
    }
  }
  float edge = sqrt(d2) - sqrt(d1);
  float glow = 1.0 - smoothstep(0.0, uEdge, edge);
  float cellTone = fract(sin(dot(idBest, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 col = pal(cellTone) * 0.5 + pal(0.95) * glow;
  fragColor = vec4(col, 1.0);
}`;

export const createVoronoiCells = makeShaderPiece({
  id: "voronoi-cells",
  title: "Voronoi Cells",
  tags: ["math", "nature"],
  loopSeconds: 16,
  schema: {
    uDensity: { type: "number", min: 0.5, max: 2.5, step: 0.05, default: 1.0, label: "density" },
    uEdge: { type: "number", min: 0.02, max: 0.4, step: 0.005, default: 0.12, label: "edge glow" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uDensity", Number(p.uDensity)).f("uEdge", Number(p.uEdge)),
});
