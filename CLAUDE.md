# futures-atlas-02

Consumer of **futures-atlas-core** (the shared design system) and host of the
runtime theming store + the `/style-guide` control panel.

## Design system rules (inherited from futures-atlas-core)

- **Defaults live in `futures-atlas-core/src/tokens.css`.** Runtime overrides
  live in the KV store and are SSR-injected as `<style id="fa-overrides">` by the
  root layout on every request.
- **Never hardcode a hex / oklch colour, a px design value, or a font-family in a
  component.** Reference a semantic token: a `--c-*` / Tailwind token (which now
  resolve to core's `--bg`/`--text`/`--accent`/…) or a core `fa-*` class.
  Re-skin via tokens (defaults in core, or live via `/style-guide`) — not by
  editing components.
- The app's `src/app/globals.css` now only *maps* its Tailwind tokens onto core's
  semantic tokens; it contains **no literal colour values**.

### There are FOUR copies of core, and they have drifted

`packages/futures-atlas-core` is the host's. `hollow-villages/`,
`manipulate-the-data/` and `quantum-lag/` each carry their own
`vendor/futures-atlas-core`. The three vendored copies share one `tokens.css`
and the host's is different: the host moved to cool near-black neutrals
(`--fa-ink: #17181b`) and added `--brand`, while the vendored copies kept the
warm ones (`#211e18`). `index.ts` has diverged in BOTH directions (the host
exports `FaLogoMark`, the vendored copies export `VideoEmbed`/`youTubeId`).

So "one set of tokens drives everything" is **not true today** — do not write it
in new copy. Unifying them is a real change with visual consequences for three
live sub-apps, so it is a deliberate piece of work, not a tidy-up: resync the
three onto the host's copy and re-check each app's palette, or keep one copy and
give each app a token overlay (which is what Quantum Lag already does).

A sub-app's `file:` dependency must point at ITS OWN vendored copy. Quantum Lag
pointed at `file:./packages/futures-atlas-core`, a path that does not exist
inside `quantum-lag/`, and failed a clean build on
`Can't resolve 'futures-atlas-core/tokens.css'` — which fails the whole deploy.

### Greppable enforcement (should be empty outside globals/tokens)
```sh
# theme colour literals in app components
grep -rnE '#[0-9a-fA-F]{3,8}\b|oklch\(' src/components src/app --include='*.tsx'
```
(The hero scrims use rgba(0,0,0,…) over a photo — documented texture, not a token.)

## Migration status (phased — do not big-bang refactor)

- Colours + fonts already flow through core tokens (existing utilities resolve to
  them and reflect live overrides).
- Type-size / spacing utilities in the app's own pages are still Tailwind
  arbitrary values; migrate them onto core tokens **only when explicitly asked**.
- New work should use `futures-atlas-core` components/templates and tokens.

## Runtime theming wiring

- `src/lib/store.ts` — Vercel KV (Upstash) read/write; degrades gracefully if KV
  env is absent.
- `src/app/api/tokens/route.ts` — GET (public) / POST (save·reset, protected).
- `src/middleware.ts` — Basic auth on `/style-guide` + POST `/api/tokens`,
  **fail-closed** if `STYLE_GUIDE_PASSWORD` is unset.
- `src/app/layout.tsx` — `force-dynamic`; SSR-injects the override stylesheet.

## Required environment variables (set on the Frond Studio Vercel project)

- `REDIS_URL` — the KV store's connection string (ioredis). **This is what the
  project actually provisions**, on all three environments. `src/lib/store.ts`
  also accepts `KV_REST_API_URL` + `KV_REST_API_TOKEN` (`@upstash/redis`) as an
  alternative, but those are not set on this project; it degrades gracefully if
  neither is present.
- `STYLE_GUIDE_PASSWORD` (required to unlock the panel), `STYLE_GUIDE_USER` (optional, default `admin`).
- `EDITOR_USERS`, `ADMIN_SESSION_SECRET` — editor sign-in (see below). Both
  required; the gated routes 503 until they are set.
- `ADMIN_PASSWORD` — legacy single password, used only if `EDITOR_USERS` is empty.

**Setting up a new machine.** `vercel link` (scope `frond-studio`, project
`futures-atlas-02`) then `vercel env pull .env.local`. That pulls the
**Development** environment only, which has `REDIS_URL`, `EDITOR_USERS`,
`ADMIN_SESSION_SECRET`, `ELEVENLABS_API_KEY`, `MAKEMODE_API_KEY` — enough for
editor sign-in and draft visibility. `STYLE_GUIDE_PASSWORD` exists only in
Preview + Production, so **`/style-guide` returns 503 locally by design**; use
`vercel env pull --environment=preview` if you actually need it.

**Two dev servers on one checkout will break each other.** They share `.next`,
and each compiler prunes the other's output, so a request lands on a route whose
`page.js` the other process just deleted:

```
⨯ Error: ENOENT: no such file or directory, open
  '…/.next/server/app/(atlas)/<route>/page.js'
```

It shows up as an intermittent 404 or 500 that clears on reload and comes
straight back, and it looks like a bug in the page. It is not. Running
`next build` while a dev server is up does the same thing (`Cannot find module
'./NNNN.js'`), because the build rewrites the same directory.

Give the second one its own tree: `NEXT_DIST_DIR=.next-b PORT=3xxx npm run dev`
(`distDir` in `next.config.ts` reads it; `/.next-*/` is gitignored). Same for a
build you need to run while someone is developing. This matters here because
more than one person, and more than one agent session, works in this repo.

npm 11 blocks install scripts by default: `sharp` and `ffmpeg-static` (the
composer's MP4 export) need theirs, hence the `allowScripts` block in
`package.json`.

A local `npm run build` rewrites the three sub-app lockfiles
(`hollow-villages`, `manipulate-the-data`, `quantum-lag`), stripping the
`packages/futures-atlas-core: extraneous` entries recorded in `2d07444`.
**Revert that churn rather than committing it.**

## Editors, drafts, and the internal area

**Publication state is one word per project.** `visibility: "live" | "draft"` in
`src/data/projects.ts` is the single source of truth: it drives the homepage
strip, `/projects`, the `ProjectSiteNav` switcher, the contact dropdown,
`robots.ts`, and the middleware gate on the project's own URL. To publish or
unpublish, change that word and deploy — nothing else.

- **Live** — public.
- **Draft** — listed only for a signed-in editor (flagged `DRAFT` on the card),
  and the URL itself is closed: an anonymous visitor to `/village-oracle` gets
  the sign-in form, never the page's markup.
- The nav bundle `public/atlas-nav.js` keeps its own `draft: true` flags (it is
  plain JS shared with the static zone bundles, so it can't import the data
  file). **Mirror it when you flip a project.** It decides what to list from the
  readable `fa_editor` cookie, which carries no authority — every draft URL is
  still checked against the signed cookie server-side.

**Sign-in.** Two accounts, no username field: the password identifies the person.

- `EDITOR_USERS="laura:<pw>,mike:<pw>"` (optionally `id:pw:Display Name`).
  `src/lib/editors.ts` parses it; `ADMIN_PASSWORD` is the single-account fallback.
- Gated: `/admin/*`, `/editor`, `/home-lab`, `/mocks`, and every draft project
  path. All `noindex` + `Disallow`ed in `src/app/robots.ts`.
- `src/middleware.ts` — rewrites (not redirects) unauthenticated requests to
  `/admin/login`, so no gated page renders or ships markup before auth.
  Fail-closed if the env vars are unset.
- `src/lib/admin-session.ts` — HMAC-SHA256 cookie sign/verify via Web Crypto, so
  the same helpers run in Edge middleware and the Node route handler. The cookie
  is `<expiry>.<editorId>.<sig>` — the id is authenticated, not just the expiry.
  Also holds `safeNext()`, which normalises the `?next=` param and keeps it
  same-origin (guards the open redirect).
- `src/lib/editor.ts` — `getEditor()` for server components: who is looking, so a
  listing can include drafts. Never the authority on URL access; that's the
  middleware.
- `src/app/api/admin/login/route.ts` — Node runtime; `crypto.timingSafeEqual`
  against every configured account, sets the httpOnly · secure · sameSite=lax
  cookie (7 days) plus the readable `fa_editor` flag, then redirects to the
  validated `next`. `…/logout/route.ts` clears both (POST only).
- `src/components/EditorBar.tsx` — the "you are not seeing the public site" bar;
  renders nothing for the public. `/editor` is the full live-vs-draft overview.

## The Feed (`/feed`) — the reading log

The Atlas's news-and-articles section. Every post is commentary **on someone
else's work** and always shows the canonical `url`; it never stands in for the
source.

**There is no blog.** `/blog` and `/feed` were two views of the same posts while
we decided between them; the feed won and the blog was deleted. Posts live at
`/feed/<slug>`, cover art in `public/feed/`, and two permanent redirects in
`next.config.ts` are all that survives, for links already published. Don't
reintroduce a second listing of these posts.

- `src/data/posts.ts` — the single source of truth, same shape of contract as
  `projects.ts`. `visibility: "live" | "draft"` publishes or unpublishes one
  post; `featured: true` lifts it to the index's lead slot. `topics` is a
  **closed** vocabulary (`PostTopic`) because it drives the filter chips — add a
  new one there, not ad hoc. `posted` orders the index; `published` is the
  source's own date and may be `YYYY` or `YYYY-MM` for older work.
- Draft posts are gated exactly like draft projects: `isDraftPostPath()` in
  `src/middleware.ts`, `draftPostPaths` in `robots.ts`, and
  `generateStaticParams` prerenders **live posts only**, so an unpublished
  post never exists as HTML in the build output.
- `body` is markdown, rendered by `src/lib/markdown.ts` (`marked`) and styled by
  the `.fa-prose` block in `globals.css`. Bodies are authored in this repo, so
  the HTML is trusted and unsanitised — **if a body ever comes from outside this
  repo, sanitise in `markdown.ts` first.**
- `/feed` is a full-width bento grid of mixed cards — posts, video, reader
  polls, a playable taster — with sticky rails either side. A post page
  (`/feed/<slug>`) puts the prose left and a sticky source/"why it matters" rail
  right at ≥1100px, with a "More posts" carousel at the foot.
- The feed deliberately carries **no like/repost/view counts**: those numbers
  don't exist for this site and inventing them would be inventing data. Poll
  bars are the one exception and they are a real tally, or they say they aren't
  being recorded.
- **One card design.** The feed's card is the card — Magnifica's sources rail
  mirrors it deliberately. Restyle both together; don't fork a second one.
- **Images, in priority order.** `sourceImage` — the publisher's own og:image or
  the video's thumbnail, *hot-linked*, never copied into the repo — then our own
  `image` cover art in `public/feed/`, then the hatched plate. `PostImage`
  (client) does the demotion on `onError`, so a pulled or hot-link-blocked
  source image silently falls back to the illustration.
  Only set `sourceImage` when the image says something about *that* piece:
  generic site logos and default share cards are deliberately excluded (the same
  arXiv logo on seven cards is worse than no image at all).
  `scratchpad/harvest.py` in the session notes shows how they were collected.
- Nav entries live in `public/atlas-nav.js` (`LINKS`), and the homepage carousel
  shows the newest ten.
- **Prototype posts** (`src/data/prototypes.ts`, `/feed/prototype/<slug>`) are a
  third non-Post content type: one COMPONENT of a bigger idea, shown as a
  concept moodboard before it exists. Three rules — it states that it is not
  built (`state`, on the card and at the top of the page); where it is a version
  of someone else's idea, `lineage` names it, links it and says what differs;
  and any figure on a board comes from a published Atlas report and says which,
  with the MAPPING of that figure onto a pitch or a colour labelled as a design
  decision rather than a measurement. Cards are one column and carry no picture:
  there is nothing to photograph, and a render would make it look further along
  than it is.
- **The bench card** (`src/data/workbench.ts` + `components/feed/BenchCard.tsx`)
  shows work in progress from the inside — one specimen at a time, drawn. Rules:
  every specimen is real and locatable (`at` names a file, a doc or a day, and
  nothing is written for the card); `rejected` means actually built or proposed
  and then taken out, with the real reason; `open` means still open, not a
  teaser for something finished. It is the one feed card with no picture, on
  purpose. Its opening face is seeded from a SERVER-computed `seed` prop —
  `Math.random()` at mount would mismatch on hydration.
### Reports (`/feed/<slug>`, not posts)

The Atlas's own long-form reports. **A report is data + a page**, never a
one-off: `src/data/report-types.ts` holds the evidence contract and
`src/data/ecology-types.ts` the industry layer, both shared. Generic components
live in `src/components/report/` (CardRail, FigureChart, FindingCard,
FindingCarousel, FeedbackTimeline, VideoCard, PressCard, EcologyDashboard,
Section); `src/components/hegemony/` keeps only what is about that one report.

Three live: `ai-hegemony` (+ its v2 edit), `ai-kill-chain`, `startup-cities`.
`src/data/reports.ts` is the registry the feed's cards render from — add a
report there or it will not appear.

**The rules are the point, and they are enforced in the types:**
- Every `Finding` carries a `figure` AND a `scope`, and the page renders them
  together. `scope` is never empty. If you cannot write it, you do not have the
  finding.
- A `chart` is a re-presentation of `figure`, never an addition to it: every
  value must already be stated in that finding's claim or detail. A single
  share is one mark against an empty track — never two summing to 100, because
  the remainder was not measured. Where the absence of a number IS the finding,
  there is no chart.
- `ChartKind` is chosen by what the data IS: `ring` for a share, `dots` (log
  axis, labelled) for orders of magnitude, `slope` for before/after, `waffle`
  for an exact n-of-N, `multiple` for a multiplier, `count` for a figure with no
  denominator, `bars` otherwise.
- The ecology nebula weights an organisation by how often its name appears in
  **that report's own findings and timeline** — never by valuation, funding or
  size. Leadership entries carry `asOf` and their own source, because it moves.
- `DROPPED` is published, not kept in a drawer. "We checked this and it did not
  hold up" is a finding.
- **Every card carries a mark.** `FindingCard` has three states and they are not
  interchangeable: a `chart`; or, with no chart, the `figure` set typographically
  (for headlines that do not decompose into drawable quantities); or a plain "no
  figure" plate (for genuinely qualitative findings). The mark sits at the TOP of
  the card, above the claim; scope and source are the expandable at the bottom.
- **Every report harvests its own media.** VIDEOS and PRESS are not optional
  garnish: `MOSAIC` is derived from them and becomes the masthead wall and the
  feed card's wall, so the hero is made of the coverage the page credits. Read
  YouTube id, channel, title and upload date off the watch page; confirm each
  `thumb` returns 200 (maxresdefault is missing for plenty of uploads); fetch
  each article's own `og:image` and confirm it resolves. Anything unreachable is
  `null` and renders typographically — a guessed URL is a broken image and a
  false claim at once.

- **The AI Hegemony report has two live designs.** `/feed/ai-hegemony` is v1,
  the complete record (every finding, every reject); `/feed/ai-hegemony/v2`
  is a short EDIT of the same `src/data/hegemony.ts` — 8 findings at full size
  (`HEADLINE_IDS`), the timeline sized by event type, coverage six at a time.
  Both carry `VersionSwitch` so they can be compared directly. v2 is `noindex`
  and canonicals to v1. **Every tally on v2 still counts the full set** — a
  short edit that also shrank its own numbers would misrepresent the evidence
  base, which is the exact failure the report is about.

## Horizon Scan (`/horizon-scan`) — the standing search

A draft project, and the only page on the site with **no editor**: it fetches
open-access papers from OpenAlex and arXiv, filters them with a published rule
set, and prints on each card which rules fired and on which words. The rules are
the curation, so they are rendered on the page under "The rules". If a paper you
expect is missing, widen a topic in `src/data/horizon-scan.ts`; never hand-add a
record, there is nowhere to put one.

- `src/data/horizon-scan.ts` is the whole editable surface: 9 `CLUSTERS`
  (subjects), 40 `TOPICS`, the `QUERY_GROUPS` that decide which topics share a
  call, the two blocklists, and the window/cache/cap constants. Each topic has
  `probes` (what we ASK the indexes, wide) and `terms` (what we ACCEPT, narrow).
  A record is kept if its own text contains an accept term, whichever query
  found it, which is how a quantum paper picks up a power tag.
- **`terms` are matched as lowercased substrings, and short ones are traps.**
  Three that shipped and had to come out: `asic` matched every paper containing
  "basic", `siting` matched "visiting", and `sport` in the venue blocklist was
  throwing out every transport journal. Say a term inside a longer word before
  adding it.
- **Two bars, and they are what keep the page short.** (1) A topic counts as
  *solid* only when its words are in the title or turn up more than once; a
  record is held only if it has one solid topic or two mentioned ones
  (`MIN_SOLID_TOPICS` / `MIN_WEAK_TOPICS`). That drops roughly a third of what
  matches, all of it papers that used a phrase once in a methods section.
  (2) Convergence counts solid subjects only. Without the second, the top of the
  page was semiconductor papers that said "quantum computing" once in an opening
  sentence. On a card, solid topics are marked and mentions are dimmed.
- **Authority is a nudge, not a verdict** (`lib/horizon-scan/authority.ts`).
  Three figures per paper: the journal's 2-year mean citedness, the higher
  h-index of the first and last author, and the best-cited institution on the
  byline, rolled into 0-1 and worth `AUTHORITY_WEIGHT` (4) against freshness's 6
  and crossover's 5. All three are citation counts in costume, so they are
  printed on the entry rather than folded into a hidden number, missing figures
  count as neutral rather than zero (arXiv carries none of these ids at all and
  must not be pushed down for it), and there is a caveat panel on the page
  saying what they do and do not measure. **The lookups are filters by id, which
  OpenAlex charges 1 credit for rather than 10**, so the whole pass is single
  figures a day and can cover every held paper.
- **Retrieval is cached to disk in development**
  (`node_modules/.cache/horizon-scan-raw.json`, `readDevRaw` in collect.ts).
  Editing rules, scoring or layout then costs nothing and takes no time; delete
  the file for a fresh pull. Production never reads it.
  **Never put a runtime-written file under `.next`.** The first version of this
  wrote to `.next/cache/` and broke the dev server: `next dev` watches its own
  output directory, so a mid-request write triggered a recompile that deleted
  `.next/server/app/(atlas)/horizon-scan/page.js` out from under the following
  request. The symptom is an intermittent 404, then a 500 with
  `ENOENT … page.js`, then normal service until the next write.
- **Every upstream call is on a timeout and the serial arXiv loop is on a
  deadline** (`REQUEST_TIMEOUT_MS`, `LANE_BUDGET_MS`). A cold run is ~8s
  healthy and is bounded at ~42s with every upstream refusing, which has to stay
  inside the page's `maxDuration`. A 429 from OpenAlex is only retried when
  credits remain: when the daily allowance is spent, waiting out `Retry-After`
  on 22 queries turned an 8-second render into 66. arXiv wants 3s between
  requests and starts refusing if crowded.
- **A third rule reads for a finding vs a framework** (`SPARK` in the data file,
  `lib/horizon-scan/interest.ts`). Keywords cannot tell a result from a scaffold
  and academia produces far more scaffolds, so wording decides: *we find*, *for
  the first time*, *contrary to* count for; *towards a*, *conceptual framework*,
  *systematic review* count against, and **double in a title, because a title is
  a promise**. Worth `SPARK_WEIGHT` (6), same as freshness. It never removes
  anything, the phrases that fired are printed under each entry, and **Boldest**
  sorts by it.
- **Every entry carries the paper's own strongest sentence**, pulled from its
  abstract by `keySentence()`. Extracted, never written: a generated summary
  would be the one thing on the page nobody can check against the source. A
  claim marker alone is not enough to pick a sentence — "Here we propose a
  unified framework…" scores for *here we* and is exactly the sentence not to
  quote — so dull markers cancel it out.
- **No subject may take the page.** `MAX_PER_SUBJECT` (16 of 100) and
  `DIGEST_PER_SUBJECT` (2 of 10). Quantum has the most distinctive vocabulary of
  the nine, matches hardest, and was taking a third of the list on its own.
  Over-cap papers are pushed behind the rest, never dropped, and the count is in
  the ledger.
- **The header says what the page is and nothing about the run.** One line: "Top
  N relevant open research articles". All the accounting (retrieved, binned,
  capped, last run) lives at the foot with the rules, because it is accounting
  and it does not belong above the thing it accounts for.
- **The grid is the projects grid.** Gapped `.fa-card`s, `sm:2 lg:3`, each with
  a 3:2 plate on top and a body under it, same as `ProjectCard`. The plate is a
  figure from the paper where there is one and the hatched ground with the
  entry's number ghosted into it where there is not — exactly what a project
  card does without a screenshot. Do not introduce a second card treatment.
- **One grid, one order.** Controls sit ABOVE the board and govern both it and
  the list, so "Start here" is the top of whatever you are looking at rather
  than a fixed ten that ignores the chips beside it (the per-subject cap is
  dropped when a subject filter is on, or the cap would be fighting the
  request). The board and the grid below it are the same `Board` container — a
  hairline grid, cells on a ruled ground — because two grid treatments on one
  page reads as two pages. Grid is the default view; list is the alternative.
  The ten never repeat in the list below.
- **The page is a digest, not an archive.** `MAX_HELD` = 100 rendered, ranked;
  `TOP_PICKS` = 10 on the board at the top, each with authors, venue and that
  key sentence, ignoring the filters on purpose so it stays the same ten. Two
  views: list (default, the reading layout, borrowed from myxo's research list
  with the thumbnail rail replaced by metadata) and grid. Five orders: best
  match, newest, crossover, boldest, standing, most cited.
- **The ten at the top carry a figure from the paper** (`lib/horizon-scan/figures.ts`).
  arXiv renders recent submissions to HTML at `arxiv.org/html/<id>` with the
  paper's own images beside it; the first one is **hot-linked, never copied**,
  same rule the feed follows for a publisher's artwork, and the entry silently
  loses its picture if arXiv stops serving it. arXiv only, top ten only, on a
  12s deadline: journal figures sit behind publisher HTML with no shape in
  common, and rasterising a PDF's first page inside a serverless function to get
  a picture of a title page is not worth it. Figures sit on a **light plate in
  both themes** and use `object-contain` — they are drawn for white paper, and
  cropping one loses the part that carried the point.
- **No jargon on an entry.** The line reads `arXiv · 26 Aug 2026 · not peer
  reviewed`, not `arXiv cs.AI · preprint`: the category code only repeated the
  subject chips beside it, and "preprint" hides the one fact a reader needs.
  arXiv metadata carries `journal_ref` when a preprint has since been published,
  so those entries show the real journal and say *via arXiv*. `reviewed` on
  RawRecord drives it. A rules panel explains both in plain English.
- **There is no "convergent" badge.** A crossover paper shows two subject chips
  filled in, which is the fact itself; the word on top was a label on a label.
  The idea still drives the ranking, the Crossover sort and the Convergent
  filter.
- **arXiv text is LaTeX** and arrives that way (`detex()` in arxiv.ts), or a card
  reads `two hybrid III--V/Si$_3$N_4$ integrated lasers`.
- In development the finished run is memoised for two seconds only
  (`DEV_MEMO_MS`): long enough that one render's passes share a scan, short
  enough that editing a rule shows up on reload. Caching it for a day meant
  edits changed nothing until a restart; not caching meant the two passes ran
  separate scans, disagreed on `ranAt`, and tripped a hydration mismatch.
- **The scan does NOT use the framework's fetch cache, and must not be moved
  back onto it.** This app's root layout is `force-dynamic` (it reads the KV
  token overrides per request), and under Next 15 that defaults every fetch
  beneath it to no-store even when the fetch sets its own `next: { revalidate }`
  — `fetchCache = "default-cache"` on the segment does not win it back. Measured
  on a production build, the page was firing all 22 OpenAlex calls on EVERY view:
  35 seconds a render and 220 credits a view against a 1000-a-day allowance, so
  two visitors would have taken the day. `lib/horizon-scan/cache.ts` caches the
  whole run instead, in the project's own KV (`fa:cache`, shared across
  instances) plus a module memo, with single-flight. Cold 8s, warm 20ms.
  **If you add another page that fans out to an API, it has the same problem.**
