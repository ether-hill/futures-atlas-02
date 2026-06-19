// The shell: canvas mount, system switch, transport, panel, PerfHUD, and URL
// param-state sync. Owns the loop; systems stay pure (seed, params) → output.

import type { GenerativeSystem, Params, RenderSurface } from "../harness/GenerativeSystem";
import { defaultsOf, deviceSize } from "../harness/GenerativeSystem";
import { makeRng, randomSeedString } from "../core/math/rng";
import { createSurface, resizeSurface, disposeSurface } from "../harness/surface";
import { createLoop, type Loop } from "../harness/loop";
import { buildPanel, type PanelHandle } from "../harness/panel";
import {
  exportCurrentPng,
  exportHiResPng,
  startRecording,
  download,
  paramsHash,
  type Recorder,
} from "../core/export/capture";
import { allSystems, getSystem, firstSystem } from "./SystemRegistry";
import { PerfHUD } from "./PerfHUD";
import { Transport } from "./Transport";
import { readState, writeState } from "./paramState";

export class Dashboard {
  private stage: HTMLElement;
  private nav: HTMLElement;
  private panelEl: HTMLElement;
  private hud: PerfHUD;
  private transport: Transport;

  private active: GenerativeSystem | null = null;
  private params: Params = {};
  private seed = randomSeedString();
  private surface: RenderSurface | null = null;
  private loop: Loop | null = null;
  private panel: PanelHandle | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ro: ResizeObserver | null = null;
  private resizeT = 0;
  private recorder: Recorder | null = null;

  constructor(host: HTMLElement) {
    host.innerHTML = `
      <aside class="side">
        <h1>Quantum Sandbox <span>· Futures Atlas</span></h1>
        <nav class="systems"></nav>
        <div class="panel"></div>
        <p class="spine">magnitude → density · phase → hue</p>
      </aside>
      <main class="stage-wrap">
        <div class="topbar"></div>
        <div class="stage"></div>
      </main>
    `;
    this.nav = host.querySelector(".systems")!;
    this.panelEl = host.querySelector(".panel")!;
    this.stage = host.querySelector(".stage")!;
    const topbar = host.querySelector<HTMLElement>(".topbar")!;

    this.hud = new PerfHUD(topbar);
    this.transport = new Transport(topbar, {
      toggle: () => this.loop?.toggle(),
      step: () => this.loop?.stepOnce(),
      reset: () => this.loop?.reset(),
      reseed: () => this.setSeed(randomSeedString(), true),
      exportPng: (scale) => void this.exportPng(scale),
      toggleRecord: () => this.toggleRecord(),
    });

    for (const sys of allSystems()) {
      const b = document.createElement("button");
      b.dataset.id = sys.id;
      b.innerHTML = `<span class="t">${sys.title}</span><span class="b">${sys.blurb}</span><span class="be">${sys.backend}</span>`;
      b.addEventListener("click", () => this.select(sys));
      this.nav.appendChild(b);
    }

    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " ") {
        e.preventDefault();
        this.loop?.toggle();
      } else if (e.key === "r") this.loop?.reset();
    });
  }

  boot(): void {
    const shared = readState();
    const sys = (shared.systemId && getSystem(shared.systemId)) || firstSystem();
    if (!sys) return;
    this.select(sys, shared.seed, shared.params);
  }

  private dims(): { w: number; h: number; dpr: number } {
    const r = this.stage.getBoundingClientRect();
    return {
      w: Math.max(2, Math.floor(r.width)),
      h: Math.max(2, Math.floor(r.height)),
      dpr: Math.min(2, window.devicePixelRatio || 1),
    };
  }

  private select(sys: GenerativeSystem, seed?: string, savedParams?: Params): void {
    this.active = sys;
    if (seed) this.seed = seed;

    const schemaWithSeed = { seed: { type: "seed", default: this.seed } as const, ...sys.schema };
    this.params = { seed: this.seed, ...defaultsOf(sys.schema), ...(savedParams ?? {}) };
    this.params.seed = this.seed;

    this.ro?.disconnect();
    this.loop?.destroy();
    if (this.surface) disposeSurface(this.surface);
    this.canvas?.remove();

    this.canvas = document.createElement("canvas");
    this.canvas.className = "view";
    this.stage.appendChild(this.canvas);
    this.surface = createSurface(this.canvas, sys.backend);
    const { w, h, dpr } = this.dims();
    resizeSurface(this.surface, w, h, dpr);
    const dev = deviceSize(this.surface);
    this.hud.setContext(sys.backend, `${dev.w}×${dev.h}`);

    this.loop = createLoop(this.surface, makeRng, (info) => {
      this.hud.update(info);
      this.transport.setPlaying(info.playing);
    });

    this.panel?.dispose();
    this.panelEl.innerHTML = "";
    this.panel = buildPanel(this.panelEl, schemaWithSeed, this.params, {
      randomSeed: randomSeedString,
      onSeed: (s) => this.setSeed(s, false),
      onChange: (_k, hot) => {
        if (!hot) this.loop?.reset();
        this.persist();
      },
    });

    this.loop.load(sys, this.params, this.seed);

    this.ro = new ResizeObserver(() => {
      clearTimeout(this.resizeT);
      this.resizeT = window.setTimeout(() => {
        if (!this.surface) return;
        const d = this.dims();
        resizeSurface(this.surface, d.w, d.h, d.dpr);
        const dv = deviceSize(this.surface);
        this.hud.setContext(sys.backend, `${dv.w}×${dv.h}`);
        this.loop?.reset();
      }, 140) as unknown as number;
    });
    this.ro.observe(this.stage);

    this.nav.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.id === sys.id));
    this.persist();
  }

  private setSeed(seed: string, refreshPanel: boolean): void {
    this.seed = seed;
    this.params.seed = seed;
    if (refreshPanel) this.panel?.refresh();
    this.loop?.setSeed(seed);
    this.loop?.reset();
    this.persist();
  }

  private persist(): void {
    if (!this.active) return;
    writeState(this.active.id, this.seed, this.params);
  }

  private async exportPng(scale: number): Promise<void> {
    if (!this.active || !this.surface || !this.loop) return;
    const tag = `${this.active.id}-${this.seed}-${paramsHash(this.params)}`;
    if (scale <= 1) {
      download(await exportCurrentPng(this.surface), `${tag}.png`);
      return;
    }
    const blob = await exportHiResPng(
      this.active,
      this.params,
      this.seed,
      scale,
      this.surface.width,
      this.surface.height,
      this.loop.frameCount(),
      makeRng,
    );
    download(blob, `${tag}-${scale}x.png`);
  }

  private async toggleRecord(): Promise<boolean> {
    if (this.recorder?.active) {
      const blob = await this.recorder.stop();
      this.recorder = null;
      download(blob, `${this.active?.id ?? "capture"}-${this.seed}.webm`);
      return false;
    }
    if (!this.canvas) return false;
    this.recorder = startRecording(this.canvas);
    return true;
  }
}
