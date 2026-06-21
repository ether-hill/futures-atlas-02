// physarum — Jeff Jones' agent-based slime-mould model (Physarum polycephalum),
// run on the GPU for high fidelity: hundreds of thousands of agents whose state
// lives in a float texture. Each frame, per agent: sense the pheromone trail
// ahead / left / right, rotate toward the strongest, step forward, deposit; then
// the trail map is diffused and decayed. Emergent transport networks appear.
// This mirrors the Frond studio's sma-config Physarum engine (4-pass WebGL2:
// sense+move → additive deposit → diffuse+decay → display), recoloured through
// the active palette. complexity = agent count (fidelity); chaos = turn agitation.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";

const D2R = Math.PI / 180;

const FULLSCREEN_VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const UPDATE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uAgents;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform float uSensorAngle, uSensorDist, uTurnSpeed, uStepSize, uFrame;
out vec4 outState;
float senseAt(vec2 pos) { return texture(uTrail, fract(pos / uRes)).r; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  vec4 s = texelFetch(uAgents, coord, 0);
  vec2 pos = s.xy;
  float angle = s.z;
  float f = senseAt(pos + vec2(cos(angle), sin(angle)) * uSensorDist);
  float l = senseAt(pos + vec2(cos(angle + uSensorAngle), sin(angle + uSensorAngle)) * uSensorDist);
  float r = senseAt(pos + vec2(cos(angle - uSensorAngle), sin(angle - uSensorAngle)) * uSensorDist);
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
void main() {
  int id = gl_VertexID;
  int w = int(uAgentTexW);
  ivec2 coord = ivec2(id % w, id / w);
  vec2 pos = texelFetch(uAgents, coord, 0).xy;
  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;

const DEPOSIT_FRAG = `#version 300 es
precision highp float;
uniform float uDeposit;
out vec4 outColor;
void main() { outColor = vec4(uDeposit, 0.0, 0.0, 0.0); }`;

const DECAY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform float uDecay, uDiffuse;
out vec4 outColor;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 sz = ivec2(uRes);
  float sum = 0.0;
  for (int dy = -1; dy <= 1; dy++)
    for (int dx = -1; dx <= 1; dx++) {
      ivec2 q = (c + ivec2(dx, dy) + sz) % sz;
      sum += texelFetch(uTrail, q, 0).r;
    }
  float blur = sum / 9.0;
  float orig = texelFetch(uTrail, c, 0).r;
  float v = mix(orig, blur, uDiffuse) * uDecay;
  outColor = vec4(v, 0.0, 0.0, 1.0);
}`;

const DISPLAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTrail;
uniform vec3 uBg, uLo, uHi;
uniform float uIntensity, uGamma;
out vec4 frag;
void main() {
  float t = texture(uTrail, vUv).r * uIntensity;
  float v = pow(clamp(t, 0.0, 1.0), uGamma);
  vec3 col = mix(uBg, uLo, smoothstep(0.0, 0.5, v));
  col = mix(col, uHi, smoothstep(0.5, 1.0, v));
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

class Physarum implements Piece {
  id = "physarum";
  title = "Physarum - Jones Agent Model";
  tags = ["nature", "math", "flow"];
  backend = "webgl2" as const;
  schema: ParamSchema = {
    sensorDist: { type: "number", min: 2, max: 22, step: 0.5, default: 9, label: "sensor dist" },
    sensorAngle: { type: "number", min: 5, max: 45, step: 1, default: 22, label: "sensor angle" },
    turnSpeed: { type: "number", min: 5, max: 60, step: 1, default: 28, label: "turn speed" },
    decay: { type: "number", min: 0.85, max: 0.99, step: 0.005, default: 0.93, label: "decay" },
    diffuse: { type: "number", min: 0, max: 1, step: 0.01, default: 0.35, label: "diffuse" },
    intensity: { type: "number", min: 0.5, max: 4, step: 0.1, default: 1.6, label: "glow" },
    speed: { type: "int", min: 1, max: 4, default: 1, label: "speed" },
  };

  private gl!: WebGL2RenderingContext;
  private w = 1;
  private h = 1;
  private agentTexW = 512;
  private vao!: WebGLVertexArrayObject;
  private pUpdate!: WebGLProgram;
  private pDeposit!: WebGLProgram;
  private progDecay!: WebGLProgram;
  private pDisplay!: WebGLProgram;
  private agentsA!: Tgt;
  private agentsB!: Tgt;
  private trailA!: Tgt;
  private trailB!: Tgt;

  private rngNext!: () => number;
  private bg: [number, number, number] = [0, 0, 0];
  private lo: [number, number, number] = [0.3, 0.2, 0.6];
  private hi: [number, number, number] = [1, 1, 1];

  private sizeScale = 1;
  private frameN = 0;
  private turnScale = 1; // chaos
  private complexity = 0.5;

  // params
  private pSensorDist = 9;
  private pSensorAngle = 22;
  private pTurnSpeed = 28;
  private pDecay = 0.93;
  private pDiffuse = 0.35;
  private pIntensity = 1.6;
  private pSteps = 1;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "webgl2") throw new Error("physarum: expected webgl2 surface");
    const gl = (this.gl = ctx.surface.gl);
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("physarum: EXT_color_buffer_float required");
    this.w = ctx.width;
    this.h = ctx.height;
    this.rngNext = () => ctx.rng.next();
    this.readParams(ctx);
    this.complexity = ctx.meta.complexity;
    this.turnScale = 0.7 + ctx.meta.chaos * 0.8;
    this.agentTexW = Math.round(256 + this.complexity * 768); // 256² … 1024² agents
    this.sizeScale = Math.max(0.5, Math.min(this.w, this.h) / 520);
    this.buildColors(ctx.palette);

    this.vao = gl.createVertexArray()!;
    this.pUpdate = program(gl, FULLSCREEN_VERT, UPDATE_FRAG);
    this.pDeposit = program(gl, DEPOSIT_VERT, DEPOSIT_FRAG);
    this.progDecay = program(gl, FULLSCREEN_VERT, DECAY_FRAG);
    this.pDisplay = program(gl, FULLSCREEN_VERT, DISPLAY_FRAG);
    this.allocTrails();
    this.seed();
  }

  private readParams(ctx: PieceContext): void {
    this.pSensorDist = Number(ctx.params.sensorDist);
    this.pSensorAngle = Number(ctx.params.sensorAngle);
    this.pTurnSpeed = Number(ctx.params.turnSpeed);
    this.pDecay = Number(ctx.params.decay);
    this.pDiffuse = Number(ctx.params.diffuse);
    this.pIntensity = Number(ctx.params.intensity);
    this.pSteps = Number(ctx.params.speed);
  }

  applyMeta(complexity: number, chaos: number): void {
    // agent count change needs a remount; turn agitation is live
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
    this.trailA = target(gl, this.w, this.h, gl.RGBA16F, gl.HALF_FLOAT, null, gl.LINEAR);
    this.trailB = target(gl, this.w, this.h, gl.RGBA16F, gl.HALF_FLOAT, null, gl.LINEAR);
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
    for (let i = 0; i < n; i++) {
      data[i * 4] = this.rngNext() * this.w;
      data[i * 4 + 1] = this.rngNext() * this.h;
      data[i * 4 + 2] = this.rngNext() * Math.PI * 2;
      data[i * 4 + 3] = 0;
    }
    if (this.agentsA) {
      gl.deleteTexture(this.agentsA.tex);
      gl.deleteFramebuffer(this.agentsA.fbo);
      gl.deleteTexture(this.agentsB.tex);
      gl.deleteFramebuffer(this.agentsB.fbo);
    }
    this.agentsA = target(gl, w, w, gl.RGBA32F, gl.FLOAT, data, gl.NEAREST);
    this.agentsB = target(gl, w, w, gl.RGBA32F, gl.FLOAT, null, gl.NEAREST);
  }

  private u(p: WebGLProgram, n: string): WebGLUniformLocation | null {
    return this.gl.getUniformLocation(p, n);
  }

  private step(): void {
    const gl = this.gl;
    const w = this.agentTexW;
    gl.bindVertexArray(this.vao);
    this.frameN++;

    // Pass 1 — sense & move (agentsA → agentsB)
    gl.useProgram(this.pUpdate);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.agentsB.fbo);
    gl.viewport(0, 0, w, w);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.agentsA.tex);
    gl.uniform1i(this.u(this.pUpdate, "uAgents"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.pUpdate, "uTrail"), 1);
    gl.uniform2f(this.u(this.pUpdate, "uRes"), this.w, this.h);
    gl.uniform1f(this.u(this.pUpdate, "uSensorAngle"), this.pSensorAngle * D2R);
    gl.uniform1f(this.u(this.pUpdate, "uSensorDist"), this.pSensorDist * this.sizeScale);
    gl.uniform1f(this.u(this.pUpdate, "uTurnSpeed"), this.pTurnSpeed * D2R * this.turnScale);
    gl.uniform1f(this.u(this.pUpdate, "uStepSize"), this.sizeScale);
    gl.uniform1f(this.u(this.pUpdate, "uFrame"), this.frameN);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2 — deposit (agentsB → trailA, additive points)
    gl.useProgram(this.pDeposit);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.trailA.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.agentsB.tex);
    gl.uniform1i(this.u(this.pDeposit, "uAgents"), 0);
    gl.uniform1f(this.u(this.pDeposit, "uAgentTexW"), w);
    gl.uniform2f(this.u(this.pDeposit, "uRes"), this.w, this.h);
    gl.uniform1f(this.u(this.pDeposit, "uDeposit"), 0.2);
    gl.drawArrays(gl.POINTS, 0, w * w);
    gl.disable(gl.BLEND);

    // Pass 3 — diffuse + decay (trailA → trailB)
    gl.useProgram(this.progDecay);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.trailB.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.progDecay, "uTrail"), 0);
    gl.uniform2f(this.u(this.progDecay, "uRes"), this.w, this.h);
    gl.uniform1f(this.u(this.progDecay, "uDecay"), this.pDecay);
    gl.uniform1f(this.u(this.progDecay, "uDiffuse"), this.pDiffuse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // swap
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
    gl.useProgram(this.pDisplay);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.trailA.tex);
    gl.uniform1i(this.u(this.pDisplay, "uTrail"), 0);
    gl.uniform3f(this.u(this.pDisplay, "uBg"), this.bg[0], this.bg[1], this.bg[2]);
    gl.uniform3f(this.u(this.pDisplay, "uLo"), this.lo[0], this.lo[1], this.lo[2]);
    gl.uniform3f(this.u(this.pDisplay, "uHi"), this.hi[0], this.hi[1], this.hi[2]);
    gl.uniform1f(this.u(this.pDisplay, "uIntensity"), this.pIntensity);
    gl.uniform1f(this.u(this.pDisplay, "uGamma"), 0.75);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.sizeScale = Math.max(0.5, Math.min(this.w, this.h) / 520);
    const gl = this.gl;
    gl.deleteTexture(this.trailA.tex);
    gl.deleteFramebuffer(this.trailA.fbo);
    gl.deleteTexture(this.trailB.tex);
    gl.deleteFramebuffer(this.trailB.fbo);
    this.allocTrails();
    this.seed();
    this.frameN = 0;
  }

  reseed(): void {
    this.allocTrails();
    this.seed();
    this.frameN = 0;
  }

  dispose(): void {
    const gl = this.gl;
    for (const t of [this.agentsA, this.agentsB, this.trailA, this.trailB]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    for (const p of [this.pUpdate, this.pDeposit, this.progDecay, this.pDisplay]) if (p) gl.deleteProgram(p);
    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}

export const createPhysarum: PieceFactory = () => new Physarum();
