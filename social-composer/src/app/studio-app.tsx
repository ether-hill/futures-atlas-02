"use client";

/**
 * StudioApp — the standalone Social Studio (opened in its own tab from the
 * ShareDock). Structure mirrors the moi-aru-muga composer: an identity rail,
 * a numbered flow, Single-composer / Batch-create modes, a stocked library
 * of page-derived frames, a live (animated) preview, compose + motion
 * controls, and PNG / ZIP / GIF / MP4 export with auto-saving drafts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComposerFrame, ComposerSource } from "@/lib/composer/source";
import {
  drawFrame, frameImageUrls, frameText, composeMotion, proxy,
  MOTION_PRESETS, TEXT_ANIMS, LAYOUTS, STILL, type MotionId, type TextAnimId, type Placement, type Align, type LayoutId, type Style,
} from "@/lib/composer/render";
import { blobToBytes, dataUrlToBytes, downloadBlob, exportGIF, exportVideo, renderVideoBlob, zipDownload } from "@/lib/composer/export";
import { loadAssets, saveAsset, deleteAsset } from "@/lib/composer/assets";

type Aspect = "4:5" | "1:1" | "9:16";
type PostTypeId = "single" | "carousel" | "story" | "reel" | "quote";
type TypeSize = "S" | "M" | "L" | "XL";
type Mode = "single" | "batch";

const ASPECT_DIMS: Record<Aspect, { w: number; h: number }> = {
  "4:5": { w: 1080, h: 1350 }, "1:1": { w: 1080, h: 1080 }, "9:16": { w: 1080, h: 1920 },
};
const POST_TYPES: Array<{ id: PostTypeId; label: string; glyph: string; dims: string; aspects: Aspect[]; multi?: boolean; video?: boolean }> = [
  { id: "single", label: "Single", glyph: "▭", dims: "1080 × 1350", aspects: ["4:5", "1:1"] },
  { id: "carousel", label: "Carousel", glyph: "▦", dims: "1080 × 1350 · 2–10", aspects: ["4:5", "1:1"], multi: true },
  { id: "story", label: "Story", glyph: "▯", dims: "1080 × 1920", aspects: ["9:16"], video: true },
  { id: "reel", label: "Reel / Short", glyph: "▶", dims: "1080 × 1920 · video", aspects: ["9:16"], multi: true, video: true },
  { id: "quote", label: "Quote Card", glyph: "❝", dims: "1080 × 1080", aspects: ["1:1"] },
];
const TYPE_SIZES: TypeSize[] = ["S", "M", "L", "XL"];
const SIZE_MUL: Record<TypeSize, number> = { S: 0.82, M: 1, L: 1.28, XL: 1.62 };
const PLACEMENTS: Placement[] = ["top", "middle", "bottom"];
const FPS_OPTS = [15, 24, 30];
// Futures Atlas dark palette swatches (accent = FA blue #3B93D5).
const BG_SWATCHES = [
  { name: "Bone", value: "#211e18" }, { name: "Blue", value: "#3B93D5" }, { name: "Vellum", value: "#2b2722" },
  { name: "Seal", value: "#a69f91" }, { name: "Ink", value: "#f2ede2" }, { name: "Light", value: "#F4EFE6" },
];
const TEXT_SWATCHES = [
  { name: "Ink", value: "#f2ede2" }, { name: "White", value: "#FFFFFF" }, { name: "Dark", value: "#211e18" }, { name: "Blue", value: "#3B93D5" },
];

type Override = { headline?: string; sub?: string; body?: string; value?: string; motion?: MotionId; textAnim?: TextAnimId; typeSize?: TypeSize; placement?: Placement; align?: Align; layout?: LayoutId; bgColor?: string; textColor?: string; durationSec?: number };
const ALIGNS: Align[] = ["left", "center", "right"];
// Each library frame arrives as a real, editable composer configuration: a
// sensible per-kind starting layout / placement / alignment that every
// per-slide control can then override or vary.
function frameConfig(f: ComposerFrame): { layout: LayoutId; placement: Placement; align: Align } {
  switch (f.kind) {
    case "quote":
    case "banner": return { layout: "full-bleed", placement: "middle", align: "center" };
    case "summary":
    case "finding":
    case "timeline":
    case "video-grid":
    case "press-grid": return { layout: "full-bleed", placement: "top", align: "left" };
    case "stat": return { layout: "full-bleed", placement: "middle", align: "left" };
    case "profile-banner": return { layout: "card", placement: "bottom", align: "left" };
    // cover, mosaic-hero, portrait, gallery, video
    default: return { layout: "full-bleed", placement: "bottom", align: "left" };
  }
}
type Draft = { id: string; ts: number; postType: PostTypeId; aspect: Aspect; selected: string[]; overrides: Record<string, Override>; typeSize: TypeSize; bgColor: string; textColor: string; defBg: MotionId; defText: TextAnimId; defDur: number };
const dKey = (u: string) => `social-composer:drafts:${u}`;
const wKey = (u: string) => `social-composer:working:${u}`;
const tmKey = (u: string) => `social-composer:transmutated:${u}`;
const binKey = (u: string) => `social-composer:bin:${u}`;

const frameMediaUrl = (f: ComposerFrame): string | null | undefined =>
  (f as { imageUrl?: string | null }).imageUrl ?? (f as { videoUrl?: string }).videoUrl;

type TransmuteData = {
  url: string; title: string; description: string; siteName: string;
  images: { src: string; alt: string; title?: string }[]; videos?: { src: string; poster: string; title?: string }[]; quotes: string[];
  headings: string[]; paragraphs: string[]; references: { href: string; text: string }[];
};

/** Map a scanned page into ready-to-edit library frames: a headline card, one
 *  frame per key image, pull-quote cards, overview cards, and a references card. */
function framesFromTransmute(d: TransmuteData, base: string): ComposerFrame[] {
  const frames: ComposerFrame[] = [];
  let i = 0;
  const nid = () => `tm-${base}-${i++}`;
  const imgs = d.images ?? [];
  const vids = d.videos ?? [];
  const site = d.siteName || "";
  // Mosaic thumbs for the headline card draw on images + video posters.
  const thumbs = [...imgs.map((x) => x.src), ...vids.map((v) => v.poster).filter(Boolean)].slice(0, 6);
  const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

  // Track text already shown (page title + media titles) so section/overview
  // text frames don't just repeat captions already on the media.
  const seen = new Set<string>();
  const key = (s: string) => s.trim().toLowerCase();

  if (d.title) { frames.push({ id: nid(), kind: "summary", label: "Headline", headline: d.title, sub: d.description || site, thumbUrls: thumbs }); seen.add(key(d.title)); }
  for (const v of vids.slice(0, 40)) { const t = v.title || d.title || site; seen.add(key(t)); frames.push({ id: nid(), kind: "video", label: "Video", headline: t, sub: site, videoUrl: v.src, posterUrl: v.poster || undefined }); }
  for (const im of imgs.slice(0, 24)) { const t = im.title || d.title || site; seen.add(key(t)); frames.push({ id: nid(), kind: "gallery", label: "Image", headline: t, sub: im.alt || site, imageUrl: im.src }); }
  // Page text: section/item headings the media didn't already cover → text cards.
  for (const hd of (d.headings ?? []).slice(0, 16)) { if (seen.has(key(hd))) continue; seen.add(key(hd)); frames.push({ id: nid(), kind: "summary", label: "Section", headline: cap(hd, 280), sub: site, thumbUrls: [] }); }
  for (const q of (d.quotes ?? []).slice(0, 8)) frames.push({ id: nid(), kind: "quote", label: "Quote", headline: cap(q, 480), sub: site, thumbUrls: imgs.slice(0, 4).map((x) => x.src) });
  for (const para of (d.paragraphs ?? []).slice(0, 8)) frames.push({ id: nid(), kind: "summary", label: "Overview", headline: cap(para, 600), sub: site, thumbUrls: [] });
  const refs = d.references ?? [];
  if (refs.length) frames.push({ id: nid(), kind: "summary", label: "References", headline: cap(refs.map((r) => r.text).join("  ·  "), 640), sub: `References · ${site}`, thumbUrls: [] });
  return frames;
}

