// reactionDiffusion — Gray–Scott on ping-pong float targets: coral, mazes,
// mitosis, spots growing in real time. Simulated at a low internal resolution
// (≤ ~320px) and upscaled, so it's GPU-cheap regardless of banner size.
// complexity = sim resolution, chaos = reaction jitter. Preset = feed/kill regime.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import { Quad, Target, bindScreen, makePaletteTexture } from "../core/gl";

const HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;`;

const SEED = `${HEAD}
uniform vec2 uSeed;
void main() {
  vec2 g = floor(vUv * 7.0);
  float r = fract(sin(dot(g + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  float b = step(0.6, r);
  fragColor = vec4(1.0, b, 0.0, 1.0);
}`;

const SIM = `${HEAD}
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uFeed;
uniform float uKill;
void main() {
  vec2 s = texture(uState, vUv).rg;
  vec2 lap = -s
    + 0.20 * (texture(uState, vUv + vec2(uTexel.x, 0.0)).rg + texture(uState, vUv - vec2(uTexel.x, 0.0)).rg
            + texture(uState, vUv + vec2(0.0, uTexel.y)).rg + texture(uState, vUv - vec2(0.0, uTexel.y)).rg)
    + 0.05 * (texture(uState, vUv + uTexel).rg + texture(uState, vUv - uTexel).rg
            + texture(uState, vUv + vec2(uTexel.x, -uTexel.y)).rg + texture(uState, vUv + vec2(-uTexel.x, uTexel.y)).rg);
  float a = s.r, b = s.g;
  float rab = a * b * b;
  float na = a + (0.16 * lap.r - rab + uFeed * (1.0 - a));
  float nb = b + (0.08 * lap.g + rab - (uFeed + uKill) * b);
  fragColor = vec4(clamp(na, 0.0, 1.0), clamp(nb, 0.0, 1.0), 0.0, 1.0);
}`;

const DISP = `${HEAD}
uniform sampler2D uState;
uniform sampler2D uPalette;
void main() {
  float b = texture(uState, vUv).g;
  float t = clamp(b * 3.2, 0.0, 1.0);
  fragColor = vec4(texture(uPalette, vec2(t, 0.5)).rgb, 1.0);
}`;

const PRESETS: Record<string, [number, number]> = {
  coral: [0.0545, 0.062],
  mitosis: [0.0367, 0.0649],
  maze: [0.029, 0.057],
  spots: [0.025, 0.06],
  flow: [0.078, 0.061],
};

class ReactionDiffusion implements Piece {
  id = "reaction-diffusion";
  title = "Reaction Diffusion";
  tags = ["nature", "physics"];
  backend = "webgl2" as const;
  schema: ParamSchema = {
    preset: { type: "select", options: ["coral", "mitosis", "maze", "spots", "flow"], default: "coral", label: "regime" },
    steps: { type: "int", min: 4, max: 20, default: 12, label: "speed" },
  };
  private gl!: WebGL2RenderingContext;
  private a!: Target;
  private b!: Target;
  private cur!: Target;
  private sim!: Quad;
  private disp!: Quad;
  private seedQ!: Quad;
  private pal!: WebGLTexture;
  private gw = 2;
  private gh = 2;
  private w = 1;
  private h = 1;
  private feed = 0.0545;
  private kill = 0.062;
  private steps = 12;
  private seedX = 0;
  private seedY = 0;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "webgl2") throw new Error("rd: webgl2");
    const gl = (this.gl = ctx.surface.gl);
    this.w = ctx.width;
    this.h = ctx.height;
    const scale = Math.min(1, 320 / Math.max(this.w, this.h));
    this.gw = Math.max(2, Math.round(this.w * scale));
    this.gh = Math.max(2, Math.round(this.h * scale));
    const [f, k] = PRESETS[String(ctx.params.preset)] ?? PRESETS.coral!;
    this.feed = f;
    this.kill = k;
    this.steps = Number(ctx.params.steps);
    this.seedX = ctx.rng.range(-50, 50);
    this.seedY = ctx.rng.range(-50, 50);
    this.a = new Target(gl, this.gw, this.gh);
    this.b = new Target(gl, this.gw, this.gh);
    this.sim = new Quad(gl, SIM);
    this.disp = new Quad(gl, DISP);
    this.seedQ = new Quad(gl, SEED);
    this.pal = makePaletteTexture(gl, ctx.palette);
    // seed initial state into A
    this.a.bindAsTarget();
    this.seedQ.use().v2("uSeed", this.seedX, this.seedY).draw();
    this.cur = this.a;
  }
  applyMeta(): void {
    /* sim resolution change needs a remount; chaos handled via preset */
  }
  update(): void {
    const gl = this.gl;
    for (let i = 0; i < this.steps; i++) {
      const dst = this.cur === this.a ? this.b : this.a;
      dst.bindAsTarget();
      this.sim.use().tex("uState", this.cur.texture).v2("uTexel", 1 / this.gw, 1 / this.gh).f("uFeed", this.feed).f("uKill", this.kill).draw();
      this.cur = dst;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  render(): void {
    bindScreen(this.gl, this.w, this.h);
    this.disp.use().tex("uState", this.cur.texture).tex("uPalette", this.pal).draw();
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }
  reseed(): void {}
  dispose(): void {
    this.a?.dispose();
    this.b?.dispose();
    this.sim?.dispose();
    this.disp?.dispose();
    this.seedQ?.dispose();
    if (this.pal) this.gl.deleteTexture(this.pal);
  }
}

export const createReactionDiffusion: PieceFactory = () => new ReactionDiffusion();
