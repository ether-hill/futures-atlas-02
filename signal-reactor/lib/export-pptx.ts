/**
 * PPTX export — native, EDITABLE text (never flattened images), one builder
 * per slide type, driven by the same Deck object as the viewer so they can't
 * diverge. 16:9 (13.333in × 7.5in ≈ 1280×720 @96dpi). The honesty frame is
 * stamped into every slide's footer per the brief's honesty layer.
 */

import type PptxGenJS from "pptxgenjs";
import type { Deck, Severity, Slide } from "./types";
import { HONESTY_LINE, SLIDE_SLUGS } from "./types";
import { toSlug } from "./sectors";

// design tokens — the PAPER (white, print-ready) deck theme, matching the
// viewer's .board overrides (PPTX colors are hex without '#')
const C = {
  bg: "FDFCF8",
  fg: "1B1812",
  muted: "5A554A",
  subtle: "8B8577",
  border: "D6D1C3",
  accent: "A86B10",
  high: "BF4C2B",
  medium: "8F7010",
  low: "587A50",
};
const DISPLAY = "Archivo";
const MONO = "IBM Plex Mono";

const SEV: Record<Severity, string> = { high: C.high, medium: C.medium, low: C.low };
const PAGE = { w: 13.333, h: 7.5, mx: 0.75 };

type PSlide = ReturnType<PptxGenJS["addSlide"]>;

function chrome(s: PSlide, slide: Slide, index: number, total: number): void {
  s.background = { color: C.bg };
  s.addText(SLIDE_SLUGS[slide.type].toUpperCase(), {
    x: PAGE.mx, y: 0.42, w: 6, h: 0.3,
    fontFace: MONO, fontSize: 10, color: C.accent, charSpacing: 2,
  });
  s.addText(`${String(index + 1).padStart(2, "0")} — ${String(total).padStart(2, "0")}`, {
    x: PAGE.w - 2.1 - PAGE.mx, y: 0.42, w: 2.1, h: 0.3,
    fontFace: MONO, fontSize: 10, color: C.subtle, align: "right", charSpacing: 2,
  });
  // honesty footer on EVERY slide (brief §5: stamped into both exports' footers)
  s.addText("SIGNAL REACTOR", {
    x: PAGE.mx, y: 7.02, w: 2.4, h: 0.28,
    fontFace: MONO, fontSize: 7.5, color: C.subtle, charSpacing: 2,
  });
  s.addText(HONESTY_LINE, {
    x: 3.3, y: 7.02, w: PAGE.w - 3.3 - PAGE.mx, h: 0.28,
    fontFace: MONO, fontSize: 7.5, color: C.subtle, align: "right",
  });
}

function accentRule(s: PSlide, x: number, y: number, w: number, color = C.border): void {
  s.addShape("rect", { x, y, w, h: 0.014, fill: { color } });
}

function cover(s: PSlide, sl: Extract<Slide, { type: "cover" }>, deck: Deck): void {
  s.addText(sl.sector, {
    x: PAGE.mx, y: 1.15, w: PAGE.w - PAGE.mx * 2, h: 2.2,
    fontFace: DISPLAY, fontSize: 48, bold: true, color: C.fg, charSpacing: -1, lineSpacing: 46,
    valign: "top", fit: "shrink",
  });
  s.addText(sl.one, {
    x: PAGE.mx, y: 3.5, w: 9.6, h: 1.6,
    fontFace: DISPLAY, fontSize: 17, color: C.muted, lineSpacing: 24, valign: "top",
  });
  // honesty stamp (ember bar + line)
  s.addShape("rect", { x: PAGE.mx, y: 5.65, w: 0.03, h: 0.55, fill: { color: C.accent } });
  s.addText(HONESTY_LINE, {
    x: PAGE.mx + 0.15, y: 5.65, w: 6.6, h: 0.55,
    fontFace: MONO, fontSize: 8.5, color: C.subtle, lineSpacing: 12, valign: "middle",
  });
  // verdict stamp
  s.addShape("rect", {
    x: 9.4, y: 5.68, w: 3.15, h: 0.5,
    fill: { color: C.bg }, line: { color: C.border, width: 1 },
  });
  s.addText([
    { text: "QUANTUM VERDICT — ", options: { color: C.muted } },
    { text: sl.verdict.toUpperCase(), options: { color: C.accent } },
  ], {
    x: 9.4, y: 5.68, w: 3.15, h: 0.5,
    fontFace: MONO, fontSize: 9.5, align: "center", valign: "middle", charSpacing: 1.5,
  });
  s.addText(`${deck.generatedAt.slice(0, 10)} · prompt v${deck.promptVersion} · ${deck.mode}`, {
    x: 8, y: 6.55, w: 4.58, h: 0.28,
    fontFace: MONO, fontSize: 8, color: C.subtle, align: "right",
  });
}

