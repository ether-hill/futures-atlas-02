"use client";

/** Observatory — dark indigo theme; hero: particle-nebula. */

import { BrowseMock } from "../BrowseMock";

export default function Observatory() {
  return (
    <BrowseMock
      T={{
        name: "observatory",
        bg: "#0B0A11",
        text: "#EDECF4",
        accent: "#7DE1FF",
        accentBright: "#B9EEFF",
        panel: "rgba(19,17,30,.9)",
        rail: "rgba(13,12,20,.96)",
        avatarBg: "#241E3E",
        sendText: "#0B0A11",
        logoFilter: "brightness(0) invert(1)",
        bodyFont: "var(--font-grotesk), sans-serif",
        scrimRgb: "11,10,17",
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
