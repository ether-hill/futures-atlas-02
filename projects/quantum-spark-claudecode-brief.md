# Quantum Spark — Claude Code Build Brief

**Project:** Quantum Spark (Frond Studio)
**Type:** Public web app — single-screen inspirational quantum/AI insight generator
**Relationship:** Companion to Signal Reactor. Spark *ignites* (awareness, energy); Signal Reactor *grounds* (substance-first briefings). Same foresight practice, opposite posture. Can ship standalone or later share an app shell with a mode toggle.
**Status:** Loop validated in a throwaway prototype. This brief is the **single source of truth** — prompt, schema, design tokens, sample, guardrails all embedded. No other file needed.

---

## 1. What we're building

One screen. A person types their industry or business; in seconds they get **five bold, grounded, forward-looking insights** into how quantum computing + next-wave AI will transform it. The purpose is inspiration and awareness — the kind of insight that makes a room lean forward.

**Posture:** energizing and visionary, but **grounded in real quantum/AI capability** (optimization, molecular/materials simulation, quantum machine learning, cryptography/QKD, sensing, drug & materials discovery). Inspiring, never fabricated. This is "grounded hype," and the honesty note (§9) is what keeps it defensible alongside the studio's accountability work.

---

## 2. Stack & conventions

- **Next.js 15** (App Router), **TypeScript**, **Vercel** auto-deploy from `main`.
- **Claude API server-side only** — Route Handler (`app/api/spark/route.ts`), key in `ANTHROPIC_API_KEY`. **Never ship the key to the browser.** (The prototype called the API client-side; that only works inside a Claude.ai artifact sandbox.)
- Use official **`@anthropic-ai/sdk`** server-side.
- **`zod`** validation on the model response before it touches the UI.
- Model via config. Default `claude-sonnet-4-6`; allow `claude-haiku-4-5-20251001` as a cheaper option (this tool is a great Haiku candidate — short, punchy output).
- **URL-serialized state** for the queried business, e.g. `/?b=logistics`, so a result is linkable.
- Design via the **frontend-design skill**, committed to the **Cosmic/Energized lane** (§6).
- Accessibility floor **WCAG 2.2 AA** — keyboard, `focus-visible`, contrast, `prefers-reduced-motion` (cards appear without animation under reduced motion).

---

## 3. Architecture

### Route
- `/` — hero (input + example chips) → loading → results (5 cards + actions).
- `app/api/spark/route.ts` — one Claude call, validate, return insight JSON.

### Pipeline (server-side, ONE call)
System prompt = `SYS_SPARK` (§4). Input: the business string. Output: insight JSON (§5). Fits comfortably in ~1000 output tokens.

**Robustness:** strip code fences + extract outer `{…}`; **zod-validate**; on failure retry once with a corrective note, then return a typed error the client renders as the sample fallback (§11). Enable **prompt caching** on the system prompt (static across runs).

---

## 4. System prompt (embed verbatim — do NOT paraphrase)

Put in `lib/prompts.ts` as a versioned constant. Any edit bumps a version string logged with each generation.

### `SYS_SPARK`
```
You are Quantum Spark — an inspirational foresight engine. Given a business or industry, generate FIVE bold, exciting, forward-looking insights into how QUANTUM COMPUTING and next-wave AI will transform it over the next 10-15 years.

Tone: energizing, visionary, confident — the kind of insight that makes a room lean forward. But stay GROUNDED in real quantum/AI capability (optimization, simulation of molecules & materials, quantum machine learning, cryptography, sensing, logistics/routing, drug & materials discovery). Inspiring, not fabricated. Be specific to THIS business — no generic "AI will change everything" filler. Each insight should feel like a door opening.

Return ONLY valid JSON, no markdown, no preamble:
{
 "business_display":"clean Title Case name of the business/industry",
 "insights":[
   {"tag":"2-3 word theme label","headline":"a punchy, vivid headline (max ~9 words)","insight":"1-2 electric sentences making it concrete and exciting"}
 ]
}
Exactly 5 insights, each with a distinct theme.
```

---

## 5. Data model

Define in `lib/types.ts`; validate with a matching zod schema.

```ts
interface Insight {
  tag: string;        // 2-3 word theme label
  headline: string;   // punchy, <= ~9 words
  insight: string;    // 1-2 electric sentences
}
interface SparkResult {
  business_display: string;
  insights: Insight[];   // exactly 5 (clamp defensively)
  generatedAt: string;
  promptVersion: string;
}
```

---

## 6. Design system (Cosmic / Energized lane)

Deliberately different from Signal Reactor's austere Swiss. This one glows.

- **Type:** Sora (300–800). Display weights 700–800, tight tracking (−0.03em). `font-display: swap`.
- **Background:** near-black `#07080f` layered with soft radial glows — violet top-left, cyan top-right, magenta bottom. Subtle starfield overlay at low opacity.
- **Color tokens:**
  - `--bg:#07080f` · `--fg:#f2f3fb` · `--muted:#a6a9c4` · `--subtle:#6b6f8f`
  - `--card:rgba(255,255,255,.035)` · `--card-border:rgba(255,255,255,.09)`
  - Spectrum: violet `#7c5cff` · cyan `#22d3ee` · magenta `#e05cff`
  - **Signature gradient:** `linear-gradient(100deg,#e05cff,#7c5cff 45%,#22d3ee)` — used on the numerals, key headline words, and primary buttons.
