"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The homepage hero's living background: the Generatives "Field Dynamics"
 * piece, embedded via its chrome-free player (/generatives/embed.html#<cfg>),
 * themed to the site's palette in both light and dark. A countdown chip
 * re-randomises the field every 11 seconds — clicking it randomises now.
 * Reduced-motion users get the static hero (no iframe, no timer).
 */

const CYCLE_S = 11;

// base64 config the embed player reads from its hash (see generatives/src/core/config.ts)
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));

function makeSrc(dark: boolean): string {
  const cfg = {
    pieceId: "field-dynamics",
    seed: Math.random().toString(36).slice(2, 10),
    params: {
      singularities: randInt(2, 8),
      speed: rand(1.2, 5.5),
      fade: rand(0.006, 0.04),
      lineWidth: rand(0.8, 2.2),
    },
    size: { w: 1600, h: 900 },
    meta: { complexity: rand(0.35, 0.8), chaos: rand(0.3, 0.75) },
    theme: "quantum-ink",
    // match the Atlas tokens so the field belongs to the page in either theme
    colors: dark
      ? { bg: "#17140f", lo: "#6b6456", hi: "#7fb2e8" }
      : { bg: "#f4efe4", lo: "#9a9484", hi: "#3a7abf" },
  };
  return `/generatives/embed.html#${b64(JSON.stringify(cfg))}`;
}

export function HeroField() {
  const [src, setSrc] = useState<string | null>(null);
  const [left, setLeft] = useState(CYCLE_S);
  const darkRef = useRef(false);

  const randomise = useCallback(() => {
    setSrc(makeSrc(darkRef.current));
    setLeft(CYCLE_S);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    darkRef.current = document.documentElement.classList.contains("dark");
    randomise();

    // follow the site theme toggle live
    const mo = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      if (dark !== darkRef.current) {
        darkRef.current = dark;
        randomise();
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const tick = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setSrc(makeSrc(darkRef.current));
          return CYCLE_S;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      mo.disconnect();
      clearInterval(tick);
    };
  }, [randomise]);

  if (!src) return null;

  return (
    <>
      <iframe
        key={src}
        src={src}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        loading="eager"
        className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-60"
      />
      {/* scrim so the headline and lede stay readable over the field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, var(--bg) 18%, transparent 64%), linear-gradient(0deg, var(--bg) 2%, transparent 34%)",
        }}
      />
      <button
        type="button"
        onClick={randomise}
        className="absolute bottom-5 right-5 z-[2] inline-flex items-center gap-2 rounded-[2px] border border-ink/25 bg-surface/60 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-70 backdrop-blur-sm transition-colors hover:border-ink/60 hover:text-ink"
        aria-label={`Randomise the background field now (auto-randomises in ${left} seconds)`}
      >
        ↻ Randomise <span className="tabular-nums text-ink/50">0:{String(left).padStart(2, "0")}</span>
      </button>
    </>
  );
}
