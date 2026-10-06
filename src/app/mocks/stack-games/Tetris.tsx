"use client";

import { useEffect, useRef, useState } from "react";
import { Brick, Legend, bag, sleep } from "./Brick";
import { GROUPS, GROUP_HEX, ITEMS, type Item, type Marks } from "./stack";

/**
 * STACK — the tech stack as a falling-block game.
 *
 * Bricks drop into a five-wide well, lock where they land, and a full row goes
 * white and cancels out; whatever sat above it drops into the gap. The tools
 * that just cleared are named as they leave, which is the whole point: the
 * reel is an inventory, the game is only the way of reading it.
 *
 * It plays itself. A one-move heuristic (the standard height / holes /
 * bumpiness / lines weighting) picks the rotation and column, so the well
 * stays legible and clears keep arriving instead of the stack drowning in a
 * random pile. The piece is then PLAYED there, not dropped there: it appears
 * at the top of the well over the middle, turns, and steps left or right a
 * column at a time while it falls, the way a person nudges a piece into its
 * slot, and only drops once it is lined up. See `plan()`.
 *
 * BARE strips the page down to the board: no title, no counter, no family key,
 * and no line naming what just cleared. That is the version that goes out as a
 * post — a reel carries its words in the caption, and a caption printed onto
 * the video as well is the same sentence twice. With the chrome gone the well
 * takes the whole frame, so the bricks come up a size.
 *
 * PACE lives in one place below. It is deliberately slower than a game would
 * be played: this is a reel, and the reader has to have time to read the name
 * on a brick before it is gone. Every beat waits for the one before it, so
 * changing a number here cannot desynchronise the animation from the board.
 */

const W = 5;
const H = 9;
const GAP = 4;

/** Cell size and inset, with the chrome and without it. */
const FIT = {
  full: { cell: 74, top: 44 },
  bare: { cell: 80, top: (764 - 9 * 80) / 2 },
};

type Cells = [number, number][];

const BASE: Cells[] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
];

const norm = (c: Cells): Cells => {
  const mx = Math.min(...c.map(([x]) => x));
  const my = Math.min(...c.map(([, y]) => y));
  return c.map(([x, y]) => [x - mx, y - my] as [number, number]);
};
const key = (c: Cells) => c.map(([x, y]) => `${x},${y}`).sort().join("|");

function rotations(c: Cells): Cells[] {
  const out: Cells[] = [];
  let cur = c;
  for (let i = 0; i < 4; i++) {
    const n = norm(cur);
    if (!out.some((o) => key(o) === key(n))) out.push(n);
    const maxY = Math.max(...cur.map(([, y]) => y));
    cur = cur.map(([x, y]) => [maxY - y, x] as [number, number]);
  }
  return out;
}

const SHAPES = BASE.map(rotations);

type Grid = number[][]; // brick id, or 0
const empty = (): Grid => Array.from({ length: H }, () => Array(W).fill(0));

function fits(g: Grid, cells: Cells, x: number, y: number) {
  return cells.every(([dx, dy]) => {
    const cx = x + dx;
    const cy = y + dy;
    if (cx < 0 || cx >= W || cy >= H) return false;
    return cy < 0 || g[cy][cx] === 0;
  });
}

function dropY(g: Grid, cells: Cells, x: number) {
  let y = -4;
  while (fits(g, cells, x, y + 1)) y++;
  return y;
}

/** Standard four-term evaluation. Higher is better. */
function score(g: Grid, cells: Cells, x: number, y: number) {
  const t = g.map((r) => r.slice());
  for (const [dx, dy] of cells) {
    if (y + dy < 0) return -Infinity; // topped out
    t[y + dy][x + dx] = 1;
  }
  const lines = t.filter((r) => r.every((v) => v !== 0)).length;
  const heights: number[] = [];
  let holes = 0;
  for (let c = 0; c < W; c++) {
    let top = H;
    for (let r = 0; r < H; r++) {
      if (t[r][c] !== 0) { top = r; break; }
    }
    heights.push(H - top);
    for (let r = top + 1; r < H; r++) if (t[r][c] === 0) holes++;
  }
  const agg = heights.reduce((a, b) => a + b, 0);
  let bump = 0;
  for (let c = 0; c < W - 1; c++) bump += Math.abs(heights[c] - heights[c + 1]);
  return 0.9 * lines - 0.52 * agg - 0.46 * holes - 0.2 * bump;
}

