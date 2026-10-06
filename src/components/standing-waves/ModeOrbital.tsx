"use client";

import { useEffect, useRef, useState } from "react";
import { circularMode, orbitalExtent, orbitalSlice, type Field } from "@/lib/standing-waves/fields";

/**
 * Mode ↔ Orbital. One slider steps a circular-plate mode and a hydrogen
 * orbital slice together, matched by their nodes: m nodal diameters and k
 * nodal circles on the plate, l = m nodal lines and n − l − 1 = k nodal rings
 * in the orbital. The count is the same. The spacing is not, and that
 * difference is the lesson: the plate is held in by a hard rim, the electron
 * by a pull that fades with distance.
 */

const LETTER = ["s", "p", "d", "f", "g"];

const STEPS = (() => {
  const out: { m: number; k: number; n: number; l: number }[] = [];
  for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) out.push({ m: l, k: n - l - 1, n, l });
  return out;
})();

const RES = 200;

/** Resolve a CSS colour (oklch, var(), anything) to RGB by letting a canvas paint it. */
function rgbOf(css: string): [number, number, number] {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const g = c.getContext("2d")!;
  g.fillStyle = css;
  g.fillRect(0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data;
  return [d[0]!, d[1]!, d[2]!];
}

function paint(canvas: HTMLCanvasElement, f: Field, pos: [number, number, number], neg: [number, number, number]) {
  const g = canvas.getContext("2d");
  if (!g) return;
  const img = g.createImageData(RES, RES);
  const vals = new Float32Array(RES * RES);
  let max = 0;
  for (let j = 0; j < RES; j++)
    for (let i = 0; i < RES; i++) {
      const v = f((i + 0.5) / RES, (j + 0.5) / RES);
      vals[j * RES + i] = v;
      if (Number.isFinite(v)) max = Math.max(max, Math.abs(v));
    }
  for (let p = 0; p < vals.length; p++) {
    const v = vals[p]!;
    const o = p * 4;
    if (!Number.isFinite(v) || max === 0) continue; // transparent outside the plate
    const a = Math.pow(Math.abs(v) / max, 0.55); // lift the faint outer lobes so they read
    const c = v >= 0 ? pos : neg;
    img.data[o] = c[0];
    img.data[o + 1] = c[1];
    img.data[o + 2] = c[2];
    img.data[o + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0);
}

export function ModeOrbital({ initial = 4 }: { initial?: number }) {
  const [i, setI] = useState(() => Math.min(Math.max(initial, 0), STEPS.length - 1));
  const plate = useRef<HTMLCanvasElement>(null);
  const orbital = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState(0);
  const s = STEPS[i]!;

  // URL-serialised state: ?step=… so a particular pair can be linked.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("step");
    if (q !== null && Number.isFinite(Number(q))) setI(Math.min(Math.max(Number(q), 0), STEPS.length - 1));
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(i));
    history.replaceState(null, "", url);
  }, [i]);

  // Repaint on a theme flip, since the colours are read from the tokens.
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const root = plate.current?.parentElement ?? document.body;
    const cs = getComputedStyle(root);
    const pos = rgbOf(cs.getPropertyValue("--data-1").trim() || "currentColor");
    const neg = rgbOf(cs.getPropertyValue("--data-2").trim() || "currentColor");
    if (plate.current) paint(plate.current, circularMode(s.m, s.k), pos, neg);
    if (orbital.current) paint(orbital.current, orbitalSlice(s.n, s.l, orbitalExtent(s.n)), pos, neg);
  }, [s, theme]);

  const plateName = `Plate mode: ${s.m} nodal diameter${s.m === 1 ? "" : "s"}, ${s.k} nodal circle${s.k === 1 ? "" : "s"}`;
  const orbName = `Hydrogen ${s.n}${LETTER[s.l]}: ${s.l} nodal line${s.l === 1 ? "" : "s"} through the nucleus, ${s.k} nodal ring${s.k === 1 ? "" : "s"}`;

  return (
    <div className="sw-pair">
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <figure>
          <canvas ref={plate} width={RES} height={RES} role="img" aria-label={plateName} />
          <figcaption className="mt-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">Vibrating plate</span>
            <span className="mt-1 block text-[13px] leading-[1.5] text-ink">
              {s.m} line{s.m === 1 ? "" : "s"} across, {s.k} ring{s.k === 1 ? "" : "s"}
            </span>
          </figcaption>
        </figure>
        <figure>
          <canvas ref={orbital} width={RES} height={RES} role="img" aria-label={orbName} />
          <figcaption className="mt-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
              Hydrogen {s.n}
              {LETTER[s.l]}
            </span>
            <span className="mt-1 block text-[13px] leading-[1.5] text-ink">
              {s.l} line{s.l === 1 ? "" : "s"} across, {s.k} ring{s.k === 1 ? "" : "s"}
            </span>
          </figcaption>
        </figure>
      </div>

      <label htmlFor="sw-pair-step" className="mt-6 block font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
        Step {i + 1} of {STEPS.length}
      </label>
      <input
        id="sw-pair-step"
        type="range"
        className="sw-range"
        min={0}
        max={STEPS.length - 1}
        step={1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
        aria-valuetext={`${plateName}. ${orbName}.`}
      />
      <p className="mt-3 text-[13.5px] leading-[1.65] text-ink-70">
        Same count of still lines, different spacing. The plate&apos;s rings are packed evenly because a hard rim holds the
        wave in; the orbital&apos;s spread outwards because the pull holding the electron weakens with distance. The two
        colours are the two signs of the wave, up and down at one instant.
      </p>
    </div>
  );
}
