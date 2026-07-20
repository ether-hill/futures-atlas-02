"use client";

/** Signal — dark mono terminal theme; hero: boids. */

import { BrowseMock } from "../BrowseMock";

export default function Signal() {
  return (
    <BrowseMock
      T={{
        name: "signal",
        bg: "#0A0A0A",
        text: "#E8E8E8",
        accent: "#3CFF9E",
        accentBright: "#9BFFCE",
        panel: "rgba(20,20,20,.9)",
        rail: "rgba(14,14,14,.96)",
        avatarBg: "#1C2C22",
        sendText: "#0A0A0A",
        logoFilter: "brightness(0) invert(1)",
        bodyFont: "var(--font-plexmono), ui-monospace, monospace",
        scrimRgb: "10,10,10",
      }}
      hero={{
        pieceId: "boids",
        seed: "signal",
        params: { count: 380, speed: 11, separation: 1.4, wander: 0.4, directionalPause: 0.45, trail: 0.05 },
        meta: { complexity: 0.6, chaos: 0.5 },
        colors: { bg: "#050705", lo: "#1d5c3c", hi: "#3CFF9E" },
      }}
    />
  );
}
