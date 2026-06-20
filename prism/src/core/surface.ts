// The render surface. Canvas2D for M0; webgl2/three slot in later. Pieces draw
// in DEVICE pixels (width/height already include dpr); no ctx transform.

export interface Canvas2DSurface {
  kind: "canvas2d";
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export type RenderSurface = Canvas2DSurface;

export function createSurface(canvas: HTMLCanvasElement): RenderSurface {
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
  s.ctx.setTransform(1, 0, 0, 1, 0, 0);
}
