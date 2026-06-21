// The Prism project page (frond-studio /projects layout): a clear title +
// summary with the treatment (algo) dropdown up top, the viewer + parameter
// panel below, and an About section beneath — all inside the master content
// grid. Pick a treatment, shape it (params + complexity/chaos + resolution +
// theme), and get it out (preview-in-tab, copy-embed, PNG, WebM).

import { Pane } from "tweakpane";
import type { Config, ParamSchema, Params } from "../core/piece";
import { descriptors, firstDescriptor, defaultConfig, getDescriptor, type Descriptor } from "../runtime/Registry";
import { Player } from "../runtime/Player";
import { randomSeedString } from "../core/rng";
import { PALETTES } from "../core/color/theme";
import { writeHashConfig, readHashConfig, embedUrl, buildEmbedSnippet } from "../core/config";
import { download, exportPng, recordLoop, paramsHash } from "../core/export/capture";

const PRESETS = [
  { label: "Hero 1500×500", w: 1500, h: 500 },
  { label: "Wide 1920×600", w: 1920, h: 600 },
  { label: "HD 1920×1080", w: 1920, h: 1080 },
  { label: "Square 1080", w: 1080, h: 1080 },
  { label: "Story 1080×1920", w: 1080, h: 1920 },
];

interface PaneLike {
  addBinding(o: object, k: string, opts?: Record<string, unknown>): { on(e: "change", cb: () => void): unknown };
  dispose(): void;
}

export class Dashboard {
  private stage: HTMLElement;
  private algoSelect: HTMLSelectElement;
  private resEl: HTMLElement;
  private metaEl: HTMLElement;
  private paramsEl: HTMLElement;
  private fpsEl: HTMLElement;
  private playBtn: HTMLButtonElement;
  private toast: HTMLElement;
  private aboutTitle: HTMLElement;
  private aboutBody: HTMLElement;
  private aboutBackend: HTMLElement;
  private aboutTags: HTMLElement;
  private aboutLoop: HTMLElement;

  private player: Player | null = null;
  private pane: PaneLike | null = null;
  private desc: Descriptor | null = null;

  constructor(host: HTMLElement) {
    host.innerHTML = `
      <div class="wrap">
        <header class="head">
          <h1 class="title">Generatives</h1>
          <div class="intro">
            <p class="summary">A generative-visual lab — an array of animated, embeddable treatments for the visual language of a quantum-computing futures project. Pick a treatment, shape it, size it to any banner, and copy a paste-ready embed.</p>
            <label class="algo">
              <span class="algo-lbl">Treatment</span>
              <select class="algo-select"></select>
            </label>
          </div>
        </header>

        <section class="work">
          <div class="viewer">
            <div class="topbar">
              <button class="play">❚❚ pause</button>
              <span class="fps">—</span>
              <span class="grow"></span>
              <button data-act="preview">Preview ↗</button>
              <button data-act="copy">Copy embed</button>
              <button data-act="png">PNG</button>
              <button data-act="webm">WebM loop</button>
            </div>
            <div class="stage"></div>
          </div>
          <aside class="controls">
            <div class="grp res"></div>
            <div class="grp meta"></div>
            <div class="grp row2">
              <button data-act="randomise">⟳ Randomise</button>
              <button data-act="restart">↺ Restart</button>
            </div>
            <div class="grp params"></div>
          </aside>
        </section>

        <section class="about">
          <div class="lbl">About</div>
          <div class="about-cols">
            <div class="about-main">
              <h2 class="about-title"></h2>
              <p class="about-body"></p>
            </div>
            <dl class="about-meta">
              <div><dt>Backend</dt><dd class="ab-backend"></dd></div>
              <div><dt>Texture</dt><dd class="ab-tags"></dd></div>
              <div><dt>Loop</dt><dd class="ab-loop"></dd></div>
            </dl>
          </div>
        </section>
      </div>
      <div class="toast"></div>`;

    this.algoSelect = host.querySelector(".algo-select")!;
    this.stage = host.querySelector(".stage")!;
    this.resEl = host.querySelector(".res")!;
    this.metaEl = host.querySelector(".meta")!;
    this.paramsEl = host.querySelector(".params")!;
    this.fpsEl = host.querySelector(".fps")!;
    this.playBtn = host.querySelector(".play")!;
    this.toast = host.querySelector(".toast")!;
    this.aboutTitle = host.querySelector(".about-title")!;
    this.aboutBody = host.querySelector(".about-body")!;
    this.aboutBackend = host.querySelector(".ab-backend")!;
    this.aboutTags = host.querySelector(".ab-tags")!;
    this.aboutLoop = host.querySelector(".ab-loop")!;

    for (const d of descriptors) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.title;
      this.algoSelect.appendChild(o);
    }
    this.algoSelect.addEventListener("change", () => {
      const d = getDescriptor(this.algoSelect.value);
      if (d) this.select(d);
    });

