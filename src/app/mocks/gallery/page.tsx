"use client";

/** Gallery — light swiss theme; hero: lattice-waves. */

import { BrowseMock } from "../BrowseMock";

export default function Gallery() {
  return (
    <BrowseMock
      T={{
        name: "gallery",
        bg: "#FAFAF7",
        text: "#15151A",
        accent: "#2244FF",
        accentBright: "#0F2BCC",
        panel: "rgba(255,255,255,.9)",
        rail: "rgba(245,245,241,.96)",
        avatarBg: "#E8E8FF",
        sendText: "#FFFFFF",
        logoFilter: "brightness(0)",
        bodyFont: "var(--font-grotesk), sans-serif",
        scrimRgb: "250,250,247",
      }}
      hero={{
        pieceId: "lattice-waves",
        seed: "gallery",
        params: { spin: 0.4 },
        meta: { complexity: 0.55, chaos: 0.35 },
        colors: { bg: "#e9e9ef", lo: "#2244FF", hi: "#8fa4ff" },
      }}
    />
  );
}
