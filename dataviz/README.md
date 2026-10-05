# Futures Atlas data visual series

Social graphics (Instagram 4:5, carousels, X 16:9) on quantum, AI and futures, built from primary sources. Brief: `~/Downloads/futures-atlas-dataviz-brief.md`. Local only: nothing here is wired into the site build or deployed.

```sh
cd dataviz
npm install                    # d3 only
npm run process                # every data/<slug>/process.mjs -> clean.csv
node serve.mjs                 # http://localhost:8997  (gallery of every piece)
node render.mjs <slug>         # -> output/<slug>/png/*@2x.png + svg/
node render.mjs <slug> --theme dark
node contact.mjs <slug> ig-    # contact sheet for a quick look
```

Rendering uses Playwright from the host repo (`../node_modules`) driving installed Google Chrome.

## Layout

```
templates/   frame.css (tokens copied from futures-atlas-core), frame.js (frame, gallery, log axes), csv.mjs
data/<slug>/ raw/ (untouched sources), process.mjs, clean.csv, METHOD.md
output/<slug>/ index.html (the piece: source of every slide), png/, svg/
copy/<slug>.md  headline, caption, alt text, sources
INDEX.md     status of every piece
fonts/       Archivo variable (OFL)
```

## Rules that live in the template

- Ground, ink and the one blue are core's light primitives, restated in `frame.css` so an export never picks up live `/style-guide` overrides. Change them there if core changes.
- One hue per chart (the brand blue) plus grey for context. Categories that matter are carried by shape, not colour.
- Archivo only, sentence case, no monospace.
- Every frame has the lockup, a source line with access date and data vintage, and futures-atlas.com.
- A number quoted in slide copy is asserted against the data in the page's `load()`, so the render fails if the data moves.
- A piece page is the source of truth for its slides: `?slide=<id>&format=ig|x` renders one frame; no params shows them all.
