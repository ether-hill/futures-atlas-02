"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brick, sleep } from "../../../mocks/stack-games/Brick";
import { GROUPS, GROUP_HEX, ITEMS, type Group, type Item, type Marks } from "../../../mocks/stack-games/stack";
import { GameShell, useBest, type Phase } from "../_kit/shell";

/**
 * CASCADE, played. Swap two neighbours; three or more of one family in a line
 * pop, the column above falls into the gap and new tools drop in. A swap that
 * makes nothing is refused and slides back. Twenty-five moves, then the score
 * stands.
 *
 * Chains are where the points are: every pop set off by falling bricks rather
 * than by your swap multiplies. If the board runs out of moves it reshuffles
 * itself rather than ending the game on a technicality.
 */

const W = 6;
const H = 8;
const CELL = 62;
const STEP = 66;
const LEFT = (430 - (W * STEP - (STEP - CELL))) / 2;
const TOP = 70;
const MOVES = 25;
const SWAP_MS = 170;
const CLEAR_MS = 320;

type Tile = { id: number; item: Item; group: Group; col: number; row: number; dur: number; cls: string };

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export function CascadeGame({ marks }: { marks: Marks }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [, setV] = useState(0);
  const redraw = () => setV((v) => v + 1);
  const [best, offerBest] = useBest("cascade");

  const tiles = useRef<Map<number, Tile>>(new Map());
  const grid = useRef<(number | null)[][]>([]);
  const ids = useRef(1);
  const busy = useRef(false);
  const picked = useRef<number | null>(null);
  const hint = useRef<number[]>([]);
  const stats = useRef({ score: 0, moves: MOVES, chain: 0 });
  const pops = useRef<{ k: number; x: number; y: number; text: string; hex: string }[]>([]);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  const idle = useRef(0);

  const tileAt = (c: number, r: number) => {
    const id = grid.current[r]?.[c];
    return id ? tiles.current.get(id) ?? null : null;
  };

  const newTile = (col: number, row: number, avoid?: Group[]): Tile => {
    const groups = GROUPS.map((g) => g.id).filter((g) => !avoid?.includes(g));
    const group = pick(groups.length ? groups : GROUPS.map((g) => g.id));
    const item = pick(ITEMS.filter((i) => i.group === group));
    const t: Tile = { id: ids.current++, item, group, col, row, dur: 0, cls: "" };
    tiles.current.set(t.id, t);
    return t;
  };

  /** every run of three or more of one family, as tile ids */
  const findMatches = (): Set<number> => {
    const out = new Set<number>();
    const g = (c: number, r: number) => tileAt(c, r)?.group;
    for (let r = 0; r < H; r++) {
      let run = 1;
      for (let c = 1; c <= W; c++) {
        if (c < W && g(c, r) && g(c, r) === g(c - 1, r)) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.add(grid.current[r][k]!);
          run = 1;
        }
      }
    }
    for (let c = 0; c < W; c++) {
      let run = 1;
      for (let r = 1; r <= H; r++) {
        if (r < H && g(c, r) && g(c, r) === g(c, r - 1)) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.add(grid.current[k][c]!);
          run = 1;
        }
      }
    }
    return out;
  };

  const swapCells = (a: Tile, b: Tile) => {
    grid.current[a.row][a.col] = b.id;
    grid.current[b.row][b.col] = a.id;
    [a.col, b.col] = [b.col, a.col];
    [a.row, b.row] = [b.row, a.row];
  };

  /** the first swap that would make a match, or null */
  const findMove = (): [Tile, Tile] | null => {
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++)
        for (const [dc, dr] of [[1, 0], [0, 1]]) {
          const a = tileAt(c, r), b = tileAt(c + dc, r + dr);
          if (!a || !b || a.group === b.group) continue;
          swapCells(a, b);
          const ok = findMatches().size > 0;
          swapCells(a, b);
          if (ok) return [a, b];
        }
    return null;
  };

  const fill = () => {
    tiles.current = new Map();
    grid.current = Array.from({ length: H }, () => Array(W).fill(null));
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++) {
        const avoid: Group[] = [];
        const l1 = tileAt(c - 1, r), l2 = tileAt(c - 2, r);
        if (l1 && l2 && l1.group === l2.group) avoid.push(l1.group);
        const u1 = tileAt(c, r - 1), u2 = tileAt(c, r - 2);
        if (u1 && u2 && u1.group === u2.group) avoid.push(u1.group);
        const t = newTile(c, r, avoid);
        grid.current[r][c] = t.id;
      }
    if (!findMove()) fill();
  };

  const pop = (x: number, y: number, text: string, hex: string) => {
    pops.current.push({ k: Date.now() + Math.random(), x, y, text, hex });
  };

  /** clear, fall, refill, repeat until the board is still */
  const resolve = async () => {
    let chain = 1;
    for (;;) {
      const hit = findMatches();
      if (!hit.size) break;
      const list = [...hit].map((id) => tiles.current.get(id)!);
      const gain = list.length * 10 * chain + (list.length >= 5 ? 50 : list.length === 4 ? 20 : 0);
      stats.current.score += gain;
      stats.current.chain = chain;
      const cx = list.reduce((a, t) => a + t.col, 0) / list.length;
      const cy = list.reduce((a, t) => a + t.row, 0) / list.length;
      pop(LEFT + cx * STEP + CELL / 2, TOP + cy * STEP + CELL / 2, chain > 1 ? `+${gain} chain ×${chain}` : `+${gain}`, GROUP_HEX[list[0].group]);
      list.forEach((t) => { t.cls = "is-clearing"; });
      redraw();
      await sleep(CLEAR_MS);

      list.forEach((t) => { grid.current[t.row][t.col] = null; tiles.current.delete(t.id); });

      // fall
      let longest = 0;
      const arrivals: Tile[] = [];
      for (let c = 0; c < W; c++) {
        let write = H - 1;
        for (let r = H - 1; r >= 0; r--) {
          const id = grid.current[r][c];
          if (id == null) continue;
          if (write !== r) {
            const t = tiles.current.get(id)!;
            grid.current[write][c] = id;
            grid.current[r][c] = null;
            t.dur = 110 + (write - r) * 55;
            longest = Math.max(longest, t.dur);
            t.row = write;
            t.cls = "";
          }
          write--;
        }
        // new tools in from above the board
        for (let r = write, k = 1; r >= 0; r--, k++) {
          const t = newTile(c, -k);
          t.dur = 0;
          grid.current[r][c] = t.id;
          arrivals.push(t);
          (t as Tile & { to: number }).to = r;
        }
      }
      redraw();
      await sleep(30);
      arrivals.forEach((t) => {
        const to = (t as Tile & { to: number }).to;
        t.dur = 140 + (to - t.row) * 55;
        longest = Math.max(longest, t.dur);
        t.row = to;
      });
      redraw();
      await sleep(longest + 40);
      tiles.current.forEach((t) => { t.dur = 0; });
      chain++;
    }
    stats.current.chain = 0;
  };

  const trySwap = useCallback(async (a: Tile, b: Tile) => {
    if (busy.current || phaseRef.current !== "playing") return;
    busy.current = true;
    hint.current = [];
    picked.current = null;
    idle.current = 0;
    a.dur = b.dur = SWAP_MS;
    swapCells(a, b);
    redraw();
    await sleep(SWAP_MS + 20);
    if (!findMatches().size) {
      swapCells(a, b);
      a.cls = b.cls = "";
      redraw();
      await sleep(SWAP_MS + 20);
      a.cls = b.cls = "is-nope";
      redraw();
      await sleep(320);
      a.cls = b.cls = "";
      a.dur = b.dur = 0;
      busy.current = false;
      redraw();
      return;
    }
    stats.current.moves--;
    await resolve();
    if (stats.current.moves <= 0) {
      setPhase("over");
      offerBest(stats.current.score);
    } else if (!findMove()) {
      // no moves left on the board: reshuffle in place
      const all = [...tiles.current.values()];
      do {
        all.forEach((t) => { t.group = pick(GROUPS).id; t.item = pick(ITEMS.filter((i) => i.group === t.group)); t.cls = "is-hit"; });
      } while (findMatches().size || !findMove());
      pop(215, TOP + (H * STEP) / 2, "Shuffled", "#f2ede2");
    }
    busy.current = false;
    redraw();
  }, []);

  // pointer: drag towards a neighbour, or tap one then tap a neighbour
  const down = useRef<{ id: number; x: number; y: number } | null>(null);
  const onDown = (t: Tile) => (e: React.PointerEvent) => {
    if (phaseRef.current !== "playing" || busy.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    down.current = { id: t.id, x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
    down.current = null;
    const a = tiles.current.get(d.id);
    if (!a) return;
    const [dc, dr] = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    const b = tileAt(a.col + dc, a.row + dr);
    if (b) trySwap(a, b);
  };
  const onUp = () => {
    const d = down.current;
    down.current = null;
    if (!d) return;
    const t = tiles.current.get(d.id);
    if (!t) return;
    const p = picked.current ? tiles.current.get(picked.current) : null;
    if (p && p.id !== t.id && Math.abs(p.col - t.col) + Math.abs(p.row - t.row) === 1) {
      trySwap(p, t);
    } else {
      picked.current = p?.id === t.id ? null : t.id;
      redraw();
    }
  };

  const start = useCallback(() => {
    stats.current = { score: 0, moves: MOVES, chain: 0 };
    pops.current = [];
    picked.current = null;
    hint.current = [];
    busy.current = false;
    fill();
    setPhase("playing");
    redraw();
  }, []);

  // a hint after a few quiet seconds, and tidy old score pops
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      pops.current = pops.current.filter((p) => now - p.k < 1000);
      if (phaseRef.current === "playing" && !busy.current) {
        idle.current += 500;
        if (idle.current >= 6000 && !hint.current.length) {
          const m = findMove();
          if (m) hint.current = [m[0].id, m[1].id];
        }
      }
      redraw();
    }, 500);
    return () => window.clearInterval(t);
  }, []);

  // first paint shows a board behind the start card
  useEffect(() => { fill(); redraw(); }, []);

  const s = stats.current;
  return (
    <GameShell
      id="cascade"
      phase={phase}
      score={s.score}
      best={best}
      extra={{ label: "Moves", value: s.moves }}
      overTitle="Out of moves"
      onStart={start}
      onPause={() => setPhase("paused")}
      onResume={() => setPhase("playing")}
    >
      <div className="sg-stage" style={{ ["--clear" as string]: `${CLEAR_MS}ms` }} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { down.current = null; }}>
        <div
          className="sg-well"
          style={{ left: LEFT - 3, top: TOP - 3, width: W * STEP + 2, height: H * STEP + 2, backgroundSize: `${STEP}px ${STEP}px` }}
        />
        <div style={{ position: "absolute", left: LEFT, top: TOP, width: W * STEP, height: H * STEP, overflow: "hidden" }}>
          {[...tiles.current.values()].map((t) => {
            const cls = [t.cls, picked.current === t.id ? "is-picked" : "", hint.current.includes(t.id) && !t.cls ? "is-hint" : ""].join(" ");
            return (
              <div key={t.id} onPointerDown={onDown(t)} style={{ touchAction: "none", cursor: "pointer" }}>
                <Brick
                  html={marks[t.item.slug]}
                  hex={t.item.hex}
                  fam={GROUP_HEX[t.group]}
                  name={t.item.name}
                  w={CELL}
                  h={CELL}
                  x={t.col * STEP}
                  y={t.row * STEP}
                  mark={24}
                  nameSize={6.5}
                  cls={cls}
                  style={{ transition: t.dur ? `transform ${t.dur}ms cubic-bezier(.34,.86,.44,1)` : "none" }}
                />
              </div>
            );
          })}
        </div>

        <span className="g2-label" style={{ left: LEFT, top: TOP + H * STEP + 20 }}>Moves left</span>
        <span className="g2-big" style={{ left: LEFT, top: TOP + H * STEP + 40, fontSize: 40 }}>{s.moves}</span>
        {s.chain > 1 && (
          <span className="g2-big" style={{ right: LEFT, top: TOP + H * STEP + 48, color: "#f2ede2" }}>Chain ×{s.chain}</span>
        )}
        <div className="sg-legend" style={{ bottom: 22, left: LEFT, fontSize: 8 }}>
          {GROUPS.map((g) => (
            <span key={g.id} style={{ color: g.hex }}>
              <i />
              <em style={{ fontStyle: "normal", color: "rgba(242,237,226,.5)" }}>{g.label}</em>
            </span>
          ))}
        </div>

        {pops.current.map((pp) => (
          <div key={pp.k} className="g2-pop" style={{ left: pp.x, top: pp.y, color: pp.hex }}>{pp.text}</div>
        ))}
      </div>
    </GameShell>
  );
}
