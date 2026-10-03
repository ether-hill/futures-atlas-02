/**
 * Build a slow frame up in batches of tiles, centre first, so a sketch that
 * needs seconds for a full frame on an integrated GPU fills in while the page
 * stays responsive, instead of freezing it.
 *
 * Pacing is by fence, never by readback. Each batch is followed by a fence,
 * checked once an animation frame without blocking, and a few batches are
 * kept in flight. (A one-pixel `readPixels` was the
 * first way of waiting, and in Chrome it costs 30–80 ms by itself, even with
 * nothing queued: it turned a 48 ms gyroid into a two-second one.) The batch
 * size grows while the GPU keeps up and halves when it falls behind, so a
 * cheap sketch finishes in a few frames and an expensive one stays smooth.
 */
import type { Renderer, Values, View } from "./types";

/** Batches allowed in flight. Chrome refreshes a fence's status lazily (an
 *  empty batch still reads as 30–80 ms), so waiting on each batch before
 *  sending the next spent most of the time waiting. Three hides that latency. */
const DEPTH = 3;
/** The oldest batch still out after this: the GPU is backed up, halve. */
const SHRINK_MS = 160;

export interface Job {
  /** true when finished, false when cancelled */
  done: Promise<boolean>;
  cancel(): void;
}

export function progressive(
  gl: WebGL2RenderingContext,
  r: Renderer,
  values: Values,
  w: number,
  h: number,
  opts: { tile?: number; onProgress?: (f: number) => void; view?: Partial<View> } = {},
): Job {
  let cancelled = false;
  if (!r.tiles) {
    r.draw(values, { ...opts.view, w, h });
    opts.onProgress?.(1);
    return { done: Promise.resolve(true), cancel() {} };
  }
  const T = opts.tile ?? 128;
  const tiles: [number, number][] = [];
  for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) tiles.push([x, y]);
  const cx = w / 2 - T / 2, cy = h / 2 - T / 2;
  tiles.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));

  // batches in flight, oldest first
  const flight: { fence: WebGLSync; at: number }[] = [];
  const clear = () => {
    for (const f of flight) gl.deleteSync(f.fence);
    flight.length = 0;
  };

  const done = new Promise<boolean>((resolve) => {
    let i = 0;
    let batch = 1;
    const tick = () => {
      if (cancelled) {
        clear();
        return resolve(false);
      }
      // retire what the GPU has finished
      let retired = 0;
      while (flight.length && gl.getSyncParameter(flight[0].fence, gl.SYNC_STATUS) === gl.SIGNALED) {
        gl.deleteSync(flight.shift()!.fence);
        retired++;
      }
      if (retired) opts.onProgress?.((i - flightTiles()) / tiles.length);
      if (i >= tiles.length && !flight.length) return resolve(true);

      // Everything retired: the GPU was waiting on us, send more per batch.
      // Oldest batch still out after SHRINK_MS: we are queueing work faster
      // than it can draw, which is what makes the page stutter; send less.
      if (retired && !flight.length) batch = Math.min(batch * 2, 256);
      else if (flight.length && performance.now() - flight[0].at > SHRINK_MS) batch = Math.max(1, batch >> 1);

      if (i < tiles.length && flight.length < DEPTH) {
        const n = Math.min(batch, tiles.length - i);
        for (let k = 0; k < n; k++) {
          const [x, y] = tiles[i++];
          r.draw(values, { ...opts.view, w, h, rect: [x, y, T, T] });
        }
        sizes.push(n);
        flight.push({ fence: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!, at: performance.now() });
        gl.flush();
      }
      requestAnimationFrame(tick);
    };
    // tiles per in-flight batch, to report progress as drawn rather than sent
    const sizes: number[] = [];
    const flightTiles = () => {
      while (sizes.length > flight.length) sizes.shift();
      return sizes.reduce((a, b) => a + b, 0);
    };
    requestAnimationFrame(tick);
  });
  return {
    done,
    cancel() {
      cancelled = true;
    },
  };
}