- **`OPENALEX_API_KEY` is set and the page depends on it.** The keyless budget
  is $0.10/day (1000 credits; one run is ~230) and it is **not ours alone** —
  Vercel's egress IP is shared with other customers and openalex.org's own site
  draws on the same pool, so the allowance can be gone before this page asks for
  anything. A free OpenAlex account (no payment method) gives a key with 10× the
  budget, tied to the account rather than the IP. `openAlexHeaders()` picks it up
  from the env; unset, the page falls back to keyless and comes back mostly
  empty. **It is in `.env.local` locally and must be added to the Vercel project
  before this deploys.** A full run costs ~230 of 10,000. Nothing else on this
  page costs money: arXiv is unmetered and there is no model call anywhere.
- **A 429 does not carry `x-ratelimit-remaining`.** The guard that skips the
  retry when the daily allowance is spent read `Number(null)` as 0, so every
  momentary burst limit was treated as an exhausted budget and dropped — before
  the logging, so seventeen of twenty-two queries vanished each run with no
  error anywhere and it looked like OpenAlex refusing. Read that header as
  absent, not as zero. Fixing it took retrieval from 200 records to 1,107.
- **OpenAlex meters credits, not requests**: 1000 a day keyless, a flat 10 per
  search whatever `per_page` is. So queries are the cost and rows are free,
  hence 20 grouped calls of 50 rows plus 2 for the TU Delft ROR lane, cached 24
  hours (`REVALIDATE_SECONDS`). Concurrency is therefore free too, which is why
  the pool is 8. Going over returns 429; `run()` retries once on `Retry-After`.
  Do not add per-topic queries back without redoing that sum.
