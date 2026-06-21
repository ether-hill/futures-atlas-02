// boids — a starling-murmuration / fish-school flocking model.
//
// Three things make it read like a real murmuration rather than generic boids:
//   • Topological neighbours — each bird steers off its K nearest flockmates
//     (regardless of distance), not everything in a fixed radius. This is what
//     real starlings do (Ballerini et al.) and it's what produces the density
//     waves and scale-free cohesion of a murmuration.
//   • Max-force steering — separation / alignment / cohesion are blended as
//     Reynolds steering forces and clamped to a turn budget, so the flock banks
//     and folds smoothly instead of snapping.
//   • Soft boundary containment — near the edges birds steer back inward, so the
//     flock stays one body that turns and folds in frame (no toroidal wrap, no
//     forced global heading — the drift is emergent + a gentle wandering flow).
// Occasional predator scares trigger the flash-expansion / reform events.
//
// Trails are drawn explicitly (canvas cleared to black each frame, recent history
// re-stroked with a tail that ramps to zero) so nothing is ever left behind.
//   nodes = flock size · speed · separation · wander · directional pause (how much
//   the drift keeps changing direction) · trail fade (tail length).

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { NoiseKit } from "../core/noise";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { range } from "../core/meta";

const TAU = Math.PI * 2;
const LMAX = 110; // max trail length (frames of history per boid)
const CB = 6; // colour buckets
const AB = 12; // alpha buckets along the tail
const K = 7; // topological neighbours per boid

class Boids implements Piece {
  id = "boids";
  title = "Boids";
  tags = ["nature", "flow", "physics"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    count: { type: "int", min: 80, max: 900, default: 380, label: "nodes" },
    speed: { type: "number", min: 4, max: 20, step: 0.5, default: 11, label: "speed" },
    separation: { type: "number", min: 0.4, max: 3, step: 0.1, default: 1.4, label: "separation" },
    wander: { type: "number", min: 0, max: 1.5, step: 0.05, default: 0.4, label: "wander" },
    directionalPause: { type: "number", min: 0, max: 1, step: 0.01, default: 0.45, label: "directional pause" },
    trail: { type: "number", min: 0.01, max: 0.14, step: 0.005, default: 0.05, label: "trail fade" },
  };

  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private rng!: RNG;
  private noise!: NoiseKit;
  private pal!: Palette;
  private cols: [number, number, number][] = [];

  private N = 380;
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private hx = new Float32Array(0); // position history ring (N × LMAX)
  private hy = new Float32Array(0);
  private hp = 0;
  private written = 0;
  private nd = new Float64Array(K); // scratch: nearest-neighbour distances²
  private ni = new Int32Array(K); // scratch: nearest-neighbour indices

  private maxS = 1;
  private minS = 0.6;
  private maxF = 0.1;
  private sepDist = 1;
  private margin = 1;
  private head = 2;
  private big = false;
  private flowT = 0;
  private trailLen = 24;

  private frame = 0;
  private nextScare = 150;
  private pred = { on: false, x: 0, y: 0, vx: 0, vy: 0, ttl: 0 };

  private pSpeed = 11;
  private pSep = 1.4;
  private pWander = 0.4;
  private pDirPause = 0.45;
  private pTrail = 0.05;
  private chaos = 0.5;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("boids: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.noise = ctx.noise;
    this.pal = ctx.palette;
    this.N = Number(ctx.params.count);
    this.pSpeed = Number(ctx.params.speed);
    this.pSep = Number(ctx.params.separation);
    this.pWander = Number(ctx.params.wander);
    this.pDirPause = Number(ctx.params.directionalPause);
    this.pTrail = Number(ctx.params.trail);
    this.chaos = ctx.meta.chaos;
    this.trailLen = Math.round(Math.min(LMAX, Math.max(6, 1.7 / (this.pTrail + 0.006))));
    this.buildPalette();
    this.alloc();
    this.spawnAll();
    this.clear();
  }

