/**
 * The shared studio for every signed-distance sketch: camera, march, normals,
 * occlusion and one lighting model, so the specimens read as one set and a new
 * one is only its `map()`.
 *
 * A sketch supplies GLSL defining `float map(vec3 p)` (p already in object
 * space), `BOUND` (radius of a sphere containing the form, which is what lets
 * empty pixels cost nothing; may read uniforms) and `SHADE_R` (the radius the
 * depth shadow is measured against: the outer surface, not the spines). Optional helpers it may use: hash,
 * value noise, smin, and the spherical Fibonacci lattice in `SF_GLSL`.
 *
 * Light is the window in light.ts: a specimen on a table by a north window,
 * the interior falling into shadow. Material, ground, depth and rim are the
 * studio's own dials, appended to every sketch under "Light".
 *
 * Motion. Every sketch is a function of time as well as of its values, and
 * everything that moves repeats on one period, `cycle`: the turntable makes
 * whole turns in it, the nod is one sine of it, and a sketch's own motion
 * (`PH`, the phase, and `EV`, how much) must close on it too. A video exactly
 * one cycle long therefore loops without a seam. The light does not move with
 * the form: it is the room's, so the turning form passes through it.
 */
import { orbitMatrix, program, uniformDecls } from "./gl";
import { LIGHT_GLSL, WINDOW_PARAMS } from "./light";
import type { ParamDef, Renderer, Sketch, Values, View } from "./types";

export const CAMERA_PARAMS: ParamDef[] = [
  { key: "yaw", label: "Yaw", kind: "range", min: -Math.PI, max: Math.PI, step: 0.001, default: 0, hidden: true },
  { key: "pitch", label: "Pitch", kind: "range", min: -1.55, max: 1.55, step: 0.001, default: 0, hidden: true },
  { key: "zoom", label: "Zoom", kind: "range", min: 0.5, max: 3, step: 0.001, default: 1, hidden: true },
];

export const MOTION_PARAMS: ParamDef[] = [
  { key: "cycle", label: "Cycle", group: "Motion", kind: "range", min: 4, max: 60, step: 0.5, default: 20,
    hint: "Seconds. Every motion repeats on this period, so a video this long, or any whole multiple of it, loops without a seam." },
  { key: "turns", label: "Turntable", group: "Motion", kind: "range", min: -3, max: 3, step: 1, default: 1,
    hint: "Whole turns per cycle. Negative turns the other way." },
  { key: "sway", label: "Nod", group: "Motion", kind: "range", min: 0, max: 0.6, step: 0.01, default: 0.12,
    hint: "The form tips toward you and back once a cycle." },
  { key: "evolve", label: "Evolve", group: "Motion", kind: "range", min: 0, max: 1, step: 0.01, default: 0.5,
    hint: "How far the form itself moves: what moves depends on the sketch." },
];

export const STUDIO_PARAMS: ParamDef[] = [
  { key: "material", label: "Material", group: "Light", kind: "choice", default: 0, options: [
    { value: 0, label: "Chalk" },
    { value: 1, label: "Bone" },
    { value: 2, label: "Pewter" },
  ] },
  { key: "ground", label: "Ground", group: "Light", kind: "choice", default: 0, options: [
    { value: 0, label: "Grey wall" },
    { value: 1, label: "Black" },
  ] },
  { key: "depth", label: "Depth shadow", group: "Light", kind: "range", min: 0, max: 1, step: 0.01, default: 0.7,
    hint: "How far the inside of the form falls into darkness." },
  { key: "rim", label: "Rim glow", group: "Light", kind: "range", min: 0, max: 1.5, step: 0.01, default: 0.2 },
];

/** Where a timed sketch's camera points at time t: the user's own orbit plus
 *  the turntable and the nod. */
export function motionAngles(values: Values, time: number): [number, number] {
  const cycle = Math.max(0.1, values.cycle ?? 20);
  const ph = (2 * Math.PI * time) / cycle;
  const yaw = (values.yaw ?? 0) + (values.turns ?? 0) * ph;
  const pitch = Math.max(-1.55, Math.min(1.55, (values.pitch ?? 0) + (values.sway ?? 0) * Math.sin(ph)));
  return [yaw, pitch];
}

/** Spherical Fibonacci lattice: nearest point, and the smooth distance to the
 *  Voronoi cell walls, for a unit direction. After Keinert et al. (2015), with
 *  the candidate window widened to 4×4 in `sfCells` so the second-nearest
 *  point (and so the cell edge) is found, not just the nearest. */
