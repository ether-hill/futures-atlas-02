/**
 * Social Studio canvas engine — pure drawing functions shared by the live
 * preview, the library thumbnails, and the PNG / GIF / video exporters.
 *
 * Every frame kind has a renderer that echoes the look of the matching page
 * section (mosaic hero, serpentine timeline, video grid, press grid, profile
 * banner, stat card, etc.). Motion is applied per-tick via a `MotionState`
 * so the same renderer drives stills and animated reels.
 */

import type { ComposerFrame } from "@/lib/composer/source";

export type Placement = "top" | "middle" | "bottom";
export type Align = "left" | "center" | "right";
export type LayoutId = "full-bleed" | "card" | "split" | "circle";
export const LAYOUTS: Array<{ id: LayoutId; label: string }> = [
  { id: "full-bleed", label: "Full bleed" },
  { id: "card", label: "Card" },
  { id: "split", label: "Split screen" },
  { id: "circle", label: "Image in circle" },
];
export type Style = { bgColor: string; textColor: string; sizeMul: number; placement: Placement; align: Align; layout: LayoutId };
export type RevealMode = "all" | "char" | "word";
export type MotionState = { scale: number; dx: number; dy: number; textProgress: number; textRise: number; reveal: number; revealMode: RevealMode; highlight: boolean };
export const STILL: MotionState = { scale: 1, dx: 0, dy: 0, textProgress: 1, textRise: 0, reveal: 1, revealMode: "all", highlight: false };

// Futures Atlas blue accent — sRGB hex of oklch(0.64 0.13 245). Canvas needs a
// literal colour string (no CSS vars), so this mirrors --color-oxblood.
export const ACCENT = "#3B93D5";
export type ImageGetter = (url: string | null | undefined) => HTMLImageElement | null;
export type VideoGetter = (url: string | null | undefined) => HTMLVideoElement | null;

/* Route remote images through the same-origin proxy so the canvas can export. */
export function proxy(url: string): string {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/")) return url;
  return `/api/social-composer/img?u=${encodeURIComponent(url)}`;
}

/* ─── text utils ─────────────────────────────────────────────────────── */

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, font: string, maxLines: number): string[] {
  ctx.font = font;
  const words = (text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) {
        let rest = cur;
        for (let i = words.indexOf(w) + 1; i < words.length; i++) rest += ` ${words[i]}`;
        while (ctx.measureText(rest + "…").width > maxW && rest.length > 0) rest = rest.slice(0, -1);
        lines.push(rest ? rest + "…" : rest);
        return lines;
      }
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Per-line substrings for a progressive reveal (typewriter / word cascade). */
function revealCut(lines: string[], reveal: number, mode: RevealMode): string[] {
  if (mode === "all" || reveal >= 1) return lines;
  if (mode === "word") {
    const total = lines.reduce((a, l) => a + l.split(" ").length, 0);
    let show = Math.ceil(total * reveal);
    return lines.map((l) => { const ws = l.split(" "); const take = Math.max(0, Math.min(ws.length, show)); show -= take; return ws.slice(0, take).join(" "); });
  }
  const total = lines.reduce((a, l) => a + l.length, 0);
  let show = Math.ceil(total * reveal);
  return lines.map((l) => { const take = Math.max(0, Math.min(l.length, show)); show -= take; return l.slice(0, take); });
}

/** Paint headline lines with optional progressive reveal + accent highlight. */
function paintLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lh: number, m: MotionState, color: string, align: Align) {
  const cut = revealCut(lines, m.reveal, m.revealMode);
  ctx.textAlign = "left";
  // Type On · Blue: one even highlight band per line. Derive the glyph extent
  // (cap-top → descender) from font metrics so the blue fills the type area
  // uniformly with equal padding, instead of a fixed line-height fraction.
  let band: { top: number; height: number; padX: number } | null = null;
  if (m.highlight) {
    const ref = ctx.measureText("HgyÅ");
    const asc = ref.actualBoundingBoxAscent;   // top alignment line → glyph top
    const desc = ref.actualBoundingBoxDescent; // top alignment line → glyph bottom
    const padV = lh * 0.10;
    if (Number.isFinite(asc) && Number.isFinite(desc) && desc - -asc > 0) {
      band = { top: -asc - padV, height: (desc + asc) + padV * 2, padX: lh * 0.13 };
    } else {
      band = { top: lh * 0.0, height: lh, padX: lh * 0.13 };
    }
  }
  // Two passes when highlighting: every band, THEN every glyph. Interleaving
  // them let line i+1's band paint over line i's descenders (clipped p/q/y
  // bottoms mid-animation) — the blue must always sit behind the letters.
  const placed: { shown: string; tx: number; ty: number; tw: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const shown = cut[i] ?? "";
    if (!shown) continue;
    const ly = y + i * lh;
    const tw = ctx.measureText(shown).width;
    const tx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
    placed.push({ shown, tx, ty: ly, tw });
  }
  if (band) {
    ctx.fillStyle = ACCENT;
    for (const p of placed) ctx.fillRect(p.tx - band.padX, p.ty + band.top, p.tw + band.padX * 2, band.height);
  }
  ctx.fillStyle = band ? "#F4EFE6" : color;
  for (const p of placed) ctx.fillText(p.shown, p.tx, p.ty);
}

/** Hex → "r,g,b" triplet for building rgba() gradient stops. */
function rgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "8,7,10";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// Composed posts use the Futures Atlas type families: Archivo for the headline
// ("main" voice) and IBM Plex Mono for sub-text/labels. next/font registers them
// under generated names exposed on CSS vars (--ff-display = Archivo, --ff-docket
// = IBM Plex Mono), so read those at runtime — the raw names aren't registered
// and would fall back.
let _faFonts: { heading: string; mono: string } | null = null;
function faFonts() {
  if (_faFonts) return _faFonts;
  if (typeof document === "undefined") return { heading: "system-ui, sans-serif", mono: "ui-monospace, monospace" };
  const cs = getComputedStyle(document.documentElement);
  const display = cs.getPropertyValue("--ff-display").trim();
  const docket = cs.getPropertyValue("--ff-docket").trim();
  _faFonts = {
    heading: display ? `${display}, "Archivo", system-ui, sans-serif` : `"Archivo", system-ui, sans-serif`,
    mono: docket ? `${docket}, "IBM Plex Mono", ui-monospace, monospace` : `"IBM Plex Mono", ui-monospace, monospace`,
  };
  return _faFonts;
}

