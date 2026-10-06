// Generated "quantum" art for the vivid backgrounds. Decoration only: none of
// it encodes data, so it stays behind the chart, low in contrast, and it never
// sits where a value has to be read. Every function is pure in (t), so a video
// frame can be drawn in any order.

/** Two-source interference: the bright fringes of overlapping waves. */
export function interference(ctx, W, H, t, {
  sources = [[0.85, 0.1], [1.05, 0.35]], wavelength = 46, color = [120, 200, 255], alpha = 0.22, speed = 0.6,
  mask = (x, y) => 1,
} = {}) {
  const s = 4; // compute at quarter resolution, scale up smoothly
  const w = Math.ceil(W / s), h = Math.ceil(H / s);
  const off = new OffscreenCanvas(w, h);
  const o = off.getContext("2d");
  const img = o.createImageData(w, h);
  const k = (2 * Math.PI) / wavelength, ph = t * speed * 2 * Math.PI;
  const src = sources.map(([u, v]) => [u * W, v * H]);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = i * s, y = j * s;
      let re = 0, im = 0;
      for (const [sx, sy] of src) {
        const d = Math.hypot(x - sx, y - sy);
        const a = 1 / Math.sqrt(1 + d / 300);
        re += a * Math.cos(k * d - ph); im += a * Math.sin(k * d - ph);
      }
      const I = (re * re + im * im) / (src.length * src.length); // 0..1
      const v = Math.pow(I, 2.2) * mask(x / W, y / H);
      const p = (j * w + i) * 4;
      img.data[p] = color[0]; img.data[p + 1] = color[1]; img.data[p + 2] = color[2];
      img.data[p + 3] = Math.min(255, v * 255 * alpha * 3);
    }
  }
  o.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(off, 0, 0, W, H);
  ctx.restore();
}

/** A field of glowing qubits on a grid, with a few entangled pairs pulsing. */
export function lattice(ctx, W, H, t, {
  x0 = 0.55, y0 = 0.02, x1 = 1.02, y1 = 0.4, gap = 46, color = "63,210,255", link = "255,79,176", seed = 7,
} = {}) {
  const rand = mulberry(seed);
  const pts = [];
  for (let y = y0 * H; y < y1 * H; y += gap) {
    for (let x = x0 * W; x < x1 * W; x += gap) {
      const ex = Math.min((x - x0 * W) / (0.25 * W), 1), ey = Math.min((y1 * H - y) / (0.18 * H), 1);
      pts.push({ x, y, a: Math.max(0, Math.min(ex, ey)), ph: rand() * 6.28 });
    }
  }
  // entangled links between random near neighbours
  ctx.save();
  ctx.lineCap = "round";
  for (let n = 0; n < 14; n++) {
    const a = pts[Math.floor(rand() * pts.length)];
    const b = pts.find((p) => Math.abs(p.x - a.x - gap) < 1 && Math.abs(p.y - a.y) < 1)
      ?? pts.find((p) => Math.abs(p.y - a.y - gap) < 1 && Math.abs(p.x - a.x) < 1);
    if (!b) continue;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + n);
    ctx.strokeStyle = `rgba(${link},${0.55 * pulse * Math.min(a.a, b.a)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const p of pts) {
    const tw = 0.6 + 0.4 * Math.sin(t * 1.6 + p.ph);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
    g.addColorStop(0, `rgba(${color},${0.9 * p.a * tw})`);
    g.addColorStop(0.25, `rgba(${color},${0.35 * p.a * tw})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, 6.29); ctx.fill();
  }
  ctx.restore();
}

