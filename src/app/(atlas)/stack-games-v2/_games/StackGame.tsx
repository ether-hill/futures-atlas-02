"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brick, bag } from "../../../mocks/stack-games/Brick";
import { BY_GROUP, GROUPS, GROUP_HEX, type Group, type Item, type Marks } from "../../../mocks/stack-games/stack";
import { GameShell, useBest, type Phase } from "../_kit/shell";

/**
 * STACK, played. The reel's five-wide well was a picture of a game; a person
 * needs room to steer, so this one is seven wide and thirteen deep, with a
 * ghost showing where the piece will land, a next-piece window, and pads under
 * the well for thumbs.
 *
 * Each piece is one family (so its four bricks share an edge colour) and each
 * of its bricks is a tool from that family. A full row clears; a full row of a
 * single family scores triple, which is the one place the family rule bites.
 *
 * The board lives in refs and a version counter re-renders it, so the gravity
 * loop never fights React for the truth.
 */

const W = 7;
const H = 13;
const CELL = 46;
const STEP = 48;
const LEFT = 16;
const TOP = 16;
const SIDE_X = LEFT + W * STEP + 8;
const CLEAR_MS = 360;

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
  return c.map(([x, y]) => [x - mx, y - my]);
};
/** four rotations each, clockwise, normalised to the top-left */
const ROT: Cells[][] = BASE.map((c) => {
  const out: Cells[] = [];
  let cur = c;
  for (let i = 0; i < 4; i++) {
    out.push(norm(cur));
    const maxY = Math.max(...cur.map(([, y]) => y));
    cur = cur.map(([x, y]) => [maxY - y, x]);
  }
  return out;
});

type Block = { id: number; item: Item; group: Group };
type Piece = { shape: number; rot: number; x: number; y: number; group: Group; blocks: Block[] };

const LINE_SCORE = [0, 100, 300, 500, 800];
const dropMs = (level: number) => Math.max(90, 820 - (level - 1) * 75);

