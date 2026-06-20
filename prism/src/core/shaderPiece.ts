// Factory for single-pass fullscreen-shader pieces — the banner sweet spot: one
// GPU draw call per frame, ~zero CPU. Handles the common uniforms (resolution,
// loop phase, complexity, chaos, seed, palette); each def supplies its fragment
// shader and any extra uniforms.

import type { Piece, PieceContext, PieceFactory, Params, ParamSchema } from "./piece";
import { Quad, makePaletteTexture } from "./gl";

const TAU = Math.PI * 2;

export interface ShaderDef {
  id: string;
  title: string;
  tags: string[];
  loopSeconds: number;
  schema: ParamSchema;
  frag: string;
  /** set the piece's own uniforms each frame */
  uniforms?: (q: Quad, params: Params, complexity: number, chaos: number) => void;
}

export function makeShaderPiece(def: ShaderDef): PieceFactory {
  return () => {
    let gl: WebGL2RenderingContext;
    let quad: Quad;
    let pal: WebGLTexture;
    let w = 1;
    let h = 1;
    let t = 0;
    let seedX = 0;
    let seedY = 0;
    let complexity = 0.5;
    let chaos = 0.5;
    let params: Params = {};

    const piece: Piece = {
      id: def.id,
      title: def.title,
      tags: def.tags,
      backend: "webgl2",
      loopSeconds: def.loopSeconds,
      schema: def.schema,

      init(ctx: PieceContext) {
        const s = ctx.surface;
        if (s.kind !== "webgl2") throw new Error(`${def.id}: expected webgl2 surface`);
        gl = s.gl;
        w = ctx.width;
        h = ctx.height;
        params = ctx.params;
        seedX = ctx.rng.range(-50, 50);
        seedY = ctx.rng.range(-50, 50);
        quad = new Quad(gl, def.frag);
        pal = makePaletteTexture(gl, ctx.palette);
      },
      update(_dt, time) {
        t = time;
      },
      render() {
        gl.viewport(0, 0, w, h);
        const phase = (t / def.loopSeconds) * TAU;
        const q = quad.use();
        q.v2("uRes", w, h).f("uTime", t).f("uPhase", phase).f("uComplexity", complexity).f("uChaos", chaos).v2("uSeed", seedX, seedY);
        q.tex("uPalette", pal);
        def.uniforms?.(q, params, complexity, chaos);
        q.draw();
      },
      resize(width, height) {
        w = width;
        h = height;
      },
      reseed() {
        /* remount supplies a fresh rng */
      },
      applyMeta(c, ch) {
        complexity = c;
        chaos = ch;
      },
      dispose() {
        quad?.dispose();
        if (pal) gl.deleteTexture(pal);
      },
    };
    return piece;
  };
}
