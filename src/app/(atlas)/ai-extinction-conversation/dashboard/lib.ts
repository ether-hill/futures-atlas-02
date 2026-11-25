"use client";

import { useEffect, useState } from "react";
import type { Mention, MentionType } from "@/data/doom-score/types";

/**
 * Shared helpers for the dashboard's charts. Every chart is plain SVG (or a
 * canvas for the globe) drawn with resolved colours, so a panel serialises
 * straight to a PNG. One axis per chart; measures of different units get their
 * own panel. Categorical colours follow the entity, in a fixed order, and the
 * five-step order below was run through the palette validator in both themes
 * (adjacent pairs clear of the colour-vision floor, chroma 0.12).
 */

export type Group = "surveys" | "named" | "forum" | "markets";
export const GROUP_OF: Record<MentionType, Group> = {
  survey: "surveys",
  paper: "named",
  book: "named",
  interview: "named",
  talk: "named",
  article: "named",
  statement: "named",
  forum: "forum",
  market: "markets",
};
export const GROUP_LABEL: Record<Group, string> = {
  surveys: "Surveys and forecasting tournaments",
  named: "Named people, in print and on air",
  forum: "Forum posts",
  markets: "Prediction markets",
};
export const GROUP_SHORT: Record<Group, string> = {
  surveys: "Surveys",
  named: "Named people",
  forum: "Forum posts",
  markets: "Markets",
};
export const GROUP_ORDER: Group[] = ["surveys", "named", "forum", "markets"];

/** The point estimate a row plays: p, else the middle of its range, else its one bound. */
export const num = (m: Mention): number | null => m.p ?? (m.pLow != null && m.pHigh != null ? (m.pLow + m.pHigh) / 2 : (m.pLow ?? m.pHigh ?? null));
export const yearOf = (d: string) => +d.slice(0, 4);
/** A date as a decimal year; YYYY and YYYY-MM land mid-period, as the axis rules say. */
export const tOf = (d: string) => {
  const y = +d.slice(0, 4);
  const mo = d.length >= 7 ? +d.slice(5, 7) - 1 : 6;
  const da = d.length >= 10 ? +d.slice(8, 10) : 15;
  return y + (mo + da / 31) / 12;
};
export const monthT = (m: string) => +m.slice(0, 4) + (+m.slice(5) - 0.5) / 12;

export const fmtP = (p: number) => (p > 99.9 && p < 100 ? `${+p.toFixed(6)}` : p >= 10 ? `${Math.round(p * 10) / 10}` : p >= 1 ? `${Math.round(p * 100) / 100}` : `${+p.toPrecision(2)}`).replace(/\.0$/, "") + "%";
export const fmtN = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);
export const fmtFull = (n: number) => Math.round(n).toLocaleString("en-GB");

export function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
export function summary(values: number[]) {
  const s = values.slice().sort((a, b) => a - b);
  return { n: s.length, min: s[0] ?? null, q1: quantile(s, 0.25), median: quantile(s, 0.5), q3: quantile(s, 0.75), max: s.at(-1) ?? null };
}

export function niceTicks(min: number, max: number, n = 5): number[] {
  const span = max - min || 1;
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => span / s <= n) ?? mag * 10;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

/**
 * Horizons as the sources give them, folded into four bands so numbers with
 * different deadlines are not read against each other. The raw wording stays
 * in the tooltip and the table.
 */
export type Horizon = "decade" | "century" | "conditional" | "none";
export const HORIZON_LABEL: Record<Horizon, string> = {
  decade: "Within about ten years",
  century: "Within a century or so",
  conditional: "If or once advanced AI is built",
  none: "No horizon given",
};
export const HORIZON_ORDER: Horizon[] = ["decade", "century", "conditional", "none"];
export function horizonOf(h?: string): Horizon {
  const s = (h ?? "").toLowerCase();
  if (!s || /unspecified|undefined/.test(s)) return "none";
  if (/by 20[2-4]\d|this decade|next decade|within (the next )?(10|ten) years|within 10 years|nearcast|very soon|during the crisis|trinity/.test(s)) return "decade";
  if (/by 20[5-9]\d|by 2100|hundred years|100 years|within (30|500) years|century/.test(s)) return "century";
  if (/conditional|if |once |built|race to|long-run|human-level|superintelligence|current methods/.test(s)) return "conditional";
  return "none";
}

