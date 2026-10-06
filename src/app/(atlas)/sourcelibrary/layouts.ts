/**
 * The reading guide: every arrangement of the fifty tiles, as pure geometry.
 *
 * One logical world (W × H) and one function per arrangement. Each returns a
 * box for every book plus whatever that arrangement draws around the books
 * (wires, axes, shelf lines). Nothing here touches the DOM, and nothing is
 * random at call time, so server and client agree and a layout can be
 * recomputed as often as a filter changes.
 */

import {
  SHELF_BOOKS,
  SHELF_CATEGORIES,
  SHELF_EDGES,
  type ShelfBook,
  type ShelfCategoryKey,
} from "@/data/library-shelf";
import { SHELF_COVER_ASPECT } from "@/data/library-plates";
import { THREAD_STORIES } from "@/data/ancestors-story";

export const W = 1800;
export const H = 900;

export type LayoutKey = "circuit" | "constellation" | "when" | "languages" | "pages";

export const LAYOUTS: { key: LayoutKey; label: string }[] = [
  { key: "circuit", label: "Circuit" },
  { key: "constellation", label: "Constellation" },
  { key: "when", label: "When" },
  { key: "languages", label: "Languages" },
  { key: "pages", label: "Pages" },
];

/** Centre, size, and a tilt that only the opening cloud uses. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

export const THREADS = SHELF_CATEGORIES.map((c) => c.key);
export const threadIndex = (k: ShelfCategoryKey) => THREADS.indexOf(k);

const aspectOf = (b: ShelfBook) => {
  const a = SHELF_COVER_ASPECT[b.id] ?? 0.7;
  // A landscape print keeps its shape; the clamp only stops a strip-thin tile.
  return Math.min(1.75, Math.max(0.5, a));
};

/** Fit a cover inside a slot of at most `maxW` × `maxH` without cropping it. */
const fit = (b: ShelfBook, maxH: number, maxW = maxH) => {
  const a = aspectOf(b);
  let h = maxH;
  let w = h * a;
  if (w > maxW) {
    w = maxW;
    h = w / a;
  }
  return { w, h };
};

const byYear = [...SHELF_BOOKS].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

/* ------------------------------------------------------------------ circuit */

const C_X0 = 250; // where the wires start
const C_X1 = W - 70; // where they end
export const C_Y0 = 1480;
export const C_Y1 = 1965;
const C_TOP = 172;
const C_GAP = 146;
const C_LANE = 55;

export const yearX = (year: number) => C_X0 + ((year - C_Y0) / (C_Y1 - C_Y0)) * (C_X1 - C_X0);
export const wireY = (k: ShelfCategoryKey) => C_TOP + threadIndex(k) * C_GAP;

export interface CircuitExtras {
  /** where each book's year really falls on its wire, for the stem */
  anchors: Record<string, { x: number; y: number }>;
  wires: { key: ShelfCategoryKey; y: number; x0: number; x1: number; firstX: number }[];
  ticks: { year: number; x: number }[];
  named: { key: ShelfCategoryKey; year: number; x: number; y: number }[];
}

function circuit(): { boxes: Record<string, Box>; extras: CircuitExtras } {
  const boxes: Record<string, Box> = {};
  const anchors: CircuitExtras["anchors"] = {};
  const GAP = 7;

  for (const key of THREADS) {
    const y = wireY(key);
    // lanes: on the wire, above it, below it
    const lanes: { x0: number; x1: number }[][] = [[], [], []];
    const dy = [0, -C_LANE, C_LANE];
    for (const b of byYear.filter((x) => x.cat === key)) {
      const { w, h } = fit(b, 50, 62);
      const ax = yearX(b.year ?? C_Y0);
      anchors[b.id] = { x: ax, y };
      const free = (lane: number, x: number) =>
        lanes[lane]!.every((s) => x + w / 2 + GAP <= s.x0 || x - w / 2 - GAP >= s.x1);
      let lane = [0, 1, 2].find((l) => free(l, ax));
      let x = ax;
      if (lane === undefined) {
        // All three taken at this year: slide right along the wire to the first
        // gap. The stem still lands on the true year.
        lane = 0;
        while (!free(0, x)) x += 4;
      }
      lanes[lane]!.push({ x0: x - w / 2, x1: x + w / 2 });
      boxes[b.id] = { x, y: y + dy[lane]!, w, h, r: 0 };
    }
  }

  const ticks = [];
  for (let yr = 1500; yr <= 1950; yr += 50) ticks.push({ year: yr, x: yearX(yr) });

  return {
    boxes,
    extras: {
      anchors,
      wires: THREADS.map((key) => ({
        key,
        y: wireY(key),
        x0: C_X0,
        x1: C_X1,
        firstX: Math.min(...SHELF_BOOKS.filter((b) => b.cat === key).map((b) => anchors[b.id]!.x)),
      })),
      ticks,
      named: THREAD_STORIES.map((t) => ({
        key: t.key,
        year: t.named.year,
        x: yearX(t.named.year),
        y: wireY(t.key),
      })),
    },
  };
}

