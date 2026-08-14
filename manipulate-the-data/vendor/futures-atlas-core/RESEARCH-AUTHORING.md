# Authoring a project's Research page

Every Futures Atlas project ships a Research page rendered by `ResearchTemplate`
from a `ResearchItem[]` data file. Keep all of them consistent by following these
rules. **Never invent entries** — only add resources that genuinely exist and are
relevant. Leave the array empty until you have real material.

## The four content types (`type`)

The page filters by type, in this order:

| `type`       | Filter tab  | What goes here |
|--------------|-------------|----------------|
| `"news"`     | News        | News articles, press coverage, journalism |
| `"research"` | Research    | Papers, reports, studies, peer-reviewed or institutional research |
| `"video"`    | Videos      | YouTube videos — play inline. Put the watch URL in `url` (or set `videoId`) |
| `"resource"` | Resources   | Everything else: tools, datasets, organisations, books, sites |

## Thumbnail priority (`thumbnail` + `thumbnailType`)

Use the best available image, in this order. Record which kind via `thumbnailType`:

1. `"screengrab"` — a screenshot of the actual page/paper/figure (best)
2. `"press"` — an official press / hero image from the source
3. `"logo"` — the organisation's or publication's logo
4. `"commons"` — a relevant Wikimedia Commons photo (always credit)
5. `"unsplash"` — a *very* relevant Unsplash photo (last resort, always credit)

Set `credit` whenever the image isn't your own screengrab. If no thumbnail is
given (or it fails to load), the card falls back to a designed source-plate, so
the grid never breaks. Videos auto-derive a poster from the YouTube id.

## Descriptions

- `summary` — concise: **what the resource is** (1–2 sentences).
- `relation` — optional: **how it relates to this project** (why it's here). Use
  it when the connection isn't obvious from the title.

## Example entry shape

```ts
import type { ResearchItem } from "futures-atlas-core";

export const research: ResearchItem[] = [
  {
    id: "unique-slug",            // also the in-page anchor (#unique-slug)
    type: "research",
    title: "Title of the paper / article / resource",
    source: "Publication or organisation",
    year: "2025",
    summary: "What this is, in a sentence or two.",
    relation: "Why it matters to this project.",   // optional
    url: "https://…",
    thumbnail: "/<project-slug>/research/unique-slug.jpg",
    thumbnailType: "screengrab",
    credit: "Author / Source",                     // when not your own screengrab
    // videoId: "dQw4w9WgXcQ",                      // videos only (else derived from url)
    // featured: true,                              // optional keystone
  },
];
```
