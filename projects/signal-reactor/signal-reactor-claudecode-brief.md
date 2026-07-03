# Signal Reactor — Claude Code Build Brief

**Project:** Signal Reactor (Frond Studio × Rixt Bouman)
**Type:** Public web app — organizational foresight instrument
**Status:** Loop validated in a throwaway prototype. This brief is the **single source of truth** — everything Claude Code needs (prompts, schemas, deck model, sample content, design system, guardrails) is embedded below. No other file is required.

---

## 1. What we're building

A public tool where anyone enters their organization type and gets a **substance-first foresight briefing** on quantum + advanced AI, packaged as a presentable slide deck (web viewer + PPTX/PDF export) they can run a stakeholder discussion from.

The governing discipline is **deflate the hype, extrapolate the real signal.** If quantum's near-term impact on a sector is narrow, the tool says so and redirects to where the genuine disruption is (usually advanced AI). This is the credibility play and the reason the tool can carry the studio's name.

**Positioning for v1: this is a *provocation engine*, not an evidence engine.** Content is model-generated (parametric, unsourced, non-deterministic). That is acceptable *only if honestly labeled*. The honesty layer (§5) is not optional polish — it's what reconciles this tool with the studio's cite-everything ethic. Retrieval/grounding is a later milestone (M2), not v1.

---

## 2. Stack & conventions

Match existing Frond/Etherhill project conventions:

- **Next.js 15** (App Router), **TypeScript**, deployed on **Vercel** with auto-deploy from `main`.
- **Claude API calls run server-side only** — a Route Handler (`app/api/generate/route.ts`), API key in `ANTHROPIC_API_KEY` env var. **Never ship the key to the browser.** (The validated prototype called the API client-side; that only works inside a Claude.ai artifact sandbox and must not be reproduced here.)
- Use the official **`@anthropic-ai/sdk`** server-side.
- **URL-serialized state** for shareability — selected sector (and later, mode) encode into the URL, e.g. `/?s=regional-credit-union`. A briefing should be linkable.
- **Runtime validation with `zod`** on every model response before it touches the UI. Model output is untrusted input.
- Model IDs via config, not hardcoded. Default text model: `claude-sonnet-4-6`. Allow `claude-haiku-4-5-20251001` as a cheaper routing option (see §8).
- **Design: use the frontend-design skill**, committed to the **Swiss Type-Driven** lane (see §7). Build the UI fresh and better than any mock — but hold the restraint guardrail in §9.
- Accessibility floor: **WCAG 2.2 AA** — keyboard nav, `focus-visible`, `prefers-reduced-motion`, contrast.

---

## 3. Architecture

### Routes
- `/` — picker (sector grid + "Other" free-text) → on submit, POST to generate route, transition to viewer.
- `app/api/generate/route.ts` — server handler. Runs the two-call pipeline, validates, returns assembled `Deck` JSON.

### Generation pipeline (server-side)
Two sequential Claude calls. Each fits compact JSON comfortably in ~1000 output tokens given the terseness instruction.

1. **Analysis call** — system prompt = `SYS_ANALYSIS` (§4). Input: the sector string. Output: analysis JSON.
2. **Facilitation call** — system prompt = `SYS_FACILITATION` (§4). Input: sector + a compact context summary built from call 1 (sector_display, substance, quantum verdict+note, ai_note, near-term horizon). Output: facilitation JSON.

Then `assemble()` merges both into the **8-slide `Deck`** (§6).

**Robustness requirements:**
- Strip ```` ```json ```` / ```` ``` ```` fences and extract the outer `{…}` before parsing.
- **Zod-validate each response** against its schema. On failure, retry once with a corrective instruction appended, then return a typed error envelope (no stack traces to client).
- **Enable prompt caching** on both system prompts — they're static across every run (§8).
- Log per-generation token usage + cost estimate server-side (not shown to users in v1).

---

## 4. System prompts (embed verbatim — do NOT paraphrase)

These are the IP of the tool. They encode the deflation discipline and the exact output schemas. Put them in `lib/prompts.ts` as versioned constants; any edit bumps a version string logged with each generation.