export const SF_GLSL = `
const float PHI = 1.61803398875;
struct SFCell { float edge; vec3 c; };
vec3 sfPoint(float i, float n) {
  float ph = 2.0 * PI * fract(i * PHI);
  float ct = 1.0 - (2.0 * i + 1.0) / n;
  float st = sqrt(max(0.0, 1.0 - ct * ct));
  return vec3(cos(ph) * st, sin(ph) * st, ct);
}
// the lattice basis around p: index steps F, and the cell c it falls in
void sfBasis(vec3 p, float n, out vec2 F, out vec2 c) {
  float m = 1.0 - 1.0 / n;
  float ph = min(atan(p.y, p.x), PI);
  float ct = p.z;
  float k = max(2.0, floor(log(n * PI * sqrt(5.0) * (1.0 - ct * ct)) / log(PHI * PHI)));
  float Fk = pow(PHI, k) / sqrt(5.0);
  F = vec2(round(Fk), round(Fk * PHI));
  vec2 ka = 2.0 * F / n;
  vec2 kb = 2.0 * PI * (fract((F + 1.0) * PHI) - (PHI - 1.0));
  mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
  c = floor(iB * vec2(ph, ct - m));
}
// nearest lattice point only: four candidates, as in the paper. Cheap enough
// to call at every step of the march, which is what beams and spines need.
vec3 sfNearest(vec3 p, float n) {
  vec2 F, c;
  sfBasis(p, n, F, c);
  float bestD = -2.0;
  vec3 best = vec3(0.0, 0.0, 1.0);
  for (int s = 0; s < 4; s++) {
    float i = dot(F, vec2(float(s % 2), float(s / 2)) + c);
    if (i < 0.0 || i > n - 1.0) continue;
    vec3 pt = sfPoint(i, n);
    float d = dot(pt, p);
    if (d > bestD) { bestD = d; best = pt; }
  }
  return best;
}
// nearest point AND the smoothed distance to its cell walls: sixteen
// candidates. Only worth it within reach of a shell.
SFCell sfCells(vec3 p, float n, float web) {
  vec2 F, c;
  sfBasis(p, n, F, c);
  // Every array index below is the loop counter, so once unrolled it is a
  // constant and q stays in registers. Indexing by a running count instead
  // (q[cnt++]) put the array in scratch memory and made this 2x slower.
  vec3 q[16];
  vec3 a = vec3(0.0, 0.0, 1.0);
  float bestD = -2.0;
  for (int s = 0; s < 16; s++) {
    float i = dot(F, vec2(float(s % 4) - 1.0, float(s / 4) - 1.0) + c);
    bool ok = i >= 0.0 && i <= n - 1.0;
    vec3 pt = ok ? sfPoint(i, n) : vec3(0.0);
    q[s] = pt;
    float d = ok ? dot(pt, p) : -3.0;
    if (d > bestD) { bestD = d; a = pt; }
  }
  float e = 1.0;
  for (int s = 0; s < 16; s++) {
    vec3 ab = a - q[s];
    float l = length(ab);
    // skips a itself, duplicates, and the empty slots (|a - 0| = 1 but q = 0)
    if (l < 1e-5 || dot(q[s], q[s]) < 0.5) continue;
    e = smin(e, dot(p, ab) / l, web);
  }
  return SFCell(e, a);
}
`;

const COMMON = `
#define PI 3.14159265359
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
                 mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                 mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 vnoise3(vec3 x) { return vec3(vnoise(x), vnoise(x + 17.13), vnoise(x + 41.7)) - 0.5; }
float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
`;

