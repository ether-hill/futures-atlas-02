"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Adds `.is-in` when the element enters view so the
 * CSS `rise` animation plays once. Reduced-motion is handled in globals.css
 * (the element is forced visible). `delay` staggers sequenced reveals — used
 * for the oracle's three reply tiers.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  effect = "rise",
  threshold = 0.15,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  /** "rise" = the default translate/fade; "blur" = sharpen from soft-focus. */
  effect?: "rise" | "blur";
  /** Fraction visible before it triggers (1 = only once fully in view). */
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const full = threshold >= 0.9; // "only once fully in view"
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= (full ? threshold - 0.02 : 0.14)) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: full ? threshold : 0.15, rootMargin: full ? "0px" : "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);

  return (
    <Tag
      ref={ref}
      {...(effect === "blur" ? { "data-blur": "" } : { "data-reveal": "" })}
      className={`${seen ? "is-in" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
