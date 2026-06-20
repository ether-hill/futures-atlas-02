# Social Composer Tools

A standalone social-post composer. It opens as a blank canvas — upload images
or videos and build posts. No backend, no content library baked in; everything
renders client-side and exports from the browser.

## Features
- **Post types:** Single, Carousel, Story, Reel, Quote Card.
- **Per-slide controls (each independent):** headline + sub, type size, text
  placement, text alignment, background + text colour, **layout** (full-bleed /
  card / split screen / image-in-circle), background motion, text animation,
  and duration.
- **Background motion:** None, Slow Zoom In/Out, Drift (H/V).
- **Text animation (fixed 2s, ease-in-out):** None, Fade Up, Fade In, Rise,
  Type On, Word Cascade, Type On · Red.
- **Filmstrip** for carousel/reel — add / remove / reorder / edit slides; while
  paused, the preview shows the selected slide in its final state.
- **Uploads:** images and videos (drag-and-drop). Videos animate in the preview
  and render into reels/GIFs.
- **Export:** PNG (still), per-slide ZIP (PNG when static, MP4/WebM clip when a
  slide has motion), one combined sequence video, animated GIF, copy caption,
  and a Batch-create ZIP.
- **Drafts** auto-save to `localStorage`.

## Architecture
| File | Role |
|---|---|
| `src/lib/composer/render.ts` | Canvas render engine — one renderer per frame kind; layouts; motion + text-animation presets. |
| `src/lib/composer/export.ts` | PNG / ZIP (fflate) / GIF (gifenc) / video (MediaRecorder) exporters. |
| `src/lib/composer/source.ts` | `ComposerSource` / `ComposerFrame` types + `emptySource()`. Wire your own builder to pre-stock the library. |
| `src/app/studio-app.tsx` | The studio UI (client). |
| `src/app/page.tsx` | Renders the studio with an empty source. |
| `src/app/api/img/route.ts` | Same-origin image proxy so remote thumbnails don't taint the canvas on export. |

## Develop
```bash
npm install
npm run dev      # http://localhost:1717
npm run build
```

## Pre-stocking the library
`emptySource()` returns a blank `ComposerSource`. To populate the library from
your own content, write a builder that returns a `ComposerSource` with `frames`
(see the `ComposerFrame` union in `source.ts`) and pass it to `<StudioApp source={…} />`.
