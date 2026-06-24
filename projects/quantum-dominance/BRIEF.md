# BUILD BRIEF — Quantum Dominance: Two Futures

**Project:** Futures Atlas interactive entry
**Type:** Single self-contained interactive (hero → scenario explorer → composer)
**Hand-off:** This brief + `scenarios.json` + `media-manifest.csv` + `prototype-reference.html`
**Deploy:** Vercel (static-first — see Constraints)

---

## 0 · One-liner

A two-lens speculative-satire explorer. It opens on a phone showing the real @DoWCTO "quantum dominance" post, lets the visitor pick a lens — **The Dystopia** (futures where it works for him) or **The Backfire** (futures where the machine he built turns transparent the other way) — then serves randomised full-bleed scenario panels. After 5 views, the visitor can push everything they saw into a Composer as ready-to-post drafts.

The working prototype (`prototype-reference.html`) is the source of truth for layout, motion, and copy. Build the production version to match it, then improve where this brief specifies.

---

## 1 · What you're building (4 surfaces)

1. **Hero** — a CSS-built iPhone rendering the @DoWCTO social post (stylised facsimile: glowing Q + silhouette, **never a photoreal real person**). Below: title, one-line pitch, two lens buttons, scroll cue.
2. **Scenario** — a 50/50 split. Text left (kicker · big title · summary · documented seed · controls), full-bleed media right. Content drawn **at random** from the active deck; UI **retints** to the lens accent.
3. **Composer** — overlay that stages every scenario seen as a copy-ready social draft (title · hook · satire label · hashtags · media thumb). Copy-one and copy-all.
4. **Media slot fallback** — until a `media/<id>.jpg` exists, the panel/thumb renders the slot: id, target filename, Midjourney prompt, copy button. So the whole thing ships as a navigable storyboard before any media exists.

---

## 2 · Stack & constraints

- **Next.js (App Router) + TypeScript**, deployed on Vercel. One route (e.g. `/futures/quantum-dominance`) or standalone — your call to fit the Atlas repo.
- **Static-first to protect Vercel CPU minutes.** No server work at request time, no API routes, no edge functions. The interactive is fully client-side; the page is statically rendered/exported. Scenario data is imported at build time.
- **No network calls at runtime.** No `fetch`, no third-party SDKs. (The earlier API-storyteller variant is explicitly *not* this build.)
- **No `localStorage` / `sessionStorage`.** All state in React (`useReducer`/`useState`).
- **No CLS from web fonts** — `next/font` with `display: swap` and fallback metrics.
- Keep total client JS lean; this is editorial, not an app.

---

## 3 · Repo structure (suggested)

```
app/futures/quantum-dominance/
  page.tsx                  # static shell, imports data, renders <Experience/>
  Experience.tsx            # 'use client' — top-level state machine
  components/
    Hero.tsx                # phone mock + lenses
    PhonePost.tsx           # the @DoWCTO post facsimile (pure CSS/SVG)
    ScenarioPanel.tsx       # 50/50 text+media
    MediaFrame.tsx          # img/video load + slot fallback
    Composer.tsx            # share overlay + drafts
    Overlays.tsx            # grain / scanline / vignette
  lib/
    scenarios.ts            # typed import of scenarios.json (or inline)
    deck.ts                 # shuffle queue + draw logic
    caption.ts              # draft caption builder
  styles/tokens.css         # design tokens (or tailwind theme)
public/media/               # drop Midjourney assets here: <id>.jpg / <id>.mp4 / hero-post.jpg
```

Data lives in `scenarios.json` (provided). Type it:

```ts
type Lens = 'dystopia' | 'backfire';
interface Scenario {
  id: string;          // also the media filename stem
  deck: Lens;
  title: string;
  hook: string;        // one-liner for the composer caption
  summary: string;     // panel body; may contain ONLY <em> and <b>
  seed: string;        // "SEED · ..." / "FLIPS · ..." provenance line
  prompt: string;      // Midjourney prompt (also the slot text)
  type: 'image' | 'video';
}
```

`summary` carries inline `<em>` (accent) and `<b>` (white) only — render via a tiny allow-list parser, never `dangerouslySetInnerHTML` of raw input.

---

## 4 · Interaction logic

- **Decks** are two arrays. Maintain a per-deck **shuffled queue**; `drawNext` pops one, refilling+reshuffling when empty → no repeats until the deck is exhausted.
- **Lens select** (hero) → set mode, draw first scenario, smooth-scroll to the scenario surface.
- **Show another** → `drawNext(mode)`, re-fade the text, swap media.
- **Switch lens** → flip mode, draw from the other deck, retint UI.
- **View counter** is global across lenses. On each render, increment; push the scenario to a unique-ordered `viewed[]`.
- **Share gate:** when `viewCount >= 5`, reveal the pulsing **Share** control. (Make the threshold a single const `SHARE_AFTER = 5`.)
- **Retint:** set `data-mode` on the root; CSS swaps `--sig` between red (dystopia) and green (backfire). All accent usage references `--sig`.

---

## 5 · Design tokens

Carry these verbatim — this piece has a **deliberate graphic-novel identity distinct from the Atlas base system**. Do **not** normalise it to Fraunces/Inter; that's intentional.

