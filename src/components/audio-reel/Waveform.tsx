"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The waveform strip: 240 pre-computed peaks as divs, played bars revealed by
 * a clip-path driven by --progress (written by useAudioClock — no React
 * re-render per frame). The strip is the seek control: click/drag, arrows
 * ±5s, space toggles play. role="slider" with second-based values.
 */
export function Waveform({
  peaksUrl,
  audioRef,
  onTogglePlay,
}: {
  peaksUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
}) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0); // coarse, for ARIA only
  const stripRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let dead = false;
    fetch(peaksUrl)
      .then((r) => r.json())
      .then((p: number[]) => !dead && setPeaks(p))
      .catch(() => !dead && setPeaks(new Array(240).fill(0.4)));
    return () => { dead = true; };
  }, [peaksUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const meta = () => setDuration(audio.duration || 0);
    const time = () => setPosition(audio.currentTime); // coarse is fine for ARIA
    audio.addEventListener("loadedmetadata", meta);
    audio.addEventListener("timeupdate", time);
    meta();
    return () => {
      audio.removeEventListener("loadedmetadata", meta);
      audio.removeEventListener("timeupdate", time);
    };
  }, [audioRef]);

  const seekTo = useCallback(
    (clientX: number) => {
      const audio = audioRef.current;
      const strip = stripRef.current;
      if (!audio || !strip || !audio.duration) return;
      const r = strip.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      audio.currentTime = f * audio.duration;
    },
    [audioRef],
  );

  const seekBy = (s: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + s));
  };

  return (
    <div
      ref={stripRef}
      className="ar-wave"
      role="slider"
      tabIndex={0}
      aria-label="Audio position"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`${Math.round(position)} of ${Math.round(duration)} seconds`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekTo(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && seekTo(e.clientX)}
      onPointerUp={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-5); }
        else if (e.key === "ArrowRight") { e.preventDefault(); seekBy(5); }
        else if (e.key === " ") { e.preventDefault(); onTogglePlay(); }
      }}
    >
      <div className="ar-wave__bars ar-wave__bars--base" aria-hidden="true">
        {peaks.map((p, i) => (
          <span key={i} style={{ height: `${Math.max(4, p * 100)}%` }} />
        ))}
      </div>
      <div className="ar-wave__bars ar-wave__bars--played" aria-hidden="true">
        {peaks.map((p, i) => (
          <span key={i} style={{ height: `${Math.max(4, p * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}
