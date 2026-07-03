# Claude Code Brief — Futures Atlas: About Page

**Project:** Futures Atlas (Next.js / Vercel, staging: futures-atlas-02)
**Route:** `/about`
**Goal:** A beautiful, animated, interactive About page that explains what Futures Atlas is (showcase + prototype lab), documents the tech stack with logos, and shows how outputs and workflows are made — without reading like a static text page or a marketing site.

---

## 1. Voice & copy principles

Plain, declarative, no adjectives doing PR. The register is "Mapping foresight" — name the activity, stop. The page should feel like documentation from a working lab: honest about what's finished, what's rough, and what's reusable. The single most important line of copy on the page is **"It's meant to be used."**

All copy below is final-draft quality but should be treated as editable content (pull into a constants file or MDX, not hardcoded in JSX).

---

## 2. Page structure & copy draft

### 2.1 Hero — "What this is"

**Eyebrow:** `ABOUT`

**Headline:** `A prototype lab for foresight`

**Standfirst:**
> Futures Atlas is a showcase and prototype lab. We build frameworks and modular components for foresight — mostly around quantum computing, the evolution of quantum applications, emerging AI, and the organisations and people driving them. Some of what we post is editorial. Some is a working prototype with code you can copy. Some is a full, tested suite of tools and workshops. Take a piece, wire several together, or start your own path from one. It's meant to be used.

**Hero treatment:** Not a static block. See §4.1 — the hero carries the page's signature interactive element.

### 2.2 Section — "What you'll find here" (the three output types)

Three cards/panels, each a type of post on the Atlas. These same labels should eventually badge every project on the site, so build them as a reusable `<OutputType>` component.

**READ — Editorial**
> Essays, research notes, and rhetoric breakdowns. Cited claims, weighed evidence, no forecasting theatre. Use them as briefings or as source material for your own work.

**COPY — Prototypes**
> Working tools with open, replicatable code. Rough by design. Fork them, gut them, wire them into larger workflows. If a prototype helps you build a better one, it did its job.

**RUN — Kits**
> Full packaged suites — tools plus workshop formats, tested in real rooms. Ready to facilitate: group projects, foresight sessions, personal research sprints.

### 2.3 Section — "What we work on" (domains)

Short, flat list. No icons-for-the-sake-of-icons; typographic treatment.

> **Quantum computing** — the technology, its real state, and the rhetoric sold around it.
> **Quantum applications** — how the field evolves from lab results to claimed use cases.
> **Emerging and future AI** — capabilities, trajectories, and the gap between the two.
> **The people and organisations** — who's building, funding, and narrating these futures.

Optional closing line: `Across all of it: cite everything, substance over hype.`

### 2.4 Section — "How things get made" (workflow documentation)

This is the section the user specifically wants "interesting ways to document the outputs and workflows." Copy intro:

> Every project on the Atlas is made with a mix of AI systems, creative tools, and open web technology. We document the workflow for each one — which models, which libraries, which steps — so the process is as replicatable as the output.

Then the **Workflow Diagram component** (see §4.3): an interactive, animated pipeline showing a typical production flow, e.g.

`Research (Claude, ChatGPT) → Framework drafting (Claude Code) → Visuals (Midjourney, Kling AI, open models) → Build (Next.js, three.js, p5.js) → Test in workshops → Publish + open the code`

### 2.5 Section — "The stack" (technologies, with logos)

Intro copy:
> The tools we use, in the open. Nothing here is an endorsement — it's an inventory.

Grouped grid (see §4.2 for the interactive treatment). Groups and entries:

**AI — language & code**
- Claude / Claude Code (Anthropic) — research, drafting, and most of the build work on this site
- ChatGPT (OpenAI) — research cross-checks, alternative drafts
- Emerging open-source models (e.g. Llama, Mistral, Qwen, Flux for images) — local experiments, cost-free replication paths

**AI — image & video**
- Midjourney — visual language, project imagery
- Kling AI — video generation
- (leave the group extensible — new tools get added often)

**Web & creative code**
- Next.js — the framework the Atlas runs on
- Vercel — hosting and deployment
- three.js — 3D and WebGL work
- p5.js — generative sketches and creative-code prototypes
- React — component layer
- Tailwind CSS — styling (confirm against repo; use whatever the project actually uses)
- Framer Motion (or GSAP) — animation layer for this page
- D3.js — data-driven visuals where prototypes need them

**Per-entry data model** (build as JSON/TS constants):
```ts
{
  name: string,
  group: 'ai-language' | 'ai-media' | 'web',
  logo: string,          // path in /public/logos
  url: string,
  role: string,          // one plain sentence: what we actually use it for
  usedIn?: string[]      // slugs of Atlas projects that used it → renders links
}
```
The `usedIn` field is what makes this more than a logo wall: hovering/tapping a tool shows *which actual projects it built*, connecting stack → output.

### 2.6 Section — "Who's behind it"

> Futures Atlas is a project by **Frond Studio**, developed with collaborators including **Rixt Bouman**, supported by [grant/funder name — CONFIRM WITH ETHERHILL before shipping]. 

> If you use something from the Atlas — a framework, a prototype, a kit — we'd like to hear how it went. [Contact link]

### 2.7 Footer CTA

Single line, plain: `Browse the projects →` linking to the main index. No newsletter-style pleading.

---

## 3. Design direction

**Read the existing Futures Atlas staging site first and inherit its tokens** (colors, type, spacing). The About page must feel native to the site, not a redesign. The notes below apply *within* that system.

