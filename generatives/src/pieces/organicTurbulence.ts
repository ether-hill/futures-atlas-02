// organicTurbulence — a layered-noise flow field; thousands of particles stream
// along it, their additive trails accumulating while the field slowly evolves.
// Ported from the Frond "Algorithms" lab (Organic Turbulence). complexity =
// particle count; chaos = flow turbulence + speed. Continuous (non-looping).

import type { Piece, PieceContext, PieceFactory, Params, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { NoiseKit } from "../core/noise";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count, range } from "../core/meta";

const MAX = 6000;
const NB = 24; // tone buckets for batched additive stroking

function hexRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

class OrganicTurbulence implements Piece {
  id = "organic-turbulence";
  title = "Organic Turbulence";
  tags = ["flow", "nature", "noise"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    speed: { type: "number", min: 0.2, max: 3, step: 0.05, default: 1, label: "speed" },
    fieldScale: { type: "number", min: 0.3, max: 4, step: 0.05, default: 1, label: "field scale" },
    evolve: { type: "number", min: 0, max: 1, step: 0.01, default: 0.4, label: "evolve" },
    trail: { type: "number", min: 0.01, max: 0.2, step: 0.005, default: 0.06, label: "trail fade" },
    lineWidth: { type: "number", min: 0.5, max: 3, step: 0.1, default: 1.2, label: "line width" },
  };

  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private rng!: RNG;
  private noise!: NoiseKit;
  private pal!: Palette;
  private bg: [number, number, number] = [5, 7, 13];

  private x = new Float32Array(MAX);
  private y = new Float32Array(MAX);
  private px = new Float32Array(MAX);
  private py = new Float32Array(MAX);
  private life = new Float32Array(MAX);
  private tone = new Float32Array(MAX);

  private active = 1150;
  private z = 0;
  private turbScale = 1; // chaos → field frequency
  private speedScale = 1; // chaos → flow speed

  private pSpeed = 1;
  private pScale = 1;
  private pEvolve = 0.4;
  private pTrail = 0.06;
  private pLine = 1.2;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("organicTurbulence: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.noise = ctx.noise;
    this.pal = ctx.palette;
    this.bg = hexRgb(ctx.palette.bg);
    this.readParams(ctx.params);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
    this.z = this.rng.range(0, 1000);
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
    this.clear();
  }

  private readParams(p: Params): void {
    this.pSpeed = Number(p.speed);
    this.pScale = Number(p.fieldScale);
    this.pEvolve = Number(p.evolve);
    this.pTrail = Number(p.trail);
    this.pLine = Number(p.lineWidth);
  }

  applyMeta(complexity: number, chaos: number): void {
    this.active = count(complexity, 300, MAX);
    this.turbScale = range(chaos, 0.6, 1.9);
    this.speedScale = range(chaos, 0.8, 1.7);
  }

  private clear(): void {
    this.ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private spawn(i: number, fresh: boolean): void {
    const x = this.rng.range(0, this.w);
    const y = this.rng.range(0, this.h);
    this.x[i] = x;
    this.y[i] = y;
    this.px[i] = x;
    this.py[i] = y;
    this.life[i] = (fresh ? this.rng.range(0, 110) : this.rng.range(20, 110)) | 0;
    this.tone[i] = this.rng.next();
  }

  update(_dt: number, _t: number): void {
    const scl = 0.0016 * this.pScale * this.turbScale;
    const step = Math.min(this.w, this.h) * 0.0011 * this.pSpeed * this.speedScale;
    const w = this.w;
    const h = this.h;
    for (let i = 0; i < this.active; i++) {
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
      const a = (this.noise.n3(this.x[i] * scl, this.y[i] * scl, this.z) * 0.5 + 0.5) * Math.PI * 4;
      const nx = this.x[i] + Math.cos(a) * step;
      const ny = this.y[i] + Math.sin(a) * step;
      this.x[i] = nx;
      this.y[i] = ny;
      if (--this.life[i] <= 0 || nx < -2 || nx > w + 2 || ny < -2 || ny > h + 2) this.spawn(i, false);
    }
    this.z += this.pEvolve * 0.012;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${this.pTrail})`;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = this.pLine;
    ctx.lineCap = "round";
    const paths: Path2D[] = [];
    const colors: string[] = [];
    for (let b = 0; b < NB; b++) {
      paths.push(new Path2D());
      const c = sample(this.pal, 0.35 + (b / NB) * 0.6);
      colors.push(`rgba(${c[0]},${c[1]},${c[2]},0.17)`);
    }
    for (let i = 0; i < this.active; i++) {
      const bi = Math.min(NB - 1, (this.tone[i] * NB) | 0);
      const p = paths[bi]!;
      p.moveTo(this.px[i], this.py[i]);
      p.lineTo(this.x[i], this.y[i]);
    }
    for (let b = 0; b < NB; b++) {
      ctx.strokeStyle = colors[b]!;
      ctx.stroke(paths[b]!);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
    this.clear();
  }

  reseed(): void {
    this.z = this.rng.range(0, 1000);
    for (let i = 0; i < MAX; i++) this.spawn(i, true);
    this.clear();
  }

  dispose(): void {
    /* no external resources */
  }
}

export const createOrganicTurbulence: PieceFactory = () => new OrganicTurbulence();
