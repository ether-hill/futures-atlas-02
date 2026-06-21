// physarum — slime-mould transport networks via the Jones (2010) agent model.
// Each agent samples a shared chemoattractant trail at three points ahead
// (front, front-left, front-right), rotates toward the strongest, steps forward
// and deposits; the whole field is then diffused and decayed, carving the stable
// channels Physarum polycephalum is famous for. Simulated on a downscaled grid
// (≤ ~320px) and upscaled, so it stays CPU-cheap at any banner size. Ported from
// the Frond "Algorithms" lab. complexity = agent count; chaos = turn jitter.

import type { Piece, PieceContext, PieceFactory, ParamSchema } from "../core/piece";
import type { RNG } from "../core/rng";
import type { Palette } from "../core/color/theme";
import { sample } from "../core/color/theme";
import { count } from "../core/meta";

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

interface Character {
  sensorAngle: number; // deg
  sensorDist: number; // grid px
  turnSpeed: number; // deg
  stepSize: number; // grid px
  deposit: number;
  diffuse: number; // 0..1
}

// Three Jones "characters" in the spirit of the studio's curated slime scenes.
const PRESETS: Record<string, Character> = {
  network: { sensorAngle: 24, sensorDist: 9, turnSpeed: 30, stepSize: 1.2, deposit: 0.08, diffuse: 0.25 },
  filaments: { sensorAngle: 15, sensorDist: 19, turnSpeed: 17, stepSize: 1.5, deposit: 0.07, diffuse: 0.0 },
  bloom: { sensorAngle: 31, sensorDist: 12, turnSpeed: 23, stepSize: 1.0, deposit: 0.1, diffuse: 0.5 },
};