  applyMeta(_complexity: number, chaos: number): void {
    this.chaos = chaos; // wander agitation is live; node count / trail live on params
  }

  private buildPalette(): void {
    this.cols = [];
    for (let i = 0; i < CB; i++) this.cols.push(sample(this.pal, 0.35 + (i / (CB - 1)) * 0.6));
  }

  private alloc(): void {
    const N = this.N;
    this.px = new Float32Array(N);
    this.py = new Float32Array(N);
    this.vx = new Float32Array(N);
    this.vy = new Float32Array(N);
    this.hx = new Float32Array(N * LMAX);
    this.hy = new Float32Array(N * LMAX);
  }

  private dims(): void {
    const S = Math.min(this.w, this.h);
    this.big = S > 360;
    this.maxS = S * 0.001 * this.pSpeed;
    this.minS = this.maxS * 0.55;
    this.maxF = this.maxS * 0.09; // turn budget → smooth banking
    this.sepDist = S * 0.022;
    this.margin = S * 0.13;
    this.head = this.big ? 2.6 : 1.7;
  }

  private spawnAll(): void {
    this.dims();
    const cx = this.w / 2;
    const cy = this.h / 2;
    const r0 = Math.min(this.w, this.h) * 0.22;
    const gdir = this.rng.range(0, TAU); // a single loose initial heading reads as one body
    for (let i = 0; i < this.N; i++) {
      const a = this.rng.range(0, TAU);
      const r = this.rng.range(0, r0);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      this.px[i] = x;
      this.py[i] = y;
      const va = gdir + this.rng.range(-0.6, 0.6);
      this.vx[i] = Math.cos(va) * this.maxS;
      this.vy[i] = Math.sin(va) * this.maxS;
      for (let k = 0; k < LMAX; k++) {
        this.hx[i * LMAX + k] = x;
        this.hy[i * LMAX + k] = y;
      }
    }
    this.hp = 0;
    this.written = 1;
    this.flowT = this.rng.range(0, 1000);
    this.frame = 0;
    this.nextScare = 160 + this.rng.range(0, 220);
    this.pred = { on: false, x: 0, y: 0, vx: 0, vy: 0, ttl: 0 };
  }

