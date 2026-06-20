// Owns the canvas surface and the animation loop; plays a Piece from a Config.
// The dashboard stage and the embeddable iframe both run a Player — same code,
// same Config, same result.

import type { Config, Piece, ParamValue } from "../core/piece";
import { makeRng } from "../core/rng";
import { makeNoise } from "../core/noise";
import { getPalette } from "../core/color/theme";
import { createSurface, sizeSurface, type RenderSurface } from "../core/surface";
import { createPiece } from "./Registry";

export interface PlayerOpts {
  /** "fixed" → render at config.size; "fit" → fill the container (embed) */
  sizing?: "fixed" | "fit";
  onFrame?: (fps: number) => void;
}

export class Player {
  readonly canvas: HTMLCanvasElement;
  private surface: RenderSurface;
  private piece: Piece | null = null;
  private cfg: Config;
  private opts: PlayerOpts;
  private raf = 0;
  private playing = false;
  private last = 0;
  private elapsed = 0;
  private fpsT = 0;
  private fpsN = 0;

  constructor(container: HTMLElement, cfg: Config, opts: PlayerOpts = {}) {
    this.cfg = cfg;
    this.opts = opts;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "prism-canvas";
    container.appendChild(this.canvas);
    this.surface = createSurface(this.canvas);
    this.mount();
  }

  get config(): Config {
    return this.cfg;
  }

  private dims(): { w: number; h: number } {
    if (this.opts.sizing === "fit") {
      const r = this.canvas.parentElement!.getBoundingClientRect();
      return { w: Math.max(2, Math.floor(r.width)), h: Math.max(2, Math.floor(r.height)) };
    }
    return { w: this.cfg.size.w, h: this.cfg.size.h };
  }

  private mount(): void {
    this.pause();
    this.piece?.dispose();
    const { w, h } = this.dims();
    sizeSurface(this.surface, w, h, 1);
    const rng = makeRng(this.cfg.seed);
    const noise = makeNoise(rng);
    const palette = getPalette(this.cfg.theme);
    const piece = createPiece(this.cfg.pieceId);
    if (!piece) return;
    piece.init({
      surface: this.surface,
      width: this.surface.width,
      height: this.surface.height,
      rng,
      noise,
      palette,
      params: this.cfg.params,
      meta: this.cfg.meta,
    });
    piece.applyMeta(this.cfg.meta.complexity, this.cfg.meta.chaos);
    this.piece = piece;
    this.elapsed = 0;
    piece.render();
    this.play();
  }

  private tick = (now: number): void => {
    if (!this.playing || !this.piece) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.elapsed += dt;
    const T = this.piece.loopSeconds;
    const t = T ? this.elapsed % T : this.elapsed;
    this.piece.update(dt, t);
    this.piece.render();
    this.fpsN++;
    if (now - this.fpsT > 500) {
      this.opts.onFrame?.(Math.round((this.fpsN * 1000) / (now - this.fpsT)));
      this.fpsN = 0;
      this.fpsT = now;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  play(): void {
    if (this.playing || !this.piece) return;
    this.playing = true;
    this.last = 0;
    this.fpsT = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }
  toggle(): void {
    this.playing ? this.pause() : this.play();
  }
  isPlaying(): boolean {
    return this.playing;
  }

  restart(): void {
    this.mount();
  }
  reseed(seed: string): void {
    this.cfg.seed = seed;
    this.mount();
  }
  setParam(key: string, value: ParamValue): void {
    this.cfg.params[key] = value;
    this.mount();
  }
  setTheme(theme: string): void {
    this.cfg.theme = theme;
    this.mount();
  }
  setMeta(complexity: number, chaos: number): void {
    this.cfg.meta = { complexity, chaos };
    this.piece?.applyMeta(complexity, chaos);
  }
  setSize(w: number, h: number): void {
    this.cfg.size = { w, h };
    if (this.opts.sizing !== "fit") this.mount();
  }
  /** for "fit" players (embed): re-fit to the container */
  refit(): void {
    if (this.opts.sizing !== "fit" || !this.piece) return;
    const { w, h } = this.dims();
    sizeSurface(this.surface, w, h, 1);
    this.piece.resize(this.surface.width, this.surface.height);
  }

  destroy(): void {
    this.pause();
    this.piece?.dispose();
    this.piece = null;
  }
}
