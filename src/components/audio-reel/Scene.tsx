"use client";

import { useEffect, useRef } from "react";
import type { Scene as SceneData } from "./types";

/**
 * One reel scene. The wrapper carries --p (parallax multiplier); useAudioClock
 * writes --d / --active onto it every frame; audio-reel.css turns those into
 * position, fade and scale. Videos are muted loops that play only while the
 * audio is playing AND the scene is on screen.
 */
export function Scene({ scene, playing }: { scene: SceneData; playing: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const sync = () => {
      if (playing && visible.current) video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      sync();
    });
    io.observe(el);
    sync();
    return () => io.disconnect();
  }, [playing]);

  const parallax = scene.parallax ?? (scene.type === "media" ? 0.75 : 1);
  const depth = Math.min(1, Math.max(0, scene.depth ?? 0));

  return (
    <div
      ref={wrapRef}
      className={`ar-scene ar-scene--${scene.type}`}
      data-deep={depth > 0 ? "1" : undefined}
      style={{ "--p": parallax, "--depth": depth } as React.CSSProperties}
    >
      {scene.type === "portrait" && (
        <figure className="ar-portrait">
          <span className="ar-portrait__name" aria-hidden="true">
            {scene.caption.split(" ")[0]}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene.src} alt="" className="ar-portrait__img" />
          <figcaption className="ar-portrait__caption">{scene.caption}</figcaption>
        </figure>
      )}
      {scene.type === "media" &&
        (scene.kind === "video" ? (
          <video ref={videoRef} src={scene.src} className="ar-media" muted loop playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.src} alt="" className="ar-media" />
        ))}
      {scene.type === "quote" && (
        <blockquote className="ar-quote">
          <p>
            <span className="ar-quote__open" aria-hidden="true">“</span>
            {scene.text}
            <span aria-hidden="true">”</span>
          </p>
        </blockquote>
      )}
    </div>
  );
}
