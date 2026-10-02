"use client";

import { PostSlide, SlideFrame, SlideStyles } from "../instagram/Slide";
import { TERM_POSTS } from "../instagram/fields";
import type { CoverSystem } from "../instagram/TermSlides";

/**
 * The vocabulary covers as a SYSTEM: three candidate rules, each drawn for all
 * three words, so what you compare is how a row of them reads in a grid (the
 * consistency) and how far apart two of them sit (the variance). Under that,
 * Solastalgia as the full carousel.
 *
 * Replaces the twelve blurred moving grounds that used to be here, which were
 * rejected: each was a one-off, and none said anything about its word.
 */

const SYSTEMS: { id: CoverSystem; name: string; rule: string }[] = [
  {
    id: "photo",
    name: "A. Photograph, in the Atlas duotone",
    rule: "The cover is the photograph from slide two, turned into the same two colours every time: ink shadows, Atlas blue highlights. Swipe and the same picture appears in its own colours. The picture changes per word; the colour and the type never do.",
  },
  {
    id: "colour",
    name: "B. Colour field",
    rule: "No picture. Each word gets a flat ground in one hue from a closed set of four (the deck's sector colours), with the word set big in ink. The loudest in a grid and the easiest to keep up.",
  },
  {
    id: "plate",
    name: "C. Plate",
    rule: "Bone paper, the photograph in a fixed window in its own colours, the word underneath, like a plate in a field guide. The only light option, so it breaks up a dark feed.",
  },
];

const W = 250;
const SLIDE_W = 270;

export default function TermBackgrounds() {
  const sol = TERM_POSTS.find((p) => p.id === "solastalgia")!;
  const n = 1 + (sol.story?.length ?? 0);
  return (
    <div className="min-h-screen bg-[#0b0c0f] px-4 py-10 text-paper">
      <SlideStyles />
      <div className="mx-auto max-w-[1340px]">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Vocabulary covers</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-[1.6] text-paper/65">
          Three rules for the cover of a vocabulary post, each drawn for all three words. The type is identical in all
          nine; only the ground changes. Look along a row for consistency and across it for variance.
        </p>

        {SYSTEMS.map((s) => (
          <section key={s.id} className="mt-12">
            <h2 className="text-[19px] font-bold">{s.name}</h2>
            <p className="mt-1 max-w-[680px] text-[14px] leading-[1.6] text-paper/55">{s.rule}</p>
            <div className="mt-5 flex flex-wrap gap-5">
              {TERM_POSTS.map((p) => (
                <SlideFrame key={p.id} width={W} ratio="4:5">
                  <PostSlide post={p} index={0} ratio="4:5" cover={s.id} />
                </SlideFrame>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-16">
          <h2 className="text-[19px] font-bold">Solastalgia, the whole carousel</h2>
          <p className="mt-1 max-w-[680px] text-[14px] leading-[1.6] text-paper/55">
            {n} slides at 4:5, cover in system A. The caption in its own order, one beat a slide, photograph
            above and words below. Every photograph is a real place in the Hunter, credited on its slide.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 pb-4">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="shrink-0">
                <SlideFrame width={SLIDE_W} ratio="4:5">
                  <PostSlide post={sol} index={i} ratio="4:5" />
                </SlideFrame>
                <div className="mt-2 text-[13px] text-paper/45">{i + 1}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
