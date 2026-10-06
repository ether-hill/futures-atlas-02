"use client";

import { useEffect, useRef } from "react";

/**
 * Mounts the cymatics simulator (V2, "the dish, in code"). The engine (WebGL2 +
 * Web Audio) is imported lazily so neither touches SSR, and torn down on
 * unmount so the drive tone stops when you navigate away. Ported as-is from
 * the cymatics repo's CymaticsV2Mount.
 */
export function CymaticsMount() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/cymatics/engine")
      .then(({ mount }) => {
        if (!cancelled && ref.current) dispose = mount(ref.current);
      })
      .catch((err) => console.error("Failed to mount the cymatics simulator:", err));
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return <div ref={ref} />;
}