// Headline / main composed text — Archivo (Bold by default).
function heading(px: number, weight = 700, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${px}px ${faFonts().heading}`;
}
function mono(px: number, weight = 500) {
  return `${weight} ${px}px ${faFonts().mono}`;
}

type Drawable = HTMLImageElement | HTMLCanvasElement;
function coverInto(ctx: CanvasRenderingContext2D, img: Drawable, dx: number, dy: number, dw: number, dh: number, scale = 1, ox = 0, oy = 0) {
  const ir = img.width / img.height;
  const dr = dw / dh;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > dr) { sw = img.height * dr; sx = (img.width - sw) / 2; }
  else { sh = img.width / dr; sy = (img.height - sh) / 2; }
  // zoom around centre + drift offset
  const zw = sw / scale, zh = sh / scale;
  sx += (sw - zw) / 2 + ox * sw; sy += (sh - zh) / 2 + oy * sh;
  ctx.drawImage(img, Math.max(0, sx), Math.max(0, sy), Math.min(zw, img.width), Math.min(zh, img.height), dx, dy, dw, dh);
}

function placeholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#16140F";
  ctx.fillRect(x, y, w, h);
}

/**
 * Flatten a set of thumbnail URLs into ONE offscreen canvas (a single image),
 * cached by URL-set + how many have loaded. Once flattened, the mosaic is
 * treated like any photo — it scales/zooms smoothly instead of per-tile.
 */
const flatCache = new Map<string, { canvas: HTMLCanvasElement; count: number }>();
function flattenMosaic(urls: string[], getImg: ImageGetter): HTMLCanvasElement | null {
  if (typeof document === "undefined" || urls.length === 0) return null;
  const loaded = urls.map((u) => getImg(u));
  const count = loaded.reduce((a, im) => a + (im ? 1 : 0), 0);
  const key = `${urls.length}:${urls.join(",")}`;
  const cached = flatCache.get(key);
  if (cached && cached.count === count) return cached.canvas;
  const FW = 1280, FH = 1600;
  const canvas = cached?.canvas ?? document.createElement("canvas");
  canvas.width = FW; canvas.height = FH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#08070A"; ctx.fillRect(0, 0, FW, FH);
  const cols = 4;
  const tileW = Math.ceil(FW / cols);
  const tileH = Math.round(tileW * 0.62);
  const rows = Math.ceil(FH / tileH);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const img = loaded[k % loaded.length];
    const x = c * tileW, y = r * tileH;
    if (img) coverInto(ctx, img, x, y, tileW, tileH);
    else { ctx.fillStyle = "#16140F"; ctx.fillRect(x, y, tileW, tileH); }
    ctx.strokeStyle = "rgba(8,7,10,0.55)"; ctx.lineWidth = 2; ctx.strokeRect(x, y, tileW, tileH);
    k++;
  }
  // Bake a mild dim so headline text always reads over the texture.
  ctx.fillStyle = "rgba(8,7,10,0.38)"; ctx.fillRect(0, 0, FW, FH);
  flatCache.set(key, { canvas, count });
  return canvas;
}

// The on-canvas wordmark + category label were removed per design — slides
// carry only their own content now. Kept as a no-op so call sites are stable.
function wordmark(ctx: CanvasRenderingContext2D, w: number, padX: number, padY: number, color: string, label?: string) {
  void [ctx, w, padX, padY, color, label];
}


/**
 * Draw tracked-out text without touching canvas state.
 *
 * `ctx.letterSpacing` looks like the obvious tool and is a trap: it is part of
 * the drawing state, so it survives past the call that set it and silently
 * widens every later line — a spaced eyebrow made the headline beneath it
 * overflow its own wrap, because the wrap measured unspaced text and the paint
 * drew spaced text. Advancing character by character keeps the effect local
 * and measurable, and behaves the same in every browser and in export.
 */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, track: number): number {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + track;
  return Math.max(0, w - track);
}

function fillTracked(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, track: number, align: Align,
) {
  const total = trackedWidth(ctx, text, track);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + track;
  }
  ctx.textAlign = prev;
}

/**
 * The four lines of copy a frame can carry, in the order they are set.
 *
 * Every one except the headline is optional, and an empty one takes NO space:
 * the block is measured from what is actually there, so a frame with only a
 * headline sits exactly where a headline alone should sit rather than floating
 * against a gap left for text that was never written.
 */
export type Copy = { eyebrow?: string; headline: string; headline2?: string; sub?: string };

/**
 * Copy laid out inside a region [rx,ry,rw,rh], with generous safe-area padding
 * (~10% of the region) so text never crowds the edges.
 *
 * The voices, largest to smallest: EYEBROW, small and tracked out; the
 * headline; a second headline, bold but smaller, for the line that qualifies
 * the first; then sub-text in mono. Gaps are proportional to the type they
 * follow, so the rhythm holds at every aspect and type size.
 */
function textBlock(
  ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number,
  copy: Copy, style: Style, m: MotionState,
) {
  const padX = Math.round(rw * 0.1);
  const padY = Math.round(rh * 0.1);
  const portrait = rh > rw;
  const maxW = rw - padX * 2;

  const eyebrow = (copy.eyebrow ?? "").trim();
  const headline = copy.headline ?? "";
  const headline2 = (copy.headline2 ?? "").trim();
  const sub = (copy.sub ?? "").trim();

  // Eyebrow — the smallest voice on the frame, tracked out so it reads as a
  // label rather than a short sentence. One line only; it is a tag, not copy.
  const eSize = Math.max(11, Math.round(rw * 0.019 * style.sizeMul));
  const eFont = mono(eSize, 600);
  const eTrack = Math.round(eSize * 0.14);
  // Measured with the tracking included, so a long eyebrow is trimmed to the
  // width it will actually occupy rather than the width it would unspaced.
  let eText = eyebrow ? eyebrow.toUpperCase() : "";
  if (eText) {
    ctx.font = eFont;
    while (eText.length > 1 && trackedWidth(ctx, eText, eTrack) > maxW) eText = eText.slice(0, -1);
  }
  const eLines = eText ? [eText] : [];
  const eLh = Math.round(eSize * 1.3);
  const eBlock = eLines.length ? eLines.length * eLh : 0;

  const hSize = Math.round(rw * 0.075 * style.sizeMul);
  const hFont = heading(hSize);
  const hLines = wrap(ctx, headline, maxW, hFont, portrait ? 14 : 10);
  const hLh = Math.round(hSize * 1.06);
  const hBlock = hLines.length * hLh;

  // Second headline — the same bold voice, stepped down. Big enough to still
  // be a headline, small enough that it cannot be mistaken for the first.
  const h2Size = Math.round(hSize * 0.62);
  const h2Font = heading(h2Size);
  const h2Lines = headline2 ? wrap(ctx, headline2, maxW, h2Font, portrait ? 8 : 6) : [];
  const h2Lh = Math.round(h2Size * 1.12);
  const h2Block = h2Lines.length ? h2Lines.length * h2Lh : 0;

  const aSize = Math.round(rw * 0.034);
  const aFont = mono(aSize);
  const aLines = sub ? wrap(ctx, sub, maxW, aFont, 10) : [];
  const aLh = Math.round(aSize * 1.4);
  const aBlock = aLines.length ? aLines.length * aLh : 0;

  // Gaps belong to the thing above them, so an empty field removes its own
  // gap with it and nothing has to special-case which fields are present.
  const gapAfterE = eBlock ? Math.round(eSize * 1.05) : 0;
  const gapAfterH = h2Block ? Math.round(hSize * 0.34) : 0;
  const gapBeforeSub = aBlock ? Math.round(hSize * 0.5) : 0;

  const totalH = eBlock + gapAfterE + hBlock + gapAfterH + h2Block + gapBeforeSub + aBlock;

  let y: number;
  if (style.placement === "top") y = ry + padY;
  else if (style.placement === "bottom") y = ry + rh - padY - totalH;
  else y = ry + Math.max(padY, (rh - totalH) / 2);

  const anchorX = style.align === "center" ? rx + rw / 2 : style.align === "right" ? rx + rw - padX : rx + padX;
  const rise = (1 - m.textProgress) * rh * 0.05 * m.textRise;
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  ctx.translate(0, rise);
  ctx.textBaseline = "top";

  if (eLines.length) {
    ctx.font = eFont;
    ctx.fillStyle = style.textColor;
    ctx.globalAlpha = m.textProgress * 0.72;
    ctx.textAlign = style.align;
    // Letter-spacing is not on every canvas implementation, so it is set when
    // available and simply skipped when it is not — the eyebrow still reads.
    eLines.forEach((ln, i) => fillTracked(ctx, ln, anchorX, y + i * eLh, eTrack, style.align));
    ctx.textAlign = "left";
    ctx.globalAlpha = m.textProgress;
    y += eBlock + gapAfterE;
  }

  ctx.font = hFont;
  paintLines(ctx, hLines, anchorX, y, hLh, m, style.textColor, style.align);
  y += hBlock;

  if (h2Lines.length) {
    y += gapAfterH;
    ctx.font = h2Font;
    ctx.fillStyle = style.textColor;
    ctx.globalAlpha = m.textProgress * 0.92;
    ctx.textAlign = style.align;
    h2Lines.forEach((ln, i) => ctx.fillText(ln, anchorX, y + i * h2Lh));
    ctx.textAlign = "left";
    ctx.globalAlpha = m.textProgress;
    y += h2Block;
  }

  if (aLines.length) {
    y += gapBeforeSub;
    ctx.font = aFont;
    ctx.fillStyle = style.textColor;
    ctx.globalAlpha = m.textProgress * 0.78;
    ctx.textAlign = style.align;
    aLines.forEach((ln, i) => ctx.fillText(ln, anchorX, y + i * aLh));
    ctx.textAlign = "left";
  }
  ctx.restore();
}

/** Draw an image (or logo on a white panel) into a region, with zoom motion. */
function drawPhoto(ctx: CanvasRenderingContext2D, img: Drawable | null, x: number, y: number, dw: number, dh: number, isLogo: boolean, m: MotionState) {
  if (!img) { placeholder(ctx, x, y, dw, dh); return; }
  if (isLogo) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, dw, dh);
    const pad = Math.round(Math.min(dw, dh) * 0.16);
    const iw = dw - pad * 2, ih = dh - pad * 2, ir = img.width / img.height;
    let rw: number, rh: number;
    if (ir > iw / ih) { rw = iw; rh = iw / ir; } else { rh = ih; rw = ih * ir; }
    ctx.drawImage(img, x + (dw - rw) / 2, y + (dh - rh) / 2, rw, rh);
  } else {
    coverInto(ctx, img, x, y, dw, dh, m.scale, m.dx, m.dy);
  }
}

// Gradient behind the text, tinted with the chosen background colour so the
// Background swatch reads through even on full-bleed photo layouts.
function scrim(ctx: CanvasRenderingContext2D, w: number, h: number, placement: Placement, bgHex: string, strength = 1) {
  const c = rgbTriplet(bgHex);
  let g: CanvasGradient;
  if (placement === "bottom") { g = ctx.createLinearGradient(0, h * 0.3, 0, h); g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${0.86 * strength})`); }
  else if (placement === "top") { g = ctx.createLinearGradient(0, 0, 0, h * 0.7); g.addColorStop(0, `rgba(${c},${0.86 * strength})`); g.addColorStop(1, `rgba(${c},0)`); }
  else { g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${c},${0.3 * strength})`); g.addColorStop(0.5, `rgba(${c},${0.74 * strength})`); g.addColorStop(1, `rgba(${c},${0.3 * strength})`); }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ─── image-backed frames ────────────────────────────────────────────── */

function drawImageFrame(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  img: Drawable | null, isLogo: boolean, label: string,
  copy: Copy, style: Style, m: MotionState,
) {
  void label;
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, w, h);

  if (style.layout === "split") {
    // Image one half, text on the solid-colour other half.
    if (h >= w) {
      const ih = Math.round(h * 0.5);
      drawPhoto(ctx, img, 0, 0, w, ih, isLogo, m);
      textBlock(ctx, 0, ih, w, h - ih, copy, style, m);
    } else {
      const iw = Math.round(w * 0.5);
      drawPhoto(ctx, img, 0, 0, iw, h, isLogo, m);
      textBlock(ctx, iw, 0, w - iw, h, copy, style, m);
    }
    return;
  }
  if (style.layout === "card") {
    // Image on top, text on the solid-colour panel below.
    const ih = Math.round(h * (h >= w ? 0.56 : 0.6));
    drawPhoto(ctx, img, 0, 0, w, ih, isLogo, m);
    textBlock(ctx, 0, ih, w, h - ih, copy, style, m);
    return;
  }
  if (style.layout === "circle") {
    // Image cropped to a centred circle, text below.
    const d = Math.round(Math.min(w, h) * 0.52);
    const cx = w / 2, cy = Math.round(h * 0.3);
    if (img) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      drawPhoto(ctx, img, cx - d / 2, cy - d / 2, d, d, isLogo, m);
      ctx.restore();
      ctx.lineWidth = Math.max(3, Math.round(w * 0.004)); ctx.strokeStyle = ACCENT;
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.stroke();
    }
    const ty = Math.round(cy + d / 2 + h * 0.02);
    textBlock(ctx, 0, ty, w, h - ty, copy, style, m);
    return;
  }
  // full-bleed (default): image fills the canvas, text overlaid on a scrim.
  if (img) {
    drawPhoto(ctx, img, 0, 0, w, h, isLogo, m);
    if (!isLogo) scrim(ctx, w, h, style.placement, style.bgColor);
  }
  textBlock(ctx, 0, 0, w, h, copy, style, m);
}

/** Draw a video cover-fit into a region with zoom motion. Falls back to the
 *  poster image while the video loads, then a placeholder if neither is ready. */
function drawVideoInto(ctx: CanvasRenderingContext2D, vid: HTMLVideoElement | null, poster: HTMLImageElement | null, x: number, y: number, dw: number, dh: number, m: MotionState) {
  const vw = vid?.videoWidth ?? 0, vh = vid?.videoHeight ?? 0;
  if (!vid || vw === 0 || vh === 0) {
    if (poster) { drawPhoto(ctx, poster, x, y, dw, dh, false, m); return; }
    placeholder(ctx, x, y, dw, dh); return;
  }
  const ir = vw / vh, dr = dw / dh;
  let sx = 0, sy = 0, sw = vw, sh = vh;
  if (ir > dr) { sw = vh * dr; sx = (vw - sw) / 2; } else { sh = vw / dr; sy = (vh - sh) / 2; }
  const zw = sw / m.scale, zh = sh / m.scale;
  sx += (sw - zw) / 2 + m.dx * sw; sy += (sh - zh) / 2 + m.dy * sh;
  try { ctx.drawImage(vid, Math.max(0, sx), Math.max(0, sy), Math.min(zw, vw), Math.min(zh, vh), x, y, dw, dh); } catch { /* not ready */ }
}

function drawVideoFrame(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  vid: HTMLVideoElement | null, poster: HTMLImageElement | null, label: string,
  copy: Copy, style: Style, m: MotionState,
) {
  void label;
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, w, h);

  if (style.layout === "split") {
    if (h >= w) {
      const ih = Math.round(h * 0.5);
      drawVideoInto(ctx, vid, poster, 0, 0, w, ih, m);
      textBlock(ctx, 0, ih, w, h - ih, copy, style, m);
    } else {
      const iw = Math.round(w * 0.5);
      drawVideoInto(ctx, vid, poster, 0, 0, iw, h, m);
      textBlock(ctx, iw, 0, w - iw, h, copy, style, m);
    }
    return;
  }
  if (style.layout === "card") {
    const ih = Math.round(h * (h >= w ? 0.56 : 0.6));
    drawVideoInto(ctx, vid, poster, 0, 0, w, ih, m);
    textBlock(ctx, 0, ih, w, h - ih, copy, style, m);
    return;
  }
  if (style.layout === "circle") {
    const d = Math.round(Math.min(w, h) * 0.52);
    const cx = w / 2, cy = Math.round(h * 0.3);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    drawVideoInto(ctx, vid, poster, cx - d / 2, cy - d / 2, d, d, m);
    ctx.restore();
    ctx.lineWidth = Math.max(3, Math.round(w * 0.004)); ctx.strokeStyle = ACCENT;
    ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2); ctx.stroke();
    const ty = Math.round(cy + d / 2 + h * 0.02);
    textBlock(ctx, 0, ty, w, h - ty, copy, style, m);
    return;
  }
  // full-bleed (default): video fills the canvas, text over a scrim.
  drawVideoInto(ctx, vid, poster, 0, 0, w, h, m);
  scrim(ctx, w, h, style.placement, style.bgColor);
  textBlock(ctx, 0, 0, w, h, copy, style, m);
}

/* ─── text frames ────────────────────────────────────────────────────── */

function drawFinding(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  body: string, copy: Copy, style: Style, m: MotionState,
) {
  void body; // body text intentionally not shown — only the copy block
  groundBg(ctx, w, h, style.bgColor, style.textColor, copy.headline, m);
  textBlock(ctx, 0, 0, w, h, copy, style, m);
}

/**
 * Ground for a text-only frame — the fallback when a frame carries no imagery.
 *
 * A flat fill made every scraped section/quote/reference card a black rectangle
 * with words on it. This lays the Atlas hatch plate instead: the base colour, a
 * soft off-centre bloom, fine diagonal hatching and a hairline accent rule along
 * the foot. Everything derives from `seed`, so a given frame always draws the
 * same plate, and neighbouring frames in a carousel differ from each other.
 * Motion drifts the hatch so a still ground still moves in a reel.
 */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function groundBg(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  bgHex: string, textHex: string, seed: string, m: MotionState,
) {
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);
  const r = seedOf(seed);
  const ink = rgbTriplet(textHex);
  // bloom — a wide, very soft lift toward the text colour, placed by the seed
  const cx = w * (0.2 + r * 0.6);
  const cy = h * (0.18 + ((r * 7) % 1) * 0.5);
  const rad = Math.max(w, h) * (0.7 + ((r * 13) % 1) * 0.35);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  g.addColorStop(0, `rgba(${ink},0.13)`);
  g.addColorStop(0.55, `rgba(${ink},0.04)`);
  g.addColorStop(1, `rgba(${ink},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // hatch — 45° hairlines, drifting with the frame's motion
  const step = Math.max(9, Math.round(w * 0.017));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.translate(m.dx * w * 0.5, m.dy * h * 0.5);
  ctx.strokeStyle = `rgba(${ink},0.08)`;
  ctx.lineWidth = Math.max(1, w / 1080);
  ctx.beginPath();
  for (let x = -h - step; x < w + step; x += step) { ctx.moveTo(x, h + step); ctx.lineTo(x + h + step, -step); }
  ctx.stroke();
  ctx.restore();
  // foot rule in the accent
  const ruleH = Math.max(3, Math.round(h * 0.004));
  ctx.fillStyle = ACCENT;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(0, h - ruleH, w, ruleH);
  ctx.globalAlpha = 1;
}