class Physarum implements Piece {
  id = "physarum";
  title = "Physarum";
  tags = ["nature", "math", "flow"];
  backend = "canvas2d" as const;
  schema: ParamSchema = {
    preset: { type: "select", options: ["network", "filaments", "bloom"], default: "network", label: "character" },
    decay: { type: "number", min: 0.85, max: 0.99, step: 0.005, default: 0.92, label: "trail persistence" },
    intensity: { type: "number", min: 0.5, max: 4, step: 0.1, default: 1.6, label: "glow" },
    steps: { type: "int", min: 1, max: 4, default: 2, label: "speed" },
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
  private trail = new Float32Array(4);
  private tmp = new Float32Array(4);

  private N = 12000;
  private ax = new Float32Array(0);
  private ay = new Float32Array(0);
  private ah = new Float32Array(0);

  private ch: Character = PRESETS.network!;
  private decay = 0.92;
  private intensity = 1.6;
  private steps = 2;
  private chaos = 0.5;

  init(ctx: PieceContext): void {
    if (ctx.surface.kind !== "canvas2d") throw new Error("physarum: expected canvas2d surface");
    this.ctx = ctx.surface.ctx;
    this.w = ctx.width;
    this.h = ctx.height;
    this.rng = ctx.rng;
    this.pal = ctx.palette;
    this.ch = PRESETS[String(ctx.params.preset)] ?? PRESETS.network!;
    this.decay = Number(ctx.params.decay);
    this.intensity = Number(ctx.params.intensity);
    this.steps = Number(ctx.params.steps);
    this.N = count(ctx.meta.complexity, 3000, 40000);
    this.chaos = ctx.meta.chaos;
    this.buildLut();
    this.allocGrid();
    this.allocAgents();
    this.seedAgents();
  }

  applyMeta(_complexity: number, chaos: number): void {
    // agent count change needs a remount; turn jitter applies live
    this.chaos = chaos;
  }

  private buildLut(): void {
    for (let i = 0; i < 256; i++) {
      const c = sample(this.pal, i / 255);
      this.lut[i * 3] = c[0];
      this.lut[i * 3 + 1] = c[1];
      this.lut[i * 3 + 2] = c[2];
    }
  }

  private allocGrid(): void {
    const scale = Math.min(1, 320 / Math.max(this.w, this.h));
    this.gw = Math.max(2, Math.round(this.w * scale));
    this.gh = Math.max(2, Math.round(this.h * scale));
    this.trail = new Float32Array(this.gw * this.gh);
    this.tmp = new Float32Array(this.gw * this.gh);
    this.off = document.createElement("canvas");
    this.off.width = this.gw;
    this.off.height = this.gh;
    this.octx = this.off.getContext("2d")!;
    this.img = this.octx.createImageData(this.gw, this.gh);
    const d = this.img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = 255; // opaque
  }

  private allocAgents(): void {
    this.ax = new Float32Array(this.N);
    this.ay = new Float32Array(this.N);
    this.ah = new Float32Array(this.N);
  }

  private seedAgents(): void {
    this.trail.fill(0);
    // spawn in a centred disk so the network grows outward
    const cx = this.gw / 2;
    const cy = this.gh / 2;
    const r0 = Math.min(this.gw, this.gh) * 0.35;
    for (let i = 0; i < this.N; i++) {
      const a = this.rng.range(0, TAU);
      const r = Math.sqrt(this.rng.next()) * r0;
      this.ax[i] = cx + Math.cos(a) * r;
      this.ay[i] = cy + Math.sin(a) * r;
      this.ah[i] = this.rng.range(0, TAU);
    }
  }

  private sampleAt(x: number, y: number): number {
    const gw = this.gw;
    const gh = this.gh;
    let ix = Math.floor(x) % gw;
    let iy = Math.floor(y) % gh;
    if (ix < 0) ix += gw;
    if (iy < 0) iy += gh;
    return this.trail[iy * gw + ix]!;
  }

  private step(): void {
    const { gw, gh } = this;
    const SA = this.ch.sensorAngle * D2R;
    const SD = this.ch.sensorDist;
    const TS = this.ch.turnSpeed * D2R;
    const stepLen = this.ch.stepSize;
    const dep = this.ch.deposit;
    const jit = this.chaos * 0.35;
    for (let i = 0; i < this.N; i++) {
      const x = this.ax[i]!;
      const y = this.ay[i]!;
      let h = this.ah[i]!;
      const f = this.sampleAt(x + Math.cos(h) * SD, y + Math.sin(h) * SD);
      const l = this.sampleAt(x + Math.cos(h - SA) * SD, y + Math.sin(h - SA) * SD);
      const r = this.sampleAt(x + Math.cos(h + SA) * SD, y + Math.sin(h + SA) * SD);
      if (f > l && f > r) {
        // straight ahead
      } else if (f < l && f < r) {
        h += this.rng.next() < 0.5 ? TS : -TS; // ambiguous → random turn
      } else if (l < r) {
        h += TS;
      } else if (r < l) {
        h -= TS;
      }
      if (jit > 0) h += (this.rng.next() - 0.5) * jit;
      let nx = x + Math.cos(h) * stepLen;
      let ny = y + Math.sin(h) * stepLen;
      // toroidal wrap
      if (nx < 0) nx += gw;
      else if (nx >= gw) nx -= gw;
      if (ny < 0) ny += gh;
      else if (ny >= gh) ny -= gh;
      this.ax[i] = nx;
      this.ay[i] = ny;
      this.ah[i] = h;
      const ix = nx | 0;
      const iy = ny | 0;
      this.trail[iy * gw + ix]! += dep;
    }
  }

  private diffuseDecay(): void {
    const { gw, gh, decay } = this;
    const diff = this.ch.diffuse;
    const t = this.trail;
    if (diff <= 0) {
      for (let i = 0; i < t.length; i++) t[i]! *= decay;
      return;
    }
    const tmp = this.tmp;
    const keep = 1 - diff;
    for (let y = 0; y < gh; y++) {
      const yu = ((y - 1 + gh) % gh) * gw;
      const yd = ((y + 1) % gh) * gw;
      const yc = y * gw;
      for (let x = 0; x < gw; x++) {
        const xl = (x - 1 + gw) % gw;
        const xr = (x + 1) % gw;
        const sum =
          t[yu + xl]! + t[yu + x]! + t[yu + xr]! +
          t[yc + xl]! + t[yc + x]! + t[yc + xr]! +
          t[yd + xl]! + t[yd + x]! + t[yd + xr]!;
        const avg = sum / 9;
        tmp[yc + x] = (keep * t[yc + x]! + diff * avg) * decay;
      }
    }
    this.trail = tmp;
    this.tmp = t;
  }

  update(_dt: number, _t: number): void {
    for (let s = 0; s < this.steps; s++) this.step();
    this.diffuseDecay();
  }

  render(): void {
    const d = this.img.data;
    const t = this.trail;
    const lut = this.lut;
    const k = this.intensity;
    for (let i = 0; i < t.length; i++) {
      // tone curve maps unbounded trail → [0,1] without harsh clipping
      const tone = 1 - Math.exp(-t[i]! * k);
      const li = (tone * 255) | 0;
      const o = i * 4;
      const li3 = (li < 0 ? 0 : li > 255 ? 255 : li) * 3;
      d[o] = lut[li3]!;
      d[o + 1] = lut[li3 + 1]!;
      d[o + 2] = lut[li3 + 2]!;
    }
    this.octx.putImageData(this.img, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.off, 0, 0, this.w, this.h);
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.allocGrid();
    this.seedAgents();
  }

  reseed(): void {
    this.seedAgents();
  }

  dispose(): void {
    /* offscreen canvas is GC'd */
  }
}

export const createPhysarum: PieceFactory = () => new Physarum();
