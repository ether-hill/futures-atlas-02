// moireLattice — two line lattices overlaid with additive blending; their
// relative angle breathes, so interference (moiré) bands ripple across the
// frame. The quantum-interference motif as pure geometry. complexity = line
// density, chaos = how far the lattices counter-rotate. Cheap: ~hundreds of lines.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;

class MoireLattice implements Piece {
  id = "moire-lattice";
  title = "Moiré Lattice";
  tags = ["math", "quantum"];
  backend = "canvas2d" as const;
  loopSeconds = 18;
  schema: ParamSchema = {
    lineWidth: { type: "number", min: 0.5, max: 3, step: 0.1, default: 1, label: "line width" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private lines = 36;
  private chaos = 0.45;
  private lw = 1;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("moire: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.lw = Number(ctx.params.lineWidth);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.lines = count(complexity, 14, 70);
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  private family(angle: number, colT: number): void {
    const { ctx, w, h } = this;
    const diag = Math.hypot(w, h);
    const step = diag / this.lines;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angle);
    ctx.strokeStyle = sampleCss(this.pal, colT);
    ctx.lineWidth = this.lw;
    ctx.beginPath();
    for (let x = -diag; x <= diag; x += step) {
      ctx.moveTo(x, -diag);
      ctx.lineTo(x, diag);
    }
    ctx.stroke();
    ctx.restore();
  }
  render(): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, w, h);
    const ph = (this.t / this.loopSeconds) * TAU;
    const drift = (0.04 + 0.12 * this.chaos) * Math.sin(ph);
    const base = ph * 0.5;
    ctx.globalCompositeOperation = "lighter";
    this.family(base - drift, 0.35);
    this.family(base + drift, 0.7);
    ctx.globalCompositeOperation = "source-over";
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }
  reseed(): void {}
  dispose(): void {}
}

export const createMoireLattice: PieceFactory = () => new MoireLattice();
