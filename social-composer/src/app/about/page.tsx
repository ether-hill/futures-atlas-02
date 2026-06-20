import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · Social Composer — Futures Atlas",
  description: "What Social Composer is, how it works, and how it was built.",
};

/**
 * Per-project About page. The global Futures Atlas header (and the column
 * layout) come from layout.tsx, so this is just the scrollable body. Each
 * project can extend its About with further sections/pages of its own.
 */
export default function AboutPage() {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-bone text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <p className="label-archival text-oxblood mb-4">About this project</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-5">Social Composer</h1>
        <p className="text-ink/80 text-[15px] leading-[1.7] mb-4">
          Social Composer is a standalone, browser-based studio for turning a headline and an
          image or video into an export-ready social post. Pick a post type, compose the frame,
          add motion, and download a still, a GIF, or a short video — all without anything ever
          leaving your browser. It is one of the projects in the Futures Atlas.
        </p>

        <Section title="What it does">
          <ul className="space-y-2 text-ink/75 text-[14px] leading-[1.7] list-disc pl-5">
            <li><strong className="text-ink">Post types</strong> — Single, Carousel, Story, Reel / Short, and Quote Card, each at its native aspect ratio.</li>
            <li><strong className="text-ink">Compose</strong> — aspect ratio, headline &amp; sub-text, type size, placement, alignment, layout (full-bleed, card, split, circle), background and text colour.</li>
            <li><strong className="text-ink">Motion</strong> — background zoom/drift plus text animations (fade, rise, type-on, word cascade), tuned per slide.</li>
            <li><strong className="text-ink">Export</strong> — PNG still, animated GIF, MP4/WebM video, or a per-slide ZIP. Sequences render every slide into one file with cross-fades.</li>
            <li><strong className="text-ink">Transmutate a URL</strong> — paste any article or page and it pulls the images, headline, pull-quotes, section overviews and references straight into your library.</li>
            <li><strong className="text-ink">Private by default</strong> — composing and exporting happen entirely on your device; nothing is uploaded.</li>
          </ul>
        </Section>

        <Section title="How it works">
          <p className="text-ink/75 text-[14px] leading-[1.7] mb-3">
            A single canvas render engine drives the live preview and every exporter, so what you
            see is exactly what you get. Background and text motion are computed per-tick from each
            slide&rsquo;s own clock.
          </p>
          <p className="text-ink/75 text-[14px] leading-[1.7] mb-3">
            Videos play from their first frame and restart at the slide&rsquo;s set duration — a 5-second
            slide shows only the first 5 seconds of an 8-second clip, then loops — and that timing is
            preserved in the exported file, not just the preview.
          </p>
          <p className="text-ink/75 text-[14px] leading-[1.7]">
            Remote images and video are routed through same-origin proxies so they can be drawn onto
            the canvas and exported without tainting it. The app ships as a static bundle inside the
            Futures Atlas, with its few server routes (the URL importer and the media proxies) hosted
            by the Atlas itself.
          </p>
        </Section>

        <Section title="History">
          <p className="text-ink/75 text-[14px] leading-[1.7]">
            Social Composer began as a standalone tool and was rebuilt into the Futures Atlas — adopting
            the Atlas&rsquo;s dark palette, its Archivo / Bodoni Moda / IBM&nbsp;Plex&nbsp;Mono type system, and
            the shared blue accent — while keeping every bit of its composing and export functionality intact.
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-ink/15">
          <a href="/social-composer" className="text-oxblood text-[14px] hover:underline">← Back to the composer</a>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
      {children}
    </section>
  );
}