/** Mosaic background = the flattened mosaic image, cover-fit, zoomed + dimmed. */
function mosaicBg(ctx: CanvasRenderingContext2D, w: number, h: number, urls: string[], getImg: ImageGetter, m: MotionState, dim = 0.74) {
  ctx.fillStyle = "#08070A";
  ctx.fillRect(0, 0, w, h);
  if (!urls.length) return false;
  const flat = flattenMosaic(urls, getImg);
  if (flat) coverInto(ctx, flat, 0, 0, w, h, m.scale, m.dx, m.dy);
  ctx.fillStyle = `rgba(8,7,10,${dim})`;
  ctx.fillRect(0, 0, w, h);
  return true;
}

function drawCentered(
  ctx: CanvasRenderingContext2D, w: number, h: number, label: string,
  big: string, sub: string, style: Style, quote: boolean, m: MotionState,
  getImg?: ImageGetter, thumbUrls?: string[],
) {
  const onMosaic = !!(thumbUrls && thumbUrls.length && getImg);
  if (onMosaic) mosaicBg(ctx, w, h, thumbUrls!, getImg!, m);
  else groundBg(ctx, w, h, style.bgColor, style.textColor, label + big, m);
  const textCol = style.textColor;
  const padX = Math.round(w * 0.11), padY = Math.round(h * 0.1);
  wordmark(ctx, w, padX, padY, textCol, label);
  const size = Math.round(w * 0.072 * style.sizeMul);
  const display = quote ? `“${big}”` : big;
  const lines = wrap(ctx, display, w - padX * 2, heading(size), h > w ? 16 : 12);
  const lh = Math.round(size * 1.12);
  const subSize = Math.round(w * 0.034);
  const subLh = Math.round(subSize * 1.4);
  const subLines = sub ? wrap(ctx, sub, w - padX * 2, mono(subSize), 10) : [];
  const total = lines.length * lh + (subLines.length ? Math.round(size * 0.8) + subLines.length * subLh : 0) + Math.round(size * 0.6);
  const anchorX = style.align === "left" ? padX : style.align === "right" ? w - padX : w / 2;
  let y = Math.max(padY + size, (h - total) / 2);
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  ctx.translate(0, (1 - m.textProgress) * h * 0.04 * m.textRise);
  y += Math.round(size * 0.6);
  ctx.font = heading(size); ctx.textBaseline = "top";
  paintLines(ctx, lines, anchorX, y, lh, m, textCol, style.align);
  y += lines.length * lh;
  if (subLines.length) {
    y += Math.round(size * 0.8);
    ctx.font = mono(subSize); ctx.globalAlpha = m.textProgress * 0.8; ctx.fillStyle = textCol;
    ctx.textAlign = style.align;
    subLines.forEach((ln, i) => ctx.fillText(ln, anchorX, y + i * subLh));
    ctx.textAlign = "left";
  }
  ctx.restore();
  ctx.textAlign = "left";
}

