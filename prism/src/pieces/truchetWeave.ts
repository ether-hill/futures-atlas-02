// truchetWeave — a Truchet tiling of quarter-arcs; each cell flips orientation
// by a seeded hash, weaving continuous curves across the grid. Colour travels
// along the weave over the loop, so it shimmers. complexity = grid density,
// chaos = colour spread. Cheap: a few hundred arcs.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sampleCss } from "../core/color/theme";
import { count } from "../core/meta";

const HALF_PI = Math.PI / 2;

class TruchetWeave implements Piece {
  id = "truchet-weave";
  title = "Truchet Weave";
  tags = ["math"];
  backend = "canvas2d" as const;
  loopSeconds = 20;
  schema: ParamSchema = {
    lineWidth: { type: "number", min: 1, max: 8, step: 0.5, default: 3, label: "weave width" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private cells = 12;
  private chaos = 0.45;
  private lw = 3;
  private seed = 0;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("truchet: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.lw = Number(ctx.params.lineWidth);
    this.seed = ctx.rng.range(0, 1000);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.cells = count(complexity, 6, 26);
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  private hash(i: number, j: number): number {
    const v = Math.sin((i * 12.9898 + j * 78.233 + this.seed) * 43758.5453);
    return v - Math.floor(v);
  }
  render(): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, w, h);
    const cell = Math.min(w, h) / this.cells;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    const r = cell / 2;
    const ph = this.t / this.loopSeconds;
    ctx.lineWidth = this.lw;
    ctx.lineCap = "round";
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * cell;
        const y = j * cell;
        const hh = this.hash(i, j);
        const colT = (hh * (0.4 + this.chaos) + ph) % 1;
        ctx.strokeStyle = sampleCss(this.pal, colT);
        ctx.beginPath();
        if (hh > 0.5) {
          ctx.arc(x, y, r, 0, HALF_PI);
          ctx.arc(x + cell, y + cell, r, Math.PI, Math.PI + HALF_PI);
        } else {
          ctx.arc(x + cell, y, r, HALF_PI, Math.PI);
          ctx.arc(x, y + cell, r, -HALF_PI, 0);
        }
        ctx.stroke();
      }
    }
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
  }
  reseed(): void {}
  dispose(): void {}
}

export const createTruchetWeave: PieceFactory = () => new TruchetWeave();