- `primary_location.source.is_core:true` is what makes the journal lane usable.
  Without it a date-sorted query is mostly Zenodo self-deposits and pay-to-
  publish titles, because those get date-stamped fastest. It also excludes
  arXiv, which is why arXiv gets its own pass (`lib/horizon-scan/arxiv.ts`,
  regex-parsed Atom, no XML dependency) and those cards say `preprint`.
- `to_publication_date` is pinned to today. Journals stamp issues months ahead,
  so without it the feed opens with papers "published" next December.
- A failed run renders as a stated failure and a partial run says how many
  queries did not answer. **There is no stored copy of a previous run**, and
  there should not be: a page that says it re-ran twelve hours ago must not be
  showing last week.

## Hypothetica Magnifica (`/magnifica`)

Renamed from "Magnifica" (display title only — the slug, URLs and build paths
stay `/magnifica`, since the name still contains it and the project is live).

- The overview (`homeView` in `magnifica/src/app.ts`) runs banner → voices grid
  (4-up) → the real document → research, method & sources. The slide-out index
  belongs to the **voice pages only**: the overview *is* the contents page, so
  `render()` mounts the drawer for a leader route and unmounts it otherwise.
- **`magnifica/src/portraits.ts` is the licence registry, and its rules are hard.**
  ASSETS.md forbids generated likenesses of real people — the project's own
  content documents leaders objecting to deepfakes of themselves. Every portrait
  is a real Wikimedia photograph under a free licence, cropped to one 4:5 frame
  so the grid reads as a set, and **`credit` + `licence` are rendered on screen**.
  Removing a caption is a licence breach, not a design tidy-up.
  The house look comes from a CSS greyscale treatment, not from generation.
