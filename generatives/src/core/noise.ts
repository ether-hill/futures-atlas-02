// Noise engine behind most organic pieces: seeded simplex (2D/3D), fbm,
// curl noise (divergence-free flow), and domain warping. Seeded via the RNG so
// fields are reproducible.

import { createNoise2D, createNoise3D } from "simplex-noise";
import type { RNG } from "./rng";

export interface NoiseKit {
  n2(x: number, y: number): number; // [-1,1]
  n3(x: number, y: number, z: number): number; // [-1,1]
  fbm2(x: number, y: number, octaves: number, lacunarity?: number, gain?: number): number;
  /** divergence-free curl of a simplex potential → unit-ish flow vector */
  curl(x: number, y: number, eps?: number): [number, number];
  /** domain-warped fbm value at (x,y) */
  warp(x: number, y: number, amp: number, freq: number): number;
}

export function makeNoise(rng: RNG): NoiseKit {
  const n2 = createNoise2D(() => rng.next());
  const n3 = createNoise3D(() => rng.next());

  const fbm2 = (x: number, y: number, octaves: number, lacunarity = 2, gain = 0.5): number => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * n2(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return norm > 0 ? sum / norm : 0;
  };

  return {
    n2,
    n3,
    fbm2,
    curl(x, y, eps = 1e-3) {
      // ψ = potential; curl = (∂ψ/∂y, −∂ψ/∂x)
      const a = n2(x, y + eps);
      const b = n2(x, y - eps);
      const c = n2(x + eps, y);
      const d = n2(x - eps, y);
      const dx = (a - b) / (2 * eps);
      const dy = (c - d) / (2 * eps);
      return [dx, -dy];
    },
    warp(x, y, amp, freq) {
      const qx = fbm2(x, y, 4);
      const qy = fbm2(x + 5.2, y + 1.3, 4);
      return fbm2(x * freq + amp * qx, y * freq + amp * qy, 5);
    },
  };
}
