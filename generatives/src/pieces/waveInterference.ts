// waveInterference — a ripple tank elevated into a kaleidoscopic interference
// field: up to 12 point sources slowly orbit (seamless in uPhase) and emit
// concentric waves; their summed amplitude is mapped through a banded colour
// function for crisp fringes, with bright antinode crests glowing on top, and an
// optional n-fold mirror symmetry that turns the interference into a breathing
// mandala. Per-seed source placement + expanded params (+ randomise) give wide
// variety. complexity = frequency, chaos = phase scatter.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uSources, uFreq, uSym, uBands, uGlow;
void main() {
  vec2 uv = uvAspect();
  // optional kaleidoscopic mirror symmetry
  if (uSym > 1.5) {
    float a = atan(uv.y, uv.x);
    float rr = length(uv);
    float w = TAU / uSym;
    a = abs(mod(a, w) - w * 0.5);
    uv = rr * vec2(cos(a), sin(a));
  }
  int N = int(uSources + 0.5);
  float freq = uFreq * mix(0.6, 1.6, uComplexity);
  float amp = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= N) break;
    float fi = float(i);
    vec2 base = 0.6 * vec2(sin(uSeed.x * 0.7 + fi * 2.39), cos(uSeed.y * 0.5 + fi * 1.71));
    vec2 src = base + 0.12 * vec2(cos(uPhase + fi), sin(uPhase + fi * 1.3)); // seamless orbit
    float d = length(uv - src);
    amp += sin(d * freq - uPhase + uChaos * 3.0 * sin(fi * 1.3));
  }
  amp /= float(N);

  float band = sin(amp * uBands * PI);          // crisp periodic fringes
  float t = 0.5 + 0.5 * band;
  vec3 col = pal(t);
  col += pal(0.97) * pow(0.5 + 0.5 * amp, 8.0) * uGlow; // bright antinode crests
  fragColor = vec4(col, 1.0);
}`;

export const createWaveInterference = makeShaderPiece({
  id: "wave-interference",
  title: "Wave Interference",
  tags: ["quantum", "physics", "math"],
  loopSeconds: 14,
  schema: {
    uSources: { type: "int", min: 2, max: 12, default: 5, label: "sources" },
    uFreq: { type: "number", min: 8, max: 70, step: 1, default: 30, label: "frequency" },
    uSym: { type: "int", min: 1, max: 12, default: 1, label: "symmetry" },
    uBands: { type: "number", min: 1, max: 6, step: 0.1, default: 2.5, label: "fringes" },
    uGlow: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.5, label: "glow" },
  },
  frag: FRAG,
  uniforms: (q, p) =>
    q
      .f("uSources", Number(p.uSources))
      .f("uFreq", Number(p.uFreq))
      .f("uSym", Number(p.uSym))
      .f("uBands", Number(p.uBands))
      .f("uGlow", Number(p.uGlow)),
});
