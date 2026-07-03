"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The homepage hero's living background: the Generatives "Field Dynamics"
 * piece, embedded via its chrome-free player (/generatives/embed.html#<cfg>)
 * on an always-black stage — the banner does not follow the light theme.
 * Every cycle draws a new colourful flow palette. A countdown chip
 * re-randomises the field every 11 seconds; clicking randomises now.
 * Reduced-motion users get the static black hero (no iframe, no timer).
 *
 * Performance: complexity is capped (it maps to the piece's particle count),
 * and an IntersectionObserver unmounts the iframe + pauses the timer while
 * the hero is scrolled out of view, so the sim never burns CPU behind the
 * rest of the page.
 */

const CYCLE_S = 11;
const RING = 2 * Math.PI * 6.5; // circumference of the countdown ring

// Colour data below is piece-config payload for the embedded canvas — not UI
// styling — a documented exception like the hero scrims (see CLAUDE.md).
const FIELD_BG = "#05060a";
const PALETTES = [
  { lo: "#7c5cff", hi: "#22d3ee" }, // violet → cyan
  { lo: "#e05cff", hi: "#ffb14d" }, // magenta → amber
  { lo: "#3a7abf", hi: "#57e88f" }, // blue → green
  { lo: "#ff6a3d", hi: "#ffd166" }, // ember → gold
  { lo: "#22d3ee", hi: "#e05cff" }, // cyan → magenta
];

// base64 config the embed player reads from its hash (see generatives/src/core/config.ts)
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));

function makeSrc(): string {
  const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const cfg = {
    pieceId: "field-dynamics",
    seed: Math.random().toString(36).slice(2, 10),
    params: {
      singularities: randInt(2, 7),
      speed: rand(1.2, 5.5),
      fade: rand(0.006, 0.04),
      lineWidth: rand(0.8, 2.2),
    },
    size: { w: 1600, h: 900 },
    // complexity drives particle count (300–6000): the ~1500–2600 band is the
    // quality floor the owner signed off on — don't lower it again, and keep
    // the render at full resolution (a half-res upscale was rejected as too
    // low quality)
    meta: { complexity: rand(0.22, 0.4), chaos: rand(0.3, 0.75) },
    theme: "quantum-ink",
    colors: { bg: FIELD_BG, ...pal },
  };
  return `/generatives/embed.html#${b64(JSON.stringify(cfg))}`;
}

export function HeroField() {
  const [src, setSrc] = useState<string | null>(null);
  const [left, setLeft] = useState(CYCLE_S);
  const [inView, setInView] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  const randomise = useCallback(() => {
    setSrc(makeSrc());
    setLeft(CYCLE_S);
  }, []);

  // pause the whole show while the hero is scrolled out of view
  useEffect(() => {
    const host = hostRef.current?.parentElement;
    if (!host) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.02 });
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!inView) return;
    setSrc((s) => s ?? makeSrc());
    const tick = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setSrc(makeSrc());
          return CYCLE_S;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [inView]);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {src && inView && (
        <iframe
          key={src}
          src={src}
          title=""
          tabIndex={-1}
          loading="eager"
          className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-80"
        />
      )}
      {/* scrim so the headline and lede stay readable over the field — heavier
          on small screens (rgba black over texture — documented exception,
          like other hero scrims; see globals.css .hero-scrim) */}
      <div className="hero-scrim pointer-events-none absolute inset-0" />
      {src && (
        <button
          type="button"
          onClick={randomise}
          className="pointer-events-auto absolute bottom-5 right-5 z-[2] inline-flex items-center gap-2.5 rounded-[2px] border border-paper/25 bg-black/60 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/75 transition-colors hover:border-paper/60 hover:text-paper"
          aria-label={`Reseed the background field now (reseeds itself in ${left} seconds)`}
        >
          Reseed
          {/* circular countdown: the ring drains over the 11s cycle */}
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="-rotate-90">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - left / CYCLE_S)}
              style={{ transition: left === CYCLE_S ? "none" : "stroke-dashoffset 1s linear" }}
            />
          </svg>
        </button>
      )}
    </div>
  );
}
