"use client";

import { useEffect, useRef, useState } from "react";
import { sleep, shuffled } from "./Brick";
import { BY_GROUP, GROUPS, GROUP_HEX, type Group, type Item, type Marks } from "./stack";

/**
 * MERGE — the tech stack as a sliding-tile game.
 *
 * The board tilts, everything slides, and two bricks of the same family fuse
 * into one that carries both marks. Fuse four deep and the family banks out in
 * a flash and leaves the board, which is the reading: the tools are not the
 * point, the four things the studio can do with them are.
 *
 * It plays itself by taking whichever of the four directions merges most this
 * move. That is a shallow way to play 2048 and a good way to film it — the
 * board is never still and never wipes out.
 *
 * PACE below holds every beat, and it is deliberately slower than the game
 * would be played: a slide, a fuse and a bank are three separate events and
 * they were reading as one twitch.
 */

const N = 4;
const CELL = 96;
const GAP = 6;
const SPAN = N * CELL + (N - 1) * GAP;
const LEFT = (430 - SPAN) / 2;
const TOP = 178;

type Tile = {
  id: number;
  group: Group;
  level: number;      // 1 = a single tool, 3 = the whole family, which banks out
  items: Item[];      // the marks it has absorbed, newest last
  r: number;
  c: number;
  dur: number;
  cls: string;
};

const at = (i: number) => i * (CELL + GAP);

/** Every beat of the loop, in milliseconds. */
const PACE = {
  open: 900,      // the opening board, still
  slide: 300,     // everything moves at once
  slideHold: 380,
  fuse: 460,      // the pair that met turns into one brick with both marks
  bank: 620,      // a complete family goes off the board (matches --clear)
  sweep: 520,     // a gridlocked board is swept
  next: 700,      // and a beat before the next tilt
};

