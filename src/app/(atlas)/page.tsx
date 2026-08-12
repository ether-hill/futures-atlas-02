import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroField } from "@/components/HeroField";
import { Reveal } from "@/components/Reveal";
import { ProjectGrid } from "@/components/ProjectCard";
import { visibleProjects } from "@/data/projects";
import { editorPosts, formatPostDate, livePosts, KIND_LABEL } from "@/data/posts";
import { getEditor } from "@/lib/editor";
import { LOGOS } from "@/lib/logos";

// The stack strip: which marks headline the homepage tech banner (all render
// as paper-tone inline SVGs; the full inventory lives on /about).
const BANNER_TOOLS = ["claude", "openai", "midjourney", "kling", "veo", "nextjs", "react", "threejs", "p5js", "tailwindcss", "vercel", "huggingface", "mistral", "deepseek"];

export default async function Home() {
  // Editors see their drafts in the recent strip too, flagged as such.
  const isEditor = Boolean(await getEditor());
  const recent = visibleProjects(isEditor).slice(0, 6);
  const dispatches = (isEditor ? editorPosts : livePosts).slice(0, 4);

  return (
    <div>
      {/* Hero, an always-black stage (does not follow the light theme) with
          Generatives "Field Dynamics" flowing behind the headline */}
      <section className="relative flex min-h-[calc(100svh-64px)] items-end overflow-hidden border-b border-ink bg-black">
        <HeroField />
        <Container className="relative z-[1] pt-[clamp(96px,16vh,200px)] pb-[clamp(44px,7vh,84px)]">
          <Reveal>
            <h1 className="max-w-[16ch] text-[clamp(40px,8vw,120px)] font-extrabold leading-[0.92] tracking-[-0.03em] !text-paper text-balance">
              Mapping foresight
            </h1>
            <p className="mt-7 max-w-[620px] font-mono text-[clamp(13px,1.4vw,16px)] leading-[1.7] text-paper/70">
              A growing collection of speculative-design projects, prototypes,
              open-source tools, and research, built to raise awareness of
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
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Projects */}
      <section id="projects" className="scroll-mt-20 bg-surface py-[clamp(58px,9vw,130px)]">
        <Container>
          <Reveal>
            <h2 className="mb-[clamp(30px,5vw,56px)] max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              Recent projects
            </h2>
          </Reveal>

          <Reveal>
            <ProjectGrid items={recent} showVisibility={isEditor} />
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

      {/* Dispatches, the reading log: newest four, as a scannable column */}
      {dispatches.length > 0 && (
        <section className="border-t border-ink/15 bg-surface py-[clamp(58px,9vw,130px)]">
          <Container>
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div>
                  <p className="eyebrow tick mb-6">The reading log</p>
                  <h2 className="max-w-[22ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
                    Dispatches
                  </h2>
                </div>
                <Link
                  href="/dispatches"
                  className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
                >
                  All dispatches <span className="text-[14px]">→</span>
                </Link>
              </div>
            </Reveal>

            <Reveal>
              <ul className="mt-[clamp(30px,5vw,56px)] border-t border-ink/[0.14]">
                {dispatches.map((p) => (
                  <li key={p.slug} className="border-b border-ink/[0.14]">
                    <Link
                      href={`/dispatches/${p.slug}`}
                      className="group grid gap-x-[clamp(16px,2.4vw,40px)] gap-y-2.5 py-[clamp(18px,2.4vw,30px)] min-[860px]:grid-cols-[152px_1fr]"
                    >
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
                        {formatPostDate(p.posted)} · {KIND_LABEL[p.kind]}
                      </span>
                      <span>
                        <span className="block max-w-[40ch] text-[clamp(17px,1.7vw,23px)] font-extrabold leading-[1.16] tracking-[-0.018em] text-ink transition-colors group-hover:text-accent text-balance">
                          {p.title}
                        </span>
                        <span
                          className="mt-2 block max-w-[64ch]"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-body-size)",
                            lineHeight: "var(--lh-body)",
                            color: "var(--text-body)",
                          }}
                        >
                          {p.dek}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Tech banner, the whole band links to the About page's stack + workflow */}
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
                      fillRule="evenodd"
                      clipRule="evenodd"
                      className="h-[clamp(28px,3vw,40px)] w-auto fill-current"
                    >
                      <title>{glyph.title}</title>
                      {glyph.paths.map((d, i) => (
                        <path key={i} d={d} />
                      ))}
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
