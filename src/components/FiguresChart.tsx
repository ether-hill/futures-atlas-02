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
  /*
   * Which of the two the screen gets, decided once it is known. Both used to be
   * in the page at every width with CSS hiding one, and a hidden <video
   * autoplay> still downloads and plays: three portrait films, 11.5 MB, on every
   * desktop visit, for nobody. Now only the one being shown is mounted. Until
   * the width is known a phone sees the still (the video's own poster, so the
   * swap is invisible) and a wide screen sees the chart's reserved space.
   */
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 760px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (!wide) return;
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
  }, [wide]);
  /*
   * On a phone each film plays only while it is on screen. With `autoplay` all
   * three started downloading the moment the page opened, 11.5 MB of mobile
   * data for charts two of which are several screens away. Now nothing is
   * fetched until a film scrolls near, and it stops when it leaves.
   */
  const film = useRef<HTMLVideoElement>(null);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const v = film.current;
    if (wide !== false || !v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) { v.pause(); return; }
        // A phone can refuse to start a film by itself (iPhone Low Power Mode
        // does). Then the chart would sit frozen on its first frame with no way
        // to start it, so hand over the player's own controls and say why.
        // AbortError is only a pause overtaking a play while scrolling: not that.
        v.play().catch((err: unknown) => {
          if ((err as { name?: string } | null)?.name === "NotAllowedError") setHeld(true);
        });
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [wide]);
  const replay = () => {
    const w = frame.current?.contentWindow as (Window & { __replay?: () => void }) | null;
    w?.__replay?.();
  };
  const fit = "calc((100svh - 190px) * 1600 / 820)";
  return (
    <figure className="m-0">
      <div className="hidden min-[760px]:block">
        {/* the box keeps its shape before the chart mounts, so nothing below it jumps */}
        <div style={{ aspectRatio: "1600 / 820", maxWidth: fit }}>
          {wide && (
            <iframe
              ref={frame}
              src={`/futures-in-figures/charts/output/${slug}/index.html?slide=hook&format=web&v=field`}
              title={label}
              loading="lazy"
              // a chart that never reports in still shows, a little later
              onLoad={() => window.setTimeout(() => setReady(true), 1500)}
              className={`block h-full w-full border border-hairline transition-opacity duration-500 ease-out ${ready ? "opacity-100" : "opacity-0"}`}
            />
          )}
        </div>
        <div className="mt-3 flex justify-end" style={{ maxWidth: fit }}>
          <button
            type="button"
            onClick={replay}
            className="border border-hairline px-4 py-2 text-[13px] text-muted transition-colors hover:border-[var(--muted)] hover:text-[var(--text)]"
          >
            Replay
          </button>
        </div>
      </div>
      {wide === false ? (
        <video
          ref={film}
          className="block w-full border border-hairline min-[760px]:hidden"
          src={`/futures-in-figures/${slug}-portrait.mp4`}
          poster={`/futures-in-figures/${slug}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          controls={held}
          aria-label={label}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- the video's own poster, standing in for it until the width is known; lazy, so a wide screen (where it is display:none) never fetches it
        <img
          className="block w-full border border-hairline min-[760px]:hidden"
          src={`/futures-in-figures/${slug}.jpg`}
          alt={label}
          loading="lazy"
          style={{ aspectRatio: "1080 / 1350", objectFit: "cover" }}
        />
      )}
      {held && wide === false && (
        <p role="status" className="mt-2 text-[13px] leading-[1.5] text-muted min-[760px]:hidden">
          Your phone is holding this video back, which Low Power Mode does. Press play to watch it.
        </p>
      )}
    </figure>
  );
}
