"use client";

import { useEffect, useRef, useState } from "react";
import { Brick, bag, sleep } from "@/app/mocks/stack-games/Brick";
import { GROUP_HEX, ITEMS, type Item, type Marks } from "@/app/mocks/stack-games/stack";
import LAPS from "@/data/stack-laps.json";
import "./stack-banner.css";

/**
 * The homepage stack banner: the tools the studio builds with, as a game of
 * falling blocks that plays itself across the full width of the band.
 *
 * The 5-wide reel well (mocks/stack-games/Tetris.tsx) turned on its side. Every
 * piece is PLAYED into place: it enters at the top over the middle of the well,
 * turns, and steps left or right a column at a time while it falls, then drops
 * once it is lined up. Rows that fill go bone and cancel out.
 *
 * It loops without a seam. The moves come from src/data/stack-laps.json, solved
 * offline by scripts/gen-stack-laps.mjs: a lap opens on a ragged skyline, every
 * piece sits flush, and after the last one the board is back on exactly the
 * skyline it opened with, so the next lap carries straight on. Brands are dealt
 * as the pieces come, so the choreography repeats but the names on it do not.
 *
 * The well's width follows the band: 16 columns on a desktop, 12 on a tablet,
 * 8 on a phone, each with its own solved lap.
 */

type Cells = [number, number][];
type Lap = { W: number; H: number; start: number[]; moves: { shape: number; ri: number; x: number }[] };

const BASE: Cells[] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
];

// Must match the rotation order in scripts/gen-stack-laps.mjs, which the
// solved laps index into.
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

const GAP = 4;

const PACE = {
  open: 700,
  fallPerRow: 80,
  land: 380,
  clear: 560,
  shift: 380,
  shiftHold: 420,
  next: 260,
  move: 125,          // one player input: a turn, or a step of one column
  moveEase: "cubic-bezier(.2,.7,.3,1)",
  gravity: 0.4,       // chance each input also lets the piece fall a row
};

type Grid = number[][];
type Step = { cells: Cells; x: number; y: number };
type Tile = { id: number; item: Item; col: number; row: number; dur: number; ease: string; cls: string };

