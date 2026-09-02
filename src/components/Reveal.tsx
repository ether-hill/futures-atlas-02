"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Scroll-reveal wrapper. Adds `.is-in` when the element enters view so the
 * CSS `rise` animation plays once. Reduced-motion is handled in globals.css
 * (the element is forced visible). `delay` staggers sequenced reveals, used
 * for the oracle's three reply tiers.
 *
 * THRESHOLD 0, NOT A FRACTION. An IntersectionObserver threshold is a fraction
 * of the TARGET, not of the screen, so an element taller than the viewport can
 * never reach one. This used to ask for 0.15: fine for a paragraph, impossible
 * for anything more than about six screens tall. The /projects grid is 5398px
 * in a 900px window, so the most it could ever intersect was 0.153 — right on
 * the threshold — and the whole listing simply never appeared.
 *
 * At 0 it fires the moment any part of the element crosses the root's edge,
 * whatever its size. The negative bottom margin is what holds the trigger a
 * little inside the fold, which is the job the threshold was really doing.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  /** Merged with the animation delay, so a Reveal can also be the layout box. */
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <Tag
      ref={ref}
      data-reveal
      className={`${seen ? "is-in" : ""} ${className}`}
      style={delay ? { ...style, animationDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