/** Summary / text-block frame — the same Archivo-bold headline voice as every
 *  other frame (one face across all assets), over an optional mosaic. */
function drawSummary(
  ctx: CanvasRenderingContext2D, w: number, h: number, label: string,
  copy: Copy, style: Style, m: MotionState,
  getImg?: ImageGetter, thumbUrls?: string[],
) {
  const headline = copy.headline;
  const eyebrow = (copy.eyebrow ?? "").trim();
  const headline2 = (copy.headline2 ?? "").trim();
  const sub = (copy.sub ?? "").trim();

  const onMosaic = !!(thumbUrls && thumbUrls.length && getImg);
  if (onMosaic) mosaicBg(ctx, w, h, thumbUrls!, getImg!, m, 0.78);
  else groundBg(ctx, w, h, style.bgColor, style.textColor, label + headline, m);
  const textCol = style.textColor;
  const padX = Math.round(w * 0.11), padY = Math.round(h * 0.1);
  wordmark(ctx, w, padX, padY, textCol, label);
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  ctx.translate(0, (1 - m.textProgress) * h * 0.04 * m.textRise);
  // size shrinks as the text gets longer so long summaries still fit
  const len = headline.length;
  const base = len > 320 ? 0.04 : len > 180 ? 0.05 : 0.062;
  const size = Math.round(w * base * style.sizeMul);
  const lines = wrap(ctx, headline, w - padX * 2, heading(size), h > w ? 24 : 16);
  const lh = Math.round(size * 1.28);

  const eSize = Math.max(11, Math.round(w * 0.019 * style.sizeMul));
  const eLh = Math.round(eSize * 1.3);
  const eTrack = Math.round(eSize * 0.14);
  let eText = eyebrow ? eyebrow.toUpperCase() : "";
  if (eText) {
    ctx.font = mono(eSize, 600);
    while (eText.length > 1 && trackedWidth(ctx, eText, eTrack) > w - padX * 2) eText = eText.slice(0, -1);
  }
  const eLines = eText ? [eText] : [];
  const h2Size = Math.round(size * 0.62);
  const h2Lh = Math.round(h2Size * 1.16);
  const h2Lines = headline2 ? wrap(ctx, headline2, w - padX * 2, heading(h2Size), h > w ? 8 : 6) : [];

  const subSize = Math.round(w * 0.032);
  const subLh = Math.round(subSize * 1.4);
  const subLines = sub ? wrap(ctx, sub, w - padX * 2, mono(subSize), 10) : [];

  // Each optional voice carries its own gap, so a blank field costs no space.
  const eBlock = eLines.length ? eLines.length * eLh + Math.round(eSize * 1.05) : 0;
  const h2Block = h2Lines.length ? h2Lines.length * h2Lh + Math.round(size * 0.34) : 0;
  const subBlock = subLines.length ? subLines.length * subLh + size * 0.5 : 0;
  const total = eBlock + ruleAndBlock(lines.length, lh, subBlock + h2Block, size * 0.5);

  let y = style.placement === "top" ? padY + Math.round(h * 0.08) : style.placement === "bottom" ? h - padY - total : Math.max(padY + size, (h - total) / 2);
  const anchorX = style.align === "center" ? w / 2 : style.align === "right" ? w - padX : padX;

  ctx.textBaseline = "top";
  if (eLines.length) {
    ctx.font = mono(eSize, 600); ctx.fillStyle = textCol;
    ctx.globalAlpha = m.textProgress * 0.72; ctx.textAlign = style.align;
    eLines.forEach((ln, i) => fillTracked(ctx, ln, anchorX, y + i * eLh, eTrack, style.align));
    ctx.textAlign = "left"; ctx.globalAlpha = m.textProgress;
    y += eBlock;
  }

  y += Math.round(size * 0.5);
  ctx.font = heading(size);
  paintLines(ctx, lines, anchorX, y, lh, m, textCol, style.align);
  y += lines.length * lh;

  if (h2Lines.length) {
    y += Math.round(size * 0.34);
    ctx.font = heading(h2Size); ctx.fillStyle = textCol;
    ctx.globalAlpha = m.textProgress * 0.92; ctx.textAlign = style.align;
    h2Lines.forEach((ln, i) => ctx.fillText(ln, anchorX, y + i * h2Lh));
    ctx.textAlign = "left"; ctx.globalAlpha = m.textProgress;
    y += h2Lines.length * h2Lh;
  }

  if (subLines.length) {
    y += Math.round(size * 0.5);
    ctx.font = mono(subSize); ctx.globalAlpha = m.textProgress * 0.78; ctx.fillStyle = textCol;
    ctx.textAlign = style.align;
    subLines.forEach((ln, i) => ctx.fillText(ln, anchorX, y + i * subLh));
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function ruleAndBlock(nLines: number, lh: number, subBlock: number, ruleH: number): number {
  return Math.round(ruleH) + nLines * lh + subBlock;
}

function drawStat(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  value: string, headline: string, sub: string, style: Style, m: MotionState,
) {
  groundBg(ctx, w, h, style.bgColor, style.textColor, value + headline, m);
  const padX = Math.round(w * 0.1);
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  ctx.translate(0, (1 - m.textProgress) * h * 0.04 * m.textRise);
  const vSize = Math.round(w * 0.3);
  const capSize = Math.round(w * 0.05 * style.sizeMul);
  const capLines = wrap(ctx, headline, w - padX * 2, heading(capSize), 6);
  const capLh = Math.round(capSize * 1.2);
  const total = vSize + Math.round(capSize) + capLines.length * capLh;
  let y = (h - total) / 2;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = heading(vSize); ctx.fillStyle = ACCENT;
  ctx.fillText(value, padX, y);
  y += vSize + Math.round(capSize * 0.3);
  ctx.font = heading(capSize); ctx.fillStyle = style.textColor;
  capLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * capLh));
  if (sub) {
    const subSize = Math.round(w * 0.030), subLh = Math.round(subSize * 1.4);
    const subLines = wrap(ctx, sub, w - padX * 2, mono(subSize), 8);
    ctx.font = mono(subSize); ctx.globalAlpha = m.textProgress * 0.7;
    let sy = y + capLines.length * capLh + Math.round(h * 0.015);
    subLines.forEach((ln) => { ctx.fillText(ln, padX, sy); sy += subLh; });
  }
  ctx.restore();
}

