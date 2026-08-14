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

- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — from the Vercel KV / Upstash integration.
- `STYLE_GUIDE_PASSWORD` (required to unlock the panel), `STYLE_GUIDE_USER` (optional, default `admin`).
- `EDITOR_USERS`, `ADMIN_SESSION_SECRET` — editor sign-in (see below). Both
  required; the gated routes 503 until they are set.
- `ADMIN_PASSWORD` — legacy single password, used only if `EDITOR_USERS` is empty.

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
  cookie (12h) plus the readable `fa_editor` flag, then redirects to the
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
- **The AI Hegemony report has two live designs.** `/feed/ai-hegemony` is v1,
  the complete record (every finding, every reject); `/feed/ai-hegemony/v2`
  is a short EDIT of the same `src/data/hegemony.ts` — 8 findings at full size
  (`HEADLINE_IDS`), the timeline sized by event type, coverage six at a time.
  Both carry `VersionSwitch` so they can be compared directly. v2 is `noindex`
  and canonicals to v1. **Every tally on v2 still counts the full set** — a
  short edit that also shrank its own numbers would misrepresent the evidence
  base, which is the exact failure the report is about.

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

**Branch model — work on `staging`, promote to `main`:**
- `staging` → a Vercel **preview** at `https://futures-atlas-02-git-staging-frond-studio.vercel.app` (safe to ship freely; never touches the public site).
- `main` → **production** (`https://futures-atlas-02.vercel.app`).

```sh
# day-to-day: on the staging branch
git checkout staging
git add -A && git commit -m "…"
./scripts/safe-deploy.sh   # pushes the branch you're on; on staging → preview, on main → prod
# happy with the staging preview? put it live:
./scripts/promote.sh       # fast-forwards main to staging → production
```

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
