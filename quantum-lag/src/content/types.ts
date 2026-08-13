/*
  The content model, per build-spec §3 and the structure of deck-final.md:
  claim, then an opening line that tells the reader why they are reading, then
  the story, then sources. Visual slots sit mid-story, at the point where the
  reader has just been given a fact they cannot quite picture.

  Prose fields are `claim`, `short`, `hook`, the `text` of a story block, a
  visual `caption`, and the policy `label`. A translator receives only those;
  every date, range, source and visual id stays in code.
*/

export type Status =
  /** A recorded event with a settled date. */
  | { kind: "happened"; year: number }
  /** Recorded, but the claim itself is contested. */
  | { kind: "disputed"; year: number; note?: string }
  /** Has not happened. `range: null` means no credible date exists; never
      invent one to fill the shape. */
  | { kind: "expected"; range: [number, number] | null };

export type Act = 1 | 2 | 3 | 4;

export type Policy = {
  year: number;
  label: string;
};

/**
 * A citation. `url` opens in a new tab where one has been verified: a DOI, a
 * standards document, an institutional page. Never a guessed address: a source
 * with no confirmed link renders as plain text.
 */
export type Source = {
  text: string;
  url?: string;
};

/**
 * A thumbnail. Public-domain or freely-licensed archive material only, with no
 * press-agency photography and no journal covers, per build-spec §14. Every
 * image carries its own credit, licence and file page, because a university
 * publishes this and it gets checked.
 */
export type Evidence = {
  src: string;
  alt: string;
  /** Intrinsic pixel size; the reveal renders every image at its own shape. */
  width: number;
  height: number;
  credit: string;
  licence: string;
  /** The file page the image came from, so the licence can be checked. */
  sourceUrl: string;
};

/** The registry key of a drawn figure. See components/visuals. */
export type VisualId = string;

/**
 * A story is an ordered run of paragraphs and figures. The figure sits where
 * the author put it, not collected at the end, because it is answering the
 * sentence immediately above it.
 */
export type Block =
  | { kind: "text"; text: string }
  | { kind: "visual"; id: VisualId; caption: string };

export type Claim = {
  /** Stable, the analytics key, never reused. */
  id: string;
  act: Act;
  /** The sentence placed on the timeline. */
  claim: string;
  /** A compression of the same sentence, for the master timeline's lanes. */
  short: string;
  status: Status;
  /** The opening line: why the reader is reading this one. */
  hook: string;
  story: Block[];
  /** Reasoning aid, guided mode only. Must never state a year; see the test. */
  prompt?: string;
  /** Deadlines in force regardless of the technology. */
  policy?: Policy[];
  sources: Source[];
  image?: Evidence;
};

export type ActMeta = {
  act: Act;
  title: string;
  /** The one-line premise of the act, shown on its title card. */
  premise: string;
  /** Shown after the act's last reveal, handing over to the next. */
  interstitial?: string;
};

/** Every paragraph of a claim's story, for search and for the plain-text tests. */
export function storyText(claim: Claim): string {
  return claim.story
    .filter((b): b is Extract<Block, { kind: "text" }> => b.kind === "text")
    .map((b) => b.text)
    .join(" ");
}
