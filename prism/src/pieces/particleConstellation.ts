// particleConstellation — drifting nodes linked when near, an entanglement-graph
// motif. Nodes orbit on small seeded ellipses (period = loop → seamless).
// complexity = node count, chaos = orbit drift. O(N²) links kept cheap by a
// modest N (≤ ~220).

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;

class ParticleConstellation implements Piece {
  id = "particle-constellation";
  title = "Constellation";
  tags = ["quantum", "math"];
  backend = "canvas2d" as const;
  loopSeconds = 22;
  schema: ParamSchema = {
    linkDist: { type: "number", min: 0.08, max: 0.3, step: 0.01, default: 0.16, label: "link reach" },
    nodeSize: { type: "number", min: 0.8, max: 4, step: 0.1, default: 1.8, label: "node size" },
  };
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private pal!: Palette;
  private t = 0;
  private N = 120;
  private chaos = 0.45;
  private linkFrac = 0.16;
  private nodeSize = 1.8;
  private fx = new Float32Array(0);
  private fy = new Float32Array(0);
  private orb = new Float32Array(0);
  private oph = new Float32Array(0);
  private tone = new Float32Array(0);
  private xs = new Float32Array(0);
  private ys = new Float32Array(0);

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("constellation: canvas2d");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.pal = ctx.palette;
    this.linkFrac = Number(ctx.params.linkDist);
    this.nodeSize = Number(ctx.params.nodeSize);
    this.N = count(ctx.meta.complexity, 40, 220);
    this.chaos = ctx.meta.chaos;
    const N = this.N;
    this.fx = new Float32Array(N);
    this.fy = new Float32Array(N);
    this.orb = new Float32Array(N);
    this.oph = new Float32Array(N);
    this.tone = new Float32Array(N);
    this.xs = new Float32Array(N);
    this.ys = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      this.fx[i] = ctx.rng.next();
      this.fy[i] = ctx.rng.next();
      this.orb[i] = ctx.rng.range(0.01, 0.05);
      this.oph[i] = ctx.rng.range(0, TAU);
      this.tone[i] = ctx.rng.next();
    }
  }
  applyMeta(_complexity: number, chaos: number): void {
    // node count change needs a remount; drift applies live
    this.chaos = chaos;
  }
  update(_dt: number, t: number): void {
    this.t = t;
  }
  render(): void {
    const { ctx, w, h, N } = this;
    ctx.fillStyle = this.pal.bg;
    ctx.fillRect(0, 0, w, h);
    const ph = (this.t / this.loopSeconds) * TAU;
    const m = Math.min(w, h);
    const drift = (0.4 + this.chaos * 1.8) * m;
    for (let i = 0; i < N; i++) {
      const o = this.orb[i] * drift;
      this.xs[i] = this.fx[i] * w + Math.cos(ph + this.oph[i]) * o;
      this.ys[i] = this.fy[i] * h + Math.sin(ph + this.oph[i]) * o;
    }
    const link = this.linkFrac * m;
    const link2 = link * link;
    const edge = sample(this.pal, 0.6);
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = this.xs[i] - this.xs[j];
        const dy = this.ys[i] - this.ys[j];
        const d2 = dx * dx + dy * dy;
        if (d2 < link2) {
          const a = 1 - Math.sqrt(d2) / link;
          ctx.strokeStyle = `rgba(${edge[0]},${edge[1]},${edge[2]},${(a * a * 0.6).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(this.xs[i], this.ys[i]);
          ctx.lineTo(this.xs[j], this.ys[j]);
          ctx.stroke();
        }
      }
    }
    for (let i = 0; i < N; i++) {
      const c = sample(this.pal, 0.5 + this.tone[i] * 0.5);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.beginPath();
      ctx.arc(this.xs[i], this.ys[i], this.nodeSize, 0, TAU);
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

export const createParticleConstellation: PieceFactory = () => new ParticleConstellation();
