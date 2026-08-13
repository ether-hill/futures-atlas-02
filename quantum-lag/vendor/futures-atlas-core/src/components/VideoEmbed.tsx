"use client";

import { useState } from "react";

/** Pull an 11-char YouTube id out of a watch / youtu.be / embed / shorts URL,
 *  or accept a bare id. Returns null if none found. */
export function youTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const m = urlOrId.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Lightweight YouTube facade: shows the poster + a play badge, and only swaps
 *  in the real (cookie-less) iframe once clicked — so a grid of videos stays
 *  light but still "plays in page". */
export function VideoEmbed({
  id,
  title,
  thumbnail,
  credit,
}: {
  id: string;
  title: string;
  thumbnail?: string;
  credit?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const frame: React.CSSProperties = {
    position: "relative",
    aspectRatio: "16 / 10",
    overflow: "hidden",
    borderBottom: "var(--border-hairline) solid var(--text)",
    background: "var(--panel)",
  };

  if (playing) {
    return (
      <div style={frame}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerated-performance; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      style={{ ...frame, display: "block", width: "100%", padding: 0, border: 0, cursor: "pointer" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "color-mix(in srgb, var(--text) 22%, transparent)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "var(--radius-full)",
            background: "var(--accent)",
            color: "var(--paper)",
            fontSize: 22,
            paddingLeft: 4,
          }}
        >
          ▶
        </span>
      </span>
      {credit && (
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            maxWidth: "100%",
            padding: "2px 6px",
            background: "color-mix(in srgb, var(--text) 65%, transparent)",
            color: "var(--paper)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {credit}
        </span>
      )}
    </button>
  );
}
