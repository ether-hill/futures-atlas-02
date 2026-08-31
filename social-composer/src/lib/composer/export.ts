/**
 * Client-only exporters for the Social Studio: still PNG, animated GIF, reel
 * video (MP4 where supported, else WebM), and a ZIP of mixed slide assets
 * (PNG and/or per-slide video). All take a `renderFrame(ctx, t)` closure so
 * they reuse the same canvas engine that drives the live preview.
 */

import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { zipSync } from "fflate";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

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
  onProgress?: (p: number) => void;
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
    opts.onProgress?.((i + 1) / total);
    // Yield so React can repaint the % (the encode loop otherwise blocks the UI).
    if (i % 2 === 0) await new Promise<void>((r) => setTimeout(r, 0));
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

type VideoOpts = {
  renderFrame: RenderFrame; w: number; h: number; fps: number; durationSec: number;
  prepareFrame?: (t: number) => Promise<void>;
  onProgress?: (p: number) => void;
};

/** Offline export: render every frame at its exact clock position and encode a
 *  constant-frame-rate H.264 MP4 with WebCodecs + mp4-muxer. Deterministic —
 *  immune to main-thread hitches, tab focus, and display refresh rate. */
async function renderVideoWebCodecs(opts: VideoOpts): Promise<{ blob: Blob; ext: string } | null> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  // H.264 wants even dimensions
  const w = opts.w & ~1, h = opts.h & ~1;
  const bitrate = 10_000_000;
  // High 4.0 → Main 4.0 → Baseline 4.0; 4.0 covers 1080×1920@30
  let codec: string | null = null;
  for (const c of ["avc1.640028", "avc1.4D0028", "avc1.420028"]) {
    try {
      const s = await VideoEncoder.isConfigSupported({ codec: c, width: w, height: h, bitrate, framerate: opts.fps });
      if (s.supported) { codec = c; break; }
    } catch { /* try the next profile */ }
  }
  if (!codec) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: w, height: h },
    fastStart: "in-memory",
  });
  let encodeError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e; },
  });
  encoder.configure({ codec, width: w, height: h, bitrate, framerate: opts.fps });

  const total = Math.max(2, Math.round(opts.fps * opts.durationSec));
  const usPerFrame = 1_000_000 / opts.fps;
  try {
    for (let i = 0; i < total; i++) {
      const t = i / (total - 1);
      if (opts.prepareFrame) await opts.prepareFrame(t);
      opts.renderFrame(ctx, t);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(i * usPerFrame),
        duration: Math.round(usPerFrame),
      });
      encoder.encode(frame, { keyFrame: i % (opts.fps * 2) === 0 });
      frame.close();
      if (encodeError) throw encodeError;
      // backpressure + let React repaint the progress %
      while (encoder.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 0));
      opts.onProgress?.((i + 1) / total);
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    await encoder.flush();
    if (encodeError) throw encodeError;
    muxer.finalize();
  } catch (e) {
    try { encoder.close(); } catch { /* already closed */ }
    console.warn("WebCodecs export failed, falling back to MediaRecorder", e);
    return null;
  }
  return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4" };
}

/** Fallback: canvas captureStream + MediaRecorder. Paced frame-by-frame — each
 *  frame is painted deterministically, then pushed with track.requestFrame()
 *  where supported, so a slow paint no longer drops frames silently (though
 *  the result is still variable-frame-rate; WebCodecs is the quality path). */
async function renderVideoMediaRecorder(opts: VideoOpts): Promise<{ blob: Blob; ext: string } | null> {
  const picked = pickVideoMime();
  const canvas = document.createElement("canvas");
  canvas.width = opts.w; canvas.height = opts.h;
  const ctx = canvas.getContext("2d");
  if (!ctx || !picked || !canvas.captureStream) return null;
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }
  // captureStream(0) = manual capture via requestFrame(); fall back to auto
  const track0 = canvas.captureStream(0).getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const manual = typeof track0.requestFrame === "function";
  const stream = manual ? new MediaStream([track0]) : canvas.captureStream(opts.fps);
  const rec = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });
  if (opts.prepareFrame) await opts.prepareFrame(0);
  opts.renderFrame(ctx, 0);
  rec.start();
  const total = Math.max(2, Math.round(opts.fps * opts.durationSec));
  const msPerFrame = 1000 / opts.fps;
  const startT = performance.now();
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    if (opts.prepareFrame) await opts.prepareFrame(t);
    opts.renderFrame(ctx, t);
    if (manual) track0.requestFrame!();
    opts.onProgress?.((i + 1) / total);
    const target = startT + (i + 1) * msPerFrame;
    const wait = target - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  await new Promise((r) => setTimeout(r, 120));
  rec.stop();
  await done;
  return { blob: new Blob(chunks, { type: picked.mime }), ext: picked.ext };
}

/** Render an animation to a video Blob — offline CFR MP4 via WebCodecs where
 *  the browser supports it, else a paced MediaRecorder capture. */
export async function renderVideoBlob(opts: VideoOpts): Promise<{ blob: Blob; ext: string } | null> {
  return (await renderVideoWebCodecs(opts)) ?? renderVideoMediaRecorder(opts);
}

/** Record + download a single combined reel video. */
export async function exportVideo(opts: {
  renderFrame: RenderFrame; w: number; h: number; fps: number; durationSec: number; name: string;
  prepareFrame?: (t: number) => Promise<void>;
  onProgress?: (p: number) => void;
}): Promise<{ ok: boolean; ext?: string }> {
  const res = await renderVideoBlob(opts);
  if (!res) return { ok: false };
  downloadBlob(res.blob, `${opts.name}.${res.ext}`);
  return { ok: true, ext: res.ext };
}
