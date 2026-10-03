/**
 * Video export: render every frame offline (render.ts) and encode it to MP4 in
 * the browser with WebCodecs, muxed by mediabunny. Nothing leaves the machine
 * and nothing is captured from the screen: frame n is the sketch at time n/fps
 * (or, for a simulation, after n frames' worth of steps), rendered at the
 * chosen size and sample count however long that takes.
 *
 * H.264 first, because everything plays it; HEVC, AV1 and VP9 only if the
 * browser cannot encode H.264 at that size (H.264 tops out around 4096 wide).
 */
import { createFrameRenderer, type FrameRenderer } from "./render";
import type { Sketch, Values } from "./types";

export interface VideoSpec {
  w: number;
  h: number;
  fps: number;
  /** Seconds. */
  duration: number;
  samples: number;
  /** Fraction of the frame interval the shutter is open (0.5 is a 180° shutter). */
  shutter: number;
  /** Bits per second. */
  bitrate: number;
}

export interface VideoProgress {
  frame: number;
  total: number;
  /** The frame just rendered, to show while the export runs. */
  canvas: HTMLCanvasElement;
  /** Seconds per frame so far. */
  perFrame: number;
}

export async function exportVideo(
  sketch: Sketch,
  values: Values,
  spec: VideoSpec,
  opts: { signal?: AbortSignal; onProgress?: (p: VideoProgress) => void; onFrameProgress?: (f: number) => void } = {},
): Promise<{ blob: Blob; codec: string }> {
  const mb = await import("mediabunny");
  if (typeof VideoEncoder === "undefined") {
    throw new Error("This browser has no WebCodecs video encoder. Chrome, Edge and Safari 17+ have one.");
  }
  const w = spec.w & ~1, h = spec.h & ~1; // 4:2:0 wants even sizes
  const total = Math.max(1, Math.round(spec.duration * spec.fps));
  const codec = await mb.getFirstEncodableVideoCodec(["avc", "hevc", "av1", "vp9"], {
    width: w,
    height: h,
    bitrate: spec.bitrate,
  });
  if (!codec) throw new Error(`This browser cannot encode ${w}×${h} video at ${Math.round(spec.bitrate / 1e6)} Mb/s. Try a smaller size or a lower quality.`);

  let fr: FrameRenderer | null = null;
  const output = new mb.Output({
    format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new mb.BufferTarget(),
  });
  try {
    fr = createFrameRenderer(sketch, values, w, h);
    const source = new mb.CanvasSource(fr.canvas, {
      codec,
      bitrate: spec.bitrate,
      bitrateMode: "variable",
      latencyMode: "quality",
      keyFrameInterval: 2,
    });
    output.addVideoTrack(source, { frameRate: spec.fps });
    await output.start();
    fr.restart();

    const t0 = performance.now();
    for (let i = 0; i < total; i++) {
      await fr.render({
        time: i / spec.fps,
        samples: spec.samples,
        shutter: spec.shutter / spec.fps,
        advance: true,
        signal: opts.signal,
        onProgress: opts.onFrameProgress,
      });
      await source.add(i / spec.fps, 1 / spec.fps);
      opts.onProgress?.({ frame: i + 1, total, canvas: fr.canvas, perFrame: (performance.now() - t0) / 1000 / (i + 1) });
    }
    await output.finalize();
    const buf = (output.target as InstanceType<typeof mb.BufferTarget>).buffer;
    if (!buf) throw new Error("The encoder produced no file.");
    return { blob: new Blob([buf], { type: "video/mp4" }), codec };
  } catch (e) {
    if (output.state === "started") await output.cancel().catch(() => undefined);
    throw e;
  } finally {
    fr?.dispose();
  }
}

/** One still at the export size, through the same sampled pipeline. */
export async function renderStillFrame(
  sketch: Sketch,
  values: Values,
  w: number,
  h: number,
  time: number,
  samples: number,
  signal?: AbortSignal,
  onProgress?: (f: number) => void,
): Promise<Blob> {
  const fr = createFrameRenderer(sketch, values, w, h);
  try {
    await fr.render({ time, samples, shutter: 0, signal, onProgress });
    return await new Promise<Blob>((res, rej) => fr.canvas.toBlob((b) => (b ? res(b) : rej(new Error("no image"))), "image/png"));
  } finally {
    fr.dispose();
  }
}
