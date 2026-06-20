// phyllotaxis — golden-angle spirals (sunflower seed packing), slowly rotating
// and breathing. complexity = seed count, chaos = angle deviation (which turns
// the tight spiral into looser galactic arms). Cheap: a few thousand dots.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { count } from "../core/meta";

const GOLDEN = 2.399963229728653;
const TAU = Math.PI * 2;

class Phyllotaxis implements Piece {
  id = "phyllotaxis";
  title = "Phyllotaxis";
  tags = ["nature", "math"];
  backend = "canvas2d" as const;
  loopSeconds = 24;
  schema: ParamSchema = {
    dotScale: { type: "number", min: 0.5, max: 2.5, step: 0.05, default: 1, label: "dot size" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private N = 2400;
  private chaos = 0.45;
  private dotScale = 1;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("phyllotaxis: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.dotScale = Number(ctx.params.dotScale);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.N = count(complexity, 600, 6000);
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  render(): void {
    const { ctx, w, h, N } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const ph = (this.t / this.loopSeconds) * TAU;
    const ang = GOLDEN + (this.chaos - 0.45) * 0.05;
    const rot = ph;
    const breathe = 1 + 0.04 * Math.sin(ph);
    const scale = (Math.min(w, h) / (2.1 * Math.sqrt(N))) * breathe;
    const dot = Math.max(1, scale * 0.42 * this.dotScale);
    for (let i = 0; i < N; i++) {
      const a = i * ang + rot;
      const r = scale * Math.sqrt(i);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.fillStyle = sampleCss(this.pal, i / N);
      ctx.beginPath();
      ctx.arc(x, y, dot, 0, TAU);
      ctx.fill();
    }
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }
  reseed(): void {}
  dispose(): void {}
}

export const createPhyllotaxis: PieceFactory = () => new Phyllotaxis();