### `SYS_ANALYSIS`
```
You are the analytical engine of Signal Reactor, a foresight instrument governed by one discipline: substance over hype. Given an organization type, assess how QUANTUM COMPUTING and ADVANCED AI will actually affect it over the next decade.

Your defining trait is that you DEFLATE hype. If quantum's real near-term impact on this sector is narrow or negligible, say so plainly instead of inflating it, and redirect to where the genuine disruption is (usually advanced AI). Be specific to THIS sector's real mechanisms — never generic "AI will transform everything" filler. Ground claims in real dynamics (e.g. "harvest now, decrypt later" cryptographic risk, post-quantum migration, AI underwriting, synthetic data, agentic automation).

Return ONLY valid JSON — no markdown, no preamble. Keep every string tight and concrete: short phrases, not paragraphs. Economy is mandatory. Schema:
{
 "sector_display":"clean Title Case name",
 "one_liner":"the sector's foresight thesis in ONE sharp sentence",
 "signal":{
   "hype":"the inflated marketing version, 1 sentence",
   "substance":"what is actually true, 1-2 sentences",
   "quantum_verdict":"minimal|narrow|significant",
   "quantum_note":"why, 1 sentence — deflate if warranted",
   "ai_note":"where the REAL advanced-AI disruption lands for this sector, 1 sentence"
 },
 "horizons":{
   "near":"now-2028 for this sector, 1-2 sentences",
   "mid":"2028-2035, 1-2 sentences",
   "far":"2035+, 1-2 sentences"
 },
 "vectors":[
   {"area":"short area name","note":"specific impact, 1 sentence","severity":"low|medium|high"}
 ]
}
Provide exactly 5 vectors covering distinct fronts (e.g. security, workforce, operations, competition, regulation).
```

### `SYS_FACILITATION`
```
You are the facilitation engine of Signal Reactor. Given an organization type and a substance-first analysis, produce materials a non-expert can use to run a real stakeholder discussion.

Frame CONSIDERATIONS as open decisions the organization now owns — questions they must answer, not answers you hand them. Make DISCUSSION prompts genuinely engineered for a room of colleagues: provocative, specific, answerable. ASSUMPTIONS expose what must be true for the futures to hold. MONDAY items are concrete near-term actions.

Return ONLY valid JSON — no markdown, no preamble. Tight strings. Schema:
{
 "considerations":["3-4 open decisions, each a short phrase"],
 "discussion":["exactly 5 discussion questions for a group"],
 "assumptions":[{"claim":"a projected future, short","condition":"true only if ... , short"}],
 "monday":["exactly 3 concrete near-term actions"]
}
Provide exactly 3 assumptions.
```

---

## 5. The honesty layer (v1 differentiator — build this, don't skip it)

This is what makes an unsourced generator defensible under the studio's name.

- **Standing frame, always visible:** a persistent line near the deck — *"AI-generated foresight, not verified analysis. Use it to structure a conversation, not to make the decision."* Also stamp it onto the cover slide and into both exports' footers.
- **Foreground the assumptions slide.** It's the most epistemically honest artifact in the deck — a feature, not slide-7 filler. Consider a one-line "what this assumes" teaser earlier in the flow.
- **Provenance scaffolding (render-ready in v1, populated in M2):** add an optional `provenance?: 'documented' | 'projection' | 'speculation'` field to claim-bearing slide items. In v1 everything is `projection` (the honest default). Render a small mono tag per claim. This mirrors the studio's FACT / ADJUDICATED / ALLEGATION taxonomy and makes the show/substance discipline visible on the tool's *own* output. When M2 retrieval lands, `documented` claims carry a source.

---

## 6. Deck data model & assembly

Define in `lib/types.ts`:

```ts
type Severity = 'low' | 'medium' | 'high';
type Verdict  = 'minimal' | 'narrow' | 'significant';
type Provenance = 'documented' | 'projection' | 'speculation';

interface Deck {
  sector: string;
  mode: 'provocation' | 'grounded';   // grounded lands in M2
  generatedAt: string;
  promptVersion: string;
  slides: Slide[];
}

type Slide =
  | { type: 'cover';          sector: string; one: string; verdict: Verdict }
  | { type: 'signal';         hype: string; substance: string; verdict: Verdict; qnote: string; ainote: string }
  | { type: 'horizons';       near: string; mid: string; far: string }
  | { type: 'vectors';        vectors: { area: string; note: string; severity: Severity }[] }
  | { type: 'considerations'; items: string[] }
  | { type: 'discussion';     items: string[] }
  | { type: 'assumptions';    items: { claim: string; condition: string; provenance?: Provenance }[] }
  | { type: 'monday';         items: string[] };
```

**Slide order (fixed, 8 slides):** cover → signal → horizons → vectors → considerations → discussion → assumptions → monday.

**Slide slugs** (mono kicker per slide): cover→"Foresight Briefing", signal→"The Signal, Deflated", horizons→"Time Horizons", vectors→"Impact Vectors", considerations→"Things to Consider", discussion→"For the Room", assumptions→"Assumptions Exposed", monday→"What to Do Now".

**`assemble(analysis, facilitation)`** maps the two JSON payloads into the slide array in that order. Clamp arrays defensively (vectors→5, considerations→4, discussion→5, assumptions→3, monday→3).