function drawTimeline(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  frame: Extract<ComposerFrame, { kind: "timeline" }>, headline: string, style: Style, m: MotionState,
) {
  ctx.fillStyle = style.bgColor; ctx.fillRect(0, 0, w, h);
  const padX = Math.round(w * 0.07), padY = Math.round(h * 0.058);
  wordmark(ctx, w, padX, padY, style.textColor, "Timeline");
  let topY = padY + Math.round(h * 0.06);
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  ctx.font = heading(Math.round(w * 0.07)); ctx.fillStyle = style.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(headline, padX, topY);
  topY += Math.round(w * 0.07) * 1.5;

  const events = frame.events.slice(0, h > w ? 5 : 3);
  const rightX = w * 0.52;
  const railL = w * 0.46, railR = w * 0.48;
  const span = h - topY - padY;
  const step = span / events.length;
  // serpentine red path
  ctx.strokeStyle = ACCENT; ctx.lineWidth = Math.max(3, Math.round(w * 0.006));
  ctx.beginPath();
  events.forEach((_, i) => {
    const cy = topY + step * (i + 0.5);
    const onLeft = i % 2 === 1;
    const nodeX = onLeft ? railL : railR;
    if (i === 0) ctx.moveTo(nodeX, cy);
    else {
      const py = topY + step * (i - 0.5);
      const px = i % 2 === 0 ? railL : railR;
      const mid = (py + cy) / 2;
      ctx.bezierCurveTo(px, mid, nodeX, mid, nodeX, cy);
    }
  });
  ctx.stroke();
  // nodes + text
  events.forEach((ev, i) => {
    const cy = topY + step * (i + 0.5);
    const onLeft = i % 2 === 1;
    const nodeX = onLeft ? railL : railR;
    ctx.beginPath(); ctx.fillStyle = ACCENT; ctx.arc(nodeX, cy, Math.round(w * 0.012), 0, Math.PI * 2); ctx.fill();
    const tx = onLeft ? padX : rightX;
    const tw = onLeft ? railL - padX - w * 0.04 : w - rightX - padX;
    ctx.textAlign = onLeft ? "right" : "left";
    const anchorX = onLeft ? railL - w * 0.05 : rightX;
    ctx.font = mono(Math.round(w * 0.026), 600); ctx.fillStyle = ACCENT; ctx.textBaseline = "top";
    ctx.fillText(ev.date.toUpperCase(), anchorX, cy - step * 0.32);
    const lSize = Math.round(w * 0.044);
    const lLines = wrap(ctx, ev.label, tw, heading(lSize), 2);
    ctx.font = heading(lSize); ctx.fillStyle = style.textColor;
    lLines.forEach((ln, j) => ctx.fillText(ln, anchorX, cy - step * 0.32 + Math.round(w * 0.036) + j * lSize * 1.05));
    void tx;
  });
  ctx.textAlign = "left";
  ctx.restore();
}

