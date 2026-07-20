"use client";

/**
 * Home-lab shared machinery — design-exploration components for the four
 * homepage variants under /home-lab. Exploratory by design: these are NOT
 * wired into the real homepage. Visual configs feed the Generatives embed
 * player (same b64-hash contract as HeroField).
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");

export interface EmbedSpec {
  pieceId: string;
  seed?: string;
  params?: Record<string, number>;
  meta?: { complexity: number; chaos: number };
  colors?: { bg: string; lo: string; hi: string };
}

export function embedSrc(spec: EmbedSpec): string {
  const cfg = {
    pieceId: spec.pieceId,
    seed: spec.seed ?? "home-lab",
    params: spec.params ?? {},
    size: { w: 1600, h: 900 },
    meta: spec.meta ?? { complexity: 0.5, chaos: 0.5 },
    theme: "quantum-ink",
    ...(spec.colors ? { colors: spec.colors } : {}),
  };
  return `/generatives/embed.html#${b64(JSON.stringify(cfg))}`;
}

/** Full-bleed generative backdrop (iframe, decorative, pauses via unmount off-screen). */
export function Backdrop({ spec, opacity = 0.75 }: { spec: EmbedSpec; opacity?: number }) {
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.02 });
    io.observe(host);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {inView && (
        <iframe
          src={embedSrc(spec)}
          title=""
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
          style={{ opacity }}
        />
      )}
    </div>
  );
}

/** The Trajectories artwork as a backdrop: same-origin iframe with the control
 *  panel + chrome hidden. The CC BY-NC attribution line stays visible (required). */
export function TrajectoriesBackdrop({ opacity = 0.9 }: { opacity?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  // keep re-injecting until the style lands — the app injects its own nav
  // late, and iframe load timing races React's onLoad
  useEffect(() => {
    const t = setInterval(() => {
      try {
        const doc = ref.current?.contentDocument;
        if (!doc?.head) return;
        if (doc.getElementById("hl-hide")) {
          clearInterval(t);
          return;
        }
        const style = doc.createElement("style");
        style.id = "hl-hide";
        style.textContent =
          ".lil-gui,.fa-share,.fa-shell,.fa-subnav,header,h1,.title,.fs-btn{display:none!important}";
        doc.head.appendChild(style);
      } catch {
        /* cross-origin in odd contexts — fine, worst case the panel shows */
      }
    }, 400);
    return () => clearInterval(t);
  }, []);
  return (
    <iframe
      ref={ref}
      src="/trajectories/"
      title="Trajectories — after Jeongho Park (CC BY-NC 4.0)"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full border-0"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

/** Generic auto-advancing carousel: children are slides; dots + arrows. */
export function Carousel({
  children,
  intervalMs = 6000,
  className = "",
}: {
  children: React.ReactNode[];
  intervalMs?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const n = children.length;
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), intervalMs);
    return () => clearInterval(t);
  }, [n, intervalMs, paused]);
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.6,0.2,1)]"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {children.map((c, k) => (
            <div key={k} className="w-full shrink-0">
              {c}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-2">
          {children.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Slide ${k + 1}`}
              onClick={() => setI(k)}
              className={`h-[3px] w-8 rounded-full transition-colors ${k === i ? "bg-accent" : "bg-ink/20 hover:bg-ink/40"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/25 text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => setI((v) => (v + 1) % n)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/25 text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

/** Netflix-style horizontal scroll row with edge arrows and snap. */
export function ScrollRow({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="group/row">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink/60">{title}</h3>
        <div className="flex gap-2 opacity-0 transition-opacity group-hover/row:opacity-100">
          <button type="button" aria-label="Scroll left" onClick={() => by(-1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/25 text-ink/70 hover:border-ink hover:text-ink">←</button>
          <button type="button" aria-label="Scroll right" onClick={() => by(1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/25 text-ink/70 hover:border-ink hover:text-ink">→</button>
        </div>
      </div>
      <div
        ref={ref}
        className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

/** Lab chrome: a slim switcher bar between the four variants. */
export function LabBar({ current }: { current: number }) {
  return (
    <div className="sticky top-0 z-20 border-b border-ink/15 bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-[var(--gutter,28px)] py-2.5">
        <Link href="/home-lab" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60 hover:text-ink">
          ⌂ Home lab
        </Link>
        {/* right padding clears the site's floating SHARE pill */}
        <div className="flex gap-1.5 pr-[120px]">
          {[1, 2, 3, 4].map((v) => (
            <Link
              key={v}
              href={`/home-lab/v${v}`}
              aria-current={v === current ? "page" : undefined}
              className={`rounded-[2px] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                v === current ? "bg-band text-paper" : "text-ink/60 hover:bg-ink/10 hover:text-ink"
              }`}
            >
              V{v}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
