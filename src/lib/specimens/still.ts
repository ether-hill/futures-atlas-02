/**
 * Render a sketch once, off screen, and hand back an image. The index uses it
 * for its card plates, so a card always shows what the current code draws
 * rather than a screenshot of what it used to.
 *
 * One context at a time, released straight after: browsers cap live WebGL
 * contexts at around sixteen and drop the oldest without asking. Built up
 * progressively, like the lab, so a slow sketch never freezes the index.
 */
import { progressive } from "./progressive";
import type { Sketch, Values } from "./types";

let queue: Promise<unknown> = Promise.resolve();

export function renderStill(sketch: Sketch, values: Values, size: number): Promise<string> {
  const job = queue.then(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error("WebGL2 unavailable");
    try {
      const r = sketch.create(gl);
      if (sketch.animated) {
        const frames = sketch.stillFrames ?? 200;
        for (let i = 0; i < frames; i++) {
          r.draw(values, { w: size, h: size });
          // yield now and then so the page keeps painting
          if (i % 20 === 19) await new Promise((res) => requestAnimationFrame(res));
        }
      } else {
        await progressive(gl, r, values, size, size).done;
      }
      const url = canvas.toDataURL("image/jpeg", 0.88);
      r.dispose();
      return url;
    } finally {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  });
  queue = job.catch(() => undefined);
  return job;
}
