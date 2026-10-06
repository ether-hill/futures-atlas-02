"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brick, shuffled } from "../../../mocks/stack-games/Brick";
import { GROUPS, GROUP_HEX, ITEMS, type Group, type Item, type Marks } from "../../../mocks/stack-games/stack";
import { GameShell, useBest, type Phase } from "../_kit/shell";

/**
 * BREAK, played. A paddle, one ball, three lives, a wall of tools. Where the
 * ball meets the paddle sets its angle (the middle sends it straight up, the
 * edges send it wide), which is the whole skill of the game.
 *
 * Hits in a row without touching the paddle are worth more each time, and the
 * last brick of a family pays a bonus. Clear the wall and the studio's name is
 * what was behind it; then a faster wall goes up.
 *
 * The ball and paddle move sixty times a second through refs, straight to the
 * DOM. Only the wall is React state, because only the wall changes rarely.
 */

const COLS = 6;
const ROWS = 6;
const BW = 64;
const BH = 34;
const GAP = 4;
const WALL_X = (430 - (COLS * BW + (COLS - 1) * GAP)) / 2;
const WALL_Y = 64;
const PADDLE_W = 88;
const PADDLE_H = 12;
const PADDLE_Y = 700;
const R = 7;
const STAGE_W = 430;
const STAGE_H = 764;
const BASE_SPEED = 430;

type WallBrick = { id: number; item: Item; group: Group; col: number; row: number; gone: boolean; cls: string };