function drawVideoGrid(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  frame: Extract<ComposerFrame, { kind: "video-grid" }>, getImg: ImageGetter, style: Style, m: MotionState,
) {
  ctx.fillStyle = style.bgColor; ctx.fillRect(0, 0, w, h);
  const padX = Math.round(w * 0.06), padY = Math.round(h * 0.058);
  wordmark(ctx, w, padX, padY, style.textColor, "Watch");
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  let y = padY + Math.round(h * 0.06);
  ctx.font = heading(Math.round(w * 0.06)); ctx.fillStyle = style.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  const titleLines = wrap(ctx, frame.headline, w - padX * 2, heading(Math.round(w * 0.06)), 2);
  titleLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * Math.round(w * 0.06) * 1.05));
  y += titleLines.length * Math.round(w * 0.06) * 1.1 + Math.round(h * 0.02);
  ctx.strokeStyle = "rgba(236,228,208,0.25)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
  y += Math.round(h * 0.02);

  const cols = 2;
  const gap = Math.round(w * 0.03);
  const cellW = (w - padX * 2 - gap) / cols;
  const cellH = Math.round(cellW * 0.62);
  const items = frame.items.slice(0, 4);
  items.forEach((it, i) => {
    const cx = padX + (i % cols) * (cellW + gap);
    const cy = y + Math.floor(i / cols) * (cellH + Math.round(h * 0.07));
    const img = getImg(it.thumbUrl);
    if (img) coverInto(ctx, img, cx, cy, cellW, cellH, 1, 0, 0); else placeholder(ctx, cx, cy, cellW, cellH);
    ctx.fillStyle = "rgba(8,7,10,0.18)"; ctx.fillRect(cx, cy, cellW, cellH);
    // play button
    const pr = Math.round(cellW * 0.12);
    ctx.beginPath(); ctx.fillStyle = ACCENT; ctx.arc(cx + cellW / 2, cy + cellH / 2, pr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = "#F4EFE6";
    ctx.moveTo(cx + cellW / 2 - pr * 0.32, cy + cellH / 2 - pr * 0.45);
    ctx.lineTo(cx + cellW / 2 - pr * 0.32, cy + cellH / 2 + pr * 0.45);
    ctx.lineTo(cx + cellW / 2 + pr * 0.5, cy + cellH / 2);
    ctx.closePath(); ctx.fill();
    // source + title
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = mono(Math.round(w * 0.02), 600); ctx.fillStyle = ACCENT;
    ctx.fillText(it.source.toUpperCase().slice(0, 28), cx, cy + cellH + Math.round(h * 0.008));
    const tSize = Math.round(w * 0.026);
    const tLines = wrap(ctx, it.title, cellW, heading(tSize), 2);
    ctx.font = heading(tSize); ctx.fillStyle = style.textColor;
    tLines.forEach((ln, j) => ctx.fillText(ln, cx, cy + cellH + Math.round(h * 0.028) + j * tSize * 1.1));
  });
  ctx.restore();
}

