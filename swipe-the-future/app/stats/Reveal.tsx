"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * True once the element has been scrolled into view. Drives the load-in.
 *
 * The ref is a callback ref on purpose: some callers hold this hook in a
 * component that renders a loading state first, so the node does not exist on
 * mount. A plain useRef + useEffect would observe nothing and never re-run.
 */
export function useInView<T extends HTMLElement>() {
  const [seen, setSeen] = useState(false);
  const io = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((el: T | null) => {
    io.current?.disconnect();
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    io.current = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setSeen(true); io.current?.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.current.observe(el);
  }, [seen]);

  useEffect(() => () => io.current?.disconnect(), []);

  return { ref, seen };
}

/** A section that rises into place the first time you reach it. */
export function Reveal({ children, className = "", delay = 0, as: Tag = "section" }: {
  children: React.ReactNode; className?: string; delay?: number;
  as?: "section" | "div";
}) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      className={`st-reveal${seen ? " in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to the value once it is on screen. Falls straight to the final
 * number when the visitor has asked for reduced motion.
 */
export function CountUp({ to, format = (n: number) => n.toLocaleString(), ms = 900 }: {
  to: number; format?: (n: number) => string; ms?: number;
}) {
  const { ref, seen } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to === 0) { setN(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, ms]);

  return <span ref={ref}>{format(n)}</span>;
}
