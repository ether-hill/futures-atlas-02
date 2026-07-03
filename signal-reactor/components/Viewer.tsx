"use client";

/**
 * The deck viewer: a fixed 1280×720 board scaled to fit the viewport,
 * keyboard navigation (←/→/Space, Esc closes full screen), dot rail, counter,
 * prominent PPTX/PDF/new-briefing actions, a full-screen lightbox, and the
 * standing honesty frame directly beneath the deck.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Deck } from "../lib/types";
import { HONESTY_LINE, SLIDE_SLUGS } from "../lib/types";
import { SlideBoard } from "./Slides";

export function Viewer({ deck, onNew }: { deck: Deck; onNew: () => void }) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [lbScale, setLbScale] = useState(0.9);
  const [fullscreen, setFullscreen] = useState(false);
  const [exporting, setExporting] = useState<null | "pdf" | "pptx">(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const total = deck.slides.length;

  async function downloadPptx() {
    if (exporting) return;
    setExporting("pptx");
    try {
      const { buildPptx } = await import("../lib/export-pptx");
      await buildPptx(deck);
    } finally {
      setExporting(null);
    }
  }

  // PDF needs the hidden export stage mounted first; capture runs in the effect
  useEffect(() => {
    if (exporting !== "pdf") return;
    let cancelled = false;
    (async () => {
      try {
        const nodes = Array.from(exportRef.current?.querySelectorAll<HTMLElement>(".board") ?? []);
        if (!nodes.length) return;
        const { buildPdf } = await import("../lib/export-pdf");
        await buildPdf(nodes, deck);
      } finally {
        if (!cancelled) setExporting(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exporting, deck]);

  const go = useCallback(
    (d: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + d))),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const s = Math.min(el.clientWidth / 1280, el.clientHeight / 720, 1);
      setScale(Math.max(s, 0.15));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // lightbox: fill the viewport, lock page scroll while open
  useEffect(() => {
    if (!fullscreen) return;
    const measure = () =>
      setLbScale(Math.min((window.innerWidth - 56) / 1280, (window.innerHeight - 150) / 720));
    measure();
    window.addEventListener("resize", measure);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", measure);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const dots = (extra = "") => (
    <div className={`controls ${extra}`} onClick={(e) => e.stopPropagation()}>
      <button className="nav-btn" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous slide">
        ← Prev
      </button>
      <div className="dots" role="tablist" aria-label="Slides">
        {deck.slides.map((s, i) => (
          <button
            key={i}
            className="dot"
            aria-current={i === index}
            aria-label={`Slide ${i + 1}: ${SLIDE_SLUGS[s.type]}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      <span className="counter">
        {String(index + 1).padStart(2, "0")} — {String(total).padStart(2, "0")}
      </span>
      <button className="nav-btn" onClick={() => go(1)} disabled={index === total - 1} aria-label="Next slide">
        Next →
      </button>
    </div>
  );

  return (
    <div className="viewer">
      <div className="viewer-top">
        <h2 className="deck-title">{deck.sector}</h2>
        <div className="actions">
          <button className="action-btn action-btn--download" onClick={downloadPptx} disabled={!!exporting}>
            {exporting === "pptx" ? "Preparing PPTX…" : "↓ Download PPTX"}
          </button>
          <button
            className="action-btn action-btn--download"
            onClick={() => setExporting("pdf")}
            disabled={!!exporting}
          >
            {exporting === "pdf" ? "Preparing PDF…" : "↓ Download PDF"}
          </button>
          <button className="action-btn" onClick={onNew}>
            ← New briefing
          </button>
        </div>
      </div>

      <div className="stage-wrap" ref={stageRef} style={{ minHeight: "min(62vh, 720px)" }}>
        <div style={{ width: 1280 * scale, height: 720 * scale, position: "relative" }}>
          <div className="board-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <SlideBoard deck={deck} index={index} />
          </div>
          <button
            className="fs-btn"
            onClick={() => setFullscreen(true)}
            aria-label="View the deck full screen"
            title="Full screen"
          >
            ⛶
          </button>
        </div>
      </div>

      {dots()}

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {total}: {SLIDE_SLUGS[deck.slides[index].type]}
      </p>

      <div className="viewer-honesty">
        <p className="honesty">{HONESTY_LINE}</p>
      </div>

      {/* hidden full-size boards, mounted only while a PDF export runs */}
      {exporting === "pdf" && (
        <div className="export-stage" ref={exportRef} aria-hidden="true">
          {deck.slides.map((_, i) => (
            <SlideBoard key={i} deck={deck} index={i} />
          ))}
        </div>
      )}

      {/* full-screen lightbox — portaled to <body> so ancestor transforms
          (e.g. the Reveal entrance) can't hijack its fixed positioning */}
      {fullscreen &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${deck.sector} briefing, full screen`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setFullscreen(false);
            }}
          >
            <button className="lightbox-close" onClick={() => setFullscreen(false)} autoFocus>
              ✕ Close
            </button>
            <div style={{ width: 1280 * lbScale, height: 720 * lbScale }}>
              <div className="board-scale" style={{ transform: `scale(${lbScale})`, transformOrigin: "top left" }}>
                <SlideBoard deck={deck} index={index} />
              </div>
            </div>
            {dots("controls--lightbox")}
          </div>,
          document.body,
        )}
    </div>
  );
}
