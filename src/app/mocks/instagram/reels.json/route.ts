import { REEL_POSTS } from "../fields";

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
  return Response.json(
    REEL_POSTS.map(({ id, embed, thumbAt }) => ({ id, embed, thumbAt })),
  );
}