function frag(sketchGlsl: string, params: ParamDef[], stepScale: number): string {
  return `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_res;
uniform mat3 u_view;
uniform float u_fast;
uniform float u_play;
uniform float u_time;
uniform vec2 u_jitter;
uniform float u_dither;
${uniformDecls(params)}
// the phase of the cycle, and how much the form's own motion is worth
#define PH (6.28318530718 * u_time / max(u_cycle, 0.1))
#define EV u_evolve
${COMMON}
${LIGHT_GLSL}
${sketchGlsl}

vec3 calcNormal(vec3 p, float h) {
  const vec2 k = vec2(1, -1);
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) +
                   k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  int taps = u_fast > 0.5 ? 2 : (u_play > 0.5 ? 3 : 5);
  for (int i = 0; i < 5; i++) {
    if (i >= taps) break;
    float h = 0.012 + 0.07 * float(i);
    occ += (h - map(p + h * n)) * sca;
    sca *= 0.82;
  }
  return clamp(1.0 - 2.6 * occ, 0.0, 1.0);
}
// k is the penumbra: small for a big window
// Bounded by the form's own sphere: once the ray has left BOUND nothing can
// shade it, so a shadow ray costs only the crossing, not a fixed distance.
float softShadow(vec3 ro, vec3 rd, float k) {
  if (u_fast > 0.5) return 1.0;
  float b = dot(ro, rd), c = dot(ro, ro) - BOUND * BOUND;
  float tMax = -b + sqrt(max(b * b - c, 0.0));
  float res = 1.0, t = 0.02;
  int n = u_play > 0.5 ? 16 : 32;
  for (int i = 0; i < 32; i++) {
    if (i >= n) break;
    float h = map(ro + rd * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.015, 0.16);
    if (res < 0.005 || t > tMax) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
// The wall behind: lit most on the window side, falling off across the
// frame, with a faint grain so it reads as a surface, not a gradient.
vec3 ground(vec2 uv) {
  if (u_ground > 0.5) return vec3(0.0);
  vec3 w = windowDir();
  vec2 src = normalize(w.xy + vec2(1e-4)) * 1.7;
  float d = length(uv - src);
  float pool = exp(-d * d * 0.2);
  float v = 0.004 + 0.04 * pool;
  v *= 0.94 + 0.12 * vnoise(vec3(uv * 7.0, 3.1)) + 0.05 * vnoise(vec3(uv * 31.0, 7.7));
  return vec3(v);
}

void main() {
  vec2 fc = gl_FragCoord.xy + u_jitter;
  vec2 uv = (2.0 * fc - u_res) / min(u_res.x, u_res.y);
  float camD = 3.6 / u_zoom;
  vec3 ro = vec3(0.0, 0.0, camD);
  vec3 rd = normalize(vec3(uv, -2.6));
  // rotate the camera rather than the form, so map() works in object space
  vec3 col = ground(uv);

  // bounding sphere
  float b = dot(ro, rd), c = dot(ro, ro) - BOUND * BOUND;
  float disc = b * b - c;
  if (disc > 0.0) {
    float t = max(0.0, -b - sqrt(disc));
    float tEnd = -b + sqrt(disc);
    bool hit = false;
    int maxSteps = u_fast > 0.5 ? 120 : (u_play > 0.5 ? 160 : 260);
    for (int i = 0; i < 260; i++) {
      if (i >= maxSteps) break;
      vec3 p = u_view * (ro + rd * t);
      float d = map(p);
      if (d < 0.00045 * t) { hit = true; break; }
      t += d * ${stepScale.toFixed(2)};
      if (t > tEnd) break;
    }
    if (hit) {
      vec3 pw = ro + rd * t;
      vec3 p = u_view * pw;
      vec3 n = calcNormal(p, 0.0006 * t);
      vec3 vdir = u_view * (-rd);
      vec3 L = u_view * windowDir();
      vec3 Lb = u_view * bounceDir();
      float ndl = dot(n, L);
      float dif = windowDiffuse(ndl);
      float sh = softShadow(p + n * 0.004, L, mix(16.0, 2.2, u_lightSize));
      float ao = calcAO(p, n);
      // the window also lights broadly, as a hemisphere facing it
      float sky = 0.5 + 0.5 * ndl;
      float bnc = pow(clamp(dot(n, Lb) * 0.5 + 0.5, 0.0, 1.0), 2.0);
      float fre = pow(clamp(1.0 + dot(n, -vdir), 0.0, 1.0), 3.0);
      // material: albedo, specular weight, sharpness
      vec3 alb = vec3(0.86);
      float ks = 0.025, shin = 10.0;
      if (u_material > 1.5) { alb = vec3(0.30); ks = 0.55; shin = 70.0; }
      else if (u_material > 0.5) { alb = vec3(0.74); ks = 0.05; shin = 18.0; }
      // a big source gives a broad highlight, not a pinpoint
      shin *= mix(1.0, 0.3, u_lightSize);
      vec3 hv = normalize(L + vdir);
      float spe = pow(clamp(dot(n, hv), 0.0, 1.0), shin) * (shin + 2.0) / 8.0;
      spe *= (0.04 + 0.96 * fre) * clamp(ndl * 4.0, 0.0, 1.0) * sh;
      vec3 key = keyColour(), room = bounceColour();
      // inside falls into darkness, measured against the bound
      float rr = clamp(length(p) / SHADE_R, 0.0, 1.0);
      float deep = mix(1.0, smoothstep(0.35, 1.0, rr), u_depth);
      vec3 lit = key * dif * sh * 1.35 * mix(1.0, ao, 0.5);
      lit += (key * sky * 0.07 + room * bnc * u_fill * 0.42) * ao;
      col = alb * lit;
      col += key * ks * spe * mix(1.0, ao, 0.5);
      col += alb * key * fre * u_rim * ao * 0.35;
      col *= deep;
    }
  }
  col = encodeSRGB(toneMap(col));
  if (u_dither > 0.5) col += dither8(gl_FragCoord.xy + fract(u_time * 7.31) * 113.0);
  outColor = vec4(col, 1.0);
}`;
}

