"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { sleep } from "../../../mocks/stack-games/Brick";
import { BY_GROUP, GROUPS, GROUP_HEX, type Group, type Item, type Marks } from "../../../mocks/stack-games/stack";
import { GameShell, useBest, type Phase } from "../_kit/shell";

/**
 * MERGE, played. The 2048 move set on the studio's tools: everything slides
 * at once, and two bricks of the same family fuse into one that carries both
 * marks, as long as together they hold four tools or fewer. Exactly four and
 * the family banks out and leaves the board for big points.
 *
 * The first cut used 2048's own rule (only equal sizes fuse) on a 4x4 board,
 * and with four families a test game filled the board in about forty slides.
 * Any-size fusing fixed that; a 5x5 board on top of it made the game
 * unloseable (150 random slides and still going), so it is back to 4x4: a 3
 * still has to wait for a 1, and a careless board still fills. A new tool arrives after every slide that changed
 * anything; the game ends when the board is full and nothing can fuse.
 *
 * Fusing goes on families, not on tools, for the same reason as the reel: the
 * tools are not the point, the four things the studio does with them are.
 */

const N = 4;
const CELL = 92;
const GAP = 8;
const SPAN = N * CELL + (N - 1) * GAP;
const LEFT = (430 - SPAN) / 2;
const TOP = 92;
const SLIDE_MS = 130;
const BANK_LEVEL = 4;

type Tile = { id: number; group: Group; level: number; items: Item[]; r: number; c: number; dur: number; cls: string; gone?: boolean };

const at = (i: number) => i * (CELL + GAP);
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const EMPTY_BANK = (): Record<Group, number> => ({ language: 0, media: 0, open: 0, web: 0 });

