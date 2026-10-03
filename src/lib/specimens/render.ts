/**
 * The offline frame: one image of a sketch at an exact time, at any size, as
 * clean as the samples allow. PNG export and every frame of a video come from
 * here, so a video is the computation rendered frame by frame, never a
 * recording of the screen.
 *
 * Each frame is the average of `samples` renders. Every sample is offset by a
 * fraction of a pixel (anti-aliasing: thin struts and sheet edges come out
 * whole instead of stair-stepped) and, with a shutter, by a fraction of the
 * frame's time (motion blur: what film does, and what makes 24 or 60 frames
 * read as continuous motion). The offsets follow a 3D low-discrepancy (R3)
 * sequence, so a few samples already cover pixel and shutter evenly.
 *
 * Samples are summed in a 16-bit float buffer and dithered once on the way
 * out, so long gradients do not band after averaging. The frame is drawn in
 * tiles with a few batches in flight (as progressive.ts does), so a 4K frame
 * of an expensive sketch never hands the GPU one draw long enough to trip the
 * driver's watchdog, and the page keeps breathing between batches.
 */
import { program } from "./gl";
import type { Renderer, Sketch, Values } from "./types";

const TILE = 128;
const DEPTH = 3;
/** A batch that comes back faster than this may grow; slower, it shrinks.
 *  Growth is by measured time, never by "the GPU was idle": a batch of a
 *  hundred 4K tiles is seconds of work in one submission, which is exactly
 *  what trips the watchdog and loses the context. */
const BATCH_FAST_MS = 35, BATCH_SLOW_MS = 110, BATCH_MAX = 24;

// R3: the plastic-number generalisation of the golden ratio, for 3D
const G3 = 1.2207440846057596;
const A3 = [1 / G3, 1 / (G3 * G3), 1 / (G3 * G3 * G3)];
export function r3(i: number): [number, number, number] {
  return [(0.5 + A3[0] * i) % 1, (0.5 + A3[1] * i) % 1, (0.5 + A3[2] * i) % 1];
}

const ADD = `#version 300 es
precision highp float;
uniform sampler2D u_src;
out vec4 outColor;
void main() { outColor = texelFetch(u_src, ivec2(gl_FragCoord.xy), 0); }`;

const RESOLVE = `#version 300 es
precision highp float;
uniform sampler2D u_acc;
uniform float u_seed;
out vec4 outColor;
vec3 h3(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}
void main() {
  vec4 a = texelFetch(u_acc, ivec2(gl_FragCoord.xy), 0);
  vec3 c = a.rgb / max(a.a, 1e-6);
  // triangular dither, one 8-bit step, fresh each frame
  vec2 fc = gl_FragCoord.xy + u_seed * 61.7;
  c += (h3(fc) + h3(fc.yx + 19.19) - 1.0) / 255.0;
  outColor = vec4(c, 1.0);
}`;

export class AbortError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "AbortError";
  }
}

/** Yield to the event loop. A visible tab waits on a timer, which costs the
 *  CPU next to nothing; a hidden one clamps timers to a second, so there a
 *  message round-trip keeps the export going in the background. */
function yieldNow(): Promise<void> {
  return new Promise((res) => {
    if (!document.hidden) {
      setTimeout(res, 1);
      return;
    }
    const ch = new MessageChannel();
    ch.port1.onmessage = () => res();
    ch.port2.postMessage(0);
  });
}

export interface FrameOptions {
  /** Seconds. */
  time: number;
  /** Renders averaged into the frame. */
  samples: number;
  /** Shutter open time in seconds (0: no motion blur), centred on `time`. */
  shutter: number;
  /** Simulations: whether this frame steps the run forward. */
  advance?: boolean;
  signal?: AbortSignal;
  /** 0-1 through this frame. */
  onProgress?: (f: number) => void;
}

export interface FrameRenderer {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  render(o: FrameOptions): Promise<void>;
  /** Simulations: start the run over from its seed. */
  restart(): void;
  dispose(): void;
}

export function maxFrameSize(): number {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2");
  if (!gl) return 0;
  const dims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  const n = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), dims[0], dims[1]);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return n;
}

