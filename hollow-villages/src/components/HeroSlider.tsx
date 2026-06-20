"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
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
}: {
  beforeImage: string;
  afterImage: string;
}) {
  const [pct, setPct] = useState(50);
  const frame = useRef<HTMLElement>(null);

  const fromX = useCallback((clientX: number) => {
    const el = frame.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  // Drag via window listeners — robust across mouse/touch and any capture quirks.
  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
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

      {/* legibility scrims */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[#211e18]/55 to-transparent" aria-hidden />

      {/* year labels — inside the Container so they align with the headline */}
      <div className="pointer-events-none absolute inset-x-0 top-[clamp(78px,11vh,108px)] z-[12]">
        <Container className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f4efe4]/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">Now</div>
            <div className="year text-[clamp(34px,6vw,84px)] leading-[0.9] text-[#f4efe4] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">2025</div>
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

      {/* overlaid content — pointer-transparent so the whole hero drags;
          only the links re-enable pointer events (and stop the drag) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[16] bg-gradient-to-t from-[#211e18]/90 via-[#211e18]/45 to-transparent pt-44">
        <Container className="flex flex-col items-start gap-5 pb-[clamp(34px,6vh,72px)]">
          <div className="max-w-[760px]">
            <div className="mb-[18px] inline-flex items-center gap-2.5 rounded-[2px] bg-[#f4efe4] px-3 py-[7px] font-mono text-[clamp(9.5px,1.1vw,11px)] uppercase tracking-[0.16em] text-[#211e18]">
              <span className="h-[7px] w-[7px] shrink-0 bg-accent" />
              Forecasts what rural places could become by 2050
            </div>
            <h1 className="text-[clamp(34px,6.6vw,92px)] font-extrabold leading-[0.97] tracking-[-0.025em] text-[#f4efe4] text-balance [text-shadow:0_2px_30px_rgba(0,0,0,0.6)]">
              A village is not dying.
              <br />
              It is between uses.
            </h1>
            <p className="mt-5 max-w-[560px] font-mono text-[clamp(12px,1.3vw,15px)] leading-[1.65] text-[#f4efe4]/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.7)]">
              The oracle reads a place as it is now — who has left, what stands
              empty, how people move, where the work is — and forecasts what it
              could become by 2050. Every answer points to somewhere it has
              already worked.
            </p>
          </div>
          <div onPointerDown={stop} className="pointer-events-auto flex flex-wrap items-center gap-3">
            <Link href="/oracle" className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper shadow-[0_8px_30px_rgba(33,30,24,0.25)] transition-colors hover:bg-accent-deep">
              Consult the oracle <span className="text-[14px]">→</span>
            </Link>
            <Link href="/research" className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-[#f4efe4]/60 px-[21px] py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[#f4efe4] transition-colors hover:border-[#f4efe4] hover:bg-[#f4efe4]/10">
              See the research
            </Link>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#f4efe4]/85">
              ⇆ Drag the line
            </span>
          </div>
        </Container>
      </div>
    </section>
  );
}