- The hero (`media/stills/creation-hands.jpg`) IS generated — it is a variation
  on Michelangelo's public-domain *Creation of Adam*, no living person involved.
  The right hand has seven fingers on purpose; the caption says so.
- **Parallax lives in `magnifica/src/parallax.ts` and nowhere else** — the
  overview hero and the voice pages share it. Travel is **bounded**: `±120 ×
  rate` px across a section's whole pass through the viewport, never scaled to
  the section's height. That bound is the smoothness: an earlier version moved
  full-height plates ~400px, so a single dropped frame was a visible ~9px jump.
  Depth comes from `data-par-scale` (a slow push-in), not from distance. The
  dial for the experience view is `PAR` at the top of `experience.ts`.
  Two rules follow: the scrim is a **sibling** of the plate (`.x-scrim`), never
  a child, or it repaints with every frame of the motion; and nothing fixed and
  permanently on screen may carry `backdrop-filter`, because it re-blurs its
  backdrop on every frame of every scroll. Open-only panels may.
- `SOURCES` in `magnifica/src/encyclical.ts` carries the source rail: every URL
  fetched and checked, `image` hot-linked from the publisher's own og:image or
  video thumbnail. Three publish none and render as typographic cards.

## Deploy

**This project is git-connected on Vercel and SHARED — push to `main` and Vercel
auto-builds & deploys.** More than one person (mnoesthedens, laubaumau) pushes to
it. Vercel can build the private `futures-atlas-core` dependency itself, so there
is no reason to deploy prebuilt from a local tree.