```
--ink #08090b   --panel #0c0e11   --bone #e9e5dc   --muted #83878e   --dim #565a61
--red #e23123 (dystopia signal)   --green #3fd39a (backfire signal)   --cyan #54c6d2 (rare tick)
--sig = active signal (retints via [data-mode])
--line rgba(233,229,220,.16)

Type:  Anton (impact titles, all-caps slabs)  ·  Archivo 400/500/600 (body)  ·  JetBrains Mono (HUD/labels)
Texture: fixed grain (SVG feTurbulence, ~.08 overlay) + scanlines (~.4 multiply) + radial vignette
Signal motifs: clipped-corner caption chips, chromatic-split title text-shadow (-1px red / +1px cyan), ken-burns on stills, hard cut between panels
```

---

## 6 · Media pipeline

- Asset convention: **`public/media/<id>.<ext>`** (`.jpg` for image, `.mp4` for video). `hero-post.jpg` optionally overrides the rendered phone image.
- `MediaFrame` attempts the asset; **on error or absent file, render the slot** (id · `media/<id>.<ext>` · prompt · copy button). This is the default pre-media state and must look intentional.
- Images: `object-fit: cover`, subtle ken-burns, `loading="lazy"` for off-screen, but the active panel should preload the next-likely asset is unnecessary — keep it simple.
- Video: `autoplay muted loop playsinline`; fall back to slot on error.
- All 20 prompts + filenames are in `media-manifest.csv` — batch-generate, drop in, done. No code change needed to light them up.

---

## 7 · Composer hand-off

Prototype composer is in-artifact (stages drafts, copy-one/all). For production, wire the **real Composer hand-off**:

- Build the caption with `lib/caption.ts`: `TITLE` ＼n＼n `hook` ＼n＼n `— {deck.seedWord} Speculative satire.` ＼n `#hashtags`.
- Hand-off contract (pick one, document in code):
  - **URL params:** open Composer with `?source=futures-atlas&drafts=<base64(JSON)>` where each draft = `{caption, media:"/media/<id>.jpg", lens}`.
  - **postMessage:** if Composer is embedded/owned, `window.postMessage({type:'qd:drafts', drafts}, COMPOSER_ORIGIN)`.
- Keep the in-artifact copy/copy-all as the no-integration fallback.

---

## 8 · Accessibility & QA mandates

- **Lighthouse ≥ 90** (Perf/A11y/Best-Practices/SEO). **axe-core: zero serious/critical.**
- Full **keyboard** path: lenses, show-another, switch, share, composer (focus-trap the overlay, Esc closes, return focus to trigger).
- Visible focus rings (use `--sig`). Buttons are real `<button>`s with discernible names.
- `prefers-reduced-motion`: disable grain/ken-burns/smooth-scroll/cut-flash; keep instant state changes.
- Phone post has an accessible label; decorative overlays `aria-hidden`.
- Color contrast: body text on media uses the scrim gradient; verify AA on the text side.

---

## 9 · Editorial / content rules (non-negotiable)

- **Label it satire.** "Speculative satire" appears on hero and on every composed draft. This is a Futures Atlas creative piece, **not** AI Rapture reporting — never let the two blur.
- **No photoreal real-person likeness.** Regime iconography, silhouettes, the Q — never a generated face of a real individual. The provided prompts already honour this; keep it if you extend them.
- **Each scenario keeps its documented seed line** (the `seed` field) — the satire stays anchored to something on the record.
- **No AI-tell phrases** in any copy you add (per Atlas tone guide). Match the terse, declarative register of the existing summaries/hooks.

---

## 10 · Build order (M0 → M2)

**M0 — scaffold & static skeleton**
Route, data import + types, tokens, overlays, Hero with the CSS phone post, one static scenario panel (slot state), responsive 50/50 ↔ stacked.

**M1 — the interaction**
Shuffle-queue decks, lens select + smooth-scroll, show-another, switch-lens, retint, view counter, share gate at 5, MediaFrame with slot fallback + ken-burns + video.

**M2 — composer, polish, ship**
Composer overlay (drafts, copy-one/all, focus-trap), real hand-off contract, reduced-motion, keyboard, Lighthouse/axe pass, deploy to Vercel (static).

---

## 11 · Acceptance criteria

- [ ] Loads with zero media present and is fully navigable as a storyboard (every slot shows prompt + copy).
- [ ] Lens pick scrolls to scenario and renders a random item from that deck; UI retints.
- [ ] Show-another never repeats within a deck cycle; switch-lens swaps decks.
- [ ] Share control appears only after 5 views; composer stages all unique seen scenarios with correct captions.
- [ ] Dropping `public/media/<id>.jpg` lights up that scenario + its composer thumb with no code change.
- [ ] No runtime network calls, no storage APIs, page statically rendered.
- [ ] Lighthouse ≥ 90 all categories; axe-core clean; reduced-motion honored; full keyboard path.
- [ ] "Speculative satire" present on hero and drafts; no photoreal real-person faces.

---

## 12 · Notes / open decisions (flagged for Etherhill)

- **View count is global** across lenses. If "5" should mean five *within* a lens, change `SHARE_AFTER` logic to per-deck.
- **Composer stages all unique seen** scenarios; cap to last 5 if you want a tighter share set.
- Data can later migrate to a **Payload collection** if the Atlas wants these editable in CMS — `scenarios.json` maps 1:1 to a collection schema.
