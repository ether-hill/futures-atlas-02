import { MOSAIC } from "@/data/hegemony";

/**
 * The wall behind the title.
 *
 * Built from MOSAIC — every video still and every publisher's og:image used
 * further down the page — so the masthead is made of the coverage rather than
 * decorated with a stock picture of a circuit board. Add an item to VIDEOS or
 * PRESS and it turns up here; nothing can appear in the mosaic that the page
 * does not also name and link.
 *
 * The wall is meant to be READ, not felt. Every thumbnail carries type — a
 * chyron, a masthead, a headline — and that type is the whole point: you
 * should be able to see it is nine broadcasts and nine articles before you
 * scroll to them. So the tiles keep their colour and very nearly their full
 * brightness, and the darkening is a pool behind the words rather than a wash
 * over everything. A first pass greyed them out under a heavy full-width
 * scrim and the wall stopped saying anything at all.
 *
 * Three further notes:
 *
 * • `aria-hidden`, decorative. All eighteen are captioned in full below, so
 *   announcing them here would be noise, and alt text would be claiming they
 *   are content when they are texture.
 *
 * • The scrim is rgba rather than a token. A scrim's job is to darken a
 *   photograph by a measured amount, which is not something a semantic colour
 *   can do — the same documented exception the site's other photo heroes take.
 *
 * • Columns are offset against each other, so the seams do not line up into
 *   readable rows. An aligned grid of sixteen-by-nines reads as a contact
 *   sheet; staggered, it reads as a wall.
 */

/** Six stacks; the last three drop away as the viewport narrows. */
const COLUMNS = 6;
/** Tiles per stack — enough to overflow the band at its tallest. */
const PER_COLUMN = 10;

/**
 * How far each column is pushed up, in vw so it tracks the tile size across
 * breakpoints. Fixed literals, not random: the same wall has to come back on
 * every render, and Math.random() here would mean a server/client mismatch.
 */
const OFFSETS = ["-2.5vw", "-7vw", "-0.5vw", "-4.5vw", "-8.5vw", "-3vw"];

/** Shown at ≥3, ≥4 and ≥6 columns respectively. */
const COLUMN_VISIBILITY = [
  "flex",
  "flex",
  "flex",
  "hidden min-[720px]:flex",
  "hidden min-[1100px]:flex",
  "hidden min-[1100px]:flex",
];

export function HeroMosaic() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid h-full w-full grid-cols-3 min-[720px]:grid-cols-4 min-[1100px]:grid-cols-6">
        {Array.from({ length: COLUMNS }, (_, col) => (
          <div
            key={col}
            className={`flex-col ${COLUMN_VISIBILITY[col]}`}
            style={{ marginTop: OFFSETS[col] }}
          >
            {Array.from({ length: PER_COLUMN }, (_, row) => {
              // 7 is coprime with 18, so walking the list this way keeps the
              // same still from landing beside itself in the next column.
              const src = MOSAIC[(col * 7 + row) % MOSAIC.length];
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${col}-${row}`}
                  src={src}
                  alt=""
                  loading={row < 3 ? "eager" : "lazy"}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="aspect-video w-full shrink-0 object-cover"
                />
              );
            })}
          </div>
        ))}
      </div>

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
