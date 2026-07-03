"use client";

import Link from "next/link";
import { useState } from "react";
import { STACK, STACK_GROUPS, type StackTool } from "@/content/about";
import { LOGOS } from "@/lib/logos";
import { Reveal } from "@/components/Reveal";

/**
 * The stack, grouped, logos mono by default and brand-coloured on
 * hover/focus. Selecting a tool expands a card with what we actually use it
 * for and — the point of the section — which Atlas projects it built.
 * Tools without an available brand icon render as typographic tiles.
 */

function LogoMark({ tool, colored }: { tool: StackTool; colored: boolean }) {
  const glyph = LOGOS[tool.slug];
  if (!glyph) {
    return (
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">
        {tool.name.split(" ")[0]}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      className="h-7 w-7 transition-colors duration-200"
      style={{ fill: colored ? glyph.hex : "currentColor" }}
    >
      <path d={glyph.path} />
    </svg>
  );
}

export function StackGrid() {
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-10">
      {STACK_GROUPS.map((group) => {
        const tools = STACK.filter((t) => t.group === group.id);
        const openTool = tools.find((t) => t.slug === open);
        return (
          <Reveal key={group.id}>
            <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {tools.map((t, i) => {
                const isOpen = open === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : t.slug)}
                    onMouseEnter={() => setHovered(t.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(t.slug)}
                    onBlur={() => setHovered(null)}
                    className={`stack-tile flex aspect-square flex-col items-center justify-center gap-2 border p-3 text-ink/60 transition-colors motion-safe:[animation-delay:var(--d)] ${
                      isOpen ? "border-accent bg-accent-soft/40 text-ink" : "border-ink/15 hover:border-ink/40 hover:text-ink"
                    }`}
                    style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
                  >
                    <LogoMark tool={t} colored={hovered === t.slug || isOpen} />
                    <span className="font-mono text-[10px] leading-tight text-ink/55">{t.name}</span>
                  </button>
                );
              })}
            </div>
            {openTool && (
              <div className="mt-3 border border-ink/15 bg-surface p-5">
                <p className="max-w-[70ch] font-mono text-[13px] leading-[1.7] text-ink-70">
                  <span className="text-ink">{openTool.name}.</span> {openTool.role}
                </p>
                {openTool.usedIn && openTool.usedIn.length > 0 && (
                  <p className="mt-3 font-mono text-[12px] leading-[1.8] text-ink/55">
                    Used in:{" "}
                    {openTool.usedIn.map((p, i) => (
                      <span key={p.slug}>
                        {i > 0 && " · "}
                        <Link href={p.slug} className="text-accent-deep underline-offset-4 hover:underline">
                          {p.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}
