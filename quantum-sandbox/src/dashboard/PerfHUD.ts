// Pinned readout: fps, backend, grid size, and the active system's live
// diagnostics (norm / energy / purity / variance…). The diagnostics ARE the
// correctness check — when a value drifts, the physics is wrong.

import type { Backend } from "../harness/GenerativeSystem";
import type { FrameInfo } from "../harness/loop";

export class PerfHUD {
  private el: HTMLElement;
  private backend: Backend = "canvas2d";
  private grid = "";

  constructor(host: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "perf-hud";
    host.appendChild(this.el);
  }

  setContext(backend: Backend, grid: string): void {
    this.backend = backend;
    this.grid = grid;
  }

  update(info: FrameInfo): void {
    const diag = Object.entries(info.diagnostics)
      .map(([k, v]) => `${k} ${fmt(v)}`)
      .join(" ");
    this.el.innerHTML =
      `<span>${info.fps} fps</span>` +
      `<span>${this.backend}</span>` +
      (this.grid ? `<span>${this.grid}</span>` : "") +
      `<span>frame ${info.frame}</span>` +
      `<span class="${info.playing ? "on" : "off"}">${info.playing ? "playing" : "paused"}</span>` +
      (diag ? `<span class="diag">${diag}</span>` : "");
  }
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return "∞";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1000 || a < 0.001) return v.toExponential(2);
  return v.toFixed(a < 1 ? 4 : 2);
}
