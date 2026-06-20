// Shared GLSL prelude for fullscreen-shader pieces: version/precision, the
// common uniforms, aspect-correct UV, gradient-noise + fbm, and a palette
// sampler. Each piece appends its own `void main(){…}`.

export const COMMON = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;        // loop-phase seconds
uniform float uPhase;       // 0..2π over one loop (use for seamless motion)
uniform float uComplexity;  // 0..1
uniform float uChaos;       // 0..1
uniform vec2  uSeed;
uniform sampler2D uPalette; // 256x1 theme ramp

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// aspect-correct centred coords (y in [-0.5,0.5])
vec2 uvAspect() {
  return (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
}

vec3 pal(float t) {
  return texture(uPalette, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
}

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
}

float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0, 0)), f - vec2(0, 0)), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
    mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x),
    u.y);
}

float fbm(vec2 p, int oct) {
  float a = 0.5, s = 0.0, n = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    s += a * gnoise(p);
    n += a;
    p *= 2.0;
    a *= 0.5;
  }
  return n > 0.0 ? s / n : 0.0;
}
`;