/** Probability axis: linear 0–100, or log from the floor to 100 with zeros parked on the floor. */
export const LOG_FLOOR = 0.01;
export function pScale(scale: "linear" | "log", y0: number, y1: number) {
  if (scale === "linear") return { y: (p: number) => y0 + (1 - p / 100) * (y1 - y0), ticks: [0, 25, 50, 75, 100], label: (p: number) => `${p}%` };
  const lo = Math.log10(LOG_FLOOR);
  const hi = 2;
  return {
    y: (p: number) => y0 + (1 - (Math.log10(Math.max(p, LOG_FLOOR)) - lo) / (hi - lo)) * (y1 - y0),
    ticks: [0.01, 0.1, 1, 10, 100],
    label: (p: number) => (p < 1 ? `${p}%` : `${p}%`),
  };
}

/** Resolved design tokens, read once and again when the theme class flips. */
export function useTokens() {
  const [tok, setTok] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const o: Record<string, string> = {};
      for (const v of ["--text", "--muted", "--bg", "--panel", "--accent", "--font-heading", "--ds-cat-1", "--ds-cat-2", "--ds-cat-3", "--ds-cat-4", "--ds-cat-5"]) o[v] = cs.getPropertyValue(v).trim();
      setTok(o);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return tok;
}

export type Look = "rule" | "grid" | "ink";

export type Colours = {
  text: string;
  muted: string;
  bg: string;
  panel: string;
  accent: string;
  font: string;
  cat: string[];
  group: Record<Group, string>;
  /** One colour per attention source, fixed across every panel. */
  src: { hn: string; lw: string; wiki: string; gdelt: string; openalex: string; manifold: string };
  dark: boolean;
};

export function coloursFrom(tok: Record<string, string>, look: Look = "rule"): Colours {
  const bg = tok["--bg"] || "#f4efe4";
  const ink = tok["--text"] || "#17181b";
  const accent = tok["--accent"] || "#3786c3";
  // the ink look: one colour family, tints of the page ink for identity, the accent kept for the one highlight
  const tint = (pct: number) => `color-mix(in oklab, ${ink} ${pct}%, ${bg})`;
  const cat = look === "ink" ? [tint(100), tint(62), tint(40), tint(26), tint(80)] : [1, 2, 3, 4, 5].map((i) => tok[`--ds-cat-${i}`] || ["#3786c3", "#bb6546", "#a067ac", "#9c7c0b", "#00977c"][i - 1]);
  return {
    text: tok["--text"] || "#17181b",
    muted: tok["--muted"] || "#63666c",
    bg,
    panel: tok["--panel"] || bg,
    accent,
    font: tok["--font-heading"] ? `${tok["--font-heading"]}, system-ui, sans-serif` : "Archivo, system-ui, sans-serif",
    cat,
    group: { surveys: cat[0], named: cat[1], forum: cat[2], markets: cat[3] },
    src: look === "ink" ? { hn: tint(55), lw: tint(85), wiki: tint(85), gdelt: tint(85), openalex: tint(85), manifold: tint(85) } : { hn: cat[1], lw: cat[2], wiki: cat[0], gdelt: cat[4], openalex: cat[3], manifold: cat[3] },
    dark: typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  };
}

/** Rasterise an SVG panel to a 2x PNG with the surface painted under it. */
export async function downloadSvg(svg: SVGSVGElement | null, name: string, bg: string) {
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const w = svg.viewBox.baseVal.width || svg.clientWidth;
  const h = svg.viewBox.baseVal.height || svg.clientHeight;
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", bg);
  clone.insertBefore(rect, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("svg"));
    img.src = url;
  });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  savePng(canvas, name);
}

export function savePng(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((b) => {
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${name}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

export type Tip = { x: number; y: number; lines: string[] } | null;
export type Ctx = {
  C: Colours;
  show: (e: React.MouseEvent | React.FocusEvent, lines: string[]) => void;
  hide: () => void;
  refs: React.MutableRefObject<Record<string, SVGSVGElement | null>>;
  dl: (key: string) => void;
  scale: "linear" | "log";
};

/**
 * One-dimensional beeswarm: for points along an axis (in pixels) and a dot
 * radius, the vertical offset that keeps every dot clear of its neighbours.
 * Dots stack outwards from the baseline in the order given.
 */
export function beeswarm(xs: number[], r: number): number[] {
  const placed: { x: number; y: number }[] = [];
  const out = new Array<number>(xs.length).fill(0);
  const order = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
  const d = r * 2 + 1;
  for (const i of order) {
    const x = xs[i];
    const near = placed.filter((p) => Math.abs(p.x - x) < d);
    let y = 0;
    for (let k = 0; k < 60; k++) {
      const cand = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (r + 0.5);
      if (near.every((p) => Math.hypot(p.x - x, p.y - cand) >= d)) {
        y = cand;
        break;
      }
      y = cand;
    }
    placed.push({ x, y });
    out[i] = y;
  }
  return out;
}

export const shortWho = (who: string) => who.replace(/\s*\(.*\)$/, "");