export function MergeGame({ marks }: { marks: Marks }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [, setV] = useState(0);
  const redraw = () => setV((v) => v + 1);
  const [best, offerBest] = useBest("merge");

  const board = useRef<(Tile | null)[][]>([]);
  const extra = useRef<Tile[]>([]); // tiles sliding into a fuse, drawn until they vanish
  const ids = useRef(1);
  const busy = useRef(false);
  const stats = useRef({ score: 0, banked: EMPTY_BANK() });
  const pops = useRef<{ k: number; x: number; y: number; text: string; hex: string }[]>([]);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;

  const tilesNow = () => board.current.flat().filter((t): t is Tile => t !== null);

  const spawn = () => {
    const holes: [number, number][] = [];
    board.current.forEach((row, r) => row.forEach((t, c) => { if (!t) holes.push([r, c]); }));
    if (!holes.length) return false;
    const [r, c] = pick(holes);
    const group = pick(GROUPS).id;
    board.current[r][c] = { id: ids.current++, group, level: 1, items: [pick(BY_GROUP[group])], r, c, dur: 0, cls: "is-hit" };
    return true;
  };

  const canMove = () => {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const t = board.current[r][c];
        if (!t) return true;
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const o = board.current[r + dr]?.[c + dc];
          if (o && o.group === t.group && o.level + t.level <= BANK_LEVEL) return true;
        }
      }
    return false;
  };

  const slide = useCallback(async (dr: number, dc: number) => {
    if (busy.current || phaseRef.current !== "playing") return;
    busy.current = true;

    const next: (Tile | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
    const fuses: { keep: Tile; gone: Tile }[] = [];
    let moved = false;
    const order = (i: number) => (dr > 0 || dc > 0 ? N - 1 - i : i);

    for (let line = 0; line < N; line++) {
      const seq: Tile[] = [];
      for (let i = 0; i < N; i++) {
        const k = order(i);
        const t = dc !== 0 ? board.current[line][k] : board.current[k][line];
        if (t) seq.push(t);
      }
      const out: Tile[] = [];
      for (const cur of seq) {
        const prev = out[out.length - 1];
        if (prev && !fuses.some((f) => f.keep === prev) && prev.group === cur.group && prev.level + cur.level <= BANK_LEVEL) {
          fuses.push({ keep: prev, gone: cur });
        } else out.push(cur);
      }
      out.forEach((t, i) => {
        const k = order(i);
        const r = dc !== 0 ? line : k;
        const c = dc !== 0 ? k : line;
        if (t.r !== r || t.c !== c) moved = true;
        t.r = r; t.c = c; t.dur = SLIDE_MS; t.cls = "";
        next[r][c] = t;
      });
    }
    if (fuses.length) moved = true;
    if (!moved) { busy.current = false; return; }

    // the swallowed tile slides onto its partner, then disappears
    fuses.forEach(({ keep, gone }) => { gone.r = keep.r; gone.c = keep.c; gone.dur = SLIDE_MS; gone.cls = ""; });
    extra.current = fuses.map((f) => f.gone);
    board.current = next;
    redraw();
    await sleep(SLIDE_MS + 10);

    extra.current = [];
    const s = stats.current;
    const banks: Tile[] = [];
    for (const { keep, gone } of fuses) {
      keep.level += gone.level;
      keep.items = [...keep.items, ...gone.items];
      keep.cls = "is-hit";
      keep.dur = 0;
      const gain = 10 * 2 ** keep.level;
      s.score += gain;
      if (keep.level >= BANK_LEVEL) banks.push(keep);
      else pops.current.push({ k: Date.now() + Math.random(), x: LEFT + at(keep.c) + CELL / 2, y: TOP + at(keep.r) + CELL / 2, text: `+${gain}`, hex: GROUP_HEX[keep.group] });
    }
    tilesNow().forEach((t) => { t.dur = 0; });
    redraw();

    if (banks.length) {
      await sleep(180);
      for (const b of banks) {
        b.cls = "is-clearing";
        s.score += 400;
        s.banked[b.group]++;
        pops.current.push({ k: Date.now() + Math.random(), x: LEFT + at(b.c) + CELL / 2, y: TOP + at(b.r) + CELL / 2, text: `+400 ${GROUPS.find((g) => g.id === b.group)!.label} banked`, hex: GROUP_HEX[b.group] });
      }
      redraw();
      await sleep(460);
      for (const b of banks) board.current[b.r][b.c] = null;
    }

    spawn();
    redraw();
    busy.current = false;
    if (!canMove()) {
      await sleep(400);
      setPhase("over");
      offerBest(s.score);
    }
  }, []);

  const start = useCallback(() => {
    board.current = Array.from({ length: N }, () => Array(N).fill(null));
    extra.current = [];
    stats.current = { score: 0, banked: EMPTY_BANK() };
    pops.current = [];
    busy.current = false;
    spawn();
    spawn();
    setPhase("playing");
    redraw();
  }, []);

  // a board behind the start card
  useEffect(() => {
    board.current = Array.from({ length: N }, () => Array(N).fill(null));
    for (let i = 0; i < 5; i++) spawn();
    redraw();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") slide(0, -1);
      else if (k === "ArrowRight" || k === "d" || k === "D") slide(0, 1);
      else if (k === "ArrowUp" || k === "w" || k === "W") slide(-1, 0);
      else if (k === "ArrowDown" || k === "s" || k === "S") slide(1, 0);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, slide]);

  // swipe
  const sw = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => { sw.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: React.PointerEvent) => {
    const o = sw.current;
    sw.current = null;
    if (!o) return;
    const dx = e.clientX - o.x, dy = e.clientY - o.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) slide(0, Math.sign(dx));
    else slide(Math.sign(dy), 0);
  };

  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      const n = pops.current.length;
      pops.current = pops.current.filter((p) => now - p.k < 1000);
      if (n !== pops.current.length) redraw();
    }, 400);
    return () => window.clearInterval(t);
  }, []);

  const s = stats.current;
  const totalBanked = Object.values(s.banked).reduce((a, b) => a + b, 0);
  const drawn = [...tilesNow(), ...extra.current];

  return (
    <GameShell
      id="merge"
      phase={phase}
      score={s.score}
      best={best}
      extra={{ label: "Banked", value: totalBanked }}
      overTitle="Board full"
      overLine={totalBanked ? `${totalBanked} ${totalBanked === 1 ? "family" : "families"} banked.` : undefined}
      onStart={start}
      onPause={() => setPhase("paused")}
      onResume={() => setPhase("playing")}
    >
      <div className="sg-stage" style={{ ["--clear" as string]: "460ms", ["--hit" as string]: "260ms" }} onPointerDown={onDown} onPointerUp={onUp}>
        <span className="g2-label" style={{ left: LEFT, top: TOP - 34, fontSize: 13 }}>
          Fuse four of one family to bank it
        </span>
        <div
          className="sg-well"
          style={{ left: LEFT - 1, top: TOP - 1, width: SPAN + 2, height: SPAN + 2, backgroundSize: `${CELL + GAP}px ${CELL + GAP}px` }}
        />

        <div style={{ position: "absolute", left: LEFT, top: TOP, width: SPAN, height: SPAN }}>
          {drawn.map((t) => {
            const fam = GROUP_HEX[t.group];
            const label = GROUPS.find((g) => g.id === t.group)!.label;
            const tr = `translate3d(${at(t.c)}px, ${at(t.r)}px, 0)`;
            const size = t.level === 1 ? 30 : t.level === 2 ? 22 : 16;
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
                    background: `linear-gradient(150deg, ${fam}${["", "1c", "30", "4a", "66"][t.level]}, rgba(242,237,226,.02))`,
                    borderColor: t.level > 1 ? `${fam}77` : "rgba(242,237,226,.16)",
                    gap: 7,
                    zIndex: t.level,
                  } as CSSProperties
                }
              >
                <span style={{ display: "flex", flexWrap: "wrap", maxWidth: 70, gap: 4, alignItems: "center", justifyContent: "center" }}>
                  {t.items.map((it, i) => (
                    <span
                      key={`${it.slug}-${i}`}
                      style={{ color: it.hex, display: "block", ["--mark" as string]: `${size}px` } as CSSProperties}
                      dangerouslySetInnerHTML={{ __html: marks[it.slug] }}
                    />
                  ))}
                </span>
                <span className="sg-name" style={{ ["--name" as string]: "7.5px", color: t.level === 1 ? "rgba(242,237,226,.66)" : fam } as CSSProperties}>
                  {t.level === 1 ? t.items[0].name : `${label} ${t.level}/4`}
                </span>
              </div>
            );
          })}
        </div>

        {/* the bank: one row per family */}
        <div style={{ position: "absolute", left: LEFT, right: LEFT, top: TOP + SPAN + 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
          {GROUPS.map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: `2px solid ${g.hex}`, paddingTop: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(242,237,226,.6)" }}>{g.label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.banked[g.id]}</span>
            </div>
          ))}
        </div>
        <span className="g2-label" style={{ left: LEFT, bottom: 18, fontSize: 12 }}>Swipe or use the arrow keys</span>

        {pops.current.map((pp) => (
          <div key={pp.k} className="g2-pop" style={{ left: pp.x, top: pp.y, color: pp.hex, fontSize: 15 }}>{pp.text}</div>
        ))}
      </div>
    </GameShell>
  );
}
