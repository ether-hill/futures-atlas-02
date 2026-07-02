"use client";

/**
 * The deck viewer: a fixed 1280×720 board scaled to fit the viewport,
 * keyboard navigation (←/→/Space), dot rail, counter, and the standing
 * honesty frame directly beneath the deck.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Deck } from "../lib/types";
import { HONESTY_LINE, SLIDE_SLUGS } from "../lib/types";
import { SlideBoard } from "./Slides";

export function Viewer({
  deck,
  cached,
  onNew,
  onRegenerate,
}: {
  deck: Deck;
  cached?: boolean;
  onNew: () => void;
  onRegenerate?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
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

  return (
    <div className="viewer">
      <div className="viewer-top">
        <span className="sector-label">
          {deck.sector}
          {cached && (
            <span className="archive-tag" title="This briefing was generated earlier and served from the archive">
              Archived · {deck.generatedAt.slice(0, 10)}
            </span>
          )}
        </span>
        <div className="actions">
          {cached && onRegenerate && (
            <button className="link-btn" onClick={onRegenerate}>
              ↻ Regenerate
            </button>
          )}
          <button className="link-btn" onClick={downloadPptx} disabled={!!exporting}>
            {exporting === "pptx" ? "Preparing PPTX…" : "↓ PPTX"}
          </button>
          <button className="link-btn" onClick={() => setExporting("pdf")} disabled={!!exporting}>
            {exporting === "pdf" ? "Preparing PDF…" : "↓ PDF"}
          </button>
          <button className="link-btn" onClick={onNew}>
            ← New briefing
          </button>
        </div>
      </div>

      <div className="stage-wrap" ref={stageRef} style={{ minHeight: "min(62vh, 720px)" }}>
        <div style={{ width: 1280 * scale, height: 720 * scale }}>
          <div className="board-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <SlideBoard deck={deck} index={index} />
          </div>
        </div>
      </div>

      <div className="controls">
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
    </div>
  );
}
