import { MOSAIC } from "@/data/hegemony";

/**
 * The tile wall, on its own.
 *
 * Built from MOSAIC — every video still and every publisher's og:image used on
 * the report — so anywhere this appears, the surface is made of the coverage
 * rather than decorated with a stock picture of a circuit board. Add an item to
 * VIDEOS or PRESS and it turns up here; nothing can appear in the wall that the
 * report does not also name and link.
 *
 * The wall is meant to be READ, not felt. Every thumbnail carries type — a
 * chyron, a masthead, a cover — and that type is the point: you should be able
 * to see it is nine broadcasts and nine articles before you scroll to them. So
 * the tiles keep their colour and their brightness, and the darkening is left
 * to whoever mounts the wall, because the hero and the feed card need very
 * different amounts of it. A first pass greyed the tiles out under a heavy
 * full-width scrim and the wall stopped saying anything at all.
 *
 * It is `aria-hidden`: all eighteen are captioned in full on the report, so
 * announcing them again would be noise, and alt text here would be claiming
 * they are content when they are texture.
 *
 * Columns are offset against each other so the seams do not line up into
 * readable rows. An aligned grid of sixteen-by-nines reads as a contact sheet;
 * staggered, it reads as a wall.
 */

/** Six stacks; the last three drop away as the viewport narrows. */
const COLUMNS = 6;

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

export function MosaicWall({
  /** Tiles per stack. Enough to overflow whatever box is clipping the wall. */
  perColumn = 10,
  /** Tiles above this index load lazily; the rest are eager. */
  eagerRows = 3,
}: {
  perColumn?: number;
  eagerRows?: number;
}) {
  return (
    <div className="grid h-full w-full grid-cols-3 min-[720px]:grid-cols-4 min-[1100px]:grid-cols-6">
      {Array.from({ length: COLUMNS }, (_, col) => (
        <div
          key={col}
          className={`flex-col ${COLUMN_VISIBILITY[col]}`}
          style={{ marginTop: OFFSETS[col] }}
        >
          {Array.from({ length: perColumn }, (_, row) => {
            // 7 is coprime with 18, so walking the list this way keeps the same
            // still from landing beside itself in the next column.
            const src = MOSAIC[(col * 7 + row) % MOSAIC.length];
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${col}-${row}`}
                src={src}
                alt=""
                loading={row < eagerRows ? "eager" : "lazy"}
                decoding="async"
                referrerPolicy="no-referrer"
                className="aspect-video w-full shrink-0 object-cover"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
