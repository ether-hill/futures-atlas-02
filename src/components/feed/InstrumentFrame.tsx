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
 * Scale is clamped at 1 so it never enlarges the instrument: it renders at its
 * own size and only shrinks when the column is narrower than it is. There is
 * no border and no card around it — it is not a widget on the page, it is the
 * page's content.
 */

import { useEffect, useRef, useState } from "react";

/** The iframe's pinned width. Every `crop` is measured at this width. */
const FRAME_W = 1200;

export function InstrumentFrame({
  src,
  title,
  crop,
  height,
}: {
  src: string;
  title: string;
  /** How far down the source page the instrument starts, at FRAME_W. */
  crop: number;
  /** How much to show below the crop. */
  height: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Clamped at 1: a container wider than FRAME_W would otherwise scale the
    // instrument UP, which is what made it read as enormous. It only ever
    // shrinks, so at full width it is exactly its own size.
    const fit = () => setScale(Math.min(1, el.clientWidth / FRAME_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={box}
      // No border, no radius, no card: the instrument sits on the page. The
      // only thing this element does is clip the crop — overflow-hidden is
      // load-bearing, everything else would be decoration around something
      // that already has its own edges.
      className="relative overflow-hidden"
      style={{ height: height * scale, maxWidth: FRAME_W }}
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
          height: crop + height,
          border: 0,
          transform: `scale(${scale}) translateY(${-crop}px)`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
