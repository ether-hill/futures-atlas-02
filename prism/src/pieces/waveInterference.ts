// waveInterference — a ripple tank: several fixed point sources emit concentric
// waves that interfere. The double-slit / quantum motif. All sources share one
// uPhase (2π-periodic) so the loop is seamless. complexity = frequency, chaos =
// per-source phase offset.

import { COMMON } from "../shaders/common";
import { makeShaderPiece } from "../core/shaderPiece";

const FRAG =
  COMMON +
  /* glsl */ `
uniform float uSources;
uniform float uFreq;
void main() {
  int N = int(uSources + 0.5);
  vec2 uv = uvAspect();
  float amp = 0.0;
  float freq = uFreq * mix(0.6, 1.6, uComplexity);
  for (int i = 0; i < 8; i++) {
    if (i >= N) break;
    float fi = float(i);
    vec2 src = 0.62 * vec2(sin(uSeed.x * 0.7 + fi * 2.39), cos(uSeed.y * 0.5 + fi * 1.71));
    float d = length(uv - src);
    amp += sin(d * freq - uPhase + uChaos * 3.0 * sin(fi * 1.3));
  }
  amp /= float(N);
  float t = 0.5 + 0.5 * amp;
  fragColor = vec4(pal(t), 1.0);
}`;

export const createWaveInterference = makeShaderPiece({
  id: "wave-interference",
  title: "Wave Interference",
  tags: ["quantum", "physics", "math"],
  loopSeconds: 10,
  schema: {
    uSources: { type: "int", min: 2, max: 8, default: 4, label: "sources" },
    uFreq: { type: "number", min: 10, max: 60, step: 1, default: 28, label: "frequency" },
  },
  frag: FRAG,
  uniforms: (q, p) => q.f("uSources", Number(p.uSources)).f("uFreq", Number(p.uFreq)),
});