- **Cards:** glass (translucent fill + hairline border), rounded ~18px, a 3px gradient spine on the left edge, big gradient numeral 01–05, a cyan pill theme tag, bold headline, muted body.
- **Motion:** staggered card rise (~90ms apart), floating/hue-shifting loading orb, smooth scroll to top on result. Full reduced-motion fallback (cards static, no orb spin).
- Energized and premium — should feel like a keynote reveal, never cheesy or clip-arty.

---

## 7. UX / interactions

- **Hero:** eyebrow, big gradient headline, one-line sub, input field + primary button ("Spark 5 insights ✦"), example chips (Logistics, Healthcare, Finance, A coffee brand, Renewable energy, A law firm, Agriculture, Fashion retail). Tapping a chip fills + fires immediately. Enter key submits. Button disabled under 2 chars.
- **Loading:** glowing orb + rotating messages ("Tuning into the quantum future…", "Collapsing the possibilities…", "Entangling ideas…", "Amplifying the best signals…").
- **Results:** heading "How quantum reshapes **{business}**" + 5 staggered cards. Actions: **Spark 5 more** (regenerate — each run differs, ideal for live audiences), **Copy all** (clean formatted text block for pasting into decks/email), **New business** (reset).
- **Fallback:** on API failure, render the sample set (§11) + a quiet toast; never dead-end.

---

## 8. Cost

- **Prompt-cache the system prompt.** Target **~$0.01–0.03 per spark** (short output). Strong **Haiku 4.5** candidate for near-free high-volume use.
- **No image generation** — pure type/gradient. Runs effectively free; right for a public toy.
- Server-side token/cost logging for grant budgeting.

---

## 9. Guardrails (hold across every session)

- **Grounded hype, not fiction.** Excitement is the goal; fabrication is not. The prompt anchors every insight in real quantum/AI capability — keep it that way.
- **Honesty note stays.** One restrained line near results: *"Forward-looking, inspirational scenarios grounded in real quantum and AI capabilities — provocations to spark imagination and conversation, not forecasts or investment advice."* One line, not a lecture; do not delete it, do not inflate it into a wall of caveats.
- **No client-side API key.** Non-negotiable.
- **No accounts/persistence** beyond URL state.
- **Don't blend lanes** — Cosmic here, Swiss stays in Signal Reactor.
- **Prompt is verbatim** (§4); edits bump `promptVersion`.

---

## 10. Milestones

### M0 — Core loop (ship first)
Scaffold; hero with input + chips; server-side single-call pipeline with zod + one retry; results with 5 staggered cards; loading state; sample fallback.
**Acceptance:** Type or tap a business → 5 grounded insight cards render. Key absent from client bundle (verify). Bad output retries once then falls back to sample. Reduced-motion respected.

### M1 — Polish & share
Finalized Cosmic design system; Copy-all + Spark-more + reset; URL-encoded business; honesty note; mobile composition; full a11y pass; per-generation cost logging.
**Acceptance:** Copy-all yields clean pasteable text; regenerate produces a fresh distinct set; WCAG 2.2 AA passes; works mobile/tablet/desktop; honesty note present.

### M2 — Optional
Shared app shell with Signal Reactor + a mode toggle (Ignite ↔ Ground); optional one-tap "turn these 5 into a full Signal Reactor briefing" handoff.

---

## 11. Sample fallback (ship as JSON fixture)

Demo safety net + a reference for what "grounded hype" reads like.

```json
{
  "business_display": "Logistics",
  "insights": [
    { "tag": "Route Optimization", "headline": "Every delivery route, solved at once", "insight": "Quantum optimization can weigh millions of routing permutations simultaneously — turning fleet planning from an educated guess into a near-perfect answer that cuts fuel, time, and emissions in a single sweep." },
    { "tag": "Live Rerouting", "headline": "A supply chain that reroutes itself", "insight": "Pair quantum solvers with real-time AI and your network becomes self-healing — sensing a port delay or storm and rebalancing thousands of shipments before a human even sees the alert." },
    { "tag": "Materials", "headline": "Packaging invented atom by atom", "insight": "Quantum simulation of molecules lets chemists design lighter, stronger, fully recyclable materials from first principles — reinventing the box before it's ever manufactured." },
    { "tag": "Security", "headline": "Unbreakable trust across the network", "insight": "Quantum key distribution promises cargo and customs data that is physically impossible to intercept unnoticed — a new gold standard of trust for global trade." },
    { "tag": "Demand Sensing", "headline": "Stock that arrives before the order", "insight": "Quantum-enhanced machine learning finds demand patterns classical models miss, so inventory flows toward need in near real time — emptier warehouses, fuller shelves." }
  ]
}
```

---

## 12. First deliverable

**M0 as a running Vercel preview:** hero → live 5 insights, server-side generation, no client-exposed key. Then M1 polish. This brief is self-contained.