function drawPressGrid(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  frame: Extract<ComposerFrame, { kind: "press-grid" }>, getImg: ImageGetter, style: Style, m: MotionState,
) {
  ctx.fillStyle = style.bgColor; ctx.fillRect(0, 0, w, h);
  const padX = Math.round(w * 0.06), padY = Math.round(h * 0.058);
  wordmark(ctx, w, padX, padY, style.textColor, "Press");
  ctx.save();
  ctx.globalAlpha = m.textProgress;
  let y = padY + Math.round(h * 0.06);
  ctx.font = heading(Math.round(w * 0.06)); ctx.fillStyle = style.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  const titleLines = wrap(ctx, frame.headline, w - padX * 2, heading(Math.round(w * 0.06)), 2);
  titleLines.forEach((ln, i) => ctx.fillText(ln, padX, y + i * Math.round(w * 0.06) * 1.05));
  y += titleLines.length * Math.round(w * 0.06) * 1.1 + Math.round(h * 0.02);
  ctx.strokeStyle = "rgba(236,228,208,0.25)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
  y += Math.round(h * 0.02);

  const cols = 2, gap = Math.round(w * 0.03);
  const cellW = (w - padX * 2 - gap) / cols;
  const cellH = Math.round(cellW * 0.66);
  frame.items.slice(0, 4).forEach((it, i) => {
    const cx = padX + (i % cols) * (cellW + gap);
    const cy = y + Math.floor(i / cols) * (cellH + Math.round(h * 0.075));
    const img = getImg(it.imageUrl);
    if (img) coverInto(ctx, img, cx, cy, cellW, cellH, 1, 0, 0); else placeholder(ctx, cx, cy, cellW, cellH);
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = mono(Math.round(w * 0.019), 600); ctx.fillStyle = ACCENT;
    ctx.fillText(`${it.outlet}${it.date ? ` · ${it.date}` : ""}`.toUpperCase().slice(0, 34), cx, cy + cellH + Math.round(h * 0.008));
    const tSize = Math.round(w * 0.026);
    const tLines = wrap(ctx, it.title, cellW, heading(tSize), 3);
    ctx.font = heading(tSize); ctx.fillStyle = style.textColor;
    tLines.forEach((ln, j) => ctx.fillText(ln, cx, cy + cellH + Math.round(h * 0.028) + j * tSize * 1.1));
  });
  ctx.restore();
}

/* ─── dispatch ───────────────────────────────────────────────────────── */

export function frameImageUrls(f: ComposerFrame): string[] {
  if (f.kind === "cover" || f.kind === "portrait" || f.kind === "gallery" || f.kind === "profile-banner") return f.imageUrl ? [f.imageUrl] : [];
  if (f.kind === "mosaic-hero") return f.thumbUrls;
  if (f.kind === "video-grid") return f.items.map((i) => i.thumbUrl);
  if (f.kind === "press-grid") return f.items.map((i) => i.imageUrl);
  if (f.kind === "video") return f.posterUrl ? [f.posterUrl] : [];
  if (f.kind === "quote" || f.kind === "banner" || f.kind === "summary") return f.thumbUrls ?? [];
  return [];
}