export function StackGame({ marks }: { marks: Marks }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [, setV] = useState(0);
  const redraw = () => setV((v) => v + 1);
  const [best, offerBest] = useBest("stack");

  const grid = useRef<(Block | null)[][]>([]);
  const piece = useRef<Piece | null>(null);
  const next = useRef<Piece | null>(null);
  const clearing = useRef<Set<number>>(new Set());
  const stats = useRef({ score: 0, lines: 0, level: 1 });
  const toast = useRef<{ k: number; text: string } | null>(null);
  const pops = useRef<{ k: number; x: number; y: number; text: string; hex: string }[]>([]);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  const ids = useRef(1);
  const acc = useRef(0);

  const bags = useRef<Record<Group, () => Item> | null>(null);
  const shapeBag = useRef<(() => number) | null>(null);
  const groupBag = useRef<(() => Group) | null>(null);

  const makePiece = (): Piece => {
    if (!bags.current) {
      bags.current = { language: bag(BY_GROUP.language), media: bag(BY_GROUP.media), open: bag(BY_GROUP.open), web: bag(BY_GROUP.web) };
      shapeBag.current = bag([0, 1, 2, 3, 4, 5, 6]);
      groupBag.current = bag(GROUPS.map((g) => g.id));
    }
    const shape = shapeBag.current!();
    const group = groupBag.current!();
    const cells = ROT[shape][0];
    const wdt = Math.max(...cells.map(([x]) => x)) + 1;
    return {
      shape, rot: 0, group,
      x: Math.floor((W - wdt) / 2), y: 0,
      blocks: cells.map(() => ({ id: ids.current++, item: bags.current![group](), group })),
    };
  };

  const cellsOf = (p: Piece, rot = p.rot, x = p.x, y = p.y) => ROT[p.shape][rot].map(([cx, cy]) => [x + cx, y + cy] as [number, number]);
  const fits = (p: Piece, rot = p.rot, x = p.x, y = p.y) =>
    cellsOf(p, rot, x, y).every(([cx, cy]) => cx >= 0 && cx < W && cy < H && (cy < 0 || !grid.current[cy][cx]));

  const ghostY = (p: Piece) => {
    let y = p.y;
    while (fits(p, p.rot, p.x, y + 1)) y++;
    return y;
  };

  const spawn = () => {
    const p = next.current ?? makePiece();
    next.current = makePiece();
    piece.current = p;
    acc.current = 0;
    if (!fits(p)) {
      piece.current = null;
      setPhase("over");
      offerBest(stats.current.score);
    }
  };

  const lock = () => {
    const p = piece.current;
    if (!p) return;
    cellsOf(p).forEach(([cx, cy], i) => {
      if (cy >= 0) grid.current[cy][cx] = p.blocks[i];
    });
    piece.current = null;
    const full: number[] = [];
    for (let r = 0; r < H; r++) if (grid.current[r].every(Boolean)) full.push(r);
    if (!full.length) { spawn(); redraw(); return; }

    // score it now, animate, then collapse
    const s = stats.current;
    let gain = LINE_SCORE[full.length] * s.level;
    const pure = full.filter((r) => new Set(grid.current[r].map((b) => b!.group)).size === 1);
    if (pure.length) gain += pure.length * LINE_SCORE[1] * 2 * s.level;
    s.score += gain;
    s.lines += full.length;
    s.level = 1 + Math.floor(s.lines / 10);

    const names = full.flatMap((r) => grid.current[r].map((b) => b!.item.name));
    toast.current = { k: Date.now(), text: [...new Set(names)].slice(0, 6).join(" · ") };
    const midR = full[Math.floor(full.length / 2)];
    pops.current.push({
      k: Date.now(),
      x: LEFT + (W * STEP) / 2,
      y: TOP + midR * STEP + CELL / 2,
      text: pure.length ? `+${gain} one family` : `+${gain}`,
      hex: pure.length ? GROUP_HEX[grid.current[pure[0]][0]!.group] : "#f2ede2",
    });
    clearing.current = new Set(full.flatMap((r) => grid.current[r].map((b) => b!.id)));
    redraw();

    window.setTimeout(() => {
      grid.current = grid.current.filter((_, r) => !full.includes(r));
      while (grid.current.length < H) grid.current.unshift(Array(W).fill(null));
      clearing.current = new Set();
      if (phaseRef.current !== "over") spawn();
      redraw();
    }, CLEAR_MS);
  };

  const move = useCallback((dx: number) => {
    const p = piece.current;
    if (!p || phaseRef.current !== "playing") return;
    if (fits(p, p.rot, p.x + dx)) { p.x += dx; redraw(); }
  }, []);

  const rotate = useCallback((dir = 1) => {
    const p = piece.current;
    if (!p || phaseRef.current !== "playing") return;
    const rot = (p.rot + dir + 4) % 4;
    for (const kick of [0, -1, 1, -2, 2]) {
      if (fits(p, rot, p.x + kick)) { p.rot = rot; p.x += kick; redraw(); return; }
    }
  }, []);

  const soft = useCallback(() => {
    const p = piece.current;
    if (!p || phaseRef.current !== "playing") return;
    if (fits(p, p.rot, p.x, p.y + 1)) { p.y++; stats.current.score += 1; acc.current = 0; redraw(); }
    else lock();
  }, []);

  const hard = useCallback(() => {
    const p = piece.current;
    if (!p || phaseRef.current !== "playing") return;
    const y = ghostY(p);
    stats.current.score += 2 * (y - p.y);
    p.y = y;
    lock();
  }, []);

  const start = useCallback(() => {
    grid.current = Array.from({ length: H }, () => Array(W).fill(null));
    clearing.current = new Set();
    stats.current = { score: 0, lines: 0, level: 1 };
    toast.current = null;
    pops.current = [];
    next.current = null;
    spawn();
    setPhase("playing");
    redraw();
  }, []);

  // gravity
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      if (!piece.current) return;
      acc.current += dt;
      if (acc.current >= dropMs(stats.current.level)) {
        acc.current = 0;
        const p = piece.current;
        if (fits(p, p.rot, p.x, p.y + 1)) { p.y++; redraw(); }
        else lock();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // keys
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") move(-1);
      else if (k === "ArrowRight" || k === "d" || k === "D") move(1);
      else if (k === "ArrowUp" || k === "x" || k === "X" || k === "w" || k === "W") rotate(1);
      else if (k === "z" || k === "Z") rotate(-1);
      else if (k === "ArrowDown" || k === "s" || k === "S") soft();
      else if (k === " ") hard();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, move, rotate, soft, hard]);

  // tidy finished score pops
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      const before = pops.current.length;
      pops.current = pops.current.filter((p) => now - p.k < 1000);
      if (pops.current.length !== before) redraw();
    }, 500);
    return () => window.clearInterval(t);
  }, []);

  const p = piece.current;
  const s = stats.current;
  const gy = p ? ghostY(p) : 0;
  const at = (c: number, r: number) => ({ x: LEFT + c * STEP, y: TOP + r * STEP });

  return (
    <GameShell
      id="stack"
      phase={phase}
      score={s.score}
      best={best}
      extra={{ label: "Lines", value: s.lines }}
      overLine={`${s.lines} rows cleared.`}
      onStart={start}
      onPause={() => setPhase("paused")}
      onResume={() => setPhase("playing")}
    >
      <div className="sg-stage" style={{ ["--clear" as string]: `${CLEAR_MS}ms`, ["--hit" as string]: "220ms" }}>
        <div
          className="sg-well"
          onPointerDown={() => rotate(1)}
          style={{ left: LEFT - 2, top: TOP - 2, width: W * STEP + 2, height: H * STEP + 2, backgroundSize: `${STEP}px ${STEP}px`, backgroundPosition: "1px 1px" }}
        />

        {/* where the piece will land */}
        {p && phase === "playing" && gy !== p.y &&
          cellsOf(p, p.rot, p.x, gy).map(([cx, cy], i) => {
            const { x, y } = at(cx, cy);
            return <div key={`g${i}`} className="g2-ghostcell" style={{ left: x, top: y, width: CELL, height: CELL, borderColor: `${GROUP_HEX[p.group]}66` }} />;
          })}

        {/* the settled bricks */}
        {grid.current.flatMap((row, r) =>
          row.map((b, c) => {
            if (!b) return null;
            const { x, y } = at(c, r);
            return (
              <Brick
                key={b.id}
                html={marks[b.item.slug]}
                hex={b.item.hex}
                fam={GROUP_HEX[b.group]}
                name={b.item.name}
                w={CELL}
                h={CELL}
                x={x}
                y={y}
                mark={20}
                nameSize={6}
                cls={clearing.current.has(b.id) ? "is-clearing" : ""}
                style={{ transition: "transform 160ms cubic-bezier(.3,0,.2,1)", gap: 3 }}
              />
            );
          }),
        )}

        {/* the falling piece */}
        {p &&
          cellsOf(p).map(([cx, cy], i) => {
            const b = p.blocks[i];
            const { x, y } = at(cx, cy);
            return (
              <Brick
                key={b.id}
                html={marks[b.item.slug]}
                hex={b.item.hex}
                fam={GROUP_HEX[b.group]}
                name={b.item.name}
                w={CELL}
                h={CELL}
                x={x}
                y={y}
                mark={20}
                nameSize={6}
                style={{ transition: "transform 70ms linear", gap: 3, zIndex: 2 }}
              />
            );
          })}

        {/* side column: next, lines, level */}
        <span className="g2-label" style={{ left: SIDE_X, top: TOP }}>Next</span>
        {next.current && (
          <div style={{ position: "absolute", left: SIDE_X, top: TOP + 24 }}>
            {ROT[next.current.shape][0].map(([cx, cy], i) => (
              <i
                key={i}
                style={{
                  position: "absolute",
                  left: cx * 13,
                  top: cy * 13,
                  width: 11,
                  height: 11,
                  background: GROUP_HEX[next.current!.group],
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        )}
        <span className="g2-label" style={{ left: SIDE_X, top: TOP + 100 }}>Level</span>
        <span className="g2-big" style={{ left: SIDE_X, top: TOP + 118 }}>{s.level}</span>
        <span className="g2-label" style={{ left: SIDE_X, top: TOP + 168 }}>Lines</span>
        <span className="g2-big" style={{ left: SIDE_X, top: TOP + 186 }}>{s.lines}</span>

        {toast.current && (
          <div key={toast.current.k} className="sg-toast" style={{ top: TOP + H * STEP - 40, textTransform: "none", letterSpacing: "0.02em", fontSize: 12 }}>
            {toast.current.text}
          </div>
        )}
        {pops.current.map((pp) => (
          <div key={pp.k} className="g2-pop" style={{ left: pp.x, top: pp.y, color: pp.hex }}>
            {pp.text}
          </div>
        ))}

        <Pads onLeft={() => move(-1)} onRight={() => move(1)} onTurn={() => rotate(1)} onSoft={soft} onDrop={hard} top={TOP + H * STEP + 14} />
      </div>
    </GameShell>
  );
}

/** Thumb pads. Left, right and down repeat while held, like a key does. */
function Pads({
  onLeft, onRight, onTurn, onSoft, onDrop, top,
}: { onLeft: () => void; onRight: () => void; onTurn: () => void; onSoft: () => void; onDrop: () => void; top: number }) {
  const timer = useRef<number | null>(null);
  const stop = () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
  };
  const hold = (fn: () => void, every: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    stop();
    fn();
    const again = () => { fn(); timer.current = window.setTimeout(again, every); };
    timer.current = window.setTimeout(again, 180);
  };
  useEffect(() => stop, []);
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /></svg>
  );
  return (
    <div className="g2-pads" style={{ top }} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}>
      <button type="button" className="g2-pad" aria-label="Move left" onPointerDown={hold(onLeft, 70)}>{icon("M15 5l-7 7 7 7")}<span>Left</span></button>
      <button type="button" className="g2-pad" aria-label="Turn" onPointerDown={(e) => { e.preventDefault(); onTurn(); }}>{icon("M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4")}<span>Turn</span></button>
      <button type="button" className="g2-pad" aria-label="Move right" onPointerDown={hold(onRight, 70)}>{icon("M9 5l7 7-7 7")}<span>Right</span></button>
      <button type="button" className="g2-pad" aria-label="Drop faster" onPointerDown={hold(onSoft, 50)}>{icon("M5 9l7 7 7-7")}<span>Down</span></button>
      <button type="button" className="g2-pad" aria-label="Drop now" onPointerDown={(e) => { e.preventDefault(); onDrop(); }}>{icon("M5 6l7 7 7-7M5 18h14")}<span>Drop</span></button>
    </div>
  );
}
