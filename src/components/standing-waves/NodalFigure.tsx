"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { chladni, circularMode, faradayIllustration, nodalPath, type Field } from "@/lib/standing-waves/fields";

/**
 * A generated figure, drawn as an SVG of its nodal lines. Server-rendered into
 * the HTML, so it paints with no JavaScript and reserves its square; a client
 * component only so the flight payload carries the spec string (a few bytes)
 * instead of a second copy of every path (~10 KB each).
 *
 * The path is NOT recomputed on hydration: the server's `d` is already in the
 * DOM, and recomputing fifteen of them was most of the gallery's blocking time
 * on a phone. While hydrating, this renders d="" and suppresses the warning;
 * React does not patch attributes during hydration, and since the virtual
 * value never changes afterwards it never touches the DOM's copy. A figure
 * mounted fresh on the client (the lightbox) computes its own.
 *
 * The nodal line is where the plate stays still, which is exactly where
 * Chladni's sand collects. So drawing the zero set is not a stylisation of the
 * sand figure, it is the sand figure's physics.
 *
 * `spec` is the generator string a MediaItem carries in `src`:
 *   "chladni:n,m"  square plate, n ≠ m
 *   "bessel:m,k"   circular plate, m nodal diameters, k interior nodal circles
 *   "faraday:squares" | "faraday:hexagons" | "faraday:stripes"  (illustrative)
 */
export function fieldForSpec(spec: string): { f: Field; round: boolean } | null {
  const [kind, args = ""] = spec.split(":");
  const nums = args.split(",").map(Number);
  if (kind === "chladni" && nums.length === 2 && nums[0] !== nums[1]) return { f: chladni(nums[0]!, nums[1]!), round: false };
  if (kind === "bessel" && nums.length === 2) return { f: circularMode(nums[0]!, nums[1]!), round: true };
  if (kind === "faraday" && (args === "squares" || args === "hexagons" || args === "stripes"))
    return { f: faradayIllustration(args), round: false };
  return null;
}

const noop = () => () => {};

export function NodalFigure({
  spec,
  label,
  res = 160,
  stroke = 0.9,
  className = "",
}: {
  spec: string;
  /** Accessible name. Omit only when the figure is decorative and labelled elsewhere. */
  label?: string;
  res?: number;
  stroke?: number;
  className?: string;
}) {
  const hydrating = useSyncExternalStore(noop, () => false, () => true);
  const made = useMemo(() => fieldForSpec(spec), [spec]);
  const [firstHydrating] = useState(hydrating); // frozen: true only for a figure that was hydrated
  const d = useMemo(
    () => (made && (typeof window === "undefined" || !firstHydrating) ? nodalPath(made.f, res, 100) : ""),
    [made, res, firstHydrating],
  );
  if (!made) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      className={`sw-figure ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {made.round ? (
        <circle className="sw-rim" cx="50" cy="50" r="49.5" strokeWidth="0.5" />
      ) : spec.startsWith("chladni") ? (
        <rect className="sw-rim" x="0.25" y="0.25" width="99.5" height="99.5" strokeWidth="0.5" />
      ) : null}
      <path className="sw-nodal" d={d} strokeWidth={stroke} suppressHydrationWarning />
    </svg>
  );
}
