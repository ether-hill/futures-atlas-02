"use client";

import { useEffect, useRef, useState } from "react";
import { SHELF_CATEGORIES, type ShelfCategoryKey } from "@/data/library-shelf";
import { CAT_COLOR } from "./shared";

/**
 * The filter, built the way the oldest book on the reasoning thread works:
 * three rings on one pin, turned against each other so that whatever lines up
 * under the pointer is the combination. Llull's rings carry the letters B to K;
 * these carry a thread, a century and a language.
 *
 * Each ring is dragged round or clicked. A ring's position is kept as a
 * running angle rather than an index, so it always takes the short way to
 * where it is going instead of unwinding.
 */

export interface WheelValue {
  thread: ShelfCategoryKey | null;
  century: number | null;
  lang: string | null;
}

export const WHEEL_LANGS = ["Latin", "English", "French", "German", "Italian"];
export const EMPTY_WHEEL: WheelValue = { thread: null, century: null, lang: null };

interface Item {
  label: string;
  value: string | number | null;
  color?: string;
}

const RINGS: { key: keyof WheelValue; name: string; r0: number; r1: number; size: number; items: Item[] }[] = [
  {
    key: "thread",
    name: "Subject",
    r0: 116,
    r1: 152,
    size: 12.5,
    items: [
      { label: "All subjects", value: null },
      ...SHELF_CATEGORIES.map((c) => ({ label: c.short, value: c.key, color: CAT_COLOR[c.key] })),
    ],
  },
  {
    key: "century",
    name: "Century",
    r0: 80,
    r1: 114,
    size: 12,
    items: [
      { label: "Any time", value: null },
      ...[1400, 1500, 1600, 1700, 1800, 1900].map((c) => ({ label: `${c}s`, value: c })),
    ],
  },
  {
    key: "lang",
    name: "Language",
    r0: 44,
    r1: 78,
    size: 10.5,
    items: [
      { label: "Any", value: null },
      ...WHEEL_LANGS.map((l) => ({ label: l, value: l })),
      { label: "Other", value: "Other" },
    ],
  },
];

// Rounded, because sin and cos are not bit-identical between Node and the
// browser, and an unrounded path is a hydration mismatch in its last digit.
const pt = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.round(Math.cos(a) * r * 100) / 100, Math.round(Math.sin(a) * r * 100) / 100] as const;
};