/** Wireframe Bloch sphere with a precessing state vector. */
export function bloch(ctx, cx, cy, R, t, { color = "157,125,255", vec = "255,194,61", alpha = 0.5 } = {}) {
  ctx.save();
  ctx.strokeStyle = `rgba(${color},${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.29); ctx.stroke();
  for (const k of [0.32, 1]) { ctx.beginPath(); ctx.ellipse(cx, cy, R, R * k * 0.32, 0, 0, 6.29); ctx.stroke(); }
  for (let m = 0; m < 3; m++) {
    const rot = t * 0.35 + (m * Math.PI) / 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.cos(rot)), R, 0, 0, 6.29); ctx.stroke();
  }
  const th = 0.9, phi = t * 1.4;
  const vx = cx + R * Math.sin(th) * Math.cos(phi), vy = cy - R * Math.cos(th) + R * 0.32 * Math.sin(th) * Math.sin(phi) * 0.3;
  ctx.strokeStyle = `rgba(${vec},0.95)`; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(vx, vy); ctx.stroke();
  const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, 26);
  g.addColorStop(0, `rgba(${vec},1)`); g.addColorStop(1, `rgba(${vec},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(vx, vy, 26, 0, 6.29); ctx.fill();
  ctx.restore();
}

/** Soft star specks: deterministic, slowly twinkling. */
export function stars(ctx, W, H, t, { n = 140, seed = 3, alpha = 0.5 } = {}) {
  const r = mulberry(seed);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, s = 0.6 + r() * 1.6, ph = r() * 6.28;
    ctx.fillStyle = `rgba(220,226,255,${alpha * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + ph)))})`;
    ctx.beginPath(); ctx.arc(x, y, s, 0, 6.29); ctx.fill();
  }
  ctx.restore();
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A padlock drawn in glowing qubit dots. open: 0 = locked, 1 = shackle lifted. */
export function padlock(ctx, cx, cy, s, t, { open = 0, color = "63,210,255", hot = "255,79,176" } = {}) {
  const pts = [];
  const bw = s, bh = s * 0.8, bx = cx - bw / 2, by = cy;            // body
  const step = s / 16;
  for (let x = bx; x <= bx + bw + 0.1; x += step) { pts.push([x, by, 0]); pts.push([x, by + bh, 0]); }
  for (let y = by + step; y < by + bh; y += step) { pts.push([bx, y, 0]); pts.push([bx + bw, y, 0]); }
  // shackle: a half ring that lifts and swings open on its left leg
  const R = s * 0.32, lift = open * s * 0.28, sx = cx, sy = by - lift;
  for (let a = Math.PI; a <= 2 * Math.PI + 0.01; a += Math.PI / 18) pts.push([sx + R * Math.cos(a), sy + R * Math.sin(a) - s * 0.08, 1]);
  for (let y = sy - s * 0.08; y < by - lift * 0 + 0.1 && y <= sy + s * 0.12; y += step) { pts.push([sx - R, y, 1]); if (open < 0.05) pts.push([sx + R, y, 1]); }
  // keyhole
  pts.push([cx, by + bh * 0.42, 2]); pts.push([cx, by + bh * 0.42 + step, 2]); pts.push([cx, by + bh * 0.42 + 2 * step, 2]);
  ctx.save();
  pts.forEach(([x, y, part], i) => {
    const tw = 0.65 + 0.35 * Math.sin(t * 2 + i * 0.7);
    const c = part === 1 && open > 0.05 ? hot : color;
    const g = ctx.createRadialGradient(x, y, 0, x, y, step * 1.1);
    g.addColorStop(0, `rgba(${c},${0.95 * tw})`); g.addColorStop(0.35, `rgba(${c},${0.4 * tw})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, step * 1.1, 0, 6.29); ctx.fill();
  });
  ctx.restore();
}

/** The Atlas mark, huge and cropped, turning slowly. Flat colour, no effects. */
export function markMotif(ctx, path, cx, cy, size, t, color, { turn = 0.02 } = {}) {
  if (!path) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * turn * 2 * Math.PI);
  const k = size / 426;
  ctx.scale(k, k);
  ctx.translate(-512.3, -512.2); // centre of the mark's viewBox
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}
