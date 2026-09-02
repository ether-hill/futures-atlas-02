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
 * random pile. No lateral shuffling: the piece appears over its column and
 * falls, because a piece sliding sideways mid-air films as a mistake.
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
};

type Tile = { id: number; item: Item; col: number; row: number; dur: number; ease: string; cls: string };

export function Tetris({ marks, bare = false }: { marks: Marks; bare?: boolean }) {
  const { cell: CELL, top: TOP } = bare ? FIT.bare : FIT.full;
  const LEFT = (430 - W * CELL) / 2;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [lines, setLines] = useState(0);
  const [toast, setToast] = useState<{ k: number; text: string } | null>(null);
  const alive = useRef(true);
  // The loop reads the board it is also writing, so a ref carries the current
  // tiles across instead of the effect depending on its own output.
  const tilesRef = useRef<Tile[]>([]);
  tilesRef.current = tiles;

  useEffect(() => {
    alive.current = true;
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
    const seed = () => {
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
      await sleep(PACE.open);
      while (alive.current) {
        const rots = nextShape();
        let best = { s: -Infinity, cells: rots[0], x: 0, y: 0 };
        for (const cells of rots) {
          const wide = Math.max(...cells.map(([x]) => x));
          for (let x = 0; x + wide < W; x++) {
            const y = dropY(grid, cells, x);
            const s = score(grid, cells, x, y);
            if (s > best.s) best = { s, cells, x, y };
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

        // Spawn the piece directly above its column, already carrying the fall
        // duration, so the very next commit only has to change the transform.
        const high = Math.max(...best.cells.map(([, y]) => y));
        const spawn = -(high + 2);
        const dist = best.y - spawn;
        const dur = Math.max(PACE.fallMin, Math.round(dist * PACE.fallPerRow));
        const fresh: Tile[] = best.cells.map(([dx, dy]) => ({
          id: id++,
          item: nextItem(),
          col: best.x + dx,
          row: spawn + dy,
          dur,
          ease: "cubic-bezier(.35,.03,.62,.5)",
          cls: "",
        }));
        const ids = new Set(fresh.map((f) => f.id));
        setTiles((p) => [...p, ...fresh]);
        await settle();
        if (!alive.current) return;

        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, row: t.row + dist } : t)));
        await sleep(dur);
        if (!alive.current) return;

        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "is-hit" } : t)));
        for (const f of fresh) grid[f.row + dist][f.col] = f.id;
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
