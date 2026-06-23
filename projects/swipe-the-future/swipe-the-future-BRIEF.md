# Build Brief — *Swipe the Future: Calibration*

**For:** Claude Code · **Target:** Futures Atlas (Next.js / Vercel, `futures-atlas-02`)
**Route:** `/swipe-the-future` (or `/calibration`)
**Reference build:** `swipe-the-future.html` (working single-file prototype — match its feel, mechanic, and content; rebuild it properly on the stack)

---

## 0. What this is

The first entry in a "Swipe the Future" family. **Calibration mode:** the visitor picks a job/industry lens, swipes Believe/Doubt on six grounded claims about how AI and quantum reshape that field, then sees a calibration result — how far their gut sat from where the evidence actually lands.

**The rule (atlas-wide):** imagine freely, cite everything. Every card carries a real source. Nothing is invented where it claims to be real.

**Design thesis to preserve:** the reveal is not "right/wrong." Each card flips to an *evidence meter* (Unlikely → Already real) showing the evidence position **and** the visitor's swipe as two markers. The **gap between them is the product.** Don't lose this.

---

## Phase 1 — Scaffold & data layer

**Goal:** content lives as data, not in components. Everything downstream reads from it.

- Add the route as a self-contained module under the existing app structure. Match how current atlas entries (e.g. `hollow-villages`, `odds-of-surviving-ai`) are organised — follow the repo's existing convention rather than introducing a new one.
- Define types:
  ```ts
  type Verdict = "unlikely" | "contested" | "likely" | "already";
  interface Card {
    id: string;
    claim: string;
    verdict: Verdict;
    note: string;        // grounded reveal, ≤ ~30 words
    source: { label: string; url?: string };  // url optional but preferred
  }
  interface Role {
    id: string;
    name: string;
    blurb: string;
    cards: Card[];       // exactly 6 for v1
  }
  ```
- Port all 5 roles × 6 cards verbatim from the prototype's `ROLES` array into a typed data file (`data/roles.ts` or JSON + loader). **Do not paraphrase the cards** — the wording is already source-checked.
- **Upgrade each source to include a real `url`** (the prototype only has labels). Use the source list in §Appendix and resolve to primary links (NIST, Nature/arXiv, Google Quantum AI, IEA, Goldman Sachs, Bloomberg Law, Gallup, etc.). Every card's reveal should be able to link out.
- Verdict constants (positions on the meter, labels, colours) live in one config object, imported everywhere.

**Acceptance:** roles render from data; adding a 6th role or a 7th card requires only a data edit, no component change.

---

## Phase 2 — Visual system

**Goal:** lock the identity before behaviour. Match the prototype, cleaned up.

- **Palette** (aged-pigment, deliberately *not* cream/terracotta default): deep petrol base `#0E1B19`, raised panel `#152724`, paper card `#F1EBDE`, ink `#1B1610`. Signals: verdigris `#2F8F7F` (likely/believe), oxblood `#A23E2C` (unlikely/doubt), brass `#C9A227` (already-real), slate `#7C8B86` (contested). Tokenise as CSS vars / Tailwind theme extension — whichever the repo already uses.
- **Type:** Instrument Serif (display — the human *claims*), Hanken Grotesk (UI/body), Space Mono (verdicts, sources, counters, score — the machine *measurements*). Self-host or use `next/font`. The serif/mono split is semantic — keep it.
- **Signature element:** the evidence meter. Horizontal track, animated fill to the verdict position, a solid "evidence" marker and a hollow "your call" marker, end labels Unlikely / Already real, a two-item legend.
- Quality floor: responsive to 360px, visible keyboard focus, `prefers-reduced-motion` respected (prototype already gates transitions on it — preserve).

**Acceptance:** a static screenshot of one card front + one reveal is indistinguishable in feel from the prototype.

---

## Phase 3 — Interaction model

**Goal:** the swipe loop, robust across input modes.

- Three states: **Intro/role-select → Deck → Result.** Keep them as in-page views (no full nav) so the loop stays fast.
- **Deck:** a stack of up to 3 cards (current + 2 behind, scaled/offset). Active card supports:
  - **Pointer drag** with rotation; commit past a ~95px threshold; snap back otherwise. Use Pointer Events (works mouse + touch). Mind `touch-action: pan-y`.
  - **Buttons** Doubt / Believe.
  - **Keyboard** ← Doubt, → Believe; in reveal state, → / Enter / Space advances.
- **Reveal:** on commit, the card flings off, then a verdict face animates in: meter fills, both markers slide to position, an alignment tick line, the grounded note, the linked source. Then a Next button.
- **Contested cards never count against the visitor** — the tick reads "Judgment call — the evidence is genuinely split." This is load-bearing for honesty; keep it.
- Progress bar + `NN / 06` counter advance on reveal.

