/**
 * The window: one lighting model shared by every sketch.
 *
 * The default is the light of a Delft interior. One large, soft source high on
 * the left, a north window, so the form turns from light into shadow over a
 * long gradual halftone rather than at a hard terminator. That roll-off is the
 * "shoulder" a painter means. A little warm light comes back off the room on
 * the shadow side, and the plaster wall behind is lit most where it is nearest
 * the window.
 *
 * "Natural spectrum" means the light is given as a colour temperature, not an
 * RGB triple: the key is a black body at `kelvin`, the bounce off the room is
 * a low, warm 3000 K tinted by the umber of the walls. The tone curve then has
 * its own shoulder, so highlights compress the way film and paint do instead
 * of clipping to flat white.
 *
 * Params are declared here once; each sketch takes the ones it can use, and
 * every one of them arrives in GLSL as `u_<key>` like any other param.
 */
import type { ParamDef, Preset } from "./types";

export const WINDOW_PARAMS: ParamDef[] = [
  { key: "lightAz", label: "Window direction", group: "Light", kind: "range", min: -180, max: 180, step: 1, default: -60,
    hint: "Degrees around the form. −90 is straight from the left, 0 from behind the viewer." },
  { key: "lightEl", label: "Window height", group: "Light", kind: "range", min: -20, max: 85, step: 1, default: 30 },
  { key: "lightSize", label: "Window size", group: "Light", kind: "range", min: 0, max: 1, step: 0.01, default: 0.7,
    hint: "A bigger source rolls the light into the shadow more gradually, and softens the shadows it casts." },
  { key: "kelvin", label: "Colour temperature", group: "Light", kind: "range", min: 1800, max: 10000, step: 50, default: 5600,
    hint: "Of the window, in kelvin. 2000 is candle, 5600 daylight, 7500 an overcast north sky." },
  { key: "fill", label: "Room bounce", group: "Light", kind: "range", min: 0, max: 1, step: 0.01, default: 0.3,
    hint: "Warm light reflected back off the room into the shadow side." },
  { key: "shoulder", label: "Highlight shoulder", group: "Light", kind: "range", min: 0, max: 1, step: 0.01, default: 0.55,
    hint: "How softly the brightest tones roll off. Zero clips like a digital sensor; one is a long, painterly compression." },
  { key: "exposure", label: "Exposure", group: "Light", kind: "range", min: 0.2, max: 3, step: 0.01, default: 1 },
];

/** Lighting setups: the Light group's own presets. A setup only touches the
 *  keys a sketch has, so one list serves every sketch. */
export const LIGHT_SETUPS: Preset[] = [
  { name: "Window", values: {} },
  { name: "North sky", values: { lightAz: -35, lightEl: 55, lightSize: 0.95, kelvin: 7200, fill: 0.18, shoulder: 0.6 } },
  { name: "Raking", values: { lightAz: -96, lightEl: 9, lightSize: 0.28, kelvin: 5000, fill: 0.12, shoulder: 0.45 } },
  { name: "Candle", values: { lightAz: -48, lightEl: 6, lightSize: 0.32, kelvin: 2000, fill: 0.08, shoulder: 0.7, exposure: 1.25 } },
  { name: "Studio black", values: { lightAz: -40, lightEl: 38, lightSize: 0.18, kelvin: 6500, fill: 0, shoulder: 0.25, ground: 1, rim: 0.45 } },
];

/** GLSL for the shared model. Needs the WINDOW_PARAMS uniforms declared. */
export const LIGHT_GLSL = `
// Black-body colour, linear, normalised to unit luminance (after Helland's fit
// of the CIE 1964 data, 1000-40000 K).
vec3 kelvinRGB(float K) {
  float t = K / 100.0;
  vec3 c;
  c.r = t <= 66.0 ? 1.0 : clamp(1.29293618606 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
  c.g = t <= 66.0 ? clamp(0.39008157876 * log(t) - 0.63184144378, 0.0, 1.0)
                  : clamp(1.12989086089 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
  c.b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.54320678911 * log(t - 10.0) - 1.19625408914, 0.0, 1.0));
  c = pow(c, vec3(2.2));
  return c / dot(c, vec3(0.2126, 0.7152, 0.0722));
}
// Toward the window, in view space: x right, y up, z toward the viewer.
vec3 windowDir() {
  float az = radians(u_lightAz), el = radians(u_lightEl);
  return vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el));
}
// Toward the room's bounce: low, and opposite the window.
vec3 bounceDir() {
  vec3 w = windowDir();
  return normalize(vec3(-w.x, -0.35, max(0.25, w.z)));
}
vec3 keyColour() { return kelvinRGB(u_kelvin); }
// the room: 3000 K off umber plaster
vec3 bounceColour() { return kelvinRGB(3000.0) * vec3(1.0, 0.84, 0.62); }
// An area light seen by a diffuse surface: Lambert wrapped past the terminator
// in proportion to the source's size, and eased, so light turns into shadow
// over a long halftone instead of a line.
float windowDiffuse(float ndl) {
  float w = u_lightSize * 0.75;
  float d = clamp((ndl + w) / (1.0 + w), 0.0, 1.0);
  return pow(d, 1.0 + w);
}
// Exposure, then a tone curve with a variable shoulder: x / (1 + x^p)^(1/p).
// Slope 1 at black, so the shadows are untouched; p sets how early and how
// gently the highlights bend toward white.
vec3 toneMap(vec3 x) {
  x = max(x * u_exposure, 0.0);
  float p = mix(9.0, 1.25, u_shoulder);
  return x / pow(1.0 + pow(x, vec3(p)), vec3(1.0 / p));
}
vec3 encodeSRGB(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
// Triangular-distributed noise of one 8-bit step, so a slow gradient (the
// wall, a long halftone) does not band, on screen or in the video.
vec3 dither8(vec2 fc) {
  vec3 p3 = fract(vec3(fc.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  vec3 a = fract((p3.xxy + p3.yzz) * p3.zyx);
  p3 = fract(vec3(fc.yxy + 17.0) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  vec3 b = fract((p3.xxy + p3.yzz) * p3.zyx);
  return (a + b - 1.0) / 255.0;
}
`;
