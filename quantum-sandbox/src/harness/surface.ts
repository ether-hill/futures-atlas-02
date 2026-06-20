// The harness owns the canvas surface; a system owns only the content it draws.
// Canvas2D and WebGL2 backends here (p5 reuses canvas2d; three/webgpu arrive in
// later milestones). A canvas can't switch context type once acquired, so the
// dashboard creates a fresh canvas per system.

import type { Backend, RenderSurface } from "./GenerativeSystem";

export function createSurface(canvas: HTMLCanvasElement, backend: Backend): RenderSurface {
  if (backend === "three") {
    // hand the bare canvas to the system; it acquires its own WebGL renderer
    return { kind: "three", canvas, width: 1, height: 1, dpr: 1 };
  }
  if (backend === "canvas2d") {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("surface: 2d context unavailable");
    return { kind: "canvas2d", canvas, ctx, width: 1, height: 1, dpr: 1 };
  }
  const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("surface: WebGL2 unavailable");
  return { kind: "webgl2", canvas, gl, width: 1, height: 1, dpr: 1 };
}

export function resizeSurface(s: RenderSurface, width: number, height: number, dpr: number): RenderSurface {
  s.width = width;
  s.height = height;
  s.dpr = dpr;
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  s.canvas.width = w;
  s.canvas.height = h;
  s.canvas.style.width = `${width}px`;
  s.canvas.style.height = `${height}px`;
  if (s.kind === "canvas2d") {
    // draw in device pixels; systems use deviceSize() and putImageData directly
    s.ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else if (s.kind === "webgl2") {
    s.gl.viewport(0, 0, w, h);
  }
  // three: the system's renderer handles its own viewport on resize
  return s;
}

export function disposeSurface(s: RenderSurface): void {
  if (s.kind === "webgl2") {
    const ext = s.gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  }
}
