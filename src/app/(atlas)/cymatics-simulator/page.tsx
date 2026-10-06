import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CymaticsMount } from "@/components/cymatics/CymaticsMount";
import "./cymatics.css";

/**
 * Cymatics Simulator — a replica of the cymatics site's V2 page
 * (cymatics-staging.vercel.app/projects/cymatics-v2): the same engine, the
 * same physics, the same copy, on Futures Atlas tokens.
 *
 * The engine lives in src/lib/cymatics/ (dish.ts verbatim, engine.ts with only
 * its imports and styles changed). Fix behaviour upstream and re-copy.
 *
 * Draft. `visibility: "draft"` in src/data/projects.ts gates this URL,
 * mirrored in public/atlas-nav.js.
 */
export const metadata: Metadata = {
  title: "Cymatics Simulator. Futures Atlas",
  description:
    "The dish, in code: Faraday waves on a circular dish of water, computed from the water's dispersion relation and the dish's own modes, lit by a ring of LEDs and drawn as the camera sees its reflection. Dial the frequency, the dish and the light; hear the drive tone.",
  robots: { index: false },
};

export default function CymaticsSimulatorPage() {
  return (
    <div className="cyma">
      <section className="py-[clamp(40px,6vw,88px)]">
        <Container>
          <div className="max-w-[62ch]">
            <p className="eyebrow mb-5">Interactive · Code-driven</p>
            <h1 className="text-[clamp(32px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-0.022em] text-ink text-balance">
              Cymatics Simulator
            </h1>
            <p className="mt-6 text-[15px] leading-[1.8] text-ink-70">
              The first simulator was film of the real dish. This one is the dish, in code: a circular dish of water
              driven from below carries standing waves whose wavelength the water decides and whose shape the dish
              decides, lit by a ring of LEDs and seen as the camera sees it — the ring&apos;s reflection, caught wherever
              the water tilts just so. Dial the frequency, resize the dish, change the light. Turn the sound on to hear
              the tone that drives it.
            </p>
          </div>
        </Container>
      </section>
      <section className="pb-[clamp(48px,7vw,96px)]">
        <Container>
          <CymaticsMount />
        </Container>
      </section>
    </div>
  );
}
