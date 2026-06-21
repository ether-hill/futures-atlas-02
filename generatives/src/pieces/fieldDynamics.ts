// fieldDynamics — invisible forces made visible. A handful of vortices, sources
// and sinks compose a vector field; particles stream its field lines, dying and
// respawning so the ghost-traced flow keeps renewing. Ported from the Frond
// "Algorithms" lab (Field Dynamics). complexity = particle count; chaos =
// singularity strength spread. Continuous (non-looping).

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count, range } from "../core/meta";

const MAX = 6000;

function hexRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

class FieldDynamics implements Piece {
  id = "field-dynamics";
  title = "Field Dynamics";
  tags = ["flow", "physics", "math"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    singularities: { type: "int", min: 2, max: 8, default: 4, label: "singularities" },
    speed: { type: "number", min: 0.5, max: 8, step: 0.1, default: 4, label: "speed" },
    fade: { type: "number", min: 0.004, max: 0.08, step: 0.002, default: 0.02, label: "trail fade" },
    lineWidth: { type: "number", min: 0.5, max: 3, step: 0.1, default: 1.4, label: "line width" },
  };

  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private rng!: RNG;
  private pal!: Palette;
  private bg: [number, number, number] = [5, 7, 13];

  private gx: number[] = [];
  private gy: number[] = [];
  private gk: number[] = []; // kind selector 0..1
  private gs: number[] = []; // strength

  private x = new Float32Array(MAX);
  private y = new Float32Array(MAX);
  private px = new Float32Array(MAX);
  private py = new Float32Array(MAX);
  private life = new Float32Array(MAX);
  private mag = new Float32Array(MAX);
  private tone = new Float32Array(MAX);

  private active = 1300;
  private K = 4;
  private strength = 1; // chaos
  private pSpeed = 4;
  private pFade = 0.02;
  private pLine = 1.4;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("fieldDynamics: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.pal = ctx.palette;
    this.bg = hexRgb(ctx.palette.bg);
    this.K = Number(ctx.params.singularities);
    this.pSpeed = Number(ctx.params.speed);
    this.pFade = Number(ctx.params.fade);
    this.pLine = Number(ctx.params.lineWidth);
    this.applyMeta(ctx.meta.complexity, ctx.meta.chaos);
    this.buildField();
    for (let i = 0; i < MAX; i++) this.spawn(i);
    this.clear();
  }

  applyMeta(complexity: number, chaos: number): void {
    this.active = count(complexity, 300, MAX);
    this.strength = range(chaos, 0.6, 1.8);
  }

  private buildField(): void {
    this.gx = [];
    this.gy = [];
    this.gk = [];
    this.gs = [];
    for (let i = 0; i < this.K; i++) {
      this.gx.push(this.rng.range(this.w * 0.15, this.w * 0.85));
      this.gy.push(this.rng.range(this.h * 0.15, this.h * 0.85));
      this.gk.push(this.rng.next());
      this.gs.push((0.5 + this.rng.next()) * 0.32 * this.strength);
    }
  }

  // distances normalised by S so field strength is scale-invariant.
  private field(x: number, y: number, out: [number, number]): void {
    const S = Math.min(this.w, this.h);
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < this.K; i++) {
      const dx = (x - this.gx[i]!) / S;
      const dy = (y - this.gy[i]!) / S;
      const d2 = dx * dx + dy * dy + 0.0016;
      const d = Math.sqrt(d2);
      const inv = this.gs[i]! / d2;
      const k = this.gk[i]!;
      if (k < 0.5) {
        // vortex
        vx += (-dy / d) * inv;
        vy += (dx / d) * inv;
      } else {
        // source (k<0.78) or sink
        const sign = k < 0.78 ? 1 : -1;
        vx += ((sign * dx) / d) * inv;
        vy += ((sign * dy) / d) * inv;
      }
    }
    out[0] = vx;
    out[1] = vy;
  }

  private spawn(i: number): void {
    const x = this.rng.range(0, this.w);
    const y = this.rng.range(0, this.h);
    this.x[i] = x;
    this.y[i] = y;
    this.px[i] = x;
    this.py[i] = y;
    this.life[i] = (40 + this.rng.range(0, 170)) | 0;
    this.mag[i] = 0;
    this.tone[i] = this.rng.next();
  }

  private clear(): void {
    this.ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  update(_dt: number, _t: number): void {
    const step = Math.min(this.w, this.h) * 0.001 * this.pSpeed;
    const w = this.w;
    const h = this.h;
    const v: [number, number] = [0, 0];
    for (let i = 0; i < this.active; i++) {
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
      this.field(this.x[i], this.y[i], v);
      const m = Math.hypot(v[0], v[1]);
      this.mag[i] = m;
      if (m < 0.02 || --this.life[i] <= 0) {
        this.spawn(i);
        continue;
      }
      const nx = this.x[i] + (v[0] / m) * step;
      const ny = this.y[i] + (v[1] / m) * step;
      this.x[i] = nx;
      this.y[i] = ny;
      if (nx < 0 || nx > w || ny < 0 || ny > h) this.spawn(i);
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${this.pFade})`;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = this.pLine;
    ctx.lineCap = "round";
    for (let i = 0; i < this.active; i++) {
      // a spawn this frame leaves px==x — nothing to draw
      if (this.px[i] === this.x[i] && this.py[i] === this.y[i]) continue;
      const c = sample(this.pal, 0.35 + this.tone[i] * 0.6);
      const a = (0.16 + Math.min(0.2, this.mag[i] * 0.28)).toFixed(3);
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.beginPath();
      ctx.moveTo(this.px[i], this.py[i]);
      ctx.lineTo(this.x[i], this.y[i]);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.buildField();
    for (let i = 0; i < MAX; i++) this.spawn(i);
    this.clear();
  }

  reseed(): void {
    this.buildField();
    for (let i = 0; i < MAX; i++) this.spawn(i);
    this.clear();
  }

  dispose(): void {
    /* no external resources */
  }
}

export const createFieldDynamics: PieceFactory = () => new FieldDynamics();
