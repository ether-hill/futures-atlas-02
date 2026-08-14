import { MosaicWall } from "./MosaicWall";

/**
 * The wall behind the report's title, and the scrim that makes type possible
 * on top of it. The wall itself lives in MosaicWall, which the feed card also
 * mounts — one wall, two very different amounts of darkening.
 *
 * The scrim is rgba rather than a token. A scrim's job is to darken a
 * photograph by a measured amount, which is not something a semantic colour
 * can do — the same documented exception the site's other photo heroes take.
 */
export function HeroMosaic() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <MosaicWall />

      {/* A light wash over the whole wall, to seat it as one surface… */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" />

      {/* …then the pool the type actually sits in — deep enough that no
          thumbnail competes with a word, and finished by roughly 40% across so
          the rest of the wall stays bright. Wide: an ellipse anchored off the
          left edge at the text block's own height. Narrow: the text spans the
          full width, so there is no side to protect and a top-weighted wash
          does the job instead. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.84)_0%,rgba(0,0,0,0.74)_58%,rgba(0,0,0,0.5)_100%)] min-[720px]:bg-[radial-gradient(92%_118%_at_-10%_42%,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.92)_32%,rgba(0,0,0,0.72)_52%,rgba(0,0,0,0.22)_76%,rgba(0,0,0,0)_92%)]" />

      {/* the hand-off into the page below */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_74%,rgba(0,0,0,0.42)_100%)]" />
    </div>
  );
}
