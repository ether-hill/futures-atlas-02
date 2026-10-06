"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GROUPS } from "../../../mocks/stack-games/stack";
import { META, type GameId } from "./meta";

/**
 * The frame every v02 game is played in.
 *
 * The board is the whole screen. There used to be a column of rules beside it,
 * which read as a manual sitting next to the game; now the rules live where
 * they are needed: on the start card (drawn, with keycaps and the family key),
 * behind the "?" in the bar (which pauses and shows the same card), and as a
 * one-line keycap strip under the board while you play.
 *
 * The board is still authored at 430x764 (the reels' stage, so the bricks are
 * the same bricks) and scaled to fit. The cards sit INSIDE the stage, so they
 * scale with the board and never cover the bar.
 *
 * The shell owns the phase keys: Enter or Space starts from the ready and
 * game-over cards, P or Escape pauses. Each game listens for its own keys only
 * while the phase is "playing", so the two never fight over Space.
 */

export type Phase = "ready" | "playing" | "paused" | "over";

const STAGE_W = 430;
const STAGE_H = 764;
const BAR_H = 56;
const STRIP_H = 52;

export function useBest(id: GameId) {
  const key = `sg2-best-${id}`;
  const [best, setBest] = useState(0);
  useEffect(() => {
    try { setBest(Number(localStorage.getItem(key)) || 0); } catch {}
  }, [key]);
  const offer = useCallback(
    (score: number) => {
      setBest((b) => {
        if (score <= b) return b;
        try { localStorage.setItem(key, String(score)); } catch {}
        return score;
      });
    },
    [key],
  );
  return [best, offer] as const;
}

export function GameShell({
  id,
  phase,
  score,
  best,
  extra,
  overTitle,
  overLine,
  onStart,
  onPause,
  onResume,
  children,
}: {
  id: GameId;
  phase: Phase;
  score: number;
  best: number;
  /** A second number for the bar, e.g. lines, moves left, lives. */
  extra?: { label: string; value: string | number };
  overTitle?: string;
  overLine?: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  children: ReactNode;
}) {
  const meta = META[id];
  const [scale, setScale] = useState(1);
  const [touch, setTouch] = useState(false);
  const [help, setHelp] = useState(false);
  const newBest = phase === "over" && score > 0 && score >= best;

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setTouch(coarse);
    const fit = () => {
      const strip = coarse ? 0 : STRIP_H;
      const roomW = window.innerWidth - 16;
      const roomH = window.innerHeight - BAR_H - strip - 16;
      setScale(Math.max(0.4, Math.min(roomW / STAGE_W, roomH / STAGE_H, 1.3)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // phase keys
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = phaseRef.current;
      if ((p === "ready" || p === "over") && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setHelp(false);
        onStart();
      } else if (p === "playing" && (e.key === "p" || e.key === "P" || e.key === "Escape")) {
        onPause();
      } else if (p === "paused" && (e.key === "p" || e.key === "P" || e.key === "Escape" || e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setHelp(false);
        onResume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart, onPause, onResume]);

  // a hidden tab pauses the game rather than letting it run out unattended
  useEffect(() => {
    const onVis = () => { if (document.hidden && phaseRef.current === "playing") onPause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [onPause]);

  const showHelp = () => {
    if (phaseRef.current === "playing") onPause();
    setHelp(true);
  };
  const resume = () => { setHelp(false); onResume(); };
  const start = () => { setHelp(false); onStart(); };

  return (
    <div className="g2-play">
      <style>{`
        /* the game is the whole screen: the atlas bar and footer step aside */
        .fa-shell, .fa-share, .fa-foot, footer { display: none !important; }
        body { padding-top: 0 !important; overflow: hidden; }
      `}</style>

      <header className="g2-bar">
        <Link href="/stack-games-v2" className="g2-back">
          <span aria-hidden="true">&#8592;</span> All games
        </Link>
        <h1 className="g2-bar-title">{meta.title}</h1>
        <div className="g2-scores">
          {extra && (
            <span className="g2-num">
              <small>{extra.label}</small>
              <b>{extra.value}</b>
            </span>
          )}
          <span className="g2-num">
            <small>Score</small>
            <b>{score}</b>
          </span>
          <span className="g2-num is-dim">
            <small>Best</small>
            <b>{Math.max(best, score)}</b>
          </span>
          <button type="button" className="g2-icon" onClick={showHelp} aria-label="How to play">?</button>
          {phase === "playing" && (
            <button type="button" className="g2-icon" onClick={onPause} aria-label="Pause">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <rect x="2" y="1" width="3.5" height="12" fill="currentColor" />
                <rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="g2-body">
        <div className="g2-frame" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
          <div className="g2-scaler" style={{ transform: `scale(${scale})` }}>
            {children}

            {phase !== "playing" && (
              <div className="g2-card-wrap">
                <div className="g2-card" role="dialog" aria-label={meta.title}>
                  {(phase === "ready" || (phase === "paused" && help)) && (
                    <>
                      <p className="g2-card-n">Game {meta.n}</p>
                      <h2>{meta.title}</h2>
                      <p className="g2-card-goal">{meta.goal}</p>
                      <ol className="g2-rules">
                        {meta.how.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ol>
                      {touch ? <p className="g2-card-ctl">{meta.touch}</p> : <Caps keys={meta.keys} />}
                      <Families compact />
                      {phase === "ready" ? (
                        <button type="button" className="g2-go" onClick={start} autoFocus>
                          Start
                        </button>
                      ) : (
                        <button type="button" className="g2-go" onClick={resume} autoFocus>
                          Carry on
                        </button>
                      )}
                    </>
                  )}
                  {phase === "paused" && !help && (
                    <>
                      <h2>Paused</h2>
                      <button type="button" className="g2-go" onClick={resume} autoFocus>
                        Carry on
                      </button>
                      <button type="button" className="g2-ghost" onClick={start}>
                        Start over
                      </button>
                    </>
                  )}
                  {phase === "over" && (
                    <>
                      <p className="g2-card-n">{overTitle ?? "Game over"}</p>
                      <p className="g2-final">{score}</p>
                      <p className="g2-card-goal">
                        {newBest ? "A new best." : `Best so far: ${best}.`}
                        {overLine ? ` ${overLine}` : ""}
                      </p>
                      <button type="button" className="g2-go" onClick={start} autoFocus>
                        Play again
                      </button>
                      <Link href="/stack-games-v2" className="g2-ghost">
                        Try another game
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!touch && (
        <div className="g2-strip" aria-hidden={phase !== "playing"}>
          <Caps keys={meta.keys} inline />
        </div>
      )}
    </div>
  );
}

/** Controls drawn as keycaps rather than written out. */
function Caps({ keys, inline = false }: { keys: [string[], string][]; inline?: boolean }) {
  return (
    <ul className={`g2-caps${inline ? " is-inline" : ""}`}>
      {keys.map(([caps, what]) => (
        <li key={what}>
          <span className="g2-capset">
            {caps.map((c, i) => (
              <kbd key={i} className={c.length > 1 ? "is-wide" : ""}>{c}</kbd>
            ))}
          </span>
          <span>{what}</span>
        </li>
      ))}
    </ul>
  );
}

/** The family key, the one rule all four games share. */
export function Families({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`g2-fams${compact ? " is-compact" : ""}`}>
      {!compact && <p>The coloured edge on a brick is its family. Every game is won on families.</p>}
      <ul>
        {GROUPS.map((g) => (
          <li key={g.id}>
            <i style={{ background: g.hex }} />
            {g.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