/** Every beat of the loop, in milliseconds. See the note at the top. */
const PACE = {
  open: 900,        // empty well before the first brick
  fallPerRow: 92,   // the drop, per row travelled
  fallMin: 560,
  land: 420,        // the brick sits, lit, where it came to rest
  clear: 560,       // the full row turns over to bone (matches --clear)
  shift: 380,       // whatever was above it comes down
  shiftHold: 440,
  next: 380,        // and a breath before the next piece
  move: 150,        // one player input: a turn, or a step of one column
  moveEase: "cubic-bezier(.2,.7,.3,1)",
  gravity: 0.55,    // chance each input also lets the piece fall one row
};

type Step = { cells: Cells; x: number; y: number };

/**
 * The inputs a player would make to get a piece from the spawn to where the
 * heuristic wants it: turn to the target rotation, then step toward the target
 * column, falling a row now and then in between. Every intermediate position is
 * checked against the board. Returns null when the piece cannot be walked there
 * from the top of the well (a tall stack in the way), and the caller falls back
 * to dropping it straight in.
 */
function plan(g: Grid, rots: Cells[], ti: number, tx: number, ty: number): Step[] | null {
  const wide0 = Math.max(...rots[0].map(([x]) => x));
  let x = Math.floor((W - 1 - wide0) / 2);
  let y = 0;
  let ri = 0;
  if (!fits(g, rots[ri], x, y)) return null;
  const out: Step[] = [{ cells: rots[ri], x, y }];
  const fall = () => {
    if (y + 1 < ty && Math.random() < PACE.gravity && fits(g, rots[ri], x, y + 1)) y++;
  };
  while (ri !== ti || x !== tx) {
    if (ri !== ti) {
      const nr = ri + 1;
      // A turn can push a piece past the right wall; nudge it back in, as the
      // game would.
      const nx = Math.min(x, W - 1 - Math.max(...rots[nr].map(([cx]) => cx)));
      if (!fits(g, rots[nr], nx, y)) return null;
      ri = nr;
      x = nx;
    } else {
      const nx = x + Math.sign(tx - x);
      if (!fits(g, rots[ri], nx, y)) return null;
      x = nx;
    }
    fall();
    out.push({ cells: rots[ri], x, y });
  }
  // Lined up. Whatever is left is a straight drop down its own column, which
  // dropY already walked from above, so it is clear by construction.
  return y <= ty ? out : null;
}

/**
 * THE LAP. A reel loops, so the game is written as one: the well opens on a
 * ragged skyline, LAP pieces are played, eight rows clear, and the board comes
 * back to exactly the skyline it opened on, with the same brand in every cell.
 * Then it plays the same lap again. The recorder cuts in the still moment at
 * the top of a lap, where the first and last frames are the same picture.
 *
 * The search runs on column heights alone. Every placement has to sit flush,
 * leaving no hole, which keeps the board a skyline (so heights describe it
 * completely, and there are only a few thousand of them) and is also what a
 * good player does. Full rows are then always the bottom ones, so eight
 * clears are guaranteed to have taken every brick the lap started with, and
 * the opening bricks can simply be given the brands of the bricks that end the
 * lap in their cells.
 */
const LAP = 10;          // pieces per lap: 40 bricks, 8 rows, about 25 seconds
const LAP_MAX_H = 6;     // never let the stack climb past this

type Move = { shape: number; ri: number; x: number; items: Item[] };
type Lap = { seed: { row: number; col: number; item: Item }[]; moves: Move[] };

const shuffled = <T,>(a: T[]) => {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
};

/** For each column a piece covers: its lowest and highest cell, up from the piece's bottom. */
function profile(cells: Cells) {
  const bottom = Math.max(...cells.map(([, y]) => y));
  const cols = new Map<number, { lo: number; hi: number }>();
  for (const [x, y] of cells) {
    const up = bottom - y;
    const c = cols.get(x);
    cols.set(x, c ? { lo: Math.min(c.lo, up), hi: Math.max(c.hi, up) } : { lo: up, hi: up });
  }
  return cols;
}

