// Export: hi-res PNG (a true re-render at N× resolution, never an upscaled
// bitmap) and WebM frame capture. Filenames encode {system}-{seed}-{paramsHash}
// so every output is traceable back to its config.

import type { GenerativeSystem, Params, RenderSurface } from "../../harness/GenerativeSystem";
import type { RNG } from "../math/rng";
import { createSurface, resizeSurface, disposeSurface } from "../../harness/surface";

export function download(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Short stable hash of the params object, for filenames. */
export function paramsHash(params: Params): string {
  const json = JSON.stringify(params, Object.keys(params).sort());
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"),
  );
}

/** PNG of exactly what's on screen now. */
export const exportCurrentPng = (surface: RenderSurface): Promise<Blob> => canvasToPng(surface.canvas);

/**
 * Hi-res PNG: rebuild the system on an offscreen surface at N× and re-simulate
 * the same number of frames (deterministic from the seed), so the export matches
 * the live look at higher resolution. Systems may override via `exportHiRes`.
 */
export async function exportHiResPng(
  system: GenerativeSystem,
  params: Params,
  seed: string,
  scale: number,
  baseW: number,
  baseH: number,
  frames: number,
  makeRng: (seed: string) => RNG,
): Promise<Blob> {
  if (system.exportHiRes) return system.exportHiRes(params, makeRng(seed), scale, baseW, baseH);

  const off = document.createElement("canvas");
  const surf = resizeSurface(createSurface(off, system.backend), Math.round(baseW * scale), Math.round(baseH * scale), 1);
  try {
    let state = system.init(surf, params, makeRng(seed));
    const n = Math.max(1, frames);
    for (let i = 0; i < n; i++) {
      if (system.isDone?.(state)) break;
      state = system.step(state, 1 / 60);
    }
    system.render(state, surf);
    return await canvasToPng(off);
  } finally {
    disposeSurface(surf);
  }
}

export interface Recorder {
  stop(): Promise<Blob>;
  readonly active: boolean;
}

/** Record the live canvas to a WebM blob via MediaRecorder. */
export function startRecording(canvas: HTMLCanvasElement, fps = 60): Recorder {
  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  rec.start();
  let active = true;
  return {
    get active() {
      return active;
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        active = false;
        rec.stop();
      }),
  };
}
