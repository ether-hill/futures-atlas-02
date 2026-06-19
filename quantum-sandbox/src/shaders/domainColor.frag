#version 300 es
// GPU twin of core/color/domainColoring.ts — SAME mapping, SAME constants, so
// CPU (Canvas2D/p5) and GPU (WebGL2) renders match. Samples a complex field
// (re, im) in the .rg channels of uField and writes domain-coloured RGBA.
//
// Keep the defaults below in lockstep with DC_DEFAULTS in domainColoring.ts.
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uField; // .r = Re(psi), .g = Im(psi)
uniform float uChroma;    // DC_DEFAULTS.chroma = 0.13
uniform float uLMin;      // 0.12
uniform float uLMax;      // 0.97
uniform float uLightGain; // 6.0
uniform float uHueOffset; // degrees
uniform float uBanded;    // 0 or 1
uniform float uBands;     // 7
uniform float uInvMaxMag; // 1.0 = no normalisation (log compressor handles it)

const float TAU = 6.28318530718;
const float D2R = 0.01745329252;

// OKLab → linear sRGB (Björn Ottosson)
vec3 oklabToLinear(float L, float a, float b) {
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}
bool inGamut(vec3 c) {
  return all(greaterThanEqual(c, vec3(-1e-4))) && all(lessThanEqual(c, vec3(1.0001)));
}
float toGamma(float c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}
// reduce chroma toward gamut at fixed hue (matches oklch.ts bisection)
vec3 oklchToSrgb(float L, float C, float hDeg) {
  float ch = cos(hDeg * D2R), sh = sin(hDeg * D2R);
  vec3 lin = oklabToLinear(L, C * ch, C * sh);
  if (!inGamut(lin)) {
    float lo = 0.0, hi = C;
    for (int i = 0; i < 16; i++) {
      float mid = 0.5 * (lo + hi);
      lin = oklabToLinear(L, mid * ch, mid * sh);
      if (inGamut(lin)) lo = mid; else hi = mid;
    }
    lin = oklabToLinear(L, lo * ch, lo * sh);
  }
  return clamp(vec3(toGamma(lin.r), toGamma(lin.g), toGamma(lin.b)), 0.0, 1.0);
}

void main() {
  vec2 z = texture(uField, vUv).rg;
  float mag = length(z) * uInvMaxMag;
  float arg = atan(z.y, z.x);

  float t = log(1.0 + uLightGain * mag);
  float s = t / (1.0 + t);
  if (uBanded > 0.5) {
    float f = s * uBands;
    float edge = abs(f - floor(f + 0.5));
    float ring = clamp(edge / 0.06, 0.0, 1.0);
    s *= 0.55 + 0.45 * ring;
  }
  float L = uLMin + (uLMax - uLMin) * s;

  float hue = mod((arg + 3.14159265359) / TAU * 360.0 + uHueOffset, 360.0);
  fragColor = vec4(oklchToSrgb(L, uChroma, hue), 1.0);
}
