"use client";

import { useState } from "react";
import { PostSlide, SlideFrame, SlideStyles } from "../instagram/Slide";
import { TERM_POSTS } from "../instagram/fields";

/**
 * Candidate grounds for the vocabulary cards. Every one is something the site
 * already makes, running live and blurred until it is only colour and motion:
 * the Interference fields (which loop exactly, so a reel of one has no seam)
 * and pieces from the generatives player. No stock footage, and nothing with
 * words in it, because blurred type still reads as smudges.
 */

// The player does not fill in defaults: every param a piece reads has to be
// passed, or its uniforms go NaN and it draws black.
// Piece-config payload for the embedded canvas, not UI styling (see CLAUDE.md).
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");
const gen = (pieceId: string, lo: string, hi: string, params: Record<string, number> = {}) =>
  `/generatives/embed.html#${b64(JSON.stringify({
    pieceId,
    seed: `term-${pieceId}`,
    params,
    size: { w: 540, h: 960 },
    meta: { complexity: 0.3, chaos: 0.5 },
    theme: "quantum-ink",
    colors: { bg: "#05060a", lo, hi },
  }))}`;
const wave = (v: string, pal: number, extra = "") =>
  `/interference/embed.html?v=${v}&pal=${pal}&label=0&grain=0${extra}`;

type Variant = { name: string; note: string; src: string; blur: number; dim: number; video?: boolean };

const VARIANTS: Variant[] = [
  { name: "Droplets, ice", note: "Interference · blur 22", src: wave("droplets", 0), blur: 22, dim: 0.3 },
  { name: "Thin film, ember", note: "Interference · blur 26", src: wave("thin-film", 1), blur: 26, dim: 0.35 },
  { name: "Speckle, verdigris", note: "Interference · blur 30", src: wave("speckle", 2), blur: 30, dim: 0.3 },
  { name: "Rain, ice, light blur", note: "Interference · blur 10", src: wave("rain", 0), blur: 10, dim: 0.45 },
  { name: "Ripple tank, violet", note: "Interference · blur 24", src: wave("ripple-tank", 4, "&hex=%237c5cff"), blur: 24, dim: 0.3 },
  { name: "Contours, ember", note: "Interference · blur 16", src: wave("contours", 1), blur: 16, dim: 0.4 },
  { name: "Moire, bone", note: "Interference · blur 20", src: wave("moire", 3), blur: 20, dim: 0.35 },
  { name: "Plasma, violet to cyan", note: "Generatives · blur 28", src: gen("plasma", "#7c5cff", "#22d3ee", { uScale: 2.4, uWarp: 1.6, uOct: 5, uContrast: 1.2, uShift: 0, uGlow: 0.55 }), blur: 28, dim: 0.35 },
  { name: "Domain warp, magenta to amber", note: "Generatives · blur 30", src: gen("domain-warp", "#e05cff", "#ffb14d", { zoom: 1.4, glow: 0.7 }), blur: 30, dim: 0.4 },
  { name: "Wave interference, cyan to magenta", note: "Generatives · blur 22", src: gen("wave-interference", "#22d3ee", "#e05cff", { uSources: 5, uFreq: 30, uSym: 1, uBands: 2.5, uGlow: 0.5 }), blur: 22, dim: 0.35 },
  { name: "Homepage field, blue to green", note: "Generatives · blur 8", src: gen("field-dynamics", "#3a7abf", "#57e88f", { singularities: 4, speed: 1, fade: 0.02, lineWidth: 1.6 }), blur: 8, dim: 0.3 },
  { name: "Slime mould footage", note: "Real footage · blur 36", src: "/mocks/instagram/jones-slime.webm", blur: 36, dim: 0.25, video: true },
];

const W = 300;

export default function TermBackgrounds() {
  const [term, setTerm] = useState(2);
  const post = TERM_POSTS[term]!;
  return (
    <div className="min-h-screen bg-[#0b0c0f] px-4 py-10 text-paper">
      <SlideStyles />
      <style>{`
        .tbg .stf, .tbg .term-card { background: transparent !important; }
        .tbg .tex-field, .tbg .tex-rule { display: none !important; }
        .tbg-ground { position: absolute; inset: 0; overflow: hidden; background: #05060a; }
        .tbg-ground > iframe, .tbg-ground > video {
          position: absolute; left: -10%; top: -10%; width: 120%; height: 120%;
          border: 0; object-fit: cover; pointer-events: none;
        }
      `}</style>
      <div className="mx-auto max-w-[1340px]">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Vocabulary card backgrounds</h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-[1.6] text-paper/60">
          Twelve blurred, moving grounds for the word cards, all made from things the site already runs.
          The card itself is unchanged, apart from the node field and grid being taken off.
        </p>
        <div className="mt-5 flex gap-2">
          {TERM_POSTS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setTerm(i)}
              className={`rounded-[2px] border px-3 py-2 text-[16px] ${i === term ? "border-[#f2ede2] bg-[#f2ede2] text-[#17181b]" : "border-paper/25 text-paper"}`}
            >
              {p.term}
            </button>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-6 gap-y-10">
          {VARIANTS.map((v, i) => (
            <figure key={v.name} className="m-0">
              <div className="tbg relative" style={{ width: W }}>
                <SlideFrame width={W} ratio="9:16">
                  <div style={{ position: "absolute", inset: 0 }}>
                    <div className="tbg-ground">
                      {v.video ? (
                        <video src={v.src} autoPlay muted loop playsInline style={{ filter: `blur(${v.blur}px) saturate(1.2)` }} />
                      ) : (
                        <iframe src={v.src} title={v.name} style={{ filter: `blur(${v.blur}px) saturate(1.2)` }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: `rgba(5,6,10,${v.dim})` }} />
                    </div>
                    <div style={{ position: "absolute", inset: 0 }}>
                      <PostSlide post={post} index={0} ratio="9:16" />
                    </div>
                  </div>
                </SlideFrame>
              </div>
              <figcaption className="mt-3 text-[14px]">
                <span className="text-paper/40">{String(i + 1).padStart(2, "0")}</span>{" "}
                <span className="font-semibold">{v.name}</span>
                <div className="text-[12px] text-paper/50">{v.note}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
