import Link from "next/link";
import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { PageIn } from "@/components/PageIn";
import { Reveal } from "@/components/Reveal";

/**
 * The site's 404, and the busiest non-page on it.
 *
 * It has to live at the app root, because an unmatched URL never enters a route
 * group and so never reaches a not-found inside (atlas). The same is true of the
 * middleware's rewrite to /_internal-not-here, which is how every draft project
 * and every staging-only path answers on production — that is most of the
 * traffic this file will ever see, people opening a link that was shared before
 * the project was unpublished or renamed.
 *
 * A root not-found renders inside the ROOT layout only. That gives it the shared
 * nav for free (atlas-nav.js injects the bar from the root <head>, on every page
 * of the site and every sub-app bundle alike) but NOT the footer, which
 * (atlas)/layout.tsx supplies to the hub pages. So rather than let this render as
 * a bare column, it repeats that group's chrome exactly: the same
 * `<main className="flex-1">` — body is a min-h-screen flex column, so the footer
 * only sits at the bottom if the main above it grows — the same PageIn fade, and
 * the same one Footer component. Change AtlasLayout and this wants the same edit.
 */
export default function NotFound() {
  return (
    <>
      <main className="flex-1">
        <PageIn>
          <section className="flex min-h-[58svh] items-center py-[clamp(56px,10vw,120px)]">
            <Container>
              <Reveal>
                <p className="eyebrow mb-6">404</p>
                <h1 className="max-w-[16ch] text-[clamp(34px,5.2vw,72px)] font-extrabold leading-[0.98] tracking-[-0.024em] text-ink text-balance">
                  Page not found
                </h1>
                <p className="mt-7 max-w-[560px] text-[clamp(13px,1.4vw,16px)] leading-[1.75] text-ink-70">
                  That address doesn&rsquo;t lead to a page on the Atlas. Some
                  projects here are still drafts and aren&rsquo;t published yet,
                  and a few have changed name since their links were shared.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-press"
                  >
                    Go to the homepage <span className="text-[14px]">→</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2.5 rounded-[2px] border-[1.5px] border-ink/25 px-[22px] py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
                  >
                    View all projects <span className="text-[14px]">→</span>
                  </Link>
                </div>

                <p className="mt-9 max-w-[560px] text-[13px] leading-[1.7] text-ink/55">
                  Everything published is listed in the footer below. If you
                  followed this link from somewhere else,{" "}
                  <Link
                    href="/contact"
                    // Underlined at rest, not only on hover. It sits inside a
                    // paragraph, and colour alone is not a distinction someone
                    // who cannot separate the two can act on (WCAG 1.4.1).
                    className="text-accent-deep underline underline-offset-4 transition-colors hover:no-underline"
                  >
                    tell us where it was
                  </Link>
                  .
                </p>
              </Reveal>
            </Container>
          </section>
        </PageIn>
      </main>
      <Footer />
    </>
  );
}
