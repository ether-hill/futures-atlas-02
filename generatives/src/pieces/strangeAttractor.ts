// strangeAttractor — a Clifford attractor plotted as density, its parameters
// slowly breathing so the form morphs and re-settles. Rendered at a capped
// internal resolution then scaled up, so cost is independent of banner size.
// complexity = iterations, chaos = how far the parameters wander.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;
const GMAX = 760;

class StrangeAttractor implements Piece {
  id = "strange-attractor";
  title = "Strange Attractor";
  tags = ["math", "flow"];
  backend = "canvas2d" as const;
  loopSeconds = 26;
  schema: ParamSchema = {
    glow: { type: "number", min: 0.2, max: 1.5, step: 0.05, default: 0.8, label: "glow" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private glow = 0.8;
  private iters = 90000;
  private chaos = 0.45;
  private a = 1.7;
  private b = 1.7;
  private c = 0.6;
  private d = 1.2;
  private gw = 2;
  private gh = 2;
  private density = new Float32Array(4);
  private scratch!: HTMLCanvasElement;
  private sctx!: CanvasRenderingContext2D;
  private img!: ImageData;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("attractor: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.glow = Number(ctx.params.glow);
    this.a = ctx.rng.range(-1.9, 1.9);
    this.b = ctx.rng.range(-1.9, 1.9);
    this.c = ctx.rng.range(-1.5, 1.5);
    this.d = ctx.rng.range(-1.5, 1.5);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
    this.setupGrid(ctx.rng);
  }
  private setupGrid(_rng: RNG): void {
    const scale = Math.min(1, GMAX / Math.max(this.w, this.h));
    this.gw = Math.max(2, Math.round(this.w * scale));
    this.gh = Math.max(2, Math.round(this.h * scale));
    this.density = new Float32Array(this.gw * this.gh);
    this.scratch = document.createElement("canvas");
    this.scratch.width = this.gw;
    this.scratch.height = this.gh;
    this.sctx = this.scratch.getContext("2d")!;
    this.img = this.sctx.createImageData(this.gw, this.gh);
  }
  applyMeta(complexity: number, chaos: number): void {
    this.iters = count(complexity, 30000, 160000);
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  render(): void {
    const { gw, gh, density, img } = this;
    const ph = (this.t / this.loopSeconds) * TAU;
    const amp = 0.12 + this.chaos * 0.5;
    const a = this.a + amp * Math.sin(ph);
    const b = this.b + amp * Math.cos(ph * 1.1);
    const c = this.c + amp * Math.sin(ph * 0.7);
    const d = this.d + amp * Math.cos(ph * 0.9);
    const ex = Math.abs(c) + 1.2;
    const ey = Math.abs(d) + 1.2;
    density.fill(0);
    let x = 0.1;
    let y = 0.1;
    const N = this.iters;
    for (let i = 0; i < N; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx;
      y = ny;
      if (i > 20) {
        const px = (((x / ex) * 0.5 + 0.5) * (gw - 1)) | 0;
        const py = (((y / ey) * 0.5 + 0.5) * (gh - 1)) | 0;
        if (px >= 0 && px < gw && py >= 0 && py < gh) density[py * gw + px] += 1;
      }
    }
    let maxd = 1;
    for (let k = 0; k < density.length; k++) if (density[k] > maxd) maxd = density[k];
    const invLog = 1 / Math.log(1 + maxd);
    const bg = this.pal.bg;
    const br = parseInt(bg.slice(1, 3), 16);
    const bgc = parseInt(bg.slice(3, 5), 16);
    const bb = parseInt(bg.slice(5, 7), 16);
    const data = img.data;
    for (let k = 0; k < density.length; k++) {
      const dn = density[k];
      const p = k * 4;
      if (dn === 0) {
        data[p] = br;
        data[p + 1] = bgc;
        data[p + 2] = bb;
        data[p + 3] = 255;
        continue;
      }
      const t = Math.log(1 + dn) * invLog;
      const rgb = sample(this.pal, Math.min(1, t * (0.6 + this.glow)));
      data[p] = rgb[0];
      data[p + 1] = rgb[1];
      data[p + 2] = rgb[2];
      data[p + 3] = 255;
    }
    this.sctx.putImageData(img, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.scratch, 0, 0, gw, gh, 0, 0, this.w, this.h);
  }
  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.setupGrid({} as RNG);
  }
  reseed(): void {}
  dispose(): void {}
}

export const createStrangeAttractor: PieceFactory = () => new StrangeAttractor();
