"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TERMS, TERM_LINKS, type Term, type TermCluster } from "@/content/about";

/**
 * The vocabulary of the Atlas as a slowly turning graph.
 *
 * Terms sit on a Fibonacci sphere, projected with perspective, so depth reads
 * as size and opacity. Every term joins its cluster's anchor; TERM_LINKS adds
 * the joins that cross clusters. It turns on its own and follows a drag.
 *
 * Positions are written straight onto the DOM in the animation frame (never
 * through React state) so 60 labels and ~70 lines cost one rAF and no renders.
 * Colour comes from the .term-field rules in globals.css, keyed off the
 * cluster, so the palette stays in the token system.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** Camera distance in sphere radii — smaller is a stronger perspective. */
const FOV = 2.4;
const SPIN = 0.00011; // radians per ms, a full turn takes ~95s

interface Node extends Term {
  x: number;
  y: number;
  z: number;
}

const CLUSTER_ORDER: TermCluster[] = ["futures", "quantum", "ai", "society", "craft"];
/** How far a family spreads from its anchor, in radians of arc. */
const CLUSTER_SPREAD = 1.05;

type Vec = [number, number, number];

const norm = (v: Vec): Vec => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Five well-separated directions, one per family. */
function clusterAxes(): Map<TermCluster, Vec> {
  const n = CLUSTER_ORDER.length;
  return new Map(
    CLUSTER_ORDER.map((c, i) => {
      const y = 1 - ((i + 0.5) / n) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * GOLDEN_ANGLE;
      return [c, [Math.cos(theta) * r, y, Math.sin(theta) * r] as Vec];
    }),
  );
}

/**
 * Each family sits on its own patch of the sphere, anchor at the centre and
 * the rest spiralling out around it, so the connecting lines stay short and
 * the clusters read as clusters. Radius is jittered per term: on a single skin
 * two neighbours at the same depth overlap as one solid block.
 */
function buildNodes(terms: Term[]): Node[] {
  const axes = clusterAxes();
  const byCluster = new Map<TermCluster, Term[]>();
  for (const t of terms) {
    const list = byCluster.get(t.c) ?? [];
    list.push(t);
    byCluster.set(t.c, list);
  }

  const out: Node[] = [];
  for (const [c, list] of byCluster) {
    // anchor first, so it lands at the centre of its patch
    const ordered = [...list].sort((a, b) => b.w - a.w);
    const axis = axes.get(c) ?? ([0, 0, 1] as Vec);
    const u = norm(cross(axis, Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
    const v = norm(cross(axis, u));

    ordered.forEach((t, j) => {
      const arc = Math.sqrt(j / Math.max(1, ordered.length)) * CLUSTER_SPREAD;
      const a = j * GOLDEN_ANGLE;
      const sa = Math.sin(arc);
      const ca = Math.cos(arc);
      const dir: Vec = [
        axis[0] * ca + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * sa,
        axis[1] * ca + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * sa,
        axis[2] * ca + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * sa,
      ];
      const seed = Math.sin((out.length + 1) * 127.1) * 43758.5453;
      const d = 0.58 + 0.47 * (seed - Math.floor(seed));
      out.push({ ...t, x: dir[0] * d, y: dir[1] * d, z: dir[2] * d });
    });
  }
  return out;
}

/** Cluster anchors (the w:3 terms) plus the hand-written cross-cluster joins. */
function buildEdges(nodes: Node[]): [number, number][] {
  const index = new Map(nodes.map((n, i) => [n.t, i]));
  const anchor = new Map<string, number>();
  nodes.forEach((n, i) => {
    if (n.w === 3 && !anchor.has(n.c)) anchor.set(n.c, i);
  });

  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    const a = anchor.get(n.c);
    if (a !== undefined && a !== i) edges.push([i, a]);
  });
  for (const [from, to] of TERM_LINKS) {
    const a = index.get(from);
    const b = index.get(to);
    if (a !== undefined && b !== undefined) edges.push([a, b]);
  }
  return edges;
}

