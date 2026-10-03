/**
 * Solves the seamless laps for the homepage stack banner (StackBanner.tsx).
 *
 * A lap opens on a ragged skyline, plays LAP pieces flush (no holes), clears
 * whole rows, and ends on exactly the skyline it opened on, so the loop has no
 * seam. On the 5-wide reel well the browser can find one in milliseconds; on a
 * 16-wide banner the search takes seconds to minutes, so it is done once here
 * and the moves are committed to src/data/stack-laps.json. Brands are dealt at
 * runtime, so every visit is still a different game on the same choreography.
 *
 *   node scripts/gen-stack-laps.mjs
 */
import { writeFileSync } from "node:fs";

const BASE = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
];
const norm = (c) => {
  const mx = Math.min(...c.map(([x]) => x));
  const my = Math.min(...c.map(([, y]) => y));
  return c.map(([x, y]) => [x - mx, y - my]);
};
const key = (c) => c.map(([x, y]) => `${x},${y}`).sort().join("|");
function rotations(c) {
  const out = [];
  let cur = c;
  for (let i = 0; i < 4; i++) {
    const n = norm(cur);
    if (!out.some((o) => key(o) === key(n))) out.push(n);
    const maxY = Math.max(...cur.map(([, y]) => y));
    cur = cur.map(([x, y]) => [maxY - y, x]);
  }
  return out;
}
const SHAPES = BASE.map(rotations);
const shuffled = (a) => {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
};
function profile(cells) {
  const bottom = Math.max(...cells.map(([, y]) => y));
  const cols = new Map();
  for (const [x, y] of cells) {
    const up = bottom - y;
    const c = cols.get(x);
    cols.set(x, c ? { lo: Math.min(c.lo, up), hi: Math.max(c.hi, up) } : { lo: up, hi: up });
  }
  return cols;
}

function findLap(start, W, LAP, MAXH, budget) {
  const goal = start.join(",");
  const dead = new Set();
  const path = [];
  let n = 0;
  const step = (h, depth, last, used) => {
    if (++n > budget) return false;
    if (depth === LAP) return h.join(",") === goal;
    const k = `${h}|${depth}|${last}`;
    if (dead.has(k)) return false;
    for (const shape of shuffled([...SHAPES.keys()])) {
      if (shape === last) continue;
      // Keep the mix varied: no shape more than a third of the lap.
      if ((used[shape] ?? 0) >= Math.ceil(LAP / 3)) continue;
      for (const ri of shuffled([...SHAPES[shape].keys()])) {
        const prof = profile(SHAPES[shape][ri]);
        const wide = Math.max(...prof.keys());
        for (const x of shuffled([...Array(W - wide).keys()])) {
          let base = -Infinity;
          for (const [dx, { lo }] of prof) base = Math.max(base, h[x + dx] - lo);
          if ([...prof].some(([dx, { lo }]) => h[x + dx] - lo !== base)) continue;
          const nn = h.slice();
          for (const [dx, { hi }] of prof) nn[x + dx] = base + hi + 1;
          if (Math.max(...nn) > MAXH) continue;
          const full = Math.min(...nn);
          path.push({ shape, ri, x });
          const u = { ...used, [shape]: (used[shape] ?? 0) + 1 };
          if (step(nn.map((v) => v - full), depth + 1, shape, u)) return true;
          path.pop();
        }
      }
    }
    dead.add(k);
    return false;
  };
  return step(start, 0, -1, {}) ? path : null;
}

// Width -> pieces per lap. W * rows cleared = 4 * LAP.
const TARGETS = [
  { W: 8, H: 5, LAP: 10, MAXH: 3 },
  { W: 12, H: 5, LAP: 12, MAXH: 3 },
  { W: 16, H: 5, LAP: 16, MAXH: 3 },
];

const out = {};
for (const { W, H, LAP, MAXH } of TARGETS) {
  const t = Date.now();
  let found = null;
  let start;
  for (let tries = 0; !found && tries < 4000; tries++) {
    start = Array.from({ length: W }, () => Math.floor(Math.random() * 3));
    const zeros = start.filter((v) => v === 0).length;
    if (zeros === 0 || zeros > W / 3) continue;
    found = findLap(start, W, LAP, MAXH, 60000);
  }
  if (!found) throw new Error(`no lap for W=${W}`);
  out[W] = { W, H, start, moves: found };
  console.log(`W=${W}: ${LAP} pieces in ${Date.now() - t}ms, start ${start.join("")}`);
}
writeFileSync("src/data/stack-laps.json", JSON.stringify(out) + "\n");
