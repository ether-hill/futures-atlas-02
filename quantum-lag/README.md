# Quantum lag

An instrument in the Futures Atlas. A player is shown a claim about quantum technology and places a
marker on a timeline to say when it happens or happened. After the run they are
shown how far off they were, in which direction, and what the record actually is.

The finding it exists to produce: **people put finished work in the future and
unfinished work in the past, and the error is systematic rather than random.**

```
npm install
npm run dev          # http://localhost:3000
npm test             # deck rules + scoring
npm run typecheck
```

Guided run at `/`. Research run at `/study`.

---

## Where things live

```
src/content/
  types.ts        the Claim model (build-spec §3)
  deck.ts         the twenty claims, four acts of five
src/lib/
  axis.ts         1900–2060, linear, zoom, per-claim reveal windows
  scoring.ts      the two comparisons, and the run-level figures
  run.ts          the reducer, and localStorage persistence
  lanes.ts        label packing for the master timeline
src/components/   Axis, Place, Reveal, RevealChart, Story, Results, MasterTimeline, …
  visuals/        the drawn figures, one file per act, plus the registry
src/app/
  theme.css       this project's token values, over futures-atlas-core's names
  globals.css     base chrome, textures, the entrance keyframes
  axis.css chart.css screens.css visuals.css
packages/futures-atlas-core/   vendored kit (tokens.css + kit.css)
```

## Design system

Tokens come from `futures-atlas-core`, vendored under `packages/`. Core owns the
token *names*; `src/app/theme.css` owns this project's *values*. Quantum Lag
runs on a cooler, near-black ground than the rest of the Atlas, so the surface
and ink primitives are re-pointed there. Accent, radius, tracking and the four
font roles come through untouched.

Two consequences worth knowing:

- **Nothing is set in monospace.** Core's kit reaches for `--font-mono` on labels
  and buttons, so that role is re-pointed at Archivo rather than the components
  being edited.
- **No shadows anywhere.** The shadow tokens are nulled; every plane separation
  is a hairline.

Re-skinning is a token change, never a component edit.

## Decisions worth knowing

**The placement axis is fixed at 1900–2060 and never warped.** The design bundle
draws a per-claim window; build-spec §4 argues that biases where people place
things and makes results uninterpretable. Resolution comes from zoom: wheel,
pinch, or the in-view stepper, down to a ten-year window. The reveal chart *does*
use a per-claim window, computed in `revealWindow()`, because the answer is
already committed and cannot be biased.

**The axis is empty on load, in every mode.** A default marker is an anchoring
prompt and every response would drift toward it.

**Two comparisons, never mixed.** Against a date, displacement is `placed −
actual` and within five years counts as correct. Against a range, inside counts
as correct, and a claim with `range: null` is never scored as though a date
existed. See `src/lib/scoring.ts`.

**Cream means you thought it was still coming; blue means you thought it was
already done.** The two error directions are different mistakes about the world
and never share a colour. `directionColour()` is the only place that decides.

**Captions are siblings of the marks they belong to, never children.** `growX`
and `growY` would squash them and the range bracket's clip-path sweep would cut
them off entirely. Anything both offset *and* animated carries its offset on the
`translate` property, because the keyframes own `transform` for the element's
whole life.

**The reveal chart has a fixed vertical stack** (documented at the top of
`chart.css`) so no two captions can meet however close their marks are. On top of
that, "Now" keeps its tick but drops its label when the gap bar runs across it or
a pin lands on it.

**Below 860px the master timeline rotates** to one row per claim rather than
scrolling the drawing sideways. Above it, the drawing measures its container and
fits, because the lane packing works in pixels.

## The story, the figures and the references

A reveal is: the claim, the verdict, the chart that settles the placement, then
**the story**, which is what the reader is actually there for. The story is a
hook, a photograph, and paragraphs with drawn figures sitting where the author
put them. One column at a reading measure.

**The story starts above the fold.** On a 1440x900 viewport the story's rule and
its hook are visible without scrolling, so the reveal reads as a page with an
article on it rather than a chart with something hidden underneath. That is what
the two adaptive chart bands are for: `RevealChart` sets `--above` and `--below`
per claim, reserving the law-note band and the expert-bracket band only when
something actually hangs in them. An empty reserved band was most of the
reason the story sat off screen. Two claims that carry both a legal deadline and
an expert range are about 50px taller and need a 900px viewport rather than 760.

Spacing inside the story uses `--story-gap` and `--story-lead` rather than
`--space-section`: a hook, a photograph and a paragraph are one continuous read,
not separate sections, and section-sized air between them broke that up.

The consequence line lives inside the story, under the hook. It is prose, so it
belongs with the prose rather than sitting between the chart and the read.

### The figures

Twenty one of them, one per marked slot in `deck-final.md`, in
`src/components/visuals/`. They exist because most quantum diagrams fail the
same way: they are too clever, and nobody engages with them. So:

