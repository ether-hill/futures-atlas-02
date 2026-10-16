"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One slide of a Futures in Figures carousel, as the post itself: the 4:5
 * video, which opens on the finished chart. Nothing downloads until it scrolls
 * near (the still stands in), and it pauses off screen. If the phone refuses
 * to start it (Low Power Mode), the player's own controls appear.
 */
export function SlideFilm({ src, poster, label }: { src: string; poster: string; label: string }) {
  const film = useRef<HTMLVideoElement>(null);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const v = film.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) { v.pause(); return; }
        v.play().catch((err: unknown) => {
          if ((err as { name?: string } | null)?.name === "NotAllowedError") setHeld(true);
        });
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={film}
      className="block w-full border border-hairline"
      style={{ aspectRatio: "1080 / 1350" }}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      controls={held}
      aria-label={label}
    />
  );
}
