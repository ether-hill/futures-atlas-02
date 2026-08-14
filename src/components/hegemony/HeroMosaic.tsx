import { MOSAIC } from "@/data/hegemony";

/**
 * The wall behind the title.
 *
 * It is built from MOSAIC — every video still and every publisher's og:image
 * used further down the page — so the masthead is made of the coverage rather
 * than decorated with a stock picture of a circuit board. Add an item to
 * VIDEOS or PRESS and it turns up here; nothing can appear in the mosaic that
 * the page does not also name and link.
 *
 * Three deliberate choices:
 *
 * • It is `aria-hidden` and decorative. Every one of these pictures is
 *   captioned in full below, so announcing eighteen unlabelled images to a
 *   screen reader would be noise, and giving them alt text here would be
 *   claiming they are content when they are texture.
 *
 * • The tiles are desaturated and sit under a heavy scrim, in rgba rather than
 *   a token — a scrim's job is to darken a photograph by a measured amount,
 *   which is not something a semantic colour can do. Same exception the other
 *   photo heroes on this site take, and the reason it is written down.
 *
 * • The list is repeated to fill the grid. Eighteen tiles do not divide evenly
 *   into every breakpoint's column count, and a mosaic with a hole in the
 *   corner reads as a bug rather than a composition.
 */
export function HeroMosaic() {
  const tiles = [...MOSAIC, ...MOSAIC, ...MOSAIC].slice(0, 48);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid h-full w-full grid-cols-4 min-[720px]:grid-cols-6 min-[1100px]:grid-cols-8">
        {tiles.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading={i < 8 ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="aspect-video w-full object-cover opacity-[0.62] grayscale"
          />
        ))}
      </div>

      {/* The scrim, in two layers.
          Wide: a lighter wash plus a left-to-right fade, leaning on the side
          the title occupies so the headline keeps its contrast while the right
          of the wall still reads as pictures.
          Narrow: no sideways fade — the text runs the full width of a phone,
          so there is no clear side to protect, and the wash carries it alone. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.78)_55%,rgba(0,0,0,0.92)_100%)] min-[720px]:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.66)_55%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_46%,rgba(0,0,0,0)_78%)] min-[720px]:block" />
    </div>
  );
}
