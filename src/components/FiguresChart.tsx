"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One Futures in Figures chart, at full width. On wider screens it is the live
 * chart (the dataviz page in web mode, synced into public/ by
 * scripts/sync-futures-in-figures.mjs): it plays when scrolled into view and
 * Replay runs it again. The chart is drawn at 1600x820 and scaled, so the
 * frame keeps that ratio. On phones the portrait post is the better fit, so
 * the loop plays instead.
 *
 * The iframe stays invisible until the chart inside says its first frame is
 * set (a `fifChart` postMessage from frame.js), then fades in. Before that it
 * showed an empty dark panel, then the finished chart, then the chart
 * rewinding to build itself: three flashes before anything moved.
 */
export function FiguresChart({ slug, label }: { slug: string; label: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.fifChart) setReady(true);
    };
    window.addEventListener("message", onMsg);
    // The chart can finish before this page hydrates, and then both its message
    // and the iframe's load event have already gone by. It is same-origin, so
    // ask it directly; and never leave a chart invisible for good.
    const w = frame.current?.contentWindow as (Window & { __ready?: boolean }) | null;
    try { if (w?.__ready) setReady(true); } catch {}
    const late = window.setTimeout(() => setReady(true), 4000);
    return () => { window.removeEventListener("message", onMsg); window.clearTimeout(late); };
  }, []);
  const replay = () => {
    const w = frame.current?.contentWindow as (Window & { __replay?: () => void }) | null;
    w?.__replay?.();
  };
  return (
    <figure className="m-0">
      <div className="hidden min-[760px]:block">
        <iframe
          ref={frame}
          src={`/futures-in-figures/charts/output/${slug}/index.html?slide=hook&format=web&v=field`}
          title={label}
          loading="lazy"
          // a chart that never reports in still shows, a little later
          onLoad={() => window.setTimeout(() => setReady(true), 1500)}
          className={`block w-full border border-hairline transition-opacity duration-500 ease-out ${ready ? "opacity-100" : "opacity-0"}`}
          // never taller than the screen: the whole chart stays in view
          style={{ aspectRatio: "1600 / 820", maxWidth: "calc((100svh - 190px) * 1600 / 820)" }}
        />
        <div className="mt-3 flex justify-end" style={{ maxWidth: "calc((100svh - 190px) * 1600 / 820)" }}>
          <button
            type="button"
            onClick={replay}
            className="border border-hairline px-4 py-2 text-[13px] text-muted transition-colors hover:border-[var(--muted)] hover:text-[var(--text)]"
          >
            Replay
          </button>
        </div>
      </div>
      <video
        className="block w-full border border-hairline min-[760px]:hidden"
        src={`/futures-in-figures/${slug}-portrait.mp4`}
        poster={`/futures-in-figures/${slug}.jpg`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
    </figure>
  );
}