**Edge cases to handle (prototype is loose here):**
- Global pointer listeners must be cleaned up per card mount/unmount (React effect cleanup) — no leaks across cards.
- Guard against double-commit (drag + key) with a `locked` flag per card.
- Re-entrancy: replaying or switching roles fully resets state.

**Acceptance:** full deck completable by drag only, by buttons only, and by keyboard only, on mobile and desktop, with no stuck/duplicated cards.

---

## Phase 4 — Scoring & result

**Goal:** honest calibration, shareable payoff.

- **Alignment:** `contested` → always fair. `unlikely` → aligned if Doubt. `likely`/`already` → aligned if Believe.
- **Score:** `matched / total`, where `total` **excludes contested** cards. Show the number prominently.
- **Profiles** (port logic from prototype's `profileFor`): *Caught Flat-Footed* (≥2 "already real" doubted), *The Accelerationist* (≥2 "unlikely" believed), *Well Calibrated* (≥80%), *Roughly Tuned* (≥50%), *The Skeptic* (rest). Copy can be re-toned to taste — flag if you change it.
- **"Where you and the evidence parted ways":** list the cards the visitor most misjudged, badged *Already real* (doubted) vs *Ahead of evidence* (believed). This is the insight moment — keep it specific, claim by claim.

**Acceptance:** scores and profiles are deterministic from the answer set; contested cards never move the score.

---

## Phase 5 — Atlas integration & share

- Add the project card to the atlas index + `/projects` grid, matching the existing entry format (date, category — suggest *AI & risk* or a new *Calibration* tag — preview blurb, OG image).
- **Share card:** generate a result image (claim-light, score + profile + lens + atlas wordmark) for the visitor to save/post. This is the growth surface — wire it to feed the **Social Composer** (reuse its export path rather than a parallel one). A static OG route (`@vercel/og` / satori) is the clean way.
- Per-card source links resolve out to primaries.
- Respect the atlas footer/voice ("Imagine freely · Cite everything · MMXXVI").

**Acceptance:** entry appears in the atlas like a native project; a completed run produces a shareable result image; Social Composer can ingest it.

---

## Explicitly out of scope for v1 (note for later, don't build)

- Crowd/expert comparison bars (the "You vs the crowd" mode) — needs a datastore + aggregation. Design the data layer so a `results` POST could be added later, but don't wire a backend now.
- Article "transmutate" importer (auto-decking any URL).
- Timeline mode (swipe *when* not *whether*).
- AI-generated cards via the in-artifact API. Keep content static and human-verified for v1; the typed `Card`/`source` shape leaves the door open.

---

## Guardrails

- **Don't dilute the sourcing.** If a claim can't keep a real, resolvable source, cut the card rather than soften it. The atlas's whole credibility rests on this.
- **Don't templatise the look** back toward generic AI defaults — the pigment palette and serif/mono split are the identity.
- **Keep it light.** Short attention span is the brief: one screen, one verb, fast payoff. Resist adding steps.
- Six cards per role is the v1 ceiling — depth comes from more *lenses*, not longer decks.

---

## Appendix — source anchors (for resolving URLs)

- **PQC standards:** NIST FIPS 203/204/205 finalized Aug 2024; migration deadlines (NSS 2030 / federal 2035, NIST IR 8547). → nist.gov
- **Quantum hardware:** Google *Willow* below-threshold result (Nature, 2024); ~1,500-qubit machines in 2026; ECDSA-256 break est. <500k physical qubits (Google Quantum AI, Mar 2026 paper, ~20× cut from 2019).
- **Bitcoin exposure:** ~25% of BTC (~4M coins) in addresses with exposed public keys (Deloitte on-chain study); migration ~76 days dedicated blockspace (Univ. of Kent, 2024); Drake ~10%+ by 2032.
- **AI forecast:** AI 2027 (AI Futures Project, Apr 2025), race/slowdown branches, timeline since revised toward early 2030s.
- **Designer:** Goldman ~26% of design tasks automatable; WEF 2025 fastest-declining; Adobe Firefly 22B+ assets; Gallup/J. Cultural Economics — no broad wage decline yet; freelance postings ~‑21%; CVL Economics 200k+ entertainment jobs.
- **Lawyer:** 280+ hallucinated-citation filings since 2023, ~7× rise in 2025 (Bloomberg Law); ~800 cases / 25+ jurisdictions (AI Hallucination Cases DB); sanctions $1k–$30k+; AI not inventor/author (2025–26 rulings).
- **Energy:** Goldman ~165% data-center demand growth by 2030; IEA ~945 TWh (≈doubling); ~$720B grid spend; PJM load nearing all new generation (BloombergNEF 2025).
