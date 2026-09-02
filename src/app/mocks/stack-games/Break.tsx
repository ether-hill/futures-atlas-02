"use client";

import { useEffect, useRef, useState } from "react";
import { Brick, Legend, shuffled } from "./Brick";
import { GROUPS, GROUP_HEX, ITEMS, type Item, type Marks } from "./stack";

/**
 * BREAK — the tech stack as a wall to be taken apart.
 *
 * The inverse of the other three: nothing falls in, everything is already
 * there and the ball removes it a brick at a time. What that uncovers is the
 * studio's own name, which has been sitting behind the tools the whole time.
 * When the last brick goes the wall rebuilds from a fresh shuffle, so the loop
 * has an actual ending rather than a fade.
 *
 * The ball runs on requestAnimationFrame and writes to the DOM through refs;
 * only the bricks are React state, because only the bricks change rarely. A
 * sixty-times-a-second render of a board this size films as judder.
 */

const COLS = 4;
const ROWS = 5;
const BW = 96;
const BH = 54;
const BGAP = 6;
const WALL_X = (430 - (COLS * BW + (COLS - 1) * BGAP)) / 2;
const WALL_Y = 150;
const WALL_W = COLS * BW + (COLS - 1) * BGAP;
const WALL_H = ROWS * BH + (ROWS - 1) * BGAP;

const PAD = 14;
const TOP = 96;
const PADDLE_W = 92;
const PADDLE_Y = 692;
const R = 6;

type Wall = { id: number; item: Item; col: number; row: number; cls: string };

