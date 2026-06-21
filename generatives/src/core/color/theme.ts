// Theme palettes — OKLCH control points sampled in OKLab so every piece can be
// brand-matched to the futures project. A Palette maps t∈[0,1] → colour.

import { oklchToOklab, oklabToRgb, rgbToCss, hexToOklch, type Rgb } from "./oklch";

export interface Colors {
  bg: string;
  lo: string;
  hi: string;
}

export interface Stop {
  L: number;
  C: number;
  h: number;
}
export interface Palette {
  id: string;
  label: string;
  stops: Stop[];
  bg: string; // backdrop css
}

const S = (L: number, C: number, h: number): Stop => ({ L, C, h });

export const PALETTES: Record<string, Palette> = {
  "quantum-ink": {
    id: "quantum-ink",
    label: "Quantum Ink",
    bg: "#05070d",
    stops: [S(0.16, 0.07, 265), S(0.42, 0.16, 270), S(0.64, 0.16, 215), S(0.82, 0.15, 190), S(0.95, 0.1, 160)],
  },
  aurora: {
    id: "aurora",
    label: "Aurora",
    bg: "#04080a",
    stops: [S(0.18, 0.06, 200), S(0.5, 0.16, 165), S(0.72, 0.18, 150), S(0.86, 0.16, 120), S(0.96, 0.12, 95)],
  },
  spectral: {
    id: "spectral",
    label: "Spectral",
    bg: "#08060c",
    stops: [S(0.2, 0.16, 300), S(0.45, 0.2, 260), S(0.62, 0.19, 200), S(0.76, 0.2, 130), S(0.9, 0.2, 70), S(0.96, 0.18, 35)],
  },
  ember: {
    id: "ember",
    label: "Ember",
    bg: "#0a0604",
    stops: [S(0.12, 0.05, 30), S(0.4, 0.16, 35), S(0.64, 0.2, 55), S(0.84, 0.16, 80), S(0.97, 0.06, 95)],
  },
  mono: {
    id: "mono",
    label: "Mono",
    bg: "#060708",
    stops: [S(0.12, 0.01, 250), S(0.4, 0.015, 250), S(0.68, 0.02, 250), S(0.9, 0.01, 250), S(0.99, 0, 250)],
  },
};

export const PALETTE_IDS = Object.keys(PALETTES);
export const getPalette = (id: string): Palette => PALETTES[id] ?? PALETTES["quantum-ink"]!;

/** Default colours mirror the quantum-ink palette (the app's brand-blue look). */
export const DEFAULT_COLORS: Colors = { bg: "#05070d", lo: "#2a3a8f", hi: "#9fe7ff" };

/** Build a live palette from three picked colours: bg (dark) → lo → hi (bright).
 *  Every piece samples this, so the colour pickers re-skin the whole gallery. */
export function makePaletteFromColors(c: Colors): Palette {
  const bg = hexToOklch(c.bg);
  const lo = hexToOklch(c.lo);
  const hi = hexToOklch(c.hi);
  return {
    id: "custom",
    label: "Custom",
    bg: c.bg,
    stops: [
      { L: bg.L, C: bg.C, h: bg.h },
      { L: lo.L, C: lo.C, h: lo.h },
      { L: hi.L, C: hi.C, h: hi.h },
    ],
  };
}

/** Sample a palette at t∈[0,1] → Rgb, interpolated in OKLab. */
export function sample(palette: Palette, t: number): Rgb {
  const stops = palette.stops;
  const x = (t < 0 ? 0 : t > 1 ? 1 : t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = oklchToOklab(stops[i]!.L, stops[i]!.C, stops[i]!.h);
  const b = oklchToOklab(stops[i + 1]!.L, stops[i + 1]!.C, stops[i + 1]!.h);
  return oklabToRgb(a.L + (b.L - a.L) * f, a.a + (b.a - a.a) * f, a.b + (b.b - a.b) * f);
}

export const sampleCss = (palette: Palette, t: number): string => rgbToCss(sample(palette, t));