function findLap(start: number[]) {
  const goal = start.join(",");
  const dead = new Set<string>();
  const path: { shape: number; ri: number; x: number }[] = [];
  const step = (h: number[], depth: number, last: number): boolean => {
    if (depth === LAP) return h.join(",") === goal;
    const k = `${h.join(",")}|${depth}|${last}`;
    if (dead.has(k)) return false;
    for (const shape of shuffled([...SHAPES.keys()])) {
      if (shape === last) continue; // the same piece twice running looks like a stutter
      for (const ri of shuffled([...SHAPES[shape].keys()])) {
        const prof = profile(SHAPES[shape][ri]);
        const wide = Math.max(...prof.keys());
        for (const x of shuffled([...Array(W - wide).keys()])) {
          let base = -Infinity;
          for (const [dx, { lo }] of prof) base = Math.max(base, h[x + dx] - lo);
          if ([...prof].some(([dx, { lo }]) => h[x + dx] - lo !== base)) continue;
          const n = h.slice();
          for (const [dx, { hi }] of prof) n[x + dx] = base + hi + 1;
          if (Math.max(...n) > LAP_MAX_H) continue;
          const full = Math.min(...n);
          path.push({ shape, ri, x });
          if (step(n.map((v) => v - full), depth + 1, shape)) return true;
          path.pop();
        }
      }
    }
    dead.add(k);
    return false;
  };
  return step(start, 0, -1) ? path : null;
}

function buildLap(nextItem: () => Item): Lap | null {
  for (let tries = 0; tries < 60; tries++) {
    // An opening skyline: two to three rows deep, ragged, never a full row.
    const start = Array.from({ length: W }, () => Math.floor(Math.random() * 4));
    if (Math.min(...start) !== 0) start[Math.floor(Math.random() * W)] = 0;
    const total = start.reduce((a, b) => a + b, 0);
    if (total < 7 || total > 11) continue;
    const found = findLap(start);
    if (!found) continue;

    // Play the lap once on paper to see which bricks end it, and where.
    let g = empty();
    for (let c = 0; c < W; c++) for (let r = H - start[c]; r < H; r++) g[r][c] = -1;
    const brand = new Map<number, Item>();
    let id = 1;
    const moves: Move[] = found.map((m) => {
      const cells = SHAPES[m.shape][m.ri];
      const y = dropY(g, cells, m.x);
      const items = cells.map(([dx, dy]) => {
        const it = nextItem();
        brand.set(id, it);
        g[y + dy][m.x + dx] = id++;
        return it;
      });
      const kept = g.filter((row) => !row.every((v) => v !== 0));
      while (kept.length < H) kept.unshift(Array(W).fill(0));
      g = kept;
      return { ...m, items };
    });
    const seed: Lap["seed"] = [];
    let ok = true;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const v = g[r][c];
        if (v < 0) ok = false;           // an opening brick survived the lap
        else if (v > 0) seed.push({ row: r, col: c, item: brand.get(v)! });
      }
    }
    if (ok) return { seed, moves };
  }
  return null;
}

type Tile = { id: number; item: Item; col: number; row: number; dur: number; ease: string; cls: string };

