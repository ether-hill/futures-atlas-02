// boids — emergent flocking tuned for the restless unpredictability of a real
// starling murmuration. On Reynolds' separation / alignment / cohesion sit three
// things that keep it from settling: a wandering curl-noise flow that swings the
// whole flock, a chaos→order→shatter phase loop, and intermittent "predator"
// scares that tear the flock open and let it reform. Ported from the Frond
// "Algorithms" lab. complexity = flock size; chaos = wander agitation.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { NoiseKit } from "../core/noise";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count, range } from "../core/meta";

const TAU = Math.PI * 2;

function hexRgb(hex: string): [number, number, number] {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

class Boids implements Piece {
  id = "boids";
  title = "Boids";
  tags = ["nature", "flow", "physics"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    speed: { type: "number", min: 4, max: 20, step: 0.5, default: 12, label: "speed" },
    separation: { type: "number", min: 0.4, max: 3, step: 0.1, default: 1.5, label: "separation" },
    wander: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.55, label: "wander" },
    trail: { type: "number", min: 0.01, max: 0.14, step: 0.005, default: 0.067, label: "trail fade" },
  };

  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private rng!: RNG;
  private noise!: NoiseKit;
  private pal!: Palette;
  private bg: [number, number, number] = [5, 7, 13];
  private cols: [number, number, number][] = [];

  private N = 380;
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private dpx = new Float32Array(0); // draw-from position (start of frame)
  private dpy = new Float32Array(0);

  private maxS = 1;
  private minS = 0.5;
  private R2 = 1;
  private head = 2;
  private big = false;
  private flowScale = 1;
  private flowT = 0;

  // murmuration phase machine + predator
  private phase = 0;
  private pt = 0;
  private kGlobal = 0;
  private curWander = 0.55;
  private gdir = 0;
  private DUR: [number, number, number] = [200, 250, 200];
  private frame = 0;
  private nextScare = 150;
  private pred = { on: false, x: 0, y: 0, vx: 0, vy: 0, ttl: 0 };

  private pSpeed = 12;
  private pSep = 1.5;
  private pWander = 0.55;
  private pTrail = 0.067;
  private chaos = 0.5;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("boids: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.noise = ctx.noise;
    this.pal = ctx.palette;
    this.bg = hexRgb(ctx.palette.bg);
    this.pSpeed = Number(ctx.params.speed);
    this.pSep = Number(ctx.params.separation);
    this.pWander = Number(ctx.params.wander);
    this.pTrail = Number(ctx.params.trail);
    this.N = count(ctx.meta.complexity, 120, 560);
    this.chaos = ctx.meta.chaos;
    this.buildPalette();
    this.alloc();
    this.spawnAll();
    this.clear();
  }

  applyMeta(_complexity: number, chaos: number): void {
    // flock size change needs a remount; wander agitation applies live
    this.chaos = chaos;
  }

  private buildPalette(): void {
    this.cols = [];
    for (let i = 0; i < 6; i++) this.cols.push(sample(this.pal, 0.35 + (i / 5) * 0.6));
  }

  private alloc(): void {
    const N = this.N;
    this.px = new Float32Array(N);
    this.py = new Float32Array(N);
    this.vx = new Float32Array(N);
    this.vy = new Float32Array(N);
    this.dpx = new Float32Array(N);
    this.dpy = new Float32Array(N);
  }

  private dims(): void {
    const S = Math.min(this.w, this.h);
    this.big = S > 360;
    this.maxS = S * 0.001 * this.pSpeed;
    this.minS = this.maxS * 0.5;
    const R = S * 0.06;
    this.R2 = R * R;
    this.head = this.big ? 2.7 : 1.8;
    this.flowScale = 1.5 / S;
  }

  private spawnAll(): void {
    this.dims();
    const cx = this.w / 2;
    const cy = this.h / 2;
    const r0 = Math.min(this.w, this.h) * 0.22;
    for (let i = 0; i < this.N; i++) {
      const a = this.rng.range(0, TAU);
      const r = this.rng.range(0, r0);
      this.px[i] = cx + Math.cos(a) * r;
      this.py[i] = cy + Math.sin(a) * r;
      // seed the draw-from positions to the spawn point so the first render (which
      // Player runs before any update) draws zero-length lines, not a fan from 0,0
      this.dpx[i] = this.px[i];
      this.dpy[i] = this.py[i];
      const va = this.rng.range(0, TAU);
      this.vx[i] = Math.cos(va) * this.maxS;
      this.vy[i] = Math.sin(va) * this.maxS;
    }
    this.flowT = this.rng.range(0, 1000);
    this.gdir = this.rng.range(0, TAU);
    this.DUR = [180 + this.rng.range(0, 200), 210 + this.rng.range(0, 130), 150 + this.rng.range(0, 140)];
    this.nextScare = 90 + this.rng.range(0, 200);
    this.phase = 0;
    this.pt = 0;
    this.kGlobal = 0;
    this.curWander = this.pWander;
    this.frame = 0;
    this.pred = { on: false, x: 0, y: 0, vx: 0, vy: 0, ttl: 0 };
  }

  private clear(): void {
    this.ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private stepFlock(): void {
    const { N, maxS, R2 } = this;
    const wanderW = this.pWander * range(this.chaos, 0.6, 1.6);
    this.flowT += 0.0019;
    this.frame++;
    this.pt++;
    // phase machine (eased ramps between regimes)
    if (this.phase === 0) {
      this.kGlobal += (0 - this.kGlobal) * 0.05;
      this.curWander += (wanderW - this.curWander) * 0.04;
      if (this.pt > this.DUR[0]) {
        this.phase = 1;
        this.pt = 0;
        this.gdir = this.rng.range(0, TAU);
      }
    } else if (this.phase === 1) {
      this.kGlobal += (0.95 - this.kGlobal) * 0.03;
      this.curWander += (0.08 - this.curWander) * 0.03;
      if (this.pt > this.DUR[1]) {
        this.phase = 2;
        this.pt = 0;
      }
    } else {
      this.kGlobal += (1.15 - this.kGlobal) * 0.04;
      this.curWander += (0.05 - this.curWander) * 0.04;
      if (this.pt > this.DUR[2]) {
        this.phase = 0;
        this.pt = 0;
        this.nextScare = this.frame; // shatter
      }
    }
    const gdx = Math.cos(this.gdir);
    const gdy = Math.sin(this.gdir);

    // predator schedule
    const pred = this.pred;
    if (pred.on) {
      pred.x += pred.vx;
      pred.y += pred.vy;
      if (--pred.ttl <= 0) {
        pred.on = false;
        this.nextScare = this.frame + 120 + this.rng.range(0, 260);
      }
    } else if (this.frame > this.nextScare) {
      const edge = this.rng.int(0, 3);
      pred.x = edge === 1 ? this.w : edge === 3 ? 0 : this.rng.range(0, this.w);
      pred.y = edge === 0 ? 0 : edge === 2 ? this.h : this.rng.range(0, this.h);
      const tx = this.w * (0.3 + this.rng.range(0, 0.4));
      const ty = this.h * (0.3 + this.rng.range(0, 0.4));
      const ad = Math.hypot(tx - pred.x, ty - pred.y) || 1;
      const ps = maxS * 1.3;
      pred.vx = ((tx - pred.x) / ad) * ps;
      pred.vy = ((ty - pred.y) / ad) * ps;
      pred.ttl = 70 + this.rng.range(0, 90);
      pred.on = true;
    }
    const PR = Math.min(this.w, this.h) * 0.2;
    const PR2 = PR * PR;

    for (let i = 0; i < N; i++) {
      let sepx = 0, sepy = 0, alx = 0, aly = 0, cox = 0, coy = 0, cnt = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = this.px[i] - this.px[j];
        const dy = this.py[i] - this.py[j];
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0) {
          sepx += dx / d2;
          sepy += dy / d2;
          alx += this.vx[j];
          aly += this.vy[j];
          cox += this.px[j];
          coy += this.py[j];
          cnt++;
        }
      }
      let ax = 0;
      let ay = 0;
      if (cnt > 0) {
        alx /= cnt; aly /= cnt; cox /= cnt; coy /= cnt;
        ax += sepx * this.pSep * maxS + (alx - this.vx[i]) + (cox - this.px[i]) * 0.012;
        ay += sepy * this.pSep * maxS + (aly - this.vy[i]) + (coy - this.py[i]) * 0.012;
      }
      // global alignment to the shared heading — drives the order phase
      ax += (gdx * maxS - this.vx[i]) * this.kGlobal;
      ay += (gdy * maxS - this.vy[i]) * this.kGlobal;
      // wandering curl-noise flow — dominates in chaos, fades in order
      const fa = (this.noise.n3(this.px[i] * this.flowScale, this.py[i] * this.flowScale, this.flowT) * 0.5 + 0.5) * Math.PI * 4;
      ax += Math.cos(fa) * maxS * this.curWander;
      ay += Math.sin(fa) * maxS * this.curWander;
      // gentle pull to centre in chaos keeps the flock a cohesive mass
      const chaosF = 1 - Math.min(1, this.kGlobal);
      ax += (this.w / 2 - this.px[i]) * 0.0006 * chaosF * maxS;
      ay += (this.h / 2 - this.py[i]) * 0.0006 * chaosF * maxS;
      // flee the predator → split-and-reform swooshes
      if (pred.on) {
        const dx = this.px[i] - pred.x;
        const dy = this.py[i] - pred.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PR2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / PR) * maxS * 3.2;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      this.vx[i] += ax * 0.16;
      this.vy[i] += ay * 0.16;
      const sp = Math.hypot(this.vx[i], this.vy[i]) || 1;
      if (sp > maxS) {
        this.vx[i] = (this.vx[i] / sp) * maxS;
        this.vy[i] = (this.vy[i] / sp) * maxS;
      } else if (sp < this.minS) {
        this.vx[i] = (this.vx[i] / sp) * this.minS;
        this.vy[i] = (this.vy[i] / sp) * this.minS;
      }
    }
  }

  update(_dt: number, _t: number): void {
    for (let i = 0; i < this.N; i++) {
      this.dpx[i] = this.px[i];
      this.dpy[i] = this.py[i];
    }
    for (let sub = 0; sub < 2; sub++) {
      this.stepFlock();
      const w = this.w;
      const h = this.h;
      for (let i = 0; i < this.N; i++) {
        this.px[i] = (this.px[i] + this.vx[i] + w) % w;
        this.py[i] = (this.py[i] + this.vy[i] + h) % h;
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${this.pTrail})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = this.big ? 1.5 : 1.0;
    ctx.lineCap = "round";
    for (let i = 0; i < this.N; i++) {
      const c = this.cols[i % this.cols.length]!;
      const sp = Math.hypot(this.vx[i], this.vy[i]);
      const a = ((60 + 90 * Math.min(1, sp / this.maxS)) / 255).toFixed(3);
      // skip the seam when a boid wrapped this frame
      if (Math.abs(this.px[i] - this.dpx[i]) < w * 0.5 && Math.abs(this.py[i] - this.dpy[i]) < h * 0.5) {
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
        ctx.beginPath();
        ctx.moveTo(this.dpx[i], this.dpy[i]);
        ctx.lineTo(this.px[i], this.py[i]);
        ctx.stroke();
      }
    }
    for (let i = 0; i < this.N; i++) {
      const c = this.cols[i % this.cols.length]!;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.94)`;
      ctx.beginPath();
      ctx.arc(this.px[i], this.py[i], this.head * 0.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.spawnAll();
    this.clear();
  }

  reseed(): void {
    this.buildPalette();
    this.spawnAll();
    this.clear();
  }

  dispose(): void {
    /* no external resources */
  }
}

export const createBoids: PieceFactory = () => new Boids();
