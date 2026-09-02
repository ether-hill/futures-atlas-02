"use client";

import { useEffect, useRef, useState } from "react";
import { Brick, Legend, bag, sleep } from "./Brick";
import { GROUPS, GROUP_HEX, ITEMS, type Group, type Item, type Marks } from "./stack";

/**
 * CASCADE — the tech stack as a match-three.
 *
 * A full board, always. Two neighbours swap, three of the same family cancel
 * out, the column above collapses into the hole and new tools drop in from
 * over the top edge. It runs on families rather than on the tools themselves,
 * because matching three Claudes would need a board of duplicates; matching
 * three language models is both easier to hit and the truer statement.
 *
 * It plays itself, and it plays greedily: of every swap that makes a match it
 * takes the biggest, which is what keeps cascades chaining instead of the
 * board grinding through single threes.
 *
 * PACE below holds every beat. It is deliberately slower than anyone would
 * play this: a cascade at playing speed is a flicker of colour, and the point
 * of the board is the names on it.
 */

const W = 5;
const H = 7;
const CELL = 74;
const GAP = 4;
const LEFT = (430 - W * CELL) / 2;
const TOP = 118;

type Tile = { id: number; item: Item; col: number; row: number; dur: number; ease: string; cls: string };
type Grid = (number | null)[][];

const FALL = "cubic-bezier(.34,.86,.44,1)";
const SWAP = "cubic-bezier(.4,0,.2,1)";

/** Every beat of the loop, in milliseconds. */
const PACE = {
  open: 900,        // a still board before the first move
  swap: 520,        // the two neighbours change places
  swapHold: 580,
  pop: 620,         // the match turns over to bone and leaves (matches --clear)
  fall: 560,        // the column collapses and the top-up drops in
  fallHold: 640,
  next: 800,        // and a beat before the next move
  reshuffle: 700,
};

/** Every cell that sits in a run of three or more of one family. */
function matches(grid: Grid, groupOf: (id: number) => Group) {
  const hit = new Set<number>();
  const scan = (line: (number | null)[]) => {
    let run: number[] = [];
    const flush = () => { if (run.length >= 3) run.forEach((v) => hit.add(v)); run = []; };
    for (const v of line) {
      if (v === null) { flush(); continue; }
      if (run.length && groupOf(run[0]) === groupOf(v)) run.push(v);
      else { flush(); run = [v]; }
    }
    flush();
  };
  for (let r = 0; r < H; r++) scan(grid[r]);
  for (let c = 0; c < W; c++) scan(grid.map((row) => row[c]));
  return hit;
}

