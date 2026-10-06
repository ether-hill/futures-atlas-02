/**
 * The wave fields behind every generated picture on Standing Waves.
 *
 * Plain functions of position, no DOM, so the same code draws a server-side
 * SVG (nodal lines, no JavaScript shipped) and a client canvas (the Mode ↔
 * Orbital pair). Coordinates are always the unit square [0,1]², or the unit
 * disc for the circular cases, centred at (0.5, 0.5).
 */

export type Field = (x: number, y: number) => number;

// ---------------------------------------------------------------- square plate

/**
 * The textbook Chladni approximation for a square plate:
 * cos(nπx)cos(mπy) − cos(mπx)cos(nπy). It is a superposition of two
 * degenerate modes of a free square, not an exact solution of the plate
 * equation (Kirchhoff's free-edge conditions have no closed form), which the
 * gallery says. With the minus sign, n = m gives zero everywhere; n and m
 * must differ.
 */
export function chladni(n: number, m: number): Field {
  return (x, y) =>
    Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
}

// ---------------------------------------------------------------- Bessel

/** J_m(x) by its integral form, J_m(x) = (1/π)∫₀^π cos(mτ − x sin τ) dτ. Accurate to ~1e-9 at 64 steps. */
export function besselJ(m: number, x: number): number {
  const N = 64;
  let s = 0;
  for (let i = 0; i <= N; i++) {
    const t = (Math.PI * i) / N;
    const w = i === 0 || i === N ? 0.5 : 1; // trapezoid; the integrand is periodic, so this converges fast
    s += w * Math.cos(m * t - x * Math.sin(t));
  }
  return s / N;
}

const zeroCache = new Map<string, number>();

/** The k-th positive zero of J_m (k ≥ 1), by bracketing then bisection. */
export function besselZero(m: number, k: number): number {
  const key = `${m}:${k}`;
  const hit = zeroCache.get(key);
  if (hit !== undefined) return hit;
  let found = 0;
  let a = m === 0 ? 0.1 : m * 0.9 + 0.1; // the first zero of J_m lies above m
  let fa = besselJ(m, a);
  for (let b = a + 0.05; b < 200; b += 0.05) {
    const fb = besselJ(m, b);
    if (fa * fb < 0) {
      let lo = a, hi = b, flo = fa;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        const fm = besselJ(m, mid);
        if (flo * fm <= 0) hi = mid;
        else { lo = mid; flo = fm; }
      }
      found++;
      if (found === k) {
        const z = (lo + hi) / 2;
        zeroCache.set(key, z);
        return z;
      }
    }
    a = b;
    fa = fb;
  }
  return NaN;
}

/**
 * A circular mode with `m` nodal diameters and `k` nodal circles inside the
 * rim: J_m(j_{m,k+1} r) cos(mθ). This is the clamped-edge (drum-head)
 * solution, the one with a closed form; a real plate held at its centre has a
 * free rim and its rings sit slightly differently. The gallery says so.
 */
export function circularMode(m: number, k: number): Field {
  const z = besselZero(m, k + 1);
  // The radial factor depends on r alone, so tabulate it once (1024 steps,
  // linear interpolation) instead of integrating a Bessel function per pixel:
  // that integral was most of the gallery's main-thread time.
  const N = 1024;
  const lut = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) lut[i] = besselJ(m, (z * i) / N);
  return (x, y) => {
    const dx = (x - 0.5) * 2, dy = (y - 0.5) * 2;
    const r = Math.hypot(dx, dy);
    if (r > 1) return NaN; // outside the plate
    const t = r * N, i = Math.min(N - 1, Math.floor(t)), f = t - i;
    return (lut[i]! * (1 - f) + lut[i + 1]! * f) * Math.cos(m * Math.atan2(dy, dx));
  };
}

// ---------------------------------------------------------------- hydrogen

/** Generalised Laguerre L_n^α(x), by the three-term recurrence. */
function laguerre(n: number, alpha: number, x: number): number {
  if (n === 0) return 1;
  let l0 = 1;
  let l1 = 1 + alpha - x;
  for (let k = 1; k < n; k++) {
    const l2 = ((2 * k + 1 + alpha - x) * l1 - (k + alpha) * l0) / (k + 1);
    l0 = l1;
    l1 = l2;
  }
  return l1;
}

/**
 * A slice of a hydrogen orbital through its equatorial plane, as the real
 * combination with |m| = l, so its angular part in that plane is cos(lφ):
 * l nodal lines through the nucleus, n − l − 1 nodal rings. Same counting as
 * circularMode(m = l, k = n − l − 1). Distances in Bohr radii; `extent` is the
 * half-width of the window, chosen by the caller so the outermost lobe fits.
 */