/* ------------------------------------------------------------ constellation */

/** mulberry32: a fixed seed, so the same picture on the server and on every visit */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ConstellationExtras {
  labels: { key: ShelfCategoryKey; x: number; y: number }[];
}

function constellation(seedBoxes: Record<string, Box>): { boxes: Record<string, Box>; extras: ConstellationExtras } {
  // Each thread gets a home on an ellipse; springs along the cross references
  // and a push between every pair do the rest. Starting from the circuit keeps
  // neighbours in time near each other where the links leave it open.
  // Written out rather than computed with sin and cos: those are not
  // bit-identical between Node and the browser, and 420 steps of a force
  // simulation would grow a last-digit difference into a different picture.
  const HOMES = [
    [W / 2, H / 2 - 220],
    [W / 2 + 590, H / 2 - 70],
    [W / 2 + 330, H / 2 + 230],
    [W / 2 - 330, H / 2 + 230],
    [W / 2 - 590, H / 2 - 70],
  ];
  const home: Record<string, { x: number; y: number }> = {};
  THREADS.forEach((k, i) => {
    home[k] = { x: HOMES[i % HOMES.length]![0]!, y: HOMES[i % HOMES.length]![1]! };
  });

  const rand = rng(1523);
  const nodes = SHELF_BOOKS.map((b) => {
    const s = seedBoxes[b.id]!;
    return {
      id: b.id,
      cat: b.cat,
      x: home[b.cat]!.x + (s.x - W / 2) * 0.12 + (rand() - 0.5) * 30,
      y: home[b.cat]!.y + (s.y - H / 2) * 0.12 + (rand() - 0.5) * 30,
      vx: 0,
      vy: 0,
    };
  });
  const at = new Map(nodes.map((n) => [n.id, n]));
  const links = SHELF_EDGES.filter(([a, b]) => at.has(a) && at.has(b));

  for (let step = 0; step < 420; step++) {
    const cool = 1 - step / 420;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j]!;
        let dx = n.x - m.x;
        let dy = n.y - m.y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        const push = d < 96 ? (96 - d) * 0.5 : 2600 / d2;
        dx /= d;
        dy /= d;
        n.vx += dx * push;
        n.vy += dy * push;
        m.vx -= dx * push;
        m.vy -= dy * push;
      }
      n.vx += (home[n.cat]!.x - n.x) * 0.012;
      n.vy += (home[n.cat]!.y - n.y) * 0.02;
    }
    for (const [a, b] of links) {
      const n = at.get(a)!;
      const m = at.get(b)!;
      const dx = m.x - n.x;
      const dy = m.y - n.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = (d - 118) * 0.045;
      n.vx += (dx / d) * pull;
      n.vy += (dy / d) * pull;
      m.vx -= (dx / d) * pull;
      m.vy -= (dy / d) * pull;
    }
    for (const n of nodes) {
      n.x += n.vx * 0.55 * cool;
      n.y += n.vy * 0.55 * cool;
      n.vx *= 0.6;
      n.vy *= 0.6;
      n.x = Math.min(W - 90, Math.max(90, n.x));
      n.y = Math.min(H - 70, Math.max(130, n.y));
    }
  }

  const boxes: Record<string, Box> = {};
  for (const b of SHELF_BOOKS) {
    const n = at.get(b.id)!;
    boxes[b.id] = { x: n.x, y: n.y, ...fit(b, 70, 78), r: 0 };
  }
  const labels = THREADS.map((key) => {
    const mine = nodes.filter((n) => n.cat === key);
    return {
      key,
      x: mine.reduce((s, n) => s + n.x, 0) / mine.length,
      y: Math.min(...mine.map((n) => n.y)) - 56,
    };
  });
  return { boxes, extras: { labels } };
}

/* --------------------------------------------------------------------- when */

const BIN = 50;
const WHEN_FIRST = 1450;
const WHEN_BINS = 10; // 1450 … 1950
const WHEN_X0 = 96;
const WHEN_BASE = H - 96;
const WHEN_COLS = 3;

export interface WhenExtras {
  base: number;
  bins: { from: number; x: number; w: number; count: number; top: number }[];
}