export type FrameText = { eyebrow: string; headline: string; headline2: string; sub: string; body: string; value: string };
export function frameText(
  f: ComposerFrame,
  ov?: { eyebrow?: string; headline?: string; headline2?: string; sub?: string; body?: string; value?: string },
): FrameText {
  // Eyebrow and the second headline are composer-only: no library frame
  // arrives with them, so they exist only where someone has typed one.
  const eyebrow = ov?.eyebrow ?? "";
  const headline2 = ov?.headline2 ?? "";
  const headline = ov?.headline ?? f.headline;
  const sub = ov?.sub ?? (f.kind === "timeline" ? "" : (f as { sub?: string }).sub ?? "");
  const body = ov?.body ?? (f.kind === "finding" ? f.body : "");
  const value = ov?.value ?? (f.kind === "stat" ? f.value : "");
  return { eyebrow, headline, headline2, sub, body, value };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  frame: ComposerFrame, getImg: ImageGetter, isLogo: boolean,
  text: { eyebrow?: string; headline: string; headline2?: string; sub?: string; body?: string; value?: string },
  style: Style, m: MotionState = STILL,
  getVideo?: VideoGetter,
) {
  const copy: Copy = {
    eyebrow: text.eyebrow,
    headline: text.headline,
    headline2: text.headline2,
    sub: text.sub ?? "",
  };
  switch (frame.kind) {
    case "mosaic-hero": return drawImageFrame(ctx, w, h, flattenMosaic(frame.thumbUrls, getImg), false, frame.label, copy, style, m);
    case "video": return drawVideoFrame(ctx, w, h, getVideo?.(frame.videoUrl) ?? null, getImg(frame.posterUrl), frame.label, copy, style, m);
    case "cover":
    case "portrait":
    case "gallery": return drawImageFrame(ctx, w, h, getImg(frame.imageUrl), isLogo, frame.label, copy, style, m);
    case "profile-banner": return drawImageFrame(ctx, w, h, getImg(frame.imageUrl), isLogo, frame.label, copy, style, m);
    case "finding": return drawFinding(ctx, w, h, text.body ?? "", copy, style, m);
    case "quote": return drawCentered(ctx, w, h, "Pull quote", text.headline, copy.sub ?? "", style, true, m, getImg, frame.thumbUrls);
    case "banner": return drawCentered(ctx, w, h, "Banner", text.headline, copy.sub ?? "", style, false, m, getImg, frame.thumbUrls);
    case "summary": return drawSummary(ctx, w, h, frame.label, copy, style, m, getImg, frame.thumbUrls);
    case "stat": return drawStat(ctx, w, h, text.value ?? "", text.headline, copy.sub ?? "", style, m);
    case "timeline": return drawTimeline(ctx, w, h, frame, text.headline, style, m);
    case "video-grid": return drawVideoGrid(ctx, w, h, frame, getImg, style, m);
    case "press-grid": return drawPressGrid(ctx, w, h, frame, getImg, style, m);
  }
}

/* ─── motion presets ─────────────────────────────────────────────────── */

/** Background (image) motion presets. */
export type MotionId = "none" | "slow-zoom-in" | "slow-zoom-out" | "drift-h" | "drift-v";
export const MOTION_PRESETS: Array<{ id: MotionId; label: string }> = [
  { id: "none", label: "None" },
  { id: "slow-zoom-in", label: "Slow Zoom In" },
  { id: "slow-zoom-out", label: "Slow Zoom Out" },
  { id: "drift-h", label: "Drift (horizontal)" },
  { id: "drift-v", label: "Drift (vertical)" },
];

/** Text animation presets. */
export type TextAnimId = "none" | "fade-up" | "fade-in" | "rise" | "type-on" | "word-cascade" | "type-on-blue" | "type-on-red";
export const TEXT_ANIMS: Array<{ id: TextAnimId; label: string }> = [
  { id: "none", label: "None" },
  { id: "fade-up", label: "Fade Up" },
  { id: "fade-in", label: "Fade In" },
  { id: "rise", label: "Rise" },
  { id: "type-on", label: "Type On" },
  { id: "word-cascade", label: "Word Cascade" },
  { id: "type-on-blue", label: "Type On · Blue" },
];

function bgMotionAt(id: MotionId, t: number): { scale: number; dx: number; dy: number } {
  switch (id) {
    case "slow-zoom-in": return { scale: 1 + 0.14 * t, dx: 0, dy: 0 };
    case "slow-zoom-out": return { scale: 1.14 - 0.14 * t, dx: 0, dy: 0 };
    case "drift-h": return { scale: 1.12, dx: (t - 0.5) * 0.08, dy: 0 };
    case "drift-v": return { scale: 1.12, dx: 0, dy: (t - 0.5) * 0.08 };
    default: return { scale: 1, dx: 0, dy: 0 };
  }
}
const TEXT_ANIM_SECONDS = 2; // every text animation runs for 2s, eased in/out
function easeInOut(p: number): number {
  const x = Math.min(1, Math.max(0, p));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** `p` is the eased 0→1 text-animation progress (already time-normalised). */
function textAnimAt(id: TextAnimId, p: number): { textProgress: number; textRise: number; reveal: number; revealMode: RevealMode; highlight: boolean } {
  const base = { textProgress: 1, textRise: 0, reveal: 1, revealMode: "all" as RevealMode, highlight: false };
  switch (id) {
    case "fade-up": return { ...base, textProgress: p, textRise: 1 };
    case "fade-in": return { ...base, textProgress: p };
    case "rise": return { ...base, textProgress: p, textRise: 1.8 };
    case "type-on": return { ...base, reveal: p, revealMode: "char" };
    case "word-cascade": return { ...base, reveal: p, revealMode: "word" };
    case "type-on-blue": case "type-on-red": return { ...base, reveal: p, revealMode: "char", highlight: true };
    default: return base;
  }
}

/**
 * Combine background motion (over the whole slide) with a text animation that
 * always plays for a fixed 2s with ease-in-out, regardless of slide length.
 * `t` is slide progress 0→1; `durationSec` is the slide's length.
 */
export function composeMotion(bg: MotionId, text: TextAnimId, t: number, durationSec: number): MotionState {
  const seconds = t * Math.max(0.1, durationSec);
  const p = easeInOut(Math.min(1, seconds / TEXT_ANIM_SECONDS));
  return { ...bgMotionAt(bg, t), ...textAnimAt(text, p) };
}
