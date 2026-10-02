import { program, uniformDecls } from "../gl";
import type { ParamDef, Renderer, Sketch, Values, View } from "../types";

/**
 * Gray–Scott reaction–diffusion in a round dish, lit as a relief. The only
 * animated sketch so far: the pattern is the state of a simulation, so it is
 * grown rather than drawn, and it stops once it has had STEP_BUDGET steps.
 */

const SIM = 512;
const STEP_BUDGET = 16000;

const params: ParamDef[] = [
  { key: "feed", label: "Feed rate", kind: "range", min: 0.01, max: 0.1, step: 0.0001, default: 0.0545,
    hint: "How fast the first chemical is topped up." },
  { key: "kill", label: "Kill rate", kind: "range", min: 0.04, max: 0.075, step: 0.0001, default: 0.062,
    hint: "How fast the second decays. Feed and kill together choose the pattern." },
  { key: "ratio", label: "Diffusion ratio", kind: "range", min: 0.3, max: 0.7, step: 0.001, default: 0.5 },
  { key: "gradient", label: "Feed gradient", kind: "range", min: -0.03, max: 0.03, step: 0.0001, default: 0,
    hint: "Feed changes from centre to rim, so the pattern changes as it spreads." },
  { key: "speed", label: "Steps per frame", kind: "range", min: 1, max: 60, step: 1, default: 24 },
  { key: "seed", label: "Seed", group: "Start", kind: "range", min: 0, max: 999, step: 1, default: 3 },
  { key: "density", label: "Seed density", group: "Start", kind: "range", min: 0.01, max: 0.6, step: 0.01, default: 0.12 },
  { key: "dish", label: "Round dish", group: "Start", kind: "toggle", default: 1 },
  { key: "relief", label: "Relief", group: "Light", kind: "range", min: 0, max: 12, step: 0.1, default: 5 },
  { key: "light", label: "Light angle", group: "Light", kind: "range", min: -3.14, max: 3.14, step: 0.01, default: 2.3 },
  { key: "invert", label: "Invert", group: "Light", kind: "toggle", default: 0 },
];

