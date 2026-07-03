// Seeded RNG — sfc32 with a string-seed hash, matching the Frond Studio harness
// convention (deterministic runs, no Math.random). A given seed always plays
// out the same sequence of events.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;
  constructor(seed: string) {
    const s = xmur3(seed);
    this.next = sfc32(s(), s(), s(), s());
    // warm up
    for (let i = 0; i < 12; i++) this.next();
  }
  /** float in [0, 1) */
  f(): number {
    return this.next();
  }
  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}
