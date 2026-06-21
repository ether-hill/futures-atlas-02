// voronoiCells — an animated Worley/Voronoi field, dressed up: the sample point
// is domain-warped first so the cells are organic blobs (not a regular grid), the
// borders glow (F2−F1) with a crisp bright edge line, each cell carries its own
// slowly-shifting palette hue, and a radial gradient toward the seed gives the
// cells depth. Seeds orbit in uPhase (seamless). Per-seed layout + expanded
// params (+ randomise) give wide variety. complexity = density, chaos = wander.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uDensity, uEdge, uWarp, uCellShade, uEdgeGlow;
void main() {
  vec2 uv = uvAspect();
  vec2 drift = vec2(cos(uPhase), sin(uPhase));
  // domain warp → organic, wandering cell shapes
  uv += uWarp * 0.18 * vec2(fbm(uv * 1.6 + drift + uSeed.x, 4),
                            fbm(uv * 1.6 - drift + uSeed.y, 4));
  float dens = uDensity * mix(3.0, 9.0, uComplexity);
  vec2 p = uv * dens + uSeed * 6.0;
  vec2 ip = floor(p), fp = fract(p);

  float d1 = 9.0, d2 = 9.0;
  vec2 idBest = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 hh = hash2(ip + g) * 0.5 + 0.5;
      vec2 o = 0.5 + 0.5 * sin(uPhase + TAU * hh + uChaos * 3.0 * hh.yx);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; idBest = ip + g; }
      else if (d < d2) { d2 = d; }
    }
  }

  float edge = sqrt(d2) - sqrt(d1);
  float glow = 1.0 - smoothstep(0.0, uEdge, edge);          // soft border glow
  float line = 1.0 - smoothstep(0.0, uEdge * 0.32, edge);   // crisp border line
  float tone = fract(sin(dot(idBest, vec2(12.9898, 78.233))) * 43758.5453);

  vec3 cell = pal(fract(tone + 0.12 * sin(uPhase + tone * TAU)));
  cell *= mix(1.0, 1.0 - uCellShade, smoothstep(0.0, 0.7, sqrt(d1))); // depth toward edges
  vec3 col = cell + pal(0.97) * glow * uEdgeGlow + vec3(line) * 0.25;
  fragColor = vec4(col, 1.0);
}`;

export const createVoronoiCells = makeShaderPiece({
  id: "voronoi-cells",
  title: "Voronoi Cells",
  tags: ["math", "nature"],
  loopSeconds: 18,
  schema: {
    uDensity: { type: "number", min: 0.5, max: 2.5, step: 0.05, default: 1.0, label: "density" },
    uEdge: { type: "number", min: 0.02, max: 0.5, step: 0.005, default: 0.16, label: "edge glow" },
    uWarp: { type: "number", min: 0, max: 2.5, step: 0.05, default: 0.9, label: "warp" },
    uCellShade: { type: "number", min: 0, max: 1, step: 0.02, default: 0.55, label: "cell shade" },
    uEdgeGlow: { type: "number", min: 0, max: 2, step: 0.05, default: 1.0, label: "edge bright" },
  },
  frag: FRAG,
  uniforms: (q, p) =>
    q
      .f("uDensity", Number(p.uDensity))
      .f("uEdge", Number(p.uEdge))
      .f("uWarp", Number(p.uWarp))
      .f("uCellShade", Number(p.uCellShade))
      .f("uEdgeGlow", Number(p.uEdgeGlow)),
});
