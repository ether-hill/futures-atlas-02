import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "About — Futures Atlas",
  description:
    "Why we are making the Futures Atlas: a catalogue of grounded, explorable futures.",
};

export default function AboutPage() {
  return (
    <section className="py-[clamp(44px,7vw,96px)]">
      <Container>
        <header className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">
              About the atlas
            </span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <h1 className="text-[clamp(40px,6vw,88px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink text-balance">
            Why a Futures Atlas?
          </h1>
          <p className="oracle-voice mt-6 text-[clamp(18px,2.2vw,26px)] leading-snug text-ink">
            “The future is not one place. It is many, and most of them are still
            up for grabs.”
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-x-[clamp(24px,5vw,80px)] gap-y-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex max-w-[68ch] flex-col gap-6 font-mono text-[14px] leading-[1.8] text-ink-70">
            <p>
              <span className="text-ink">Placeholder copy.</span> Most futures
              talk is either a warning or a sales pitch — a single frightening
              line or a single shiny one. Neither is much use if you actually
              want to decide something. What is missing is the middle: concrete,
              specific, checkable pictures of how a given future would really
              work, drawn in enough detail to argue with.
            </p>
            <p>
              The Futures Atlas is our attempt at that middle. Each project takes
              one possible world — a revived village, a repaired economy, a
              redrawn coastline — and builds it out as something you can move
              through rather than just nod at. The point is not to predict. The
              point is to make alternatives feel real enough to choose between.
            </p>
            <p>
              Everything here is grounded. Where a project makes a claim, it
              points to something real: a scheme that worked somewhere, a number
              from a real source, a precedent you can follow back yourself. The
              imagination is ours; the evidence is the world&rsquo;s.
            </p>
            <p>
              This page is a placeholder and will be replaced with the real
              statement of intent. The work itself is in the{" "}
              <Link href="/" className="text-accent-deep underline underline-offset-2">
                atlas
              </Link>
              .
            </p>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="border border-ink bg-panel p-[clamp(20px,3vw,28px)]">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
                What we make
              </p>
              <p className="mt-2 font-mono text-[13px] leading-[1.7] text-ink-70">
                Speculative-design websites, tools and oracles — each a single
                future, built to be explored.
              </p>
            </div>
            <div className="border border-ink bg-accent-soft p-[clamp(20px,3vw,28px)]">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
                The rule
              </p>
              <p className="mt-2 font-mono text-[13px] leading-[1.7] text-ink-70">
                Imagine freely; cite everything. Nothing in the atlas is invented
                where it claims to be real.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
