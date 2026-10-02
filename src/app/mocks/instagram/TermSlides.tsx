"use client";

/**
 * A vocabulary post: the word on its cover, then the story the caption tells,
 * one beat per slide.
 *
 * THE COVER SYSTEM. Every vocabulary cover is the same drawing (the same type,
 * in the same place, in the same order) on a ground that changes per word. The
 * ground is the one thing that varies, and it varies by a rule, so twelve of
 * them in a grid read as one series rather than twelve experiments:
 *
 *   photo   a photograph of what the word is about, always in the Atlas duotone
 *           (ink shadows, blue highlights). The picture changes; the colour never.
 *   colour  no picture. A flat ground in the word's own hue, from a closed set.
 *   plate   bone paper with the photograph in a window above the word, in its
 *           own colour, like a dictionary plate.
 *
 * Shown side by side at /mocks/term-bg. The feed draws `photo`.
 *
 * Where a word has a story, the cover is not a separate picture: it is the
 * first story photograph, so slide one and slide two are the same place, first
 * in the duotone and then in its own colours.
 *
 * THE STORY. Every word on a story slide is the caption's, split into beats; a
 * slide adds nothing the caption does not say. Every photograph is a real
 * document or a real place, with its credit and licence printed on the slide
 * that uses it, because the licences ask for it and because a reader should be
 * able to tell a record from an illustration.
 */

import type { Ratio } from "./Slide";
import type { TermPost } from "./fields";

export type CoverSystem = "photo" | "colour" | "plate";

const RATIO_H: Record<Ratio, number> = { "4:5": 5 / 4, "1:1": 1, "9:16": 16 / 9 };
const W = 480;

/** A long word is set smaller, never cut off. 0.56em is the widest the display
 *  face runs per character in mixed case, measured across the terms. */
const fitWord = (word: string, avail: number, max: number) =>
  `${Math.min(max, avail / (0.56 * word.length))}cqw`;