    this.playBtn.addEventListener("click", () => {
      this.player?.toggle();
      this.playBtn.textContent = this.player?.isPlaying() ? "❚❚ pause" : "▶ play";
    });
    host.querySelector('[data-act="preview"]')!.addEventListener("click", () => {
      if (this.player) window.open(embedUrl(this.player.config), "_blank");
    });
    host.querySelector('[data-act="copy"]')!.addEventListener("click", () => this.copyEmbed());
    host.querySelector('[data-act="png"]')!.addEventListener("click", () => this.exportImage());
    host.querySelector('[data-act="webm"]')!.addEventListener("click", (e) => this.exportVideo(e.target as HTMLButtonElement));
    host.querySelector('[data-act="randomise"]')!.addEventListener("click", () => {
      this.player?.reseed(randomSeedString());
      this.persist();
    });
    host.querySelector('[data-act="restart"]')!.addEventListener("click", () => this.player?.restart());

    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " ") {
        e.preventDefault();
        this.playBtn.click();
      }
    });
  }

  boot(): void {
    const fromHash = readHashConfig();
    if (fromHash && getDescriptor(fromHash.pieceId)) {
      this.select(getDescriptor(fromHash.pieceId)!, fromHash);
    } else {
      const d = firstDescriptor();
      if (d) this.select(d);
    }
  }

  private select(d: Descriptor, cfg?: Config): void {
    this.desc = d;
    this.player?.destroy();
    this.stage.innerHTML = "";
    const config = cfg ?? defaultConfig(d.id)!;
    this.player = new Player(this.stage, config, {
      sizing: "fixed",
      onFrame: (fps) => (this.fpsEl.textContent = `${fps} fps · ${config.size.w}×${config.size.h} · ${d.backend}`),
    });
    this.playBtn.textContent = "❚❚ pause";
    this.buildResolution(config);
    this.buildMeta(config);
    this.buildParams(d.schema, config.params);
    this.algoSelect.value = d.id;
    this.updateAbout(d);
    this.persist();
  }

  private updateAbout(d: Descriptor): void {
    this.aboutTitle.textContent = d.title;
    this.aboutBody.textContent =
      `${d.title} is a ${d.tags.join(" · ")} treatment, animated in real time and built to be embedded. ` +
      `Tune complexity, chaos, palette and its parameters on the right, size it to any banner (hero, square, story), ` +
      `then preview it in a tab, copy the embed snippet, or export a PNG still or a seamless WebM loop.`;
    const backendLabel: Record<string, string> = { canvas2d: "Canvas 2D", webgl2: "WebGL2 (GPU)", three: "Three.js (WebGL)", p5: "p5.js" };
    this.aboutBackend.textContent = backendLabel[d.backend] ?? d.backend;
    this.aboutTags.textContent = d.tags.join(" · ");
    this.aboutLoop.textContent = d.loopSeconds ? `${d.loopSeconds}s` : "continuous";
  }

  private buildResolution(config: Config): void {
    this.resEl.innerHTML = `<div class="lbl">Resolution</div><div class="presets"></div>
      <div class="wh"><label>W<input class="w" type="number" value="${config.size.w}"></label>
      <label>H<input class="h" type="number" value="${config.size.h}"></label></div>`;
    const presets = this.resEl.querySelector(".presets")!;
    for (const p of PRESETS) {
      const b = document.createElement("button");
      b.textContent = p.label;
      b.addEventListener("click", () => this.applySize(p.w, p.h));
      presets.appendChild(b);
    }
    const wIn = this.resEl.querySelector<HTMLInputElement>(".w")!;
    const hIn = this.resEl.querySelector<HTMLInputElement>(".h")!;
    const apply = () => this.applySize(Number(wIn.value) | 0, Number(hIn.value) | 0);
    wIn.addEventListener("change", apply);
    hIn.addEventListener("change", apply);
  }

  private applySize(w: number, h: number): void {
    if (!this.player || w < 16 || h < 16) return;
    this.player.setSize(w, h);
    this.resEl.querySelector<HTMLInputElement>(".w")!.value = String(w);
    this.resEl.querySelector<HTMLInputElement>(".h")!.value = String(h);
    this.persist();
  }

  private buildMeta(config: Config): void {
    const themeOpts = Object.values(PALETTES).map((p) => `<option value="${p.id}">${p.label}</option>`).join("");
    this.metaEl.innerHTML = `
      <div class="lbl">Universal</div>
      <label class="slider">complexity <input class="cx" type="range" min="0" max="1" step="0.01" value="${config.meta.complexity}"></label>
      <label class="slider">chaos <input class="ch" type="range" min="0" max="1" step="0.01" value="${config.meta.chaos}"></label>
      <label class="slider">theme <select class="th">${themeOpts}</select></label>`;
    const cx = this.metaEl.querySelector<HTMLInputElement>(".cx")!;
    const ch = this.metaEl.querySelector<HTMLInputElement>(".ch")!;
    const th = this.metaEl.querySelector<HTMLSelectElement>(".th")!;
    th.value = config.theme;
    const meta = () => {
      this.player?.setMeta(Number(cx.value), Number(ch.value));
      this.persist();
    };
    cx.addEventListener("input", meta);
    ch.addEventListener("input", meta);
    th.addEventListener("change", () => {
      this.player?.setTheme(th.value);
      this.persist();
    });
  }

  private buildParams(schema: ParamSchema, params: Params): void {
    this.pane?.dispose();
    this.paramsEl.innerHTML = `<div class="lbl">Parameters</div>`;
    const pane = new Pane({ container: this.paramsEl }) as unknown as PaneLike;
    for (const key of Object.keys(schema)) {
      const spec = schema[key]!;
      const label = spec.label ?? key;
      if (spec.type === "select") {
        const options: Record<string, string> = {};
        for (const o of spec.options) options[o] = o;
        pane.addBinding(params, key, { label, options }).on("change", () => this.onParam(key, params));
      } else if (spec.type === "number") {
        pane.addBinding(params, key, { label, min: spec.min, max: spec.max, step: spec.step }).on("change", () => this.onParam(key, params));
      } else if (spec.type === "int") {
        pane.addBinding(params, key, { label, min: spec.min, max: spec.max, step: 1 }).on("change", () => this.onParam(key, params));
      } else {
        pane.addBinding(params, key, { label }).on("change", () => this.onParam(key, params));
      }
    }
    this.pane = pane;
  }

  private onParam(key: string, params: Params): void {
    this.player?.setParam(key, params[key]!);
    this.persist();
  }

  private persist(): void {
    if (this.player) writeHashConfig(this.player.config);
  }

  private async copyEmbed(): Promise<void> {
    if (!this.player) return;
    try {
      await navigator.clipboard.writeText(buildEmbedSnippet(this.player.config));
      this.flash("Embed code copied");
    } catch {
      this.flash("Copy failed — clipboard blocked");
    }
  }

  private async exportImage(): Promise<void> {
    if (!this.player) return;
    const c = this.player.config;
    download(await exportPng(this.player.canvas), `prism-${c.pieceId}-${paramsHash(c)}.png`);
  }

  private async exportVideo(btn: HTMLButtonElement): Promise<void> {
    if (!this.player || !this.desc) return;
    const secs = this.desc.loopSeconds ?? 8;
    btn.textContent = "● rec…";
    const blob = await recordLoop(this.player.canvas, secs);
    download(blob, `prism-${this.player.config.pieceId}-${paramsHash(this.player.config)}.webm`);
    btn.textContent = "WebM loop";
  }

  private flash(msg: string): void {
    this.toast.textContent = msg;
    this.toast.classList.add("on");
    setTimeout(() => this.toast.classList.remove("on"), 1800);
  }
}