export function createFrameRenderer(sketch: Sketch, values: Values, w: number, h: number): FrameRenderer {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error("WebGL2 unavailable");
  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("This browser cannot render to float buffers (EXT_color_buffer_float), which the export needs.");
  }
  let r: Renderer;
  try {
    r = sketch.create(gl);
  } catch (e) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw e;
  }
  const add = program(gl, ADD);
  const resolve = program(gl, RESOLVE);

  const target = () => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  };
  const sample = target();
  const acc = target();

  const tiles: [number, number, number, number][] = [];
  for (let y = 0; y < h; y += TILE) for (let x = 0; x < w; x += TILE) tiles.push([x, y, Math.min(TILE, w - x), Math.min(TILE, h - y)]);

  let frameNo = 0;

  /** Run draw calls in fence-paced batches, a few in flight. */
  const pump = async (calls: (() => void)[], signal: AbortSignal | undefined, onDone: (n: number) => void) => {
    const flight: { fence: WebGLSync; n: number; at: number }[] = [];
    let i = 0, batch = 2;
    try {
      while (i < calls.length || flight.length) {
        if (signal?.aborted) throw new AbortError();
        if (gl.isContextLost()) throw new Error("The GPU dropped the render (a frame too heavy for it). Try fewer samples or a smaller size.");
        while (flight.length && gl.getSyncParameter(flight[0].fence, gl.SYNC_STATUS) === gl.SIGNALED) {
          const f = flight.shift()!;
          gl.deleteSync(f.fence);
          onDone(f.n);
          // time from submission to done, per call, as a share of the batch
          const took = (performance.now() - f.at) / Math.max(1, flight.length + 1);
          if (took < BATCH_FAST_MS) batch = Math.min(batch + Math.max(1, batch >> 1), BATCH_MAX);
          else if (took > BATCH_SLOW_MS) batch = Math.max(1, batch >> 1);
        }
        if (flight.length && performance.now() - flight[0].at > 400) batch = 1;
        if (i < calls.length && flight.length < DEPTH) {
          const n = Math.min(batch, calls.length - i);
          for (let k = 0; k < n; k++) calls[i++]();
          flight.push({ fence: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!, n, at: performance.now() });
          gl.flush();
          if (flight.length < DEPTH) continue;
        }
        await yieldNow();
      }
    } finally {
      for (const f of flight) gl.deleteSync(f.fence);
    }
  };

  return {
    canvas,
    w,
    h,
    restart() {
      r.restart?.();
    },
    async render(o) {
      const n = Math.max(1, Math.round(o.samples));
      const calls: (() => void)[] = [];
      gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (let s = 0; s < n; s++) {
        const [jx, jy, jt] = n === 1 ? [0.5, 0.5, 0.5] : r3(s);
        const view = {
          w,
          h,
          time: o.time + (jt - 0.5) * o.shutter,
          formTime: o.time,
          jitter: [jx - 0.5, jy - 0.5] as [number, number],
          target: sample.fbo,
          dither: false,
          hold: !(o.advance && s === 0),
        };
        if (r.tiles) {
          for (const rect of tiles) calls.push(() => r.draw(values, { ...view, rect }));
        } else {
          calls.push(() => r.draw(values, view));
        }
        // fold this sample into the sum
        calls.push(() => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fbo);
          gl.viewport(0, 0, w, h);
          gl.disable(gl.SCISSOR_TEST);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.ONE, gl.ONE);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, sample.tex);
          gl.useProgram(add.prog);
          gl.uniform1i(add.loc("u_src"), 0);
          add.run();
          gl.disable(gl.BLEND);
        });
      }
      let done = 0;
      await pump(calls, o.signal, (k) => {
        done += k;
        o.onProgress?.(done / calls.length);
      });

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, acc.tex);
      gl.useProgram(resolve.prog);
      gl.uniform1i(resolve.loc("u_acc"), 0);
      gl.uniform1f(resolve.loc("u_seed"), frameNo++ % 97);
      resolve.run();
      gl.finish();
    },
    dispose() {
      r.dispose();
      add.dispose();
      resolve.dispose();
      for (const t of [sample, acc]) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
