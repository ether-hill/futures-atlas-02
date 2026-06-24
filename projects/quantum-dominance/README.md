# Quantum Dominance: Two Futures — Claude Code package

Hand-off bundle for the Futures Atlas interactive entry.

## Contents

| File | What it is |
|---|---|
| `BRIEF.md` | The build brief. Point Claude Code at this first. |
| `scenarios.json` | Both decks (10 dystopia + 10 backfire), typed and ready to import. |
| `media-manifest.csv` | Shot list — 20 rows: id, deck, type, target filename, Midjourney prompt. Batch-generate from this. |
| `prototype-reference.html` | The working single-file prototype. Source of truth for layout, motion, and copy. Open it in a browser to feel the interaction. |

## How to use

1. **Read `BRIEF.md`.** It specifies stack (Next.js/Vercel, static-first), file structure, interaction logic, design tokens, the media pipeline, a11y/QA mandates, and an M0→M2 build order.
2. **Generate media** from `media-manifest.csv` in Midjourney, then drop files into `public/media/` named `<id>.jpg` (or `.mp4`). `hero-post.jpg` optionally overrides the rendered phone image. No code change needed — slots light up automatically.
3. **Build** against `scenarios.json`. The prototype shows the exact behavior to match, then improve per the brief (real Composer hand-off, Lighthouse/axe).

## Non-negotiables (carried from the brief)

- Labelled **speculative satire** — this is a Futures Atlas creative piece, not AI Rapture reporting.
- **No photoreal real-person likeness** — regime iconography and silhouettes only.
- Every scenario keeps its **documented seed line**.
- Static-first, no runtime network calls, no storage APIs (protects Vercel CPU minutes).
- The graphic-novel type system (Anton / Archivo / JetBrains Mono) is **intentional** — don't normalise it to the Atlas base Fraunces/Inter.

## Quick reference — the flow

`Hero (phone post + 2 lenses)` → pick lens → smooth-scroll → `Scenario (50/50, random, retinted)` → *Show another* / *Switch lens* → after 5 views → *Share* → `Composer (drafts, copy/copy-all, hand-off)`.
