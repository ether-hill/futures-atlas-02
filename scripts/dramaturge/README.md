# Dramaturge — the studio

Short films cut from photographs of the pages of old books. There is no
footage: every shot is a scanned leaf and the only movement is the camera
crossing it. Every caption is a verbatim sentence from the page behind it.

## Where it runs

The studio is at `/admin/dramaturge`, behind the editor sign-in, and it runs
**locally**: `npm run dev`, then open it.

Two of its three steps take minutes. Collecting reads and verifies a hundred
metered leaves; a minute of film is eighteen hundred screenshots. The longest
serverless function in this repo is 120 seconds, so both steps refuse to start
on the deployed site rather than dying halfway with a half-written collection
behind them. What reaches the site is the finished mp4.

## The three steps

1. **Collect.** Search the corpus, add books, or paste a URL. A Source Library
   book, slug or citation link becomes a book to search; any other image URL is
   added as an asset the storyboard may use directly, and it has to answer as
   an image before it is accepted. Say what the film is about. Every page that
   answers is fetched, split into sentences, and any sentence running across a
   leaf edge is completed from the neighbouring leaf or dropped.
2. **Build storyboard.** The agent proposes shots: which leaf, which sentence
   under it, which way the camera moves, how long it holds. Then edit it —
   reorder, retime, change the move, swap the quotation, delete a shot.
3. **Create assets.** The frames are photographed one at a time and encoded.

## The rule the whole thing is built around

**A caption is a verbatim quotation or it is nothing.** The agent never types
one: it cites a sentence by id and the renderer substitutes the wording from
the collection, so what is burned into a frame cannot drift from what the book
says. `validate.ts` byte-compares every caption anyway, before a single frame
is taken, because rendering is the point of no return.

Swapping a caption swaps the picture with it. A quotation shown over a
different leaf than the one it is printed on is a false claim even when the
wording is right, so the two are never edited apart, and the validator refuses
a storyboard where they disagree.

## Why frames are stepped, not recorded

Playwright can record a page, but a recording drops frames when a scan is slow
to paint. Instead the scene is built on one master timeline that starts paused,
and the renderer sets its clock, screenshots, and only then advances. Nothing
depends on wall-clock time, so a slow frame cannot drop and two renders of the
same storyboard produce the same file.

The scene is one self-contained HTML document (`scene.ts`) used by both the
preview and the renderer, so a preview is not an approximation of the output —
it is the output, stopped.

## Gotchas that cost time once

- **No `crossorigin` on the leaf images.** The scans are served without an
  `Access-Control-Allow-Origin` header, so asking for CORS makes the browser
  throw away a good response and every leaf renders empty — while the blurred
  CSS background behind it still shows, which makes it look like a styling bug.
- **`-pix_fmt yuv420p` is not optional.** Without it the file plays on this
  machine and nowhere else.
- **Page reads are metered.** Everything metered goes through the disk cache in
  `data/cache`, so a second collection over the same shelf costs nothing.

## Command line

```sh
npx tsx scripts/dramaturge/smoke.ts     # render proof from already-verified leaves
SHOTS=2 SCALE=0.4 npx tsx scripts/dramaturge/smoke.ts   # fast iteration
```
