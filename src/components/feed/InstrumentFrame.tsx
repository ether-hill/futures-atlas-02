"use client";

/**
 * The live instrument, framed from the studio's own project page and cropped
 * to the instrument itself.
 *
 * ── Why it is cropped, and why this is not as fragile as it looks ───────────
 *
 * The project page carries the studio's nav and its own hero above the
 * instrument, and framing the lot repeats the title and standfirst that this
 * page has already shown. The compact `/embed/biome` endpoint avoids that but
 * only builds a 480px player strip — stretched across a column it reads as an
 * empty bar, which is exactly how it read.
 *
 * So: the iframe is pinned to a FIXED width and scaled to fit, rather than
 * being given the container's width. That is the whole trick. A percentage
 * width would reflow the source page and move the crop line with it; at a
 * fixed 1200px the offset below is a constant that was measured once.
 *
 * It is still coupled to somebody else's layout, and that is a real cost: if
 * the source page grows a banner above the instrument, this crops the wrong
 * thing. It fails visibly rather than silently — you would see the hero — and
 * the fix is one number.
 *
 * The credit line lives outside this component, on the page, because cropping
 * the nav out must not also crop the attribution out.
 */

import { useEffect, useRef, useState } from "react";

/** The iframe's pinned width. CROP is only valid at this width. */
const FRAME_W = 1200;
/** Measured at FRAME_W: the instrument's transport panel starts at 717px. */
const CROP = 660;
/** How much of the instrument to show below the crop. */
const VIEW_H = 1040;

export function InstrumentFrame({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / FRAME_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className="relative overflow-hidden rounded-[4px] border border-ink/[0.14]"
      style={{ height: VIEW_H * scale }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="autoplay; fullscreen"
        scrolling="no"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: FRAME_W,
          height: CROP + VIEW_H,
          border: 0,
          transform: `scale(${scale}) translateY(${-CROP}px)`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