function signal(s: PSlide, sl: Extract<Slide, { type: "signal" }>): void {
  const colW = 5.55;
  const x2 = PAGE.w - PAGE.mx - colW;
  s.addText("THE HYPE", { x: PAGE.mx, y: 1.1, w: colW, h: 0.3, fontFace: MONO, fontSize: 9, color: C.subtle, charSpacing: 2 });
  s.addText(sl.hype, {
    x: PAGE.mx, y: 1.5, w: colW, h: 2.6,
    fontFace: DISPLAY, fontSize: 19, color: C.subtle, strike: true, lineSpacing: 26, valign: "top",
  });
  s.addText("THE SUBSTANCE", { x: x2, y: 1.1, w: colW, h: 0.3, fontFace: MONO, fontSize: 9, color: C.subtle, charSpacing: 2 });
  s.addText(sl.substance, {
    x: x2, y: 1.5, w: colW, h: 2.6,
    fontFace: DISPLAY, fontSize: 19, color: C.fg, lineSpacing: 26, valign: "top",
  });
  accentRule(s, PAGE.mx, 4.75, colW);
  s.addText(`QUANTUM — ${sl.verdict.toUpperCase()}`, { x: PAGE.mx, y: 4.9, w: colW, h: 0.3, fontFace: MONO, fontSize: 9, color: C.subtle, charSpacing: 2 });
  s.addText(sl.qnote, { x: PAGE.mx, y: 5.25, w: colW, h: 1.2, fontFace: DISPLAY, fontSize: 12.5, color: C.muted, lineSpacing: 18, valign: "top" });
  accentRule(s, x2, 4.75, colW, C.accent);
  s.addText("WHERE THE REAL DISRUPTION LANDS", { x: x2, y: 4.9, w: colW, h: 0.3, fontFace: MONO, fontSize: 9, color: C.accent, charSpacing: 2 });
  s.addText(sl.ainote, { x: x2, y: 5.25, w: colW, h: 1.2, fontFace: DISPLAY, fontSize: 12.5, color: C.muted, lineSpacing: 18, valign: "top" });
}

function horizons(s: PSlide, sl: Extract<Slide, { type: "horizons" }>): void {
  const cols = [
    { range: "Now—2028", text: sl.near },
    { range: "2028—2035", text: sl.mid },
    { range: "2035+", text: sl.far },
  ];
  const w = 3.7, gap = 0.36;
  cols.forEach((c, i) => {
    const x = PAGE.mx + i * (w + gap);
    if (i > 0) s.addShape("rect", { x: x - gap / 2, y: 1.2, w: 0.012, h: 4.6, fill: { color: C.border } });
    s.addText(c.range, { x, y: 1.25, w, h: 0.5, fontFace: MONO, fontSize: 19, color: C.accent, charSpacing: -0.5 });
    s.addText(c.text, { x, y: 2.0, w, h: 3.8, fontFace: DISPLAY, fontSize: 14, color: C.fg, lineSpacing: 21, valign: "top" });
  });
}

function vectors(s: PSlide, sl: Extract<Slide, { type: "vectors" }>): void {
  sl.vectors.forEach((v, i) => {
    const y = 1.25 + i * 1.06;
    if (i > 0) accentRule(s, PAGE.mx, y - 0.14, PAGE.w - PAGE.mx * 2);
    s.addText(v.area, { x: PAGE.mx, y, w: 2.9, h: 0.8, fontFace: DISPLAY, fontSize: 15, bold: true, color: C.fg, valign: "top" });
    s.addText(v.note, { x: 3.85, y: y + 0.03, w: 6.7, h: 0.8, fontFace: DISPLAY, fontSize: 11.5, color: C.muted, lineSpacing: 15, valign: "top" });
    s.addText(v.severity.toUpperCase(), {
      x: 10.7, y: y + 0.02, w: 1.05, h: 0.3, fontFace: MONO, fontSize: 8.5, color: SEV[v.severity], align: "right", charSpacing: 1.5,
    });
    const ticks: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
    for (let t = 0; t < 3; t++) {
      s.addShape("rect", {
        x: 11.85 + t * 0.24, y: y + 0.08, w: 0.18, h: 0.07,
        fill: { color: t < ticks[v.severity] ? SEV[v.severity] : C.border },
      });
    }
  });
}

