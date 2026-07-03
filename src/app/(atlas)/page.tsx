import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroField } from "@/components/HeroField";
import { Reveal } from "@/components/Reveal";
import { ProjectGrid } from "@/components/ProjectCard";
import { projectsOrdered } from "@/data/projects";
import { LOGOS } from "@/lib/logos";

// The stack strip: which marks headline the homepage tech banner (all render
// as paper-tone inline SVGs; the full inventory lives on /about).
const BANNER_TOOLS = ["claude", "openai", "nextjs", "react", "threejs", "p5js", "tailwindcss", "vercel", "d3", "huggingface"];

export default function Home() {
  return (
    <div>
      {/* Hero — an always-black stage (does not follow the light theme) with
          Generatives "Field Dynamics" flowing behind the headline */}
      <section className="relative flex min-h-[calc(100svh-64px)] items-end overflow-hidden border-b border-ink bg-black">
        <HeroField />
        <Container className="relative z-[1] py-[clamp(96px,16vh,200px)]">
          <Reveal>
            <p className="eyebrow tick mb-6 !text-paper/55">A catalogue of possible worlds</p>
            <h1 className="max-w-[16ch] text-[clamp(40px,8vw,120px)] font-extrabold leading-[0.92] tracking-[-0.03em] !text-paper text-balance">
              Mapping foresight
            </h1>
            <p className="mt-7 max-w-[620px] font-mono text-[clamp(13px,1.4vw,16px)] leading-[1.7] text-paper/70">
              A growing collection of speculative-design projects — prototypes,
              open-source tools, and research — built to raise awareness of
              quantum computing, emerging AI, and the organisations driving the
              future.
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
                className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-paper/30 px-[21px] py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-colors hover:border-paper"
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
            <ProjectGrid items={projectsOrdered.slice(0, 6)} />
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

      {/* Tech banner — the whole band links to the About page's stack + workflow */}
      <section className="border-t border-ink/15 bg-band">
        <Container className="py-[clamp(56px,9vw,120px)]">
          <Reveal>
            <Link href="/about" className="group block">
              <p className="eyebrow tick mb-6 !text-paper/50">Built in the open</p>
              <h2 className="max-w-[24ch] text-[clamp(28px,4.2vw,60px)] font-extrabold leading-[1.02] tracking-[-0.022em] !text-paper text-balance">
                Every project documents the AI systems and creative code it&rsquo;s
                made with.
              </h2>
              <div className="mt-[clamp(28px,4vw,48px)] flex flex-wrap items-center gap-x-[clamp(28px,4vw,56px)] gap-y-7 text-paper/60 transition-colors group-hover:text-paper/85">
                {BANNER_TOOLS.map((slug) => {
                  const glyph = LOGOS[slug];
                  if (!glyph) return null;
                  return (
                    <svg
                      key={slug}
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label={glyph.title}
                      className="h-[clamp(28px,3vw,40px)] w-auto fill-current"
                    >
                      <title>{glyph.title}</title>
                      <path d={glyph.path} />
                    </svg>
                  );
                })}
              </div>
              <span className="mt-[clamp(28px,4vw,44px)] inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper/80 underline-offset-4 transition-colors group-hover:text-paper group-hover:underline">
                The stack, the workflow, the lab <span className="text-[14px]">→</span>
              </span>
            </Link>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
