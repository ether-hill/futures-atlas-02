// Render surfaces. Pieces draw in DEVICE pixels (width/height include the chosen
// scale). Canvas2D, WebGL2 (fullscreen-shader + ping-pong sims), and a bare
// canvas for three.js. A canvas can't change context type, so the Player makes
// one surface of the right kind per piece.

import type { Backend } from "./piece";

export interface Canvas2DSurface {
  kind: "canvas2d";
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export interface WebGL2Surface {
  kind: "webgl2";
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  width: number;
  height: number;
  dpr: number;
}

export interface ThreeSurface {
  kind: "three";
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
}

export type RenderSurface = Canvas2DSurface | WebGL2Surface | ThreeSurface;

export function createSurface(canvas: HTMLCanvasElement, backend: Backend): RenderSurface {
  if (backend === "webgl2") {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("surface: WebGL2 unavailable");
    return { kind: "webgl2", canvas, gl, width: 1, height: 1, dpr: 1 };
  }
  if (backend === "three") {
    return { kind: "three", canvas, width: 1, height: 1, dpr: 1 };
  }
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("surface: 2d context unavailable");
  return { kind: "canvas2d", canvas, ctx, width: 1, height: 1, dpr: 1 };
}

export function sizeSurface(s: RenderSurface, cssW: number, cssH: number, dpr: number): void {
  s.width = Math.max(1, Math.round(cssW * dpr));
  s.height = Math.max(1, Math.round(cssH * dpr));
  s.dpr = dpr;
  s.canvas.width = s.width;
  s.canvas.height = s.height;
  // display sizing is left to CSS (fit-to-stage on the dashboard, fill in embed)
  if (s.kind === "canvas2d") {
    s.ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else if (s.kind === "webgl2") {
    s.gl.viewport(0, 0, s.width, s.height);
  }
}
