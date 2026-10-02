"use client";

import { useEffect, useState } from "react";
import { sketchById } from "@/lib/specimens";
import { renderStill } from "@/lib/specimens/still";
import { defaults } from "@/lib/specimens/types";

/** A card plate rendered from the sketch's current code at its defaults. */
export function SketchPlate({ sketchId }: { sketchId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const s = sketchById(sketchId);
    if (!s) return;
    let live = true;
    renderStill(s, defaults(s), 720)
      .then((u) => live && setSrc(u))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [sketchId]);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />;
  }
  return (
    <span className="absolute left-4 top-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/50">
      {failed ? "No WebGL2 here" : "Rendering…"}
    </span>
  );
}
