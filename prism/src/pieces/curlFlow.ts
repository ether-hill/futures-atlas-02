// curlFlow — the M0 reference piece. Thousands of particles ride a curl-noise
// flow field, leaving fading trails. The field is sampled along a circle in
// noise space whose period = loopSeconds, so the FLOW is exactly periodic and
// the piece loops seamlessly. complexity = particle count; chaos = curl
// turbulence + speed. Pure (seed, params, size, time) → frame.

import type { Piece, PieceContext, PieceFactory, Params, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { NoiseKit } from "../core/noise";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { count, range } from "../core/meta";

const MAX = 30000;
const NB = 32; // hue buckets for batched stroking

function hexRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

class CurlFlow implements Piece {
  id = "curl-flow";
  title = "Curl Flow";
  tags = ["flow", "nature", "math"];
  backend = "canvas2d" as const;
  loopSeconds = 14;
  schema: ParamSchema = {
    speed: { type: "number", min: 0.2, max: 3, step: 0.05, default: 1, label: "speed" },
    noiseScale: { type: "number", min: 0.3, max: 4, step: 0.05, default: 1.4, label: "field scale" },
    trail: { type: "number", min: 0.015, max: 0.3, step: 0.005, default: 0.07, label: "trail fade" },
    lineWidth: { type: "number", min: 0.5, max: 3, step: 0.1, default: 1.1, label: "line width" },
    hueShift: { type: "number", min: 0, max: 1, step: 0.01, default: 0, label: "hue shift" },
    life: { type: "int", min: 40, max: 400, default: 170, label: "particle life" },
  };

  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private rng!: RNG;
  private noise!: NoiseKit;
  private palette!: Palette;
  private bg: [number, number, number] = [5, 7, 13];

  private x = new Float32Array(MAX);
  private y = new Float32Array(MAX);
  private px = new Float32Array(MAX);
  private py = new Float32Array(MAX);
  private age = new Float32Array(MAX);
  private life = new Float32Array(MAX);
  private hue = new Float32Array(MAX);

  private active = 4000;
  private curlStrength = 1.2;
  private speedScale = 1;

  // params
  private pSpeed = 1;
  private pScale = 1.4;
  private pTrail = 0.07;
  private pLine = 1.1;
  private pHue = 0;
  private pLife = 170;

  init(ctx: PieceContext): void {
    const s = ctx.surface;
    if (s.kind !== "canvas2d") throw new Error("curlFlow: expected canvas2d surface");
    this.ctx = s.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.noise = ctx.noise;
    this.palette = ctx.palette;
    this.bg = hexRgb(ctx.palette.bg);
    this.readParams(ctx.params);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
    this.ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private readParams(p: Params): void {
    this.pSpeed = Number(p.speed);
    this.pScale = Number(p.noiseScale);
    this.pTrail = Number(p.trail);
    this.pLine = Number(p.lineWidth);
    this.pHue = Number(p.hueShift);
    this.pLife = Number(p.life);
  }

  applyMeta(complexity: number, chaos: number): void {
    this.active = count(complexity, 1200, MAX);
    this.curlStrength = range(chaos, 0.6, 3.2);
    this.speedScale = range(chaos, 0.7, 1.8);
  }

  private spawn(i: number, fresh: boolean): void {
    const x = this.rng.range(0, this.w);
    const y = this.rng.range(0, this.h);
    this.x[i] = x;
    this.y[i] = y;
    this.px[i] = x;
    this.py[i] = y;
    this.age[i] = fresh ? this.rng.range(0, this.pLife) : 0;
    this.life[i] = this.pLife * this.rng.range(0.6, 1.4);
    this.hue[i] = (this.noise.fbm2(x * 0.0016, y * 0.0016, 3) + 1) * 0.5;
  }

  update(dt: number, t: number): void {
    const T = this.loopSeconds;
    const R = 0.65;
    const ox = Math.cos((2 * Math.PI * t) / T) * R;
    const oy = Math.sin((2 * Math.PI * t) / T) * R;
    const fs = this.pScale * 0.0024;
    const spd = this.pSpeed * this.speedScale * this.curlStrength * 60 * dt;
    const w = this.w;
    const h = this.h;
    for (let i = 0; i < this.active; i++) {
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
      const [cx, cy] = this.noise.curl(this.x[i] * fs + ox, this.y[i] * fs + oy);
      this.x[i] += cx * spd;
      this.y[i] += cy * spd;
      this.age[i] += dt * 60;
      if (this.age[i] > this.life[i] || this.x[i] < -2 || this.x[i] > w + 2 || this.y[i] < -2 || this.y[i] > h + 2) {
        this.spawn(i, false);
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${this.pTrail})`;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.lineWidth = this.pLine;
    ctx.lineCap = "round";

    const paths: Path2D[] = [];
    const colors: string[] = [];
    for (let b = 0; b < NB; b++) {
      paths.push(new Path2D());
      colors.push(sampleCss(this.palette, (b / NB + this.pHue) % 1));
    }
    for (let i = 0; i < this.active; i++) {
      let b = ((this.hue[i] + this.pHue) % 1) * NB;
      b = b < 0 ? b + NB : b;
      const bi = b >= NB ? NB - 1 : b | 0;
      const p = paths[bi]!;
      p.moveTo(this.px[i], this.py[i]);
      p.lineTo(this.x[i], this.y[i]);
    }
    for (let b = 0; b < NB; b++) {
      ctx.strokeStyle = colors[b]!;
      ctx.stroke(paths[b]!);
    }
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`;
    this.ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
  }

  reseed(): void {
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
  }

  dispose(): void {
    /* no external resources */
  }
}

export const createCurlFlow: PieceFactory = () => new CurlFlow();
