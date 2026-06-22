// reactionDiffusion — Gray–Scott morphogenesis (after the Frond Algorithms
// gray-scott demo). Two chemicals U and V diffuse and react on a grid:
// U + 2V → 3V, with U fed in at `feed` and V removed at `kill`. The pattern
// spreads and evolves — coral, mitosis, mazes, spots — depending on feed/kill.
// Simulated on a low-res grid (cells kept square to the canvas) and upscaled
// smoothly, so it's cheap at any banner size. Routed through the active palette
// so the colour pickers + randomise apply. complexity = grid detail; chaos =
// feed/kill jitter. speed = iterations per frame.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const Du = 0.16;
const Dv = 0.08;

class ReactionDiffusion implements Piece {
  id = "reaction-diffusion";
  title = "Reaction Diffusion";
  tags = ["nature", "physics", "math"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    feed: { type: "number", min: 0.02, max: 0.08, step: 0.001, default: 0.037, label: "feed" },
    kill: { type: "number", min: 0.045, max: 0.07, step: 0.001, default: 0.06, label: "kill" },
    speed: { type: "int", min: 1, max: 20, default: 10, label: "speed" },
  };

  private ctx!: CanvasRenderingContext2D;
  private off!: HTMLCanvasElement;
  private octx!: CanvasRenderingContext2D;
  private img!: ImageData;
  private rng!: RNG;
  private pal!: Palette;
  private lut = new Uint8Array(256 * 3);

  private w = 1;
  private h = 1;
  private gw = 2;
  private gh = 2;
  private Uc = new Float32Array(4);
  private Vc = new Float32Array(4);
  private Un = new Float32Array(4);
  private Vn = new Float32Array(4);

  private pFeed = 0.037;
  private pKill = 0.06;
  private pSpeed = 10;
  private complexity = 0.5;
  private chaos = 0.45;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("reactionDiffusion: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.pal = ctx.palette;
    this.pFeed = Number(ctx.params.feed);
    this.pKill = Number(ctx.params.kill);
    this.pSpeed = Number(ctx.params.speed);
    this.complexity = ctx.meta.complexity;
    this.chaos = ctx.meta.chaos;
    this.buildLut();
    this.allocGrid();
    this.seed();
  }

  applyMeta(complexity: number, chaos: number): void {
    // grid-detail change needs a remount; chaos (feed/kill jitter) applies live
    this.complexity = complexity;
    this.chaos = chaos;
  }

  private feedKill(): { feed: number; kill: number } {
    // chaos nudges feed/kill a touch off the chosen regime, so each run drifts
    const j = (this.chaos - 0.45) * 0.012;
    return { feed: this.pFeed + j, kill: this.pKill - j * 0.5 };
  }

  private buildLut(): void {
    const lo = sample(this.pal, 0.06);
    const mid = sample(this.pal, 0.55);
    const hi = sample(this.pal, 0.96);
    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      const a = v < 0.5 ? lo : mid;
      const b = v < 0.5 ? mid : hi;
      const f = v < 0.5 ? v / 0.5 : (v - 0.5) / 0.5;
      this.lut[i * 3] = (a[0] + (b[0] - a[0]) * f) | 0;
      this.lut[i * 3 + 1] = (a[1] + (b[1] - a[1]) * f) | 0;
      this.lut[i * 3 + 2] = (a[2] + (b[2] - a[2]) * f) | 0;
    }
  }

  private allocGrid(): void {
    // square cells: short side = S cells, long side scaled by aspect
    const S = count(this.complexity, 70, 180);
    if (this.w >= this.h) {
      this.gh = S;
      this.gw = Math.max(2, Math.round((S * this.w) / this.h));
    } else {
      this.gw = S;
      this.gh = Math.max(2, Math.round((S * this.h) / this.w));
    }
    const n = this.gw * this.gh;
    this.Uc = new Float32Array(n);
    this.Vc = new Float32Array(n);
    this.Un = new Float32Array(n);
    this.Vn = new Float32Array(n);
    this.off = document.createElement("canvas");
    this.off.width = this.gw;
    this.off.height = this.gh;
    this.octx = this.off.getContext("2d")!;
    this.img = this.octx.createImageData(this.gw, this.gh);
    const d = this.img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = 255;
  }

  private seed(): void {
    const { gw, gh } = this;
    this.Uc.fill(1);
    this.Vc.fill(0);
    const splats = 10 + this.rng.int(0, 14);
    const rmax = Math.max(2, Math.round(Math.min(gw, gh) * 0.04));
    for (let s = 0; s < splats; s++) {
      const cx = this.rng.int(0, gw - 1);
      const cy = this.rng.int(0, gh - 1);
      const rr = 2 + this.rng.int(0, rmax);
      for (let y = -rr; y <= rr; y++) {
        for (let x = -rr; x <= rr; x++) {
          const xx = cx + x;
          const yy = cy + y;
          if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          if (x * x + y * y <= rr * rr) this.Vc[yy * gw + xx] = 1;
        }
      }
    }
  }

  update(): void {
    const { gw, gh } = this;
    const { feed, kill } = this.feedKill();
    const iters = this.pSpeed;
    for (let it = 0; it < iters; it++) {
      const Uc = this.Uc;
      const Vc = this.Vc;
      const Un = this.Un;
      const Vn = this.Vn;
      for (let y = 0; y < gh; y++) {
        const ym = ((y - 1 + gh) % gh) * gw;
        const yp = ((y + 1) % gh) * gw;
        const yc = y * gw;
        for (let x = 0; x < gw; x++) {
          const xm = (x - 1 + gw) % gw;
          const xp = (x + 1) % gw;
          const i = yc + x;
          const u = Uc[i]!;
          const v = Vc[i]!;
          const lapU = Uc[yc + xm]! + Uc[yc + xp]! + Uc[ym + x]! + Uc[yp + x]! - 4 * u;
          const lapV = Vc[yc + xm]! + Vc[yc + xp]! + Vc[ym + x]! + Vc[yp + x]! - 4 * v;
          const uvv = u * v * v;
          Un[i] = u + Du * lapU - uvv + feed * (1 - u);
          Vn[i] = v + Dv * lapV + uvv - (kill + feed) * v;
        }
      }
      this.Uc = Un;
      this.Un = Uc;
      this.Vc = Vn;
      this.Vn = Vc;
    }
  }

  render(): void {
    const d = this.img.data;
    const V = this.Vc;
    const lut = this.lut;
    const n = this.gw * this.gh;
    for (let i = 0; i < n; i++) {
      let v = V[i]! * 2.4;
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      const li = ((v * 255) | 0) * 3;
      const o = i * 4;
      d[o] = lut[li]!;
      d[o + 1] = lut[li + 1]!;
      d[o + 2] = lut[li + 2]!;
    }
    this.octx.putImageData(this.img, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.off, 0, 0, this.w, this.h);
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.allocGrid();
    this.seed();
  }

  reseed(): void {
    this.seed();
  }

  dispose(): void {
    /* offscreen canvas is GC'd */
  }
}

export const createReactionDiffusion: PieceFactory = () => new ReactionDiffusion();
