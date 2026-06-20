/**
 * Client-only exporters for the Social Studio: still PNG, animated GIF, reel
 * video (MP4 where supported, else WebM), and a ZIP of mixed slide assets
 * (PNG and/or per-slide video). All take a `renderFrame(ctx, t)` closure so
 * they reuse the same canvas engine that drives the live preview.
 */

import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { zipSync } from "fflate";

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Zip a set of named byte buffers (store, no compression) and download. */
export function zipDownload(entries: Record<string, Uint8Array>, zipName: string) {
  const zipped = zipSync(entries, { level: 0 });
  const buf = new Uint8Array(zipped.length);
  buf.set(zipped);
  downloadBlob(new Blob([buf], { type: "application/zip" }), zipName);
}

type RenderFrame = (ctx: CanvasRenderingContext2D, t: number) => void;

/** Animated GIF — rendered at a reduced size for a sane file size.
 *  `prepareFrame(t)` (optional) is awaited before each frame is drawn, so video
 *  slides can be seeked frame-accurately to their clock position first. */
export async function exportGIF(opts: {
  renderFrame: RenderFrame; w: number; h: number; fps: number; durationSec: number; name: string;
  prepareFrame?: (t: number) => Promise<void>;
}) {
  const maxW = 540;
  const scale = Math.min(1, maxW / opts.w);
  const gw = Math.round(opts.w * scale), gh = Math.round(opts.h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = gw; canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }
  const fps = Math.min(15, opts.fps);
  const total = Math.max(1, Math.round(fps * Math.min(opts.durationSec, 8)));
  const delay = Math.round(1000 / fps);
  const enc = GIFEncoder();
  ctx.scale(scale, scale);
  for (let i = 0; i < total; i++) {
    const t = total === 1 ? 0 : i / (total - 1);
    if (opts.prepareFrame) await opts.prepareFrame(t);
    opts.renderFrame(ctx, t);
    const { data } = ctx.getImageData(0, 0, gw, gh);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    enc.writeFrame(index, gw, gh, { palette, delay });
  }
  enc.finish();
  const bytes = enc.bytes();
  const buf = new Uint8Array(bytes.length);
  buf.set(bytes);
  downloadBlob(new Blob([buf], { type: "image/gif" }), opts.name);
}

export function pickVideoMime(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) if (MediaRecorder.isTypeSupported(c.mime)) return c;
  return null;
}

/** Record an animation to a video Blob via canvas captureStream.
 *  `prepareFrame(0)` (optional) is awaited before recording starts so video
 *  slides are seeked to their first frame; real-time playback then advances. */
export async function renderVideoBlob(opts: {
  renderFrame: RenderFrame; w: number; h: number; fps: number; durationSec: number;
  prepareFrame?: (t: number) => Promise<void>;
}): Promise<{ blob: Blob; ext: string } | null> {
  const picked = pickVideoMime();
  const canvas = document.createElement("canvas");
  canvas.width = opts.w; canvas.height = opts.h;
  const ctx = canvas.getContext("2d");
  if (!ctx || !picked || !canvas.captureStream) return null;
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }
  const stream = canvas.captureStream(opts.fps);
  const rec = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });
  if (opts.prepareFrame) await opts.prepareFrame(0);
  rec.start();
  const startT = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - startT) / (opts.durationSec * 1000));
      opts.renderFrame(ctx, t);
      if (t >= 1) { resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await new Promise((r) => setTimeout(r, 120));
  rec.stop();
  await done;
  return { blob: new Blob(chunks, { type: picked.mime }), ext: picked.ext };
}

/** Record + download a single combined reel video. */
export async function exportVideo(opts: {
  renderFrame: RenderFrame; w: number; h: number; fps: number; durationSec: number; name: string;
  prepareFrame?: (t: number) => Promise<void>;
}): Promise<{ ok: boolean; ext?: string }> {
  const res = await renderVideoBlob(opts);
  if (!res) return { ok: false };
  downloadBlob(res.blob, `${opts.name}.${res.ext}`);
  return { ok: true, ext: res.ext };
}