export function Merge({ marks }: { marks: Marks }) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [banked, setBanked] = useState<Record<Group, number>>({ language: 0, media: 0, open: 0, web: 0 });
  const [toast, setToast] = useState<{ k: number; text: string } | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let id = 1;
    let board: (Tile | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
    const bankTally: Record<Group, number> = { language: 0, media: 0, open: 0, web: 0 };
    const settle = () => sleep(34);
    const flat = () => board.flat().filter((t): t is Tile => t !== null);
    const push = () => setTiles(flat().map((t) => ({ ...t })));

    const spawn = (n = 1) => {
      const holes = shuffled(
        board.flatMap((row, r) => row.map((t, c) => (t ? null : [r, c])).filter(Boolean) as [number, number][]),
      ).slice(0, n);
      for (const [r, c] of holes) {
        const g = GROUPS[Math.floor(Math.random() * GROUPS.length)].id;
        const pool = BY_GROUP[g];
        board[r][c] = {
          id: id++,
          group: g,
          level: 1,
          items: [pool[Math.floor(Math.random() * pool.length)]],
          r, c, dur: 0, cls: "is-hit",
        };
      }
      return holes.length;
    };

    /**
     * One slide, as a plan rather than a mutation: which tile ends where, and
     * which pairs fuse. Returned so the caller can try all four directions and
     * take the best before anything animates.
     */
    const plan = (dr: number, dc: number) => {
      const moves: { t: Tile; r: number; c: number }[] = [];
      const fuses: { keep: Tile; gone: Tile }[] = [];
      const next: (Tile | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
      const order = (i: number) => (dr > 0 || dc > 0 ? N - 1 - i : i);

      for (let line = 0; line < N; line++) {
        const seq: Tile[] = [];
        for (let i = 0; i < N; i++) {
          const k = order(i);
          const t = dc !== 0 ? board[line][k] : board[k][line];
          if (t) seq.push(t);
        }
        const out: Tile[] = [];
        for (let i = 0; i < seq.length; i++) {
          const prev = out[out.length - 1];
          const cur = seq[i];
          if (prev && !fuses.some((f) => f.keep === prev) && prev.group === cur.group && prev.level === cur.level && prev.level < 3) {
            fuses.push({ keep: prev, gone: cur });
          } else {
            out.push(cur);
          }
        }
        out.forEach((t, i) => {
          const k = order(i);
          const r = dc !== 0 ? line : k;
          const c = dc !== 0 ? k : line;
          next[r][c] = t;
          moves.push({ t, r, c });
        });
        // A fused tile rides to wherever the tile it merged into ended up.
        for (const f of fuses) {
          const m = moves.find((x) => x.t === f.keep);
          if (m && !moves.some((x) => x.t === f.gone)) moves.push({ t: f.gone, r: m.r, c: m.c });
        }
      }
      const moved = moves.some((m) => m.t.r !== m.r || m.t.c !== m.c);
      return { moves, fuses, next, moved };
    };

    const run = async () => {
      spawn(3);
      push();
      await sleep(PACE.open);

      while (alive.current) {
        const dirs: [number, number][] = shuffled([[0, -1], [0, 1], [-1, 0], [1, 0]]);
        let best: ReturnType<typeof plan> | null = null;
        for (const [dr, dc] of dirs) {
          const p = plan(dr, dc);
          if (!p.moved && !p.fuses.length) continue;
          if (!best || p.fuses.length > best.fuses.length) best = p;
        }

        if (!best) {
          // Gridlocked. Sweep the board and start over rather than freeze.
          setTiles((p) => p.map((t) => ({ ...t, cls: "is-clearing" })));
          await sleep(PACE.bank);
          if (!alive.current) return;
          board = Array.from({ length: N }, () => Array(N).fill(null));
          setTiles([]);
          await sleep(PACE.sweep);
          spawn(3);
          push();
          await sleep(PACE.open);
          continue;
        }

        // Slide.
        setTiles((p) => p.map((t) => ({ ...t, dur: PACE.slide, cls: "" })));
        await settle();
        if (!alive.current) return;
        const dest = new Map(best.moves.map((m) => [m.t.id, [m.r, m.c] as [number, number]]));
        setTiles((p) => p.map((t) => {
          const d = dest.get(t.id);
          return d ? { ...t, r: d[0], c: d[1] } : t;
        }));
        await sleep(PACE.slideHold);
        if (!alive.current) return;

        // Fuse: the absorbed tile is already underneath the survivor, so
        // dropping it is invisible and the survivor simply gains a mark.
        for (const f of best.fuses) {
          f.keep.level += 1;
          f.keep.items = [...f.keep.items, ...f.gone.items].slice(-4);
        }
        board = best.next;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board[r][c]) { board[r][c]!.r = r; board[r][c]!.c = c; }
        const fused = new Set(best.fuses.map((f) => f.keep.id));
        setTiles(flat().map((t) => ({ ...t, cls: fused.has(t.id) ? "is-hit" : "" })));
        await sleep(PACE.fuse);
        if (!alive.current) return;

        // A full family banks out.
        const full = flat().filter((t) => t.level >= 3);
        if (full.length) {
          for (const t of full) bankTally[t.group] += 1;
          setBanked({ ...bankTally });
          setToast({ k: id++, text: full.map((t) => `${GROUPS.find((g) => g.id === t.group)!.label} complete`).join(" · ") });
          const ids = new Set(full.map((t) => t.id));
          setTiles((p) => p.map((t) => (ids.has(t.id) ? { ...t, cls: "is-clearing" } : t)));
          await sleep(PACE.bank);
          if (!alive.current) return;
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board[r][c] && ids.has(board[r][c]!.id)) board[r][c] = null;
          push();
          await sleep(180);
        }

        if (spawn(Math.random() < 0.25 ? 2 : 1)) push();
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
          Families banked <b>{String(Object.values(banked).reduce((a, b) => a + b, 0)).padStart(2, "0")}</b>
        </span>
      </div>

      <div
        className="sg-well"
        style={{ left: LEFT - 1, top: TOP - 1, width: SPAN + 2, height: SPAN + 2, backgroundSize: `${CELL + GAP}px ${CELL + GAP}px` }}
      />

      <div style={{ position: "absolute", left: LEFT, top: TOP, width: SPAN, height: SPAN }}>
        {tiles.map((t) => {
          const fam = GROUP_HEX[t.group];
          const label = GROUPS.find((g) => g.id === t.group)!.label;
          const tr = `translate3d(${at(t.c)}px, ${at(t.r)}px, 0)`;
          return (
            <div
              key={t.id}
              className={`sg-brick ${t.cls}`}
              style={
                {
                  width: CELL,
                  height: CELL,
                  transform: tr,
                  "--t": tr,
                  "--fam": fam,
                  transition: t.dur ? `transform ${t.dur}ms cubic-bezier(.3,0,.2,1)` : "none",
                  background: `linear-gradient(150deg, ${fam}${["", "1c", "2e", "46", "5e"][t.level]}, rgba(242,237,226,.02))`,
                  borderColor: t.level > 1 ? `${fam}66` : "rgba(242,237,226,.16)",
                  gap: 6,
                } as React.CSSProperties
              }
            >
              <span style={{ display: "flex", gap: t.level > 2 ? 3 : 4, alignItems: "center", justifyContent: "center" }}>
                {t.items.map((it, i) => (
                  <span
                    key={`${it.slug}-${i}`}
                    style={{ color: it.hex, display: "block", ["--mark" as string]: `${t.level === 1 ? 28 : t.level === 2 ? 20 : 15}px` } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: marks[it.slug] }}
                  />
                ))}
              </span>
              <span
                className="sg-name"
                style={{ ["--name" as string]: "7.5px", color: t.level === 1 ? "rgba(242,237,226,.66)" : fam } as React.CSSProperties}
              >
                {t.level === 1 ? t.items[0].name : label}
              </span>
            </div>
          );
        })}
      </div>

      {toast && (
        <div key={toast.k} className="sg-toast" style={{ top: TOP + SPAN + 26 }}>
          {toast.text}
        </div>
      )}

      <div className="sg-legend" style={{ fontSize: 7, letterSpacing: "0.1em", gap: 11 }}>
        {GROUPS.map((g) => (
          <span key={g.id} style={{ color: g.hex }}>
            <i />
            <em style={{ fontStyle: "normal", color: "rgba(242,237,226,.42)" }}>
              {g.label} {String(banked[g.id]).padStart(2, "0")}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}
