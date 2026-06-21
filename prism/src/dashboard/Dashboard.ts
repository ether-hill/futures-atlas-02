// The Generatives studio page — same layout as the Frond "Algorithms" page:
// a title + summary, the ALGORITHM selector below it, then a large live visual
// with Presets (top-left) and Restart / Randomise (top-right) over it, a sticky
// controls panel on the right (Settings — params + complexity/chaos + colours,
// then Export Video), and an About section beneath.

import { Pane } from "tweakpane";
import type { Config } from "../core/piece";
import { defaultsOf } from "../core/piece";
import { descriptors, firstDescriptor, defaultConfig, getDescriptor, type Descriptor } from "../runtime/Registry";
import { Player } from "../runtime/Player";
import { randomSeedString, makeRng } from "../core/rng";
import { DEFAULT_COLORS, type Colors } from "../core/color/theme";
import { presetsFor, randomPatch, type Preset } from "../runtime/presets";
import { writeHashConfig, readHashConfig } from "../core/config";
import { download, recordVideo } from "../core/export/capture";

interface TpBinding {
  on(ev: "change", cb: () => void): TpBinding;
}
interface TpButton {
  on(ev: "click", cb: () => void): TpButton;
  title: string;
  disabled: boolean;
}
interface TpFolder {
  addBinding(o: object, k: string, opts?: Record<string, unknown>): TpBinding;
  addButton(o: { title: string }): TpButton;
}
interface TpPane extends TpFolder {
  addFolder(o: { title: string; expanded?: boolean }): TpFolder;
  refresh(): void;
  dispose(): void;
}

const BACKEND_LABEL: Record<string, string> = {
  canvas2d: "Canvas 2D",
  webgl2: "WebGL2 · GPU",
  three: "Three.js",
  p5: "p5.js",
};

export class Dashboard {
  private stage: HTMLElement;
  private algoSelect: HTMLSelectElement;
  private presetSelect: HTMLSelectElement;
  private panelHost: HTMLElement;
  private fpsEl: HTMLElement;
  private toast: HTMLElement;
  private aboutTitle: HTMLElement;
  private aboutBody: HTMLElement;

  private player: Player | null = null;
  private pane: TpPane | null = null;
  private desc: Descriptor | null = null;
  private presets: Preset[] = [];

  private metaState = { complexity: 0.45, chaos: 0.45 };
  private colorState: Colors = { ...DEFAULT_COLORS };
  private rec = { width: 1280, height: 720, fps: 30, seconds: 10 };
  private remountTimer = 0;

  constructor(host: HTMLElement) {
    host.innerHTML = `
      <div class="studio-root">
        <header class="studio-head">
          <h1 class="studio-title">Generatives</h1>
          <p class="studio-intro">A generative-visual lab — an array of animated, embeddable treatments for the visual language of a quantum-computing futures project. Pick a treatment, tune it in real time, and capture it.</p>
        </header>
        <div class="studio-wrap">
          <div class="studio-selectbar">
            <label for="algo-algo">Algorithm</label>
            <select id="algo-algo" class="algo-select" aria-label="Algorithm"></select>
          </div>
          <div class="studio-grid">
            <div class="studio-visual">
              <div class="studio-presetbar">
                <label for="algo-preset">Presets</label>
                <select id="algo-preset" class="preset-select" aria-label="Presets"><option value="">default</option></select>
              </div>
              <div class="studio-topctl">
                <button data-act="restart">Restart</button>
                <button data-act="randomise" class="is-accent">Randomise</button>
              </div>
              <div class="studio-fps">—</div>
              <div class="stage"></div>
            </div>
            <aside class="studio-side">
              <div class="studio-controls"></div>
            </aside>
          </div>
          <section class="studio-about">
            <h3 class="studio-about-title"></h3>
            <div class="studio-about-body"></div>
          </section>
        </div>
      </div>
      <div class="toast"></div>`;

    this.stage = host.querySelector(".stage")!;
    this.algoSelect = host.querySelector("#algo-algo")!;
    this.presetSelect = host.querySelector("#algo-preset")!;
    this.panelHost = host.querySelector(".studio-controls")!;
    this.fpsEl = host.querySelector(".studio-fps")!;
    this.toast = host.querySelector(".toast")!;
    this.aboutTitle = host.querySelector(".studio-about-title")!;
    this.aboutBody = host.querySelector(".studio-about-body")!;

    for (const d of descriptors) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = `${d.title} · ${d.tags.join(" / ")}`;
      this.algoSelect.appendChild(o);
    }
    this.algoSelect.addEventListener("change", () => {
      const d = getDescriptor(this.algoSelect.value);
      if (d) this.select(d);
    });
    this.presetSelect.addEventListener("change", () => {
      if (this.presetSelect.value !== "") this.applyPreset(Number(this.presetSelect.value));
    });
    host.querySelector('[data-act="restart"]')!.addEventListener("click", () => this.player?.restart());
    host.querySelector('[data-act="randomise"]')!.addEventListener("click", () => this.randomise());

