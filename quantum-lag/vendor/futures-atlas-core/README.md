# futures-atlas-core

Shared design system + runtime theming kit for the **Futures Atlas** family of
projects. Tokens, layout components, page templates, and a live style-guide
control panel — all driven by semantic CSS custom properties that can be
re-skinned at runtime from a shared store (no file edits, no redeploy).

## What's inside

- `src/tokens.css` — the **defaults**: raw primitives (`--fa-*`) + semantic
  tokens (`--bg`, `--text`, `--accent`, `--container-max`, `--font-heading`,
  type scale, spacing, radii, borders, shadows, motion).
- `src/kit.css` — base styles + component classes (`.fa-*`), referencing tokens.
- `src/tokens.ts` — the editable-token **registry** (drives the panel + override builder).
- `src/runtime.ts` — `buildOverrideCss` / `applyOverrides` / `fetchOverrides`.
- `src/components/*` — `Container`, `Section`, `Page`, `Button`, `Card`,
  `ResearchTemplate`, `ContactTemplate` (data-driven).
- `src/style-guide/StyleGuide.tsx` — the control panel (Webflow-style).
- `src/ThemeProvider.tsx` — optional client hydration of overrides.

## Install (git dependency)

```sh
npm i github:laubaumau/futures-atlas-core
```

```ts
// next.config.ts
const nextConfig = { transpilePackages: ["futures-atlas-core"] };
```

## Wire the runtime theming (consumer)

1. Import `futures-atlas-core/tokens.css` then `futures-atlas-core/kit.css` in your root CSS/layout.
2. Load the four fonts via `next/font` exposing `--font-archivo/-bodoni/-saira/-plex-mono`.
3. In the (async) root layout, read overrides from your store and SSR-inject:
   ```tsx
   import { buildOverrideCss } from "futures-atlas-core";
   const css = buildOverrideCss(await readOverrides());
   // <head> … <style id="fa-overrides" dangerouslySetInnerHTML={{ __html: css }} />
   ```
4. Add `/api/tokens` (GET all, POST `{id,value}` to save, `{id,value:null}` to
   reset one, `{reset:"all"}` to clear) backed by Vercel KV.
5. Mount `<StyleGuide />` at `/style-guide` and protect that route + POST with auth.

See **CLAUDE.md** for the rules (no raw hex/px/font outside `tokens.css`).
