// superformula — Gielis supershapes: nested parametric rings that morph and
// rotate. One stroked path per ring, so it's almost free. complexity = symmetry
// (m), chaos = exponent wander (how violently the shape morphs).

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { range } from "../core/meta";

const TAU = Math.PI * 2;

function superR(phi: number, m: number, n1: number, n2: number, n3: number): number {
  const t1 = Math.pow(Math.abs(Math.cos((m * phi) / 4)), n2);
  const t2 = Math.pow(Math.abs(Math.sin((m * phi) / 4)), n3);
  const r = Math.pow(t1 + t2, -1 / n1);
  return Number.isFinite(r) ? r : 0;
}

class Superformula implements Piece {
  id = "superformula";
  title = "Superformula";
  tags = ["math", "nature"];
  backend = "canvas2d" as const;
  loopSeconds = 16;
  schema: ParamSchema = {
    rings: { type: "int", min: 1, max: 9, default: 5, label: "rings" },
    lineWidth: { type: "number", min: 0.5, max: 3, step: 0.1, default: 1.4, label: "line width" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private m = 7;
  private chaos = 0.45;
  private rings = 5;
  private lw = 1.4;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("superformula: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.rings = Number(ctx.params.rings);
    this.lw = Number(ctx.params.lineWidth);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.m = Math.round(range(complexity, 3, 16));
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  render(): void {
    const { ctx, w, h, rings } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const base = Math.min(w, h) * 0.42;
    const ph = (this.t / this.loopSeconds) * TAU;
    const amp = 0.5 + this.chaos * 6;
    ctx.lineWidth = this.lw;
    ctx.lineJoin = "round";
    for (let k = 0; k < rings; k++) {
      const kf = rings > 1 ? k / (rings - 1) : 0;
      const n1 = 1.2 + amp * (0.5 + 0.5 * Math.sin(ph + kf * 2));
      const n2 = 1.5 + amp * (0.5 + 0.5 * Math.sin(ph * 1.3 + kf * 3 + 1));
      const n3 = n2;
      const scale = base * (0.35 + 0.65 * (1 - kf));
      const rot = ph * (k % 2 === 0 ? 1 : -1) * 0.5 + kf;
      ctx.strokeStyle = sampleCss(this.pal, 0.2 + 0.7 * kf);
      ctx.beginPath();
      const STEP = 256;
      for (let i = 0; i <= STEP; i++) {
        const phi = (i / STEP) * TAU;
        const r = superR(phi, this.m, n1, n2, n3) * scale;
        const a = phi + rot;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }
  reseed(): void {}
  dispose(): void {}
}

export const createSuperformula: PieceFactory = () => new Superformula();