/** A full frame drawn in one call is split into tiles with a finish between
 *  them, so the GPU is never handed one draw long enough to trip the driver's
 *  watchdog. (The lab avoids full frames entirely: see progressive.ts.) */
const TILE = 256;

export function raymarchSketch(
  def: Omit<Sketch, "create" | "orbit" | "animated" | "timed" | "params"> & {
    params: ParamDef[];
    glsl: string;
    /** Fraction of the distance to step. Lower for fields that overestimate
     *  (domain warps, varying frequency). */
    stepScale?: number;
  },
): Sketch {
  const params = [...def.params, ...MOTION_PARAMS, ...WINDOW_PARAMS, ...STUDIO_PARAMS, ...CAMERA_PARAMS];
  const src = frag(def.glsl, params, def.stepScale ?? 0.8);
  return {
    id: def.id,
    title: def.title,
    family: def.family,
    blurb: def.blurb,
    method: def.method,
    sources: def.sources,
    presets: def.presets,
    params,
    orbit: true,
    animated: false,
    timed: true,
    create(gl): Renderer {
      const p = program(gl, src);
      // low-resolution target for preview passes, blitted up to the canvas
      let fbo: WebGLFramebuffer | null = null;
      let tex: WebGLTexture | null = null;
      let fw = 0, fh = 0;
      const target = (w: number, h: number) => {
        if (fbo && fw === w && fh === h) return fbo;
        if (tex) gl.deleteTexture(tex);
        if (fbo) gl.deleteFramebuffer(fbo);
        tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
        fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        fw = w;
        fh = h;
        return fbo;
      };

      return {
        tiles: true,
        draw(values: Values, view: View) {
          const time = view.time ?? 0;
          gl.useProgram(p.prog);
          gl.uniform1f(p.loc("u_fast"), view.fast ? 1 : 0);
          gl.uniform1f(p.loc("u_play"), view.play ? 1 : 0);
          gl.uniform1f(p.loc("u_time"), time);
          gl.uniform1f(p.loc("u_dither"), view.dither === false ? 0 : 1);
          gl.uniform2f(p.loc("u_jitter"), view.jitter?.[0] ?? 0, view.jitter?.[1] ?? 0);
          gl.uniformMatrix3fv(p.loc("u_view"), false, orbitMatrix(...motionAngles(values, time)));

          if (view.scale && view.scale < 1) {
            const sw = Math.max(1, Math.round(view.w * view.scale));
            const sh = Math.max(1, Math.round(view.h * view.scale));
            gl.bindFramebuffer(gl.FRAMEBUFFER, target(sw, sh));
            gl.viewport(0, 0, sw, sh);
            gl.uniform2f(p.loc("u_res"), sw, sh);
            p.run(values);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
            gl.blitFramebuffer(0, 0, sw, sh, 0, 0, view.w, view.h, gl.COLOR_BUFFER_BIT, gl.LINEAR);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
          }

          gl.bindFramebuffer(gl.FRAMEBUFFER, view.target ?? null);
          gl.viewport(0, 0, view.w, view.h);
          gl.uniform2f(p.loc("u_res"), view.w, view.h);
          gl.enable(gl.SCISSOR_TEST);
          if (view.rect) {
            gl.scissor(...view.rect);
            p.run(values);
          } else {
            for (let y = 0; y < view.h; y += TILE) {
              for (let x = 0; x < view.w; x += TILE) {
                gl.scissor(x, y, TILE, TILE);
                p.run(values);
                gl.finish();
              }
            }
          }
          gl.disable(gl.SCISSOR_TEST);
        },
        dispose() {
          p.dispose();
          if (tex) gl.deleteTexture(tex);
          if (fbo) gl.deleteFramebuffer(fbo);
        },
      };
    },
  };
}
