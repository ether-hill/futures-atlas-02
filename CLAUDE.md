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

## Deploy

**This project is git-connected on Vercel and SHARED — push to `main` and Vercel
auto-builds & deploys.** More than one person (mnoesthedens, laubaumau) pushes to
it. Vercel can build the private `futures-atlas-core` dependency itself, so there
is no reason to deploy prebuilt from a local tree.

**Always deploy via git, and only when in sync with origin:**
```sh
./scripts/safe-deploy.sh   # fetches, refuses if behind origin/main, then pushes
```

**Sub-apps build from source on every deploy.** The build command is
`bash scripts/build-subapps.sh && next build` (package.json `build`), so the Vite
apps (`prism`, `quantum-sandbox`) and the Next export (`social-composer`) are
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
