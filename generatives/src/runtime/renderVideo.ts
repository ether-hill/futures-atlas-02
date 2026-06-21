// Programmatic MP4 export. Unlike a screen capture, this renders the piece OFF
// the live display: a fresh offscreen surface at the export resolution is stepped
// frame-by-frame on a FIXED timestep (1/fps), each frame is encoded with WebCodecs
// (H.264 / avc1) and muxed into an MP4. The result is a clean, deterministic,
// exact render independent of display size or runtime frame-rate — no captureStream.

import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { Config } from "../core/piece";
import { makeRng } from "../core/rng";
import { makeNoise } from "../core/noise";
import { getPalette, makePaletteFromColors } from "../core/color/theme";
import { createSurface, sizeSurface } from "../core/surface";
import { createPiece, getDescriptor } from "./Registry";

export interface RenderOpts {
  width: number;
  height: number;
  fps: number;
  seconds: number;
  onProgress?: (p: number) => void;
}

export function isVideoExportSupported(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
}

// High → baseline; isConfigSupported picks the first the browser's encoder accepts.
const CODECS = ["avc1.640034", "avc1.640033", "avc1.64002A", "avc1.4D4028", "avc1.42E01E"];

async function pickCodec(width: number, height: number, fps: number, bitrate: number): Promise<string | null> {
  for (const codec of CODECS) {
    try {
      const res = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, framerate: fps });
      if (res.supported) return codec;
    } catch {
      /* try the next codec string */
    }
  }
  return null;
}

export async function renderVideoMp4(config: Config, opts: RenderOpts): Promise<Blob> {
  if (!isVideoExportSupported()) throw new Error("This browser has no WebCodecs video encoder.");
  const desc = getDescriptor(config.pieceId);
  if (!desc) throw new Error("Unknown piece.");

  // H.264 requires even dimensions.
  const width = opts.width - (opts.width % 2);
  const height = opts.height - (opts.height % 2);
  const fps = Math.round(opts.fps);

  // Offscreen render pipeline at the export resolution — its own surface, seed,
  // noise and palette, mirroring the Player but driven synchronously.
  const canvas = document.createElement("canvas");
  const surface = createSurface(canvas, desc.backend);
  sizeSurface(surface, width, height, 1);
  const rng = makeRng(config.seed);
  const noise = makeNoise(rng);
  const palette = config.colors ? makePaletteFromColors(config.colors) : getPalette(config.theme);
  const piece = createPiece(config.pieceId);
  if (!piece) throw new Error("Could not create piece.");
  await piece.init({
    surface,
    width: surface.width,
    height: surface.height,
    rng,
    noise,
    palette,
    params: config.params,
    meta: config.meta,
  });
  piece.applyMeta(config.meta.complexity, config.meta.chaos);

  const bitrate = Math.round(Math.min(40e6, Math.max(6e6, width * height * fps * 0.12)));
  const codec = await pickCodec(width, height, fps, bitrate);
  if (!codec) {
    piece.dispose();
    throw new Error("No supported H.264 encoder configuration.");
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height, frameRate: fps },
    fastStart: "in-memory",
  });
  let encError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encError = e),
  });
  encoder.configure({ codec, width, height, bitrate, framerate: fps });

  const total = Math.max(1, Math.round(fps * opts.seconds));
  const dt = 1 / fps;
  const usPerFrame = 1e6 / fps;
  const T = piece.loopSeconds;

  try {
    for (let i = 0; i < total; i++) {
      if (encError) throw encError;
      const t = T ? (i * dt) % T : i * dt;
      piece.update(dt, t); // fixed timestep — deterministic, not wall-clock
      piece.render();
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(i * usPerFrame),
        duration: Math.round(usPerFrame),
      });
      encoder.encode(frame, { keyFrame: i % fps === 0 });
      frame.close();
      opts.onProgress?.((i + 1) / total);
      // keep the encode queue bounded and let the UI repaint the progress
      if (encoder.encodeQueueSize > 4 || i % 6 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
  } finally {
    encoder.close();
    piece.dispose();
  }
  if (encError) throw encError;

  muxer.finalize();
  const { buffer } = muxer.target;
  return new Blob([buffer], { type: "video/mp4" });
}