**Branch model — personal branch → `staging` → `main`:**
- **`mike` / `laura`** — each person's persistent working branch, with their own
  Vercel preview (`https://futures-atlas-02-git-<branch>-frond-studio.vercel.app`).
  Only your pushes touch your preview, so nobody competes for a URL. Sync
  `origin/staging` into your branch at the start of a session.
- `staging` → the shared **integration** preview at `https://futures-atlas-staging.vercel.app` (a project domain bound to the branch; the auto-minted `futures-atlas-02-git-staging-frond-studio.vercel.app` alias 308-redirects there via `next.config.ts`) — merge your branch in when a piece is ready to be seen together; don't work on it directly.
- `main` → **production** (`https://futures-atlas-02.vercel.app`).

```sh
# day-to-day: on your personal branch (mike / laura)
git checkout mike
git fetch && git merge origin/staging   # sync down first
git add -A && git commit -m "…"
./scripts/safe-deploy.sh   # pushes the branch you're on → your own preview
# piece ready for the shared preview?
git checkout staging && git pull --ff-only && git merge mike && git push
# happy with the staging preview? put it live:
./scripts/promote.sh       # fast-forwards main to staging → production
```

A half-finished project merged to `staging` is usually harmless — drafts are
gated by `visibility` — but if one project must ship while another on your
branch must not, split the unfinished one onto its own feature branch.

