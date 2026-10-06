import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { NodalFigure } from "@/components/standing-waves/NodalFigure";
import { Simulator } from "@/components/standing-waves/Simulator";
import { SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";

export const metadata: Metadata = {
  title: `Simulator. ${SW_TITLE}. Futures Atlas`,
  description: "A small dish of water driven from below, computed in your browser from the water's physics and the dish's own modes.",
  robots: { index: false },
};

const label = "font-mono text-[11px] uppercase tracking-[0.14em] text-graphite";

export default function SimulatorPage() {
  return (
    <section className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">Simulator</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">A dish of water, in code</h1>
          <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
            A small round dish of water sits on a speaker. Play a steady note and the surface ripples into a still,
            repeating figure. This computes that figure from the water&apos;s own physics and the shape of the dish, and
            draws it the way a ring of lights above it would show it.
          </p>
        </div>

        <div className="mt-10">
          <Simulator
            poster={
              <div className="flex h-full w-full items-center justify-center p-[8%] text-paper">
                <NodalFigure spec="bessel:4,2" res={120} stroke={0.5} label="Poster: the nodal lines of one dish mode, computed. Press start for the live simulator." />
              </div>
            }
          />
        </div>

        <section aria-labelledby="sw-seeing" className="sw-box mt-12 max-w-[80ch] p-5 sm:p-7">
          <h2 id="sw-seeing" className="text-[20px] font-bold text-ink">What you&apos;re seeing</h2>
          <dl className="mt-5 flex flex-col gap-5 text-[14.5px] leading-[1.7]">
            <div>
              <dt className={label}>The water answers at half the note</dt>
              <dd className="mt-1 text-ink-70">
                Shake a liquid up and down and its surface ripples at half the shaking frequency. Faraday reported this
                in 1831, and it is why these are called Faraday waves.{" "}
                <Link href={`${SW_BASE}/timeline#faraday-1831`} className="text-ink underline underline-offset-4 hover:text-accent">Faraday on the timeline</Link>
                {" · "}
                <Link href={`${SW_BASE}/read/faraday-waves`} className="text-ink underline underline-offset-4 hover:text-accent">Faraday waves, explained</Link>
              </dd>
            </div>
            <div>
              <dt className={label}>The dish picks the shape</dt>
              <dd className="mt-1 text-ink-70">
                Only a few wave shapes fit a round dish, the same way only a few notes fit a guitar string. The figure is
                the dish&apos;s allowed shape whose own frequency sits nearest half the note. Change the radius and a
                different shape wins.{" "}
                <Link href={`${SW_BASE}/read/same-math-different-worlds`} className="text-ink underline underline-offset-4 hover:text-accent">Why boundaries quantise</Link>
              </dd>
            </div>
            <div>
              <dt className={label}>The bright threads are the still places</dt>
              <dd className="mt-1 text-ink-70">
                Light collects along the lines where the surface does not move, the same lines where sand settles on a
                Chladni plate.{" "}
                <Link href={`${SW_BASE}/timeline#chladni-1787`} className="text-ink underline underline-offset-4 hover:text-accent">Chladni on the timeline</Link>
              </dd>
            </div>
            <div>
              <dt className={label}>What it is not</dt>
              <dd className="mt-1 text-ink-70">
                This is a fluid on a speaker. The figures look like mandalas and atoms, but nothing here is quantum, and
                the resemblance proves nothing about matter.{" "}
                <Link href={`${SW_BASE}/read/vibration-isnt-magic`} className="text-ink underline underline-offset-4 hover:text-accent">Vibration isn&apos;t magic</Link>
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-[12.5px] leading-[1.6] text-graphite">
            Which figure forms is checked against two sets of measurements: a 24.25 mm dish of water photographed
            across 50–200 Hz (Sheldrake &amp; Sheldrake 2017) and a study of edge pinning in a small cylinder (Shao et al.
            2021). Where it departs from the bench, it does so for the look: the haze between the threads and the slow
            breathing are lighting effects, not physics. See{" "}
            <Link href={`${SW_BASE}/sources`} className="underline underline-offset-4 hover:text-ink">sources</Link>.
          </p>
        </section>
      </Container>
    </section>
  );
}
