// physarum — Jeff Jones' agent-based slime-mould model (Physarum polycephalum)
// on the GPU, mirroring the Frond sma-config engine. Agent state (x, y, heading,
// species) lives in a float texture; each frame, per agent: sense the pheromone
// trail ahead / left / right, rotate toward the strongest, step, deposit; the
// trail map then diffuses and decays. Up to three species are encoded in the
// R/G/B channels (with optional cross-species avoidance). 4-pass WebGL2:
// sense+move → additive deposit → diffuse+decay → display. The simulation runs
// super-sampled above the display for crisp networks.
// complexity = agent count; chaos = turn agitation.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { hexToRgb } from "../core/color/oklch";
import { cachedProgram } from "../core/programCache";

const D2R = Math.PI / 180;
const SS = 1.6; // sim super-sample factor over the display (crisper lines)

const FULLSCREEN_VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SPECIES_MASK = `
vec3 speciesMask(float s) {
  return s < 0.5 ? vec3(1.0, 0.0, 0.0) : s < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
}`;

const UPDATE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uAgents;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform float uSensorAngle, uSensorDist, uTurnSpeed, uStepSize, uFrame, uAvoid;
out vec4 outState;
${SPECIES_MASK}
float senseAt(vec2 pos, vec3 mask) {
  vec3 t = texture(uTrail, fract(pos / uRes)).rgb;
  return dot(t, mask) - uAvoid * dot(t, 1.0 - mask);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  vec4 s = texelFetch(uAgents, coord, 0);
  vec2 pos = s.xy;
  float angle = s.z;
  vec3 mask = speciesMask(s.w);
  float f = senseAt(pos + vec2(cos(angle), sin(angle)) * uSensorDist, mask);
  float l = senseAt(pos + vec2(cos(angle + uSensorAngle), sin(angle + uSensorAngle)) * uSensorDist, mask);
  float r = senseAt(pos + vec2(cos(angle - uSensorAngle), sin(angle - uSensorAngle)) * uSensorDist, mask);
  float rnd = hash(pos + uFrame);
  if (f > l && f > r) {
    // keep heading
  } else if (f < l && f < r) {
    angle += (rnd < 0.5 ? -1.0 : 1.0) * uTurnSpeed;
  } else if (r > l) {
    angle -= uTurnSpeed;
  } else if (l > r) {
    angle += uTurnSpeed;
  }
  vec2 npos = mod(pos + vec2(cos(angle), sin(angle)) * uStepSize, uRes);
  outState = vec4(npos, angle, s.w);
}`;

const DEPOSIT_VERT = `#version 300 es
uniform sampler2D uAgents;
uniform float uAgentTexW;
uniform vec2 uRes;
flat out vec3 vMask;
${SPECIES_MASK}
void main() {
  int id = gl_VertexID;
  int w = int(uAgentTexW);
  ivec2 coord = ivec2(id % w, id / w);
  vec4 st = texelFetch(uAgents, coord, 0);
  vMask = speciesMask(st.w);
  vec2 clip = (st.xy / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;

const DEPOSIT_FRAG = `#version 300 es
precision highp float;
flat in vec3 vMask;
uniform float uDeposit;
out vec4 outColor;
void main() { outColor = vec4(vMask * uDeposit, 0.0); }`;

const DECAY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform float uDecay, uDiffuse;
out vec4 outColor;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 sz = ivec2(uRes);
  vec3 sum = vec3(0.0);
  for (int dy = -1; dy <= 1; dy++)
    for (int dx = -1; dx <= 1; dx++) {
      ivec2 q = (c + ivec2(dx, dy) + sz) % sz;
      sum += texelFetch(uTrail, q, 0).rgb;
    }
  vec3 blur = sum / 9.0;
  vec3 orig = texelFetch(uTrail, c, 0).rgb;
  vec3 v = mix(orig, blur, uDiffuse) * uDecay;
  outColor = vec4(v, 1.0);
}`;

const DISPLAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTrail;
uniform int uMode;
uniform vec3 uBg, uLo, uHi, uColR, uColG, uColB;
uniform float uIntensity, uGamma;
out vec4 frag;
void main() {
  vec3 t = texture(uTrail, vUv).rgb * uIntensity;
  vec3 col;
  if (uMode == 0) {
    float v = pow(clamp(t.r, 0.0, 1.0), uGamma);
    col = mix(uBg, uLo, smoothstep(0.0, 0.5, v));
    col = mix(col, uHi, smoothstep(0.5, 1.0, v));
  } else {
    t = pow(clamp(t, 0.0, 1.0), vec3(uGamma));
    col = uBg + t.r * uColR + t.g * uColG + t.b * uColB;
  }
  frag = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("physarum shader: " + log);
  }
  return sh;
}
function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("physarum link: " + gl.getProgramInfoLog(p));
  gl.deleteShader(v);
  gl.deleteShader(f);
  return p;
}
interface Tgt { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
function target(gl: WebGL2RenderingContext, w: number, h: number, ifmt: number, type: number, data: ArrayBufferView | null, filter: number): Tgt {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo, w, h };
}
const rgb01 = (hex: string): [number, number, number] => {
  const c = hexToRgb(hex);
  return [c[0] / 255, c[1] / 255, c[2] / 255];
};

class Physarum implements Piece {
  id = "physarum";
  title = "Physarum - Jones Agent Model";
  tags = ["nature", "math", "flow"];
  backend = "webgl2" as const;
  schema: ParamSchema = {
    spawn: { type: "select", options: ["ring", "center", "random"], default: "ring", label: "spawn" },
    species: { type: "int", min: 1, max: 3, default: 1, label: "species" },
    displayMode: { type: "select", options: ["palette", "rgb"], default: "palette", label: "colour mode" },
    sensorDist: { type: "number", min: 2, max: 22, step: 0.5, default: 9, label: "sensor dist" },
    sensorAngle: { type: "number", min: 5, max: 45, step: 1, default: 22, label: "sensor angle" },
    turnSpeed: { type: "number", min: 5, max: 60, step: 1, default: 28, label: "turn speed" },
    decay: { type: "number", min: 0.85, max: 0.99, step: 0.005, default: 0.93, label: "decay" },
    diffuse: { type: "number", min: 0, max: 1, step: 0.01, default: 0.35, label: "diffuse" },
    avoid: { type: "number", min: 0, max: 1, step: 0.01, default: 0, label: "avoid (species)" },
    intensity: { type: "number", min: 0.5, max: 4, step: 0.1, default: 1.6, label: "glow" },
    speed: { type: "int", min: 1, max: 4, default: 1, label: "speed" },
    colR: { type: "color", default: "#ff2d6b", label: "species R" },
    colG: { type: "color", default: "#22e0c8", label: "species G" },
    colB: { type: "color", default: "#ffd23d", label: "species B" },
  };

  private gl!: WebGL2RenderingContext;
  private w = 1; // display px
  private h = 1;
  private sw = 1; // sim px (super-sampled)
  private sh = 1;
  private agentTexW = 512;
  private vao!: WebGLVertexArrayObject;
  private progUpdate!: WebGLProgram;
  private progDeposit!: WebGLProgram;
  private progDecay!: WebGLProgram;
  private progDisplay!: WebGLProgram;
  private agentsA!: Tgt;
  private agentsB!: Tgt;
  private trailA!: Tgt;
  private trailB!: Tgt;

  private rngNext!: () => number;
  private bg: [number, number, number] = [0, 0, 0];
  private lo: [number, number, number] = [0.3, 0.2, 0.6];
  private hi: [number, number, number] = [1, 1, 1];
  private colR: [number, number, number] = [1, 0.2, 0.4];
  private colG: [number, number, number] = [0.1, 0.9, 0.8];
  private colB: [number, number, number] = [1, 0.8, 0.2];

  private sizeScale = 1;
  private frameN = 0;
  private turnScale = 1;
  private complexity = 0.5;

  private pSpawn = "ring";
  private pSpecies = 1;
  private pMode = 0;
  private pSensorDist = 9;
  private pSensorAngle = 22;
  private pTurnSpeed = 28;
  private pDecay = 0.93;
  private pDiffuse = 0.35;
  private pAvoid = 0;
  private pIntensity = 1.6;
  private pSteps = 1;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "webgl2") throw new Error("physarum: expected webgl2 surface");
    const gl = (this.gl = ctx.surface.gl);
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("physarum: EXT_color_buffer_float required");
    this.w = ctx.width;
    this.h = ctx.height;
    this.sw = Math.round(this.w * SS);
    this.sh = Math.round(this.h * SS);
    this.rngNext = () => ctx.rng.next();
    this.readParams(ctx);
    this.complexity = ctx.meta.complexity;
    this.turnScale = 0.7 + ctx.meta.chaos * 0.8;
    this.agentTexW = Math.round(256 + this.complexity * 768);
    this.sizeScale = Math.max(0.5, Math.min(this.sw, this.sh) / 520);
    this.buildColors(ctx.palette);

    this.vao = gl.createVertexArray()!;
    // cached on the GL context → no shader recompile on remount/randomise (the
    // recompile+link is the main remount stutter; programs outlive the piece)
    this.progUpdate = cachedProgram(gl, "phys-update", () => program(gl, FULLSCREEN_VERT, UPDATE_FRAG));
    this.progDeposit = cachedProgram(gl, "phys-deposit", () => program(gl, DEPOSIT_VERT, DEPOSIT_FRAG));
    this.progDecay = cachedProgram(gl, "phys-decay", () => program(gl, FULLSCREEN_VERT, DECAY_FRAG));
    this.progDisplay = cachedProgram(gl, "phys-display", () => program(gl, FULLSCREEN_VERT, DISPLAY_FRAG));
    this.allocTrails();
    this.seed();
    // warm up a handful of steps so the FIRST displayed frame is an established
    // seed (a clean ring/centre/scatter) rather than a blank flash or a 1-frame
    // speckle of un-organised deposits — kills the start-up flicker.
    for (let i = 0; i < 5; i++) this.step();
  }

  private readParams(ctx: PieceContext): void {
    this.pSpawn = String(ctx.params.spawn);
    this.pSpecies = Math.max(1, Math.min(3, Number(ctx.params.species)));
    this.pMode = String(ctx.params.displayMode) === "rgb" ? 1 : 0;
    this.pSensorDist = Number(ctx.params.sensorDist);
    this.pSensorAngle = Number(ctx.params.sensorAngle);
    this.pTurnSpeed = Number(ctx.params.turnSpeed);
    this.pDecay = Number(ctx.params.decay);
    this.pDiffuse = Number(ctx.params.diffuse);
    this.pAvoid = Number(ctx.params.avoid);
    this.pIntensity = Number(ctx.params.intensity);
    this.pSteps = Number(ctx.params.speed);
    this.colR = rgb01(String(ctx.params.colR));
    this.colG = rgb01(String(ctx.params.colG));
    this.colB = rgb01(String(ctx.params.colB));
  }

  applyMeta(complexity: number, chaos: number): void {
    this.complexity = complexity;
    this.turnScale = 0.7 + chaos * 0.8;
  }

  private buildColors(pal: Palette): void {
    const rgb = (t: number): [number, number, number] => {
      const c = sample(pal, t);
      return [c[0] / 255, c[1] / 255, c[2] / 255];
    };
    this.bg = rgb(0.02);
    this.lo = rgb(0.55);
    this.hi = rgb(0.96);
  }

  private allocTrails(): void {
    const gl = this.gl;
    this.trailA = target(gl, this.sw, this.sh, gl.RGBA16F, gl.HALF_FLOAT, null, gl.LINEAR);
    this.trailB = target(gl, this.sw, this.sh, gl.RGBA16F, gl.HALF_FLOAT, null, gl.LINEAR);
    for (const t of [this.trailA, this.trailB]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.w, t.h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private seed(): void {
    const gl = this.gl;
    const w = this.agentTexW;
    const n = w * w;
    const data = new Float32Array(n * 4);
    const cx = this.sw / 2;
    const cy = this.sh / 2;
    const ring = Math.min(this.sw, this.sh) * 0.36;
    const blob = Math.min(this.sw, this.sh) * 0.04;
    const species = this.pSpecies;
    for (let i = 0; i < n; i++) {
      let x: number, y: number, a: number;
      if (this.pSpawn === "center") {
        const rad = this.rngNext() * blob;
        const t = this.rngNext() * Math.PI * 2;
        x = cx + Math.cos(t) * rad;
        y = cy + Math.sin(t) * rad;
        a = this.rngNext() * Math.PI * 2;
      } else if (this.pSpawn === "random") {
        x = this.rngNext() * this.sw;
        y = this.rngNext() * this.sh;
        a = this.rngNext() * Math.PI * 2;
      } else {
        // ring
        const t = this.rngNext() * Math.PI * 2;
        x = cx + Math.cos(t) * ring;
        y = cy + Math.sin(t) * ring;
        a = t + Math.PI + (this.rngNext() - 0.5);
      }
      data[i * 4] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = a;
      data[i * 4 + 3] = i % species;
    }
    if (this.agentsA) {
      gl.deleteTexture(this.agentsA.tex);
      gl.deleteFramebuffer(this.agentsA.fbo);
      gl.deleteTexture(this.agentsB.tex);
      gl.deleteFramebuffer(this.agentsB.fbo);
    }
    this.agentsA = target(gl, w, w, gl.RGBA32F, gl.FLOAT, data, gl.NEAREST);
    this.agentsB = target(gl, w, w, gl.RGBA32F, gl.FLOAT, null, gl.NEAREST);
    this.frameN = 0;
  }

  private u(p: WebGLProgram, n: string): WebGLUniformLocation | null {
    return this.gl.getUniformLocation(p, n);
  }

  private step(): void {
    const gl = this.gl;
    const w = this.agentTexW;
    gl.bindVertexArray(this.vao);
    this.frameN++;

    gl.useProgram(this.progUpdate);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.agentsB.fbo);
    gl.viewport(0, 0, w, w);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.agentsA.tex);
    gl.uniform1i(this.u(this.progUpdate, "uAgents"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.progUpdate, "uTrail"), 1);
    gl.uniform2f(this.u(this.progUpdate, "uRes"), this.sw, this.sh);
    gl.uniform1f(this.u(this.progUpdate, "uSensorAngle"), this.pSensorAngle * D2R);
    gl.uniform1f(this.u(this.progUpdate, "uSensorDist"), this.pSensorDist * this.sizeScale);
    gl.uniform1f(this.u(this.progUpdate, "uTurnSpeed"), this.pTurnSpeed * D2R * this.turnScale);
    gl.uniform1f(this.u(this.progUpdate, "uStepSize"), this.sizeScale);
    gl.uniform1f(this.u(this.progUpdate, "uFrame"), this.frameN);
    gl.uniform1f(this.u(this.progUpdate, "uAvoid"), this.pAvoid);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(this.progDeposit);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.trailA.fbo);
    gl.viewport(0, 0, this.sw, this.sh);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.agentsB.tex);
    gl.uniform1i(this.u(this.progDeposit, "uAgents"), 0);
    gl.uniform1f(this.u(this.progDeposit, "uAgentTexW"), w);
    gl.uniform2f(this.u(this.progDeposit, "uRes"), this.sw, this.sh);
    gl.uniform1f(this.u(this.progDeposit, "uDeposit"), 0.2);
    gl.drawArrays(gl.POINTS, 0, w * w);
    gl.disable(gl.BLEND);

    gl.useProgram(this.progDecay);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.trailB.fbo);
    gl.viewport(0, 0, this.sw, this.sh);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.progDecay, "uTrail"), 0);
    gl.uniform2f(this.u(this.progDecay, "uRes"), this.sw, this.sh);
    gl.uniform1f(this.u(this.progDecay, "uDecay"), this.pDecay);
    gl.uniform1f(this.u(this.progDecay, "uDiffuse"), this.pDiffuse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const ta = this.agentsA;
    this.agentsA = this.agentsB;
    this.agentsB = ta;
    const tt = this.trailA;
    this.trailA = this.trailB;
    this.trailB = tt;
  }

  update(): void {
    for (let i = 0; i < this.pSteps; i++) this.step();
  }

  render(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.useProgram(this.progDisplay);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.progDisplay, "uTrail"), 0);
    gl.uniform1i(this.u(this.progDisplay, "uMode"), this.pMode);
    gl.uniform3f(this.u(this.progDisplay, "uBg"), this.bg[0], this.bg[1], this.bg[2]);
    gl.uniform3f(this.u(this.progDisplay, "uLo"), this.lo[0], this.lo[1], this.lo[2]);
    gl.uniform3f(this.u(this.progDisplay, "uHi"), this.hi[0], this.hi[1], this.hi[2]);
    gl.uniform3f(this.u(this.progDisplay, "uColR"), this.colR[0], this.colR[1], this.colR[2]);
    gl.uniform3f(this.u(this.progDisplay, "uColG"), this.colG[0], this.colG[1], this.colG[2]);
    gl.uniform3f(this.u(this.progDisplay, "uColB"), this.colB[0], this.colB[1], this.colB[2]);
    gl.uniform1f(this.u(this.progDisplay, "uIntensity"), this.pIntensity);
    gl.uniform1f(this.u(this.progDisplay, "uGamma"), 0.75);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.sw = Math.round(this.w * SS);
    this.sh = Math.round(this.h * SS);
    this.sizeScale = Math.max(0.5, Math.min(this.sw, this.sh) / 520);
    const gl = this.gl;
    gl.deleteTexture(this.trailA.tex);
    gl.deleteFramebuffer(this.trailA.fbo);
    gl.deleteTexture(this.trailB.tex);
    gl.deleteFramebuffer(this.trailB.fbo);
    this.allocTrails();
    this.seed();
    for (let i = 0; i < 5; i++) this.step();
  }

  reseed(): void {
    this.allocTrails();
    this.seed();
    for (let i = 0; i < 5; i++) this.step();
  }

  dispose(): void {
    const gl = this.gl;
    for (const t of [this.agentsA, this.agentsB, this.trailA, this.trailB]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    // programs are cached on the GL context (see programCache) — do NOT delete them
    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}

export const createPhysarum: PieceFactory = () => new Physarum();
