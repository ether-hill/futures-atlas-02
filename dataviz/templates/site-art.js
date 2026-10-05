// The site's own generative art, redrawn for posts. Decoration only, no data.
//
// flowField: the homepage hero ("Field Dynamics" in /generatives) - particles
//   streaming round a handful of vortex singularities, coloured lo -> hi along
//   each line, on the site's palettes. Paths are precomputed once per size and
//   then drawn as moving windows along each path, so frame t is reproducible.
// rings: the "Quantum Interference Visuals" project - two sources of
//   concentric rings, brightest where they meet in phase.

// The hero's palettes, verbatim from src/components/HeroField.tsx
export const PALETTES = {
  violetCyan: { lo: "#7c5cff", hi: "#22d3ee" },
  magentaAmber: { lo: "#e05cff", hi: "#ffb14d" },
  blueGreen: { lo: "#3a7abf", hi: "#57e88f" },
  emberGold: { lo: "#ff6a3d", hi: "#ffd166" },
  cyanMagenta: { lo: "#22d3ee", hi: "#e05cff" },
};

const cache = new Map();

function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function paths(W, H, { seed, n, steps, region }) {
  const key = [W, H, seed, n, steps, region.join()].join("|");
  if (cache.has(key)) return cache.get(key);
  const r = rng(seed);
  const [rx0, ry0, rx1, ry1] = region.map((v, i) => v * (i % 2 ? H : W));
  // singularities: vortices of either spin, biased into the region
  const sing = Array.from({ length: 5 }, () => ({
    x: rx0 + r() * (rx1 - rx0), y: ry0 + r() * (ry1 - ry0), s: (r() < 0.5 ? -1 : 1) * (0.6 + r()), k: 0.25 + r() * 0.5,
  }));
  const vel = (x, y) => {
    let vx = 0.15, vy = -0.05;
    for (const p of sing) {
      const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy + 900;
      vx += (-dy * p.s + dx * p.k * 0.15) * 900 / d2;
      vy += (dx * p.s + dy * p.k * 0.15) * 900 / d2;
    }
    const m = Math.hypot(vx, vy) || 1;
    return [vx / m, vy / m];
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    let x = rx0 - 80 + r() * (rx1 - rx0 + 160), y = ry0 - 80 + r() * (ry1 - ry0 + 160);
    const pts = [[x, y]];
    for (let k = 0; k < steps; k++) { const [vx, vy] = vel(x, y); x += vx * 4; y += vy * 4; pts.push([x, y]); }
    out.push({ pts, ph: r(), len: 0.25 + r() * 0.35 });
  }
  cache.set(key, out);
  return out;
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Streamlines in a region (fractions of W/H), fading out toward `fadeTo`. */
export function flowField(ctx, W, H, t, {
  palette = PALETTES.violetCyan, seed = 11, n = 700, steps = 70, region = [0.35, 0, 1.05, 0.55],
  alpha = 0.55, width = 1.3, speed = 0.08, mask = () => 1,
} = {}) {
  const lo = hex(palette.lo), hi = hex(palette.hi);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  for (const p of paths(W, H, { seed, n, steps, region })) {
    // a window of the path slides along it over time
    const head = ((p.ph + t * speed) % 1) * (1 + p.len);
    const a0 = Math.max(0, Math.floor((head - p.len) * steps)), a1 = Math.min(steps, Math.floor(head * steps));
    for (let k = a0; k < a1; k++) {
      const [x0, y0] = p.pts[k], [x1, y1] = p.pts[k + 1];
      const m = mask(x0 / W, y0 / H);
      if (m <= 0.01) continue;
      const f = (k - a0) / Math.max(1, a1 - a0); // 0 tail .. 1 head
      const c = mix(lo, hi, k / steps);
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * f * m})`;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }
  ctx.restore();
}

/** Two-source interference rings, as in the Quantum Interference Visuals card. */
export function rings(ctx, W, H, t, {
  a = [0.72, 0.16], b = [0.95, 0.2], wavelength = 26, color = "#4f93d8", alpha = 0.5, speed = 0.5, reach = 0.55,
} = {}) {
  const c = hex(color);
  const s = 3, w = Math.ceil(W / s), h = Math.ceil(H / s);
  const off = new OffscreenCanvas(w, h), o = off.getContext("2d"), img = o.createImageData(w, h);
  const k = (2 * Math.PI) / wavelength, ph = t * speed * 2 * Math.PI;
  const [ax, ay, bx, by] = [a[0] * W, a[1] * H, b[0] * W, b[1] * H];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = i * s, y = j * s;
    const da = Math.hypot(x - ax, y - ay), db = Math.hypot(x - bx, y - by);
    const fa = Math.exp(-da / (reach * W)), fb = Math.exp(-db / (reach * W));
    const ra = Math.cos(k * da - ph) * fa, rb = Math.cos(k * db - ph) * fb;
    const v = Math.max(0, ra + rb) / 2; // bright crests only
    const q = (j * w + i) * 4;
    img.data[q] = c[0]; img.data[q + 1] = c[1]; img.data[q + 2] = c[2];
    img.data[q + 3] = Math.min(255, Math.pow(v, 1.4) * 255 * alpha * 2);
  }
  o.putImageData(img, 0, 0);
  ctx.save(); ctx.imageSmoothingQuality = "high"; ctx.drawImage(off, 0, 0, W, H); ctx.restore();
}

// ── Ports of three pieces from /generatives, confined to a corner ──────────
// Each draws into an offscreen canvas, then a radial mask fades it out from
// the corner (cx, cy as fractions) so it never reaches the chart.

function cornered(ctx, W, H, { cx = 1, cy = 0, r = 0.75 }, draw) {
  const off = new OffscreenCanvas(W * 2, H * 2), o = off.getContext("2d");
  o.scale(2, 2);
  draw(o);
  o.globalCompositeOperation = "destination-in";
  const g = o.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, r * Math.max(W, H));
  g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.55, "rgba(0,0,0,0.75)"); g.addColorStop(1, "rgba(0,0,0,0)");
  o.fillStyle = g; o.fillRect(0, 0, W, H);
  ctx.drawImage(off, 0, 0, W, H);
}
const lerpHex = (a, b, t) => { const c = mix(hex(a), hex(b), t); return `rgb(${c[0]},${c[1]},${c[2]})`; };

/** Moiré Lattice: two line families whose relative angle breathes. */
export function moire(ctx, W, H, t, { palette = PALETTES.violetCyan, lines = 60, corner = {}, alpha = 0.55, loop = 18 } = {}) {
  cornered(ctx, W, H, corner, (o) => {
    const diag = Math.hypot(W, H), step = diag / lines, ph = (t / loop) * 2 * Math.PI;
    const drift = 0.1 * Math.sin(ph), base = 0.5 + ph * 0.15;
    o.globalCompositeOperation = "lighter";
    o.globalAlpha = alpha; o.lineWidth = 1.2;
    for (const [ang, c] of [[base - drift, 0.3], [base + drift, 0.75]]) {
      o.save(); o.translate(W * (corner.cx ?? 1), H * (corner.cy ?? 0)); o.rotate(ang);
      o.strokeStyle = lerpHex(palette.lo, palette.hi, c);
      o.beginPath();
      for (let x = -diag; x <= diag; x += step) { o.moveTo(x, -diag); o.lineTo(x, diag); }
      o.stroke(); o.restore();
    }
  });
}

/** Lattice Waves: a wave-displaced grid in perspective, drawn as wireframe. */
export function latticeWaves(ctx, W, H, t, { palette = PALETTES.violetCyan, res = 34, corner = {}, alpha = 0.7, loop = 24, seed = 5 } = {}) {
  const r = rng(seed), TAU = 2 * Math.PI, ph = (t / loop) * TAU;
  const waves = Array.from({ length: 4 }, () => [0.6 + r() * 1.6, r() * TAU, Math.max(1, Math.round(1 + r() * 2))]);
  const z = (u, v) => waves.reduce((s, [k, d, f]) => s + Math.sin(k * (u * Math.cos(d) + v * Math.sin(d)) * 2.2 + f * ph), 0) * 0.16;
  // camera: a plane seen from above at an angle, centred on the corner
  const cxp = W * (corner.cx ?? 1) - W * 0.12, cyp = H * (corner.cy ?? 0) + H * 0.12, S = Math.max(W, H) * 0.42, spin = ph * 0.15;
  const proj = (u, v) => {
    const x = u * Math.cos(spin) - v * Math.sin(spin), y = u * Math.sin(spin) + v * Math.cos(spin), h = z(u, v);
    const depth = 1 / (1.9 + y * 0.55);
    return [cxp + x * S * depth, cyp + (y * 0.45 - h) * S * depth];
  };
  cornered(ctx, W, H, corner, (o) => {
    o.lineWidth = 1; o.globalAlpha = alpha;
    const N = res;
    for (const dir of [0, 1]) for (let i = 0; i <= N; i++) {
      const a = -2.5 + (5 * i) / N;
      o.strokeStyle = lerpHex(palette.lo, palette.hi, i / N);
      o.beginPath();
      for (let j = 0; j <= N; j++) {
        const b = -2.5 + (5 * j) / N;
        const [px, py] = dir ? proj(a, b) : proj(b, a);
        j ? o.lineTo(px, py) : o.moveTo(px, py);
      }
      o.stroke();
    }
  });
}

/** Phyllotaxis: golden-angle seed spiral, slowly turning and breathing. */
export function phyllotaxis(ctx, W, H, t, { palette = PALETTES.violetCyan, n = 1600, corner = {}, alpha = 0.85, loop = 24, size = 0.5 } = {}) {
  const GOLDEN = 2.399963229728653, ph = (t / loop) * 2 * Math.PI;
  const cx = W * (corner.cx ?? 1), cy = H * (corner.cy ?? 0);
  const scale = (size * Math.max(W, H)) / Math.sqrt(n) * (1 + 0.04 * Math.sin(ph));
  const dot = Math.max(1.2, scale * 0.36);
  cornered(ctx, W, H, corner, (o) => {
    o.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = i * GOLDEN + ph * 0.25, rr = scale * Math.sqrt(i);
      o.fillStyle = lerpHex(palette.lo, palette.hi, i / n);
      o.beginPath(); o.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, dot, 0, 6.2832); o.fill();
    }
  });
}
