"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Marks } from "../../../mocks/stack-games/stack";
import { Tetris } from "../../../mocks/stack-games/Tetris";
import { Cascade } from "../../../mocks/stack-games/Cascade";
import { Break } from "../../../mocks/stack-games/Break";
import { Merge } from "../../../mocks/stack-games/Merge";
import { Families } from "./shell";
import { META, ORDER, type GameId } from "./meta";

/**
 * The cabinets, two to a row on a wide screen and one at a time below that.
 * Each card plays its reel as attract mode, WHOLE (the first cut cropped the
 * middle of the 9:16 stage, which cut Break's paddle out of its own demo), so
 * the four games explain themselves before anyone reads a rule. The reels
 * only run while the card is on screen.
 */
export function Intro({ marks }: { marks: Marks }) {
  const [bests, setBests] = useState<Record<string, number>>({});
  useEffect(() => {
    const out: Record<string, number> = {};
    for (const id of ORDER) {
      try { out[id] = Number(localStorage.getItem(`sg2-best-${id}`)) || 0; } catch {}
    }
    setBests(out);
  }, []);

  return (
    <div className="g2">
      <section className="g2-intro">
        <div className="g2-wrap">
        <div className="g2-hero">
          <div>
            <p className="g2-eyebrow">Four small games</p>
            <h1>The stack, as four games</h1>
          </div>
          <div>
            <p className="g2-lede">
              Every brick is a tool the studio builds with. Drop them, match them, break them, fuse them. Each game
              takes a minute to learn and works with a keyboard, a mouse or a thumb.
            </p>
            <Families />
          </div>
        </div>

        <div className="g2-grid">
          {ORDER.map((id) => (
            <Cabinet key={id} id={id} marks={marks} best={bests[id] ?? 0} />
          ))}
        </div>

        <p className="g2-note">
          Your best scores are kept in this browser only. The tools are the ones listed on the About page, and their
          marks belong to their owners.
        </p>
        </div>
      </section>
    </div>
  );
}

function Cabinet({ id, marks, best }: { id: GameId; marks: Marks; best: number }) {
  const m = META[id];
  const screen = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 430));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const reel =
    m.reel === "tetris" ? <Tetris marks={marks} bare /> :
    m.reel === "cascade" ? <Cascade marks={marks} /> :
    m.reel === "break" ? <Break marks={marks} bare /> :
    <Merge marks={marks} />;

  return (
    <Link href={`/stack-games/${id}`} className="g2-cab" aria-label={`Play ${m.title}`}>
      <div className="g2-screen" ref={screen} aria-hidden="true">
        {onScreen && (
          <div className="g2-screen-inner" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
            {reel}
          </div>
        )}
      </div>
      <div className="g2-cab-body">
        <div className="g2-cab-top">
          <h2>{m.title}</h2>
          <span className="g2-cab-n">{m.n}</span>
        </div>
        <p className="g2-cab-line">{m.line}</p>
        <p className="g2-cab-goal">{m.goal}</p>
        <div className="g2-cab-foot">
          <span className="g2-cab-best">{best ? <>Your best <b>{best}</b></> : "Not played yet"}</span>
          <span className="g2-play-btn">
            Play <span aria-hidden="true">&#8594;</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