export function orbitalSlice(n: number, l: number, extent: number): Field {
  return (x, y) => {
    const dx = (x - 0.5) * 2 * extent, dy = (y - 0.5) * 2 * extent;
    const r = Math.hypot(dx, dy);
    const rho = (2 * r) / n;
    const radial = Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
    return radial * Math.cos(l * Math.atan2(dy, dx));
  };
}

/** A window wide enough that the outer lobe fades out inside it: the atom has no wall, and a lobe cut off by the frame would draw one. */
export function orbitalExtent(n: number): number {
  return 2.8 * n * n + 6;
}

// ---------------------------------------------------------------- Faraday

/**
 * ILLUSTRATIVE ONLY. A Faraday pattern's shape is set by how many standing
 * plane waves of one wavelength survive together: two at right angles give
 * squares, three at 120° give hexagons. Summing those waves draws the
 * geometry; it does not simulate the fluid (no amplitude equation, no
 * subharmonic response), and every caption that uses it says so.
 */
export function faradayIllustration(kind: "squares" | "hexagons" | "stripes", waves = 9): Field {
  const k = waves * Math.PI;
  const dirs =
    kind === "stripes" ? [0] : kind === "squares" ? [0, Math.PI / 2] : [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  return (x, y) => {
    let s = 0;
    for (const a of dirs) s += Math.cos(k * ((x - 0.5) * Math.cos(a) + (y - 0.5) * Math.sin(a)));
    return s;
  };
}

// ---------------------------------------------------------------- contours

/**
 * The zero set of a field as SVG path data in a `size`×`size` box, by
 * marching squares on a `res`-cell grid. The zero set is the nodal line: where
 * the plate does not move, so it is exactly where Chladni's sand ends up.
 * NaN samples (outside a disc) are skipped.
 *
 * Segments are chained into polylines and written at 0.1-unit precision
 * (0.1% of the box), because this ships as HTML: unchained, a busy figure was
 * ~40 KB of path data, and the gallery carries fifteen of them.
 */
export function nodalPath(f: Field, res = 160, size = 100, level = 0): string {
  const v: number[] = new Array((res + 1) * (res + 1));
  for (let j = 0; j <= res; j++) for (let i = 0; i <= res; i++) v[j * (res + 1) + i] = f(i / res, j / res) - level;
  const s = size / res;
  const at = (i: number, j: number) => v[j * (res + 1) + i]!;
  const lerp = (a: number, b: number) => a / (a - b);
  const segs: [string, string][] = [];
  const key = (x: number, y: number) => `${(Math.round(x * s * 10) / 10)} ${(Math.round(y * s * 10) / 10)}`;
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), e = at(i, j + 1);
      if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(e)) continue;
      const pts: string[] = [];
      if (a > 0 !== b > 0) pts.push(key(i + lerp(a, b), j));
      if (b > 0 !== c > 0) pts.push(key(i + 1, j + lerp(b, c)));
      if (c > 0 !== e > 0) pts.push(key(i + 1 - lerp(c, e), j + 1));
      if (e > 0 !== a > 0) pts.push(key(i, j + 1 - lerp(e, a)));
      for (let p = 0; p + 1 < pts.length; p += 2) if (pts[p] !== pts[p + 1]) segs.push([pts[p]!, pts[p + 1]!]);
    }
  }
  // Chain: each point joins at most two segments (four at a saddle, rare).
  const ends = new Map<string, number[]>();
  segs.forEach(([p, q], n) => {
    (ends.get(p) ?? ends.set(p, []).get(p)!).push(n);
    (ends.get(q) ?? ends.set(q, []).get(q)!).push(n);
  });
  const used = new Uint8Array(segs.length);
  const next = (pt: string): string | null => {
    for (const n of ends.get(pt) ?? []) {
      if (used[n]) continue;
      used[n] = 1;
      return segs[n]![0] === pt ? segs[n]![1] : segs[n]![0];
    }
    return null;
  };
  let d = "";
  for (let n = 0; n < segs.length; n++) {
    if (used[n]) continue;
    used[n] = 1;
    const line = [segs[n]![0], segs[n]![1]];
    for (let pt = next(line[line.length - 1]!); pt; pt = next(pt)) line.push(pt);
    for (let pt = next(line[0]!); pt; pt = next(pt)) line.unshift(pt);
    d += `M${line.join(" ")}`;
  }
  return d;
}