  private clear(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private step(): void {
    const { N, maxS, minS, maxF } = this;
    const nd = this.nd;
    const ni = this.ni;
    const sep2 = this.sepDist * this.sepDist;
    const wSep = 1.5 * this.pSep;
    const wAli = 1.1;
    const wCoh = 0.6; // local cohesion (toward the K-neighbour centre)
    const wCenter = 0.4; // global cohesion (toward the flock centroid) → stays one body
    const wDrift = this.pWander * range(this.chaos, 0.8, 1.4); // shared whole-flock wander
    this.flowT += 0.0008 + this.pDirPause * 0.0045; // dirPause → the drift re-aims more often
    this.frame++;
    // ONE slowly-turning heading shared by the whole flock — so it drifts and banks
    // as a single body, instead of a per-position field tearing it into clusters.
    const driftA = this.noise.n2(this.flowT, 31.7) * Math.PI;
    const gdx = Math.cos(driftA);
    const gdy = Math.sin(driftA);
    // flock centroid for the gentle global-cohesion pull
    let cxs = 0;
    let cys = 0;
    for (let j = 0; j < N; j++) {
      cxs += this.px[j]!;
      cys += this.py[j]!;
    }
    const fcx = cxs / N;
    const fcy = cys / N;

    // predator schedule (flash-expansion events)
    const pred = this.pred;
    if (pred.on) {
      pred.x += pred.vx;
      pred.y += pred.vy;
      if (--pred.ttl <= 0) {
        pred.on = false;
        this.nextScare = this.frame + 200 + this.rng.range(0, 320);
      }
    } else if (this.frame > this.nextScare) {
      const edge = this.rng.int(0, 3);
      pred.x = edge === 1 ? this.w : edge === 3 ? 0 : this.rng.range(0, this.w);
      pred.y = edge === 0 ? 0 : edge === 2 ? this.h : this.rng.range(0, this.h);
      const tx = this.w * (0.3 + this.rng.range(0, 0.4));
      const ty = this.h * (0.3 + this.rng.range(0, 0.4));
      const ad = Math.hypot(tx - pred.x, ty - pred.y) || 1;
      const ps = maxS * 1.25;
      pred.vx = ((tx - pred.x) / ad) * ps;
      pred.vy = ((ty - pred.y) / ad) * ps;
      pred.ttl = 80 + this.rng.range(0, 90);
      pred.on = true;
    }
    const PR = Math.min(this.w, this.h) * 0.22;
    const PR2 = PR * PR;

    for (let i = 0; i < N; i++) {
      const xi = this.px[i]!;
      const yi = this.py[i]!;
      // ── K nearest neighbours (topological) ──
      for (let n = 0; n < K; n++) {
        nd[n] = Infinity;
        ni[n] = -1;
      }
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const dx = xi - this.px[j]!;
        const dy = yi - this.py[j]!;
        const d2 = dx * dx + dy * dy;
        if (d2 < nd[K - 1]!) {
          let p = K - 1;
          while (p > 0 && nd[p - 1]! > d2) {
            nd[p] = nd[p - 1]!;
            ni[p] = ni[p - 1]!;
            p--;
          }
          nd[p] = d2;
          ni[p] = j;
        }
      }

      let alx = 0, aly = 0, cox = 0, coy = 0, sepx = 0, sepy = 0, cnt = 0;
      for (let n = 0; n < K; n++) {
        const j = ni[n]!;
        if (j < 0) break;
        alx += this.vx[j]!;
        aly += this.vy[j]!;
        cox += this.px[j]!;
        coy += this.py[j]!;
        cnt++;
        if (nd[n]! < sep2) {
          const dx = xi - this.px[j]!;
          const dy = yi - this.py[j]!;
          const d = Math.sqrt(nd[n]!) || 1e-4;
          sepx += dx / d / d;
          sepy += dy / d / d;
        }
      }

      let ax = 0;
      let ay = 0;
      const vxi = this.vx[i]!;
      const vyi = this.vy[i]!;
      if (cnt > 0) {
        // alignment — match neighbours' mean heading
        let m = Math.hypot(alx, aly) || 1;
        ax += ((alx / m) * maxS - vxi) * wAli;
        ay += ((aly / m) * maxS - vyi) * wAli;
        // cohesion — steer toward the local centre of mass
        let dcx = cox / cnt - xi;
        let dcy = coy / cnt - yi;
        m = Math.hypot(dcx, dcy) || 1;
        ax += ((dcx / m) * maxS - vxi) * wCoh;
        ay += ((dcy / m) * maxS - vyi) * wCoh;
        // separation — keep personal space
        if (sepx !== 0 || sepy !== 0) {
          m = Math.hypot(sepx, sepy) || 1;
          ax += ((sepx / m) * maxS - vxi) * wSep;
          ay += ((sepy / m) * maxS - vyi) * wSep;
        }
      }
      // global cohesion — gently steer toward the flock centroid so it stays one body
      {
        const dgx = fcx - xi;
        const dgy = fcy - yi;
        const gm = Math.hypot(dgx, dgy) || 1;
        ax += ((dgx / gm) * maxS - vxi) * wCenter;
        ay += ((dgy / gm) * maxS - vyi) * wCenter;
      }
      // shared wandering drift — the whole flock leans toward one slowly-turning heading
      ax += (gdx * maxS - vxi) * wDrift;
      ay += (gdy * maxS - vyi) * wDrift;

      // clamp the flocking force to the turn budget → smooth banking
      const am = Math.hypot(ax, ay);
      if (am > maxF) {
        ax = (ax / am) * maxF;
        ay = (ay / am) * maxF;
      }

      // soft boundary containment — turn and fold back into frame (added after the
      // clamp so the edge actually turns the flock instead of letting it leave)
      const mg = this.margin;
      if (xi < mg) ax += this.maxF * 1.4 * (1 - xi / mg);
      else if (xi > this.w - mg) ax -= this.maxF * 1.4 * (1 - (this.w - xi) / mg);
      if (yi < mg) ay += this.maxF * 1.4 * (1 - yi / mg);
      else if (yi > this.h - mg) ay -= this.maxF * 1.4 * (1 - (this.h - yi) / mg);

      // flee the predator → flash expansion (punches past the turn budget)
      if (pred.on) {
        const dx = xi - pred.x;
        const dy = yi - pred.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PR2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / PR) * this.maxF * 6;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }

      let nvx = vxi + ax;
      let nvy = vyi + ay;
      const sp = Math.hypot(nvx, nvy) || 1;
      if (sp > maxS) {
        nvx = (nvx / sp) * maxS;
        nvy = (nvy / sp) * maxS;
      } else if (sp < minS) {
        nvx = (nvx / sp) * minS;
        nvy = (nvy / sp) * minS;
      }
      this.vx[i] = nvx;
      this.vy[i] = nvy;
    }