export function Cascade({ marks }: { marks: Marks }) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [popped, setPopped] = useState(0);
  const [toast, setToast] = useState<{ k: number; text: string } | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let id = 1;
    const draw = bag(ITEMS);
    const item = new Map<number, Item>();
    const grid: Grid = Array.from({ length: H }, () => Array(W).fill(null));
    let total = 0;
    const groupOf = (v: number) => (item.get(v) as Item).group;
    const settle = () => sleep(34);

    const make = (): number => {
      const n = id++;
      item.set(n, draw());
      return n;
    };

    const paint = () => {
      const out: Tile[] = [];
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          const v = grid[r][c];
          if (v !== null) out.push({ id: v, item: item.get(v) as Item, col: c, row: r, dur: 0, ease: FALL, cls: "" });
        }
      }
      return out;
    };

    // A starting board with nothing already matched: a board that pops on
    // frame one reads as a glitch rather than as a move.
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        for (let tries = 0; tries < 40; tries++) {
          const v = make();
          grid[r][c] = v;
          if (!matches(grid, groupOf).size) break;
          grid[r][c] = null;
        }
        if (grid[r][c] === null) grid[r][c] = make();
      }
    }
    setTiles(paint());

    /** Pop, collapse, refill — and again, for as long as the board keeps giving. */
    const resolve = async () => {
      for (;;) {
        const hit = matches(grid, groupOf);
        if (!hit.size || !alive.current) return;

        total += hit.size;
        setPopped(total);
        setToast({ k: id, text: [...hit].map((v) => (item.get(v) as Item).name).join(" · ") });
        setTiles((p) => p.map((t) => (hit.has(t.id) ? { ...t, cls: "is-clearing" } : t)));
        await sleep(PACE.pop);
        if (!alive.current) return;

        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (hit.has(grid[r][c] as number)) grid[r][c] = null;

        // Collapse each column, then top it back up from above the frame.
        const spawned: Tile[] = [];
        for (let c = 0; c < W; c++) {
          const keep: number[] = [];
          for (let r = H - 1; r >= 0; r--) if (grid[r][c] !== null) keep.push(grid[r][c] as number);
          const gap = H - keep.length;
          for (let r = H - 1; r >= 0; r--) grid[r][c] = H - 1 - r < keep.length ? keep[H - 1 - r] : null;
          for (let k = 0; k < gap; k++) {
            const v = make();
            grid[gap - 1 - k][c] = v;
            spawned.push({ id: v, item: item.get(v) as Item, col: c, row: -1 - k, dur: 0, ease: FALL, cls: "" });
          }
        }

        // Survivors and newcomers both need their transition set one commit
        // before the transform that uses it, or the first drop jumps.
        setTiles((p) => [...p.filter((t) => !hit.has(t.id)), ...spawned]);
        await settle();
        if (!alive.current) return;
        setTiles((p) => p.map((t) => ({ ...t, dur: PACE.fall, ease: FALL })));
        await settle();
        if (!alive.current) return;

        const at = new Map<number, [number, number]>();
        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] !== null) at.set(grid[r][c] as number, [c, r]);
        setTiles((p) => p.map((t) => {
          const pos = at.get(t.id);
          return pos ? { ...t, col: pos[0], row: pos[1] } : t;
        }));
        await sleep(PACE.fallHold);
      }
    };

    const run = async () => {
      await sleep(PACE.open);
      while (alive.current) {
        // The greediest legal swap.
        let best: { a: [number, number]; b: [number, number]; n: number } | null = null;
        for (let r = 0; r < H; r++) {
          for (let c = 0; c < W; c++) {
            for (const [dr, dc] of [[0, 1], [1, 0]] as [number, number][]) {
              const r2 = r + dr;
              const c2 = c + dc;
              if (r2 >= H || c2 >= W) continue;
              [grid[r][c], grid[r2][c2]] = [grid[r2][c2], grid[r][c]];
              const n = matches(grid, groupOf).size;
              [grid[r][c], grid[r2][c2]] = [grid[r2][c2], grid[r][c]];
              if (n && (!best || n > best.n)) best = { a: [c, r], b: [c2, r2], n };
            }
          }
        }

        if (!best) {
          // Nothing legal left: shuffle the whole board in place rather than
          // stall on a dead position.
          const flat: number[] = grid.flat().filter((v): v is number => v !== null);
          for (let i = flat.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flat[i], flat[j]] = [flat[j], flat[i]];
          }
          let k = 0;
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) grid[r][c] = flat[k++];
          setTiles((p) => p.map((t) => ({ ...t, dur: PACE.reshuffle, ease: SWAP })));
          await settle();
          const at = new Map<number, [number, number]>();
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) at.set(grid[r][c] as number, [c, r]);
          setTiles((p) => p.map((t) => {
            const pos = at.get(t.id) as [number, number];
            return { ...t, col: pos[0], row: pos[1] };
          }));
          await sleep(PACE.reshuffle + 60);
          await resolve();
          continue;
        }

        const [ac, ar] = best.a;
        const [bc, br] = best.b;
        const av = grid[ar][ac] as number;
        const bv = grid[br][bc] as number;
        [grid[ar][ac], grid[br][bc]] = [bv, av];

        setTiles((p) => p.map((t) => (t.id === av || t.id === bv ? { ...t, dur: PACE.swap, ease: SWAP } : t)));
        await settle();
        if (!alive.current) return;
        setTiles((p) => p.map((t) => {
          if (t.id === av) return { ...t, col: bc, row: br };
          if (t.id === bv) return { ...t, col: ac, row: ar };
          return t;
        }));
        await sleep(PACE.swapHold);
        if (!alive.current) return;

        await resolve();
        await sleep(PACE.next);
      }
    };

    run();
    return () => { alive.current = false; };
  }, []);

  return (
    <div className="sg-stage">
      <div className="sg-hud sg-hud-top">
        <span>The stack</span>
        <span>
          Matched <b>{String(popped).padStart(2, "0")}</b>
        </span>
      </div>

      <div
        className="sg-well"
        style={{ left: LEFT - 1, top: TOP - 1, width: W * CELL + 2, height: H * CELL + 2, backgroundSize: `${CELL}px ${CELL}px` }}
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
            style={{ transition: t.dur ? `transform ${t.dur}ms ${t.ease}` : "none" }}
          />
        ))}
      </div>

      {toast && (
        <div key={toast.k} className="sg-toast" style={{ top: TOP + H * CELL + 14 }}>
          {toast.text}
        </div>
      )}

      <Legend groups={GROUPS} />
    </div>
  );
}