- **Not** the default AI-design looks: no warm-cream + serif + terracotta, no black + acid green, no faux-broadsheet hairlines — unless the existing site already uses one, in which case match the site.
- The page's personality should come from **one signature interactive element** (the hero, §4.1) plus disciplined typography. Everything else stays quiet.
- Motion: orchestrated, purposeful, and honest — this is a lab page, so motion should feel like *instrumentation* (things measuring, connecting, revealing) rather than *decoration* (things floating, glowing, parallaxing for no reason).
- Respect `prefers-reduced-motion` throughout: every animated element needs a static fallback state that still reads correctly.
- Responsive to mobile; the workflow diagram (§4.3) needs a genuinely rethought vertical layout on small screens, not a squashed horizontal one.
- Visible keyboard focus states on all interactive elements.

---

## 4. Interactive & animated components

### 4.1 Hero signature: the living atlas mark

The one bold element. Options in order of preference — pick based on what the codebase already supports:

**Option A — p5.js signal field (preferred, on-brand):** A generative canvas behind/beside the headline: a field of drifting points (signals) where a small number periodically connect into brief constellations, hold for a moment, then dissolve. It's the site's thesis as motion — most signals are noise, a few connect. Mouse/touch proximity gently attracts nearby points. Monochrome or two-tone from the site palette, low opacity, never competing with the text. Cap at ~200 points, `requestAnimationFrame`, pause when tab is hidden, static rendered frame for reduced-motion.

**Option B — three.js wireframe globe/atlas** that slowly rotates and draws connection arcs between points. More literal "atlas," heavier; only if three.js is already in the bundle.

Either way: the canvas is decoration-with-meaning, `aria-hidden`, zero impact on content accessibility.

### 4.2 The stack grid

- Logos in a responsive grid, grouped under the three group headings.
- **Logos rendered monochrome by default** (CSS filter or single-color SVGs) so the wall doesn't turn into brand-color soup; full color on hover/focus.
- Hover/focus/tap expands a small card: logo in color, `role` sentence, and `usedIn` project links.
- Scroll-triggered entrance: logos fade/rise in a subtle stagger (60–80ms) as the section enters viewport. Once. No looping.
- Sourcing logos: use official SVG brand assets from each company's press/brand page where available; [simple-icons](https://simpleicons.org) covers most (Next.js, Vercel, React, three.js, p5.js, OpenAI, Anthropic, Tailwind, D3). Midjourney and Kling may need manual sourcing from their sites. Store all in `/public/logos/`, normalize to consistent optical size, and include a `LOGOS.md` noting the source of each file.
- Fallback: if a logo is missing, render a typographic tile (tool name in the utility face) — never a broken image.

### 4.3 Workflow diagram: "How a project gets made"

The most "interesting documentation" component. Build as an interactive horizontal pipeline:

- 5–6 **stage nodes** (Research → Frameworks → Visuals → Build → Test → Publish), connected by an animated line that draws itself on scroll into view (SVG `stroke-dashoffset` animation).
- Each node is clickable/tappable: expands to show the tools used at that stage (small logos, pulled from the same stack data — single source of truth) and a one-line description.
- A subtle "pulse" travels along the connection line on a slow loop, suggesting throughput. Disable under reduced motion.
- On mobile: vertical timeline layout, same interactions.
- Stretch goal (only if time allows): a "workflow recipe" view per project type — selecting READ / COPY / RUN re-highlights which stages and tools that output type uses. This directly ties §2.2 to §2.4 and would be the page's cleverest moment.

### 4.4 Output-type cards (§2.2)

- Three cards with a tactile hover state (slight lift or border activation — match existing site card behavior if it exists).
- Each card's label (READ / COPY / RUN) is set in the utility/mono face as a badge — the same badge component to be reused on project cards site-wide later. Build it as `<OutputTypeBadge type="read|copy|run" />` exported for reuse.

---

## 5. Technical notes

- **Framework:** Next.js App Router (confirm against repo version). Page at `app/about/page.tsx`. 
- **Content:** all copy in a single `content/about.ts` (or MDX) — Etherhill will iterate on wording; no copy buried in components.
- **Animation library:** whatever's already in the repo; if nothing, Framer Motion for DOM/scroll animation + native canvas for the hero. Don't add GSAP *and* Framer Motion.
- **Performance:** hero canvas lazy-mounts after first paint; logos as optimized SVG; page targets Lighthouse ≥ 90 performance on mobile. No layout shift from animation (reserve space).
- **Accessibility:** semantic headings (single `h1`), all interactions keyboard-operable, `prefers-reduced-motion` honored, decorative canvases `aria-hidden`, logo images with proper `alt` (tool name).
- **SEO/meta:** title `About — Futures Atlas`, description drawn from the standfirst, OG image (can be a rendered frame of the hero canvas).

## 6. Build order

1. Read existing site tokens/components; write a short plan confirming palette, type, and which animation lib to use.
2. Static page with all copy and structure (content file first).
3. Stack data model + grid with logos (sourcing pass on logos).
4. Workflow diagram component.
5. Hero canvas.
6. Motion pass (scroll reveals, staggers, reduced-motion audit).
7. Responsive + accessibility audit, Lighthouse check.

## 7. Open questions for Etherhill (answer before/while building)

1. Grant/funder name and whether it should be credited on this page.
2. Should Rixt be named, and anyone else?
3. Confirm the exact open-source models worth naming now (Llama? Mistral? Flux? Qwen?) — this list dates quickly; consider phrasing the group loosely.
4. Contact route: email, form, or link to Frond Studio?
5. Is Tailwind actually in the stack? (Brief assumes yes; verify in repo.)
6. Does the site already have a badge/label system the READ/COPY/RUN badges should extend?