/* Image cache loading through the proxy; re-renders when an image arrives. */
function useImages(urls: string[]) {
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());
  const requested = useRef<Set<string>>(new Set());
  const [, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    for (const raw of urls) {
      if (!raw || requested.current.has(raw)) continue;
      requested.current.add(raw);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { if (!cancelled) { cache.current.set(raw, img); setTick((t) => t + 1); } };
      img.onerror = () => { /* leave uncached → placeholder */ };
      img.src = proxy(raw);
    }
    return () => { cancelled = true; };
  }, [urls]);
  return useCallback((url: string | null | undefined) => {
    if (!url) return null;
    const img = cache.current.get(url);
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }, []);
}

/* Uploaded videos as muted <video> elements drawn into the canvas. The elements
 * are attached to the DOM (hidden) so the browser reliably decodes frames for
 * canvas drawing/export. Playback is driven by the render loop — NOT autoplay —
 * so off-screen clips stay parked at frame 0 and don't drift; otherwise a clip
 * fading in during a transition would appear at a random, moving position. */
function useVideos(urls: string[]) {
  const cache = useRef<Map<string, HTMLVideoElement>>(new Map());
  const requested = useRef<Set<string>>(new Set());
  const [, setTick] = useState(0);
  useEffect(() => {
    for (const raw of urls) {
      if (!raw || requested.current.has(raw)) continue;
      requested.current.add(raw);
      const v = document.createElement("video");
      // Remote (transmutated) videos stream through the same-origin proxy so the
      // canvas stays untainted and stays exportable; uploaded blob: URLs play directly.
      const remote = /^https?:\/\//i.test(raw);
      if (remote) v.crossOrigin = "anonymous";
      v.src = remote ? `/api/social-composer/vid?u=${encodeURIComponent(raw)}` : raw;
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;opacity:0;pointer-events:none;";
      const ready = () => { cache.current.set(raw, v); setTick((t) => t + 1); };
      v.onloadeddata = ready;
      v.oncanplay = ready;
      document.body.appendChild(v);
      v.load();
    }
  }, [urls]);
  const get = useCallback((url: string | null | undefined) => (url ? cache.current.get(url) ?? null : null), []);
  // Park every clip that isn't on screen this frame at its first frame, paused.
  const pauseInactive = useCallback((activeUrls: Set<string>) => {
    for (const [url, v] of cache.current) {
      if (activeUrls.has(url)) continue;
      if (!v.paused) v.pause();
      if (v.currentTime > 0.02) { try { v.currentTime = 0; } catch { /* */ } }
    }
  }, []);
  return { get, pauseInactive };
}

// Target play-head (seconds) for a video on a slide of length `dur` at the
// slide-local progress `localT`. Wraps at the clip length only when the clip is
// shorter than the slide; otherwise the slide's own duration is the loop point.
function videoTargetTime(v: HTMLVideoElement, localT: number, dur: number): number {
  const span = isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity;
  const t = Math.max(0, localT) * dur;
  return isFinite(span) ? t % span : t;
}