    // integrate (no wrap — the flock stays in frame)
    for (let i = 0; i < N; i++) {
      this.px[i]! += this.vx[i]!;
      this.py[i]! += this.vy[i]!;
    }
  }

  update(_dt: number, _t: number): void {
    this.step();
    this.step();
    this.hp = (this.hp + 1) % LMAX;
    const base = this.hp;
    for (let i = 0; i < this.N; i++) {
      this.hx[i * LMAX + base] = this.px[i]!;
      this.hy[i * LMAX + base] = this.py[i]!;
    }
    if (this.written < LMAX) this.written++;
  }

  render(): void {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h); // hard clear → no ghost residue ever
    const L = Math.min(this.trailLen, this.written);
    if (L >= 2) {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = this.big ? 1.4 : 1.0;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const headA = 0.5;
      const seam = Math.min(w, h) * 0.5;
      const paths: Path2D[] = [];
      for (let i = 0; i < CB * AB; i++) paths.push(new Path2D());
      for (let i = 0; i < this.N; i++) {
        const cbk = i % CB;
        const baseI = i * LMAX;
        for (let k = 0; k < L - 1; k++) {
          const ia = (this.hp - k + LMAX * 2) % LMAX;
          const ib = (this.hp - k - 1 + LMAX * 2) % LMAX;
          const x1 = this.hx[baseI + ia]!;
          const y1 = this.hy[baseI + ia]!;
          const x2 = this.hx[baseI + ib]!;
          const y2 = this.hy[baseI + ib]!;
          if (Math.abs(x1 - x2) > seam || Math.abs(y1 - y2) > seam) continue; // safety
          const tnorm = 1 - k / L;
          let ab = (tnorm * AB) | 0;
          if (ab >= AB) ab = AB - 1;
          const p = paths[cbk * AB + ab]!;
          p.moveTo(x1, y1);
          p.lineTo(x2, y2);
        }
      }
      for (let cbk = 0; cbk < CB; cbk++) {
        const c = this.cols[cbk]!;
        for (let ab = 0; ab < AB; ab++) {
          const a = headA * Math.pow((ab + 0.5) / AB, 1.6);
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
          ctx.stroke(paths[cbk * AB + ab]!);
        }
      }
      for (let i = 0; i < this.N; i++) {
        const c = this.cols[i % CB]!;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.92)`;
        ctx.beginPath();
        ctx.arc(this.px[i]!, this.py[i]!, this.head * 0.5, 0, TAU);
        ctx.fill();
      }
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
