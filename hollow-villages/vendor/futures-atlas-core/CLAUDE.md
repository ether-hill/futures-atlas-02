# futures-atlas-core — rules of the kit

The shared design system + runtime theming layer for the Futures Atlas family
(futures-atlas-02, the Oracle, future projects). **Pure kit — no project content.**

## The model

- **Defaults live in `src/tokens.css`.** Two layers: raw primitives `--fa-*`
  (the ONLY place literal hex / oklch / px / font-family values may appear) and
  semantic tokens (`--bg`, `--text`, `--accent`, `--container-max`,
  `--font-heading`, `--text-display-l`, `--space-section`, …) that reference them.
- **Runtime overrides live in the store** (Vercel KV in the consuming app), keyed
  by token id. On every page load the app injects a `<style id="fa-overrides">`
  built by `buildOverrideCss()` AFTER `tokens.css`, re-setting the semantic vars.
  The live site always reflects the saved values.
- **The Style Guide (`/style-guide` in the consumer) is the control panel.** It
  is the canonical way to re-skin: edit a token → live preview → persisted for
  everyone. Registry of editable tokens: `src/tokens.ts`.

## Hard rules

1. **Components reference ONLY semantic tokens** for every design value — colour,
   font-family, type size, line-height, spacing, radius, border, shadow. Use
   `var(--token)` (inline style) or a `fa-*` class from `kit.css`.
2. **No raw hex / oklch colour and no font-family string literals in components.**
   They belong solely in `tokens.css`. (Decorative textures — `.fa-plan-grid`,
   `.fa-hatch` — live in `kit.css` and use `color-mix(var(--text) …)`, not raw hex.)
3. **Re-skin via tokens, never by editing components.** A new look = new token
   values (in `tokens.css` for a default, or via the panel/store for runtime).
4. **Eject from a shared component only when the STRUCTURE must differ** — copy it
   into the consuming project and adapt there; do not fork token values.
5. Incidental control-widget pixels (an input's `34px` swatch, a `1px` divider)
   are tolerated but prefer a `--space-*`/`--border-*` token where one fits.

## Greppable enforcement

These must return nothing in `src/components`, `src/style-guide`, `src/*.tsx`
(only `tokens.css` may contain them):

```sh
# theme colour literals in components (hex / oklch)
grep -rnE '#[0-9a-fA-F]{3,8}\b|oklch\(' src --include='*.tsx'
# font-family literals in components (must be var(--font-*))
grep -rnE "font(Family)?\s*[:=].*['\"](Archivo|Bodoni|Saira|IBM|Georgia)" src --include='*.tsx'
```

(The one allowed exception is the colour-picker's neutral fallback swatch in
`StyleGuide.tsx`, which is a control affordance, not a theme colour.)

## Consuming this package

Other projects install it as a **git dependency** (no npm publish):

```jsonc
// package.json
"dependencies": { "futures-atlas-core": "github:laubaumau/futures-atlas-core" }
```

```ts
// next.config.ts
transpilePackages: ["futures-atlas-core"]
```

Then: import `futures-atlas-core/tokens.css` and `futures-atlas-core/kit.css`,
load the four fonts (Archivo, Bodoni Moda, Saira Condensed, IBM Plex Mono) as the
`--font-*` vars, SSR-inject the override `<style>` in the layout, and add the
`/api/tokens` route + KV store. See futures-atlas-02 for the reference wiring.
