import { REEL_POSTS, SHOTS_POSTS, ODDS_CHOOSER } from "../fields";

/**
 * The reel list, for `scripts/capture-instagram-thumbs.mjs`.
 *
 * The capture script needs each post's embed URL and the moment to grab it at.
 * Serving them from the same module the page renders from is the point: a
 * second hand-kept copy in the script would drift the first time a piece got
 * re-tuned, and the thumbnails would quietly stop matching the posts.
 *
 * Gated with the rest of /mocks by the middleware.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json([
    ...REEL_POSTS.map(({ id, embed, thumbAt, zoom }) => ({
      id,
      embed,
      thumbAt,
      zoom: zoom ?? 1,
    })),
    // A shots post contributes one capture per slide.
    // Only shots that name a route need capturing; one that already has a
    // `src` is an image on disk. ODDS_CHOOSER is the same shape but lives
    // outside SHOTS_POSTS, because it is placed by hand rather than shuffled
    // into the feed — it still has to be captured like the rest.
    ...[...SHOTS_POSTS, ODDS_CHOOSER].flatMap((p) =>
      p.shots
        .filter((s) => s.path)
        .map((s) => ({
          id: s.id,
          embed: s.path!,
          thumbAt: s.at ?? 4,
          hide: s.hide,
          scrollTo: s.scrollTo,
          scrollToText: s.scrollToText,
          hideText: s.hideText,
          el: s.el,
          elIndex: s.elIndex,
          css: s.css,
        })),
    ),
  ]);
}