export function StudioApp({ source }: { source: ComposerSource }) {
  const isCorp = source.kind === "corporation";
  const slugKey = source.url;

  const [mode, setMode] = useState<Mode>("single");
  const [postType, setPostType] = useState<PostTypeId>("single");
  const typeDef = POST_TYPES.find((p) => p.id === postType)!;
  const [aspect, setAspect] = useState<Aspect>("4:5");
  const { w, h } = ASPECT_DIMS[aspect];

  const [userFrames, setUserFrames] = useState<ComposerFrame[]>([]);
  // Uploads first so they're visible at the top of the library.
  const frames = useMemo(() => [...userFrames, ...source.frames], [source.frames, userFrames]);
  const allUrls = useMemo(() => frames.flatMap(frameImageUrls), [frames]);
  const getImg = useImages(allUrls);
  const videoUrls = useMemo(() => frames.filter((f) => f.kind === "video").map((f) => (f as Extract<ComposerFrame, { kind: "video" }>).videoUrl), [frames]);
  const { get: getVideo, pauseInactive } = useVideos(videoUrls);

  const [selected, setSelected] = useState<string[]>(() => (frames[0] ? [frames[0].id] : []));
  const [previewIdx, setPreviewIdx] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  // Last-used values — the defaults a newly-added slide inherits. Each slide's
  // own override (in `overrides`) wins, so every slide is independently tuned.
  const [typeSize, setTypeSize] = useState<TypeSize>("L");
  const [bgColor, setBgColor] = useState("#08070A");
  const [textColor, setTextColor] = useState("#ECE4D0");
  const [defBg, setDefBg] = useState<MotionId>("slow-zoom-in");
  const [defText, setDefText] = useState<TextAnimId>("fade-up");
  const [defDur, setDefDur] = useState(5);
  const [fps, setFps] = useState(24);
  const [playing, setPlaying] = useState(true);

  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tmUrl, setTmUrl] = useState("");
  const [bin, setBin] = useState<ComposerFrame[]>([]);
  const showToast = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2000); }, []);

  const framesById = useMemo(() => new Map(frames.map((f) => [f.id, f])), [frames]);
  const selFrames = useMemo(() => selected.map((id) => framesById.get(id)).filter(Boolean) as ComposerFrame[], [selected, framesById]);
  const activeFrame = selFrames[Math.min(previewIdx, selFrames.length - 1)] ?? selFrames[0] ?? frames[0] ?? null;
  const activeId = activeFrame?.id ?? null;

  // Effective per-slide values: this slide's override ?? the current default.
  const tFor = useCallback((f: ComposerFrame) => frameText(f, overrides[f.id]), [overrides]);
  const bgFor = useCallback((f: ComposerFrame): MotionId => overrides[f.id]?.motion ?? defBg, [overrides, defBg]);
  const taFor = useCallback((f: ComposerFrame): TextAnimId => overrides[f.id]?.textAnim ?? defText, [overrides, defText]);
  const durFor = useCallback((f: ComposerFrame): number => overrides[f.id]?.durationSec ?? defDur, [overrides, defDur]);
  const styleFor = useCallback((f: ComposerFrame): Style => {
    const o = overrides[f.id] ?? {};
    const cfg = frameConfig(f);
    return { bgColor: o.bgColor ?? bgColor, textColor: o.textColor ?? textColor, sizeMul: SIZE_MUL[o.typeSize ?? typeSize], placement: o.placement ?? cfg.placement, align: o.align ?? cfg.align, layout: o.layout ?? cfg.layout };
  }, [overrides, bgColor, textColor, typeSize]);
  const slideIsStill = useCallback((f: ComposerFrame) => bgFor(f) === "none" && taFor(f) === "none", [bgFor, taFor]);
  const isAnimated = selFrames.some((f) => bgFor(f) !== "none" || taFor(f) !== "none") || selFrames.length > 1;
  // Sequence total (sum of each slide's own duration) drives the preview + reel.
  const seqTotal = useMemo(() => selFrames.reduce((a, f) => a + durFor(f), 0) || 1, [selFrames, durFor]);
  const totalDuration = selFrames.length > 1 ? seqTotal : (activeFrame ? durFor(activeFrame) : 5);

  /* Rehydrate the uploaded library (IndexedDB blobs) + drafts/working state.
   * Assets load first so restored selections that point at uploads survive. */
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot client restore */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let blobFrames: ComposerFrame[] = [];
      try {
        const stored = await loadAssets();
        blobFrames = stored.map((a) => a.kind === "video"
          ? { id: a.id, kind: "video" as const, label: a.label, headline: a.headline, sub: a.sub, videoUrl: URL.createObjectURL(a.blob) }
          : { id: a.id, kind: "gallery" as const, label: a.label, headline: a.headline, sub: a.sub, imageUrl: URL.createObjectURL(a.blob) });
      } catch { /* */ }
      // Transmutated frames (remote URLs + text) and the Bin persist as plain JSON.
      let tmFrames: ComposerFrame[] = [];
      let binSpecs: ComposerFrame[] = [];
      try { const raw = window.localStorage.getItem(tmKey(slugKey)); if (raw) tmFrames = JSON.parse(raw) as ComposerFrame[]; } catch { /* */ }
      try { const raw = window.localStorage.getItem(binKey(slugKey)); if (raw) binSpecs = JSON.parse(raw) as ComposerFrame[]; } catch { /* */ }
      if (cancelled) return;
      const binnedIds = new Set(binSpecs.map((f) => f.id));
      const blobById = new Map(blobFrames.map((f) => [f.id, f] as const));
      // Binned uploads keep their blob in IndexedDB; resolve them to a fresh object URL.
      const binFrames = binSpecs.map((f) => (f.id.startsWith("upload-") ? blobById.get(f.id) : f)).filter(Boolean) as ComposerFrame[];
      const restored = [...tmFrames.filter((f) => !binnedIds.has(f.id)), ...blobFrames.filter((f) => !binnedIds.has(f.id))];
      if (restored.length) setUserFrames(restored);
      if (binFrames.length) setBin(binFrames);
      const validIds = new Set<string>([...source.frames.map((f) => f.id), ...restored.map((f) => f.id)]);

      try { const r = window.localStorage.getItem(dKey(slugKey)); if (r) setDrafts(JSON.parse(r)); } catch { /* */ }
      try {
        const raw = window.localStorage.getItem(wKey(slugKey));
        if (raw) {
          const s = JSON.parse(raw) as Partial<Draft>;
          if (s.postType) setPostType(s.postType);
          if (s.aspect) setAspect(s.aspect);
          // Only restore selections that still exist (incl. rehydrated uploads).
          if (Array.isArray(s.selected)) { const valid = s.selected.filter((id) => validIds.has(id)); if (valid.length) setSelected(valid); }
          if (s.overrides) setOverrides(s.overrides);
          if (s.typeSize) setTypeSize(s.typeSize);
          if (s.bgColor) setBgColor(s.bgColor);
          if (s.textColor) setTextColor(s.textColor);
          if (s.defBg) setDefBg(s.defBg);
          if (s.defText) setDefText(s.defText);
          if (s.defDur) setDefDur(s.defDur);
        }
      } catch { /* */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const working = useMemo(() => ({ postType, aspect, selected, overrides, typeSize, bgColor, textColor, defBg, defText, defDur }), [postType, aspect, selected, overrides, typeSize, bgColor, textColor, defBg, defText, defDur]);
  useEffect(() => {
    const id = window.setInterval(() => { try { window.localStorage.setItem(wKey(slugKey), JSON.stringify(working)); } catch { /* */ } }, 5000);
    return () => window.clearInterval(id);
  }, [slugKey, working]);

  /* ── Video clock ───────────────────────────────────────────────────────
   * Videos play from their first frame and restart at the slide's set duration
   * (a 5s slide shows only the first 5s of an 8s clip, then loops) — honoured in
   * the live preview, the real-time MP4/WebM export, and the GIF export. */
  const videoSyncMode = useRef<"realtime" | "seek">("realtime");

  // Real-time path (preview + MP4/WebM): let the muted element PLAY naturally and
  // never seek per-frame — repeatedly setting currentTime on a playing video makes
  // it flicker between decoded frames, especially across a crossfade. The only
  // correction is a single reset at the slide-duration boundary, so an 8s clip on
  // a 5s slide loops at 5s. Exact frame positioning is the GIF path's job (seek).
  const syncVideoRealtime = useCallback((f: ComposerFrame, localT: number) => {
    if (f.kind !== "video" || videoSyncMode.current !== "realtime") return;
    const v = getVideo((f as Extract<ComposerFrame, { kind: "video" }>).videoUrl);
    if (!v) return;
    if (v.paused) v.play().catch(() => { /* */ });
    // Restart at the slide's loop point (localT wrapped back to ~0 while the clip
    // is still mid-play) or if a long clip ran past the slide window — one clean
    // reset, never a per-frame seek (which is what made it flicker).
    if ((localT < 0.08 && v.currentTime > 0.25) || v.currentTime > durFor(f) + 0.15) {
      try { v.currentTime = 0; } catch { /* */ }
    }
  }, [getVideo, durFor]);

  // Seek path (GIF, frame-stepped): position the clip exactly and wait for it.
  const seekVideoTo = useCallback((v: HTMLVideoElement, target: number) => new Promise<void>((resolve) => {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - target) < 0.01) { resolve(); return; }
    let settled = false;
    const finish = () => { if (settled) return; settled = true; v.removeEventListener("seeked", finish); resolve(); };
    v.addEventListener("seeked", finish);
    try { v.currentTime = target; } catch { finish(); }
    window.setTimeout(finish, 400); // never hang the export on a stubborn seek
  }), []);

  /* Which slide(s) are on screen at sequence-progress `t`, each with its own
   * continuous local clock + crossfade alpha. The incoming slide gets a slightly
   * negative localT through the fade so its background motion is already moving
   * as it appears — no static "pause" before the motion starts. */
  const segmentDraws = useCallback((t: number): Array<{ frame: ComposerFrame; localT: number; alpha: number }> => {
    const list = selFrames.length ? selFrames : (activeFrame ? [activeFrame] : []);
    if (!list.length) return [];
    if (list.length === 1) return [{ frame: list[0], localT: t, alpha: 1 }];
    const durs = list.map((f) => durFor(f));
    const total = durs.reduce((a, d) => a + d, 0) || 1;
    const tt = t * total;
    let acc = 0, idx = 0;
    for (let i = 0; i < list.length; i++) { if (tt < acc + durs[i] || i === list.length - 1) { idx = i; break; } acc += durs[i]; }
    const dur = durs[idx];
    const localT = Math.min(1, (tt - acc) / dur);
    const out = [{ frame: list[idx], localT, alpha: 1 }];
    const fadeFrac = Math.min(0.4, dur * 0.25) / dur;
    if (idx < list.length - 1 && localT > 1 - fadeFrac) {
      const nextDur = durs[idx + 1];
      const nextLocalT = (tt - (acc + dur)) / nextDur; // negative through the fade → motion already underway
      const alpha = (localT - (1 - fadeFrac)) / fadeFrac;
      out.push({ frame: list[idx + 1], localT: nextLocalT, alpha });
    }
    return out;
  }, [selFrames, activeFrame, durFor]);

  // Seek every on-screen video to its clock position for sequence-progress `t`.
  const prepareVideosAt = useCallback(async (t: number) => {
    await Promise.all(segmentDraws(t).map(({ frame, localT }) => {
      if (frame.kind !== "video") return Promise.resolve();
      const v = getVideo((frame as Extract<ComposerFrame, { kind: "video" }>).videoUrl);
      if (!v || v.readyState < 1) return Promise.resolve();
      const target = videoTargetTime(v, localT, durFor(frame));
      return seekVideoTo(v, target);
    }));
  }, [segmentDraws, getVideo, durFor, seekVideoTo]);

  /* The shared render closure (used by preview + every exporter). Sequences
   * allocate each slide its own duration, with a quick cross-fade at joins. */
  const renderFrameAt = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const draws = segmentDraws(t);
    if (!draws.length) { ctx.fillStyle = "#08070A"; ctx.fillRect(0, 0, w, h); return; }
    // Park any video not on screen this frame at frame 0 (realtime preview/MP4),
    // so a clip fading in starts clean instead of at a drifted, moving position.
    if (videoSyncMode.current === "realtime") {
      const onScreen = new Set(draws.filter((d) => d.frame.kind === "video").map((d) => (d.frame as Extract<ComposerFrame, { kind: "video" }>).videoUrl));
      pauseInactive(onScreen);
    }
    for (const { frame, localT, alpha } of draws) {
      syncVideoRealtime(frame, localT);
      if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha; }
      drawFrame(ctx, w, h, frame, getImg, isCorp && frame.kind === "portrait", tFor(frame), styleFor(frame), composeMotion(bgFor(frame), taFor(frame), localT, durFor(frame)), getVideo);
      if (alpha < 1) ctx.restore();
    }
  }, [segmentDraws, syncVideoRealtime, pauseInactive, w, h, getImg, getVideo, isCorp, tFor, bgFor, taFor, durFor, styleFor]);

  /* Draw just the selected slide in its finished state (text fully revealed,
   * motion settled) — what you see while paused so you can edit and judge it. */
  const drawActiveFinal = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!activeFrame) { ctx.fillStyle = "#08070A"; ctx.fillRect(0, 0, w, h); return; }
    drawFrame(ctx, w, h, activeFrame, getImg, isCorp && activeFrame.kind === "portrait", tFor(activeFrame), styleFor(activeFrame), composeMotion(bgFor(activeFrame), taFor(activeFrame), 1, durFor(activeFrame)), getVideo);
  }, [activeFrame, w, h, getImg, getVideo, isCorp, tFor, bgFor, taFor, durFor, styleFor]);

  /* Canvas text never triggers a web-font download, so the composed posts fall
   * back to a system serif/mono until the FA families happen to be loaded by the
   * DOM. Explicitly load the weights the renderer uses (Bodoni Moda 400–700,
   * IBM Plex Mono 400–600), then bump a tick so the preview redraws with them. */
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (!document.fonts) { setFontsReady(true); return; }
    const faces = [
      '500 40px "Archivo"', '700 40px "Archivo"', '800 40px "Archivo"',
      '400 40px "Bodoni Moda"', '500 40px "Bodoni Moda"', '600 40px "Bodoni Moda"',
      '400 40px "IBM Plex Mono"', '500 40px "IBM Plex Mono"', '600 40px "IBM Plex Mono"',
    ];
    let cancelled = false;
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => undefined)))
      .then(() => { if (!cancelled) setFontsReady(true); });
    return () => { cancelled = true; };
  }, []);

  /* Live preview — animate the sequence while playing; while paused show the
   * selected slide in its final state. */
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0; let start = 0; let cancelled = false;
    const loopMs = Math.max(2, totalDuration) * 1000;
    const frame = (now: number) => {
      if (cancelled) return;
      if (!start) start = now;
      renderFrameAt(ctx, ((now - start) % loopMs) / loopMs);
      raf = requestAnimationFrame(frame);
    };
    if (isAnimated && playing) raf = requestAnimationFrame(frame);
    else drawActiveFinal(ctx);
    return () => { cancelled = true; if (raf) cancelAnimationFrame(raf); };
  }, [w, h, renderFrameAt, drawActiveFinal, isAnimated, playing, totalDuration, fontsReady]);

  /* Post type / selection */
  const selectPostType = useCallback((id: PostTypeId) => {
    const def = POST_TYPES.find((p) => p.id === id)!;
    setPostType(id);
    setAspect((p) => (def.aspects.includes(p) ? p : def.aspects[0]));
    if (!def.multi) setSelected((p) => (p.length > 1 ? p.slice(0, 1) : p));
  }, []);
  const toggleFrame = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) { const n = prev.filter((x) => x !== id); return n.length ? n : prev; }
      if (!typeDef.multi) return [id];
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  }, [typeDef.multi]);
  const onUpload = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const added: ComposerFrame[] = [];
    for (const file of Array.from(files)) {
      const id = `upload-${Date.now()}-${added.length}`;
      const ts = Date.now() + added.length;
      if (file.type.startsWith("video/")) {
        added.push({ id, kind: "video", label: "Video", headline: source.name, sub: source.attribution, videoUrl: URL.createObjectURL(file) });
        void saveAsset({ id, kind: "video", label: "Video", headline: source.name, sub: source.attribution, ts, blob: file });
      } else if (file.type.startsWith("image/")) {
        added.push({ id, kind: "gallery", label: "Upload", headline: source.name, sub: source.attribution, imageUrl: URL.createObjectURL(file) });
        void saveAsset({ id, kind: "gallery", label: "Upload", headline: source.name, sub: source.attribution, ts, blob: file });
      }
    }
    if (!added.length) return;
    setUserFrames((p) => [...added, ...p]);
    setSelected((p) => (typeDef.multi ? [...p, added[0].id] : [added[0].id]));
    setPreviewIdx(typeDef.multi ? selected.length : 0);
  }, [source.name, source.attribution, typeDef.multi, selected.length]);

  // Library items move to a recoverable Bin; the Bin itself can be emptied for
  // good (which frees uploaded blobs from IndexedDB). Uploads keep their blob
  // while binned so they can be restored. The blank starter / source frames
  // aren't user frames, so they're never binned and the library stays usable.
  const persistTm = useCallback((fr: ComposerFrame[]) => { try { window.localStorage.setItem(tmKey(slugKey), JSON.stringify(fr.filter((x) => x.id.startsWith("tm-")))); } catch { /* */ } }, [slugKey]);
  const persistBin = useCallback((fr: ComposerFrame[]) => { try { window.localStorage.setItem(binKey(slugKey), JSON.stringify(fr)); } catch { /* */ } }, [slugKey]);

  const binItem = useCallback((id: string) => {
    const f = userFrames.find((x) => x.id === id);
    if (!f) return;
    const nextUser = userFrames.filter((x) => x.id !== id);
    const nextBin = [f, ...bin];
    setUserFrames(nextUser); setBin(nextBin);
    persistTm(nextUser); persistBin(nextBin);
    setSelected((s) => s.filter((x) => x !== id));
    setPreviewIdx(0);
  }, [userFrames, bin, persistTm, persistBin]);

  const clearLibrary = useCallback(() => {
    if (!userFrames.length) return;
    const nextBin = [...userFrames, ...bin];
    setBin(nextBin); setUserFrames([]);
    persistBin(nextBin); persistTm([]);
    setSelected([]); setPreviewIdx(0);
  }, [userFrames, bin, persistTm, persistBin]);

  const restoreBin = useCallback(() => {
    if (!bin.length) return;
    const nextUser = [...bin, ...userFrames];
    setUserFrames(nextUser); setBin([]);
    persistTm(nextUser); persistBin([]);
  }, [userFrames, bin, persistTm, persistBin]);

  const emptyBin = useCallback(() => {
    if (!bin.length) return;
    const ids = new Set(bin.map((f) => f.id));
    for (const f of bin) {
      const url = frameMediaUrl(f);
      if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
      if (f.id.startsWith("upload-")) void deleteAsset(f.id);
    }
    setBin([]); persistBin([]);
    setOverrides((o) => { const n = { ...o }; for (const id of ids) delete n[id]; return n; });
  }, [bin, persistBin]);

  // Transmutate a URL — scan a page and pull its key elements into the library.
  const onTransmutate = useCallback(async () => {
    const url = tmUrl.trim();
    if (!url || busy) return;
    setBusy("transmutate");
    try {
      const res = await fetch(`/api/social-composer/transmutate?u=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) { showToast(data?.error || "Couldn't read that page"); return; }
      const made = framesFromTransmute(data as TransmuteData, `${Date.now()}`);
      if (!made.length) { showToast("No elements found on that page"); return; }
      setUserFrames((p) => {
        const next = [...made, ...p];
        try { window.localStorage.setItem(tmKey(slugKey), JSON.stringify(next.filter((x) => x.id.startsWith("tm-")))); } catch { /* */ }
        return next;
      });
      setSelected([made[0].id]);
      setPreviewIdx(0);
      setTmUrl("");
      showToast(`Transmutated ${made.length} element${made.length > 1 ? "s" : ""} from ${data.siteName || "page"}`);
    } catch {
      showToast("Transmutate failed");
    } finally {
      setBusy(null);
    }
  }, [tmUrl, busy, slugKey, showToast]);

  const setActiveText = useCallback((patch: Override) => { if (activeId) setOverrides((p) => ({ ...p, [activeId]: { ...p[activeId], ...patch } })); }, [activeId]);
  const onRandomise = useCallback(() => {
    const pool = source.headlineOptions;
    if (!pool.length || !activeId) return;
    const next = (headlineIdx + 1) % pool.length; setHeadlineIdx(next); setActiveText({ headline: pool[next] });
  }, [source.headlineOptions, activeId, headlineIdx, setActiveText]);

  /* Caption */
  const caption = useMemo(() => {
    const lines: string[] = [];
    const head = activeFrame ? tFor(activeFrame).headline.trim() : "";
    if (head && head !== source.name) lines.push(head, "");
    lines.push(source.name);
    if (source.description) lines.push(source.description);
    if (source.summary) lines.push("", source.summary);
    if (source.cards.length) {
      lines.push("", source.listLabel);
      for (const c of source.cards.slice(0, 5)) lines.push(/\d{4}/.test(c.date) ? `• ${(c.title || c.body).slice(0, 90)}` : `• “${c.body.slice(0, 110)}”`);
    }
    lines.push("", `Read more: ${source.url}`, "", source.hashtags);
    return lines.join("\n");
  }, [activeFrame, tFor, source]);
  const onCopyCaption = useCallback(async () => {
    try { await navigator.clipboard.writeText(caption); showToast("Caption copied"); } catch { showToast("Copy failed"); }
  }, [caption, showToast]);

  /* Exports */
  const slugToken = slugKey.split("/").filter(Boolean).pop() || "post";
  const renderStill = useCallback((f: ComposerFrame): string | null => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d"); if (!ctx) return null;
    drawFrame(ctx, w, h, f, getImg, isCorp && f.kind === "portrait", tFor(f), styleFor(f), STILL, getVideo);
    return c.toDataURL("image/png");
  }, [w, h, getImg, getVideo, isCorp, tFor, styleFor]);

  // Per-slide animation renderer (used by the carousel ZIP video clips).
  const singleRenderer = useCallback((f: ComposerFrame) => (ctx: CanvasRenderingContext2D, t: number) => {
    syncVideoRealtime(f, t);
    drawFrame(ctx, w, h, f, getImg, isCorp && f.kind === "portrait", tFor(f), styleFor(f), composeMotion(bgFor(f), taFor(f), t, durFor(f)), getVideo);
  }, [syncVideoRealtime, w, h, getImg, getVideo, isCorp, tFor, bgFor, taFor, durFor, styleFor]);

  const onDownloadPNG = useCallback(async () => {
    if (!activeFrame) return;
    setBusy("png");
    try {
      const d = renderStill(activeFrame);
      if (d) downloadBlob(await (await fetch(d)).blob(), `airapture-${slugToken}-${activeFrame.kind}.png`);
      showToast("Downloaded PNG");
    } catch { showToast("Export failed"); } finally { setBusy(null); }
  }, [activeFrame, renderStill, slugToken, showToast]);

  // Per-slide ZIP: each slide a still PNG when it has no motion + no text
  // animation, otherwise its own short video clip (MP4/WebM).
  const onDownloadPerSlide = useCallback(async () => {
    if (!selFrames.length) return;
    setBusy("zip");
    try {
      const entries: Record<string, Uint8Array> = {};
      let n = 1;
      for (const f of selFrames) {
        const base = `airapture-${slugToken}-${String(n).padStart(2, "0")}-${f.kind}`;
        if (slideIsStill(f)) {
          const d = renderStill(f); if (d) entries[`${base}.png`] = dataUrlToBytes(d);
        } else {
          const prep = async () => { const v = f.kind === "video" ? getVideo((f as Extract<ComposerFrame, { kind: "video" }>).videoUrl) : null; if (v && isFinite(v.duration) && v.duration > 0) await seekVideoTo(v, 0); };
          const res = await renderVideoBlob({ renderFrame: singleRenderer(f), prepareFrame: prep, w, h, fps, durationSec: durFor(f) });
          if (res) entries[`${base}.${res.ext}`] = await blobToBytes(res.blob);
          else { const d = renderStill(f); if (d) entries[`${base}.png`] = dataUrlToBytes(d); }
        }
        n += 1;
      }
      zipDownload(entries, `airapture-${slugToken}-slides.zip`);
      showToast(`Downloaded ${selFrames.length}-slide ZIP`);
    } catch { showToast("ZIP export failed"); } finally { setBusy(null); }
  }, [selFrames, slideIsStill, slugToken, singleRenderer, w, h, fps, durFor, renderStill, showToast, getVideo, seekVideoTo]);

  const moveSlide = useCallback((id: string, dir: -1 | 1) => {
    setSelected((prev) => {
      const i = prev.indexOf(id); const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next;
    });
  }, []);
  const removeSlide = useCallback((id: string) => {
    setSelected((prev) => { const n = prev.filter((x) => x !== id); return n.length ? n : prev; });
  }, []);

  const onDownloadGIF = useCallback(async () => {
    if (!activeFrame) return;
    setBusy("gif");
    videoSyncMode.current = "seek"; // GIF is frame-stepped → seek videos exactly
    try { await exportGIF({ renderFrame: renderFrameAt, prepareFrame: prepareVideosAt, w, h, fps, durationSec: totalDuration, name: `airapture-${slugToken}.gif` }); showToast("Downloaded GIF"); }
    catch { showToast("GIF export failed"); } finally { videoSyncMode.current = "realtime"; setBusy(null); }
  }, [activeFrame, renderFrameAt, prepareVideosAt, w, h, fps, totalDuration, slugToken, showToast]);

  const onDownloadVideo = useCallback(async () => {
    if (!activeFrame) return;
    setBusy("video");
    try {
      const res = await exportVideo({ renderFrame: renderFrameAt, prepareFrame: prepareVideosAt, w, h, fps, durationSec: totalDuration, name: `airapture-${slugToken}` });
      showToast(res.ok ? `Downloaded ${res.ext?.toUpperCase()}` : "Video not supported in this browser");
    } catch { showToast("Video export failed"); } finally { setBusy(null); }
  }, [activeFrame, renderFrameAt, prepareVideosAt, w, h, fps, totalDuration, slugToken, showToast]);

  const onBatchAll = useCallback(async () => {
    setBusy("batch");
    try {
      const entries: Record<string, Uint8Array> = {};
      frames.forEach((f, i) => {
        const d = renderStill(f);
        if (d) entries[`airapture-${slugToken}-${String(i + 1).padStart(2, "0")}-${f.kind}.png`] = dataUrlToBytes(d);
      });
      zipDownload(entries, `airapture-${slugToken}-batch.zip`);
      showToast(`Downloaded ${Object.keys(entries).length} frames`);
    } catch { showToast("Batch failed"); } finally { setBusy(null); }
  }, [frames, renderStill, slugToken, showToast]);

  /* Drafts */
  const persist = useCallback((next: Draft[]) => { setDrafts(next); try { window.localStorage.setItem(dKey(slugKey), JSON.stringify(next)); } catch { /* */ } }, [slugKey]);
  const onSaveDraft = useCallback(() => {
    persist([{ id: `${Date.now()}`, ts: Date.now(), postType, aspect, selected, overrides, typeSize, bgColor, textColor, defBg, defText, defDur }, ...drafts].slice(0, 12));
    showToast("Draft saved");
  }, [persist, postType, aspect, selected, overrides, typeSize, bgColor, textColor, defBg, defText, defDur, drafts, showToast]);
  const onRestore = useCallback((d: Draft) => {
    setPostType(d.postType); setAspect(d.aspect); setSelected(d.selected); setOverrides(d.overrides || {});
    setTypeSize(d.typeSize); setBgColor(d.bgColor); setTextColor(d.textColor);
    setDefBg(d.defBg || "none"); setDefText(d.defText || "none"); setDefDur(d.defDur || 5);
    showToast("Draft restored");
  }, [showToast]);

  // Every control writes to the ACTIVE slide's override (so each slide is
  // independent) and updates the matching default (so the next slide inherits).
  // Each control writes ONLY to the active slide's override, so every slide's
  // duration / motion / animation is fully independent of the others.
  const patchActive = useCallback((patch: Partial<Override>) => {
    if (activeId) setOverrides((p) => ({ ...p, [activeId]: { ...p[activeId], ...patch } }));
  }, [activeId]);
  const setActiveBg = useCallback((m: MotionId) => patchActive({ motion: m }), [patchActive]);
  const setActiveTextAnim = useCallback((ta: TextAnimId) => patchActive({ textAnim: ta }), [patchActive]);
  const setActiveDur = useCallback((v: number) => patchActive({ durationSec: v }), [patchActive]);
  const setActiveTypeSize = useCallback((v: TypeSize) => patchActive({ typeSize: v }), [patchActive]);
  const setActivePlacement = useCallback((v: Placement) => patchActive({ placement: v }), [patchActive]);
  const setActiveAlign = useCallback((v: Align) => patchActive({ align: v }), [patchActive]);
  const setActiveLayout = useCallback((v: LayoutId) => patchActive({ layout: v }), [patchActive]);
  const setActiveBgColor = useCallback((v: string) => patchActive({ bgColor: v }), [patchActive]);
  const setActiveTextColor = useCallback((v: string) => patchActive({ textColor: v }), [patchActive]);

  const previewMax = aspect === "9:16" ? 300 : 380;
  const activeText = activeFrame ? tFor(activeFrame) : { headline: "", sub: "", body: "", value: "" };
  const aDur = activeFrame ? durFor(activeFrame) : defDur;
  // Effective per-slide style values shown in the controls.
  const aStyle = activeFrame ? styleFor(activeFrame) : null;
  const aCfg = activeFrame ? frameConfig(activeFrame) : { layout: "full-bleed" as LayoutId, placement: "bottom" as Placement, align: "left" as Align };
  const aTypeSize: TypeSize = activeFrame ? (overrides[activeFrame.id]?.typeSize ?? typeSize) : typeSize;
  const aPlacement: Placement = activeFrame ? (overrides[activeFrame.id]?.placement ?? aCfg.placement) : aCfg.placement;
  const aAlign: Align = activeFrame ? (overrides[activeFrame.id]?.align ?? aCfg.align) : aCfg.align;
  const aLayout: LayoutId = activeFrame ? (overrides[activeFrame.id]?.layout ?? aCfg.layout) : aCfg.layout;
  const activeStill = !!activeFrame && slideIsStill(activeFrame);
  const aBgColor = aStyle?.bgColor ?? bgColor;
  const aTextColor = aStyle?.textColor ?? textColor;
  const showMotion = typeDef.video || selFrames.length > 1;

  const isSequence = selFrames.length > 1;

  return (
    <div className="h-full flex flex-col bg-bone text-ink font-script">
      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-ink/13 px-5 sm:px-7 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 bg-ink text-bone font-display text-[18px] leading-none">S</span>
          <div>
            <p className="font-display text-[18px] leading-none text-ink">Social Composer</p>
            <p className="font-docket text-[9px] uppercase tracking-[0.18em] text-ink/52 mt-0.5">Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex border border-ink/17">
            {(["single", "batch"] as Mode[]).map((mm) => (
              <button key={mm} type="button" onClick={() => setMode(mm)}
                className={`font-docket text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border-r border-ink/13 last:border-r-0 ${mode === mm ? "bg-ink text-bone" : "text-ink/72 hover:bg-ink/8"}`}>
                {mm === "single" ? "Single composer" : "Batch create"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {mode === "batch" ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-6">
          <BatchView frames={frames} aspect={aspect} getImg={getImg} getVideo={getVideo} isCorp={isCorp} tFor={tFor} onBatchAll={onBatchAll} busy={busy === "batch"} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_1fr] overflow-y-auto lg:overflow-hidden">
          {/* LEFT — library (independent scroll) */}
          <aside
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onUpload(e.dataTransfer.files); }}
            className={`lg:h-full lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-ink/13 p-4 sm:p-5 ${dragOver ? "bg-oxblood/6" : ""}`}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-2">
                <span className="font-docket text-[12px] tracking-[0.14em] text-oxblood">02</span>
                <p className="font-docket text-[12px] uppercase tracking-[0.1em] text-ink">Assets</p>
              </div>
              {userFrames.length > 0 && (
                <button type="button" onClick={clearLibrary} className="font-docket text-[9px] uppercase tracking-[0.1em] text-ink/45 hover:text-oxblood">Clear → bin</button>
              )}
            </div>
            <p className="font-script text-[12px] text-ink/52 leading-snug mb-3">{frames.length} assets · {selected.length} picked · drag &amp; drop to add.</p>
            <div className="mb-3">
              <p className="font-docket text-[9px] uppercase tracking-[0.16em] text-oxblood mb-1.5">⚗ Transmutate a URL</p>
              <div className="flex gap-1.5">
                <input type="url" inputMode="url" value={tmUrl} onChange={(e) => setTmUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onTransmutate(); }}
                  placeholder="Paste an article / page URL…" disabled={busy === "transmutate"}
                  className="flex-1 min-w-0 font-docket text-[10px] bg-bone text-ink border border-ink/17 focus:border-ink/72 px-2.5 py-2 outline-none disabled:opacity-50" />
                <button type="button" onClick={onTransmutate} disabled={busy === "transmutate" || !tmUrl.trim()}
                  className="font-docket text-[10px] uppercase tracking-[0.1em] px-3 py-2 hover:opacity-90 disabled:opacity-40 shrink-0" style={{ backgroundColor: "#3B93D5", color: "#211e18" }}>
                  {busy === "transmutate" ? "Scanning…" : "Transmutate"}
                </button>
              </div>
              <p className="font-script text-[11px] text-ink/40 leading-snug mt-1.5">Pulls images, headline, quotes, overviews &amp; references into the library.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <UploadTile onUpload={onUpload} />
              {frames.map((f) => (
                <FrameThumb key={f.id} frame={f} aspect={aspect} isLogo={isCorp && f.kind === "portrait"} text={tFor(f)} getImg={getImg} getVideo={getVideo}
                  selected={selected.includes(f.id)} order={selected.indexOf(f.id)} multi={!!typeDef.multi}
                  onClick={() => { const i = selected.indexOf(f.id); toggleFrame(f.id); setPreviewIdx(i >= 0 ? i : selected.length); }}
                  onDelete={userFrames.some((u) => u.id === f.id) ? () => binItem(f.id) : undefined} />
              ))}
            </div>
            {bin.length > 0 && (
              <div className="mt-4 border-t border-ink/13 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-docket text-[10px] uppercase tracking-[0.14em] text-ink/56">Bin · {bin.length}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={restoreBin} className="font-docket text-[9px] uppercase tracking-[0.1em] text-ink/64 hover:text-ink">↩ Restore all</button>
                    <button type="button" onClick={emptyBin} className="font-docket text-[9px] uppercase tracking-[0.1em] hover:opacity-80" style={{ color: "#3B93D5" }}>✕ Empty bin</button>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                  {bin.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 py-1 border-b border-ink/8 last:border-0">
                      <span className="font-docket text-[8px] uppercase tracking-[0.08em] text-ink/38 shrink-0">{f.label}</span>
                      <span className="font-script text-[11px] text-ink/55 truncate">{tFor(f).headline || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT — composer (independent scroll) */}
          <section className="lg:h-full lg:overflow-y-auto px-4 sm:px-7 py-5">
            {/* 01 post type */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-docket text-[12px] tracking-[0.14em] text-oxblood">01</span>
              <p className="font-docket text-[12px] uppercase tracking-[0.1em] text-ink">Post type</p>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-7">
              {POST_TYPES.map((p) => (
                <button key={p.id} type="button" onClick={() => selectPostType(p.id)}
                  className={`flex flex-col items-start gap-1 border px-2.5 py-2.5 text-left transition-colors ${p.id === postType ? "border-oxblood bg-oxblood/8" : "border-ink/15 hover:border-ink/45"}`}>
                  <span className="text-[18px] leading-none text-ink/80" aria-hidden>{p.glyph}</span>
                  <span className="font-docket text-[9px] uppercase tracking-[0.08em] text-ink leading-tight">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-7">
              {/* Preview + filmstrip */}
              <div className="flex flex-col items-center gap-3">
                <span className="font-docket text-[10px] uppercase tracking-[0.12em] text-ink/48 self-start">Preview · {aspect} · {w} × {h}{isAnimated ? ` · ${totalDuration}s` : ""}</span>
                <div className="bg-bone border border-ink/17 overflow-hidden shadow-[0_18px_36px_-18px_rgba(0,0,0,0.7)]" style={{ width: previewMax, aspectRatio: `${w} / ${h}` }}>
                  <canvas ref={previewRef} style={{ width: "100%", height: "100%", display: "block" }} />
                </div>
                <div className="flex items-center gap-3">
                  {isAnimated && (
                    <button type="button" onClick={() => setPlaying((p) => !p)} className="font-docket text-[10px] uppercase tracking-[0.12em] text-ink/64 hover:text-oxblood border border-ink/20 px-2.5 py-1">{playing ? "❚❚ Pause" : "▶ Play"}</button>
                  )}
                  {selFrames.length > 1 && (
                    <span className="font-docket text-[10px] uppercase tracking-[0.12em] text-ink/52">Slide {Math.min(previewIdx, selFrames.length - 1) + 1} / {selFrames.length}</span>
                  )}
                </div>

                {/* Slide filmstrip (carousel / reel) */}
                {typeDef.multi && (
                  <div className="w-full mt-1" style={{ maxWidth: previewMax + 40 }}>
                    <p className="font-docket text-[9px] uppercase tracking-[0.12em] text-ink/48 mb-1.5">Slides · tap to edit, ‹ › reorder, × remove</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selFrames.map((f, i) => {
                        const active = i === Math.min(previewIdx, selFrames.length - 1);
                        return (
                          <div key={f.id} className="shrink-0 flex flex-col items-center gap-1">
                            <button type="button" onClick={() => setPreviewIdx(i)}
                              className={`relative overflow-hidden border ${active ? "border-oxblood ring-1 ring-oxblood" : "border-ink/20 hover:border-ink/50"}`}
                              style={{ width: 56, aspectRatio: `${w} / ${h}` }}>
                              <SlideMini frame={f} w={w} h={h} getImg={getImg} getVideo={getVideo} isLogo={isCorp && f.kind === "portrait"} text={tFor(f)} />
                              <span className="absolute top-0 left-0 grid place-items-center w-4 h-4 bg-oxblood text-bone font-docket text-[8px]">{i + 1}</span>
                            </button>
                            <div className="flex items-center gap-0.5">
                              <button type="button" onClick={() => moveSlide(f.id, -1)} aria-label="Move left" className="font-docket text-[11px] text-ink/45 hover:text-ink px-1">‹</button>
                              <button type="button" onClick={() => removeSlide(f.id)} aria-label="Remove slide" className="font-docket text-[11px] text-ink/45 hover:text-oxblood px-1">×</button>
                              <button type="button" onClick={() => moveSlide(f.id, 1)} aria-label="Move right" className="font-docket text-[11px] text-ink/45 hover:text-ink px-1">›</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 03 compose */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-docket text-[12px] tracking-[0.14em] text-oxblood">03</span>
                  <p className="font-docket text-[12px] uppercase tracking-[0.1em] text-ink">Compose{activeFrame ? ` · ${activeFrame.label}` : ""}</p>
                </div>
                <div className="flex flex-col gap-5">
                  {typeDef.aspects.length > 1 && (
                    <Control label="Aspect ratio"><Segmented options={typeDef.aspects.map((a) => ({ id: a, label: a }))} value={aspect} onChange={(v) => setAspect(v as Aspect)} /></Control>
                  )}
                  <Control label="Headline" action={source.headlineOptions.length > 0 ? <button type="button" onClick={onRandomise} className="font-docket text-[10px] uppercase tracking-[0.1em] text-ink/64 hover:text-oxblood">⤺ Randomise</button> : null}>
                    <textarea rows={3} value={activeText.headline} onChange={(e) => setActiveText({ headline: e.target.value })} disabled={!activeFrame}
                      className="font-script text-[16px] leading-snug bg-bone text-ink border border-ink/17 focus:border-ink/72 px-3 py-2.5 outline-none resize-y disabled:opacity-50" />
                  </Control>
                  <Control label="Sub text">
                    <textarea rows={3} value={activeText.sub} onChange={(e) => setActiveText({ sub: e.target.value })} disabled={!activeFrame}
                      className="font-script text-[16px] leading-snug bg-bone text-ink border border-ink/17 focus:border-ink/72 px-3 py-2.5 outline-none resize-y disabled:opacity-50" />
                  </Control>
                  <div className="grid grid-cols-2 gap-5">
                    <Control label="Type size"><Segmented options={TYPE_SIZES.map((s) => ({ id: s, label: s }))} value={aTypeSize} onChange={(v) => setActiveTypeSize(v as TypeSize)} /></Control>
                    <Control label="Text placement"><Segmented options={PLACEMENTS.map((p) => ({ id: p, label: p[0].toUpperCase() + p.slice(1) }))} value={aPlacement} onChange={(v) => setActivePlacement(v as Placement)} /></Control>
                  </div>
                  <Control label="Text alignment"><Segmented options={ALIGNS.map((a) => ({ id: a, label: a[0].toUpperCase() + a.slice(1) }))} value={aAlign} onChange={(v) => setActiveAlign(v as Align)} /></Control>
                  <Control label="Layout"><Dropdown options={LAYOUTS} value={aLayout} onChange={(v) => setActiveLayout(v as LayoutId)} /></Control>
                  <div className="grid grid-cols-2 gap-5">
                    <Control label="Background"><Swatches swatches={BG_SWATCHES} value={aBgColor} onChange={setActiveBgColor} /></Control>
                    <Control label="Text color"><Swatches swatches={TEXT_SWATCHES} value={aTextColor} onChange={setActiveTextColor} /></Control>
                  </div>
                  <div className="border-t border-ink/10 pt-5">
                    <p className="font-docket text-[10px] uppercase tracking-[0.16em] text-ink/56 mb-3">Motion {activeFrame ? `· this slide only` : ""} {showMotion ? "" : "· best for Story / Reel"}</p>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-5">
                        <Control label="Background motion"><Dropdown options={MOTION_PRESETS} value={activeFrame ? bgFor(activeFrame) : defBg} onChange={(v) => setActiveBg(v as MotionId)} /></Control>
                        <Control label="Text animation"><Dropdown options={TEXT_ANIMS} value={activeFrame ? taFor(activeFrame) : defText} onChange={(v) => setActiveTextAnim(v as TextAnimId)} /></Control>
                      </div>
                      <Control label={`Duration · ${aDur}s${selFrames.length > 1 ? ` · sequence ${seqTotal}s` : ""}`}>
                        <input type="range" min={1} max={15} step={1} value={aDur} onChange={(e) => setActiveDur(Number(e.target.value))} className="w-full accent-oxblood" />
                      </Control>
                      <Control label="Frame rate"><Segmented options={FPS_OPTS.map((f) => ({ id: String(f), label: `${f}` }))} value={String(fps)} onChange={(v) => setFps(Number(v))} /></Control>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 04 download */}
            <div className="mt-9 pt-6 border-t border-ink/13">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-docket text-[12px] tracking-[0.14em] text-oxblood">04</span>
                <p className="font-docket text-[12px] uppercase tracking-[0.1em] text-ink">Download &amp; post</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isSequence ? (
                  <>
                    <button type="button" onClick={onDownloadVideo} disabled={!!busy || !activeFrame} className="font-docket text-[11px] uppercase tracking-[0.12em] px-4 py-2.5 hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: "#3B93D5", color: "#211e18" }}>
                      {busy === "video" ? "Rendering…" : "↓ Sequence video (one file)"}
                    </button>
                    <button type="button" onClick={onDownloadPerSlide} disabled={!!busy || !activeFrame} className="font-docket text-[11px] uppercase tracking-[0.12em] text-ink border border-ink/28 hover:border-ink/72 px-4 py-2.5 disabled:opacity-40">
                      {busy === "zip" ? "Zipping…" : `↓ Per-slide ZIP (${selFrames.length})`}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={activeStill ? onDownloadPNG : onDownloadVideo} disabled={!!busy || !activeFrame} className="font-docket text-[11px] uppercase tracking-[0.12em] px-4 py-2.5 hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: "#3B93D5", color: "#211e18" }}>
                      {busy === "video" ? "Recording…" : busy === "png" ? "Generating…" : activeStill ? "↓ Download PNG" : "↓ Download MP4/WebM"}
                    </button>
                    <button type="button" onClick={activeStill ? onDownloadVideo : onDownloadPNG} disabled={!!busy || !activeFrame} className="font-docket text-[11px] uppercase tracking-[0.12em] text-ink border border-ink/28 hover:border-ink/72 px-4 py-2.5 disabled:opacity-40">
                      {activeStill ? "↓ MP4/WebM" : "↓ PNG (still)"}
                    </button>
                  </>
                )}
                <button type="button" onClick={onDownloadGIF} disabled={!!busy || !activeFrame} className="font-docket text-[11px] uppercase tracking-[0.12em] text-ink border border-ink/28 hover:border-ink/72 px-4 py-2.5 disabled:opacity-40">{busy === "gif" ? "Encoding…" : "↓ GIF"}</button>
                <button type="button" onClick={onCopyCaption} className="font-docket text-[11px] uppercase tracking-[0.12em] text-ink border border-ink/28 hover:border-ink/72 px-4 py-2.5">Copy caption</button>
                <button type="button" onClick={onSaveDraft} className="font-docket text-[11px] uppercase tracking-[0.12em] text-ink border border-ink/28 hover:border-ink/72 px-4 py-2.5">Save draft</button>
              </div>
              <p className="font-docket text-[10px] uppercase tracking-[0.1em] text-ink/44 mt-4">Per slide: still PNG when its motion + text animation are both None, otherwise an MP4/WebM clip. Sequence video renders all slides into one file. Nothing leaves your browser.</p>
              {drafts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 border border-ink/15 bg-bone px-2.5 py-1.5">
                      <button type="button" onClick={() => onRestore(d)} className="font-docket text-[10px] uppercase tracking-[0.08em] text-ink/72 hover:text-oxblood">{d.postType} · {d.selected.length}f</button>
                      <button type="button" onClick={() => persist(drafts.filter((x) => x.id !== d.id))} aria-label="Delete draft" className="font-docket text-[11px] text-ink/40 hover:text-oxblood">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {toast && <div role="status" aria-live="polite" className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-ink text-bone font-docket text-[11px] uppercase tracking-[0.12em] px-4 py-2">{toast}</div>}
    </div>
  );
}

/* ─── Library thumbnail ──────────────────────────────────────────────── */

function FrameThumb({ frame, aspect, isLogo, text, getImg, getVideo, selected, order, multi, onClick, onDelete }: {
  frame: ComposerFrame; aspect: Aspect; isLogo: boolean; text: { headline: string; sub: string };
  getImg: (u: string | null | undefined) => HTMLImageElement | null;
  getVideo?: (u: string | null | undefined) => HTMLVideoElement | null;
  selected: boolean; order: number; multi: boolean; onClick: () => void; onDelete?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { w, h } = ASPECT_DIMS[aspect];
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const rw = Math.round(w / 2), rh = Math.round(h / 2);
    canvas.width = rw; canvas.height = rh;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const c = frameConfig(frame);
    const style = { bgColor: "#08070A", textColor: "#ECE4D0", sizeMul: 1, placement: c.placement, align: c.align, layout: c.layout };
    const draw = () => drawFrame(ctx, rw, rh, frame, getImg, isLogo, text, style, STILL, getVideo);
    if (document.fonts?.ready) document.fonts.ready.then(draw).catch(() => {});
    else draw();
    const t = window.setTimeout(draw, 600);
    // video frames animate — keep redrawing
    const iv = frame.kind === "video" ? window.setInterval(draw, 250) : 0;
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, [frame, w, h, aspect, isLogo, text, getImg, getVideo]);
  return (
    <div className={`group relative overflow-hidden border bg-bone ${selected ? "border-oxblood ring-1 ring-oxblood" : "border-ink/15 hover:border-ink/45"}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <button type="button" onClick={onClick} title={`${frame.label} · ${text.headline}`} className="block w-full h-full">
        <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
      </button>
      {frame.kind === "video" && <span className="absolute inset-0 grid place-items-center pointer-events-none"><span className="grid place-items-center w-6 h-6 rounded-full bg-oxblood/90 text-bone text-[10px]">▶</span></span>}
      <span className="absolute bottom-1 left-1 font-docket text-[8px] uppercase tracking-[0.08em] bg-ink/70 text-bone px-1.5 py-0.5 pointer-events-none">{frame.label}</span>
      {selected && multi && order >= 0 && <span className="absolute top-1 left-1 grid place-items-center w-5 h-5 bg-oxblood text-bone font-docket text-[10px] pointer-events-none">{order + 1}</span>}
      {onDelete && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label={`Delete ${frame.label} from library`} title="Delete from library"
          className="absolute top-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-ink/75 text-bone text-[12px] leading-none hover:bg-oxblood opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">×</button>
      )}
    </div>
  );
}

/* ─── Batch view ─────────────────────────────────────────────────────── */

function BatchView({ frames, aspect, getImg, getVideo, isCorp, tFor, onBatchAll, busy }: {
  frames: ComposerFrame[]; aspect: Aspect; getImg: (u: string | null | undefined) => HTMLImageElement | null;
  getVideo?: (u: string | null | undefined) => HTMLVideoElement | null;
  isCorp: boolean; tFor: (f: ComposerFrame) => { headline: string; sub: string }; onBatchAll: () => void; busy: boolean;
}) {
  return (
    <section className="mt-6">
      <StepHeader n="✦" title="Batch create" hint="Every library frame, rendered on-brand and exported together as a single ZIP — one click." />
      <div className="flex items-center gap-3 my-4">
        <button type="button" onClick={onBatchAll} disabled={busy} className="font-docket text-[11px] uppercase tracking-[0.12em] px-4 py-2.5 hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: "#3B93D5", color: "#211e18" }}>
          {busy ? "Generating…" : `↓ Download all ${frames.length} frames (ZIP)`}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {frames.map((f) => (
          <FrameThumb key={f.id} frame={f} aspect={aspect} isLogo={isCorp && f.kind === "portrait"} text={tFor(f)} getImg={getImg} getVideo={getVideo} selected={false} order={-1} multi={false} onClick={() => {}} />
        ))}
      </div>
    </section>
  );
}

/* ─── Filmstrip mini-thumb ───────────────────────────────────────────── */

function SlideMini({ frame, w, h, getImg, getVideo, isLogo, text }: {
  frame: ComposerFrame; w: number; h: number; getImg: (u: string | null | undefined) => HTMLImageElement | null;
  getVideo?: (u: string | null | undefined) => HTMLVideoElement | null; isLogo: boolean; text: { headline: string; sub: string };
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const rw = Math.round(w / 4), rh = Math.round(h / 4);
    canvas.width = rw; canvas.height = rh;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const c = frameConfig(frame);
    const draw = () => drawFrame(ctx, rw, rh, frame, getImg, isLogo, text, { bgColor: "#08070A", textColor: "#ECE4D0", sizeMul: 1, placement: c.placement, align: c.align, layout: c.layout }, STILL, getVideo);
    draw();
    const t = window.setTimeout(draw, 600);
    const iv = frame.kind === "video" ? window.setInterval(draw, 300) : 0;
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, [frame, w, h, getImg, getVideo, isLogo, text]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

/* ─── primitives ─────────────────────────────────────────────────────── */

function StepHeader({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-docket text-[12px] tracking-[0.14em] text-oxblood">{n}</span>
      <div><p className="font-docket text-[12px] uppercase tracking-[0.1em] text-ink">{title}</p><p className="font-script text-[12px] text-ink/52 leading-snug">{hint}</p></div>
    </div>
  );
}
function Control({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="flex items-center justify-between"><span className="font-docket text-[10px] uppercase tracking-[0.16em] text-ink/56">{label}</span>{action}</span>{children}</label>;
}
function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap border border-ink/17 w-fit">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} className={`font-docket text-[11px] uppercase tracking-[0.08em] px-3 py-1.5 border-r border-ink/13 last:border-r-0 ${o.id === value ? "bg-ink text-bone" : "text-ink/72 hover:bg-ink/8"}`}>{o.label}</button>
      ))}
    </div>
  );
}
function Dropdown<T extends string>({ options, value, onChange }: { options: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className="font-docket text-[11px] uppercase tracking-[0.06em] bg-bone text-ink border border-ink/17 focus:border-ink/72 px-2.5 py-1.5 outline-none">
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}
function Swatches({ swatches, value, onChange }: { swatches: Array<{ name: string; value: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {swatches.map((s) => (
        <button key={s.value} type="button" onClick={() => onChange(s.value)} aria-label={s.name} title={s.name}
          className={`w-7 h-7 rounded-full border ${value.toLowerCase() === s.value.toLowerCase() ? "ring-2 ring-oxblood border-oxblood" : "border-ink/25"}`} style={{ backgroundColor: s.value }} />
      ))}
      <label className="w-7 h-7 rounded-full border border-ink/25 overflow-hidden relative cursor-pointer" title="Custom colour">
        <span className="absolute inset-0 grid place-items-center font-docket text-[12px] text-ink/64 pointer-events-none">+</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
  );
}
function UploadTile({ onUpload }: { onUpload: (files: FileList | null) => void }) {
  return (
    <label className="border border-dashed border-ink/30 hover:border-oxblood grid place-items-center cursor-pointer bg-bone" style={{ aspectRatio: "4 / 5" }}>
      <span className="flex flex-col items-center gap-1 text-ink/56"><span className="text-[22px] leading-none">＋</span><span className="font-docket text-[9px] uppercase tracking-[0.08em] text-center px-1">Upload image / video</span></span>
      <input type="file" accept="image/*,video/*" multiple onChange={(e) => onUpload(e.target.files)} className="hidden" />
    </label>
  );
}
