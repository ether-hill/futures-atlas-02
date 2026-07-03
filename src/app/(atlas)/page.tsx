import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroField } from "@/components/HeroField";
import { Reveal } from "@/components/Reveal";
import { ProjectGrid } from "@/components/ProjectCard";
import { projectsByDate } from "@/data/projects";

export default function Home() {
  return (
    <div>
      {/* Hero — Generatives "Field Dynamics" plays behind the headline */}
      <section className="plan-grid relative flex min-h-[78svh] items-end overflow-hidden border-b border-ink">
        <HeroField />
        <Container className="relative z-[1] py-[clamp(96px,16vh,200px)]">
          <Reveal>
            <p className="eyebrow tick mb-6">A catalogue of possible worlds</p>
            <h1 className="max-w-[16ch] text-[clamp(40px,8vw,120px)] font-extrabold leading-[0.92] tracking-[-0.03em] text-ink text-balance">
              Futures Atlas
            </h1>
            <p className="mt-7 max-w-[620px] font-mono text-[clamp(13px,1.4vw,16px)] leading-[1.7] text-ink-70">
              A growing collection of speculative-design projects. Each one takes
              a single possible future and draws it in full — grounded in real
              evidence, specific enough to argue with, and built to be explored
              rather than just described.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="#projects"
                className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-deep"
              >
                Browse the atlas <span className="text-[14px]">↓</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/30 px-[21px] py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
              >
                Why we built this
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Projects */}
      <section id="projects" className="scroll-mt-20 bg-surface py-[clamp(58px,9vw,130px)]">
        <Container>
          <Reveal>
            <h2 className="mb-[clamp(30px,5vw,56px)] max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              Latest
            </h2>
          </Reveal>

          <Reveal>
            <ProjectGrid items={projectsByDate.slice(0, 6)} />
            <div className="mt-[clamp(32px,5vw,56px)] flex justify-center">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
              >
                View all projects <span className="text-[14px]">→</span>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
