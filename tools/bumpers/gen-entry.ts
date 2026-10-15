// The Generatives pieces, bundled for the bumper pages (build: node build-gen.mjs).
// Same setup as generatives/src/runtime/renderVideo.ts: fixed timestep, so a
// piece run from frame 0 draws the same frames every time.
import { createPiece, descriptors } from "../../generatives/src/runtime/Registry";
import { makeRng } from "../../generatives/src/core/rng";
import { makeNoise } from "../../generatives/src/core/noise";
import { getPalette, makePaletteFromColors } from "../../generatives/src/core/color/theme";
import { createSurface, sizeSurface } from "../../generatives/src/core/surface";
import { defaultsOf } from "../../generatives/src/core/piece";

export const list = descriptors.map((d) => ({ id: d.id, title: d.title, backend: d.backend }));

export function mount(id: string, w: number, h: number, o: { seed?: string; theme?: string; colors?: { bg: string; lo: string; hi: string }; complexity?: number; chaos?: number } = {}) {
  const desc = descriptors.find((d) => d.id === id);
  const piece = createPiece(id);
  if (!desc || !piece) throw new Error("no piece " + id);
  const canvas = document.createElement("canvas");
  const surface = createSurface(canvas, desc.backend);
  sizeSurface(surface, w, h, 1);
  const rng = makeRng(o.seed ?? "futures-atlas");
  piece.init({
    surface, width: surface.width, height: surface.height, rng, noise: makeNoise(rng),
    palette: o.colors ? makePaletteFromColors(o.colors) : getPalette(o.theme ?? "quantum-ink"),
    params: defaultsOf(piece.schema), meta: { complexity: o.complexity ?? 0.5, chaos: o.chaos ?? 0.3 },
  });
  piece.applyMeta(o.complexity ?? 0.5, o.chaos ?? 0.3);
  let clock = 0;
  return {
    canvas,
    loop: piece.loopSeconds,
    /** advance one fixed step and draw */
    step(dt: number) {
      clock += dt;
      const T = piece.loopSeconds;
      piece.update(dt, T ? clock % T : clock);
      piece.render();
    },
    dispose() { piece.dispose(); },
  };
}