export function TermField() {
  const wrap = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const hovered = useRef<number | null>(null);
  /** Label width per 1px of font-size, measured once (see the mount effect). */
  const widthRatio = useRef<number[]>([]);
  const [ready, setReady] = useState(false);

  // A phone can't read sixty overlapping labels; drop the supporting tier.
  const [dense, setDense] = useState(true);
  const terms = useMemo(() => (dense ? TERMS : TERMS.filter((t) => t.w > 1)), [dense]);
  const nodes = useMemo(() => buildNodes(terms), [terms]);
  const edges = useMemo(() => buildEdges(nodes), [nodes]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 700px)");
    const sync = () => setDense(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = el.clientWidth;
    let h = el.clientHeight;
    // A little past centre: the field reads better weighted to the right.
    let rotY = 0.6;
    let rotX = -0.22;
    let dragY = 0;
    let dragX = 0;
    let last = performance.now();
    let frame = 0;

    const ro = new ResizeObserver(() => {
      w = el.clientWidth;
      h = el.clientHeight;
      draw(0);
    });
    ro.observe(el);

    const project = (n: Node, cy: number, cx: number, sy: number, sx: number) => {
      // yaw then pitch
      const x1 = n.x * cy + n.z * sy;
      const z1 = -n.x * sy + n.z * cy;
      const y2 = n.y * cx - z1 * sx;
      const z2 = n.y * sx + z1 * cx;
      return { x: x1, y: y2, z: z2 };
    };

    function draw(dt: number) {
      // Screen-space framing: wider than tall, because the labels are. On a
      // wide screen the whole field sits right of centre, clear of the copy,
      // so the scrim over the left only has to catch the stragglers.
      const wide = w > 900;
      const rx = w * (wide ? 0.33 : 0.3);
      const ry = h * 0.4;
      if (!reduce) rotY += SPIN * dt;
      rotY += dragY;
      rotX = Math.max(-0.9, Math.min(0.9, rotX + dragX));
      dragY *= 0.9;
      dragX *= 0.9;

      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);
      const ox = w * (wide ? 0.60 : 0.5);
      const oy = h / 2;
      // base type size per weight, scaled off the field's own width
      const base = (weight: number) =>
        weight === 3
          ? Math.max(15, Math.min(30, w * 0.032))
          : weight === 2
            ? Math.max(11.5, Math.min(21, w * 0.023))
            : Math.max(9.5, Math.min(14, w * 0.016));

      const len = nodes.length;
      const X = new Float64Array(len);
      const Y = new Float64Array(len);
      const X0 = new Float64Array(len);
      const Y0 = new Float64Array(len);
      const P = new Float64Array(len);
      const Z = new Float64Array(len);
      const HW = new Float64Array(len);
      const HH = new Float64Array(len);
      const FS = new Float64Array(len);

      for (let i = 0; i < len; i++) {
        const n = nodes[i];
        const { x, y, z } = project(n, cy, cx, sy, sx);
        const p = FOV / (FOV + z);
        const fs = base(n.w) * p;
        X[i] = X0[i] = ox + x * rx * p;
        Y[i] = Y0[i] = oy + y * ry * p;
        P[i] = p;
        Z[i] = z;
        FS[i] = fs;
        HW[i] = ((widthRatio.current[i] ?? 0.5) * fs) / 2;
        HH[i] = fs * 0.6;
      }

      /*
        Two relaxation passes in screen space. Text labels are wide, so a plain
        projection stacks them into unreadable blocks; nudging overlapping pairs
        apart (the nearer label holds its ground, the further one yields) keeps
        the cloud legible without moving anything far from where the geometry
        put it. Displacement is capped so the sphere still reads as a sphere.
      */
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < len; i++) {
          for (let j = i + 1; j < len; j++) {
            const dx = X[j] - X[i];
            const dy = Y[j] - Y[i];
            const gapX = HW[i] + HW[j] + 3 - Math.abs(dx);
            if (gapX <= 0) continue;
            const gapY = HH[i] + HH[j] + 2 - Math.abs(dy);
            if (gapY <= 0) continue;
            // yield in the cheaper direction
            const share = P[j] / (P[i] + P[j]);
            if (gapY < gapX) {
              const push = gapY * 0.5 * (dy < 0 ? -1 : 1);
              Y[i] -= push * share;
              Y[j] += push * (1 - share);
            } else {
              const push = gapX * 0.34 * (dx < 0 ? -1 : 1);
              X[i] -= push * share;
              X[j] += push * (1 - share);
            }
          }
        }
      }

      const pts: { x: number; y: number; p: number }[] = new Array(len);
      for (let i = 0; i < len; i++) {
        // keep every label whole: nothing is allowed to run off an edge
        const loX = Math.min(HW[i] + 6, w / 2);
        const loY = Math.min(HH[i] + 4, h / 2);
        const px = Math.max(loX, Math.min(w - loX, X0[i] + Math.max(-46, Math.min(46, X[i] - X0[i]))));
        const py = Math.max(loY, Math.min(h - loY, Y0[i] + Math.max(-34, Math.min(34, Y[i] - Y0[i]))));
        pts[i] = { x: px, y: py, p: P[i] };

        const node = labels.current[i];
        if (!node) continue;
        const near = hovered.current === i;
        node.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%)`;
        node.style.fontSize = `${FS[i].toFixed(1)}px`;
        node.style.opacity = near ? "1" : (0.3 + 0.7 * Math.pow(Math.max(0, (P[i] - 0.68) / 0.72), 1.5)).toFixed(3);
        node.style.zIndex = String(Math.round((2 - Z[i]) * 100));
      }

      for (let i = 0; i < edges.length; i++) {
        const line = lines.current[i];
        if (!line) continue;
        const [a, b] = edges[i];
        const pa = pts[a];
        const pb = pts[b];
        line.setAttribute("x1", pa.x.toFixed(1));
        line.setAttribute("y1", pa.y.toFixed(1));
        line.setAttribute("x2", pb.x.toFixed(1));
        line.setAttribute("y2", pb.y.toFixed(1));
        const lit = hovered.current === a || hovered.current === b;
        const depth = (pa.p + pb.p) / 2;
        line.style.opacity = lit ? "0.55" : (0.02 + 0.12 * (depth - 0.7)).toFixed(3);
      }
    }

    function loop(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      draw(dt);
      frame = requestAnimationFrame(loop);
    }

    // Measure each label once at a reference size; width scales linearly with
    // font-size, so one read per term is enough for the whole animation.
    const measure = () => {
      widthRatio.current = labels.current.map((node) => {
        if (!node) return 0.5;
        const prev = node.style.fontSize;
        node.style.fontSize = "100px";
        const ratio = node.offsetWidth / 100;
        node.style.fontSize = prev;
        return ratio;
      });
      draw(0);
    };
    measure();
    if (document.fonts?.status !== "loaded") void document.fonts?.ready.then(measure);

    draw(0);
    setReady(true);
    if (!reduce) frame = requestAnimationFrame(loop);

    // drag to turn it
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      dragY += (e.clientX - lastX) * 0.00035;
      dragX += (e.clientY - lastY) * 0.00025;
      lastX = e.clientX;
      lastY = e.clientY;
      if (reduce) draw(0);
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [nodes, edges]);

  return (
    <div
      ref={wrap}
      className="term-field absolute inset-0 z-0 touch-pan-y overflow-hidden select-none"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 600ms ease" }}
    >
      <svg className="absolute inset-0 h-full w-full text-ink" aria-hidden="true">
        {edges.map((e, i) => (
          <line
            key={`${e[0]}-${e[1]}-${i}`}
            className="term-line"
            ref={(n) => {
              lines.current[i] = n;
            }}
          />
        ))}
      </svg>
      <ul className="contents">
        {nodes.map((n, i) => (
          <li key={n.t} className="contents">
            <span
              ref={(el) => {
                labels.current[i] = el;
              }}
              data-cluster={n.c}
              data-w={n.w}
              className="term font-display"
              onPointerEnter={() => {
                hovered.current = i;
              }}
              onPointerLeave={() => {
                hovered.current = null;
              }}
            >
              {n.t}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