const HEAD = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D u_state;
uniform vec2 u_res;
${uniformDecls(params)}
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float inDish(vec2 uv) { return u_dish > 0.5 ? step(length(uv - 0.5), 0.47) : 1.0; }
`;

const INIT = `${HEAD}
void main() {
  vec2 uv = gl_FragCoord.xy / float(${SIM});
  float b = 0.0;
  // a jittered blob in some of the cells of a coarse grid
  vec2 g = uv * 28.0;
  vec2 id = floor(g);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = id + vec2(x, y);
    float h = hash12(c + u_seed * 7.31);
    if (h > u_density) continue;
    vec2 ctr = c + 0.5 + (vec2(hash12(c * 1.7 + u_seed), hash12(c * 2.9 - u_seed)) - 0.5) * 0.8;
    float r = 0.18 + 0.25 * hash12(c * 3.3 + u_seed);
    if (length(g - ctr) < r) b = 1.0;
  }
  b *= inDish(uv);
  outColor = vec4(1.0, b, 0.0, 1.0);
}`;

const STEP = `${HEAD}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 mx = ivec2(${SIM - 1});
  vec2 c = texelFetch(u_state, p, 0).xy;
  vec2 lap = -c;
  lap += 0.2 * (texelFetch(u_state, clamp(p + ivec2(1, 0), ivec2(0), mx), 0).xy +
                texelFetch(u_state, clamp(p - ivec2(1, 0), ivec2(0), mx), 0).xy +
                texelFetch(u_state, clamp(p + ivec2(0, 1), ivec2(0), mx), 0).xy +
                texelFetch(u_state, clamp(p - ivec2(0, 1), ivec2(0), mx), 0).xy);
  lap += 0.05 * (texelFetch(u_state, clamp(p + ivec2(1, 1), ivec2(0), mx), 0).xy +
                 texelFetch(u_state, clamp(p + ivec2(-1, 1), ivec2(0), mx), 0).xy +
                 texelFetch(u_state, clamp(p + ivec2(1, -1), ivec2(0), mx), 0).xy +
                 texelFetch(u_state, clamp(p + ivec2(-1, -1), ivec2(0), mx), 0).xy);
  vec2 uv = (vec2(p) + 0.5) / float(${SIM});
  float f = u_feed + u_gradient * (length(uv - 0.5) * 2.0 - 0.5);
  float a = c.x, b = c.y;
  float abb = a * b * b;
  a += 1.0 * lap.x - abb + f * (1.0 - a);
  b += u_ratio * lap.y + abb - (u_kill + f) * b;
  float m = inDish(uv);
  outColor = vec4(mix(1.0, clamp(a, 0.0, 1.0), m), clamp(b, 0.0, 1.0) * m, 0.0, 1.0);
}`;

const SHOW = `${HEAD}
void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - u_res) / min(u_res.x, u_res.y);
  vec2 t = uv * 0.5 + 0.5;
  if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) { outColor = vec4(0, 0, 0, 1); return; }
  vec2 px = 1.0 / vec2(${SIM});
  float h = texture(u_state, t).y;
  float hx = texture(u_state, t + vec2(px.x, 0)).y - texture(u_state, t - vec2(px.x, 0)).y;
  float hy = texture(u_state, t + vec2(0, px.y)).y - texture(u_state, t - vec2(0, px.y)).y;
  vec3 n = normalize(vec3(-hx * u_relief, -hy * u_relief, 1.0));
  vec3 L = normalize(vec3(cos(u_light), sin(u_light), 0.9));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  float body = smoothstep(0.08, 0.32, h);
  if (u_invert > 0.5) body = 1.0 - body;
  vec3 col = vec3(0.93, 0.92, 0.9) * body * (0.25 + 0.85 * dif);
  col += vec3(0.25) * pow(clamp(dot(reflect(-L, n), vec3(0, 0, 1)), 0.0, 1.0), 20.0) * body;
  float rim = u_dish > 0.5 ? smoothstep(0.47, 0.465, length(t - 0.5)) : 1.0;
  outColor = vec4(pow(col * rim, vec3(0.4545)), 1.0);
}`;

/** What the starting state depends on: change one and the dish is reseeded. */
function sig(v: Values): string {
  return `${v.seed}|${v.density}|${v.dish}`;
}
/** What the chemistry depends on: change one and the run carries on from where
 *  it is with a fresh step budget, so a pattern can be pushed into another. */
function chem(v: Values): string {
  return `${v.feed}|${v.kill}|${v.ratio}|${v.gradient}`;
}

export const reactionDiffusion: Sketch = {
  id: "reaction-diffusion",
  title: "Dish",
  family: "Reaction–diffusion",
  blurb:
    "Two chemicals, one feeding on the other, both spreading. Turing proposed in 1952 that this is how a leopard gets its spots; here it grows coral, mazes and dividing cells.",
  method: [
    "Every pixel of a 512 × 512 grid holds two concentrations. Each step, both spread to their neighbours, the second consumes the first where they meet, the first is topped up at the feed rate and the second decays at the kill rate.",
    "That is the Gray–Scott model. Two numbers, feed and kill, choose which of a dozen families of pattern appears. Pearson's 1993 map of that plane is the guide to the presets.",
    "The pattern is grown on the graphics card, a few dozen steps a frame, and stops after sixteen thousand. The second chemical is then read as height and lit, so a flat simulation photographs like a cast.",
  ],
  sources: [
    { label: "Pearson, Complex Patterns in a Simple System (Science, 1993)", href: "https://doi.org/10.1126/science.261.5118.189" },
    { label: "Turing, The Chemical Basis of Morphogenesis (1952)", href: "https://doi.org/10.1098/rstb.1952.0012" },
    { label: "Reaction–diffusion system", href: "https://en.wikipedia.org/wiki/Reaction%E2%80%93diffusion_system" },
  ],
  params,
  presets: [
    { name: "Coral", values: {} },
    { name: "Mitosis", values: { feed: 0.0367, kill: 0.0649 } },
    { name: "Maze", values: { feed: 0.029, kill: 0.057, density: 0.3 } },
    { name: "Worms", values: { feed: 0.078, kill: 0.061 } },
    { name: "Solitons", values: { feed: 0.03, kill: 0.062, density: 0.25 } },
    { name: "Coral to spots", values: { feed: 0.045, kill: 0.0635, gradient: -0.02, density: 0.4 } },
  ],
  orbit: false,
  animated: true,
  stillFrames: 260,
  create(gl): Renderer {
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("This browser cannot render to float textures (EXT_color_buffer_float), which the simulation needs.");
    }
    // 32-bit: at half precision the slow terms round away and the pattern stalls.
    const filter = gl.getExtension("OES_texture_float_linear") ? gl.LINEAR : gl.NEAREST;
    const init = program(gl, INIT);
    const step = program(gl, STEP);
    const show = program(gl, SHOW);
    const tex: WebGLTexture[] = [];
    const fbo: WebGLFramebuffer[] = [];
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIM, SIM, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      tex.push(t);
      fbo.push(f);
    }
    let cur = 0;
    let steps = 0;
    let last = "";
    let lastChem = "";

    const seedRun = (v: Values) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
      gl.viewport(0, 0, SIM, SIM);
      init.run(v);
      cur = 0;
      steps = 0;
      last = sig(v);
    };

    return {
      draw(v: Values, view: View) {
        if (sig(v) !== last) seedRun(v);
        if (chem(v) !== lastChem) {
          steps = 0;
          lastChem = chem(v);
        }
        const n = steps < STEP_BUDGET ? Math.round(v.speed) : 0;
        gl.viewport(0, 0, SIM, SIM);
        for (let i = 0; i < n; i++) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
          gl.useProgram(step.prog);
          gl.uniform1i(step.loc("u_state"), 0);
          step.run(v);
          cur = 1 - cur;
        }
        steps += n;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, view.w, view.h);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
        gl.useProgram(show.prog);
        gl.uniform1i(show.loc("u_state"), 0);
        gl.uniform2f(show.loc("u_res"), view.w, view.h);
        show.run(v);
      },
      restart() {
        last = "";
      },
      settled: () => steps >= STEP_BUDGET,
      dispose() {
        init.dispose();
        step.dispose();
        show.dispose();
        tex.forEach((t) => gl.deleteTexture(t));
        fbo.forEach((f) => gl.deleteFramebuffer(f));
      },
    };
  },
};
