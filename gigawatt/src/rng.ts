/**
 * Deterministic seeded randomness. A run's seed feeds two independent streams:
 * one for the static world dressing (rocks, mesas, terrain), one for the live
 * schedule (events, market walk, contract offers) — so cosmetics never
 * reshuffle the economy.
 */

/** xmur3 string hash → 32-bit seed. */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 stream. */
export class RNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

/** Human-friendly random seed for new runs (called once, outside the sim). */
export function randomSeedWord(): string {
  const A = ["MOJAVE", "SONORA", "PAINTED", "BASALT", "OCOTILLO", "CALDERA", "YUCCA", "ALKALI", "MESA", "PLUTO"];
  const n = Math.floor(Math.random() * 900 + 100);
  return `${A[Math.floor(Math.random() * A.length)]}-${n}`;
}