function numbered(s: PSlide, items: string[], big: boolean): void {
  const step = items.length > 4 ? 1.02 : 1.18;
  items.forEach((t, i) => {
    const y = 1.3 + i * step;
    if (i > 0) accentRule(s, PAGE.mx, y - 0.16, PAGE.w - PAGE.mx * 2);
    s.addText(String(i + 1).padStart(2, "0"), { x: PAGE.mx, y, w: 0.7, h: 0.5, fontFace: MONO, fontSize: 12, color: C.accent });
    s.addText(t, {
      x: 1.6, y, w: PAGE.w - 1.6 - PAGE.mx, h: step - 0.2,
      fontFace: DISPLAY, fontSize: big ? 16.5 : 14.5, color: C.fg, lineSpacing: big ? 22 : 19, valign: "top",
    });
  });
}

function assumptions(s: PSlide, sl: Extract<Slide, { type: "assumptions" }>): void {
  sl.items.forEach((a, i) => {
    const y = 1.3 + i * 1.72;
    if (i > 0) accentRule(s, PAGE.mx, y - 0.22, PAGE.w - PAGE.mx * 2);
    s.addText(a.claim, { x: PAGE.mx, y, w: 9.3, h: 0.55, fontFace: DISPLAY, fontSize: 17, bold: true, color: C.fg, valign: "top" });
    if (a.provenance) {
      s.addShape("rect", { x: 11.0, y: y + 0.03, w: 1.55, h: 0.32, fill: { color: C.bg }, line: { color: C.border, width: 0.75 } });
      s.addText(a.provenance.toUpperCase(), {
        x: 11.0, y: y + 0.03, w: 1.55, h: 0.32, fontFace: MONO, fontSize: 7.5, color: C.subtle, align: "center", valign: "middle", charSpacing: 1.5,
      });
    }
    s.addText("TRUE ONLY IF", { x: PAGE.mx, y: y + 0.62, w: 1.35, h: 0.3, fontFace: MONO, fontSize: 8.5, color: C.accent, charSpacing: 1.5 });
    s.addText(a.condition, { x: 2.2, y: y + 0.58, w: 10.1, h: 0.7, fontFace: DISPLAY, fontSize: 12.5, color: C.muted, lineSpacing: 17, valign: "top" });
  });
}

function monday(s: PSlide, sl: Extract<Slide, { type: "monday" }>): void {
  sl.items.forEach((t, i) => {
    const y = 1.45 + i * 1.55;
    if (i > 0) accentRule(s, PAGE.mx, y - 0.28, PAGE.w - PAGE.mx * 2);
    s.addShape("rect", { x: PAGE.mx, y: y + 0.04, w: 0.22, h: 0.22, fill: { color: C.bg }, line: { color: C.accent, width: 1.75 } });
    s.addText(t, {
      x: 1.6, y, w: PAGE.w - 1.6 - PAGE.mx, h: 1.2,
      fontFace: DISPLAY, fontSize: 18, color: C.fg, lineSpacing: 25, valign: "top",
    });
  });
}

export async function buildPptx(deck: Deck): Promise<void> {
  const { default: PptxGen } = await import("pptxgenjs");
  const p = new PptxGen();
  p.defineLayout({ name: "SR_WIDE", width: PAGE.w, height: PAGE.h });
  p.layout = "SR_WIDE";
  p.author = "Signal Reactor — Futures Atlas";
  p.title = `Signal Reactor — ${deck.sector}`;
  p.subject = HONESTY_LINE;

  const total = deck.slides.length;
  deck.slides.forEach((slide, i) => {
    const s = p.addSlide();
    chrome(s, slide, i, total);
    switch (slide.type) {
      case "cover": cover(s, slide, deck); break;
      case "signal": signal(s, slide); break;
      case "horizons": horizons(s, slide); break;
      case "vectors": vectors(s, slide); break;
      case "considerations": numbered(s, slide.items, true); break;
      case "discussion": numbered(s, slide.items, false); break;
      case "assumptions": assumptions(s, slide); break;
      case "monday": monday(s, slide); break;
    }
  });

  await p.writeFile({ fileName: `signal-reactor-${toSlug(deck.sector)}.pptx` });
}
