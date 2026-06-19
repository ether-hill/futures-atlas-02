// Owns requestAnimationFrame and transport (play/pause/step/reset). The harness
// owns State and the RNG; reset re-inits from the seed, so systems stay pure
// (seed, params) → output. Per frame it also pulls diagnostics() for the HUD.

import type { GenerativeSystem, Params, RenderSurface } from "./GenerativeSystem";
import type { RNG } from "../core/math/rng";

export interface FrameInfo {
  frame: number;
  fps: number;
  playing: boolean;
  diagnostics: Record<string, number>;
}

export interface Loop {
  play(): void;
  pause(): void;
  toggle(): void;
  stepOnce(): void;
  reset(): void;
  load(system: GenerativeSystem, params: Params, seed: string): void;
  setParams(params: Params): void;
  setSeed(seed: string): void;
  isPlaying(): boolean;
  frameCount(): number;
  destroy(): void;
}

export function createLoop(
  surface: RenderSurface,
  makeRng: (seed: string) => RNG,
  onFrame?: (info: FrameInfo) => void,
): Loop {
  let system: GenerativeSystem | null = null;
  let params: Params = {};
  let seed = "seed";
  let state: unknown = null;
  let playing = false;
  let raf = 0;
  let last = 0;
  let frame = 0;
  let fpsT = performance.now();
  let fpsN = 0;
  let fps = 0;

  const diag = (): Record<string, number> =>
    system?.diagnostics ? system.diagnostics(state) : {};

  const emit = (): void => onFrame?.({ frame, fps, playing, diagnostics: diag() });

  function reinit(): void {
    if (!system) return;
    state = system.init(surface, params, makeRng(seed));
    frame = 0;
    system.render(state, surface);
    emit();
  }

  function tick(now: number): void {
    if (!playing || !system) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!(system.isDone?.(state) ?? false)) {
      state = system.step(state, dt);
      frame++;
    }
    system.render(state, surface);
    fpsN++;
    if (now - fpsT > 500) {
      fps = Math.round((fpsN * 1000) / (now - fpsT));
      fpsN = 0;
      fpsT = now;
    }
    emit();
    raf = requestAnimationFrame(tick);
  }

  function play(): void {
    if (playing || !system) return;
    playing = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function pause(): void {
    playing = false;
    cancelAnimationFrame(raf);
    emit();
  }

  return {
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    stepOnce: () => {
      if (!system) return;
      if (!(system.isDone?.(state) ?? false)) {
        state = system.step(state, 1 / 60);
        frame++;
      }
      system.render(state, surface);
      emit();
    },
    reset: () => reinit(),
    load: (s, p, sd) => {
      pause();
      system = s;
      params = p;
      seed = sd;
      reinit();
      play();
    },
    setParams: (p) => {
      params = p;
    },
    setSeed: (sd) => {
      seed = sd;
    },
    isPlaying: () => playing,
    frameCount: () => frame,
    destroy: () => {
      pause();
      system = null;
      state = null;
    },
  };
}
