"use client";

/** Observatory — dark indigo theme; hero: particle-nebula. */

import { BrowseMock } from "../BrowseMock";

export default function Observatory() {
  return (
    <BrowseMock
      T={{
        name: "observatory",
        bg: "#0d0e11",
        text: "#f4efe4",
        accent: "#7fb2e8",
        accentBright: "#a9ccf2",
        panel: "rgba(22,23,27,.9)",
        rail: "rgba(11,12,14,.96)",
        avatarBg: "#16222f",
        sendText: "#0d0e11",
        logoFilter: "brightness(0) invert(1)",
        bodyFont: "var(--font-archivo), system-ui, sans-serif",
        scrimRgb: "13,14,17",
      }}
      hero={{
        pieceId: "particle-nebula",
        seed: "observatory",
        params: { pointSize: 3 },
        meta: { complexity: 0.65, chaos: 0.3 },
        colors: { bg: "#0B0A11", lo: "#39508f", hi: "#7DE1FF" },
      }}
    />
  );
}
