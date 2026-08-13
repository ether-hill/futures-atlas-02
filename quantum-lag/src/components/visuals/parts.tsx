"use client";

import type { ReactNode } from "react";

/*
  Shared pieces for the drawn figures.

  Most of these figures are "some labelled quantities, compared", so that shape
  is a component rather than twenty hand-built SVGs. The rest get real drawings.
*/

export function Rows({ children }: { children: ReactNode }) {
  return <div className="ql-fig__rows">{children}</div>;
}

export function Row({
  label,
  /** 0–1 of the track. Illustrative; the value beside it carries the fact. */
  fill,
  value,
  accent = false,
  delay = 0,
}: {
  label: string;
  fill: number;
  value: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div className="ql-fig__row">
      <span className="ql-fig__row-label">{label}</span>
      <span className="ql-fig__track">
        <span
          className={`ql-fig__bar ${accent ? "ql-fig__bar--accent" : ""}`}
          style={{
            width: `${Math.max(1.5, fill * 100)}%`,
            animationDelay: `${delay}ms`,
          }}
        />
      </span>
      <span
        className={`ql-fig__row-value ${
          accent ? "ql-fig__row-value--accent" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** A figure that is genuinely a drawing. 560-wide viewBox, scales to fit. */
export function Stage({
  height,
  children,
  label,
}: {
  height: number;
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="ql-fig__stage">
      <svg viewBox={`0 0 560 ${height}`} role="img" aria-label={label}>
        {children}
      </svg>
    </div>
  );
}

/** Uppercase caption text inside a drawing. */
export function T({
  x,
  y,
  children,
  anchor = "start",
  className = "",
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  className?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={className}>
      {children}
    </text>
  );
}

/** A Saira numeral inside a drawing. */
export function N({
  x,
  y,
  size = 26,
  children,
  anchor = "start",
  accent = false,
}: {
  x: number;
  y: number;
  size?: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  accent?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={`num ${accent ? "num--accent" : ""}`}
      style={{ fontSize: size }}
    >
      {children}
    </text>
  );
}