export function Tetris({ marks, bare = false }: { marks: Marks; bare?: boolean }) {
  const { cell: CELL, top: TOP } = bare ? FIT.bare : FIT.full;
  const LEFT = (430 - W * CELL) / 2;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [lines, setLines] = useState(0);
  const [toast, setToast] = useState<{ k: number; text: string } | null>(null);
  // The loop reads the board it is also writing, so a ref carries the current
  // tiles across instead of the effect depending on its own output.
  const tilesRef = useRef<Tile[]>([]);
  tilesRef.current = tiles;

  useEffect(() => {
    // Each run of this effect has its OWN flag. A shared ref was set back to
    // true by the next mount (React's dev double-mount, or a card scrolled out
    // and back), which left the old loop running beside the new one on the
    // same board: duplicate bricks, then a crash.
    const alive = { current: true };
    let id = 1;
    let grid = empty();
    const nextShape = bag(SHAPES);
    const nextItem = bag(ITEMS);
    let cleared = 0;

    /**
     * The well opens with three ragged rows already in it. Starting empty meant
     * the first ten seconds of every recording were a nearly blank board — and
     * at this pace a reel is only ever ten or twenty seconds long. No row is
     * seeded complete, or the game would clear one before a brick had fallen.
     */
    const lap = buildLap(nextItem);
    const seed = () => {
      if (lap) {
        const fresh = lap.seed.map((b) => {
          const t: Tile = { id: id++, item: b.item, col: b.col, row: b.row, dur: 0, ease: "linear", cls: "" };
          grid[b.row][b.col] = t.id;
          return t;
        });
        setTiles(fresh);
        return;
      }
      const fresh: Tile[] = [];
      for (let r = H - 3; r < H; r++) {
        const gaps = new Set<number>();
        while (gaps.size < 1 + Math.floor(Math.random() * 2)) gaps.add(Math.floor(Math.random() * W));
        for (let c = 0; c < W; c++) {
          if (gaps.has(c)) continue;
          const t: Tile = { id: id++, item: nextItem(), col: c, row: r, dur: 0, ease: "linear", cls: "" };
          grid[r][c] = t.id;
          fresh.push(t);
        }
      }
      setTiles(fresh);
    };

    /** Change a style prop one commit before the transform that uses it. */
    const settle = async () => { await sleep(34); };

    const run = async () => {
      seed();
      let turn = 0;
      if (!lap) await sleep(PACE.open);
      while (alive.current) {
        if (lap && turn % lap.moves.length === 0) {
          // The top of a lap: the board is the opening skyline and nothing is
          // moving. The recorder cuts here.
          const w = window as unknown as { __stackLap?: number[] };
          w.__stackLap = [...(w.__stackLap ?? []), Date.now()];
          await sleep(PACE.open);
          if (!alive.current) return;
        }
        const move = lap ? lap.moves[turn % lap.moves.length] : null;
        turn++;
        const rots = move ? SHAPES[move.shape] : nextShape();
        let best = { s: -Infinity, cells: rots[0], x: 0, y: 0, ri: 0 };
        if (move) {
          const cells = rots[move.ri];
          best = { s: 0, cells, x: move.x, y: dropY(grid, cells, move.x), ri: move.ri };
        } else for (const [ri, cells] of rots.entries()) {
          const wide = Math.max(...cells.map(([x]) => x));
          for (let x = 0; x + wide < W; x++) {
            const y = dropY(grid, cells, x);
            const s = score(grid, cells, x, y);
            if (s > best.s) best = { s, cells, x, y, ri };
          }
        }
        if (best.s === -Infinity) {
          // Topped out. Sweep the whole well rather than sit on a dead board.
          const all = tilesRef.current;
          for (let i = 0; i < all.length; i++) {
            const t = all[i];
            setTiles((p) => p.map((q) => (q.id === t.id ? { ...q, cls: "is-clearing" } : q)));
            await sleep(44);
            if (!alive.current) return;
          }
          await sleep(PACE.clear);
          grid = empty();
          setTiles([]);
          cleared = 0;
          setLines(0);
          await sleep(320);
          seed();
          await sleep(PACE.open);
          continue;
        }

        const path = plan(grid, rots, best.ri, best.x, best.y);
        const items = move ? move.items : best.cells.map(() => nextItem());
        let fresh: Tile[];
        // an empty path (rare, with a fresh random lap) falls through to the
        // drop-from-above branch rather than reading path[0] of nothing
        if (path && path.length) {
          // Appear at the top, then play it into place one input at a time.
          // Each cell keeps its brand as the piece turns, so a turn reads as
          // the same four bricks swinging round rather than a new piece.
          const at = (st: Step, i: number) => ({ col: st.x + st.cells[i][0], row: st.y + st.cells[i][1] });
          fresh = items.map((item, i) => ({
            id: id++, item, ...at(path[0], i), dur: PACE.move, ease: PACE.moveEase, cls: "",
          }));
          const ids0 = new Set(fresh.map((f) => f.id));
          setTiles((p) => [...p, ...fresh]);
          await sleep(PACE.move);
          for (const st of path.slice(1)) {
            if (!alive.current) return;
            setTiles((p) => {
              let i = 0;
              return p.map((t) => (ids0.has(t.id) ? { ...t, ...at(st, i++) } : t));
            });
            await sleep(PACE.move);
          }
          if (!alive.current) return;
          const last = path[path.length - 1];
          const rest = best.y - last.y;
          if (rest > 0) {
            const dur = Math.max(260, Math.round(rest * PACE.fallPerRow));
            setTiles((p) => p.map((t) => (ids0.has(t.id) ? { ...t, dur, ease: "cubic-bezier(.45,.05,.7,.4)" } : t)));
            await settle();
            if (!alive.current) return;
            setTiles((p) => p.map((t) => (ids0.has(t.id) ? { ...t, row: t.row + rest } : t)));
            await sleep(dur);
          }
          // Where each brick ended up, for the grid below.
          fresh = fresh.map((f, i) => ({ ...f, col: best.x + best.cells[i][0], row: best.y + best.cells[i][1] }));
        } else {
          // Stack too tall to walk it in: spawn above its column and fall.
          const high = Math.max(...best.cells.map(([, y]) => y));
          const spawn = -(high + 2);
          const dist = best.y - spawn;
          const dur = Math.max(PACE.fallMin, Math.round(dist * PACE.fallPerRow));
          fresh = best.cells.map(([dx, dy], i) => ({
            id: id++, item: items[i], col: best.x + dx, row: spawn + dy,
            dur, ease: "cubic-bezier(.35,.03,.62,.5)", cls: "",
          }));
          const idsF = new Set(fresh.map((f) => f.id));
          setTiles((p) => [...p, ...fresh]);
          await settle();
          if (!alive.current) return;
          setTiles((p) => p.map((t) => (idsF.has(t.id) ? { ...t, row: t.row + dist } : t)));
          await sleep(dur);
          fresh = fresh.map((f) => ({ ...f, row: f.row + dist }));
        }
        if (!alive.current) return;
        const ids = new Set(fresh.map((f) => f.id));

        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "is-hit" } : t)));
        for (const f of fresh) grid[f.row][f.col] = f.id;
        await sleep(PACE.land);
        if (!alive.current) return;
        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "" } : t)));

        // Full rows cancel out, and say what they were on the way.
        const full: number[] = [];
        for (let r = 0; r < H; r++) if (grid[r].every((v) => v !== 0)) full.push(r);
        if (full.length) {
          const goneIds = new Set(full.flatMap((r) => grid[r].filter(Boolean)));
          const names = tilesRef.current.filter((t) => goneIds.has(t.id)).map((t) => t.item.name);
          setToast({ k: id, text: names.join(" · ") });
          setTiles((p) => p.map((t) => (goneIds.has(t.id) ? { ...t, cls: "is-clearing" } : t)));
          await sleep(PACE.clear);
          if (!alive.current) return;

          const kept = grid.filter((_, r) => !full.includes(r));
          while (kept.length < H) kept.unshift(Array(W).fill(0));
          grid = kept;
          cleared += full.length;
          setLines(cleared);

          // How far each surviving brick falls: one row per cleared row below it.
          const drop = new Map<number, number>();
          for (let r = 0; r < H; r++) {
            for (const v of grid[r]) if (v) drop.set(v, r);
          }
          setTiles((p) =>
            p
              .filter((t) => !goneIds.has(t.id))
              .map((t) => ({ ...t, dur: PACE.shift, ease: "cubic-bezier(.3,0,.2,1)" })),
          );
          await settle();
          if (!alive.current) return;
          setTiles((p) => p.map((t) => ({ ...t, row: drop.get(t.id) ?? t.row })));
          await sleep(PACE.shiftHold);
        }
        if (!alive.current) return;
        await sleep(PACE.next);
      }
    };

    run();
    return () => { alive.current = false; };
  }, []);

  return (
    <div className="sg-stage">
      {!bare && (
        <div className="sg-hud sg-hud-top">
          <span>The stack</span>
          <span>
            Rows cleared <b>{String(lines).padStart(2, "0")}</b>
          </span>
        </div>
      )}

      <div
        className="sg-well"
        style={{
          left: LEFT - 1,
          top: TOP - 1,
          width: W * CELL + 2,
          height: H * CELL + 2,
          backgroundSize: `${CELL}px ${CELL}px`,
        }}
      />

      <div style={{ position: "absolute", left: LEFT, top: TOP, width: W * CELL, height: H * CELL, overflow: "hidden" }}>
        {tiles.map((t) => (
          <Brick
            key={t.id}
            html={marks[t.item.slug]}
            hex={t.item.hex}
            fam={GROUP_HEX[t.item.group]}
            name={t.item.name}
            w={CELL - GAP}
            h={CELL - GAP}
            x={t.col * CELL + GAP / 2}
            y={t.row * CELL + GAP / 2}
            cls={t.cls}
            style={{ transition: `transform ${t.dur}ms ${t.ease}` }}
          />
        ))}
      </div>

      {!bare && toast && (
        <div key={toast.k} className="sg-toast" style={{ top: TOP + H * CELL + 8 }}>
          {toast.text}
        </div>
      )}

      {!bare && <Legend groups={GROUPS} />}
    </div>
  );
}