`safe-deploy.sh` is branch-aware and **refuses if you're behind origin** (so you can't overwrite a teammate). `promote.sh` only runs from `staging`. Both push via git — **never `vercel deploy --prebuilt`.**

**Sub-apps build from source on every deploy.** The build command is
`bash scripts/build-subapps.sh && next build` (package.json `build`), so the Vite
apps (`generatives`, `quantum-sandbox`) and the Next export (`social-composer`) are
rebuilt from their in-repo source into `public/` by Vercel — their bundles are
**git-ignored, never committed** (so two people can't clobber each other's
bundle). Just edit the source, commit, and deploy; no manual `sync-*.sh` step.
(For a local preview of a sub-app, run `npm run build:subapps`.) The three zone
bundles — `hollow-villages`, `underground-intelligence`, `odds-of-surviving-ai` —
stay committed under `public/<slug>/` because their source lives outside this
repo; rebuild those with their `sync-*.sh` (needs the sibling source).

**NEVER run `vercel deploy --prebuilt --prod` for this project.** A prebuilt CLI
deploy from a local tree that is behind `origin/main` overwrites production with a
stale snapshot and wipes teammates' work. (This happened once: a deploy from a
tree 34 commits behind wiped three projects mnoesthedens had added. Recovered by
`vercel promote`-ing the last good deployment.) Before any work, run
`git fetch && git status` and make sure you are not behind `origin/main`.