- **One idea per figure.** If it needs a key to read, it is the wrong figure.
- **Read at a glance**, then reward a second look. Nobody is going to study these.
- Drawn from the same vocabulary as everything else: rules, blocks, hairlines,
  circles, Saira numerals. No icons, no illustration.
- Motion is slow, small and endless, or one short arrival. Never a sequence the
  reader has to sit through.
- Colour keeps its meaning: accent for the quantum thing or the future, cream
  for the ordinary thing or the record.

Several are the same shape, some labelled quantities compared, so that is a
component (`Rows`/`Row`) rather than twenty hand-built SVGs. The rest are real
drawings.

Two tests hold the registry honest: every figure a story names must resolve, and
every registered figure must appear in a story. A third forbids raw colour in
any figure file, per futures-atlas-core's rules.

### References

`sources` are `{ text, url? }`. Papers link to a DOI resolved through the
Crossref API and confirmed against the returned title; standards and policy
documents link to the issuing body. **No URL here comes from memory.** Two
candidate DOIs failed that check during the first pass, so they went in the bin
rather than into the deck. A source with no confirmed link renders as plain text.

### Images

`image` is an `Evidence` object carrying `src`, `alt`, `width`, `height`,
`credit`, `licence` and `sourceUrl`. Files live in `public/evidence/`,
downloaded from Wikimedia Commons through its API. The URL, licence and
attribution all come back from that API for the exact file title, so nothing is
constructed by hand. Every image renders its credit and a link to the Commons
file page, so the licence can be checked.

Public-domain and freely-licensed archive material only. build-spec §14 rules
out press photography and journal covers, so the picks are institutional and
museum archive photographs, laboratory documentation and CC-licensed portraits.

**The image keeps its own aspect ratio.** It sizes itself inside a width cap and
a height cap, never cropped and never letterboxed. The set runs from 0.67 to
1.78 in aspect, and an earlier fixed-height band cropped the Kamerlingh Onnes
portrait to a photograph of his collar.

Fifteen of the twenty claims carry a photograph. **Where no apt image exists the
story runs as text at full measure**, because a weak stock image is worse
evidence than none and a prose page reads as a choice where an empty frame reads
as a gap.

## Not built yet

Scoped out of this pass, all named in build-spec:

- **Dutch.** The content files separate prose from dates, ranges and sources, so
  a translator gets prose only. Nobody has written the Dutch yet: the deck is
  long-form and idiomatic, and machine-translating a university's cited claims
  is not a shortcut worth taking.
- **Anonymous capture and the aggregate panel** (`/study` §9). The mode cards do
  not advertise contribution, because it does not exist yet.
- **Open Graph share images** per result (§8).
- **The glossary** and the `{{key|display}}` term markup (§3).
- **Reasoning prompts.** The `prompt` field and its no-year test are in place;
  the deck supplies none, and a prompt that hints at a date is worse than none.

## Content gaps found in the deck

Two build-spec rules the deck as written does not satisfy. Both are recorded as
`todo` tests in `test/deck.test.ts` rather than deleted or quietly relaxed: the
fix is a content decision, not a code change.

1. **Act 4 has no recorded claim before 2010.** Its earliest is 2019, against
   §3's rule that every act mixes in an early finished claim. Act 4 is about the
   present by design, so this may be worth relaxing rather than fixing.
2. **Act 4 runs its recorded claims oldest to newest.** §14: three cards in, the
   player learns the order and the instrument stops measuring anything. Acts 1
   to 3 all break the pattern, so this is one act away from clean.

## House style

All prose in this repository follows `.claude/skills/anti-ai-slop-writing`,
vendored from github.com/jalaalrd/anti-ai-slop-writing. `npm test` runs
`scripts/slop-check.mjs` first, so a banned word or an em dash fails the suite
before any behaviour is checked.

The checker parses the banned lists straight out of the skill's own reference
file, so the two cannot drift apart. It flags vocabulary, banned phrases and
openers, em dashes, exclamation marks in prose, and three or more short
declaratives in a row. A line that has to hold an em dash as a literal, such as
the test asserting the deck contains none, opts out with `// slop-allow`.

What the checker cannot see, and what still needs a person: sentence-length
variety, the rule of three, hedging, and whether a paragraph is really just four
slots with words in them. `test/visuals.test.ts` covers one case of that
automatically, guarding the figure captions against collapsing back into a single
construction, which is what they had done before this pass.

Two things stay out of scope. The deck's prose belongs to its author and carries
its own rules from `deck-final.md`, which the checker reads but nobody else
rewrites. `packages/futures-atlas-core` is a vendored dependency.

## Verifying in a browser

`npm test` covers the deck rules and the scoring. The parts of build-spec's ship
checklist that need a real browser live in `scripts/verify.mjs`: the
keyboard-only run, reduced-motion end states, resume-on-refresh, and the check
that research leaks no answer early.

```sh
npm run dev
PLAYWRIGHT=/path/to/playwright/index.mjs BASE=http://localhost:3000 \
  node scripts/verify.mjs
```

Playwright is deliberately not a dependency; point the script at any install.
