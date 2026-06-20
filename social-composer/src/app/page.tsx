import { StudioApp } from "./studio-app";
import { emptySource, type ComposerFrame } from "@/lib/composer/source";

// Standalone tool: the composer is the homepage. We seed one blank canvas so the
// preview is live and every Compose control (layout, background, text colour…)
// works on first load — uploads simply add more frames alongside it.
const starter: ComposerFrame = {
  id: "starter",
  kind: "cover",
  label: "Blank canvas",
  headline: "Your headline",
  sub: "",
  imageUrl: null,
};

// Frond-style project page: title + summary up top, the composer (the tool)
// framed below, then an About section — all on the global nav grid (28px sides).
export default function Page() {
  return (
    <div className="px-7 pb-[110px] pt-11 max-[680px]:px-4">
      <header className="mb-7">
        <h1
          className="m-0 text-[clamp(42px,7.5vw,96px)] font-extrabold leading-[0.96] tracking-[-0.025em] text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Social Composer
        </h1>
        <p className="mt-[22px] m-0 max-w-[640px] text-[16px] leading-[1.55] text-ink/70">
          A standalone social-post composer — pick a post type, lay out cover, quote and carousel
          frames, tune type, colour and motion, then export PNG, ZIP, GIF or video. Import any
          article with “transmutate” to pull its reusable pieces straight onto the canvas.
        </p>
      </header>

      <section className="rounded-xl border border-ink/12">
        <StudioApp source={{ ...emptySource(), frames: [starter] }} />
      </section>

      <section className="mt-11 border-t border-ink/15 pt-7">
        <div className="mb-3.5 text-[10px] uppercase tracking-[0.12em] text-gilt">About</div>
        <div className="grid grid-cols-[1.7fr_1fr] gap-11 max-[900px]:grid-cols-1 max-[900px]:gap-6">
          <div>
            <h2
              className="m-0 mb-3 text-[24px] font-semibold tracking-[-0.01em] text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Social Composer
            </h2>
            <p className="m-0 max-w-[62ch] text-[14.5px] leading-[1.65] text-ink/70">
              Compose on-brand social posts in the Futures Atlas type system — Archivo display,
              Bodoni Moda voice, IBM Plex Mono labels. Build single posts, carousels, stories, reels
              and quote cards, animate them, and export stills or video. Its server routes (article
              import and media render) run in the host app at <code>/api/social-composer/*</code>.
            </p>
          </div>
          <dl className="m-0 grid content-start gap-3.5">
            <div>
              <dt className="mb-1 text-[10px] uppercase tracking-[0.1em] text-gilt">Exports</dt>
              <dd className="m-0 text-[13px] text-ink">PNG · ZIP · GIF · MP4</dd>
            </div>
            <div>
              <dt className="mb-1 text-[10px] uppercase tracking-[0.1em] text-gilt">Post types</dt>
              <dd className="m-0 text-[13px] text-ink">Single · Carousel · Story · Reel · Quote</dd>
            </div>
            <div>
              <dt className="mb-1 text-[10px] uppercase tracking-[0.1em] text-gilt">Type system</dt>
              <dd className="m-0 text-[13px] text-ink">Archivo · Bodoni Moda · IBM Plex Mono</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