function fits(g: Grid, cells: Cells, x: number, y: number) {
  const W = g[0].length;
  const H = g.length;
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

/**
 * The inputs a player would make: turn to the target rotation, then step
 * toward the target column, falling a row now and then on the way. The piece
 * enters with its bottom on the top row, so a tall one slides in from above.
 */
function plan(g: Grid, rots: Cells[], ti: number, tx: number, ty: number): Step[] | null {
  const W = g[0].length;
  const tall = (c: Cells) => Math.max(...c.map(([, y]) => y));
  const wide0 = Math.max(...rots[0].map(([x]) => x));
  let x = Math.floor((W - 1 - wide0) / 2);
  let y = Math.min(0, 1 - tall(rots[0]));
  let ri = 0;
  if (!fits(g, rots[ri], x, y)) return null;
  const out: Step[] = [{ cells: rots[ri], x, y }];
  const fall = () => {
    if (y + 1 < ty && Math.random() < PACE.gravity && fits(g, rots[ri], x, y + 1)) y++;
  };
  while (ri !== ti || x !== tx) {
    if (ri !== ti) {
      const nr = (ri + 1) % rots.length;
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
  return y <= ty ? out : null;
}

const lapFor = (width: number): Lap => {
  const laps = LAPS as unknown as Record<string, Lap>;
  return width >= 1000 ? laps["16"] : width >= 600 ? laps["12"] : laps["8"];
};

export function StackBanner({ marks }: { marks: Marks }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const tilesRef = useRef<Tile[]>([]);
  tilesRef.current = tiles;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lap = width ? lapFor(width) : null;
  const W = lap?.W ?? 16;
  const H = lap?.H ?? 5;
  const CELL = width ? width / W : 0;

  useEffect(() => {
    if (!lap) return;
    let alive = true;
    let id = 1;
    const nextItem = bag(ITEMS);
    const grid: Grid = Array.from({ length: lap.H }, () => Array(lap.W).fill(0));

    // Only play while the band is on screen and the tab is in front. Every
    // beat waits on this, so pausing can never put the board out of step.
    let onScreen = false;
    let wake: (() => void) | null = null;
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen && wake) { wake(); wake = null; }
    });
    if (box.current) io.observe(box.current);
    const onVis = () => { if (!document.hidden && onScreen && wake) { wake(); wake = null; } };
    document.addEventListener("visibilitychange", onVis);
    const ready = () =>
      onScreen && !document.hidden ? Promise.resolve() : new Promise<void>((r) => { wake = r; });
    const beat = async (ms: number) => { await sleep(ms); await ready(); return alive; };
    const settle = () => beat(34);

    // The opening skyline, dealt fresh brands.
    const seed: Tile[] = [];
    for (let c = 0; c < lap.W; c++) {
      for (let r = lap.H - lap.start[c]; r < lap.H; r++) {
        const t: Tile = { id: id++, item: nextItem(), col: c, row: r, dur: 0, ease: "linear", cls: "" };
        grid[r][c] = t.id;
        seed.push(t);
      }
    }
    setTiles(seed);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return () => { alive = false; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };

    const run = async () => {
      if (!(await beat(PACE.open))) return;
      for (let turn = 0; alive; turn++) {
        const move = lap.moves[turn % lap.moves.length];
        const rots = SHAPES[move.shape];
        const cells = rots[move.ri];
        const ty = dropY(grid, cells, move.x);
        const items = cells.map(() => nextItem());
        const path = plan(grid, rots, move.ri, move.x, ty) ?? [
          { cells, x: move.x, y: Math.min(0, 1 - Math.max(...cells.map(([, y]) => y))) },
        ];

        // Each cell keeps its brand as the piece turns, so a turn reads as the
        // same four bricks swinging round rather than a new piece.
        const at = (st: Step, i: number) => ({ col: st.x + st.cells[i][0], row: st.y + st.cells[i][1] });
        let fresh: Tile[] = items.map((item, i) => ({
          id: id++, item, ...at(path[0], i), dur: PACE.move, ease: PACE.moveEase, cls: "",
        }));
        const ids = new Set(fresh.map((f) => f.id));
        setTiles((p) => [...p, ...fresh]);
        if (!(await beat(PACE.move))) return;
        for (const st of path.slice(1)) {
          setTiles((p) => {
            let i = 0;
            return p.map((t) => (ids.has(t.id) ? { ...t, ...at(st, i++) } : t));
          });
          if (!(await beat(PACE.move))) return;
        }
        const last = path[path.length - 1];
        const rest = ty - last.y;
        if (rest > 0) {
          const dur = Math.max(220, Math.round(rest * PACE.fallPerRow));
          setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, dur, ease: "cubic-bezier(.45,.05,.7,.4)" } : t)));
          if (!(await settle())) return;
          setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, row: t.row + rest } : t)));
          if (!(await beat(dur))) return;
        }
        fresh = fresh.map((f, i) => ({ ...f, col: move.x + cells[i][0], row: ty + cells[i][1] }));

        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "is-hit" } : t)));
        for (const f of fresh) grid[f.row][f.col] = f.id;
        if (!(await beat(PACE.land))) return;
        setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "" } : t)));

        const full: number[] = [];
        for (let r = 0; r < lap.H; r++) if (grid[r].every((v) => v !== 0)) full.push(r);
        if (full.length) {
          const gone = new Set(full.flatMap((r) => grid[r]));
          setTiles((p) => p.map((t) => (gone.has(t.id) ? { ...t, cls: "is-clearing" } : t)));
          if (!(await beat(PACE.clear))) return;

          const kept = grid.filter((_, r) => !full.includes(r));
          while (kept.length < lap.H) kept.unshift(Array(lap.W).fill(0));
          grid.splice(0, grid.length, ...kept);
          const drop = new Map<number, number>();
          for (let r = 0; r < lap.H; r++) for (const v of grid[r]) if (v) drop.set(v, r);

          setTiles((p) =>
            p.filter((t) => !gone.has(t.id)).map((t) => ({ ...t, dur: PACE.shift, ease: "cubic-bezier(.3,0,.2,1)" })),
          );
          if (!(await settle())) return;
          setTiles((p) => p.map((t) => ({ ...t, row: drop.get(t.id) ?? t.row })));
          if (!(await beat(PACE.shiftHold))) return;
        }
        if (!(await beat(PACE.next))) return;
      }
    };
    run();

    return () => {
      alive = false;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // A new lap (the band crossed a breakpoint) restarts the game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap?.W]);

  const named = CELL >= 64;
  return (
    <div
      ref={box}
      className="sb-well"
      aria-hidden="true"
      style={{ height: CELL ? H * CELL : undefined, backgroundSize: CELL ? `${CELL}px ${CELL}px` : undefined }}
    >
      {CELL > 0 &&
        tiles.map((t) => (
          <Brick
            key={t.id}
            html={marks[t.item.slug]}
            hex={t.item.hex}
            fam={GROUP_HEX[t.item.group]}
            name={named ? t.item.name : undefined}
            w={CELL - GAP}
            h={CELL - GAP}
            x={t.col * CELL + GAP / 2}
            y={t.row * CELL + GAP / 2}
            mark={Math.round(CELL * (named ? 0.34 : 0.46))}
            nameSize={Math.max(8, Math.round(CELL * 0.1))}
            cls={t.cls}
            style={{ transition: `transform ${t.dur}ms ${t.ease}` }}
          />
        ))}
    </div>
  );
}
