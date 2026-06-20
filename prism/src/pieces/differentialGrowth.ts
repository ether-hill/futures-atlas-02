// differentialGrowth — an organic line that repels itself, pulls along its
// length, and subdivides where it stretches, growing coral/brain-like folds.
// Continuous (not a fixed loop). complexity = node budget, chaos = wander.
// O(N²) repulsion kept cheap by a modest node cap.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;

class DifferentialGrowth implements Piece {
  id = "differential-growth";
  title = "Differential Growth";
  tags = ["nature", "flow"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    lineWidth: { type: "number", min: 1, max: 5, step: 0.5, default: 2, label: "line width" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private rng!: RNG;
  private xs: number[] = [];
  private ys: number[] = [];
  private maxNodes = 500;
  private chaos = 0.45;
  private lw = 2;
  private unit = 1;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("growth: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.rng = ctx.rng;
    this.lw = Number(ctx.params.lineWidth);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
    this.unit = Math.min(this.w, this.h);
    const n = 40;
    const r = this.unit * 0.08;
    this.xs = [];
    this.ys = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      this.xs.push(this.w / 2 + Math.cos(a) * r);
      this.ys.push(this.h / 2 + Math.sin(a) * r);
    }
    this.ctx.fillStyle = this.pal.bg;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.maxNodes = count(complexity, 150, 800);
    this.chaos = chaos;
  }
  update(dt: number): void {
    const { xs, ys } = this;
    const n = xs.length;
    const repelR = this.unit * 0.03;
    const repelR2 = repelR * repelR;
    const step = Math.min(2, dt * 60);
    const fx = new Float32Array(n);
    const fy = new Float32Array(n);
    // repulsion (O(N²); n is capped)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = xs[i]! - xs[j]!;
        const dy = ys[i]! - ys[j]!;
        const d2 = dx * dx + dy * dy;
        if (d2 < repelR2 && d2 > 1e-4) {
          const d = Math.sqrt(d2);
          const f = ((repelR - d) / d) * 0.5;
          fx[i] += dx * f;
          fy[i] += dy * f;
          fx[j] -= dx * f;
          fy[j] -= dy * f;
        }
      }
    }
    // attraction toward neighbour midpoint (keeps the line cohesive) + jitter
    const jit = this.chaos * 0.6;
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n;
      const b = (i + 1) % n;
      const mx = (xs[a]! + xs[b]!) * 0.5;
      const my = (ys[a]! + ys[b]!) * 0.5;
      fx[i] += (mx - xs[i]!) * 0.18 + (this.rng.next() - 0.5) * jit;
      fy[i] += (my - ys[i]!) * 0.18 + (this.rng.next() - 0.5) * jit;
    }
    for (let i = 0; i < n; i++) {
      xs[i] = Math.max(2, Math.min(this.w - 2, xs[i]! + fx[i] * step));
      ys[i] = Math.max(2, Math.min(this.h - 2, ys[i]! + fy[i] * step));
    }
    // subdivide stretched segments
    if (n < this.maxNodes) {
      const maxLen = this.unit * 0.035;
      for (let i = xs.length - 1; i >= 0; i--) {
        const b = (i + 1) % xs.length;
        const dx = xs[b]! - xs[i]!;
        const dy = ys[b]! - ys[i]!;
        if (dx * dx + dy * dy > maxLen * maxLen) {
          xs.splice(i + 1, 0, (xs[i]! + xs[b]!) * 0.5);
          ys.splice(i + 1, 0, (ys[i]! + ys[b]!) * 0.5);
        }
      }
    }
  }
  render(): void {
    const { ctx, xs, ys } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.lineWidth = this.lw;
    ctx.lineJoin = "round";
    ctx.strokeStyle = sampleCss(this.pal, 0.7);
    ctx.beginPath();
    ctx.moveTo(xs[0]!, ys[0]!);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i]!, ys[i]!);
    ctx.closePath();
    ctx.stroke();
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.unit = Math.min(w, h);
  }
  reseed(): void {}
  dispose(): void {}
}

export const createDifferentialGrowth: PieceFactory = () => new DifferentialGrowth();
