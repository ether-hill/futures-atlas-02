"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "./Container";

/**
 * Home hero — full-viewport draggable wipe between a desaturated 2025 photo
 * (left) and an accent-tinted 2050 render (right). Drag handlers + pointer
 * capture live on the SECTION (capturing on the small handle stole the move
 * events and broke dragging). Colours here are literal so the hero looks the
 * same in light and dark — it's always dark scrims + light text over a photo.
 */
export function HeroSlider({
  beforeImage,
  afterImage,
  onConsult,
}: {
  beforeImage: string;
  afterImage: string;
  /** When set, "Consult the oracle" opens the consultation in place instead of navigating. */
  onConsult?: () => void;
}) {
  // Starts fully revealing the 2025 side (divider hard right), then the intro
  // animation sweeps it left to reveal 2050, then settles at halfway.
  const [pct, setPct] = useState(100);
  const frame = useRef<HTMLElement>(null);
  const interacted = useRef(false);

  const fromX = useCallback((clientX: number) => {
    const el = frame.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  // Intro sweep on load: 100% → 0% → 66%. Cancels the moment the visitor
  // interacts; respects reduced-motion (jumps straight to 66%).
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setPct(66);
      return;
    }
    const legs = [
      { from: 100, to: 0, at: 0, dur: 1014 },
      { from: 0, to: 66, at: 1170, dur: 728 },
    ];
    const total = 1900;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (interacted.current) return;
      const e = now - start;
      if (e >= total) {
        setPct(66);
        return;
      }
      const leg = e < legs[1].at ? legs[0] : legs[1];
      const lt = Math.max(0, Math.min(1, (e - leg.at) / leg.dur));
      setPct(leg.from + (leg.to - leg.from) * ease(lt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Drag via window listeners — robust across mouse/touch and any capture quirks.
  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      interacted.current = true;
      fromX(e.clientX);
      const onMove = (ev: PointerEvent) => fromX(ev.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [fromX],
  );

  const key = (e: React.KeyboardEvent) => {
    interacted.current = true;
    if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 2));
    if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 2));
    if (e.key === "Home") setPct(0);
    if (e.key === "End") setPct(100);
  };
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <section
      ref={frame}
      onPointerDown={startDrag}
      className="relative min-h-[600px] w-full cursor-ew-resize touch-none select-none overflow-hidden bg-haze"
      style={{ height: "100svh" }}
    >
      {/* 2050 — accent-tinted render, full frame */}
      <div className="pointer-events-none absolute inset-0">
        <Image src={afterImage} alt="The village in 2050 — a forecast" fill priority className="object-cover" />
        <div className="absolute inset-0 mix-blend-multiply" style={{ background: "color-mix(in oklch, var(--color-accent) 34%, transparent)" }} />
      </div>

      {/* 2025 — desaturated photo, clipped */}
      <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 calc(100% - ${pct}%) 0 0)` }}>
        <Image src={beforeImage} alt="The village today, 2025" fill priority className="object-cover saturate-[0.5]" />
        <div className="absolute inset-0 bg-[#211e18]/30" />
      </div>

      {/* legibility scrims — a top wash for the year labels + a left wash
          behind the centred headline block */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[#211e18]/55 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#211e18]/70 via-[#211e18]/20 to-transparent" aria-hidden />

      {/* year labels — inside the Container so they align with the headline */}
      <div className="pointer-events-none absolute inset-x-0 top-[clamp(78px,11vh,108px)] z-[12]">
        <Container className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f4efe4]/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">Now</div>
            <div className="year text-[clamp(34px,6vw,84px)] leading-[0.9] text-[#f4efe4] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">2026</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f4efe4]/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">Forecast</div>
            <div className="year text-[clamp(34px,6vw,84px)] leading-[0.9] text-[#f4efe4] [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">2050</div>
          </div>
        </Container>
      </div>

      {/* divider + handle */}
      <div className="pointer-events-none absolute inset-y-0 z-[14] w-0.5 bg-[#f4efe4] shadow-[0_0_0_1px_rgba(33,30,24,0.15),0_0_24px_rgba(33,30,24,0.3)]" style={{ left: `${pct}%` }}>
        <button
          type="button"
          role="slider"
          tabIndex={0}
          aria-label="Drag to move between 2025 and the 2050 forecast"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          onKeyDown={key}
          className="pointer-events-auto absolute left-1/2 top-1/2 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center gap-1 rounded-full border-[1.5px] border-[#211e18]/20 bg-[#f4efe4] text-[#211e18] shadow-[0_6px_24px_rgba(33,30,24,0.28)]"
        >
          <span className="text-[15px] leading-none">‹</span>
          <span className="h-[18px] w-px bg-[#211e18]/25" />
          <span className="text-[15px] leading-none">›</span>
        </button>
      </div>

      {/* overlaid content — vertically centred in the hero; pointer-transparent
          so the whole hero drags, only the links re-enable pointer events */}
      <div className="pointer-events-none absolute inset-0 z-[16] flex items-center">
        <Container className="flex w-full flex-col items-start gap-5">
          <div className="w-full md:w-2/3">
            <h1 className="text-[clamp(34px,6.6vw,92px)] font-extrabold leading-[0.97] tracking-[-0.025em] text-[#f4efe4] text-balance [text-shadow:0_2px_30px_rgba(0,0,0,0.6)]">
              What does the future hold for Europe&rsquo;s emptying villages?
            </h1>
            <p className="mt-5 max-w-[560px] font-mono text-[clamp(12px,1.3vw,15px)] leading-[1.65] text-[#f4efe4]/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.7)]">
              As people keep moving to overcrowded cities, the countryside
              empties. Tell the oracle about your village, and see a forecast of
              how it could be revived by 2050.
            </p>
          </div>
          <div onPointerDown={stop} className="pointer-events-auto flex flex-wrap items-center gap-3">
            {onConsult ? (
              <button type="button" onClick={onConsult} className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper shadow-[0_8px_30px_rgba(33,30,24,0.25)] transition-colors hover:bg-accent-deep">
                Consult the oracle <span className="text-[14px]">→</span>
              </button>
            ) : (
              <Link href="/oracle" className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper shadow-[0_8px_30px_rgba(33,30,24,0.25)] transition-colors hover:bg-accent-deep">
                Consult the oracle <span className="text-[14px]">→</span>
              </Link>
            )}
          </div>
        </Container>
      </div>
    </section>
  );
}