function Mark({ light }: { light?: boolean }) {
  return (
    <div className={`tv-mark${light ? " on-light" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fa.svg" alt="" />
      <span>Futures Atlas &middot; vocabulary</span>
    </div>
  );
}

function Credit({ text, light }: { text: string; light?: boolean }) {
  return <div className={`tv-credit${light ? " on-light" : ""}`}>{text}</div>;
}

function Roots({ parts, first }: { parts: { w: string; lang: string; gloss: string }[]; first?: boolean }) {
  return (
    <div className={`tv-roots${first ? " first" : ""}`}>
      {parts.map((p) => (
        <span key={p.w}>
          <b>{p.w}</b> {p.lang}, {p.gloss}
        </span>
      ))}
    </div>
  );
}

export function TermSlide({
  post, index, ratio, cover = "photo",
}: { post: TermPost; index: number; ratio: Ratio; cover?: CoverSystem }) {
  return (
    <div className="stf" style={{ width: W, height: W * RATIO_H[ratio] }}>
      {/* The container the slide's cqw units resolve against. It has to be a
          parent: padding in cqw on the container element itself resolves
          against the viewport, and the slide set differently on every screen. */}
      <div className="tv-root">
        {index === 0 ? <Cover post={post} system={cover} /> : <Story post={post} index={index - 1} />}
      </div>
    </div>
  );
}

function Cover({ post, system }: { post: TermPost; system: CoverSystem }) {
  const photo = post.cover ?? post.story?.find((b) => b.photo && b.photo.fit !== "plate")?.photo;
  // Without a photograph the photo and plate systems have nothing to show, so
  // they fall back to the colour ground rather than inventing a picture.
  const sys = !photo && system !== "colour" ? "colour" : system;
  const light = sys !== "photo";
  // A word with a story keeps its cover to the definition: the line that used
  // to sit under it is now slide two onwards.
  const showBody = !!post.body && !post.story?.length && sys !== "plate";
  return (
    <div className={`tv tv-cover is-${sys}`} style={{ ["--hue" as string]: post.hue ?? "#3b93d5" }}>
      {sys === "photo" && photo ? (
        <div className="tv-duo" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" style={{ objectPosition: photo.pos ?? "50% 50%" }} />
        </div>
      ) : null}
      {sys === "plate" && photo ? (
        <div className="tv-window">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" style={{ objectPosition: photo.pos ?? "50% 50%" }} />
        </div>
      ) : null}
      <div className="tv-col">
        <div className="tv-kind">{post.kind_}</div>
        <div className="tv-word" style={{ fontSize: fitWord(post.term, 84, sys === "colour" ? 19 : 16) }}>
          {post.term}
        </div>
        <div className="tv-pron">{post.pron}</div>
        <p className="tv-def">{post.definition}</p>
        {showBody ? <p className="tv-body">{post.body}</p> : null}
      </div>
      {/* A photograph borrowed from the story is credited on its own slide. */}
      {post.cover && sys !== "colour" ? <Credit text={post.cover.credit} /> : null}
      <Mark light={light} />
    </div>
  );
}

function Story({ post, index }: { post: TermPost; index: number }) {
  const s = post.story?.[index];
  if (!s) return null;

  // A document, shown whole: a title page cropped to fill the frame is a
  // picture of some letters, and the page is the evidence.
  if (s.photo?.fit === "plate") {
    return (
      <div className="tv tv-story is-doc">
        <div className="tv-doc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.photo.src} alt="" />
        </div>
        <div className="tv-col tv-doc-text">
          {s.kicker ? <div className="tv-kind">{s.kicker}</div> : null}
          {s.big ? <div className="tv-big">{s.big}</div> : null}
          {s.text ? <p className="tv-text">{s.text}</p> : null}
        </div>
        <Credit text={s.photo.credit} />
        {s.end ? <Mark /> : null}
      </div>
    );
  }

  if (s.photo) {
    return (
      <div className="tv tv-story is-photo">
        {s.photo.duo ? (
          <div className="tv-duo" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.photo.src} alt="" style={{ objectPosition: s.photo.pos ?? "50% 50%" }} />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="tv-bleed" src={s.photo.src} alt="" style={{ objectPosition: s.photo.pos ?? "50% 50%" }} />
        )}
        <i className="tv-scrim" aria-hidden="true" style={s.photo.dim != null ? { background: `rgba(10,14,20,${s.photo.dim})` } : undefined} />
        <div className="tv-col">
          {s.kicker ? <div className="tv-kind">{s.kicker}</div> : null}
          {/* Paragraph first, then the lines it lands on: the caption's order. */}
          {s.text ? <p className="tv-text">{s.text}</p> : null}
          {s.parts && !s.text ? <Roots parts={s.parts} first /> : null}
          {s.big ? <div className="tv-big">{s.big}</div> : null}
          {s.parts && s.text ? <Roots parts={s.parts} /> : null}
        </div>
        <Credit text={s.photo.credit} />
        {s.end ? <Mark /> : null}
      </div>
    );
  }

  return (
    <div className={`tv tv-story is-type${s.end ? " is-end" : ""}`}>
      <div className="tv-col">
        {s.kicker ? <div className="tv-kind">{s.kicker}</div> : null}
        {s.text && !s.parts ? <p className="tv-lead">{s.text}</p> : null}
        {s.parts ? (
          <div className="tv-parts">
            {s.parts.map((p) => (
              <div key={p.w} className="tv-part">
                <div className="tv-part-w">{p.w}</div>
                <div className="tv-part-g">
                  <span>{p.lang}</span> {p.gloss}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {s.big ? <div className="tv-big">{s.big}</div> : null}
        {s.text && s.parts ? <p className="tv-text">{s.text}</p> : null}
      </div>
      {s.end ? <Mark /> : null}
    </div>
  );
}

/* Sizes are cqw, 1% of the slide's width, so every slide holds at 9:16, 4:5
   and 1:1. One face throughout, the Atlas display sans: no serif, no italics. */
export const TERM_CSS = `
.stf .tv-root { position: absolute; inset: 0; container-type: inline-size; }
.stf .tv {
  position: absolute; inset: 0; box-sizing: border-box; overflow: hidden;
  display: flex; flex-direction: column;
  padding: 16cqw 8cqw; color: #f2ede2; justify-content: center;
  background: #101319;
}
.stf .tv-col { position: relative; z-index: 2; }
.stf .tv-kind {
  font-family: var(--font-heading); font-weight: 600; font-size: 2.9cqw;
  letter-spacing: .16em; text-transform: uppercase; color: var(--hue, #3b93d5);
}
.stf .tv-word {
  margin-top: 2.6cqw; font-family: var(--font-heading); font-weight: 800;
  letter-spacing: -.045em; line-height: .96;
}
.stf .tv-pron { margin-top: 2.6cqw; font-size: 3.4cqw; letter-spacing: .02em; opacity: .62; }
.stf .tv-def {
  margin: 5cqw 0 0; font-size: 5.2cqw; line-height: 1.3; letter-spacing: -.015em; font-weight: 600;
  max-width: 34ch;
}
.stf .tv-body { margin: 4cqw 0 0; font-size: 4.2cqw; line-height: 1.4; opacity: .7; max-width: 36ch; }

.stf .tv-mark {
  position: absolute; left: 8cqw; bottom: 7cqw; z-index: 3;
  display: flex; align-items: center; gap: 2.2cqw;
}
.stf .tv-mark img { display: block; height: 3.6cqw; width: auto; filter: invert(1); opacity: .75; }
.stf .tv-mark span {
  font-family: var(--font-heading); font-weight: 600; font-size: 2.4cqw;
  letter-spacing: .2em; text-transform: uppercase; color: rgba(242,237,226,.5);
}
.stf .tv-mark.on-light img { filter: none; opacity: .8; }
.stf .tv-mark.on-light span { color: rgba(23,24,27,.55); }
.stf .tv-credit {
  position: absolute; right: 8cqw; bottom: 7.3cqw; z-index: 3; max-width: 46%;
  text-align: right; font-size: 2.1cqw; line-height: 1.35; color: rgba(242,237,226,.55);
}
.stf .tv-credit.on-light { color: rgba(23,24,27,.55); }

/* ── cover: photo, in the Atlas duotone ─────────────────────────────────
   Grey photograph multiplied onto blue (white becomes blue), then the ink
   lightened in (black becomes ink). Any photograph comes out in the same two
   colours, which is what lets the picture change and the series hold. */
.stf .tv-cover.is-photo { --hue: #8cc4ee; }
.stf .tv-duo { position: absolute; inset: 0; background: #3b93d5; }
.stf .tv-duo img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: grayscale(1) contrast(1.15) brightness(1.05); mix-blend-mode: multiply;
}
.stf .tv-duo::after {
  content: ""; position: absolute; inset: 0; background: #0e1622; mix-blend-mode: lighten;
}
.stf .tv-cover.is-photo::before {
  content: ""; position: absolute; inset: 0; z-index: 1;
  background: rgba(10,14,20,.5);
}

/* ── cover: colour ─────────────────────────────────────────────────────── */
.stf .tv-cover.is-colour { background: var(--hue); color: #17181b; }
.stf .tv-cover.is-colour .tv-kind { color: rgba(23,24,27,.62); }

/* ── cover: plate ──────────────────────────────────────────────────────── */
.stf .tv-cover.is-plate {
  background: #f2ede2; color: #17181b; justify-content: flex-start; padding: 5cqw 5cqw 16cqw;
}
.stf .tv-cover.is-plate .tv-col { padding: 6cqw 3cqw 0; }
.stf .tv-cover.is-plate .tv-kind { color: color-mix(in srgb, var(--hue) 70%, #17181b); }
.stf .tv-window { flex: 0 0 36%; overflow: hidden; background: #ddd6c8; }
.stf .tv-cover.is-plate .tv-def { font-size: 4.8cqw; }
.stf .tv-cover.is-plate .tv-body { display: none; }
/* On a cover the mark owns the foot, so the credit goes to the head. */
.stf .tv-cover .tv-credit { top: 7cqw; bottom: auto; }
.stf .tv-cover.is-plate .tv-credit { top: 7cqw; right: 7cqw; text-shadow: 0 0 1.5cqw rgba(0,0,0,.7); }
.stf .tv-window img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── story ─────────────────────────────────────────────────────────────── */
.stf .tv-story.is-type { justify-content: center; }
.stf .tv-lead { margin: 0; font-size: 5.4cqw; line-height: 1.35; opacity: .72; max-width: 32ch; }
.stf .tv-big {
  margin-top: 4cqw; font-family: var(--font-heading); font-weight: 800;
  font-size: 9.4cqw; line-height: 1.04; letter-spacing: -.035em; white-space: pre-line;
}
.stf .tv-kind + .tv-big { margin-top: 3cqw; }
.stf .tv-story.is-photo .tv-text { margin-top: 0; }
.stf .tv-story.is-photo .tv-col { text-shadow: 0 .3cqw 2.4cqw rgba(0,0,0,.85), 0 0 .8cqw rgba(0,0,0,.6); }
.stf .tv-story.is-photo .tv-big { margin-top: 6cqw; font-size: 7.6cqw; }
.stf .tv-text { margin: 4.5cqw 0 0; font-size: 4.8cqw; line-height: 1.4; max-width: 34ch; opacity: .86; }
.stf .tv-story.is-end .tv-big { font-size: 8cqw; }

.stf .tv-bleed { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.stf .tv-scrim {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(10,14,20,.62);
}
.stf .tv-roots {
  margin-top: 6cqw; padding-top: 4.5cqw; border-top: 1px solid rgba(242,237,226,.25);
  display: flex; flex-direction: column; gap: 1.5cqw; font-size: 4.2cqw; color: rgba(242,237,226,.8);
}
.stf .tv-roots.first { margin-top: 0; padding-top: 0; border-top: 0; }
.stf .tv-roots b { font-family: var(--font-heading); font-weight: 800; font-size: 5.6cqw; letter-spacing: -.02em; color: #f2ede2; margin-right: 1cqw; }
/* Over a photograph the blue label sinks into sky and spoil; bone holds. */
.stf .tv-story.is-photo .tv-kind { color: rgba(242,237,226,.85); }

.stf .tv-doc { flex: 0 0 40%; position: relative; }
.stf .tv-doc img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; display: block;
}
.stf .tv-doc-text { flex: 0 0 auto; padding-top: 7cqw; }
.stf .tv-doc-text .tv-big { font-size: 8.4cqw; }
.stf .tv-doc-text .tv-text { font-size: 4.2cqw; }

.stf .tv-parts { display: flex; flex-direction: column; gap: 5cqw; margin-top: 5cqw; }
.stf .tv-part-w {
  font-family: var(--font-heading); font-weight: 800; font-size: 13cqw;
  line-height: 1; letter-spacing: -.04em;
}
.stf .tv-part-g { margin-top: 1.6cqw; font-size: 4.6cqw; opacity: .8; }
.stf .tv-part-g span {
  font-family: var(--font-heading); font-weight: 600; font-size: 2.9cqw;
  letter-spacing: .16em; text-transform: uppercase; color: #3b93d5; margin-right: 1.4cqw;
}
.stf .tv-parts + .tv-text { margin-top: 8cqw; font-size: 5.4cqw; font-weight: 600; opacity: 1; }
`;