export function Break({ marks }: { marks: Marks }) {
  const [wall, setWall] = useState<Wall[]>([]);
  const [left, setLeft] = useState(COLS * ROWS);
  const ball = useRef<HTMLDivElement>(null);
  const paddle = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let id = 1;

    const build = () => {
      const picks = shuffled(ITEMS).slice(0, COLS * ROWS);
      const next: Wall[] = picks.map((item, i) => ({
        id: id++,
        item,
        col: i % COLS,
        row: Math.floor(i / COLS),
        cls: "",
      }));
      setWall(next);
      setLeft(next.length);
      return next;
    };

    let live = build();
    const rect = (b: Wall) => ({
      x: WALL_X + b.col * (BW + BGAP),
      y: WALL_Y + b.row * (BH + BGAP),
      w: BW,
      h: BH,
    });

    let bx = 215;
    let by = 640;
    let speed = 320;
    let vx = speed * 0.55;
    let vy = -speed * 0.84;
    let px = 215;
    let rebuild = 0; // countdown, in seconds, before the wall comes back

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      if (!alive.current) return;
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      if (rebuild > 0) {
        rebuild -= dt;
        if (rebuild <= 0) {
          live = build();
          bx = 215; by = 640; speed = 320;
          vx = speed * (Math.random() < 0.5 ? -0.55 : 0.55);
          vy = -speed * 0.84;
        }
      } else {
        bx += vx * dt;
        by += vy * dt;

        if (bx < PAD + R) { bx = PAD + R; vx = Math.abs(vx); }
        if (bx > 430 - PAD - R) { bx = 430 - PAD - R; vx = -Math.abs(vx); }
        if (by < TOP + R) { by = TOP + R; vy = Math.abs(vy); }

        // The paddle is a follower, not an opponent: it never misses, it only
        // arrives a little late, which is what gives the ball its angles.
        px += (bx - px) * Math.min(1, dt * 6.5);
        px = Math.max(PAD + PADDLE_W / 2, Math.min(430 - PAD - PADDLE_W / 2, px));

        if (vy > 0 && by + R >= PADDLE_Y && by - R <= PADDLE_Y + 8) {
          if (Math.abs(bx - px) < PADDLE_W / 2 + R) {
            by = PADDLE_Y - R;
            const off = (bx - px) / (PADDLE_W / 2);
            const ang = off * 0.95;
            vx = Math.sin(ang) * speed;
            vy = -Math.cos(ang) * speed;
          }
        }
        if (by > 800) { bx = px; by = 640; vx = speed * 0.55; vy = -speed * 0.84; }

        // One brick per frame: two at once is a corner case that only ever
        // sends the ball somewhere impossible.
        for (const b of live) {
          const r = rect(b);
          const nx = Math.max(r.x, Math.min(bx, r.x + r.w));
          const ny = Math.max(r.y, Math.min(by, r.y + r.h));
          if ((bx - nx) ** 2 + (by - ny) ** 2 > R * R) continue;

          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          const ox = (r.w / 2 + R) - Math.abs(bx - cx);
          const oy = (r.h / 2 + R) - Math.abs(by - cy);
          if (ox < oy) { vx = bx < cx ? -Math.abs(vx) : Math.abs(vx); bx += bx < cx ? -ox : ox; }
          else { vy = by < cy ? -Math.abs(vy) : Math.abs(vy); by += by < cy ? -oy : oy; }

          live = live.filter((x) => x.id !== b.id);
          setWall((p) => p.map((x) => (x.id === b.id ? { ...x, cls: "is-clearing" } : x)));
          setLeft(live.length);
          window.setTimeout(() => {
            if (alive.current) setWall((p) => p.filter((x) => x.id !== b.id));
          }, 340);

          speed = Math.min(520, speed + 7);
          const m = Math.hypot(vx, vy) || 1;
          vx = (vx / m) * speed;
          vy = (vy / m) * speed;
          if (!live.length) rebuild = 1.5;
          break;
        }
      }

      if (ball.current) ball.current.style.transform = `translate3d(${bx - R}px, ${by - R}px, 0)`;
      if (paddle.current) paddle.current.style.transform = `translate3d(${px - PADDLE_W / 2}px, 0, 0)`;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => { alive.current = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    // Break keeps the quick pop the other three gave up: a brick has to leave
    // on the frame the ball touches it, or the bounce reads as a miss.
    <div className="sg-stage" style={{ "--clear": "320ms" } as React.CSSProperties}>
      <div className="sg-hud sg-hud-top">
        <span>The stack</span>
        <span>
          Bricks left <b>{String(left).padStart(2, "0")}</b>
        </span>
      </div>

      {/* What the wall is standing in front of. */}
      <div
        style={{
          position: "absolute",
          left: WALL_X,
          top: WALL_Y,
          width: WALL_W,
          height: WALL_H,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          fontSize: 33,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#f2ede2",
          textShadow: "0 0 34px rgba(59,147,213,.55)",
        }}
      >
        <span>
          Futures
          <br />
          Atlas
        </span>
      </div>

      <div style={{ position: "absolute", inset: 0 }}>
        {wall.map((b) => (
          <Brick
            key={b.id}
            html={marks[b.item.slug]}
            hex={b.item.hex}
            fam={GROUP_HEX[b.item.group]}
            name={b.item.name}
            w={BW}
            h={BH}
            x={WALL_X + b.col * (BW + BGAP)}
            y={WALL_Y + b.row * (BH + BGAP)}
            mark={22}
            nameSize={7.5}
            cls={b.cls}
            style={{ background: "linear-gradient(150deg, rgba(242,237,226,.09), rgba(242,237,226,.025)), #0c0d10" }}
          />
        ))}
      </div>

      <div
        ref={ball}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: R * 2,
          height: R * 2,
          background: "#f2ede2",
          boxShadow: "0 0 16px rgba(242,237,226,.75)",
          willChange: "transform",
        }}
      />
      <div
        ref={paddle}
        style={{
          position: "absolute",
          left: 0,
          top: PADDLE_Y,
          width: PADDLE_W,
          height: 8,
          background: "#3b93d5",
          boxShadow: "0 0 20px rgba(59,147,213,.55)",
          willChange: "transform",
        }}
      />

      <Legend groups={GROUPS} />
    </div>
  );
}
