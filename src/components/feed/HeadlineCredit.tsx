"use client";

import { useEffect, useRef, useState } from "react";
import { headlineHref, type Headline } from "@/data/feed-headlines";

/**
 * The credit beside the masthead line: an (i) that opens a micro card naming
 * the artist, the album and the song, and linking out.
 *
 * It is a button, not a hover-only affordance — hover alone would put the
 * credit out of reach on every touch device, and the credit is the reason the
 * quotation can be there. Hover opens it on a pointer, tap toggles it, Escape
 * and an outside click close it, and it is reachable by keyboard.
 */
export function HeadlineCredit({ headline }: { headline: Headline }) {
  // Hover and tap are tracked separately. One `open` flag meant a click on a
  // pointer device toggled off whatever the hover had just turned on.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPinned(false);
      setHovered(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={`Credit: ${headline.artist}, ${headline.song}`}
        aria-expanded={open}
        onClick={() => setPinned((v) => !v)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="grid h-[18px] w-[18px] place-items-center rounded-full border font-mono text-[10px] leading-none transition-colors"
        style={{
          borderColor: "color-mix(in srgb, var(--text) 30%, transparent)",
          color: "var(--muted)",
        }}
      >
        i
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+10px)] z-30 w-[248px] -translate-x-1/2 rounded-[4px] p-3 text-left"
          style={{
            background: "var(--panel)",
            border: "var(--border-hairline) solid var(--hairline)",
            boxShadow: "0 14px 40px rgb(0 0 0 / 0.3)",
          }}
        >
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
            {headline.artist}
          </span>
          <span className="mt-1 block text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
            {headline.song}
          </span>
          <span className="mt-0.5 block font-mono text-[11px] leading-[1.4] text-graphite">
            {headline.album}
          </span>
          <a
            href={headlineHref(headline)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent hover:text-ink"
          >
            Listen on YouTube ↗
          </a>
        </span>
      )}
    </span>
  );
}
