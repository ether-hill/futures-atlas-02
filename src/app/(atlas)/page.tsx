import Link from "next/link";
import { Container } from "@/components/Container";
import { HeroField } from "@/components/HeroField";
import { Reveal } from "@/components/Reveal";
import { ProjectGrid } from "@/components/ProjectCard";
import { liveProjects } from "@/data/projects";
import { FeedMasonry } from "@/components/FeedMasonry";
import { editorPosts, livePosts } from "@/data/posts";
import { prototypesFor } from "@/data/prototypes";
import { getEditor } from "@/lib/editor";
import { LOGOS } from "@/lib/logos";

// The stack strip: which marks headline the homepage tech banner (all render
// as paper-tone inline SVGs; the full inventory lives on /about).
const BANNER_TOOLS = ["claude", "openai", "midjourney", "kling", "veo", "nextjs", "react", "threejs", "p5js", "tailwindcss", "vercel", "huggingface", "mistral", "deepseek"];

export default async function Home() {
  // The homepage strip is public-facing: always live projects only, even for a
  // signed-in editor. Drafts are visible on /projects, not here.
  const isEditor = Boolean(await getEditor());
  const recent = liveProjects.slice(0, 6);
  // The feed is staging-only (STAGING_ONLY in src/middleware.ts). Production
  // does not link to it, so the homepage does not carry it either — a masonry
  // of posts whose every card leads to a 404 is worse than no masonry.
  const feedHere = process.env.VERCEL_ENV !== "production";
  // Newest fifteen, but never a set with no video in it: the masonry plays them
  // in place, and chronology alone can leave every one of them just out of range.
  const source = isEditor ? editorPosts : livePosts;
  const latestPosts = (() => {
    const head = source.slice(0, 15);
    if (head.some((p) => p.kind === "video")) return head;
    const vid = source.find((p) => p.kind === "video");
    return vid ? [...head.slice(0, 14), vid] : head;
  })();

  /**
   * A per-request seed for the bench card's opening face.
   *
   * Computed on the SERVER and passed down so both renders agree: a
   * Math.random() at mount would give the client a different first specimen than
   * the HTML it is hydrating, and React tears the tree down over that.
   */
  const benchSeed = Date.now();

  return (
    <div>
      {/* Hero, an always-black stage (does not follow the light theme) with
          Generatives "Field Dynamics" flowing behind the headline */}
      <section
        data-fa-hero
        /* The body reserves the bar's height on every page, so the hero has to
           climb back over it to run full bleed — otherwise the visualisation
           starts below a strip of page background. The inner padding already
           clears the bar, so nothing lands underneath it. */
        className="relative mt-[calc(-1*var(--fa-nav-h))] flex min-h-[100svh] items-end overflow-hidden border-b border-ink bg-black"
      >
        <HeroField />
        <Container className="relative z-[1] pt-[clamp(96px,16vh,200px)] pb-[clamp(44px,7vh,84px)]">
          <Reveal>
            <h1 className="max-w-[16ch] text-[clamp(40px,8vw,120px)] font-extrabold leading-[0.92] tracking-[-0.03em] !text-paper text-balance">
              Mapping foresight
            </h1>
            <p className="mt-7 max-w-[620px] text-[clamp(13px,1.4vw,16px)] leading-[1.7] text-paper/70">
              Building frameworks for foresight. Speculative-design projects,
              open-source tools, apps and prototypes exploring compute: quantum
              systems, AI, and the power structures driving them.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="#projects"
                className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-press"
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
            <h2 className="max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
              Recent projects
            </h2>
            <p className="mb-[clamp(30px,5vw,56px)] mt-6 max-w-[620px] text-[clamp(13px,1.4vw,16px)] leading-[1.7] text-ink/70">
              Tools, games and live simulations, mostly about compute and who
              ends up owning it. Nothing here is a mockup: open one and it runs.
            </p>
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

      {/* The feed, as a masonry of the newest posts — videos play in place */}
      {feedHere ? (
        <FeedMasonry
          posts={latestPosts}
          showVisibility={isEditor}
          benchSeed={benchSeed}
          prototypes={prototypesFor(isEditor)}
        />
      ) : null}

      {/* Tech banner, the whole band links to the About page's stack + workflow */}
      <section className="border-t border-ink/15 bg-band">
        <Container className="py-[clamp(56px,9vw,120px)]">
          <Reveal>
            <Link href="/about" className="group block">
              <p className="eyebrow mb-6">Built in the open</p>
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
