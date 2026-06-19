// Global transport bar: play/pause, step, reset, reseed, export PNG, export WebM.
// Pure UI — it calls back into the dashboard, which owns the loop.

export interface TransportCallbacks {
  toggle(): void;
  step(): void;
  reset(): void;
  reseed(): void;
  exportPng(scale: number): void;
  toggleRecord(): boolean | Promise<boolean>; // returns true if now recording
}

export class Transport {
  private playBtn: HTMLButtonElement;
  private recBtn: HTMLButtonElement;

  constructor(host: HTMLElement, cb: TransportCallbacks) {
    const bar = document.createElement("div");
    bar.className = "transport";
    bar.innerHTML = `
      <button data-act="play" title="play / pause (space)">▶ play</button>
      <button data-act="step" title="step one frame">step</button>
      <button data-act="reset" title="reset (r)">reset</button>
      <button data-act="reseed" title="new seed">reseed</button>
      <span class="sep"></span>
      <button data-act="png">PNG</button>
      <button data-act="png2">2×</button>
      <button data-act="png4">4×</button>
      <button data-act="rec" class="rec">● WebM</button>
    `;
    host.appendChild(bar);

    this.playBtn = bar.querySelector('[data-act="play"]')!;
    this.recBtn = bar.querySelector('[data-act="rec"]')!;

    bar.querySelector('[data-act="play"]')!.addEventListener("click", () => cb.toggle());
    bar.querySelector('[data-act="step"]')!.addEventListener("click", () => cb.step());
    bar.querySelector('[data-act="reset"]')!.addEventListener("click", () => cb.reset());
    bar.querySelector('[data-act="reseed"]')!.addEventListener("click", () => cb.reseed());
    bar.querySelector('[data-act="png"]')!.addEventListener("click", () => cb.exportPng(1));
    bar.querySelector('[data-act="png2"]')!.addEventListener("click", () => cb.exportPng(2));
    bar.querySelector('[data-act="png4"]')!.addEventListener("click", () => cb.exportPng(4));
    this.recBtn.addEventListener("click", async () => {
      const recording = await cb.toggleRecord();
      this.recBtn.classList.toggle("on", recording);
      this.recBtn.textContent = recording ? "■ stop" : "● WebM";
    });
  }

  setPlaying(playing: boolean): void {
    this.playBtn.textContent = playing ? "❚❚ pause" : "▶ play";
  }
}
