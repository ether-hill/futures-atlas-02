"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The 9:16 stage is authored at 430x764 — the size Playwright films it at — so
 * on any other viewport it is scaled rather than reflowed. A layout that
 * reflows films differently at every size, which defeats the point of a
 * preview.
 */
export function Solo({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 430, window.innerHeight / 764));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="sg-solo">
      <style>{`
        /* The injected atlas chrome steps aside: the reel is the whole frame,
           and the body's reserved nav padding goes with it. */
        .fa-shell, .fa-share, .fa-foot { display: none !important; }
        body { padding-top: 0 !important; overflow: hidden; }
      `}</style>
      <div ref={box} suppressHydrationWarning style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}