function when(): { boxes: Record<string, Box>; extras: WhenExtras } {
  const boxes: Record<string, Box> = {};
  const binW = (W - WHEN_X0 * 2) / WHEN_BINS;
  const colW = (binW - 16) / WHEN_COLS;
  const rowH = 82;
  const bins: WhenExtras["bins"] = [];
  for (let i = 0; i < WHEN_BINS; i++) {
    const from = WHEN_FIRST + i * BIN;
    // threads stay in bands inside a stack, so colour reads up the column
    const mine = SHELF_BOOKS.filter((b) => b.year !== undefined && b.year >= from && b.year < from + BIN).sort(
      (a, b) => threadIndex(a.cat) - threadIndex(b.cat) || (a.year ?? 0) - (b.year ?? 0),
    );
    const x = WHEN_X0 + i * binW;
    mine.forEach((b, k) => {
      const col = k % WHEN_COLS;
      const row = Math.floor(k / WHEN_COLS);
      boxes[b.id] = {
        x: x + 8 + colW / 2 + col * colW,
        y: WHEN_BASE - 12 - rowH / 2 - row * rowH,
        ...fit(b, rowH - 10, colW - 6),
        r: 0,
      };
    });
    bins.push({
      from,
      x,
      w: binW,
      count: mine.length,
      top: WHEN_BASE - 12 - Math.ceil(mine.length / WHEN_COLS) * rowH,
    });
  }
  // a book with no year has nowhere honest to stand: park it beyond the axis
  SHELF_BOOKS.filter((b) => !boxes[b.id]).forEach((b, i) => {
    boxes[b.id] = { x: W - 50, y: 140 + i * 70, ...fit(b, 50, 44), r: 0 };
  });
  return { boxes, extras: { base: WHEN_BASE, bins } };
}

/* ---------------------------------------------------------------- languages */

export interface LanguageExtras {
  rows: { name: string; count: number; y: number; x1: number }[];
}

function languages(): { boxes: Record<string, Box>; extras: LanguageExtras } {
  const groups = new Map<string, ShelfBook[]>();
  for (const b of byYear) {
    const k = b.language ?? "Unknown";
    groups.set(k, [...(groups.get(k) ?? []), b]);
  }
  const order = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const rowH = (H - 96) / order.length;
  const tileH = Math.min(72, rowH - 16);
  const boxes: Record<string, Box> = {};
  const rows: LanguageExtras["rows"] = [];
  order.forEach(([name, list], i) => {
    const y = 70 + i * rowH + rowH / 2;
    let x = 250;
    for (const b of list) {
      const { w, h } = fit(b, tileH, 86);
      boxes[b.id] = { x: x + w / 2, y, w, h, r: 0 };
      x += w + 10;
    }
    rows.push({ name, count: list.length, y, x1: x });
  });
  return { boxes, extras: { rows } };
}

/* -------------------------------------------------------------------- pages */

/** Logical pixels of slab per page. Linear, so two slabs can be compared by eye. */
export const PX_PER_PAGE = 1 / 5.4;

export interface PagesExtras {
  shelves: number[];
  slabs: { id: string; cat: ShelfCategoryKey; x: number; y: number; w: number; h: number; pages: number }[];
  total: number;
}

function pages(): { boxes: Record<string, Box>; extras: PagesExtras } {
  const sorted = [...SHELF_BOOKS].sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0));
  const boxes: Record<string, Box> = {};
  const slabs: PagesExtras["slabs"] = [];
  const shelves: number[] = [];
  const rowH = 150;
  const tileH = 104;
  const left = 86;
  const right = W - 86;
  let x = left;
  let base = 196;
  shelves.push(base);
  for (const b of sorted) {
    const { w, h } = fit(b, tileH, 124);
    const slabW = Math.max(2, (b.pages ?? 0) * PX_PER_PAGE);
    if (x + w + slabW > right) {
      x = left;
      base += rowH;
      shelves.push(base);
    }
    boxes[b.id] = { x: x + w / 2, y: base - h / 2, w, h, r: 0 };
    slabs.push({ id: b.id, cat: b.cat, x: x + w + 2, y: base - h, w: slabW, h, pages: b.pages ?? 0 });
    x += w + slabW + 26;
  }
  return {
    boxes,
    extras: { shelves, slabs, total: SHELF_BOOKS.reduce((s, b) => s + (b.pages ?? 0), 0) },
  };
}

/* -------------------------------------------------------------------- cloud */

/** Where the tiles hang before the opening sorts them: everywhere at once. */
function cloud(): Record<string, Box> {
  const rand = rng(1485);
  const boxes: Record<string, Box> = {};
  for (const b of SHELF_BOOKS) {
    boxes[b.id] = {
      x: 240 + rand() * (W - 480),
      y: 150 + rand() * (H - 300),
      ...fit(b, 92, 100),
      r: (rand() - 0.5) * 26,
    };
  }
  return boxes;
}

/* ---------------------------------------------------------------------- all */

const c = circuit();
export const GEOMETRY = {
  cloud: cloud(),
  circuit: c,
  constellation: constellation(c.boxes),
  when: when(),
  languages: languages(),
  pages: pages(),
};

/** Edges both of whose ends exist, with whether they stay on one thread. */
export const LINKS = (() => {
  const cat = new Map(SHELF_BOOKS.map((b) => [b.id, b.cat]));
  return SHELF_EDGES.filter(([a, b]) => cat.has(a) && cat.has(b)).map(([a, b, why]) => ({
    a,
    b,
    why,
    same: cat.get(a) === cat.get(b),
    cat: cat.get(a)!,
  }));
})();