export function BreakGame({ marks }: { marks: Marks }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [, setV] = useState(0);
  const redraw = () => setV((v) => v + 1);
  const [best, offerBest] = useBest("break");

  const wall = useRef<WallBrick[]>([]);
  const ball = useRef({ x: 215, y: PADDLE_Y - R, vx: 0, vy: 0, stuck: true });
  const paddle = useRef({ x: 215 - PADDLE_W / 2 });
  const stats = useRef({ score: 0, lives: 3, level: 1, combo: 0 });
  const keys = useRef({ left: false, right: false });
  const pops = useRef<{ k: number; x: number; y: number; text: string; hex: string }[]>([]);
  const ballEl = useRef<HTMLDivElement>(null);
  const padEl = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("ready");
  phaseRef.current = phase;
  const ids = useRef(1);
  const [revealed, setRevealed] = useState(false);
  const rebuilding = useRef(false);

  const build = () => {
    const pool = shuffled([...ITEMS, ...ITEMS]).slice(0, COLS * ROWS);
    wall.current = pool.map((item, i) => ({
      id: ids.current++, item, group: item.group, col: i % COLS, row: Math.floor(i / COLS), gone: false, cls: "",
    }));
  };

  const speed = () => BASE_SPEED * (1 + (stats.current.level - 1) * 0.12);

  const stick = () => {
    ball.current = { x: paddle.current.x + PADDLE_W / 2, y: PADDLE_Y - R - 1, vx: 0, vy: 0, stuck: true };
    stats.current.combo = 0;
  };

  const launch = useCallback(() => {
    const b = ball.current;
    if (!b.stuck || phaseRef.current !== "playing") return;
    const a = (-90 + (Math.random() * 40 - 20)) * (Math.PI / 180);
    b.vx = Math.cos(a) * speed();
    b.vy = Math.sin(a) * speed();
    b.stuck = false;
  }, []);

  const start = useCallback(() => {
    stats.current = { score: 0, lives: 3, level: 1, combo: 0 };
    pops.current = [];
    paddle.current.x = 215 - PADDLE_W / 2;
    build();
    stick();
    rebuilding.current = false;
    setRevealed(false);
    setPhase("playing");
    redraw();
  }, []);

  useEffect(() => { build(); redraw(); }, []);

  const pop = (x: number, y: number, text: string, hex = "#f2ede2") => pops.current.push({ k: Date.now() + Math.random(), x, y, text, hex });

  // the loop
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const p = paddle.current;
      const b = ball.current;
      const s = stats.current;

      if (keys.current.left) p.x -= 620 * dt;
      if (keys.current.right) p.x += 620 * dt;
      p.x = Math.max(6, Math.min(STAGE_W - PADDLE_W - 6, p.x));

      if (b.stuck) {
        b.x = p.x + PADDLE_W / 2;
        b.y = PADDLE_Y - R - 1;
      } else {
        const steps = 3;
        for (let i = 0; i < steps; i++) {
          const px = b.x, py = b.y;
          b.x += (b.vx * dt) / steps;
          b.y += (b.vy * dt) / steps;

          // side walls and ceiling
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
          if (b.x > STAGE_W - R) { b.x = STAGE_W - R; b.vx = -Math.abs(b.vx); }
          if (b.y < R + 4) { b.y = R + 4; b.vy = Math.abs(b.vy); }

          // paddle: the offset from its middle sets the angle
          if (b.vy > 0 && b.y + R >= PADDLE_Y && py + R <= PADDLE_Y + 2 && b.x >= p.x - R && b.x <= p.x + PADDLE_W + R) {
            const off = Math.max(-1, Math.min(1, (b.x - (p.x + PADDLE_W / 2)) / (PADDLE_W / 2)));
            const ang = (-90 + off * 62) * (Math.PI / 180);
            const sp = speed();
            b.vx = Math.cos(ang) * sp;
            b.vy = Math.sin(ang) * sp;
            b.y = PADDLE_Y - R - 0.5;
            s.combo = 0;
          }

          // bricks: one per substep
          for (const w of wall.current) {
            if (w.gone) continue;
            const x0 = WALL_X + w.col * (BW + GAP), y0 = WALL_Y + w.row * (BH + GAP);
            const cx = Math.max(x0, Math.min(b.x, x0 + BW)), cy = Math.max(y0, Math.min(b.y, y0 + BH));
            if ((b.x - cx) ** 2 + (b.y - cy) ** 2 > R * R) continue;
            // which face: whichever axis the ball was outside of a moment ago
            if (px < x0 || px > x0 + BW) b.vx = -b.vx; else b.vy = -b.vy;
            b.x = px; b.y = py;
            w.gone = true;
            w.cls = "is-clearing";
            s.combo++;
            const gain = 10 * Math.min(s.combo, 6);
            s.score += gain;
            pop(x0 + BW / 2, y0 + BH / 2, s.combo > 1 ? `+${gain} ×${Math.min(s.combo, 6)}` : `+${gain}`, GROUP_HEX[w.group]);
            if (!wall.current.some((o) => !o.gone && o.group === w.group)) {
              s.score += 150;
              pop(215, y0 + BH + 30, `+150 ${GROUPS.find((g) => g.id === w.group)!.label} gone`, GROUP_HEX[w.group]);
            }
            redraw();
            break;
          }
        }

        // missed
        if (b.y > STAGE_H + R) {
          s.lives--;
          redraw();
          if (s.lives <= 0) {
            setPhase("over");
            offerBest(s.score);
            return;
          }
          stick();
        }

        // wall cleared: show what was behind it, then build a faster one
        if (!rebuilding.current && wall.current.every((w) => w.gone)) {
          rebuilding.current = true;
          s.level++;
          s.score += 500;
          pop(215, 300, "+500 wall down");
          setRevealed(true);
          stick();
          window.setTimeout(() => { build(); rebuilding.current = false; setRevealed(false); redraw(); }, 1600);
        }
      }

      if (padEl.current) padEl.current.style.transform = `translate3d(${p.x}px, ${PADDLE_Y}px, 0)`;
      if (ballEl.current) ballEl.current.style.transform = `translate3d(${b.x - R}px, ${b.y - R}px, 0)`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // keys
  useEffect(() => {
    if (phase !== "playing") return;
    const set = (v: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.left = v;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.right = v;
      else if (v && (e.key === " " || e.key === "ArrowUp")) launch();
      else return;
      e.preventDefault();
    };
    const dn = set(true), up = set(false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
      keys.current = { left: false, right: false };
    };
  }, [phase, launch]);

  // pointer: the paddle follows the finger or the mouse anywhere on the board
  const follow = (e: React.PointerEvent) => {
    if (phaseRef.current !== "playing" || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * STAGE_W;
    paddle.current.x = Math.max(6, Math.min(STAGE_W - PADDLE_W - 6, x - PADDLE_W / 2));
  };

  // tidy old score pops
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
  return (
    <GameShell
      id="break"
      phase={phase}
      score={s.score}
      best={best}
      extra={{ label: "Lives", value: s.lives }}
      overTitle="Out of balls"
      overLine={s.level > 1 ? `You took down ${s.level - 1} ${s.level === 2 ? "wall" : "walls"}.` : undefined}
      onStart={start}
      onPause={() => setPhase("paused")}
      onResume={() => setPhase("playing")}
    >
      <div
        ref={stage}
        className="sg-stage"
        style={{ ["--clear" as string]: "260ms", cursor: phase === "playing" ? "none" : "default" }}
        onPointerMove={follow}
        onPointerDown={(e) => { follow(e); launch(); }}
      >
        {/* what the wall was hiding */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: WALL_Y + 70, textAlign: "center",
            fontSize: 54, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1,
            color: revealed ? "#f2ede2" : "rgba(242,237,226,.07)", transition: "color .6s ease",
          }}
        >
          Futures<br />Atlas
          {revealed && <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: 0, marginTop: 14, color: "rgba(242,237,226,.6)" }}>Next wall, a little faster</div>}
        </div>

        {wall.current.map((w) =>
          w.gone && !w.cls ? null : (
            <Brick
              key={w.id}
              html={marks[w.item.slug]}
              hex={w.item.hex}
              fam={GROUP_HEX[w.group]}
              name={w.item.name}
              w={BW}
              h={BH}
              x={WALL_X + w.col * (BW + GAP)}
              y={WALL_Y + w.row * (BH + GAP)}
              mark={14}
              nameSize={6}
              cls={w.cls}
              style={{ flexDirection: "row", gap: 5 }}
            />
          ),
        )}

        <div
          ref={padEl}
          style={{
            position: "absolute", left: 0, top: 0, width: PADDLE_W, height: PADDLE_H,
            background: "#f2ede2", transform: `translate3d(${paddle.current.x}px, ${PADDLE_Y}px, 0)`, willChange: "transform",
          }}
        />
        <div
          ref={ballEl}
          style={{
            position: "absolute", left: 0, top: 0, width: R * 2, height: R * 2, borderRadius: "50%",
            background: "#f2ede2", boxShadow: "0 0 14px rgba(242,237,226,.55)",
            transform: `translate3d(${ball.current.x - R}px, ${ball.current.y - R}px, 0)`, willChange: "transform",
          }}
        />

        {/* lives as balls, level */}
        <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", gap: 6 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <i key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < s.lives ? "#f2ede2" : "rgba(242,237,226,.15)" }} />
          ))}
        </div>
        <span className="g2-label" style={{ right: 16, bottom: 14 }}>Wall {s.level}</span>
        {phase === "playing" && ball.current.stuck && (
          <span className="g2-label" style={{ left: 0, right: 0, textAlign: "center", top: PADDLE_Y - 60, fontSize: 14, color: "rgba(242,237,226,.7)" }}>
            Tap or press Space to launch
          </span>
        )}

        {pops.current.map((pp) => (
          <div key={pp.k} className="g2-pop" style={{ left: pp.x, top: pp.y, color: pp.hex, fontSize: 14 }}>{pp.text}</div>
        ))}
      </div>
    </GameShell>
  );
}