/** An annular sector, 0° at the top, clockwise. */
const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
};
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function LlullWheel({
  value,
  onChange,
  count,
}: {
  value: WheelValue;
  onChange: (v: WheelValue) => void;
  count: number;
}) {
  const svg = useRef<SVGSVGElement>(null);
  // running angle of each ring, in degrees
  const [turn, setTurn] = useState<number[]>(() => RINGS.map(() => 0));
  const [held, setHeld] = useState<number | null>(null);
  const drag = useRef<{ ring: number; last: number; moved: number; item: number } | null>(null);
  const turnNow = useRef(turn);
  turnNow.current = turn;

  // When the value is changed from outside (a reset, a thread button), bring
  // each ring round to it by the shortest way.
  useEffect(() => {
    setTurn((prev) =>
      RINGS.map((ring, i) => {
        const n = ring.items.length;
        const seg = 360 / n;
        const want = Math.max(
          0,
          ring.items.findIndex((it) => it.value === value[ring.key]),
        );
        const now = mod(Math.round(-prev[i]! / seg), n);
        if (now === want) return prev[i]!;
        let step = want - now;
        if (step > n / 2) step -= n;
        if (step < -n / 2) step += n;
        return Math.round(-prev[i]! / seg) * -seg - step * seg;
      }),
    );
  }, [value]);

  const angleAt = (e: { clientX: number; clientY: number }) => {
    const box = svg.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (box.top + box.height / 2), e.clientX - (box.left + box.width / 2)) * 180) / Math.PI;
  };

  const settle = (ringIndex: number, itemIndex: number) => {
    const ring = RINGS[ringIndex]!;
    onChange({ ...value, [ring.key]: ring.items[itemIndex]!.value });
  };

  useEffect(() => {
    if (held === null) return;
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const a = angleAt(e);
      let delta = a - d.last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      d.last = a;
      d.moved += Math.abs(delta);
      setTurn((t) => t.map((v, i) => (i === d.ring ? v + delta : v)));
    };
    const up = () => {
      const d = drag.current;
      drag.current = null;
      setHeld(null);
      if (!d) return;
      const ring = RINGS[d.ring]!;
      const n = ring.items.length;
      const seg = 360 / n;
      if (d.moved < 4) {
        settle(d.ring, d.item); // a click: bring that segment to the pointer
        return;
      }
      const snapped = Math.round(turnNow.current[d.ring]! / seg) * seg;
      setTurn((t) => t.map((v, i) => (i === d.ring ? snapped : v)));
      settle(d.ring, mod(Math.round(-snapped / seg), n));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listeners live for one drag
  }, [held]);

  return (
    <svg
      ref={svg}
      viewBox="-170 -176 340 346"
      className="mx-auto block w-full max-w-[330px] touch-none select-none"
      role="group"
      aria-label="Filter wheel: subject, century, language"
    >
      {RINGS.map((ring, ri) => {
        const n = ring.items.length;
        const seg = 360 / n;
        const selected = Math.max(
          0,
          ring.items.findIndex((it) => it.value === value[ring.key]),
        );
        const mid = (ring.r0 + ring.r1) / 2;
        return (
          <g
            key={ring.key}
            className={`anc-ring ${held === ri ? "is-held" : ""}`}
            style={{ transform: `rotate(${turn[ri]}deg)` }}
          >
            {ring.items.map((it, i) => {
              const a0 = i * seg - seg / 2;
              const a1 = i * seg + seg / 2;
              const on = i === selected;
              const id = `anc-arc-${ring.key}-${i}`;
              return (
                <g
                  key={it.label}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${ring.name}: ${it.label}`}
                  className="anc-seg"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    drag.current = { ring: ri, last: angleAt(e), moved: 0, item: i };
                    setHeld(ri);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      settle(ri, i);
                    }
                  }}
                >
                  <path
                    d={sector(ring.r0, ring.r1, a0, a1)}
                    style={{
                      fill: on ? (it.color ?? "var(--c-ink)") : "var(--c-panel)",
                      stroke: "var(--c-surface)",
                      strokeWidth: 2,
                    }}
                  />
                  {it.color && !on && (
                    <path
                      d={arc(ring.r1 - 3, a0 + 1.2, a1 - 1.2)}
                      style={{ stroke: it.color, strokeWidth: 4, fill: "none" }}
                    />
                  )}
                  <path id={id} d={arc(mid - ring.size * 0.34, a0, a1)} fill="none" />
                  <text
                    style={{
                      fontSize: ring.size,
                      fontWeight: on ? 800 : 600,
                      fill: on ? "var(--c-surface)" : "var(--c-ink70)",
                      letterSpacing: "0.01em",
                      pointerEvents: "none",
                    }}
                  >
                    <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                      {it.label}
                    </textPath>
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* the pin, and how many books the three rings leave standing */}
      <circle r={42} style={{ fill: "var(--c-surface)", stroke: "var(--c-ink)", strokeWidth: 1.5 }} />
      <text
        y={6}
        textAnchor="middle"
        className="font-condensed"
        style={{ fontSize: 34, fontWeight: 600, fill: "var(--c-ink)" }}
        aria-live="polite"
      >
        {count}
      </text>
      <text y={23} textAnchor="middle" style={{ fontSize: 10.5, fontWeight: 600, fill: "var(--c-graphite)" }}>
        {count === 1 ? "work" : "works"}
      </text>

      {/* the pointer everything is read under */}
      <path d="M0 -154 L-9 -172 L9 -172 Z" style={{ fill: "var(--c-accent)" }} />
    </svg>
  );
}