    window.addEventListener("resize", () => this.player?.refit());
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === " ") {
        e.preventDefault();
        this.player?.toggle();
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
    config.colors = config.colors ?? { ...DEFAULT_COLORS };
    this.metaState = { ...config.meta };
    this.colorState = { ...config.colors };
    this.player = new Player(this.stage, config, {
      sizing: "fit",
      onFrame: (fps) => (this.fpsEl.textContent = `${fps} fps · ${BACKEND_LABEL[d.backend] ?? d.backend}`),
    });
    this.algoSelect.value = d.id;
    this.buildPresets(d);
    this.buildControls(d, config);
    this.updateAbout(d);
    this.persist();
  }

  private buildPresets(d: Descriptor): void {
    this.presets = presetsFor(d.id, d.schema);
    this.presetSelect.innerHTML = `<option value="">default</option>`;
    this.presets.forEach((p, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = p.label;
      this.presetSelect.appendChild(o);
    });
    this.presetSelect.value = "";
  }

  private buildControls(d: Descriptor, config: Config): void {
    this.pane?.dispose();
    this.panelHost.innerHTML = "";
    const pane = new Pane({ container: this.panelHost }) as unknown as TpPane;

    const settings = pane.addFolder({ title: "Settings", expanded: true });
    for (const key of Object.keys(d.schema)) {
      const spec = d.schema[key]!;
      const label = spec.label ?? key;
      const opts: Record<string, unknown> = { label };
      if (spec.type === "number") {
        opts.min = spec.min;
        opts.max = spec.max;
        opts.step = spec.step;
      } else if (spec.type === "int") {
        opts.min = spec.min;
        opts.max = spec.max;
        opts.step = 1;
      } else if (spec.type === "select") {
        opts.options = Object.fromEntries(spec.options.map((o) => [o, o]));
      }
      settings.addBinding(config.params, key, opts).on("change", () => this.onParamChange());
    }
    // universal knobs folded into Settings
    settings.addBinding(this.metaState, "complexity", { min: 0, max: 1, step: 0.01, label: "complexity" }).on("change", () => this.onMetaChange());
    settings.addBinding(this.metaState, "chaos", { min: 0, max: 1, step: 0.01, label: "chaos" }).on("change", () => this.onMetaChange());
    // per-algorithm colour selection
    settings.addBinding(this.colorState, "bg", { label: "background" }).on("change", () => this.onColorChange());
    settings.addBinding(this.colorState, "lo", { label: "low" }).on("change", () => this.onColorChange());
    settings.addBinding(this.colorState, "hi", { label: "high" }).on("change", () => this.onColorChange());

    const vid = pane.addFolder({ title: "Export Video", expanded: false });
    vid.addBinding(this.rec, "width", { min: 256, max: 3840, step: 2, label: "width" });
    vid.addBinding(this.rec, "height", { min: 256, max: 3840, step: 2, label: "height" });
    vid.addBinding(this.rec, "fps", { min: 12, max: 60, step: 1, label: "fps" });
    vid.addBinding(this.rec, "seconds", { min: 3, max: 30, step: 1, label: "seconds" });
    const rb = vid.addButton({ title: "● render video" });
    rb.on("click", () => this.renderVideo(rb));

    this.pane = pane;
  }

  private onParamChange(): void {
    this.scheduleRemount();
    this.persist();
  }

  private onMetaChange(): void {
    if (!this.player) return;
    this.player.config.meta = { ...this.metaState };
    this.player.setMeta(this.metaState.complexity, this.metaState.chaos); // instant (chaos + live knobs)
    this.scheduleRemount(); // restart so count-based pieces pick up complexity
    this.persist();
  }

  private onColorChange(): void {
    if (!this.player) return;
    this.player.config.colors = { ...this.colorState };
    this.scheduleRemount();
    this.persist();
  }

  /** Debounced remount so dragging a slider doesn't thrash the sim. */
  private scheduleRemount(): void {
    window.clearTimeout(this.remountTimer);
    this.remountTimer = window.setTimeout(() => this.player?.restart(), 150) as unknown as number;
  }

  private applyPreset(idx: number): void {
    const preset = this.presets[idx];
    if (!preset || !this.player || !this.desc) return;
    const config = this.player.config;
    Object.assign(config.params, defaultsOf(this.desc.schema), preset.params ?? {});
    if (preset.meta) {
      config.meta = { ...preset.meta };
      this.metaState = { ...preset.meta };
    }
    if (preset.colors) {
      config.colors = { ...preset.colors };
      this.colorState = { ...preset.colors };
    }
    config.seed = randomSeedString();
    window.clearTimeout(this.remountTimer);
    this.player.reseed(config.seed); // remount with everything applied
    this.pane?.refresh();
    this.persist();
  }

  private randomise(): void {
    if (!this.player || !this.desc) return;
    const config = this.player.config;
    const seed = randomSeedString();
    const patch = randomPatch(this.desc.schema, makeRng(seed));
    Object.assign(config.params, patch.params);
    config.meta = { ...patch.meta };
    config.colors = { ...patch.colors };
    config.seed = seed;
    this.metaState = { ...patch.meta };
    this.colorState = { ...patch.colors };
    window.clearTimeout(this.remountTimer);
    this.player.reseed(seed); // applies params + meta + colors + fresh seed
    this.pane?.refresh();
    this.presetSelect.value = "";
    this.persist();
  }

  private async renderVideo(btn: TpButton): Promise<void> {
    if (!this.player) return;
    btn.disabled = true;
    const orig = btn.title;
    try {
      const blob = await recordVideo(
        this.player.canvas,
        this.rec.width,
        this.rec.height,
        this.rec.fps,
        this.rec.seconds,
        (p) => (btn.title = `● ${Math.round(p * 100)}%`),
      );
      download(blob, `generatives-${this.player.config.pieceId}-${this.rec.width}x${this.rec.height}.webm`);
      this.flash("Video exported");
    } catch {
      this.flash("Export failed");
    }
    btn.title = orig;
    btn.disabled = false;
  }

  private updateAbout(d: Descriptor): void {
    this.aboutTitle.textContent = d.title;
    this.aboutBody.innerHTML =
      `<p>${d.title} is a ${d.tags.join(" · ")} system, animated live and built to be embedded. ` +
      `Open Presets for tuned starting points, hit Randomise to switch it up, or shape it by hand in Settings — ` +
      `its own parameters plus complexity, chaos and the background / low / high colours. ` +
      `Render a clip at any size from Export Video.</p>`;
  }

  private persist(): void {
    if (this.player) writeHashConfig(this.player.config);
  }

  private flash(msg: string): void {
    this.toast.textContent = msg;
    this.toast.classList.add("on");
    setTimeout(() => this.toast.classList.remove("on"), 1800);
  }
}
