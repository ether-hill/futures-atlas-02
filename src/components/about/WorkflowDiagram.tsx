"use client";

import { useEffect, useRef, useState } from "react";
import { OUTPUT_TYPES, STACK, WORKFLOW, type OutputType } from "@/content/about";
import { LOGOS } from "@/lib/logos";
import { OutputTypeBadge } from "./OutputTypeBadge";

/**
 * "How a project gets made" — an interactive pipeline. The connection line
 * draws itself when scrolled into view; a slow pulse travels it (motion-safe
 * only); each stage expands to show the tools used there (same data as the
 * stack grid). Selecting READ / COPY / RUN re-highlights which stages that
 * output type passes through. Vertical timeline on small screens.
 */

export function WorkflowDiagram() {
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<OutputType | null>(null);
  const [drawn, setDrawn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = (stageTypes: OutputType[]) => !recipe || stageTypes.includes(recipe);
  const openDef = WORKFLOW.find((s) => s.id === openStage);

  return (
    <div ref={rootRef}>
      {/* recipe selector: ties the output types to the pipeline */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50">
          Recipe for
        </span>
        {OUTPUT_TYPES.map((o) => (
          <button
            key={o.type}
            type="button"
            aria-pressed={recipe === o.type}
            onClick={() => setRecipe(recipe === o.type ? null : o.type)}
            className="transition-opacity hover:opacity-100"
            style={{ opacity: recipe && recipe !== o.type ? 0.45 : 1 }}
          >
            <OutputTypeBadge type={o.type} active={!recipe || recipe === o.type} />
          </button>
        ))}
        <span className="ml-1 font-mono text-[11px] text-ink/40">
          {recipe ? "— stages this output type passes through" : "— select one to trace its path"}
        </span>
      </div>

      {/* pipeline: horizontal ≥sm, vertical below */}
      <div className="relative">
        {/* the line that draws itself */}
        <div
          aria-hidden="true"
          className="absolute left-[22px] top-6 bottom-6 w-px origin-top bg-ink/25 transition-transform duration-1000 ease-out sm:left-6 sm:right-6 sm:top-[22px] sm:bottom-auto sm:h-px sm:w-auto sm:origin-left"
          style={{ transform: drawn ? "scale(1)" : "scaleY(0) scaleX(0)" }}
        />
        {/* the throughput pulse (motion-safe) */}
        {drawn && (
          <div aria-hidden="true" className="wf-pulse absolute hidden motion-safe:sm:block" />
        )}

        <ol className="relative flex flex-col gap-5 sm:flex-row sm:justify-between sm:gap-0">
          {WORKFLOW.map((s, i) => {
            const on = active(s.types);
            const isOpen = openStage === s.id;
            return (
              <li key={s.id} className="flex items-center gap-4 sm:flex-col sm:gap-2">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenStage(isOpen ? null : s.id)}
                  className={`relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 font-mono text-[12px] transition-all ${
                    isOpen
                      ? "border-accent bg-accent text-paper"
                      : on
                        ? "border-ink/50 bg-surface text-ink hover:border-accent"
                        : "border-ink/15 bg-surface text-ink/30"
                  }`}
                  style={{
                    transitionDelay: drawn ? `${i * 120}ms` : "0ms",
                    opacity: drawn ? 1 : 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
                <span
                  className={`font-mono text-[11.5px] uppercase tracking-[0.12em] transition-colors ${
                    on ? "text-ink" : "text-ink/30"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* expanded stage card */}
      {openDef && (
        <div className="mt-6 border border-ink/15 bg-surface p-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.16em] text-accent-deep">
              {openDef.label}
            </h3>
            <span className="flex gap-1.5">
              {openDef.types.map((t) => (
                <OutputTypeBadge key={t} type={t} />
              ))}
            </span>
          </div>
          <p className="mt-2 max-w-[70ch] font-mono text-[13px] leading-[1.7] text-ink-70">{openDef.blurb}</p>
          {openDef.tools.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {openDef.tools.map((slug) => {
                const tool = STACK.find((t) => t.slug === slug);
                const glyph = LOGOS[slug];
                if (!tool) return null;
                return (
                  <span key={slug} className="flex items-center gap-2 text-ink/65">
                    {glyph ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                        <path d={glyph.path} />
                      </svg>
                    ) : null}
                    <span className="font-mono text-[12px]">{tool.name}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
