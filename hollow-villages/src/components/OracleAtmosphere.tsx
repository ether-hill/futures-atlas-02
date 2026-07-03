"use client";

/**
 * The oracle's "dream": a slow, animated, heavily-blurred gradient of rural
 * colour — sky blue, meadow green, warm light, teal — reminiscent of a
 * half-remembered landscape. Four placements, chosen by `?v=` so the concepts
 * can be compared side by side:
 *
 *   a · "page"  — a soft dreaming wash behind the whole consultation
 *   b · "hero"  — a bolder dream that fills only the consult hero
 *   c · "both"  — a subtle page wash + a stronger hero dream
 *   d · "orb"   — the dream gathered into a breathing orb: who the oracle IS
 *
 * Keyframes live in globals.css (hv-drift-*, hv-spin, hv-breathe). Reduced
 * motion freezes them via the global guard.
 */

export type AtmosphereVariant = "page" | "hero" | "both" | "orb";

type Blob = { size: string; pos: string; color: string; anim: string };

const BLOBS: Blob[] = [
  { size: "46% 46%", pos: "22% 16%", color: "rgba(126,178,224,0.62)", anim: "hv-drift-1 24s" }, // sky blue
  { size: "50% 48%", pos: "80% 82%", color: "rgba(150,182,110,0.56)", anim: "hv-drift-2 30s" }, // meadow green
  { size: "40% 40%", pos: "56% 40%", color: "rgba(240,226,172,0.60)", anim: "hv-drift-3 27s" }, // warm light
  { size: "42% 44%", pos: "88% 20%", color: "rgba(70,122,132,0.46)", anim: "hv-drift-2 22s reverse" }, // teal
  { size: "42% 42%", pos: "10% 80%", color: "rgba(120,152,92,0.42)", anim: "hv-drift-1 33s reverse" }, // green
];

/** The drifting blurred blobs. `intensity` (0–1) scales overall opacity. */
function DreamField({ intensity = 1, blur = 60 }: { intensity?: number; blur?: number }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ opacity: intensity }}>
      <div className="absolute inset-0" style={{ filter: `blur(${blur}px)` }}>
        {BLOBS.map((b, i) => (
          <div
            key={i}
            className="absolute -inset-[18%] will-change-transform"
            style={{
              background: `radial-gradient(${b.size} at ${b.pos}, ${b.color}, transparent 70%)`,
              animation: `${b.anim} ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** The dream gathered into a single breathing, slowly-rotating orb. */
function DreamOrb() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[14%] z-0 flex justify-center">
      <div className="relative h-[clamp(220px,34vw,400px)] w-[clamp(220px,34vw,400px)]">
        <div
          className="absolute inset-0 rounded-full will-change-transform"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(126,178,224,0.95), rgba(150,182,110,0.95), rgba(240,226,172,0.95), rgba(70,122,132,0.95), rgba(126,178,224,0.95))",
            filter: "blur(34px)",
            animation: "hv-spin 22s linear infinite, hv-breathe 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-[22%] rounded-full will-change-transform"
          style={{
            background: "radial-gradient(circle at 40% 38%, rgba(248,244,236,0.9), rgba(248,244,236,0) 68%)",
            filter: "blur(18px)",
            animation: "hv-breathe 5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/** Fixed, full-viewport dream behind the whole scrolling page. */
export function AtmospherePage({ variant }: { variant: AtmosphereVariant }) {
  if (variant === "hero") return null;
  const intensity = variant === "orb" ? 0.3 : variant === "both" ? 0.4 : 0.62;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <DreamField intensity={intensity} blur={variant === "page" ? 64 : 72} />
    </div>
  );
}

/** In-hero dream — scrolls away with the hero. */
export function AtmosphereHero({ variant }: { variant: AtmosphereVariant }) {
  if (variant === "orb") return <DreamOrb />;
  if (variant === "hero" || variant === "both") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <DreamField intensity={variant === "both" ? 0.82 : 0.9} blur={56} />
      </div>
    );
  }
  return null;
}
