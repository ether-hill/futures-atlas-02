"use client";

import type { CSSProperties } from "react";

/**
 * One brick: a brand mark in its own colour, the tool's name under it, and a
 * family stripe along the top edge. Positioned by transform rather than
 * left/top so every move in every game is one composited property.
 */
export function Brick({
  html,
  hex,
  fam,
  name,
  w,
  h,
  x,
  y,
  mark = 26,
  nameSize = 8,
  cls = "",
  style,
}: {
  html: string;
  hex: string;
  fam: string;
  name?: string;
  w: number;
  h: number;
  x: number;
  y: number;
  mark?: number;
  nameSize?: number;
  cls?: string;
  style?: CSSProperties;
}) {
  const t = `translate3d(${x}px, ${y}px, 0)`;
  return (
    <div
      className={`sg-brick ${cls}`}
      style={
        {
          width: w,
          height: h,
          transform: t,
          "--t": t,
          "--fam": fam,
          "--mark": `${mark}px`,
          "--name": `${nameSize}px`,
          color: hex,
          ...style,
        } as CSSProperties
      }
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {name ? <span className="sg-name">{name}</span> : null}
    </div>
  );
}

/** The family key, spelled out once, so all four games label it the same way. */
export function Legend({ groups }: { groups: { id: string; label: string; hex: string }[] }) {
  return (
    <div className="sg-legend">
      {groups.map((g) => (
        <span key={g.id} style={{ color: g.hex }}>
          <i />
          <em style={{ fontStyle: "normal", color: "rgba(242,237,226,.42)" }}>{g.label}</em>
        </span>
      ))}
    </div>
  );
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Fisher–Yates, seeded by nothing: every recording is a different game. */
export function shuffled<T>(a: readonly T[]): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A bag that reshuffles when it runs dry, so nothing repeats back to back. */
export function bag<T>(items: readonly T[]) {
  let rest: T[] = [];
  return () => {
    if (!rest.length) rest = shuffled(items);
    return rest.pop() as T;
  };
}
