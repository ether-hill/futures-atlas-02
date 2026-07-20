"use client";

/** Gallery — dark blue-violet theme; hero: lattice-waves. */

import { BrowseMock } from "../BrowseMock";

export default function Gallery() {
  return (
    <BrowseMock
      T={{
        name: "gallery",
        bg: "#0b0c0e",
        text: "#f4efe4",
        accent: "#5b7cff",
        accentBright: "#93aaff",
        panel: "rgba(20,21,26,.9)",
        rail: "rgba(10,11,13,.96)",
        avatarBg: "#171a2c",
        sendText: "#f4efe4",
        logoFilter: "brightness(0) invert(1)",
        bodyFont: "var(--font-archivo), system-ui, sans-serif",
        scrimRgb: "11,12,14",
      }}
      hero={{
        pieceId: "lattice-waves",
        seed: "gallery",
        params: { spin: 0.4 },
        meta: { complexity: 0.55, chaos: 0.35 },
        colors: { bg: "#0b0c10", lo: "#3a56d4", hi: "#93aaff" },
      }}
    />
  );
}