### Deck viewer requirements
- Fixed **1280×720** slide "board" scaled to fit the viewport (compute scale = min(stageW/1280, stageH/720, 1); center with letterboxing).
- Keyboard nav (←/→/Space), dot rail, slide counter "01 — 08", prev/next, disabled at ends.
- One React component per slide `type`, driven by the discriminated union.
- The **same `Deck` object** drives viewer + PPTX + PDF so they never diverge.

---

## 7. Design system (Swiss Type-Driven)

Commit to ONE lane — Swiss. Do not blend.

- **Type:** Archivo (display + UI), IBM Plex Mono (labels, numbers, kickers, dates — uppercase, letter-spacing ~0.14em). `font-display: swap`.
- **Color tokens:**
  - `--bg:#0b0b0c` · `--panel:#0f0f10` · `--panel-2:#141416`
  - `--fg:#efece4` · `--fg-muted:#9a968c` · `--fg-subtle:#67645c`
  - `--border:#232320` · `--border-2:#2f2f2a`
  - **`--accent:#e0952f`** (ember — the ONLY accent; a restrained nod to the studio's Caravaggesque candlelight)
  - Severity: high `#d9633f` · medium `#c9a227` · low `#6f8a67`
- **Display type** large and tightly tracked (letter-spacing −0.03em to −0.04em; line-height 0.9–1.0). Mono for all labels/kickers/counters.
- **Motion:** one orchestrated entrance per slide max; 300–600ms reveals; ease `cubic-bezier(0.22,1,0.36,1)`. Full `prefers-reduced-motion` fallback.
- Restrained, editorial, grid-disciplined. If it looks like a SaaS dashboard, it's wrong.

---

## 8. Cost controls

- **Prompt-cache both system prompts** (static → ~90% off cached input). Biggest single lever.
- **Model routing:** Sonnet 4.6 default; Haiku 4.5 as a cheaper mode (~3× cheaper). Target **~$0.03–0.05 per deck** text-only on Sonnet, cached.
- **No image generation in v1** — CSS/type slides only. Keeps runs effectively free; matches the public "anyone can explore" posture.
- **M3 images are on-demand + blended** (cheap backdrops + one premium hero), target ~$0.25/deck.
- Server-side per-generation token + cost logging so the grant can be budgeted against real numbers.

---

## 9. Guardrails (hold across every Claude Code session)

- **Restraint is load-bearing, not stylistic.** A foresight tool's failure mode is looking more authoritative than its content earns. The frontend skill's instinct is to make things impressive — resist wherever "impressive" would imply verified authority. The Swiss discipline serves credibility; the honesty layer (§5) is content, never chrome to be prettified away.
- **No client-side API key.** Non-negotiable.
- **No auto image generation** in v1. **No video, ever, in the live tool.**
- **No claim of verified accuracy.** Honesty frame mandatory.
- **No accounts / persistence** in v1 beyond URL-encoded state.
- **Don't blend design lanes** — Swiss only.
- **Prompts are verbatim** (§4). Edits bump `promptVersion`.

---

## 10. Milestones (build in order; each has acceptance criteria)

### M0 — Core loop (ship first)
Scaffold; picker (sector grid from §11 + "Other" free-text); server-side two-call pipeline with zod validation + one retry; `Deck` model; React deck viewer with keyboard nav.
**Acceptance:** Pick any listed sector or type a custom one → live 8-slide deck renders. API key absent from client bundle (verify). Bad model output retries once then shows a graceful error. Reduced-motion respected.

### M1 — Export, honesty layer, polish
PPTX (native **editable text**, not flattened images — one builder per slide type) + PDF (WYSIWYG via html2canvas+jsPDF, `await document.fonts.ready`), both from the shared `Deck`. Finalized Swiss system. Honesty frame + assumptions foregrounding + provenance tags (all `projection`). Staged generation UX, error/empty states, mobile composition, full a11y pass. Sample-fallback deck (§12) for demos.
**Acceptance:** Both exports correct and on-brand; PPTX text is editable. WCAG 2.2 AA passes. Honesty frame present in viewer + both exports. Works at mobile/tablet/desktop.

### M2 — Grounded mode (retrieval)
Wire the Anthropic **`web_search` tool** into the analysis call behind a mode toggle (`provocation` | `grounded`). Capture sources; tag grounded claims `documented` with source URLs; add a sources slide + inline citations flowing into PPTX/PDF. URL-encode the mode.
**Acceptance:** Grounded run carries real clickable sources; claims correctly tiered; provocation mode unchanged; cost delta logged.

### M3 — Images & sharing (next, optional)
Blended image generation (cheap backdrops + one premium hero in the Caravaggesque register), **on-demand** (on "render this future", not every run). Hosted shareable deck via short code. Per-run cost telemetry surfaced.
**Acceptance:** Hero image generates on demand; per-deck image spend ~$0.25 target; shared link reopens the exact deck.

---

## 11. Sector picker list (curated + "Other")

Grid of 16, plus an "Other…" tile that reveals a free-text input (placeholder: *"Describe your organization — e.g. 'regional water utility', 'independent bookshop chain', 'maritime insurer'…"*):

Banking & Credit Unions · Healthcare & Hospitals · Pharma & Biotech · Government & Public Sector · Education & Universities · Energy & Utilities · Logistics & Supply Chain · Manufacturing · Insurance · Legal Services · Retail & E-commerce · Telecommunications · Media & Publishing · Agriculture & Food · Defense & Aerospace · Professional Services

Generate button disabled until a sector is chosen or ≥2 chars of custom text entered.

---

## 12. Sample fallback deck (demo safety net — ship as a JSON fixture)

If generation fails in front of an audience, load this instead of dead-ending. It's also a reference for what "good, deflated, specific" output reads like.

```json
{
  "analysis": {
    "sector_display": "Regional Credit Union",
    "one_liner": "The real near-term threat isn't a quantum codebreaker — it's AI-native fintechs underwriting a loan in the time it takes you to open a case file.",
    "signal": {
      "hype": "Quantum computers will break your encryption and revolutionize member banking overnight.",
      "substance": "Quantum's only concrete near-term issue for you is cryptographic migration; the actual disruption is advanced AI in fraud, underwriting, and service — where nimble fintechs already outpace incumbents.",
      "quantum_verdict": "narrow",
      "quantum_note": "Real risk is 'harvest now, decrypt later' data theft, not an imminent live break of today's traffic.",
      "ai_note": "Fraud detection, member-service automation, and 90-second AI underwriting are reshaping competitiveness right now."
    },
    "horizons": {
      "near": "Post-quantum migration becomes a board-level compliance item; AI fraud tools and chat-based member service move from pilot to expected baseline.",
      "mid": "AI-native lenders compress underwriting to near-instant; regulators formalize PQC mandates; differentiation shifts to trust and local relationship.",
      "far": "Cryptographically-relevant quantum machines plausibly arrive; institutions that didn't migrate early face exposure on long-lived data."
    },
    "vectors": [
      { "area": "Cryptographic Risk", "note": "'Harvest now, decrypt later' puts today's long-lived member data at future risk.", "severity": "medium" },
      { "area": "Underwriting", "note": "AI-native fintechs approve in seconds; manual review becomes a competitive liability.", "severity": "high" },
      { "area": "Fraud & AML", "note": "AI both powers new synthetic-identity attacks and the best defenses against them.", "severity": "high" },
      { "area": "Workforce", "note": "Routine member-service and back-office roles shift toward oversight of AI systems.", "severity": "medium" },
      { "area": "Regulation", "note": "Post-quantum crypto standards move from guidance toward mandate on an uncertain clock.", "severity": "low" }
    ]
  },
  "facilitation": {
    "considerations": [
      "Who owns the post-quantum migration timeline and budget?",
      "Whether to build, buy, or partner for AI underwriting",
      "How to defend relationship-banking as the durable moat",
      "What member data must be re-encrypted first"
    ],
    "discussion": [
      "If a fintech underwrites a comparable loan in 90 seconds, what is our honest answer to a member who asks why we take three days?",
      "Which of our services would a member genuinely miss if an AI-native competitor replaced us tomorrow?",
      "Who in this room could name the systems still relying on encryption we plan to retire?",
      "What would it take for us to treat 'harvest now, decrypt later' as a real risk rather than a headline?",
      "Where should AI never touch a member decision, no matter how good it gets?"
    ],
    "assumptions": [
      { "claim": "AI underwriting becomes table-stakes by 2028.", "condition": "regulators permit model-driven credit decisions at consumer scale." },
      { "claim": "Post-quantum migration is urgent now.", "condition": "your data must stay confidential for 7+ years — which for financial records, it must." },
      { "claim": "Relationship banking remains a moat.", "condition": "members keep valuing human trust over pure speed and price." }
    ],
    "monday": [
      "Inventory every system and dataset that depends on soon-to-be-legacy encryption.",
      "Run one honest pilot benchmarking your underwriting speed against an AI-native competitor.",
      "Assign a named owner for post-quantum readiness before it becomes an examiner's question."
    ]
  }
}
```

---

## 13. First deliverable

**M0 as a running Vercel preview:** picker → live deck, server-side generation, no client-exposed key. Then layer M1 (exports + honesty), M2 (grounding), M3 (images + sharing). This brief is self-contained — no prototype file needed.
