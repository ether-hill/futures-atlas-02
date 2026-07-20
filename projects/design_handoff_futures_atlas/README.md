# Handoff: Futures Atlas — Claude/Netflix Hybrid Browse UI

## Overview
Three themed variants of a "Claude-app × Netflix" browse experience for **Futures Atlas** (https://futures-atlas-02.vercel.app/) — a catalogue of interactive futures projects. The design combines:
- a collapsible left sidebar (Claude-app style: nav icons, "New question", recent questions, account footer),
- a full-bleed background-video hero with a randomized greeting and an ask-anything composer card,
- four horizontal card carousels of the site's 14 real projects (Netflix-style rows).

The three variants share identical structure/behavior and differ only in theme tokens:
| File | Theme |
|---|---|
| `Atlas Observatory.dc.html` | Deep indigo `#0B0A11`, cyan accent `#7DE1FF`, Space Grotesk + IBM Plex Mono |
| `Atlas Gallery.dc.html` | Light Swiss lab: off-white `#FAFAF7`, ink text `#15151A`, electric blue `#2244FF` |
| `Atlas Signal.dc.html` | Dark mono terminal: near-black `#0A0A0A`, signal green `#3CFF9E`, IBM Plex Mono body |

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** (the Atlas site is a Next.js/Vercel app, so React/Next with its established patterns is the natural target) using its existing components and conventions. The HTML files use a custom template runtime (`support.js`, `<x-dc>`, `{{ holes }}`, `sc-for`/`sc-if`); treat that purely as reference markup — port the structure and styles, not the runtime.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interactions are final. Recreate pixel-perfectly, substituting the codebase's own component primitives.

## Screens / Views

### 1. Sidebar (fixed left rail)
- **Purpose**: Primary nav + recent questions. Defaults **open**.
- **Layout**: `position: fixed; top/bottom/left: 0`. Open width `min(300px, 84vw)`, collapsed width `64px`; animate width `0.35s cubic-bezier(.25,.8,.25,1)`. Main content gets matching `padding-left` with the same transition. Background `rgba(13,12,20,.96)` (theme-mapped), `backdrop-filter: blur(8px)`, 1px right border `rgba(text,.12)`.
- **Header row**: logo `fa.svg` from the live site, 40px tall, `filter: brightness(0) invert(1)` on dark themes / `brightness(0)` on light; wordmark "Futures Atlas" 17px/600. Collapse toggle `◫` 34×34, radius 8, hover bg `rgba(text,.08)`.
- **Nav items** (14.5px, padding 8px, radius 8, hover bg `rgba(text,.08)`):
  - ＋ New question (26px circular badge, bg `rgba(text,.12)`) — resets composer state
  - ▤ Projects → `/projects`
  - ✶ Generatives (accent-colored icon) → `/generatives`
  - ⌘ The Lab → `/about`
  - ✉ Contact → `/contact`
- **Recents** (open state only): "Recents" label 12.5px at 50% opacity; 7 question buttons, 13.5px, single-line ellipsis, hover bg `rgba(text,.07)`. Clicking fills the composer and submits.
- **Footer**: avatar 34px circle (accent-tinted bg + 1px accent border, initial "E"), name "Ether" 13.5px/600, sub "Open by default" 11.5px at 50%.
- **Collapsed state**: icons only, labels/Recents hidden, flex spacer keeps footer pinned.

### 2. Hero (greeting + composer)
- **Layout**: `min-height: min(75vh, 700px)`, centered column, black base.
- **Background video**: Pexels loop (`3129957`), muted, looping, `object-fit: cover`; **no poster — fades in from black** via `opacity 0 → 1, 1.4s ease` on the `playing` event. Autoplay is retried on a 1.6s interval (kept for the life of the page). A capture-phase document `error` listener hides any failed video/img.
- **Scrims**: radial `ellipse 70% 60% at center, rgba(bg,.35) → rgba(bg,.8)`, plus bottom fade `linear-gradient(0deg, bg 3%, transparent 30%)`.
- **Motion control** (accessibility): 34px circular button, bottom-right 16px, `❚❚`/`▶`, toggles all `video[data-auto="1"]`.
- **Greeting row**: site icon (`fa.svg`, `clamp(34px, 3.4vw, 46px)`, white-filtered) + h1 `clamp(28px, 3.8vw, 50px)`/500, one line, `text-shadow: 0 2px 30px rgba(0,0,0,.6)`. **Greeting randomizes per load** from: "Back at it, Ether" / "Now, where were we?" / "Which future today?" / "The atlas is open" / "Pick a possible world".
- **Tagline**: mono 12.5px, `.08em` tracking, 65% opacity — "a catalogue of possible worlds · 14 projects · open by default".
- **Composer card**: width `min(760px, 92%)`; bg `rgba(19,17,30,.9)` (theme-mapped), 1px border `rgba(text,.14)`, radius 14, shadow `0 30px 80px rgba(0,0,0,.6)`, `backdrop-filter: blur(6px)`, padding `22px 24px 16px`. Input 16.5px transparent/borderless, placeholder "Ask the Atlas about a possible future…". Bottom row: ＋ attach (32px, radius 8), model label mono 12px "ATLAS · grounded ▾", send button 34×34 radius 8 accent bg (`#7DE1FF`→dark text; Gallery: `#2244FF`→white), hover to the accent-bright value. Enter or click submits.
- **Action chips**: ◆ Explore, ⑂ Fork, ❝ Cite — 13.5px, padding 10px 20px, radius 10, 1px `rgba(text,.2)` border, translucent bg, hover border/text to accent.
- **Answer card** (after submit): same panel styling; accent mono overline "THE ATLAS ANSWERS" (10.5px, `.24em`); body 15.5px/1.6; citation chips (mono 11px, roman-numeral accent prefix, 1px border radius 6, hover accent) linking to project pages.

### 3. Carousels (four rows)
- **Row header**: title 15.5px/600 + paddle pair (32×32, radius 2, 1px `rgba(text,.2)` border, `←`/`→`, hover accent). Paddles scroll the row by `0.75 × clientWidth`; smoothing via CSS `scroll-behavior: smooth` on the scroller (not the JS option).
- **Scroller**: flex row, `gap: 12px`, `overflow-x: auto`, hidden scrollbars, side padding `clamp(16px, 3vw, 40px)`.
- **Card** (large): `width: min(320px, 78vw)`, aspect `16/10`, radius 6, **no drop shadow**. Layers: (1) CSS generative-gradient art (per-project, see Assets), (2) `<img>` of the real site preview when one exists — a broken image hides itself revealing the art, (3) black gradient scrim `linear-gradient(0deg, rgba(5,4,10,.88) 10%, rgba(5,4,10,.05) 55%)` — **kept identical across all three themes**, (4) text: title 20–21px/600 white, meta mono 10.5px at 65% white. Hover: `translateY(-6px)`, `.2s ease`.
- **Rows**:
  1. **Recent projects** — 10 cards; top-left mono category tag (10px uppercase); meta "date · status".
  2. **Continue exploring** — 6 cards with progress: 4px track `rgba(text,.15)`, accent fill at 64/66/30/48/82/40%, radius squared on the joined corner; meta is a "where you left off" line.
  3. **Popular this week** — 6 cards, tiny rank chip top-right: mono 9.5px, `Nº1…Nº6`, on `rgba(5,4,10,.82)`, accent text, padding 2px 7px, radius 2.
  4. **AI & risk** — 5 cards; meta "date · blurb".

### 4. Footer
1px top border `rgba(text,.1)`, 12.5px; left tagline at 40% opacity; right links (Observatory / Gallery / Signal cross-links) at 55%, hover accent-bright.

## Interactions & Behavior
- Sidebar toggle animates rail width and content padding-left together (`0.35s cubic-bezier(.25,.8,.25,1)`).
- Recents click → sets composer value + submits immediately.
- Composer: Enter key or ↑ button submits when non-empty; "New question" clears query + answer.
- Hero video: fade-in-on-playing; play/pause toggle controls every `data-auto` video; autoplay retry interval.
- Carousel paddles: `scrollBy({left: ±0.75 × clientWidth})`; CSS smooth scrolling.
- Card hover: lift `-6px`; paddle/link hovers go to accent.
- Randomized greeting on every mount.

## State Management
- `railOpen: boolean` (default `true`)
- `askQuery: string`, `asked: string | null` (drives answer card)
- `motion: boolean` (video play/pause), `heroReady: boolean` (mount-gated video render)
- `greeting: string` (picked once on mount)
- Row data is static; in production, fetch the project list and map to the card model: `{title, cat, date, href, art, img?, status | at+pct | rank | blurb}`.

## Design Tokens

### Observatory (dark indigo)
- bg `#0B0A11` · panel `rgba(19,17,30,.9)` · rail `rgba(13,12,20,.96)`
- text `#EDECF4` · accent `#7DE1FF` · accent-bright `#B9EEFF` · avatar bg `#241E3E`
- fonts: Space Grotesk (body/display), IBM Plex Mono (meta/labels)

### Gallery (light swiss)
- bg `#FAFAF7` · panel `rgba(255,255,255,.9)` · rail `rgba(245,245,241,.96)`
- text `#15151A` · accent `#2244FF` · accent-bright `#0F2BCC` · avatar bg `#E8E8FF`
- send button: blue bg, **white** glyph; logo filtered to black

### Signal (dark mono)
- bg `#0A0A0A` · panel `rgba(20,20,20,.9)` · rail `rgba(14,14,14,.96)`
- text `#E8E8E8` · accent `#3CFF9E` · accent-bright `#9BFFCE` · avatar bg `#1C2C22`
- body font: IBM Plex Mono

### Shared scale
- Radii: cards 6 · composer/answer 14 · chips 10 · buttons/nav 8 · paddles/rank 2
- Type: h1 `clamp(28,3.8vw,50)` · card title 20–21/600 · row title 15.5/600 · body 15.5–16.5 · meta mono 10–12.5 · overline mono 10.5 `.24em` caps
- Spacing: page gutter `clamp(16px,3vw,40px)` · row gap 12 · card text inset 16/14
- Card scrim (all themes): `linear-gradient(0deg, rgba(5,4,10,.88) 10%, rgba(5,4,10,.05) 55%)`

## Assets
- **Logo/icon**: `https://futures-atlas-02.vercel.app/fa.svg` (recolor via CSS filter or inline SVG fill).
- **Project preview images** (exist on the live site): `/projects/<slug>.jpg` for `swipe-the-future`, `trajectories`, `quantum-dominance`, `woodchipper`, `underground-intelligence`, `quantum-sandbox`, `literal-frequency`, `social-composer`; plus `/og/the-odds.png` for The Odds.
- **No static preview exists** for: `signal-reactor`, `quantum-spark`, `hyperscale`, `village-oracle`, `generatives` — the live site renders animated components for these. The mocks give each a **distinct CSS generative-gradient** (defined in the `ART` map in each file's script); in production, either embed the site's live preview components or keep these gradients.
- **Hero video**: Pexels stock loop `videos.pexels.com/video-files/3129957/3129957-uhd_3840_2160_25fps.mp4` — a placeholder; swap for brand footage.
- Fonts via Google Fonts: Space Grotesk, IBM Plex Mono.

## Files
- `Atlas Observatory.dc.html` — dark indigo variant (canonical; read this one first)
- `Atlas Gallery.dc.html` — light swiss variant
- `Atlas Signal.dc.html` — dark mono variant
- `support.js` — prototype-only template runtime; **do not port**. `{{ x }}` holes, `sc-for`/`sc-if`, and `style-hover` attributes map to your framework's expressions, loops, conditionals, and hover styles.
