"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The size of a box, measured reliably.
 *
 * The obvious version of this is a ResizeObserver and nothing else, and it is
 * wrong. A ResizeObserver only delivers callbacks while the document is being
 * rendered: in a background tab, a throttled frame or an offscreen iframe it
 * never fires at all, and the component sits at whatever default it was born
 * with. On a chart that picks its whole layout from its width, that means a
 * phone gets the desktop drawing with type at a third of its size.
 *
 * So the first measurement is synchronous, in a layout effect, before the
 * browser paints. The observer is only there to catch later changes.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type Box = { w: number; h: number };

export function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<Box | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const w = Math.round(el.clientWidth);
    const h = Math.round(el.clientHeight);
    if (!w && !h) return;
    setBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    /* Belt and braces: an orientation change on iOS can settle after the
       observer has already reported, and a rotated phone is the case this
       component exists for. */
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    const t = window.setTimeout(measure, 250);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.clearTimeout(t);
    };
  }, [measure]);

  return [ref, box] as const;
}
